import type { LucideIcon } from "lucide-react";

export type Metric = { label: string; value: string | number; icon: LucideIcon; hint?: string };

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {metrics.map((m) => (
        <div key={m.label} className="panel animate-rise px-3 py-2.5">
          <div className="flex items-start justify-between">
            <div className="label-tech">{m.label}</div>
            <m.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 font-display text-xl font-bold text-primary">{m.value}</div>
          {m.hint && <div className="mt-0.5 text-[9px] text-muted-foreground">{m.hint}</div>}
        </div>
      ))}
    </div>
  );
}
