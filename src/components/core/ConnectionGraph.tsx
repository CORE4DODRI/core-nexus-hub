import type { ConnectionRow, ModuleRow } from "@/hooks/useCore";

/** Subtle connection map: active links flow, inactive stay neutral, errors are flagged. */
export function ConnectionGraph({
  modules,
  connections,
}: {
  modules: ModuleRow[];
  connections: ConnectionRow[];
}) {
  const width = 900;
  const height = 260;
  const cx = width / 2;
  const cy = height / 2;
  const nodes = modules.slice(0, 10);

  const pos = (i: number) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * 330, y: cy + Math.sin(angle) * 95 };
  };
  const indexOf = (id: string | null) => nodes.findIndex((n) => n.id === id);

  return (
    <div className="panel p-4">
      <div className="label-tech mb-2">Connection Map</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {connections.map((c) => {
          const si = indexOf(c.source_module_id);
          if (si < 0) return null;
          const s = pos(si);
          const ti = c.target_module_id ? indexOf(c.target_module_id) : -1;
          const t = ti >= 0 ? pos(ti) : { x: cx, y: cy };
          const color =
            c.status === "active"
              ? "oklch(0.66 0.14 245)"
              : c.status === "error"
                ? "oklch(0.6 0.22 22)"
                : "oklch(0.78 0.02 250)";
          return (
            <g key={c.id}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
              {c.status === "active" && (
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="oklch(0.73 0.135 213)"
                  strokeWidth={2.5}
                  strokeDasharray="5 28"
                  className="animate-flow"
                />
              )}
              {c.status === "error" && <circle cx={(s.x + t.x) / 2} cy={(s.y + t.y) / 2} r={4} fill={color} />}
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={34} fill="oklch(0.56 0.196 258)" opacity={0.9} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">
          CORE
        </text>

        {nodes.map((m, i) => {
          const p = pos(i);
          return (
            <g key={m.id}>
              <circle cx={p.x} cy={p.y} r={22} fill="white" stroke="oklch(0.66 0.14 245)" strokeOpacity={0.35} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fill="oklch(0.42 0.05 258)">
                {m.name.slice(0, 8)}
              </text>
            </g>
          );
        })}
      </svg>
      {connections.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">No connections to visualize yet.</p>
      )}
    </div>
  );
}
