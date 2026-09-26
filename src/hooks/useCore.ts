import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ModuleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  version: string;
  route: string | null;
  status: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConnectionRow = {
  id: string;
  source_module_id: string | null;
  target_module_id: string | null;
  connection_type: string;
  status: string;
  permissions: string[];
  configuration: Record<string, unknown>;
  created_at: string;
};

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async (): Promise<ModuleRow[]> => {
      const { data, error } = await supabase.from("modules").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ModuleRow[];
    },
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ["module_connections"],
    queryFn: async (): Promise<ConnectionRow[]> => {
      const { data, error } = await supabase
        .from("module_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConnectionRow[];
    },
    retry: false,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("group_name")
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("role_id, permission_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: userRoles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role_id, roles(name, slug)"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p) => ({
        ...p,
        role:
          (userRoles ?? [])
            .filter((ur) => ur.user_id === p.id)
            .map((ur) => (ur.roles as { name: string } | null)?.name)
            .filter(Boolean)
            .join(", ") || "—",
        role_id: (userRoles ?? []).find((ur) => ur.user_id === p.id)?.role_id ?? null,
      }));
    },
    retry: false,
  });
}

export function useActivityLogs(limit = 50) {
  return useQuery({
    queryKey: ["activity_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*").order("key");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function logActivity(input: {
  userId: string;
  actor?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  status?: string;
}) {
  await supabase.from("activity_logs").insert({
    user_id: input.userId,
    actor_label: input.actor ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    description: input.description ?? null,
    status: input.status ?? "success",
  });
}
