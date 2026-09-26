import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarClock, History, ImageUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/hooks/useCore";
import {
  LOGO_BUCKET,
  PLAN_LABELS,
  daysLeft,
  planEndDate,
  useCompany,
  useCompanyLogoUrl,
  useSubscription,
  useSubscriptionEvents,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/hooks/useCompany";

export const Route = createFileRoute("/_authenticated/parameters/company")({
  head: () => ({
    meta: [
      { title: "Company & Subscription — DODRI Platform Core" },
      {
        name: "description",
        content: "The single company this Core installation serves, its logo and its active subscription plan.",
      },
      { property: "og:title", content: "Company & Subscription — DODRI Platform Core" },
      { property: "og:description", content: "Company profile and subscription lifecycle for this Core." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompanyPage,
});

const PLANS: SubscriptionPlan[] = ["MONTHLY", "SEMI_ANNUAL", "ANNUAL"];
const STATUSES: SubscriptionStatus[] = ["ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"];

function CompanyPage() {
  const { can, user, profile } = useAuth();
  const qc = useQueryClient();
  const company = useCompany();
  const logo = useCompanyLogoUrl(company.data?.logo_url);
  const subscription = useSubscription(company.data?.id);
  const events = useSubscriptionEvents(subscription.data?.id);

  const canManageCompany = can("company.manage");
  const canManageSub = can("subscription.manage");

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(company.data?.name ?? "");
  }, [company.data?.name]);

  const [plan, setPlan] = useState<SubscriptionPlan>("MONTHLY");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (subscription.data) {
      setPlan(subscription.data.plan);
      setStart(subscription.data.start_date);
    }
  }, [subscription.data]);

  async function log(action: string, description: string) {
    if (!user) return;
    await logActivity({
      userId: user.id,
      actor: profile?.email ?? null,
      action,
      entityType: "company",
      ...(company.data?.id ? { entityId: company.data.id } : {}),
      description,
    });
    qc.invalidateQueries({ queryKey: ["activity_logs"] });
  }

  async function saveCompany() {
    if (!name.trim()) return;
    setBusy(true);
    if (company.data) {
      const { error } = await supabase.from("company").update({ name: name.trim() }).eq("id", company.data.id);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log("company.updated", `Company renamed to ${name.trim()}`);
    } else {
      const { error } = await supabase.from("company").insert({ name: name.trim() });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log("company.created", `Company ${name.trim()} registered in this Core`);
    }
    toast.success("Company saved.");
    qc.invalidateQueries({ queryKey: ["company"] });
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function uploadLogo(file: File) {
    if (!company.data) { toast.error("Save the company name first."); return; }
    setBusy(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${company.data.id}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true });
    if (upErr) {
      setBusy(false);
      { toast.error(upErr.message); return; }
    }
    const { error } = await supabase.from("company").update({ logo_url: path }).eq("id", company.data.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await log("company.logo.updated", "Company logo updated");
    toast.success("Logo updated.");
    qc.invalidateQueries({ queryKey: ["company"] });
  }

  async function saveSubscription() {
    if (!company.data) return;
    setBusy(true);
    if (subscription.data) {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan, start_date: start })
        .eq("id", subscription.data.id);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log("subscription.updated", `Subscription set to ${plan} starting ${start}`);
    } else {
      const { error } = await supabase
        .from("subscriptions")
        .insert({ company_id: company.data.id, plan, start_date: start, end_date: planEndDate(start, plan) });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      await log("subscription.created", `Subscription ${plan} created`);
    }
    toast.success("Subscription saved.");
    qc.invalidateQueries({ queryKey: ["subscription"] });
    qc.invalidateQueries({ queryKey: ["subscription_events"] });
  }

  async function setStatus(next: SubscriptionStatus) {
    if (!subscription.data) return;
    const { error } = await supabase.from("subscriptions").update({ status: next }).eq("id", subscription.data.id);
    if (error) { toast.error(error.message); return; }
    await log("subscription.status", `Subscription status changed to ${next}`);
    qc.invalidateQueries({ queryKey: ["subscription"] });
    qc.invalidateQueries({ queryKey: ["subscription_events"] });
  }

  async function renew() {
    if (!subscription.data) return;
    const nextStart = subscription.data.end_date;
    const { error } = await supabase
      .from("subscriptions")
      .update({ start_date: nextStart, status: "ACTIVE" })
      .eq("id", subscription.data.id);
    if (error) { toast.error(error.message); return; }
    await log("subscription.renewed", `Subscription renewed from ${nextStart}`);
    toast.success("Subscription renewed.");
    qc.invalidateQueries({ queryKey: ["subscription"] });
    qc.invalidateQueries({ queryKey: ["subscription_events"] });
  }

  const sub = subscription.data;
  const remaining = sub ? daysLeft(sub.end_date) : null;

  return (
    <div className="max-w-5xl space-y-3">
      <PageHeader
        eyebrow="Parameters"
        title="Company & Subscription"
        description="This Core installation serves exactly one company. Every user belongs to it."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="label-tech">Company</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
              {logo.data ? (
                <img src={logo.data} alt="Company logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Company name</Label>
              <Input
                value={name}
                disabled={!canManageCompany || busy}
                placeholder="Your company name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {canManageCompany && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveCompany} disabled={busy || !name.trim()}>
                {company.data ? "Save changes" : "Create company"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="secondary"
                disabled={busy || !company.data}
                onClick={() => fileRef.current?.click()}
              >
                <ImageUp className="mr-2 h-4 w-4" /> {company.data?.logo_url ? "Change logo" : "Upload logo"}
              </Button>
            </div>
          )}

          {!company.data && (
            <p className="text-xs text-muted-foreground">
              No company registered yet. Enter a name to complete the initial setup — only one company can exist.
            </p>
          )}
        </section>

        <section className="panel space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="label-tech">Subscription</span>
            </div>
            {sub && <StatusBadge label={sub.status.toLowerCase()} />}
          </div>

          {!company.data ? (
            <p className="text-xs text-muted-foreground">Register the company first.</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={plan}
                  disabled={!canManageSub}
                  onValueChange={(v) => setPlan(v as SubscriptionPlan)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLAN_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={start}
                    disabled={!canManageSub}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End date (auto)</Label>
                  <Input value={sub?.end_date ?? planEndDate(start, plan)} readOnly disabled />
                </div>
              </div>

              {sub && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {remaining !== null && remaining >= 0
                    ? `${remaining} days remaining`
                    : `Expired ${Math.abs(remaining ?? 0)} days ago`}
                </div>
              )}

              {canManageSub && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveSubscription} disabled={busy}>
                    {sub ? "Save subscription" : "Create subscription"}
                  </Button>
                  {sub && (
                    <>
                      <Button variant="secondary" onClick={renew}>
                        Renew
                      </Button>
                      {STATUSES.filter((s) => s !== sub.status).map((s) => (
                        <Button key={s} variant="ghost" size="sm" onClick={() => setStatus(s)}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="label-tech">Subscription history</span>
        </div>
        <ul className="space-y-1.5">
          {(events.data ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-xs">
              <span className="font-medium">{e.event}</span>
              <span className="text-muted-foreground">
                {[e.from_plan && e.to_plan ? `${e.from_plan} → ${e.to_plan}` : e.to_plan,
                  e.from_status && e.to_status ? `${e.from_status} → ${e.to_status}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </li>
          ))}
          {(events.data ?? []).length === 0 && (
            <li className="py-4 text-center text-xs text-muted-foreground">No subscription events yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
