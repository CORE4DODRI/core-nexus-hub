import { createFileRoute } from "@tanstack/react-router";
import { Activity, Boxes, Cable, HeartPulse, Users } from "lucide-react";
import { EnergyCore } from "@/components/core/EnergyCore";
import { ModuleWorkspace } from "@/components/core/ModuleWorkspace";
import { ConnectedModules } from "@/components/core/ConnectedModules";
import { ModuleHost } from "@/components/core/ModuleHost";
import { CoreStatusPanel, type ServiceStatus } from "@/components/core/CoreStatusPanel";
import { MetricCards, type Metric } from "@/components/core/MetricCards";
import { RecentActivity, type ActivityRow } from "@/components/core/RecentActivity";
import {
  CoreTelemetry,
  QuickActions,
  RegistryPanel,
  SystemResources,
} from "@/components/core/DashboardOperations";
import { useActivityLogs, useConnections, useModules, useUsers } from "@/hooks/useCore";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { module?: string } => {
    const value = search["module"];
    return typeof value === "string" && value ? { module: value } : {};
  },
  head: () => ({
    meta: [
      { title: "Dashboard — DODRI Platform Core" },
      { name: "description", content: "Live view of the DODRI Core: modules, connections and system health." },
      { property: "og:title", content: "Dashboard — DODRI Platform Core" },
      { property: "og:description", content: "Live view of the DODRI Core." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { module: openSlug } = Route.useSearch();
  const modules = useModules();
  const connections = useConnections();
  const users = useUsers();
  const logs = useActivityLogs(12);

  const moduleRows = modules.data ?? [];
  const connectionRows = connections.data ?? [];
  const userRows = users.data ?? [];
  const openModule = openSlug ? moduleRows.find((m) => m.slug === openSlug && m.enabled) : undefined;

  const activeModules = moduleRows.filter((m) => m.enabled && m.status === "active").length;
  const activeConnections = connectionRows.filter((c) => c.status === "active").length;
  const errored = connectionRows.some((c) => c.status === "error");

  const metrics: Metric[] = [
    { label: "Total Users", value: userRows.length, icon: Users },
    {
      label: "Active Users",
      value: userRows.filter((u) => u.status === "active").length,
      icon: Activity,
    },
    { label: "Active Modules", value: activeModules, icon: Boxes, hint: `${moduleRows.length} registered` },
    { label: "Connections", value: activeConnections, icon: Cable, hint: `${connectionRows.length} total` },
    {
      label: "System Health",
      value: errored ? "Degraded" : "Optimal",
      icon: HeartPulse,
    },
  ];

  const services: ServiceStatus[] = [
    { label: "Core Services", value: "Online", tone: "success" },
    { label: "Database", value: modules.isError ? "Error" : "Online", tone: modules.isError ? "error" : "success" },
    { label: "Authentication", value: "Online", tone: "success" },
    { label: "Module Registry", value: moduleRows.length ? "Online" : "Inactive", tone: moduleRows.length ? "success" : "idle" },
    {
      label: "Connections",
      value: errored ? "Error" : activeConnections ? "Online" : "Inactive",
      tone: errored ? "error" : activeConnections ? "success" : "idle",
    },
    { label: "System", value: errored ? "Warning" : "Optimal", tone: errored ? "warning" : "success" },
  ];

  return (
    <div className="mx-auto max-w-[1700px] space-y-2.5">
      <MetricCards metrics={metrics} />

      {openModule ? (
        <ModuleHost module={openModule} />
      ) : (
        <ModuleWorkspace
          modules={moduleRows}
          center={<EnergyCore modules={moduleRows} connections={connectionRows} />}
          aside={
            <CoreTelemetry
              modules={moduleRows}
              connections={connectionRows}
              activeUsers={userRows.filter((user) => user.status === "active").length}
            />
          }
        />
      )}

      <div className="grid gap-2.5 xl:grid-cols-[230px_minmax(420px,1fr)_330px]">
        <RegistryPanel modules={moduleRows} />
        <div className="grid min-w-0 gap-2.5 md:grid-cols-2">
          <RecentActivity rows={(logs.data ?? []) as ActivityRow[]} dense />
          <SystemResources modules={moduleRows} connections={connectionRows} />
        </div>
        <div className="grid min-w-0 gap-2.5">
          <QuickActions />
          <ConnectedModules modules={moduleRows} connections={connectionRows} />
        </div>
      </div>

      <CoreStatusPanel services={services} />
    </div>
  );
}
