import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import type { LedgerPayload } from "./ledger";

export type SavedLedgerBatch = {
  id: string;
  batchNumber: string;
  count: number;
};

export async function saveVendorLedger(payload: LedgerPayload, createdBy: string): Promise<SavedLedgerBatch> {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  const db = await getMongoDb();
  const batchNumber = createBatchNumber(payload.store_name, payload.vendor_name, payload.upload_timestamp);
  const result = await db.collection("vendor_ledgers").insertOne({
    ...payload,
    batch_number: batchNumber,
    created_by: createdBy,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return {
    id: String(result.insertedId),
    batchNumber,
    count: payload.ledgers.length,
  };
}

function createBatchNumber(storeName: string, vendorName: string, uploadTimestamp: string) {
  const date = uploadTimestamp.slice(0, 10).replaceAll("-", "");
  const uniqueId = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${toCode(storeName)}-${toCode(vendorName)}-${date}-${uniqueId}`;
}

function toCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}
