export type RoleCode = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "manage";

export type PermissionCode =
  | "dashboard:view"
  | "ledger:view"
  | "ledger:view_all"
  | "ledger:create"
  | "ledger:edit"
  | "ledger:delete"
  | "ledger:approve"
  | "reports:view"
  | "analysis:view"
  | "notifications:view"
  | "profile:view"
  | "admin:view"
  | "users:manage"
  | "roles:manage"
  | "permissions:manage"
  | "masters:manage"
  | "audit:view"
  | "settings:manage";

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE";

export type Role = {
  id: string;
  code: RoleCode;
  name: string;
  description: string;
};

export type User = {
  assignedStores: string[];
  id: string;
  name: string;
  email: string;
  roleCode: RoleCode;
  status: UserStatus;
};

export type AuthSession = {
  user: User;
  role: Role;
  permissions: PermissionCode[];
};
