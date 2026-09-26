import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CompanyRow = {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = "MONTHLY" | "SEMI_ANNUAL" | "ANNUAL";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";

export type SubscriptionRow = {
  id: string;
  company_id: string;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionEventRow = {
  id: string;
  subscription_id: string;
  event: string;
  from_plan: string | null;
  to_plan: string | null;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  MONTHLY: "Monthly — 1 month",
  SEMI_ANNUAL: "Semi-annual — 6 months",
  ANNUAL: "Annual — 12 months",
};

export const LOGO_BUCKET = "company-logos";

/** The Core hosts exactly one company: always read the single row. */
export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async (): Promise<CompanyRow | null> => {
      const { data, error } = await supabase.from("company").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return (data as CompanyRow) ?? null;
    },
    retry: false,
  });
}

export function useCompanyLogoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["company_logo", path],
    enabled: Boolean(path),
    queryFn: async (): Promise<string | null> => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}

export function useSubscription(companyId?: string) {
  return useQuery({
    queryKey: ["subscription", companyId],
    enabled: Boolean(companyId),
    queryFn: async (): Promise<SubscriptionRow | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SubscriptionRow) ?? null;
    },
    retry: false,
  });
}

export function useSubscriptionEvents(subscriptionId?: string) {
  return useQuery({
    queryKey: ["subscription_events", subscriptionId],
    enabled: Boolean(subscriptionId),
    queryFn: async (): Promise<SubscriptionEventRow[]> => {
      const { data, error } = await supabase
        .from("subscription_events")
        .select("*")
        .eq("subscription_id", subscriptionId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SubscriptionEventRow[];
    },
    retry: false,
  });
}

export function planEndDate(start: string, plan: SubscriptionPlan) {
  const d = new Date(`${start}T00:00:00Z`);
  const months = plan === "MONTHLY" ? 1 : plan === "SEMI_ANNUAL" ? 6 : 12;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function daysLeft(endDate: string) {
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}
