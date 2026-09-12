import { NextResponse } from "next/server";
import { writeAuditLog } from "@/backend/audit/audit-repository";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { hashPassword } from "@/backend/auth/password";
import { updateUserPasswordHash } from "@/backend/auth/user-repository";

export async function POST(request: Request) {
  const guard = await requireApiPermission("users:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.email !== "string" || typeof payload.password !== "string") {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (payload.password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const user = await updateUserPasswordHash(payload.email, await hashPassword(payload.password));

  if (!user) {
    return NextResponse.json({ error: "User not found or database is not configured" }, { status: 404 });
  }

  await writeAuditLog({
    action: "USER_PASSWORD_RESET",
    actor: guard.session.user.email,
    metadata: { email: payload.email },
    status: "SUCCESS",
  });

  return NextResponse.json({ success: true });
}
