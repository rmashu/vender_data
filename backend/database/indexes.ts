import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";

export async function ensureDatabaseIndexes() {
  if (!isMongoConfigured()) {
    return;
  }

  const db = await getMongoDb();

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("vendor_ledgers").createIndex({ batch_number: 1 }, { unique: true }),
    db.collection("vendor_ledgers").createIndex({ vendor_name: 1, store_name: 1 }),
    db.collection("vendor_ledgers").createIndex({ date_from: 1, date_to: 1 }),
    db.collection("audit_logs").createIndex({ created_at: -1 }),
    db.collection("admin_config").createIndex({ key: 1 }, { unique: true }),
  ]);
}
