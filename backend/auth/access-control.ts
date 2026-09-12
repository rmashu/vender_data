import { getAdminConfig } from "@/backend/admin/admin-config-repository";
import { rolePermissions, roles, users } from "./seed";
import type { AuthSession, PermissionCode, User } from "./types";

export function getUserByEmail(email: string) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createSession(user: User): Promise<AuthSession | null> {
  if (user.status !== "ACTIVE") {
    return null;
  }

  const adminConfig = await getAdminConfig();
  const role = adminConfig.roles.find((item) => item.code === user.roleCode) ?? roles.find((item) => item.code === user.roleCode);

  if (!role) {
    return null;
  }

  return {
    user,
    role,
    permissions: getEffectivePermissions(user.roleCode, adminConfig.rolePermissions[user.roleCode]),
  };
}

function getEffectivePermissions(roleCode: User["roleCode"], savedPermissions?: PermissionCode[]) {
  if (roleCode === "ADMIN") {
    return Array.from(new Set([...(savedPermissions ?? []), ...rolePermissions.ADMIN]));
  }

  return savedPermissions ?? rolePermissions[roleCode];
}

export function hasPermission(session: AuthSession | null, permission: PermissionCode) {
  return Boolean(session?.permissions.includes(permission));
}

export function requirePermission(session: AuthSession | null, permission: PermissionCode) {
  if (!hasPermission(session, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
