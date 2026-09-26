import { Suspense, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { PackageOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { moduleIcon } from "@/lib/dodri/icons";
import { getModuleUI } from "@/modules/registry";
import type { ModuleRow } from "@/hooks/useCore";

export function ModuleHost({ module }: { module: ModuleRow }) {
  const Icon = moduleIcon(module.icon);
  const ModuleUI = useMemo(() => getModuleUI(module.slug), [module.slug]);

  return (
    <section className="panel min-h-[420px] overflow-hidden p-4">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/70 pb-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="section-title truncate">{module.name}</div>
          <div className="label-tech mt-0.5">{module.slug} · v{module.version}</div>
        </div>
        <StatusBadge label={module.status} />
        <Button asChild size="sm" variant="ghost" className="ml-auto h-8">
          <Link to="/dashboard" search={{}}>
            <X /> Close
          </Link>
        </Button>
      </header>

      <div className="pt-4">
        {ModuleUI ? (
          <Suspense fallback={<div className="py-10 text-center text-xs text-muted-foreground">Loading module…</div>}>
            <ModuleUI slug={module.slug} name={module.name} version={module.version} />
          </Suspense>
        ) : (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <PackageOpen className="h-7 w-7 text-primary" />
            <div className="text-sm font-semibold">No interface shipped yet</div>
            <p className="max-w-md text-xs text-muted-foreground">
              This module is registered and connected to the Core, but its UI folder is missing. Add{" "}
              <code className="font-mono">src/modules/{module.slug}/index.tsx</code> with a default React component and
              it will open right here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
