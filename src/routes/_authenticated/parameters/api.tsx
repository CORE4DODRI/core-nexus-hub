import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/_authenticated/parameters/api")({
  head: () => ({
    meta: [
      { title: "API & Integrations — DODRI Platform Core" },
      { name: "description", content: "How external systems and modules integrate with the DODRI Core." },
      { property: "og:title", content: "API & Integrations — DODRI Platform Core" },
      { property: "og:description", content: "Integration surface of the Core." },
    ],
  }),
  component: ApiPage,
});

const SURFACES = [
  {
    name: "Core Data API",
    description: "Authenticated access to users, roles, modules and connections, protected by row-level security.",
    status: "online",
  },
  {
    name: "Module Registry API",
    description: "Modules declare themselves, their permissions and their routes through the registry.",
    status: "online",
  },
  {
    name: "Connection Layer",
    description: "Module-to-Core and module-to-module channels with explicitly granted permissions.",
    status: "online",
  },
  {
    name: "Webhooks",
    description: "Inbound endpoints for future modules. Not enabled in the Core release.",
    status: "inactive",
  },
];

function ApiPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Parameters"
        title="API & Integrations"
        description="The contract future modules use to plug into the Core."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SURFACES.map((s) => (
          <div key={s.name} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display font-semibold">{s.name}</div>
              <StatusBadge label={s.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
