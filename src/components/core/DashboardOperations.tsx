import { Link } from "@tanstack/react-router";
import {
  Activity,
  Cable,
  FileCode2,
  Folder,
  FolderOpen,
  Grid3X3,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ConnectionRow, ModuleRow } from "@/hooks/useCore";
import { moduleIcon } from "@/lib/dodri/icons";

export function RegistryPanel({ modules }: { modules: ModuleRow[] }) {
  return (
    <section className="panel flex min-h-[430px] flex-col overflow-hidden p-3 xl:min-h-0">
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div>
          <div className="section-title">Module Registry</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">CORE / REGISTERED</div>
        </div>
        <span className="status-counter">{modules.length}</span>
      </div>

      <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <FolderOpen className="h-4 w-4 text-primary" />
          dodri-core
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1 text-xs">
        <div className="registry-row pl-1 font-semibold">
          <Folder className="text-warning" /> modules
        </div>
        {modules.length === 0 && (
          <div className="py-5 text-center text-xs text-muted-foreground">No modules installed</div>
        )}
        {modules.map((module) => {
          const Icon = moduleIcon(module.icon);
          return (
            <Link
              key={module.id}
              to="/modules/$slug"
              params={{ slug: module.slug }}
              className="registry-row ml-3"
            >
              <Icon className="text-primary" />
              <span className="min-w-0 flex-1 truncate">{module.name}</span>
              <span className={module.enabled ? "status-dot bg-success" : "status-dot bg-muted-foreground/50"} />
            </Link>
          );
        })}
        <div className="registry-row pl-1 font-semibold">
          <Folder className="text-warning" /> configuration
        </div>
        <div className="registry-row ml-3 text-muted-foreground">
          <FileCode2 className="text-cyan" /> system.settings
        </div>
        <div className="registry-row ml-3 text-muted-foreground">
          <ShieldCheck className="text-violet" /> access.policies
        </div>
      </div>

      <Button
        asChild
        className="mt-3 w-full text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
        style={{ background: "var(--gradient-brand)" }}
      >
        <Link to="/parameters/modules">
          <Plus /> Add New Module
        </Link>
      </Button>
    </section>
  );
}

export function CoreTelemetry({
  modules,
  connections,
  activeUsers,
}: {
  modules: ModuleRow[];
  connections: ConnectionRow[];
  activeUsers: number;
}) {
  const activeModules = modules.filter((module) => module.enabled && module.status === "active").length;
  const activeConnections = connections.filter((connection) => connection.status === "active").length;
  const errors = connections.filter((connection) => connection.status === "error").length;

  return (
    <aside className="flex min-h-0 flex-col gap-3">
      <section className="panel overflow-hidden p-3">
        <div className="section-title border-b border-border/70 pb-3">Core Telemetry</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TelemetryCell label="Modules online" value={activeModules} />
          <TelemetryCell label="Active users" value={activeUsers} />
          <TelemetryCell label="Connections" value={activeConnections} />
          <TelemetryCell label="Alerts" value={errors} alert={errors > 0} />
        </div>
      </section>

      <section className="panel flex flex-1 flex-col overflow-hidden p-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="section-title">System Stream</div>
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="telemetry-grid mt-3 flex-1 rounded-md border border-primary/15 bg-secondary/60 p-3 font-mono text-[10px] leading-6 text-muted-foreground">
          <p><span className="text-primary">CORE</span> orchestration ready</p>
          <p><span className="text-cyan">AUTH</span> identity service online</p>
          <p><span className="text-success">REGISTRY</span> {modules.length} entries indexed</p>
          <p><span className="text-violet">NETWORK</span> {activeConnections} active links</p>
          <p><span className={errors ? "text-destructive" : "text-success"}>HEALTH</span> {errors ? `${errors} alert detected` : "all checks passed"}</p>
          <div className="mt-4 h-px bg-primary/20" />
          <div className="mt-4 flex items-center gap-2 text-foreground">
            <span className="status-dot bg-success shadow-[0_0_10px_var(--success)]" />
            Listening for module events
          </div>
        </div>
      </section>
    </aside>
  );
}

function TelemetryCell({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-md border border-border/80 bg-card/75 px-3 py-2 text-center shadow-[var(--shadow-soft)]">
      <div className="label-tech text-[8px]">{label}</div>
      <div className={alert ? "mt-1 font-display text-xl font-bold text-destructive" : "mt-1 font-display text-xl font-bold text-primary"}>
        {value}
      </div>
    </div>
  );
}

export function SystemResources({ modules, connections }: { modules: ModuleRow[]; connections: ConnectionRow[] }) {
  const moduleCapacity = Math.min(100, Math.max(8, modules.filter((m) => m.enabled).length * 12));
  const connectionHealth = connections.length
    ? Math.round((connections.filter((c) => c.status === "active").length / connections.length) * 100)
    : 100;
  const registryHealth = modules.length ? 100 : 0;

  return (
    <section className="panel p-3">
      <div className="section-title mb-3">System Resources</div>
      <div className="grid grid-cols-3 gap-3">
        <Resource label="Registry" value={registryHealth} />
        <Resource label="Capacity" value={moduleCapacity} />
        <Resource label="Network" value={connectionHealth} />
      </div>
    </section>
  );
}

function Resource({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

export function QuickActions() {
  const actions = [
    { label: "Add Module", icon: Plus, to: "/parameters/modules" as const },
    { label: "Manage Modules", icon: Grid3X3, to: "/parameters/modules" as const },
    { label: "System Settings", icon: Settings2, to: "/parameters/system" as const },
    { label: "View Logs", icon: Activity, to: "/administration/activity-logs" as const },
    { label: "Manage Users", icon: Users, to: "/administration/users" as const },
    { label: "Connections", icon: Cable, to: "/parameters/connections" as const },
  ];

  return (
    <section className="panel p-3">
      <div className="section-title mb-3">Quick Actions</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button key={action.label} variant="outline" asChild className="h-9 justify-start bg-card/70 px-2 text-[10px]">
            <Link to={action.to}>
              <action.icon className="text-primary" />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}