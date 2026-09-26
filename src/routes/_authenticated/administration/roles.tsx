import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions, useRolePermissions, useRoles } from "@/hooks/useCore";

export const Route = createFileRoute("/_authenticated/administration/roles")({
  head: () => ({
    meta: [
      { title: "Roles — DODRI Platform Core" },
      { name: "description", content: "Database-driven roles and their granted permissions." },
      { property: "og:title", content: "Roles — DODRI Platform Core" },
      { property: "og:description", content: "Roles and granted permissions." },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const roles = useRoles();
  const permissions = usePermissions();
  const rolePerms = useRolePermissions();

  const codeById = new Map((permissions.data ?? []).map((p) => [p.id, p.code]));

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Roles"
        description="Roles are stored in the database and drive every permission check server-side."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(roles.data ?? []).map((role) => {
          const codes = (rolePerms.data ?? [])
            .filter((rp) => rp.role_id === role.id)
            .map((rp) => codeById.get(rp.permission_id))
            .filter(Boolean) as string[];
          return (
            <div key={role.id} className="panel p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-display font-semibold">{role.name}</div>
                  <div className="text-xs text-muted-foreground">{role.slug}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{role.description ?? "—"}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {codes.slice(0, 10).map((c) => (
                  <span key={c} className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-mono">
                    {c}
                  </span>
                ))}
                {codes.length > 10 && (
                  <span className="text-[11px] text-muted-foreground">+{codes.length - 10} more</span>
                )}
                {codes.length === 0 && <span className="text-xs text-muted-foreground">No permissions</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
