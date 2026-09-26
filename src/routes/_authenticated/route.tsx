import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    // Company + subscription gate (super admin is always allowed).
    await supabase.rpc("bootstrap_current_user", {});
    const { data: access } = await supabase.rpc("check_access" as never);
    const a = access as { allowed?: boolean; reason?: string; end_date?: string } | null;
    if (!a?.allowed) {
      window.sessionStorage.setItem(
        "dodri.denied",
        JSON.stringify({ reason: a?.reason ?? "unknown", end_date: a?.end_date }),
      );
      await supabase.auth.signOut();
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
