import { cn } from "@/lib/utils";

export function DodriMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="dodri-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.15 225)" />
          <stop offset="100%" stopColor="oklch(0.5 0.21 268)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#dodri-mark)" />
      <path
        d="M20 16h13c10 0 17 6.8 17 16s-7 16-17 16H20V16Zm9 8v16h4c5 0 8.5-3.2 8.5-8s-3.5-8-8.5-8h-4Z"
        fill="white"
      />
      <circle cx="20" cy="32" r="3.4" fill="white" />
      <path d="M8 32h9" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
      <path d="M50 22h7M50 42h7" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function DodriLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <DodriMark />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-xl font-bold tracking-tight">
            <span className="text-primary">DO</span>
            <span className="text-foreground">DRI</span>
          </div>
          <div className="label-tech mt-1">Platform Core</div>
        </div>
      )}
    </div>
  );
}
