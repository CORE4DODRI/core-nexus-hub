import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  last_login_at: string | null;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roleName: string | null;
  permissions: string[];
  can: (code: string) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function loadAccess(userId: string) {
  const [{ data: profile }, { data: userRoles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, status, last_login_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role_id, roles(name, slug)").eq("user_id", userId),
  ]);

  const roleIds = (userRoles ?? []).map((r) => r.role_id);
  let permissions: string[] = [];
  if (roleIds.length) {
    const { data: rp } = await supabase
      .from("role_permissions")
      .select("permissions(code)")
      .in("role_id", roleIds);
    permissions = Array.from(
      new Set(
        (rp ?? [])
          .map((row) => (row.permissions as { code: string } | null)?.code)
          .filter((c): c is string => Boolean(c)),
      ),
    );
  }

  const roleName =
    (userRoles ?? [])
      .map((r) => (r.roles as { name: string } | null)?.name)
      .filter(Boolean)
      .join(", ") || null;

  return { profile: (profile as Profile) ?? null, roleName, permissions };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const hydrate = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setRoleName(null);
      setPermissions([]);
      return;
    }
    // Makes sure a profile + role exist for this account (first user = Super Admin).
    await supabase.rpc("bootstrap_current_user", {});
    const access = await loadAccess(uid);
    setProfile(access.profile);
    setRoleName(access.roleName);
    setPermissions(access.permissions);
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoleName(null);
        setPermissions([]);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await hydrate(data.session?.user.id);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    void hydrate(userId);
  }, [userId, hydrate]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roleName,
      permissions,
      can: (code: string) => permissions.includes(code),
      refresh: async () => {
        await hydrate(session?.user.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session, profile, roleName, permissions, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function displayName(profile: Profile | null, email?: string | null) {
  const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return full || profile?.email || email || "Account";
}
