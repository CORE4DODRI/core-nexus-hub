import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  roleId: z.string().uuid().optional(),
  redirectTo: z.string().url(),
});

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inviteSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Caller must have users.create permission
    const { data: allowed } = await supabase.rpc("has_permission", {
      _user_id: userId,
      _code: "users.create",
    });
    if (!allowed) throw new Error("You do not have permission to create users.");

    // Caller must belong to a company — invited users join the same company
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("company_id, email")
      .eq("id", userId)
      .single();
    const companyId = callerProfile?.company_id ?? null;
    if (!companyId) {
      throw new Error("Create the company first in Parameters → Company & Subscription.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the auth account and send the invitation email
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      {
        data: { first_name: data.firstName ?? null, last_name: data.lastName ?? null },
        redirectTo: data.redirectTo,
      },
    );
    if (inviteError) throw new Error(inviteError.message);

    const newUserId = invited.user.id;

    // Create the profile linked to the company
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      email: data.email,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      company_id: companyId,
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
      action: "user.invited",
      entity_type: "user",
      entity_id: newUserId,
      description: `Invitation sent to ${data.email}`,
      status: "success",
    });

    return { ok: true, userId: newUserId };
  });
