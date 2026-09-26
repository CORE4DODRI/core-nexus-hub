import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useConnections, useModules, useSystemSettings } from "@/hooks/useCore";

export const Route = createFileRoute("/_authenticated/parameters/system")({
  head: () => ({
    meta: [
      { title: "System Configuration — DODRI Platform Core" },
      { name: "description", content: "Runtime configuration and health of the DODRI Core." },
      { property: "og:title", content: "System Configuration — DODRI Platform Core" },
      { property: "og:description", content: "Runtime configuration and health." },
    ],
  }),
  component: SystemPage,
});

function SystemPage() {
  const modules = useModules();
  const connections = useConnections();
  const settings = useSystemSettings();

  const info = [
    { label: "Core version", value: "1.0.0" },
    { label: "Registered modules", value: String((modules.data ?? []).length) },
    { label: "Connections", value: String((connections.data ?? []).length) },
    { label: "Stored settings", value: String((settings.data ?? []).length) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Parameters"
        title="System Configuration"
        description="Runtime state of the Core architecture."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="label-tech mb-3">Runtime</div>
          <ul className="space-y-2 text-sm">
            {info.map((i) => (
              <li key={i.label} className="flex justify-between">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium">{i.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <div className="label-tech mb-3">Services</div>
          <ul className="space-y-2 text-sm">
            {["Authentication", "Database", "Module Registry", "Connection System"].map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="text-muted-foreground">{s}</span>
                <StatusBadge label="online" />
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5 md:col-span-2">
          <div className="label-tech mb-3">Stored settings</div>
          <ul className="space-y-2 font-mono text-xs">
            {(settings.data ?? []).map((s) => (
              <li key={s.id} className="flex justify-between gap-4 border-b border-border/50 py-1">
                <span className="text-primary">{s.key}</span>
                <span className="truncate text-muted-foreground">{JSON.stringify(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
