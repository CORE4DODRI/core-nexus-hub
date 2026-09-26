import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/hooks/useCore";

export const Route = createFileRoute("/_authenticated/administration/permissions")({
  head: () => ({
    meta: [
      { title: "Permissions — DODRI Platform Core" },
      { name: "description", content: "Granular core and module permissions enforced by the database." },
      { property: "og:title", content: "Permissions — DODRI Platform Core" },
      { property: "og:description", content: "Granular permissions catalogue." },
    ],
  }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const permissions = usePermissions();
  const groups = new Map<string, { code: string; description: string | null }[]>();
  for (const p of permissions.data ?? []) {
    const list = groups.get(p.group_name) ?? [];
    list.push({ code: p.code, description: p.description });
    groups.set(p.group_name, list);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Permissions"
        description="Future modules register their own permissions into this same catalogue."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...groups.entries()].map(([group, items]) => (
          <div key={group} className="panel p-5">
            <div className="label-tech mb-3">{group}</div>
            <ul className="space-y-2">
              {items.map((i) => (
                <li key={i.code}>
                  <div className="font-mono text-xs font-semibold text-primary">{i.code}</div>
                  <div className="text-xs text-muted-foreground">{i.description ?? "—"}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
