import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { moduleIcon } from "@/lib/dodri/icons";
import { useConnections, useModules } from "@/hooks/useCore";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/modules/$slug")({
  head: () => ({
    meta: [
      { title: "Module — DODRI Platform Core" },
      { name: "description", content: "Registered module details inside the DODRI Core." },
      { property: "og:title", content: "Module — DODRI Platform Core" },
      { property: "og:description", content: "Registered module details." },
    ],
  }),
  component: ModulePage,
});

function ModulePage() {
  const { slug } = Route.useParams();
  const modules = useModules();
  const connections = useConnections();
  const module = (modules.data ?? []).find((m) => m.slug === slug);

  if (!module) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-sm text-muted-foreground">This module is not registered in the Core.</p>
        <Button asChild className="mt-4">
          <Link to="/parameters/modules">Open module registry</Link>
        </Button>
      </div>
    );
  }

  const Icon = moduleIcon(module.icon);
  const links = (connections.data ?? []).filter(
    (c) => c.source_module_id === module.id || c.target_module_id === module.id,
  );

  return (
    <div>
      <PageHeader
        eyebrow="Module"
        title={module.name}
        description={module.description ?? "No description provided."}
        actions={<StatusBadge label={module.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel flex items-center gap-3 p-5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="label-tech">Registry entry</div>
            <div className="text-sm font-semibold">{module.slug}</div>
          </div>
        </div>
        <div className="panel p-5">
          <div className="label-tech">Version</div>
          <div className="mt-1 font-display text-xl font-bold">{module.version}</div>
        </div>
        <div className="panel p-5">
          <div className="label-tech">Connections</div>
          <div className="mt-1 font-display text-xl font-bold">{links.length}</div>
        </div>
      </div>

      <div className="panel mt-4 p-5 text-sm text-muted-foreground">
        The Core exposes this module through navigation, permissions and the connection layer. Its
        business features are delivered by the module itself once it ships.
      </div>
    </div>
  );
}
