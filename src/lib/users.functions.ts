import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  roleId: z.string().uuid().optional(),
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
    });
    if (profileError) throw new Error(profileError.message);

    // Assign the chosen role
    if (data.roleId) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role_id: data.roleId });
      if (roleError) throw new Error(roleError.message);
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
