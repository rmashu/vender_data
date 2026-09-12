import { NextResponse } from "next/server";
import { hashPassword } from "@/backend/auth/password";
import { ensureDemoAdminUser, updateUserPasswordHash } from "@/backend/auth/user-repository";

export async function POST() {
  const user = await ensureDemoAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unable to bootstrap admin user" }, { status: 500 });
  }

  const demoPassword = process.env.AUTH_DEMO_PASSWORD ?? "admin#654123";
  await updateUserPasswordHash(user.email, await hashPassword(demoPassword));

  return NextResponse.json({
    success: true,
    user: { email: user.email, roleCode: user.roleCode, status: user.status },
  });
}
