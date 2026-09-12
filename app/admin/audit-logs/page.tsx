import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AdminAuditLogsPage() {
  return <ModulePlaceholder title="Audit Logs" description="Track user actions and record changes." permission="audit:view" />;
}
