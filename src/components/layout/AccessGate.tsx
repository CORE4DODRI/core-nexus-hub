import type { ReactNode } from "react";
import { Building2, LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCompany, useSubscription, daysLeft } from "@/hooks/useCompany";

const BYPASS_EMAIL = "admin@dodricom.com";

/**
 * Access is owned by the company + its subscription.
 * Super Admin (and the founding admin account) keeps working with no company and no subscription.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const { loading, user, profile, roleName, signOut } = useAuth();
  const company = useCompany();
  const subscription = useSubscription(company.data?.id);

  const email = (profile?.email ?? user?.email ?? "").toLowerCase();
  const bypass = email === BYPASS_EMAIL || (roleName ?? "").toLowerCase().includes("super admin");

  if (bypass) return <>{children}</>;

  if (loading || company.isLoading || (company.data && subscription.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  let title: string | null = null;
  let detail: string | null = null;

  if (!company.data) {
    title = "No company configured";
    detail =
      "This Core installation has no company yet. A Super Admin must create the company profile before other accounts can sign in.";
  } else {
    const sub = subscription.data;
    if (!sub) {
      title = "No subscription";
      detail = `${company.data.name} has no subscription plan. A Super Admin must create one to unlock access.`;
    } else if (sub.status !== "ACTIVE") {
      title = `Subscription ${sub.status.toLowerCase()}`;
      detail = `The subscription for ${company.data.name} is ${sub.status.toLowerCase()}. Your data is preserved — access resumes once it is reactivated.`;
    } else if (daysLeft(sub.end_date) < 0) {
      title = "Subscription expired";
      detail = `The subscription for ${company.data.name} ended on ${sub.end_date}. Renew it to restore access. No data has been deleted.`;
    }
  }

  if (!title) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="panel max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-warning/40 bg-warning/10">
          {company.data ? (
            <ShieldAlert className="h-6 w-6 text-warning" />
          ) : (
            <Building2 className="h-6 w-6 text-warning" />
          )}
        </div>
        <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{detail}</p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" /> Contact your Super Admin to restore access.
        </p>
        <Button variant="outline" onClick={() => void signOut()} className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
}
