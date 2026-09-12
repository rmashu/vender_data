import { NextResponse } from "next/server";
import { requireApiPermission } from "@/backend/auth/api-guard";
import { listUsers } from "@/backend/auth/user-repository";

export async function GET() {
  const guard = await requireApiPermission("users:manage");

  if (!guard.ok) {
    return guard.response;
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}
