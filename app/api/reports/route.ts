import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { generateReport, type ReportType } from "@/backend/reports/report-repository";

const reportTypes: ReportType[] = [
  "Vendor Report",
  "Store Report",
  "Date Range Report",
  "Pending Balance",
  "Upload Batch",
  "Credit Notes",
];

export async function GET(request: Request) {
  const guard = await requireApiPermission("reports:view");

  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const reportType = url.searchParams.get("type") as ReportType | null;

  if (!reportType || !reportTypes.includes(reportType)) {
    return NextResponse.json({ error: "Valid report type is required" }, { status: 400 });
  }

  const result = await generateReport(
    {
      dateFrom: url.searchParams.get("from") ?? undefined,
      dateTo: url.searchParams.get("to") ?? undefined,
      reportType,
    },
    guard.session,
  );

  return NextResponse.json(result);
}
