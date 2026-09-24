import type { PermissionCode } from "./types";

export type AppModule = {
  title: string;
  description: string;
  href: string;
  permission: PermissionCode;
};

export const dashboardModules: AppModule[] = [
  { title: "My Work", description: "Assigned ledger uploads and pending tasks", href: "/ledger", permission: "ledger:view" },
  { title: "All Records", description: "Ledger records across allowed stores", href: "/ledger", permission: "ledger:view_all" },
  { title: "Reports", description: "Vendor, store and date wise reports", href: "/reports", permission: "reports:view" },
  { title: "Analysis", description: "Pending balance and transaction trends", href: "/analysis", permission: "analysis:view" },
  { title: "Notifications", description: "Alerts for uploads, approvals and changes", href: "/notifications", permission: "notifications:view" },
  { title: "Profile", description: "User details and access information", href: "/profile", permission: "profile:view" },
];

export const adminModules: AppModule[] = [
  { title: "Users", description: "Create, disable and manage users", href: "/admin/users", permission: "users:manage" },
  { title: "Permissions", description: "Control module and action access", href: "/admin/permissions", permission: "permissions:manage" },
  { title: "Data Management", description: "Manage vendors, stores and master data", href: "/admin/masters", permission: "masters:manage" },
  { title: "Audit Logs", description: "Track user actions and record changes", href: "/admin/audit-logs", permission: "audit:view" },
  { title: "System Settings", description: "Configure app wide settings", href: "/admin/settings", permission: "settings:manage" },
];
