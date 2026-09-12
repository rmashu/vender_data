import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/backend/auth/session-store";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
