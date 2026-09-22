import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";

export type VendorLedgerFilters = {
  fy?: string;
  gst?: string;
  store?: string;
  supplier?: string;
};

export async function listVendorLedgers(
  filters: VendorLedgerFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination.limit ?? 50));
  const skip = (page - 1) * limit;

  if (!isMongoConfigured()) {
    return { limit, page, rows: [], total: 0 };
  }

  const batchMatch = {
    ...(filters.store ? { store_name: filters.store.trim().toUpperCase() } : {}),
    ...(filters.supplier ? { vendor_name: filters.supplier.trim() } : {}),
  };
  const fyMatch = getFyDateMatch(filters.fy);

  const db = await getMongoDb();
  const collection = db.collection("vendor_ledgers");
  const totalResult = await collection
    .aggregate<{ total: number }>([
      { $match: batchMatch },
      { $unwind: "$ledgers" },
      ...(fyMatch ? [{ $match: fyMatch }] : []),
      { $count: "total" },
    ])
    .toArray();
  const total = totalResult[0]?.total ?? 0;
  const rows = await collection
    .aggregate([
      { $match: batchMatch },
      { $unwind: "$ledgers" },
      ...(fyMatch ? [{ $match: fyMatch }] : []),
      { $sort: { "ledgers.invoice_date": 1, created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          batch_number: 1,
          created_at: 1,
          created_by: 1,
          date_from: 1,
          store_name: 1,
          vendor_name: 1,
          ledger: "$ledgers",
        },
      },
    ])
    .toArray();

  return {
    limit,
    page,
    total,
    rows: rows.map((row) => ({
      id: `${String(row._id)}-${row.ledger?.id ?? row.ledger?.invoice_no ?? ""}`,
      batch: row.batch_number ?? "",
      created_at: row.created_at ?? "",
      closing_balance: row.ledger?.closing_balance ?? row.ledger?.pending_balance ?? 0,
      credit: row.ledger?.credit ?? 0,
      debit: row.ledger?.debit ?? 0,
      fy: filters.fy ?? getFyFromDate(row.ledger?.invoice_date),
      gst_no: filters.gst ?? "",
      invoice_date: row.ledger?.invoice_date ?? "",
      invoice_no: row.ledger?.invoice_no ?? "",
      opening_balance: row.ledger?.opening_balance ?? 0,
      status: row.ledger?.status ?? "",
      store_name: row.store_name ?? "",
      supplier: row.vendor_name ?? "",
      uploaded_by: row.created_by ?? "",
      vch_type: row.ledger?.vch_type ?? "",
    })),
  };
}

function getFyDateMatch(fy?: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(fy ?? "");

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = startYear + 1;

  return {
    "ledgers.invoice_date": {
      $gte: `${startYear}-04-01`,
      $lte: `${endYear}-03-31`,
    },
  };
}

function getFyFromDate(value?: string) {
  if (!value) {
    return "";
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));

  if (!year || !month) {
    return "";
  }

  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}
