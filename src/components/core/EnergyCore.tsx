import { moduleIcon } from "@/lib/dodri/icons";
import type { ConnectionRow, ModuleRow } from "@/hooks/useCore";
import { cn } from "@/lib/utils";

type Props = {
  modules: ModuleRow[];
  connections?: ConnectionRow[];
};

/**
 * Central DODRI energy core with dynamically generated orbiting module nodes.
 * Nodes come from the module registry only — nothing is hard-coded.
 */
export function EnergyCore({ modules, connections = [] }: Props) {
  const nodes = modules.filter((m) => m.enabled);
  const size = 520;
  const center = size / 2;
  const radius = 190;

  const coreConnectionFor = (moduleId: string) =>
    connections.find(
      (c) => c.source_module_id === moduleId && c.connection_type === "module_to_core",
    );

  return (
    <section className="core-stage panel relative flex min-h-[430px] flex-col overflow-hidden p-3">
      <div className="absolute left-3 top-3 z-10 section-title">Core Intelligence</div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 text-[9px] font-semibold text-success">
        <span className="status-dot bg-success" /> LIVE
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[520px] flex-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="core-glow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.72 0.15 232)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="oklch(0.72 0.15 232)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={center} cy={center} r={radius + 40} fill="url(#core-glow)" />
          {[radius, radius - 55, radius - 110].map((r, i) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="var(--primary)"
              strokeOpacity={0.18 + i * 0.04}
              strokeDasharray={i === 1 ? "4 8" : undefined}
            />
          ))}

          {nodes.map((module, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const connection = coreConnectionFor(module.id);
            const status = connection?.status ?? (module.status === "active" ? "active" : "inactive");
            const stroke =
              status === "active"
                ? "var(--primary)"
                : status === "error"
                  ? "var(--destructive)"
                  : "var(--border)";
            return (
              <g key={module.id}>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={stroke}
                  strokeWidth={1.5}
                  strokeOpacity={0.45}
                />
                {status === "active" && (
                  <line
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="var(--cyan)"
                    strokeWidth={2.5}
                    strokeDasharray="6 34"
                    className="animate-flow"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Core sphere */}
        <div className="absolute left-1/2 top-1/2 flex aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="core-ring absolute inset-[-14%] rounded-full border border-primary/30" />
          <div className="core-ring-reverse absolute inset-[-28%] rounded-full border border-dashed border-cyan/25" />
          <div
            className="core-sphere animate-core-pulse flex h-full w-full items-center justify-center rounded-full text-center"
            style={{
              background: "var(--gradient-core)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <div className="px-2">
              <div className="font-display text-lg font-bold uppercase tracking-[0.18em] text-primary-foreground">DODRI</div>
              <div className="text-[9px] font-medium uppercase tracking-[0.22em] text-primary-foreground/80">
                PLATFORM CORE
              </div>
              <div className="mt-1 text-[9px] text-primary-foreground/70">v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Module nodes */}
        {nodes.map((module, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + (Math.cos(angle) * radius * 100) / size;
          const y = 50 + (Math.sin(angle) * radius * 100) / size;
          const Icon = moduleIcon(module.icon);
          const connection = coreConnectionFor(module.id);
          const connected = (connection?.status ?? module.status) === "active";
          return (
            <div
              key={module.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="module-node flex w-[78px] flex-col items-center gap-1 px-1.5 py-1.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground shadow-[var(--shadow-glow)]"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="truncate text-xs font-semibold">{module.name}</div>
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      connected ? "bg-success" : "bg-muted-foreground/50",
                    )}
                  />
                  {connected ? "Connected" : "Idle"}
                </div>
              </div>
            </div>
          );
        })}

        {nodes.length === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            No modules installed
          </div>
        )}
      </div>

      <div className="core-online mx-auto -mt-4 w-fit px-7 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        <span className="text-success">●</span> Core System Online
      </div>
    </section>
  );
}
