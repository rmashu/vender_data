import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { updateUserStatus } from "@/backend/auth/user-repository";
import { writeAuditLog } from "@/backend/audit/audit-repository";
import type { UserStatus } from "@/backend/auth/types";

const statuses: UserStatus[] = ["PENDING", "ACTIVE", "INACTIVE"];

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

  if (!isStatusPayload(payload)) {
    return NextResponse.json({ error: "Email and valid status are required" }, { status: 400 });
  }

  const user = await updateUserStatus(payload.email, payload.status);

  if (!user) {
    return NextResponse.json({ error: "User not found or database is not configured" }, { status: 404 });
  }

  await writeAuditLog({
    action: "USER_STATUS_UPDATED",
    actor: guard.session.user.email,
    metadata: { email: payload.email, status: payload.status },
    status: "SUCCESS",
  });

  return NextResponse.json({ success: true, user });
}

function isStatusPayload(value: unknown): value is { email: string; status: UserStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{ email: string; status: UserStatus }>;
  return typeof payload.email === "string" && Boolean(payload.status && statuses.includes(payload.status));
}
