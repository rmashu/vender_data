import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import type { AuthSession } from "@/backend/auth/types";
import type { Ledger } from "@/backend/ledger";
import type { ReportRow } from "@/backend/reports/report-repository";

export type RecordsResult = {
  rows: ReportRow[];
  summary: {
    batches: number;
    rows: number;
    pendingBalance: number;
    todayUploads: number;
  };
};

export type LedgerBatchDetail = {
  batch: string;
  createdAt: string;
  dateFrom: string;
  dateTo: string;
  ledgers: Ledger[];
  store: string;
  vendor: string;
};

export type LedgerEntryUpdate = Pick<Ledger, "credit" | "debit" | "invoice_date" | "invoice_no" | "pending_balance" | "status" | "vch_type">;

type RecordFilters = {
  query?: string;
  store?: string;
};

export async function listRecords(filters: RecordFilters, session: AuthSession): Promise<RecordsResult> {
  if (!isMongoConfigured()) {
    return emptyRecords();
  }

  const db = await getMongoDb();
  const match = {
    ...getStoreMatch(session),
    ...(filters.store ? { store_name: filters.store } : {}),
    ...(filters.query
      ? {
          $or: [
            { batch_number: { $regex: filters.query, $options: "i" } },
            { vendor_name: { $regex: filters.query, $options: "i" } },
            { store_name: { $regex: filters.query, $options: "i" } },
          ],
        }
      : {}),
  };

  const rows = await db
    .collection("vendor_ledgers")
    .aggregate<ReportRow>([
      { $match: match },
      {
        $project: {
          _id: 0,
          batch: "$batch_number",
          createdAt: "$created_at",
          dateFrom: "$date_from",
          dateTo: "$date_to",
          rows: { $size: "$ledgers" },
          store: "$store_name",
          vendor: "$vendor_name",
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
    ])
    .toArray();

  return {
    rows,
    summary: {
      batches: rows.length,
      pendingBalance: 0,
      rows: rows.reduce((total, row) => total + toNumber(row.rows), 0),
      todayUploads: rows.filter((row) => String(row.createdAt ?? "").startsWith(new Date().toISOString().slice(0, 10))).length,
    },
  };
}

export async function listMyBatches(session: AuthSession): Promise<RecordsResult> {
  if (!isMongoConfigured()) {
    return emptyRecords();
  }

  const db = await getMongoDb();
  const rows = await db
    .collection("vendor_ledgers")
    .aggregate<ReportRow>([
      { $match: { ...getStoreMatch(session), created_by: session.user.email } },
      {
        $project: {
          _id: 0,
          batch: "$batch_number",
          createdAt: "$created_at",
          rows: { $size: "$ledgers" },
          store: "$store_name",
          vendor: "$vendor_name",
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
    ])
    .toArray();

  return {
    rows,
    summary: {
      batches: rows.length,
      pendingBalance: 0,
      rows: rows.reduce((total, row) => total + toNumber(row.rows), 0),
      todayUploads: rows.filter((row) => String(row.createdAt ?? "").startsWith(new Date().toISOString().slice(0, 10))).length,
    },
  };
}

export async function getRecordDetail(batchNumber: string, session: AuthSession): Promise<LedgerBatchDetail | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  const record = await db.collection("vendor_ledgers").findOne<{
    batch_number: string;
    created_at: Date | string;
    date_from: string;
    date_to: string;
    ledgers: Ledger[];
    store_name: string;
    vendor_name: string;
  }>({ ...getStoreMatch(session), batch_number: batchNumber });

  if (!record) {
    return null;
  }

  return {
    batch: record.batch_number,
    createdAt: String(record.created_at),
    dateFrom: record.date_from,
    dateTo: record.date_to,
    ledgers: record.ledgers,
    store: record.store_name,
    vendor: record.vendor_name,
  };
}

export async function updateLedgerEntry(batchNumber: string, ledgerId: number, entry: LedgerEntryUpdate, session: AuthSession) {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  const db = await getMongoDb();
  const record = await db.collection("vendor_ledgers").findOne<{ ledgers: Ledger[]; store_name: string }>({
    ...getStoreMatch(session),
    batch_number: batchNumber,
  });

  if (!record) {
    return null;
  }

  if (!canAccessStore(session, record.store_name)) {
    return null;
  }

  const ledgers = record.ledgers.map((ledger) => (ledger.id === ledgerId ? { ...ledger, ...entry } : ledger));
  const result = await db.collection("vendor_ledgers").updateOne(
    { ...getStoreMatch(session), batch_number: batchNumber },
    {
      $set: {
        ledgers,
        updated_at: new Date(),
      },
    },
  );

  return result.matchedCount > 0;
}

export async function getDashboardKpis(session: AuthSession) {
  if (!isMongoConfigured()) {
    return emptyRecords().summary;
  }

  const db = await getMongoDb();
  const rows = await db
    .collection("vendor_ledgers")
    .aggregate<{ batches: number; pendingBalance: number; rows: number; todayUploads: number }>([
      { $match: getStoreMatch(session) },
      {
        $facet: {
          batches: [{ $count: "count" }],
          ledgerRows: [{ $unwind: "$ledgers" }, { $count: "count" }],
          pending: [{ $unwind: "$ledgers" }, { $group: { _id: null, total: { $sum: "$ledgers.pending_balance" } } }],
          today: [{ $match: { created_at: { $gte: new Date(new Date().toISOString().slice(0, 10)) } } }, { $count: "count" }],
        },
      },
      {
        $project: {
          batches: { $ifNull: [{ $arrayElemAt: ["$batches.count", 0] }, 0] },
          pendingBalance: { $ifNull: [{ $arrayElemAt: ["$pending.total", 0] }, 0] },
          rows: { $ifNull: [{ $arrayElemAt: ["$ledgerRows.count", 0] }, 0] },
          todayUploads: { $ifNull: [{ $arrayElemAt: ["$today.count", 0] }, 0] },
        },
      },
    ])
    .toArray();

  return rows[0] ?? emptyRecords().summary;
}

export function canAccessStore(session: AuthSession, storeName: string) {
  return session.user.roleCode === "ADMIN" || session.user.assignedStores.includes(storeName);
}

function getStoreMatch(session: AuthSession) {
  if (session.user.roleCode === "ADMIN") {
    return {};
  }

  return { store_name: { $in: session.user.assignedStores } };
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function emptyRecords(): RecordsResult {
  return { rows: [], summary: { batches: 0, pendingBalance: 0, rows: 0, todayUploads: 0 } };
}
