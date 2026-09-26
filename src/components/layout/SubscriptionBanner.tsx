import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useCompany, useSubscription, daysLeft } from "@/hooks/useCompany";

/** Non-blocking notice when the Core subscription is not healthy. */
export function SubscriptionBanner() {
  const company = useCompany();
  const subscription = useSubscription(company.data?.id);
  const sub = subscription.data;
  if (!sub) return null;

  const remaining = daysLeft(sub.end_date);
  let message: string | null = null;
  if (sub.status === "EXPIRED") message = "The subscription has expired. Data is preserved — renew to restore full access.";
  else if (sub.status === "SUSPENDED") message = "The subscription is suspended. Reactivate it to resume normal operations.";
  else if (sub.status === "CANCELLED") message = "The subscription is cancelled. Create a new plan to continue.";
  else if (remaining <= 7) message = `Subscription ends in ${Math.max(remaining, 0)} day(s). Renew to avoid interruption.`;

  if (!message) return null;

  return (
    <div className="mx-3 mt-2 flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <span>{message}</span>
      <Link to="/parameters/company" className="ml-auto font-medium text-primary underline-offset-2 hover:underline">
        Manage subscription
      </Link>
    </div>
  );
}
