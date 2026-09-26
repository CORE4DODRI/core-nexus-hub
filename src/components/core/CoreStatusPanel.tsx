import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";

export type ServiceStatus = { label: string; value: string; tone: StatusTone };

export function CoreStatusPanel({ services }: { services: ServiceStatus[] }) {
  return (
    <section className="panel p-4">
      <div className="label-tech mb-3">Core Status</div>
      <ul className="space-y-2.5">
        {services.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{s.label}</span>
            <StatusBadge label={s.value} tone={s.tone} />
          </li>
        ))}
      </ul>
    </section>
  );
}
