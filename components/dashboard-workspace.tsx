"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AppModule } from "@/backend/auth/modules";
import { rolePermissions, roles } from "@/backend/auth/seed";
import { stores, vendors } from "@/backend/masters/master-data";
import type { PermissionCode, RoleCode, User } from "@/backend/auth/types";
import { UsersAdminPanel } from "@/components/admin/users-admin-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DashboardWorkspaceProps = {
  adminModules: AppModule[];
  dashboardModules: AppModule[];
  permissions: PermissionCode[];
  user: User;
};

type AdminConfig = {
  roles: typeof roles;
  rolePermissions: Record<RoleCode, PermissionCode[]>;
  vendors: string[];
  stores: string[];
  settings: {
    approvalRequired: boolean;
    csvOnlyUpload: boolean;
  };
};

type ReportRow = Record<string, number | string>;

type ReportResult = {
  rows: ReportRow[];
  summary: {
    credit: number;
    debit: number;
    pendingBalance: number;
    rows: number;
  };
};

const reportTypes = ["Vendor Report", "Store Report", "Date Range Report", "Pending Balance", "Upload Batch", "Credit Notes"] as const;

export function DashboardWorkspace({ adminModules, dashboardModules, permissions, user }: DashboardWorkspaceProps) {
  const workItems = useMemo(() => dashboardModules.map((module) => toWorkspaceItem(module, "work")), [dashboardModules]);
  const adminItems = useMemo(() => adminModules.map((module) => toWorkspaceItem(module, "admin")), [adminModules]);
  const items = useMemo(() => [...workItems, ...adminItems], [adminItems, workItems]);
  const [selectedKey, setSelectedKey] = useState(items[0]?.key ?? "overview");
  const selectedItem = items.find((item) => item.key === selectedKey);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    roles,
    rolePermissions,
    vendors: Array.from(vendors),
    stores: Array.from(new Set(stores)),
    settings: { approvalRequired: true, csvOnlyUpload: true },
  });

  useEffect(() => {
    async function loadAdminConfig() {
      const response = await fetch("/api/admin/config");

      if (!response.ok) {
        return;
      }

      setAdminConfig((await response.json()) as AdminConfig);
    }

    void loadAdminConfig();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl border bg-muted/20 p-4">
        <p className="text-sm font-medium">Work Area</p>
        <nav className="mt-4 grid gap-1">
          {workItems.map((item) => (
            <SidebarButton
              description={item.module.description}
              isActive={selectedKey === item.key}
              key={item.key}
              onClick={() => setSelectedKey(item.key)}
              title={item.module.title}
            />
          ))}
        </nav>

        {adminModules.length > 0 && (
          <details className="mt-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              Admin
              <ChevronDown className="size-4" />
            </summary>
            <nav className="mt-3 grid gap-1">
              {adminItems.map((item) => (
                <SidebarButton
                  description={item.module.description}
                  isActive={selectedKey === item.key}
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  title={item.module.title}
                />
              ))}
            </nav>
          </details>
        )}
      </aside>

      <section className="space-y-4">
        <WorkspacePanel adminConfig={adminConfig} item={selectedItem} onAdminConfigChange={setAdminConfig} user={user} />

        <Card>
          <CardHeader>
            <CardTitle>Permission Snapshot</CardTitle>
            <CardDescription>Current session permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span className="rounded-md bg-muted px-2 py-1 text-xs" key={permission}>
                  {permission}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type WorkspaceItem = {
  key: string;
  module: AppModule;
  section: "admin" | "work";
};

function toWorkspaceItem(module: AppModule, section: WorkspaceItem["section"]): WorkspaceItem {
  return {
    key: `${section}:${module.permission}`,
    module,
    section,
  };
}

function WorkspacePanel({
  adminConfig,
  item,
  onAdminConfigChange,
  user,
}: {
  adminConfig: AdminConfig;
  item?: WorkspaceItem;
  onAdminConfigChange: (config: AdminConfig) => void;
  user: User;
}) {
  if (!item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Select a module from the left sidebar.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (item.section === "admin") {
    switch (item.module.title) {
      case "Users":
        return <UsersAdminPanel showSidebar={false} />;
      case "Roles":
        return <RolesPanel adminConfig={adminConfig} onAdminConfigChange={onAdminConfigChange} />;
      case "Permissions":
        return <PermissionsPanel adminConfig={adminConfig} onAdminConfigChange={onAdminConfigChange} />;
      case "Data Management":
        return <DataManagementPanel adminConfig={adminConfig} onAdminConfigChange={onAdminConfigChange} />;
      case "Reports":
        return <AdminReportsPanel />;
      case "Audit Logs":
        return <AuditLogsPanel />;
      case "System Settings":
        return <SystemSettingsPanel adminConfig={adminConfig} onAdminConfigChange={onAdminConfigChange} />;
      default:
        break;
    }
  }

  return <WorkAreaPanel item={item} user={user} />;
}

function WorkAreaPanel({ item, user }: { item: WorkspaceItem; user: User }) {
  switch (item.module.title) {
    case "My Work":
      return <MyWorkPanel user={user} />;
    case "All Records":
      return <AllRecordsPanel />;
    case "Reports":
      return <UserReportsPanel />;
    case "Analysis":
      return <AnalysisPanel />;
    case "Notifications":
      return <NotificationsPanel />;
    case "Profile":
      return <ProfilePanel user={user} />;
    default:
      return <ModuleSummaryPanel module={item.module} />;
  }
}

function MyWorkPanel({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Work</CardTitle>
        <CardDescription>Assigned ledger uploads and pending tasks for {user.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Pending Uploads" value={0} />
          <MetricCard label="Saved Batches" value="View" />
          <MetricCard label="CSV Format" value="Ready" />
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Quick Actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => window.location.assign("/ledger")}>Upload Ledger CSV</Button>
            <Button variant="outline">View My Batches</Button>
            <Button variant="outline">Download CSV Format</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AllRecordsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Records</CardTitle>
        <CardDescription>Search ledger records across allowed stores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Search vendor, batch or invoice" />
          <Input placeholder="Store code/name" />
          <Button>Search</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left">
                {["Batch", "Vendor", "Store", "Rows", "Date"].map((head) => (
                  <th className="p-3" key={head}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>Records will appear here after database query integration.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UserReportsPanel() {
  return <ReportsPanel description="Vendor, store and date-wise user reports." title="Reports" />;
}

function AnalysisPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis</CardTitle>
        <CardDescription>Pending balance and transaction trend overview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Pending Balance" value="₹0" />
          <MetricCard label="Credit Notes" value={0} />
          <MetricCard label="Receipts" value={0} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Analysis charts will use saved ledger batches after report query APIs are added.
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Alerts for uploads, approvals and changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No notifications right now.
        </div>
      </CardContent>
    </Card>
  );
}

function ProfilePanel({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>User details and access information.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <SettingRow label="Name" value={user.name} />
        <SettingRow label="Email" value={user.email} />
        <SettingRow label="Role" value={user.roleCode} />
        <SettingRow label="Status" value={user.status} />
        <SettingRow label="Stores" value={user.roleCode === "ADMIN" ? "All stores" : `${user.assignedStores.length} assigned`} />
      </CardContent>
    </Card>
  );
}

function RolesPanel({
  adminConfig,
  onAdminConfigChange,
}: {
  adminConfig: AdminConfig;
  onAdminConfigChange: (config: AdminConfig) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleCode>("ADMIN");
  const role = adminConfig.roles.find((item) => item.code === selectedRole) ?? adminConfig.roles[0];
  const [roleName, setRoleName] = useState(role.name);
  const [roleDescription, setRoleDescription] = useState(role.description);
  const [message, setMessage] = useState("");

  function selectRole(roleCode: RoleCode) {
    const nextRole = adminConfig.roles.find((item) => item.code === roleCode) ?? role;
    setSelectedRole(roleCode);
    setRoleName(nextRole.name);
    setRoleDescription(nextRole.description);
    setMessage("");
  }

  function resetRoleForm() {
    setRoleName(role.name);
    setRoleDescription(role.description);
    setMessage("");
  }

  async function saveRole() {
    const nextRoles = adminConfig.roles.map((item) =>
      item.code === selectedRole ? { ...item, description: roleDescription, name: roleName } : item,
    );
    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: nextRoles }),
    });

    if (!response.ok) {
      setMessage("Unable to save role");
      return;
    }

    onAdminConfigChange({ ...adminConfig, roles: nextRoles });
    setMessage(`${role.code} role saved`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
        <CardDescription>Admin can review role definitions and prepare role edits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {adminConfig.roles.map((item) => (
            <button
              className={`rounded-lg border p-4 text-left transition hover:bg-muted ${
                selectedRole === item.code ? "border-primary bg-muted ring-2 ring-ring/30" : ""
              }`}
              key={item.code}
              onClick={() => selectRole(item.code)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{item.code}</h3>
                <span className="rounded-md bg-background px-2 py-1 text-xs">{adminConfig.rolePermissions[item.code].length} permissions</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </button>
          ))}
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Edit Role</h3>
              <p className="text-sm text-muted-foreground">Update role name and description.</p>
            </div>
            <span className="rounded-md bg-muted px-2 py-1 text-xs">{selectedRole}</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
            <Input readOnly value={role.code} />
            <Input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="Role display name" />
          </div>
          <div className="mt-3">
            <Input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} placeholder="Role description" />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={resetRoleForm}>Reset</Button>
            <Button onClick={saveRole}>Save Role</Button>
          </div>
          {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionsPanel({
  adminConfig,
  onAdminConfigChange,
}: {
  adminConfig: AdminConfig;
  onAdminConfigChange: (config: AdminConfig) => void;
}) {
  const permissionList = Array.from(new Set(Object.values(adminConfig.rolePermissions).flat()));
  const roleCodes = adminConfig.roles.map((role) => role.code);
  const [permissionState, setPermissionState] = useState(() => ({ ...adminConfig.rolePermissions }));
  const [selectedRole, setSelectedRole] = useState<RoleCode>("ADMIN");
  const [isPermissionDropdownOpen, setIsPermissionDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPermissionState({ ...adminConfig.rolePermissions });
  }, [adminConfig.rolePermissions]);

  function togglePermission(roleCode: RoleCode, permission: PermissionCode) {
    if (roleCode === "ADMIN" && rolePermissions.ADMIN.includes(permission)) {
      setMessage("Core ADMIN permissions are locked for safety.");
      return;
    }

    setPermissionState((current) => {
      const currentPermissions = current[roleCode];
      const nextPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter((item) => item !== permission)
        : [...currentPermissions, permission];

      return { ...current, [roleCode]: nextPermissions };
    });
    setMessage("");
  }

  async function savePermissions() {
    const response = await fetch("/api/admin/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolePermissions: permissionState }),
    });

    if (!response.ok) {
      setMessage("Unable to save permissions");
      return;
    }

    onAdminConfigChange({ ...adminConfig, rolePermissions: permissionState });
    setMessage("Permissions saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>Admin can select a role and enable multiple permissions with checkboxes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Roles" value={roleCodes.length} />
          <MetricCard label="Permissions" value={permissionList.length} />
          <MetricCard label="Allowed Rules" value={Object.values(permissionState).reduce((total, items) => total + items.length, 0)} />
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Manage Permission</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-[240px_1fr]">
            <select className="h-8 rounded-lg border bg-background px-2" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as RoleCode)}>
              {roleCodes.map((roleCode) => (
                <option key={roleCode}>{roleCode}</option>
              ))}
            </select>
            <div className="relative">
              <button
                className="flex h-8 w-full items-center justify-between rounded-lg border bg-background px-2 text-left text-sm"
                onClick={() => setIsPermissionDropdownOpen((current) => !current)}
                type="button"
              >
                <span>{permissionState[selectedRole].length} permissions selected</span>
                <ChevronDown className="size-4" />
              </button>
              {isPermissionDropdownOpen && (
                <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border bg-background p-2 shadow-lg">
                  {permissionList.map((permission) => (
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted" key={permission}>
                      <input
                        checked={permissionState[selectedRole].includes(permission)}
                        onChange={() => togglePermission(selectedRole, permission)}
                        type="checkbox"
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {permissionState[selectedRole].slice(0, 6).map((permission) => (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs" key={permission}>{permission}</span>
                ))}
                {permissionState[selectedRole].length > 6 && (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs">+{permissionState[selectedRole].length - 6} more</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Role Permission Summary</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {roleCodes.map((roleCode) => (
              <div className="rounded-lg border p-3" key={roleCode}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{roleCode}</p>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs">{permissionState[roleCode].length} allowed</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {permissionState[roleCode].slice(0, 8).map((permission) => (
                    <span className="rounded-md bg-muted px-2 py-1 text-xs" key={permission}>{permission}</span>
                  ))}
                  {permissionState[roleCode].length > 8 && (
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">+{permissionState[roleCode].length - 8} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">Permission changes are saved to MongoDB admin config.</p>
          <Button onClick={savePermissions}>Save Permissions</Button>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}

function DataManagementPanel({
  adminConfig,
  onAdminConfigChange,
}: {
  adminConfig: AdminConfig;
  onAdminConfigChange: (config: AdminConfig) => void;
}) {
  const [vendorList, setVendorList] = useState<string[]>(adminConfig.vendors);
  const [storeList, setStoreList] = useState<string[]>(adminConfig.stores);
  const [newVendor, setNewVendor] = useState("");
  const [newStore, setNewStore] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setVendorList(adminConfig.vendors);
    setStoreList(adminConfig.stores);
  }, [adminConfig.stores, adminConfig.vendors]);

  function addVendor() {
    const value = newVendor.trim();
    if (!value || vendorList.includes(value)) {
      return;
    }
    setVendorList((current) => [...current, value]);
    setNewVendor("");
    setMessage("Vendor added in admin panel. Database save API can persist it next.");
  }

  function addStore() {
    const value = newStore.trim().toUpperCase();
    if (!value || storeList.includes(value)) {
      return;
    }
    setStoreList((current) => [...current, value]);
    setNewStore("");
    setMessage("Store added in admin panel. Database save API can persist it next.");
  }

  async function saveMasterData() {
    const response = await fetch("/api/admin/masters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stores: storeList, vendors: vendorList }),
    });

    if (!response.ok) {
      setMessage("Unable to save master data");
      return;
    }

    onAdminConfigChange({ ...adminConfig, stores: storeList, vendors: vendorList });
    setMessage("Master data saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Admin can manage vendors, stores and CSV master controls.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Vendors" value={vendorList.length} />
          <MetricCard label="Stores" value={storeList.length} />
          <MetricCard label="CSV Upload" value="Enabled" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Add Vendor</h3>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Vendor name" value={newVendor} onChange={(event) => setNewVendor(event.target.value)} />
              <Button onClick={addVendor}>Add</Button>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Add Store</h3>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Store code/name" value={newStore} onChange={(event) => setNewStore(event.target.value)} />
              <Button onClick={addStore}>Add</Button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MasterPreview title="Vendor Master" items={vendorList.slice(0, 12)} />
          <MasterPreview title="Store Master" items={storeList.slice(0, 16)} />
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">Master edits are admin-controlled and saved to MongoDB admin config.</p>
          <Button onClick={saveMasterData}>Save Master Data</Button>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}

function AdminReportsPanel() {
  return <ReportsPanel description="Filters for vendor, store and date-wise reporting." title="Admin Reports" />;
}

function ReportsPanel({ description, title }: { description: string; title: string }) {
  const [reportType, setReportType] = useState<(typeof reportTypes)[number]>("Vendor Report");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState("");
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function runReport(type = reportType) {
    setIsLoading(true);
    setMessage("");

    const params = new URLSearchParams({ type });

    if (dateFrom) {
      params.set("from", dateFrom);
    }

    if (dateTo) {
      params.set("to", dateTo);
    }

    const response = await fetch(`/api/reports?${params.toString()}`);
    const result = (await response.json()) as ReportResult | { error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setReportResult(null);
      setMessage("error" in result ? result.error ?? "Unable to generate report" : "Unable to generate report");
      return;
    }

    setReportResult(result as ReportResult);
    setMessage(`${type} generated`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select className="h-10 rounded-lg border bg-background px-3" value={reportType} onChange={(event) => setReportType(event.target.value as (typeof reportTypes)[number])}>
            {reportTypes.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <Button onClick={() => runReport()}>{isLoading ? "Running..." : "Run Report"}</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
        {reportTypes.map((name) => (
          <button
            className={`rounded-lg border p-4 text-left transition hover:bg-muted ${reportType === name ? "bg-muted" : ""}`}
            key={name}
            onClick={() => {
              setReportType(name);
              void runReport(name);
            }}
            type="button"
          >
            <h3 className="font-medium">{name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Generate from saved ledger database.</p>
          </button>
        ))}
        </div>
        {reportResult && (
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Rows" value={reportResult.summary.rows} />
            <MetricCard label="Debit" value={formatMoney(reportResult.summary.debit)} />
            <MetricCard label="Credit" value={formatMoney(reportResult.summary.credit)} />
            <MetricCard label="Pending" value={formatMoney(reportResult.summary.pendingBalance)} />
          </div>
        )}
        {message && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}
        {reportResult && <ReportTable rows={reportResult.rows} />}
      </CardContent>
    </Card>
  );
}

function ReportTable({ rows }: { rows: ReportRow[] }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  if (rows.length === 0) {
    return <div className="rounded-lg border p-4 text-sm text-muted-foreground">No report rows found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((column) => (
              <th className="p-3" key={column}>{toTitle(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-b" key={index}>
              {columns.map((column) => (
                <td className="p-3" key={column}>{formatReportValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditLogsPanel() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    async function loadLogs() {
      const response = await fetch("/api/admin/audit-logs");

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { logs: Array<Record<string, unknown>> };
      setLogs(result.logs);
    }

    void loadLogs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Track user actions and record changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left">
                {["Time", "User", "Action", "Status"].map((head) => (
                  <th className="p-3" key={head}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>No audit logs found.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr className="border-b" key={String(log._id)}>
                  <td className="p-3">{String(log.created_at ?? "")}</td>
                  <td className="p-3">{String(log.actor ?? "")}</td>
                  <td className="p-3">{String(log.action ?? "")}</td>
                  <td className="p-3">{String(log.status ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemSettingsPanel({
  adminConfig,
  onAdminConfigChange,
}: {
  adminConfig: AdminConfig;
  onAdminConfigChange: (config: AdminConfig) => void;
}) {
  const [csvOnly, setCsvOnly] = useState(adminConfig.settings.csvOnlyUpload);
  const [approvalRequired, setApprovalRequired] = useState(adminConfig.settings.approvalRequired);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCsvOnly(adminConfig.settings.csvOnlyUpload);
    setApprovalRequired(adminConfig.settings.approvalRequired);
  }, [adminConfig.settings.approvalRequired, adminConfig.settings.csvOnlyUpload]);

  async function saveSettings() {
    const settings = { approvalRequired, csvOnlyUpload: csvOnly };
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      setMessage("Unable to save settings");
      return;
    }

    onAdminConfigChange({ ...adminConfig, settings });
    setMessage("Settings saved");
  }

  async function createIndexes() {
    const response = await fetch("/api/admin/indexes", { method: "POST" });
    setMessage(response.ok ? "Database indexes checked/created" : "Unable to create indexes");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>App-wide configuration status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <SettingRow label="Authentication" value="Session cookie enabled" />
          <SettingRow label="Database" value="MongoDB required for live data" />
          <ToggleSetting checked={csvOnly} label="CSV Only Upload" onChange={setCsvOnly} />
          <ToggleSetting checked={approvalRequired} label="Approval Required" onChange={setApprovalRequired} />
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">Admin settings are editable and saved to MongoDB admin config.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={createIndexes}>Create Indexes</Button>
            <Button onClick={saveSettings}>Save Settings</Button>
          </div>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}

function ModuleSummaryPanel({ module }: { module: AppModule }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{module.title}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          {module.title} response will show here on the same page.
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function MasterPreview({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="rounded-md bg-muted px-2 py-1 text-xs" key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function ToggleSetting({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border p-4">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{checked ? "Enabled" : "Disabled"}</span>
      </span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatReportValue(value: number | string | undefined) {
  return typeof value === "number" ? formatMoney(value) : value ?? "";
}

function toTitle(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

type SidebarButtonProps = {
  description: string;
  isActive: boolean;
  onClick: () => void;
  title: string;
};

function SidebarButton({ description, isActive, onClick, title }: SidebarButtonProps) {
  return (
    <button
      className={`rounded-lg px-2 py-2 text-left transition hover:bg-muted ${
        isActive ? "bg-muted text-foreground" : "text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
