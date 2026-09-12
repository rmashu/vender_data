import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";

type AuditLogInput = {
  action: string;
  actor: string;
  metadata?: Record<string, unknown>;
  status: "SUCCESS" | "FAILED";
};

export async function writeAuditLog(input: AuditLogInput) {
  if (!isMongoConfigured()) {
    return;
  }

  const db = await getMongoDb();
  await db.collection("audit_logs").insertOne({
    ...input,
    created_at: new Date(),
  });
}

export async function listAuditLogs(limit = 50) {
  if (!isMongoConfigured()) {
    return [];
  }

  const db = await getMongoDb();
  return db.collection("audit_logs").find({}).sort({ created_at: -1 }).limit(limit).toArray();
}
