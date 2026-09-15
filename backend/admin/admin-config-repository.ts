import { rolePermissions as defaultRolePermissions, roles as defaultRoles } from "@/backend/auth/seed";
import type { PermissionCode, Role, RoleCode } from "@/backend/auth/types";
import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import { stores as defaultStores, vendors as defaultVendors } from "@/backend/masters/master-data";

export type AdminSettings = {
  approvalRequired: boolean;
  csvOnlyUpload: boolean;
};

type AdminConfig = {
  roles: Role[];
  rolePermissions: Record<RoleCode, PermissionCode[]>;
  vendors: string[];
  stores: string[];
  settings: AdminSettings;
};

const defaultSettings: AdminSettings = {
  approvalRequired: true,
  csvOnlyUpload: true,
};

let cachedConfig: { expiresAt: number; value: AdminConfig } | null = null;
const cacheTtlMs = 30_000;

export async function getAdminConfig(): Promise<AdminConfig> {
  if (!isMongoConfigured()) {
    return {
      roles: defaultRoles,
      rolePermissions: defaultRolePermissions,
      vendors: Array.from(defaultVendors),
      stores: Array.from(new Set(defaultStores)),
      settings: defaultSettings,
    };
  }

  if (cachedConfig && cachedConfig.expiresAt > Date.now()) {
    return cachedConfig.value;
  }

  const db = await getMongoDb();
  const config = await db.collection("admin_config").findOne({ key: "main" });

  const value = {
    roles: (config?.roles as Role[] | undefined) ?? defaultRoles,
    rolePermissions: (config?.rolePermissions as Record<RoleCode, PermissionCode[]> | undefined) ?? defaultRolePermissions,
    vendors: (config?.vendors as string[] | undefined) ?? Array.from(defaultVendors),
    stores: (config?.stores as string[] | undefined) ?? Array.from(new Set(defaultStores)),
    settings: (config?.settings as AdminSettings | undefined) ?? defaultSettings,
  };

  cachedConfig = { expiresAt: Date.now() + cacheTtlMs, value };
  return value;
}

export async function saveRoles(roles: Role[]) {
  return updateAdminConfig({ roles });
}

export async function saveRolePermissions(rolePermissions: Record<RoleCode, PermissionCode[]>) {
  return updateAdminConfig({ rolePermissions });
}

export async function saveMasterData(input: { stores: string[]; vendors: string[] }) {
  return updateAdminConfig({
    stores: Array.from(new Set(input.stores.map((store) => store.trim()).filter(Boolean))),
    vendors: Array.from(new Set(input.vendors.map((vendor) => vendor.trim()).filter(Boolean))),
  });
}

export async function saveSettings(settings: AdminSettings) {
  return updateAdminConfig({ settings });
}

async function updateAdminConfig(update: Record<string, unknown>) {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  const db = await getMongoDb();
  await db.collection("admin_config").updateOne(
    { key: "main" },
    {
      $set: {
        ...update,
        updated_at: new Date(),
      },
      $setOnInsert: {
        key: "main",
        created_at: new Date(),
      },
    },
    { upsert: true },
  );
  cachedConfig = null;
}
