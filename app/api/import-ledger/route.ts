import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { importLedgerFile } from "@/backend/ledger-import";

export async function POST(request: Request) {
  try {
    const guard = await requireApiPermission("ledger:create");

    if (!guard.ok) {
      return guard.response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    const result = importLedgerFile(file.name, await file.text());

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to import ledger file" }, { status: 400 });
  }
}
