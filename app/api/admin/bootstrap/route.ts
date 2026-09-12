import { NextResponse } from "next/server";
import { ensureDemoAdminUser } from "@/backend/auth/user-repository";

export async function POST() {
  const user = await ensureDemoAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unable to bootstrap admin user" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user: { email: user.email, roleCode: user.roleCode, status: user.status },
  });
}
