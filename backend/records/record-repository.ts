import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import type { AuthSession } from "@/backend/auth/types";
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
