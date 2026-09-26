import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Power, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoles, useUsers, logActivity } from "@/hooks/useCore";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";

export const Route = createFileRoute("/_authenticated/administration/users")({
  head: () => ({
    meta: [
      { title: "Users — DODRI Platform Core" },
      { name: "description", content: "Manage platform accounts, roles and access status." },
      { property: "og:title", content: "Users — DODRI Platform Core" },
      { property: "og:description", content: "Manage platform accounts and access." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { can, user, profile } = useAuth();
  const users = useUsers();
  const company = useCompany();
  const roles = useRoles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first: "", last: "", email: "", roleId: "", status: "active" });

  const rows = users.data ?? [];
  const canEdit = can("users.edit");

  async function invite() {
    if (!user) return;
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await logActivity({
      userId: user.id,
      actor: profile?.email ?? null,
      action: "user.invited",
      entityType: "user",
      description: `Invitation sent to ${form.email}`,
    });
    toast.success("Invitation email sent. The account is created when they set their password.");
    setOpen(false);
    setForm({ first: "", last: "", email: "", roleId: "", status: "active" });
    qc.invalidateQueries({ queryKey: ["activity_logs"] });
  }

  async function toggleStatus(id: string, status: string) {
    const nextStatus = status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("profiles").update({ status: nextStatus }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "user.updated",
        entityType: "user",
        entityId: id,
        description: `Account marked ${nextStatus}`,
      });
    }
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function setRole(userId: string, roleId: string) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "role.updated",
        entityType: "user",
        entityId: userId,
        description: "Role assignment changed",
      });
    }
    toast.success("Role updated.");
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function linkToCompany(id: string) {
    const companyId = company.data?.id;
    if (!companyId) {
      toast.error("Create the company first in Parameters → Company & Subscription.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ company_id: companyId }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "user.updated",
        entityType: "user",
        entityId: id,
        description: `Linked to ${company.data?.name ?? "company"}`,
      });
    }
    toast.success("Account linked to the company.");
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function sendReset(email: string | null) {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description={`All accounts belong to ${company.data?.name ?? "this Core installation"}. Passwords are never set manually.`}
        actions={
          can("users.create") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Create user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create user</DialogTitle>
                  <DialogDescription>
                    An invitation email is sent so the person sets their own password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>First name</Label>
                      <Input value={form.first} onChange={(e) => setForm({ ...form, first: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last name</Label>
                      <Input value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles.data ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={invite} disabled={!form.email}>
                    Send invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: rows.length },
          { label: "Active", value: rows.filter((r) => r.status === "active").length },
          { label: "Inactive", value: rows.filter((r) => r.status !== "active").length },
        ].map((s) => (
          <div key={s.label} className="panel p-4">
            <div className="label-tech">{s.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="panel overflow-x-auto p-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{company.data?.name ?? "—"}</TableCell>
                <TableCell>
                  {canEdit ? (
                    <Select value={u.role_id ?? ""} onValueChange={(v) => setRole(u.id, v)}>
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue placeholder={u.role} />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles.data ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    u.role
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge label={u.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => sendReset(u.email)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(u.id, u.status)}>
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No accounts visible with your permissions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
