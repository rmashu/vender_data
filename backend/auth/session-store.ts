import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSession } from "./access-control";
import { getUserByEmail } from "./user-repository";
import type { AuthSession } from "./types";

const cookieName = "vendor_ledger_session";
const maxAgeSeconds = 60 * 60 * 8;

export async function createSessionCookie(userId: string) {
  const value = signSessionValue(userId);
  const cookieStore = await cookies();

  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  const userId = value ? verifySessionValue(value) : null;

  if (!userId) {
    return null;
  }

  const user = await getUserByEmail(userId);

  return user ? await createSession(user) : null;
}

function signSessionValue(userId: string) {
  const signature = createSignature(userId);
  return `${encodeURIComponent(userId)}.${signature}`;
}

function verifySessionValue(value: string) {
  const separatorIndex = value.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const encodedUserId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);

  if (!encodedUserId || !signature) {
    return null;
  }

  const userId = decodeURIComponent(encodedUserId);
  const expected = createSignature(userId);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer) ? userId : null;
}

function createSignature(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? "dev-only-change-this-session-secret";
}
