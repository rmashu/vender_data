import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

type AppShellProps = {
  title: string;
  description?: string;
  userEmail?: string;
  children: React.ReactNode;
};

export function AppShell({ title, description, userEmail, children }: AppShellProps) {
  return (
    <main className="min-h-screen w-full space-y-4 p-3 sm:p-4 lg:p-6">
      <header className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {userEmail && <p className="text-sm text-muted-foreground">{userEmail}</p>}
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted" href="/dashboard">
            Dashboard
          </Link>
          <Link className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted" href="/ledger">
            Ledger
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
