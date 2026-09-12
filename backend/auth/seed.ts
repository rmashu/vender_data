import type { PermissionCode, Role, RoleCode, User } from "./types";

export const roles: Role[] = [
  { id: "role_admin", code: "ADMIN", name: "Admin", description: "Full system access" },
  { id: "role_manager", code: "MANAGER", name: "Manager", description: "Team records, reports and approvals" },
  { id: "role_staff", code: "STAFF", name: "Staff", description: "Own work and assigned ledger records" },
  { id: "role_viewer", code: "VIEWER", name: "Viewer", description: "Read-only access" },
];

export const rolePermissions: Record<RoleCode, PermissionCode[]> = {
  ADMIN: [
    "dashboard:view",
    "ledger:view",
    "ledger:view_all",
    "ledger:create",
    "ledger:edit",
    "ledger:delete",
    "ledger:approve",
    "reports:view",
    "analysis:view",
    "notifications:view",
    "profile:view",
    "admin:view",
    "users:manage",
    "roles:manage",
    "permissions:manage",
    "masters:manage",
    "audit:view",
    "settings:manage",
  ],
  MANAGER: [
    "dashboard:view",
    "ledger:view",
    "ledger:view_all",
    "ledger:create",
    "ledger:edit",
    "ledger:approve",
    "reports:view",
    "analysis:view",
    "notifications:view",
    "profile:view",
  ],
  STAFF: ["dashboard:view", "ledger:view", "ledger:create", "ledger:edit", "notifications:view", "profile:view"],
  VIEWER: ["dashboard:view", "ledger:view", "reports:view", "analysis:view", "profile:view"],
};

export const users: User[] = [
  {
    id: "user_demo_admin",
    assignedStores: [],
    name: "Demo Admin",
    email: "admin@example.com",
    roleCode: "ADMIN",
    status: "ACTIVE",
  },
];
