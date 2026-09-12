import { NextResponse } from "next/server";
import { createSession } from "@/backend/auth/access-control";
import { verifyPassword } from "@/backend/auth/password";
import { createSessionCookie } from "@/backend/auth/session-store";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!isLoginPayload(payload)) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await verifyPassword(payload.email, payload.password);
  const session = user ? await createSession(user) : null;

  if (!user || !session) {
    return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
  }

  await createSessionCookie(user.email);

  return NextResponse.json(session);
}

function isLoginPayload(value: unknown): value is { email: string; password: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{ email: string; password: string }>;
  return typeof payload.email === "string" && typeof payload.password === "string";
}
