"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AppModule } from "@/backend/auth/modules";
import { rolePermissions, roles } from "@/backend/auth/seed";
import { stores, vendors } from "@/backend/masters/master-data";
import type { PermissionCode, RoleCode, User } from "@/backend/auth/types";
import type { Ledger } from "@/backend/ledger";
import { UsersAdminPanel } from "@/components/admin/users-admin-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

type RecordsResult = {
  rows: ReportRow[];
  summary: {
    batches: number;
    pendingBalance: number;
    rows: number;
    todayUploads: number;
  };
};

type LedgerBatchDetail = {
  batch: string;
  createdAt: string;
  dateFrom: string;
  dateTo: string;
  ledgers: Ledger[];
  store: string;
  vendor: string;
};

const reportTypes = ["Vendor Report", "Store Report", "Date Range Report", "Pending Balance", "Upload Batch", "Credit Notes"] as const;
const reportDescriptions: Record<(typeof reportTypes)[number], string> = {
  "Credit Notes": "Credit note and credit transaction listing",
  "Date Range Report": "Invoice level entries between selected dates",
  "Pending Balance": "Open invoices with remaining pending balance",
  "Store Report": "Store-wise debit, credit and pending totals",
  "Upload Batch": "Saved CSV upload batches from MongoDB",
  "Vendor Report": "Vendor-wise debit, credit and pending totals",
};

export function DashboardWorkspace({ adminModules, dashboardModules, permissions, user }: DashboardWorkspaceProps) {
  const workItems = useMemo(() => dashboardModules.map((module) => toWorkspaceItem(module, "work")), [dashboardModules]);
  const adminItems = useMemo(() => adminModules.map((module) => toWorkspaceItem(module, "admin")), [adminModules]);
  const items = useMemo(() => [...workItems, ...adminItems], [adminItems, workItems]);
  const workMenuItems = useMemo(() => workItems.filter((item) => item.module.title !== "Reports"), [workItems]);
  const reportMenuItems = useMemo(() => items.filter((item) => item.module.title === "Reports"), [items]);
  const adminMenuItems = useMemo(() => adminItems.filter((item) => item.module.title !== "Reports"), [adminItems]);
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
    <div className="grid min-h-[calc(100vh-140px)] gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl border bg-muted/20 p-3 sm:p-4 xl:sticky xl:top-4">
        <details className="mt-5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
            Work Area
            <ChevronDown className="size-4" />
          </summary>
          <nav className="mt-3 grid gap-1">
            {workMenuItems.map((item) => (
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

        {reportMenuItems.length > 0 && (
          <details className="mt-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              Reports
              <ChevronDown className="size-4" />
            </summary>
            <nav className="mt-3 grid gap-1">
              {reportMenuItems.map((item) => (
                <SidebarButton
                  description={item.module.description}
                  isActive={selectedKey === item.key}
                  key={item.key}
                  onClick={() => setSelectedKey(item.key)}
                  title={item.section === "admin" ? "Admin Reports" : "Reports"}
                />
              ))}
            </nav>
          </details>
        )}

        {adminMenuItems.length > 0 && (
          <details className="mt-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              Admin
              <ChevronDown className="size-4" />
            </summary>
            <nav className="mt-3 grid gap-1">
              {adminMenuItems.map((item) => (
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

      <section className="min-w-0 space-y-4">
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
  const [work, setWork] = useState<RecordsResult | null>(null);

  useEffect(() => {
    async function loadWork() {
      const response = await fetch("/api/my-work");

      if (response.ok) {
        setWork((await response.json()) as RecordsResult);
      }
    }

    void loadWork();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Work</CardTitle>
        <CardDescription>Assigned ledger uploads and pending tasks for {user.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="My Batches" value={work?.summary.batches ?? 0} />
          <MetricCard label="My Rows" value={work?.summary.rows ?? 0} />
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
        {work && <ReportTable reportType="My Uploaded Batches" rows={work.rows} />}
      </CardContent>
    </Card>
  );
}

function AllRecordsPanel() {
  const [query, setQuery] = useState("");
  const [store, setStore] = useState("");
  const [records, setRecords] = useState<RecordsResult | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<LedgerBatchDetail | null>(null);
  const [detailMessage, setDetailMessage] = useState("");

  async function searchRecords() {
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (store) {
      params.set("store", store);
    }

    const response = await fetch(`/api/records?${params.toString()}`);

    if (response.ok) {
      setRecords((await response.json()) as RecordsResult);
      setSelectedBatch(null);
      setDetailMessage("");
    }
  }

  async function openBatch(row: ReportRow) {
    const batch = String(row.batch ?? "");

    if (!batch) {
      return;
    }

    setDetailMessage("Loading related entries...");
    const response = await fetch(`/api/records/${encodeURIComponent(batch)}`);

    if (!response.ok) {
      setDetailMessage("Unable to load related entries");
      return;
    }

    setSelectedBatch((await response.json()) as LedgerBatchDetail);
    setDetailMessage("");
  }

  async function saveLedgerEntry(ledger: Ledger) {
    if (!selectedBatch) {
      return;
    }

    const validationError = validateLedgerEntry(ledger);
    if (validationError) {
      setDetailMessage(validationError);
      return;
    }

    setDetailMessage("Saving changes...");
    const response = await fetch(`/api/records/${encodeURIComponent(selectedBatch.batch)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ledger, ledgerId: ledger.id }),
    });

    if (!response.ok) {
      setDetailMessage("Unable to save changes");
      return;
    }

    setSelectedBatch((await response.json()) as LedgerBatchDetail);
    setDetailMessage("Changes saved");
  }

  async function saveAllLedgerEntries() {
    if (!selectedBatch) {
      return;
    }

    const validationError = selectedBatch.ledgers.map(validateLedgerEntry).find(Boolean);
    if (validationError) {
      setDetailMessage(validationError);
      return;
    }

    setDetailMessage("Saving all changes...");

    for (const ledger of selectedBatch.ledgers) {
      const response = await fetch(`/api/records/${encodeURIComponent(selectedBatch.batch)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ledger, ledgerId: ledger.id }),
      });

      if (!response.ok) {
        setDetailMessage(`Unable to save invoice ${ledger.invoice_no}`);
        return;
      }
    }

    const response = await fetch(`/api/records/${encodeURIComponent(selectedBatch.batch)}`);
    if (response.ok) {
      setSelectedBatch((await response.json()) as LedgerBatchDetail);
    }
    setDetailMessage("All changes saved");
  }

  function updateLedgerDraft(ledgerId: number, field: keyof Ledger, value: string) {
    setSelectedBatch((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ledgers: current.ledgers.map((ledger) =>
          ledger.id === ledgerId
            ? {
                ...ledger,
                [field]: ["credit", "debit", "pending_balance"].includes(field) ? Number(value) : value,
              }
            : ledger,
        ),
      };
    });
  }

  useEffect(() => {
    void searchRecords();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Records</CardTitle>
        <CardDescription>Search ledger records across allowed stores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Search vendor, batch or store" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input placeholder="Store code/name" value={store} onChange={(event) => setStore(event.target.value)} />
          <Button onClick={searchRecords}>Search</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Batches" value={records?.summary.batches ?? 0} />
          <MetricCard label="Rows" value={records?.summary.rows ?? 0} />
          <MetricCard label="Today Uploads" value={records?.summary.todayUploads ?? 0} />
        </div>
        {records && <ReportTable onRowClick={openBatch} reportType="All Records" rows={records.rows} />}
        {detailMessage && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{detailMessage}</p>}
        {selectedBatch && (
          <LedgerEntriesPanel batch={selectedBatch} onSave={saveLedgerEntry} onSaveAll={saveAllLedgerEntries} onUpdate={updateLedgerDraft} />
        )}
      </CardContent>
    </Card>
  );
}

function UserReportsPanel() {
  return <ReportsPanel description="Vendor, store and date-wise user reports." title="Reports" />;
}

function AnalysisPanel() {
  const [kpis, setKpis] = useState<RecordsResult["summary"] | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorAnalysis, setVendorAnalysis] = useState<ReportResult | null>(null);
  const [storeAnalysis, setStoreAnalysis] = useState<ReportResult | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<ReportResult | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadKpis() {
      const response = await fetch("/api/dashboard-kpis");

      if (response.ok) {
        setKpis((await response.json()) as RecordsResult["summary"]);
      }
    }

    void loadKpis();
    void runAnalysis();
  }, []);

  async function fetchAnalysis(type: (typeof reportTypes)[number]) {
    const params = new URLSearchParams({ type });

    if (dateFrom) {
      params.set("from", dateFrom);
    }

    if (dateTo) {
      params.set("to", dateTo);
    }

    if (vendorFilter) {
      params.set("vendor", vendorFilter);
    }

    if (storeFilter) {
      params.set("store", storeFilter);
    }

    if (statusFilter) {
      params.set("status", statusFilter);
    }

    const response = await fetch(`/api/reports?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Unable to generate ${type}`);
    }

    return (await response.json()) as ReportResult;
  }

  async function runAnalysis() {
    setIsLoading(true);
    setMessage("");

    try {
      const [vendorResult, storeResult, pendingResult] = await Promise.all([
        fetchAnalysis("Vendor Report"),
        fetchAnalysis("Store Report"),
        fetchAnalysis("Pending Balance"),
      ]);
      setVendorAnalysis(vendorResult);
      setStoreAnalysis(storeResult);
      setPendingAnalysis(pendingResult);
      setMessage("Analysis generated from MongoDB");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate analysis");
    } finally {
      setIsLoading(false);
    }
  }

  function resetAnalysisFilters() {
    setDateFrom("");
    setDateTo("");
    setVendorFilter("");
    setStoreFilter("");
    setStatusFilter("");
    setMessage("Filters cleared. Run analysis again.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis</CardTitle>
        <CardDescription>MongoDB based KPI cards, charts and searchable ledger reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="Pending Balance" value={formatMoney(kpis?.pendingBalance ?? 0)} />
          <MetricCard label="Batches" value={kpis?.batches ?? 0} />
          <MetricCard label="Ledger Rows" value={kpis?.rows ?? 0} />
          <MetricCard label="Vendor Rows" value={vendorAnalysis?.summary.rows ?? 0} />
          <MetricCard label="Today Uploads" value={kpis?.todayUploads ?? 0} />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            <Input placeholder="Vendor search" value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} />
            <Input placeholder="Store search" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)} />
            <Select value={statusFilter || "ALL"} onValueChange={(value) => setStatusFilter(value === "ALL" ? "" : value ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["ALL", "PENDING", "PARTIAL", "COMPLETED", "DISPUTED"].map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={runAnalysis}>{isLoading ? "Running..." : "Run"}</Button>
              <Button variant="outline" onClick={resetAnalysisFilters}>Clear</Button>
            </div>
          </div>
        </div>

        {message && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}

        <div className="grid gap-4 xl:grid-cols-2">
          <AnalysisChart title="Top Vendors by Pending" labelKey="vendor" rows={vendorAnalysis?.rows ?? []} />
          <AnalysisChart title="Store Pending Summary" labelKey="store" rows={storeAnalysis?.rows ?? []} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {vendorAnalysis && <ReportTable reportType="Vendor Analysis" rows={vendorAnalysis.rows.slice(0, 10)} />}
          {pendingAnalysis && <ReportTable reportType="Pending Invoice Analysis" rows={pendingAnalysis.rows.slice(0, 10)} />}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsPanel() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    async function loadNotifications() {
      const response = await fetch("/api/notifications");

      if (response.ok) {
        const result = (await response.json()) as { logs: Array<Record<string, unknown>> };
        setLogs(result.logs);
      }
    }

    void loadNotifications();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Alerts for uploads, approvals and changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 && (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            No notifications right now.
          </div>
        )}
        <div className="grid gap-2">
          {logs.map((log) => (
            <div className="rounded-lg border p-3 text-sm" key={String(log._id)}>
              <p className="font-medium">{String(log.action ?? "Activity")}</p>
              <p className="text-muted-foreground">{String(log.actor ?? "")} · {String(log.status ?? "")}</p>
            </div>
          ))}
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
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleCode)}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
              {roleCodes.map((roleCode) => (
                <SelectItem key={roleCode} value={roleCode}>{roleCode}</SelectItem>
              ))}
              </SelectContent>
            </Select>
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
  const [vendorFilter, setVendorFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

    if (vendorFilter) {
      params.set("vendor", vendorFilter);
    }

    if (storeFilter) {
      params.set("store", storeFilter);
    }

    if (statusFilter) {
      params.set("status", statusFilter);
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

  function exportCsv() {
    if (!reportResult?.rows.length) {
      setMessage("No rows available to export");
      return;
    }

    const columns = Array.from(new Set(reportResult.rows.flatMap((row) => Object.keys(row))));
    const csvRows = [
      columns.join(","),
      ...reportResult.rows.map((row) =>
        columns
          .map((column) => `"${String(row[column] ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportType.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <span className="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">DB: vendor_ledger</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={reportType}
            onValueChange={(value) => {
              setReportType(value as (typeof reportTypes)[number]);
              setReportResult(null);
              setMessage("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
            {reportTypes.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <Input placeholder="Vendor filter" value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} />
          <Input placeholder="Store filter" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)} />
          <Select value={statusFilter || "ALL"} onValueChange={(value) => setStatusFilter(value === "ALL" ? "" : value as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["ALL", "PENDING", "PARTIAL", "COMPLETED", "DISPUTED"].map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => runReport()}>{isLoading ? "Running..." : "Run Report"}</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          </div>
        </div>
        <div className="grid gap-3">
          <ReportTypeCard title={reportType} />
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
        {reportResult && <ReportTable reportType={reportType} rows={reportResult.rows} />}
      </CardContent>
    </Card>
  );
}

function ReportTypeCard({ title }: { title: (typeof reportTypes)[number] }) {
  return (
    <div className="rounded-xl border border-primary bg-muted p-4 ring-2 ring-ring/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Selected report. Click Run Report to generate data.</p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-[10px] text-muted-foreground">Mongo</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{reportDescriptions[title]}</p>
    </div>
  );
}

function LedgerEntriesPanel({
  batch,
  onSave,
  onSaveAll,
  onUpdate,
}: {
  batch: LedgerBatchDetail;
  onSave: (ledger: Ledger) => void;
  onSaveAll: () => void;
  onUpdate: (ledgerId: number, field: keyof Ledger, value: string) => void;
}) {
  const summary = getLedgerSummary(batch.ledgers);

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 p-4">
        <div>
          <h3 className="font-medium">Related Ledger Entries</h3>
          <p className="text-sm text-muted-foreground">
            {batch.vendor} · {batch.store} · {batch.batch}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportLedgerEntries(batch)}>Export Batch CSV</Button>
          <Button size="sm" onClick={onSaveAll}>Save All Changes</Button>
        </div>
      </div>
      <div className="grid gap-3 border-b p-4 md:grid-cols-5">
        <MetricCard label="Entries" value={batch.ledgers.length} />
        <MetricCard label="Pending" value={summary.pending} />
        <MetricCard label="Partial" value={summary.partial} />
        <MetricCard label="Completed" value={summary.completed} />
        <MetricCard label="Pending Amount" value={formatMoney(summary.pendingAmount)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b text-left">
              {["Invoice", "Date", "Type", "Debit", "Credit", "Pending", "Status", "Action"].map((head) => (
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground" key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batch.ledgers.map((ledger) => (
              <tr className="border-b" key={ledger.id}>
                <td className="p-2">
                  <Input value={ledger.invoice_no} onChange={(event) => onUpdate(ledger.id, "invoice_no", event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="date" value={ledger.invoice_date} onChange={(event) => onUpdate(ledger.id, "invoice_date", event.target.value)} />
                </td>
                <td className="p-2">
                  <Input value={ledger.vch_type} onChange={(event) => onUpdate(ledger.id, "vch_type", event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="number" value={ledger.debit} onChange={(event) => onUpdate(ledger.id, "debit", event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="number" value={ledger.credit} onChange={(event) => onUpdate(ledger.id, "credit", event.target.value)} />
                </td>
                <td className="p-2">
                  <Input type="number" value={ledger.pending_balance} onChange={(event) => onUpdate(ledger.id, "pending_balance", event.target.value)} />
                </td>
                <td className="p-2">
                  <Select value={ledger.status || "PENDING"} onValueChange={(value) => onUpdate(ledger.id, "status", value ?? "PENDING")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {["PENDING", "PARTIAL", "COMPLETED", "DISPUTED"].map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <Button size="sm" onClick={() => onSave(ledger)}>Save</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalysisChart({ labelKey, rows, title }: { labelKey: string; rows: ReportRow[]; title: string }) {
  const chartRows = rows.slice(0, 8);
  const maxValue = Math.max(...chartRows.map((row) => toReportNumber(row.pendingBalance)), 1);

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{chartRows.length} rows from generated report</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs">Chart</span>
      </div>
      {chartRows.length === 0 ? (
        <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">Run analysis to show chart data.</p>
      ) : (
        <div className="grid gap-3">
          {chartRows.map((row, index) => {
            const value = toReportNumber(row.pendingBalance);
            const width = Math.max((value / maxValue) * 100, 4);

            return (
              <div className="grid gap-1" key={`${String(row[labelKey] ?? index)}-${index}`}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{String(row[labelKey] ?? "Unknown")}</span>
                  <span className="text-muted-foreground">{formatMoney(value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReportTable({ onRowClick, reportType, rows }: { onRowClick?: (row: ReportRow) => void; reportType: string; rows: ReportRow[] }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  if (rows.length === 0) {
    return <div className="rounded-xl border bg-muted/20 p-6 text-center text-sm text-muted-foreground">No rows found for {reportType}.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-muted/30 p-3">
        <div>
          <h3 className="font-medium">{reportType}</h3>
          <p className="text-sm text-muted-foreground">{rows.length} rows from saved ledger data</p>
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b text-left">
            {columns.map((column) => (
              <th className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground" key={column}>{toTitle(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={`border-b transition-colors hover:bg-muted/30 ${onRowClick ? "cursor-pointer" : ""}`}
              key={index}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td className="p-3" key={column}>
                  {column === "batch" && onRowClick ? (
                    <button className="font-medium text-primary underline-offset-4 hover:underline" type="button">
                      {formatReportValue(row[column])}
                    </button>
                  ) : (
                    formatReportValue(row[column])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
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

function toReportNumber(value: number | string | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "0").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateLedgerEntry(ledger: Ledger) {
  if (!ledger.invoice_no.trim()) {
    return "Invoice number is required";
  }

  if (!ledger.invoice_date.trim()) {
    return `Invoice date is required for ${ledger.invoice_no}`;
  }

  if (ledger.debit < 0 || ledger.credit < 0 || ledger.pending_balance < 0) {
    return `Amount cannot be negative for ${ledger.invoice_no}`;
  }

  return "";
}

function getLedgerSummary(ledgers: Ledger[]) {
  return ledgers.reduce(
    (summary, ledger) => {
      const status = ledger.status.toUpperCase();

      return {
        completed: summary.completed + (status === "COMPLETED" ? 1 : 0),
        partial: summary.partial + (status === "PARTIAL" ? 1 : 0),
        pending: summary.pending + (status === "PENDING" ? 1 : 0),
        pendingAmount: summary.pendingAmount + ledger.pending_balance,
      };
    },
    { completed: 0, partial: 0, pending: 0, pendingAmount: 0 },
  );
}

function exportLedgerEntries(batch: LedgerBatchDetail) {
  const columns: Array<keyof Ledger> = ["invoice_no", "invoice_date", "vch_type", "debit", "credit", "pending_balance", "status"];
  const csvRows = [
    ["batch", "vendor", "store", ...columns].join(","),
    ...batch.ledgers.map((ledger) =>
      [batch.batch, batch.vendor, batch.store, ...columns.map((column) => ledger[column])]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${batch.batch}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
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
      className={`w-full rounded-lg px-2 py-2 text-left transition hover:bg-muted ${
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
