import { NextResponse } from "next/server";
import { getAdminConfig } from "@/backend/admin/admin-config-repository";
import { hasPermission } from "@/backend/auth/access-control";
import { getCurrentSession } from "@/backend/auth/session-store";
import { listPurchaseMasterOptions } from "@/backend/purchase/purchase-master-repository";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !hasPermission(session, "ledger:view") &&
    !hasPermission(session, "ledger:create") &&
    !hasPermission(session, "masters:manage")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [adminConfig, purchaseMasterOptions] = await Promise.all([
    getAdminConfig(),
    listPurchaseMasterOptions(),
  ]);

  return NextResponse.json({
    rows: [
      ...purchaseMasterOptions.rows,
      ...adminConfig.stores.map((store) => ({
        store_name: store,
        supplier: "",
      })),
      ...adminConfig.vendors.map((vendor) => ({
        store_name: "",
        supplier: vendor,
      })),
    ],
  });
}
