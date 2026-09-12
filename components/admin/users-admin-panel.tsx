"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCcw, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RoleCode, User, UserStatus } from "@/backend/auth/types";
import { stores } from "@/backend/masters/master-data";

const roles: RoleCode[] = ["ADMIN", "MANAGER", "STAFF", "VIEWER"];
const adminLinks = [
  { title: "Users", href: "/admin/users" },
  { title: "Roles", href: "/admin/roles" },
  { title: "Permissions", href: "/admin/permissions" },
  { title: "Data Management", href: "/admin/masters" },
  { title: "Reports", href: "/admin/reports" },
  { title: "Audit Logs", href: "/admin/audit-logs" },
  { title: "System Settings", href: "/admin/settings" },
];

type UsersAdminPanelProps = {
  showSidebar?: boolean;
};

export function UsersAdminPanel({ showSidebar = true }: UsersAdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, RoleCode>>({});
  const [selectedStores, setSelectedStores] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pendingUsers = useMemo(() => users.filter((user) => user.status === "PENDING"), [users]);
  const managedUsers = useMemo(() => users.filter((user) => user.status !== "PENDING"), [users]);

  async function loadUsers() {
    setIsLoading(true);
    const response = await fetch("/api/admin/users");
    const result = (await response.json()) as { users?: User[]; error?: string };
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "Unable to load users");
      return;
    }

    setUsers(result.users ?? []);
    setSelectedRoles(
      Object.fromEntries((result.users ?? []).map((user) => [user.email, user.roleCode])),
    );
    setSelectedStores(
      Object.fromEntries((result.users ?? []).map((user) => [user.email, user.assignedStores])),
    );
  }

  async function approve(email: string) {
    const response = await fetch("/api/admin/users/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roleCode: selectedRoles[email] ?? "VIEWER" }),
    });

    setMessage(response.ok ? "User approved" : "Unable to approve user");
    await loadUsers();
  }

  async function updateStatus(email: string, status: UserStatus) {
    const response = await fetch("/api/admin/users/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, status }),
    });

    setMessage(response.ok ? "User updated" : "Unable to update user");
    await loadUsers();
  }

  async function resetPassword(email: string) {
    const password = window.prompt(`Set new password for ${email}`);

    if (!password) {
      return;
    }

    const response = await fetch("/api/admin/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setMessage(response.ok ? "Password updated" : "Unable to update password");
  }

  function toggleStore(email: string, store: string) {
    setSelectedStores((current) => {
      const userStores = current[email] ?? [];
      const nextStores = userStores.includes(store)
        ? userStores.filter((item) => item !== store)
        : [...userStores, store];

      return { ...current, [email]: nextStores };
    });
  }

  async function saveStores(email: string) {
    const response = await fetch("/api/admin/users/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, assignedStores: selectedStores[email] ?? [] }),
    });

    setMessage(response.ok ? "Stores updated" : "Unable to update stores");
    await loadUsers();
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className={showSidebar ? "grid gap-5 lg:grid-cols-[220px_1fr]" : "grid gap-5"}>
      {showSidebar && (
        <aside className="rounded-xl border bg-muted/30 p-3">
          <p className="px-2 text-sm font-medium">Admin</p>
          <nav className="mt-3 grid gap-1 text-sm">
            {adminLinks.map((item) => (
              <Link className="rounded-lg px-2 py-2 text-left hover:bg-muted aria-current:font-medium aria-current:text-foreground" aria-current={item.href === "/admin/users" ? "page" : undefined} href={item.href} key={item.href}>
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
      )}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Users</h2>
            <p className="text-sm text-muted-foreground">Approve users, assign roles and manage access.</p>
          </div>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </div>

        {message && <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{message}</p>}

        <UserTable
          emptyText={isLoading ? "Loading users..." : "No pending users"}
          onApprove={approve}
          onRoleChange={(email, roleCode) => setSelectedRoles((current) => ({ ...current, [email]: roleCode }))}
          onSaveStores={saveStores}
          onStoreToggle={toggleStore}
          selectedRoles={selectedRoles}
          selectedStores={selectedStores}
          title="Pending Approval"
          users={pendingUsers}
        />

        <UserTable
          emptyText={isLoading ? "Loading users..." : "No active or inactive users"}
          onDeactivate={(email) => updateStatus(email, "INACTIVE")}
          onReactivate={(email) => updateStatus(email, "ACTIVE")}
          onResetPassword={resetPassword}
          onRoleChange={(email, roleCode) => setSelectedRoles((current) => ({ ...current, [email]: roleCode }))}
          onSaveStores={saveStores}
          onStoreToggle={toggleStore}
          selectedRoles={selectedRoles}
          selectedStores={selectedStores}
          title="All Users"
          users={managedUsers}
        />
      </section>
    </div>
  );
}

type UserTableProps = {
  emptyText: string;
  onApprove?: (email: string) => void;
  onDeactivate?: (email: string) => void;
  onReactivate?: (email: string) => void;
  onResetPassword?: (email: string) => void;
  onRoleChange: (email: string, roleCode: RoleCode) => void;
  onSaveStores: (email: string) => void;
  onStoreToggle: (email: string, store: string) => void;
  selectedRoles: Record<string, RoleCode>;
  selectedStores: Record<string, string[]>;
  title: string;
  users: User[];
};

function UserTable({
  emptyText,
  onApprove,
  onDeactivate,
  onReactivate,
  onResetPassword,
  onRoleChange,
  onSaveStores,
  onStoreToggle,
  selectedRoles,
  selectedStores,
  title,
  users,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="border-b p-3">
        <h3 className="font-medium">{title}</h3>
      </div>
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b text-left">
            {["Name", "Email", "Status", "Role", "Stores", "Action"].map((head) => (
              <th className="p-3" key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td className="p-3 text-muted-foreground" colSpan={6}>{emptyText}</td>
            </tr>
          )}
          {users.map((user) => (
            <tr className="border-b" key={user.email}>
              <td className="p-3">{user.name}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.status}</td>
              <td className="p-3">
                <Select value={selectedRoles[user.email] ?? user.roleCode} onValueChange={(value) => onRoleChange(user.email, value as RoleCode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-3">
                <StoreMultiSelect
                  assignedStores={selectedStores[user.email] ?? user.assignedStores}
                  disabled={(selectedRoles[user.email] ?? user.roleCode) === "ADMIN"}
                  onSave={() => onSaveStores(user.email)}
                  onToggle={(store) => onStoreToggle(user.email, store)}
                />
              </td>
              <td className="flex gap-2 p-3">
                {onApprove && (
                  <Button size="sm" onClick={() => onApprove(user.email)}>
                    <Check className="size-4" />
                    Approve
                  </Button>
                )}
                {user.status === "ACTIVE" && onDeactivate && (
                  <Button size="sm" variant="outline" onClick={() => onDeactivate(user.email)}>
                    <UserX className="size-4" />
                    Inactive
                  </Button>
                )}
                {user.status === "INACTIVE" && onReactivate && (
                  <Button size="sm" variant="outline" onClick={() => onReactivate(user.email)}>
                    Reactivate
                  </Button>
                )}
                {onResetPassword && (
                  <Button size="sm" variant="outline" onClick={() => onResetPassword(user.email)}>
                    Reset Password
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StoreMultiSelect({
  assignedStores,
  disabled,
  onSave,
  onToggle,
}: {
  assignedStores: string[];
  disabled: boolean;
  onSave: () => void;
  onToggle: (store: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const storeList = Array.from(new Set(stores));

  if (disabled) {
    return <span className="rounded-md bg-muted px-2 py-1 text-xs">All stores</span>;
  }

  return (
    <div className="relative min-w-52">
      <button className="flex h-8 w-full items-center justify-between rounded-lg border px-2 text-left" onClick={() => setIsOpen((current) => !current)} type="button">
        <span>{assignedStores.length} stores selected</span>
        <span>⌄</span>
      </button>
      {isOpen && (
        <div className="absolute z-30 mt-2 max-h-72 w-64 overflow-y-auto rounded-lg border bg-background p-2 shadow-lg">
          {storeList.map((store) => (
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-muted" key={store}>
              <input checked={assignedStores.includes(store)} onChange={() => onToggle(store)} type="checkbox" />
              <span>{store}</span>
            </label>
          ))}
          <div className="sticky bottom-0 mt-2 border-t bg-background pt-2">
            <Button className="w-full" size="sm" onClick={onSave}>Save Stores</Button>
          </div>
        </div>
      )}
    </div>
  );
}
