import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";

export type PurchaseMasterRecord = {
  _id?: unknown;
  created_at?: Date | string;
  created_by?: string;
  fy: string;
  gst_no: string;
  status: "ACTIVE" | "INACTIVE";
  store_name: string;
  supplier: string;
  first_bill_date: string;
  updated_at?: Date | string;
};

export type PurchaseMasterInput = Pick<PurchaseMasterRecord, "first_bill_date" | "fy" | "gst_no" | "status" | "store_name" | "supplier">;

type PurchaseMasterFilters = {
  firstBillFrom?: string;
  firstBillTo?: string;
  fy?: string[];
  gst?: string;
  status?: Array<PurchaseMasterRecord["status"]>;
  store_name?: string[];
  supplier?: string[];
};

export async function listPurchaseMaster(
  filters: PurchaseMasterFilters = {},
  pagination: { page?: number; limit?: number } = {},
) {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(1000, Math.max(1, pagination.limit ?? 100));
  const skip = (page - 1) * limit;

  if (!isMongoConfigured()) {
    return { limit, page, rows: [], total: 0 };
  }

  const db = await getMongoDb();
  const dateMatch =
    filters.firstBillFrom || filters.firstBillTo
      ? {
          first_bill_date: {
            ...(filters.firstBillFrom ? { $gte: filters.firstBillFrom } : {}),
            ...(filters.firstBillTo ? { $lte: filters.firstBillTo } : {}),
          },
        }
      : {};
  const match = {
    ...(filters.fy?.length ? { fy: { $in: filters.fy } } : {}),
    ...(filters.store_name?.length ? { store_name: { $in: filters.store_name } } : {}),
    ...(filters.supplier?.length ? { supplier: { $in: filters.supplier } } : {}),
    ...(filters.status?.length ? { status: { $in: filters.status } } : {}),
    ...(filters.gst ? { gst_no: { $options: "i", $regex: filters.gst } } : {}),
    ...dateMatch,
  };

  const collection = db.collection<PurchaseMasterRecord>("purchase_master");
  const total = await collection.countDocuments(match);
  const rows = await collection
    .find(match)
    .sort({ fy: -1, store_name: 1, supplier: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    limit,
    page,
    rows: rows.map((row) => ({
      id: String(row._id ?? `${row.fy}-${row.store_name}-${row.supplier}`),
      first_bill_date: row.first_bill_date ?? "",
      fy: row.fy,
      gst_no: row.gst_no,
      status: row.status ?? "ACTIVE",
      store_name: row.store_name,
      supplier: row.supplier,
    })),
    total,
  };
}

export async function savePurchaseMaster(input: PurchaseMasterInput, createdBy: string) {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  const db = await getMongoDb();
  const now = new Date();
  await db.collection("purchase_master").updateOne(
    {
      fy: input.fy,
      gst_no: input.gst_no,
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

export async function importPurchaseMasterRows(rows: PurchaseMasterInput[], createdBy: string) {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (rows.length === 0) {
    return { imported: 0 };
  }

  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection("purchase_master").bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: {
          fy: row.fy,
          gst_no: row.gst_no,
          store_name: row.store_name,
          supplier: row.supplier,
        },
        update: {
          $set: {
            ...row,
            updated_at: now,
          },
          $setOnInsert: {
            created_at: now,
            created_by: createdBy,
          },
        },
        upsert: true,
      },
    })),
  );

  return { imported: result.upsertedCount + result.modifiedCount + result.matchedCount };
}
