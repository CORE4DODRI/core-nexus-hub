import { Activity, Boxes, Cable, KeyRound, Settings, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

export type ActivityRow = {
  id: string;
  action: string;
  description: string | null;
  actor_label: string | null;
  status: string;
  created_at: string;
};

function iconFor(action: string) {
  if (action.startsWith("user.login")) return LogIn;
  if (action.startsWith("user")) return UserPlus;
  if (action.startsWith("role")) return ShieldCheck;
  if (action.startsWith("permission")) return KeyRound;
  if (action.startsWith("module")) return Boxes;
  if (action.startsWith("connection")) return Cable;
  if (action.startsWith("setting") || action.startsWith("system")) return Settings;
  return Activity;
}

export function RecentActivity({ rows, dense = false }: { rows: ActivityRow[]; dense?: boolean }) {
  return (
    <section className="panel p-3">
      <div className="section-title mb-2.5">Recent Activity</div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
      <ul className="divide-y divide-border/60">
        {rows.slice(0, dense ? 6 : rows.length).map((row) => {
          const Icon = iconFor(row.action);
          return (
            <li key={row.id} className="flex items-center gap-2 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium">{row.description ?? row.action}</div>
                <div className="text-[9px] text-muted-foreground">
                  {row.actor_label ?? "System"} • {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
              <StatusBadge label={row.status} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
