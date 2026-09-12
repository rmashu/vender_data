import { NextResponse } from "next/server";
import { getCurrentSession } from "@/backend/auth/session-store";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(session);
}
