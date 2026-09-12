import { NextResponse } from "next/server";
import { hasPermission } from "./access-control";
import { getCurrentSession } from "./session-store";
import type { AuthSession, PermissionCode } from "./types";

type GuardResult =
  | { ok: true; session: AuthSession }
  | { ok: false; response: NextResponse<{ error: string }> };

export async function requireApiPermission(permission: PermissionCode): Promise<GuardResult> {
  const session = await getCurrentSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasPermission(session, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
