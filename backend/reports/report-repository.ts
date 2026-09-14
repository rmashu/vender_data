import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import type { AuthSession } from "@/backend/auth/types";

export type ReportType =
  | "Vendor Report"
  | "Store Report"
  | "Date Range Report"
  | "Pending Balance"
  | "Upload Batch"
  | "Credit Notes";

export type ReportRow = Record<string, number | string>;

export type ReportResult = {
  rows: ReportRow[];
  summary: {
    credit: number;
    debit: number;
    pendingBalance: number;
    rows: number;
  };
};

type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  reportType: ReportType;
  status?: string;
  store?: string;
  vendor?: string;
};

export async function generateReport(filters: ReportFilters, session: AuthSession): Promise<ReportResult> {
  if (!isMongoConfigured()) {
    return emptyReport();
  }

  const db = await getMongoDb();
  const storeMatch = {
    ...getStoreMatch(session),
    ...(filters.store ? { store_name: filters.store } : {}),
    ...(filters.vendor ? { vendor_name: filters.vendor } : {}),
  };
  const dateMatch = getDateMatch(filters.dateFrom, filters.dateTo);
  const statusMatch = filters.status ? { "ledgers.status": filters.status } : null;

  if (filters.reportType === "Upload Batch") {
    const rows = await db
      .collection("vendor_ledgers")
      .aggregate<ReportRow>([
        { $match: storeMatch },
        {
          $project: {
            _id: 0,
            batch: "$batch_number",
            createdBy: "$created_by",
            dateFrom: "$date_from",
            dateTo: "$date_to",
            rows: { $size: "$ledgers" },
            store: "$store_name",
            vendor: "$vendor_name",
          },
        },
        { $sort: { dateTo: -1 } },
        { $limit: 100 },
      ])
      .toArray();

    return { rows, summary: summarizeRows(rows) };
  }

  const pipeline = [
    { $match: storeMatch },
    { $unwind: "$ledgers" },
    ...(dateMatch ? [{ $match: dateMatch }] : []),
    ...(statusMatch ? [{ $match: statusMatch }] : []),
  ];

  const rows = await db
    .collection("vendor_ledgers")
    .aggregate<ReportRow>([...pipeline, ...getReportPipeline(filters.reportType)])
    .toArray();

  return { rows, summary: summarizeRows(rows) };
}

function getReportPipeline(reportType: ReportType) {
  if (reportType === "Vendor Report") {
    return [
      {
        $group: {
          _id: "$vendor_name",
          credit: { $sum: "$ledgers.credit" },
          debit: { $sum: "$ledgers.debit" },
          invoices: { $sum: 1 },
          pendingBalance: { $sum: "$ledgers.pending_balance" },
        },
      },
      { $project: { _id: 0, credit: 1, debit: 1, invoices: 1, pendingBalance: 1, vendor: "$_id" } },
      { $sort: { pendingBalance: -1 } },
      { $limit: 100 },
    ];
  }

  if (reportType === "Store Report") {
    return [
      {
        $group: {
          _id: "$store_name",
          credit: { $sum: "$ledgers.credit" },
          debit: { $sum: "$ledgers.debit" },
          invoices: { $sum: 1 },
          pendingBalance: { $sum: "$ledgers.pending_balance" },
        },
      },
      { $project: { _id: 0, credit: 1, debit: 1, invoices: 1, pendingBalance: 1, store: "$_id" } },
      { $sort: { pendingBalance: -1 } },
      { $limit: 100 },
    ];
  }

  if (reportType === "Pending Balance") {
    return [
      { $match: { "ledgers.pending_balance": { $gt: 0 } } },
      {
        $project: {
          _id: 0,
          credit: "$ledgers.credit",
          debit: "$ledgers.debit",
          invoiceDate: "$ledgers.invoice_date",
          invoiceNo: "$ledgers.invoice_no",
          pendingBalance: "$ledgers.pending_balance",
          store: "$store_name",
          vendor: "$vendor_name",
        },
      },
      { $sort: { pendingBalance: -1 } },
      { $limit: 100 },
    ];
  }

  if (reportType === "Credit Notes") {
    return [
      { $match: { $or: [{ "ledgers.vch_type": /credit/i }, { "ledgers.credit": { $gt: 0 } }] } },
      {
        $project: {
          _id: 0,
          credit: "$ledgers.credit",
          invoiceDate: "$ledgers.invoice_date",
          invoiceNo: "$ledgers.invoice_no",
          pendingBalance: "$ledgers.pending_balance",
          store: "$store_name",
          vendor: "$vendor_name",
          vchType: "$ledgers.vch_type",
        },
      },
      { $sort: { invoiceDate: -1 } },
      { $limit: 100 },
    ];
  }

  return [
    {
      $project: {
        _id: 0,
        credit: "$ledgers.credit",
        debit: "$ledgers.debit",
        invoiceDate: "$ledgers.invoice_date",
        invoiceNo: "$ledgers.invoice_no",
        pendingBalance: "$ledgers.pending_balance",
        store: "$store_name",
        vendor: "$vendor_name",
        vchType: "$ledgers.vch_type",
      },
    },
    { $sort: { invoiceDate: -1 } },
    { $limit: 100 },
  ];
}

function getStoreMatch(session: AuthSession) {
  if (session.user.roleCode === "ADMIN") {
    return {};
  }

  return { store_name: { $in: session.user.assignedStores } };
}

function getDateMatch(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) {
    return null;
  }

  return {
    "ledgers.invoice_date": {
      ...(dateFrom ? { $gte: dateFrom } : {}),
      ...(dateTo ? { $lte: dateTo } : {}),
    },
  };
}

function summarizeRows(rows: ReportRow[]): ReportResult["summary"] {
  return rows.reduce<ReportResult["summary"]>(
    (summary, row) => ({
      credit: summary.credit + toNumber(row.credit),
      debit: summary.debit + toNumber(row.debit),
      pendingBalance: summary.pendingBalance + toNumber(row.pendingBalance),
      rows: summary.rows + toNumber(row.rows || 1),
    }),
    { credit: 0, debit: 0, pendingBalance: 0, rows: 0 },
  );
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function emptyReport(): ReportResult {
  return {
    rows: [],
    summary: { credit: 0, debit: 0, pendingBalance: 0, rows: 0 },
  };
}
