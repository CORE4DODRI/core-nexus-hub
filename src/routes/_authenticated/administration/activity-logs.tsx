import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { RecentActivity, type ActivityRow } from "@/components/core/RecentActivity";
import { useActivityLogs } from "@/hooks/useCore";

export const Route = createFileRoute("/_authenticated/administration/activity-logs")({
  head: () => ({
    meta: [
      { title: "Activity Logs — DODRI Platform Core" },
      { name: "description", content: "Audit trail of logins, users, roles, modules and connections." },
      { property: "og:title", content: "Activity Logs — DODRI Platform Core" },
      { property: "og:description", content: "Audit trail of Core events." },
    ],
  }),
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  const logs = useActivityLogs(200);
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Activity Logs" description="Every Core event, recorded." />
      <RecentActivity rows={(logs.data ?? []) as ActivityRow[]} />
    </div>
  );
}
