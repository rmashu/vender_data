import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { AppModule } from "@/backend/auth/modules";

type DashboardSidebarProps = {
  adminModules: AppModule[];
  dashboardModules: AppModule[];
};

export function DashboardSidebar({ adminModules, dashboardModules }: DashboardSidebarProps) {
  return (
    <aside className="rounded-xl border bg-muted/20 p-3">
      <nav className="grid gap-4 text-sm">
        <section>
          <p className="px-2 pb-2 font-medium">Work Area</p>
          <div className="grid gap-1">
            {dashboardModules.map((module) => (
              <Link className="rounded-lg px-2 py-2 hover:bg-muted" href={module.href} key={module.title}>
                <span className="font-medium">{module.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{module.description}</span>
              </Link>
            ))}
          </div>
        </section>

        {adminModules.length > 0 && (
          <section>
            <details className="group" open>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-2 font-medium hover:bg-muted">
                Admin
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1 grid gap-1">
                {adminModules.map((module) => (
                  <Link className="rounded-lg px-2 py-2 hover:bg-muted" href={module.href} key={module.title}>
                    <span className="font-medium">{module.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{module.description}</span>
                  </Link>
                ))}
              </div>
            </details>
          </section>
        )}
      </nav>
    </aside>
  );
}
