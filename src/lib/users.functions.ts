import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  accessType: z.enum(["super_admin","interne","externe"]),
  moduleIds: z.array(z.string().uuid()).default([]),
  companyId: z.string().uuid(),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Caller must have users.create permission
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: userId,
      _code: "users.create",
    });
    if (!allowed) throw new Error("You do not have permission to create users.");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify the target company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from("company")
      .select("id, name")
      .eq("id", data.companyId)
      .single();
    if (companyError || !company) throw new Error("The selected company does not exist.");

    // Create the auth account directly with a password — no email is sent
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { first_name: data.firstName ?? null, last_name: data.lastName ?? null },
    });
    if (createError) throw new Error(createError.message);

    const newUserId = created.user.id;

    // Create the profile linked to the chosen company — the company's
    // subscription then governs this user's access automatically
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      email: data.email,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      company_id: company.id,
      status: "active",
      access_type: data.accessType,
    });
    if (profileError) throw new Error(profileError.message);

    // Map access type to an underlying role
    const slug = data.accessType === "super_admin" ? "super-admin" : "viewer";
    const { data: role } = await supabaseAdmin.from("roles").select("id").eq("slug", slug).single();
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role_id: role.id });
      if (roleError) throw new Error(roleError.message);
    }

    if (data.accessType !== "super_admin" && data.moduleIds.length) {
      const { error: accErr } = await supabaseAdmin
        .from("user_module_access")
        .insert(data.moduleIds.map((module_id) => ({ user_id: newUserId, module_id })));
      if (accErr) throw new Error(accErr.message);
    }

    await supabase.from("activity_logs").insert({
      user_id: userId,
      actor_label: callerProfile?.email ?? null,
      action: "user.created",
      entity_type: "user",
      entity_id: newUserId,
      description: `Account created for ${data.email} and linked to ${company.name}`,
      status: "success",
    });

    return { ok: true, userId: newUserId };
  });

const editSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  accessType: z.enum(["super_admin", "interne", "externe"]),
  moduleIds: z.array(z.string().uuid()).default([]),
  companyId: z.string().uuid().nullable(),
});

export const editUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => editSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: userId,
      _code: "users.edit",
    });
    if (!allowed) throw new Error("You do not have permission to edit users.");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify company when one is chosen
    let companyName: string | null = null;
    if (data.companyId) {
      const { data: company, error: companyError } = await supabaseAdmin
        .from("company")
        .select("id, name")
        .eq("id", data.companyId)
        .single();
      if (companyError || !company) throw new Error("The selected company does not exist.");
      companyName = company.name;
    }

    // Update auth account (email, and password only when a new one is given) — no email is sent
    const authUpdate: { email: string; password?: string; email_confirm: boolean; user_metadata: object } = {
      email: data.email,
      email_confirm: true,
      user_metadata: { first_name: data.firstName ?? null, last_name: data.lastName ?? null },
    };
    if (data.password) authUpdate.password = data.password;
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, authUpdate);
    if (authError) throw new Error(authError.message);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        email: data.email,
        first_name: data.firstName ?? null,
        last_name: data.lastName ?? null,
        company_id: data.companyId,
        access_type: data.accessType,
      })
      .eq("id", data.userId);
    if (profileError) throw new Error(profileError.message);

    // Re-map access type to an underlying role
    const slug = data.accessType === "super_admin" ? "super-admin" : "viewer";
    const { data: role } = await supabaseAdmin.from("roles").select("id").eq("slug", slug).single();
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role_id: role.id });
      if (roleError) throw new Error(roleError.message);
    }

    // Replace module access
    await supabaseAdmin.from("user_module_access").delete().eq("user_id", data.userId);
    if (data.accessType !== "super_admin" && data.moduleIds.length) {
      const { error: accErr } = await supabaseAdmin
        .from("user_module_access")
        .insert(data.moduleIds.map((module_id) => ({ user_id: data.userId, module_id })));
      if (accErr) throw new Error(accErr.message);
    }

    await supabase.from("activity_logs").insert({
      user_id: userId,
      actor_label: callerProfile?.email ?? null,
      action: "user.updated",
      entity_type: "user",
      entity_id: data.userId,
      description: `Account ${data.email} updated manually${companyName ? ` and linked to ${companyName}` : ""}`,
      status: "success",
    });

    return { ok: true };
  });
