import { NextResponse } from "next/server";
import { hashPassword } from "@/backend/auth/password";
import { isMongoConfigured } from "@/backend/database/mongodb";
import { createNewUser, getExistingUserStatus } from "@/backend/auth/user-repository";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!isSignupPayload(payload)) {
    return NextResponse.json({ error: "Full name, email and password are required" }, { status: 400 });
  }

  if (!payload.fullName.trim() || !payload.email.trim()) {
    return NextResponse.json({ error: "Full name and email are required" }, { status: 400 });
  }

  if (payload.password !== payload.confirmPassword) {
    return NextResponse.json({ error: "Password confirmation does not match" }, { status: 400 });
  }

  if (payload.password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Database is not configured. Please set MONGODB_URI." }, { status: 500 });
  }

  const existingStatus = await getExistingUserStatus(payload.email.trim());

  if (existingStatus === "PENDING") {
    return NextResponse.json({ error: "User already exists and is pending admin approval." }, { status: 409 });
  }

  if (existingStatus === "ACTIVE") {
    return NextResponse.json({ error: "User already exists. Please login or ask admin to reset password." }, { status: 409 });
  }

  if (existingStatus === "INACTIVE") {
    return NextResponse.json({ error: "User already exists but is inactive. Please contact admin." }, { status: 409 });
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await createNewUser({
    name: payload.fullName.trim(),
    email: payload.email.trim(),
    passwordHash,
  });

  if (!user) {
    return NextResponse.json({ error: "Unable to create user. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "User created and pending admin approval",
    user: { email: user.email, status: user.status, roleCode: user.roleCode },
  });
}

function isSignupPayload(value: unknown): value is { fullName: string; email: string; password: string; confirmPassword: string } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<{ fullName: string; email: string; password: string; confirmPassword: string }>;
  return (
    typeof payload.fullName === "string" &&
    typeof payload.email === "string" &&
    typeof payload.password === "string" &&
    typeof payload.confirmPassword === "string"
  );
}
