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
  updated_at?: Date | string;
};

export type PurchaseMasterInput = Pick<PurchaseMasterRecord, "fy" | "gst_no" | "status" | "store_name" | "supplier">;

export async function listPurchaseMaster(filters: Partial<Pick<PurchaseMasterRecord, "fy" | "store_name" | "supplier">> = {}) {
  if (!isMongoConfigured()) {
    return [];
  }

  const db = await getMongoDb();
  const match = {
    ...(filters.fy ? { fy: filters.fy } : {}),
    ...(filters.store_name ? { store_name: filters.store_name } : {}),
    ...(filters.supplier ? { supplier: filters.supplier } : {}),
  };

  const rows = await db
    .collection<PurchaseMasterRecord>("purchase_master")
    .find(match)
    .sort({ fy: -1, store_name: 1, supplier: 1 })
    .limit(500)
    .toArray();

  return rows.map((row) => ({
    id: String(row._id ?? `${row.fy}-${row.store_name}-${row.supplier}`),
    fy: row.fy,
    gst_no: row.gst_no,
    status: row.status ?? "ACTIVE",
    store_name: row.store_name,
    supplier: row.supplier,
  }));
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
