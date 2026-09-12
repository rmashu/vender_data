import { NextResponse } from "next/server";
import { writeAuditLog } from "@/backend/audit/audit-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { updateUserStores } from "@/backend/auth/user-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("users:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.email !== "string" || !Array.isArray(payload.assignedStores)) {
    return NextResponse.json({ error: "Email and assignedStores are required" }, { status: 400 });
  }

  const user = await updateUserStores(payload.email, payload.assignedStores);

  if (!user) {
    return NextResponse.json({ error: "User not found or database is not configured" }, { status: 404 });
  }

  await writeAuditLog({
    action: "USER_STORES_UPDATED",
    actor: guard.session.user.email,
    metadata: { assignedStores: payload.assignedStores, email: payload.email },
    status: "SUCCESS",
  });

  return NextResponse.json({ success: true, user });
}
