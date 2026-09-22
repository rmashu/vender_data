import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import type { LedgerPayload } from "@/backend/ledger";

export type LedgerTrackerRecord = {
  _id?: unknown;
  created_at?: Date | string;
  created_by?: string;
  first_bill_date: string;
  fy: string;
  gst_no: string;
  ledger_matched_till: string;
  ledger_received_till: string;
  pending_from: string;
  pending_to: string;
  remarks: string;
  status: "MATCHED" | "MISMATCH" | "PENDING";
  store_name: string;
  supplier: string;
  updated_at?: Date | string;
};

export type LedgerTrackerInput = Pick<
  LedgerTrackerRecord,
  | "first_bill_date"
  | "fy"
  | "gst_no"
  | "ledger_matched_till"
  | "ledger_received_till"
  | "pending_from"
  | "pending_to"
  | "remarks"
  | "status"
  | "store_name"
  | "supplier"
>;

type LedgerTrackerFilters = {
  fy?: string;
  status?: LedgerTrackerRecord["status"] | "ALL";
  store?: string;
  supplier?: string;
};

export async function listLedgerTrackers(filters: LedgerTrackerFilters = {}) {
  if (!isMongoConfigured()) {
    return { rows: [] };
  }

  const db = await getMongoDb();
  const match = {
    ...(filters.fy && filters.fy !== "ALL" ? { fy: filters.fy } : {}),
    ...(filters.store && filters.store !== "ALL"
      ? { store_name: filters.store.trim().toUpperCase() }
      : {}),
    ...(filters.supplier && filters.supplier !== "ALL"
      ? { supplier: filters.supplier.trim() }
      : {}),
    ...(filters.status && filters.status !== "ALL"
      ? { status: filters.status }
      : {}),
  };
  const rows = await db
    .collection<LedgerTrackerRecord>("ledger_tracker")
    .find(match)
    .sort({ fy: -1, store_name: 1, supplier: 1, updated_at: -1 })
    .limit(100)
    .toArray();

  return {
    rows: rows.map((row) => ({
      id: String(row._id ?? `${row.fy}-${row.store_name}-${row.supplier}`),
      first_bill_date: row.first_bill_date ?? "",
      fy: row.fy,
      gst_no: row.gst_no,
      ledger_matched_till: row.ledger_matched_till ?? "",
      ledger_received_till: row.ledger_received_till ?? "",
      pending_from: row.pending_from ?? "",
      pending_to: row.pending_to ?? "",
      remarks: row.remarks ?? "",
      status: row.status ?? "PENDING",
      store_name: row.store_name,
      supplier: row.supplier,
    })),
  };
}

export async function saveLedgerTracker(input: LedgerTrackerInput, createdBy: string) {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  const db = await getMongoDb();
  const now = new Date();
  await db.collection("ledger_tracker").updateOne(
    {
      fy: input.fy,
      store_name: input.store_name,
      supplier: input.supplier,
    },
    {
      $set: {
        ...input,
        updated_at: now,
      },
      $setOnInsert: {
        created_at: now,
        created_by: createdBy,
      },
    },
    { upsert: true },
  );
}

export async function syncLedgerTrackerFromBatch(payload: LedgerPayload, createdBy: string) {
  if (!isMongoConfigured()) {
    return;
  }

  const datedRows = payload.ledgers
    .map((row) => ({ ...row, invoice_date: normalizeLedgerDate(row.invoice_date) }))
    .filter((row) => row.invoice_date)
    .sort((first, second) => first.invoice_date.localeCompare(second.invoice_date));

  const firstLedgerDate = datedRows[0]?.invoice_date ?? normalizeLedgerDate(payload.date_from);
  const ledgerReceivedTill =
    datedRows[datedRows.length - 1]?.invoice_date ?? normalizeLedgerDate(payload.date_to);

  if (!firstLedgerDate || !ledgerReceivedTill) {
    return;
  }

  const matchedRow = [...datedRows]
    .reverse()
    .find((row) => Number(row.pending_balance) === 0);
  const ledgerMatchedTill = matchedRow?.invoice_date ?? "";
  const pendingFrom = ledgerMatchedTill
    ? getNextDate(ledgerMatchedTill)
    : firstLedgerDate;
  const pendingTo = getCurrentDate();
  const fy = getFyFromDate(firstLedgerDate);
  const master = await findPurchaseMaster({
    fy,
    storeName: payload.store_name,
    supplier: payload.vendor_name,
  });

  await saveLedgerTracker(
    {
      first_bill_date: master?.first_bill_date ?? firstLedgerDate,
      fy,
      gst_no: master?.gst_no ?? "",
      ledger_matched_till: ledgerMatchedTill,
      ledger_received_till: ledgerReceivedTill,
      pending_from: pendingFrom,
      pending_to: pendingTo,
      remarks: "Auto updated from vendor ledger upload",
      status: ledgerMatchedTill && ledgerMatchedTill >= pendingTo ? "MATCHED" : "PENDING",
      store_name: payload.store_name.trim().toUpperCase(),
      supplier: payload.vendor_name.trim(),
    },
    createdBy,
  );
}

async function findPurchaseMaster(input: {
  fy: string;
  storeName: string;
  supplier: string;
}) {
  const db = await getMongoDb();

  return db.collection<Pick<LedgerTrackerInput, "first_bill_date" | "gst_no">>(
    "purchase_master",
  ).findOne({
    fy: input.fy,
    store_name: input.storeName.trim().toUpperCase(),
    supplier: input.supplier.trim(),
  });
}

function getNextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

function getFyFromDate(value: string) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));

  if (!year || !month) {
    return "";
  }

  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

function normalizeLedgerDate(value: string) {
  const text = value.trim();

  if (!text) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashDate = text.match(/^(\d{1,2})[/-]([A-Za-z]{3}|\d{1,2})[/-](\d{2,4})$/);

  if (!slashDate) {
    return text;
  }

  const [, day, rawMonth, rawYear] = slashDate;
  const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);
  const month = monthToNumber(rawMonth);

  if (!year || !month) {
    return text;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function monthToNumber(value: string) {
  const monthNumber = Number(value);

  if (Number.isFinite(monthNumber)) {
    return monthNumber;
  }

  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(value.slice(0, 3).toLowerCase()) + 1;
}
