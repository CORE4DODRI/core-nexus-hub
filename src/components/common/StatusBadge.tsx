import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "error" | "idle";

const TONES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  error: "bg-destructive/10 text-destructive border-destructive/25",
  idle: "bg-muted text-muted-foreground border-border",
};

const DOTS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  idle: "bg-muted-foreground/60",
};

export function toneForStatus(status?: string | null): StatusTone {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "online":
    case "operational":
    case "optimal":
    case "connected":
    case "success":
      return "success";
    case "warning":
    case "pending":
    case "degraded":
      return "warning";
    case "error":
    case "failed":
    case "disabled":
      return "error";
    default:
      return "idle";
  }
}

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  const t = tone ?? toneForStatus(label);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        TONES[t],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[t])} />
      {label}
    </span>
  );
}
