import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({
    meta: [
      { title: "Security — DODRI Platform Core" },
      { name: "description", content: "Change your password and review session security." },
      { property: "og:title", content: "Security — DODRI Platform Core" },
      { property: "og:description", content: "Password and session security." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    setCurrent("");
    setNext("");
  }

  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Account" title="Security" description="Protect access to the Core." />

      <form onSubmit={changePassword} className="panel space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="cur">Current password</Label>
          <Input id="cur" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next">New password</Label>
          <Input id="next" type="password" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </form>

      <div className="panel mt-4 p-5 text-sm text-muted-foreground">
        <div className="label-tech mb-2">Session</div>
        Signed in as {user?.email}. Sessions persist securely on this device until you sign out.
      </div>
    </div>
  );
}
