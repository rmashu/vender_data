import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { approveUser } from "@/backend/auth/user-repository";
import { writeAuditLog } from "@/backend/audit/audit-repository";
import type { RoleCode } from "@/backend/auth/types";

const roleCodes: RoleCode[] = ["ADMIN", "MANAGER", "STAFF", "VIEWER"];

export async function POST(request: Request) {
  const guard = await requireApiPermission("users:manage");

  if (!guard.ok) {
    return guard.response;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!isApprovePayload(payload)) {
    return NextResponse.json({ error: "Email and valid roleCode are required" }, { status: 400 });
  }

  const user = await approveUser(payload.email, payload.roleCode);

  if (!user) {
    return NextResponse.json({ error: "User not found or database is not configured" }, { status: 404 });
  }

  await writeAuditLog({
    action: "USER_APPROVED",
    actor: guard.session.user.email,
    metadata: { email: payload.email, roleCode: payload.roleCode },
    status: "SUCCESS",
  });

  return NextResponse.json({ success: true, user });
}

function isApprovePayload(value: unknown): value is { email: string; roleCode: RoleCode } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{ email: string; roleCode: RoleCode }>;
  return typeof payload.email === "string" && Boolean(payload.roleCode && roleCodes.includes(payload.roleCode));
}
