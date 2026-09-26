import { Cable, CheckCircle2, CircleOff } from "lucide-react";
import type { ConnectionRow, ModuleRow } from "@/hooks/useCore";
import { moduleIcon } from "@/lib/dodri/icons";

export function ConnectedModules({ modules, connections }: { modules: ModuleRow[]; connections: ConnectionRow[] }) {
  const enabled = modules.filter((module) => module.enabled);
  return (
    <section className="panel p-3">
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5"><div className="section-title">Connected Modules</div><Cable className="h-3.5 w-3.5 text-primary" /></div>
      <div className="mt-2.5 space-y-1.5">
        {enabled.slice(0, 6).map((module) => {
          const Icon = moduleIcon(module.icon);
          const links = connections.filter((connection) => connection.source_module_id === module.id || connection.target_module_id === module.id);
          const online = links.some((connection) => connection.status === "active");
          return <div key={module.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/60 bg-card/65 px-2 py-1.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><div className="truncate text-[11px] font-semibold">{module.name}</div><div className="text-[8px] text-muted-foreground">{links.length} connection{links.length === 1 ? "" : "s"}</div></div>{online ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <CircleOff className="h-3.5 w-3.5 text-muted-foreground" />}</div>;
        })}
        {enabled.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No enabled modules</p>}
      </div>
    </section>
  );
}