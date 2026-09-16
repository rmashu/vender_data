import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { importPurchaseMasterCsv } from "@/backend/purchase/purchase-master-import";
import { importPurchaseMasterRows } from "@/backend/purchase/purchase-master-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("masters:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
  }

  const result = importPurchaseMasterCsv(await file.text());
  const saved = await importPurchaseMasterRows(result.rows, guard.session.user.email);

  return NextResponse.json({
    imported: saved.imported,
    parsed: result.rows.length,
    skipped: result.skipped,
  });
}
