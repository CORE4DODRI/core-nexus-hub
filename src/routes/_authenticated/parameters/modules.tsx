import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { moduleIcon, MODULE_ICONS } from "@/lib/dodri/icons";
import { logActivity, useConnections, useModules } from "@/hooks/useCore";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/parameters/modules")({
  head: () => ({
    meta: [
      { title: "Modules Management — DODRI Platform Core" },
      { name: "description", content: "Register, activate and configure modules in the Core registry." },
      { property: "og:title", content: "Modules Management — DODRI Platform Core" },
      { property: "og:description", content: "The Core module registry." },
    ],
  }),
  component: ModulesManagementPage,
});

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  icon: "Box",
  version: "1.0.0",
  route: "",
  status: "inactive",
  enabled: false,
};

function ModulesManagementPage() {
  const modules = useModules();
  const connections = useConnections();
  const { can, user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const rows = modules.data ?? [];

  async function register() {
    setSaving(true);
    const { error } = await supabase.from("modules").insert({
      name: form.name,
      slug: form.slug.trim().toLowerCase(),
      description: form.description || null,
      icon: form.icon,
      version: form.version,
      route: form.route || `/modules/${form.slug.trim().toLowerCase()}`,
      status: form.status,
      enabled: form.enabled,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "module.installed",
        entityType: "module",
        description: `Module ${form.name} registered`,
      });
    }
    toast.success("Module registered in the Core.");
    setForm(EMPTY);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["modules"] });
    qc.invalidateQueries({ queryKey: ["activity_logs"] });
  }

  async function update(
    id: string,
    patch: { enabled?: boolean; status?: string },
    action: string,
    label: string,
  ) {
    const { error } = await supabase.from("modules").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action,
        entityType: "module",
        entityId: id,
        description: label,
      });
    }
    qc.invalidateQueries({ queryKey: ["modules"] });
    qc.invalidateQueries({ queryKey: ["activity_logs"] });
  }

  async function remove(id: string, name: string) {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "module.removed",
        entityType: "module",
        entityId: id,
        description: `Module ${name} removed`,
      });
    }
    qc.invalidateQueries({ queryKey: ["modules"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Parameters"
        title="Modules Management"
        description="The registry the whole Core reads from — navigation, dashboard, permissions and connections."
        actions={
          can("modules.install") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add new module
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register a module</DialogTitle>
                  <DialogDescription>
                    Registration declares a module to the Core. No external code is executed.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Icon</Label>
                      <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(MODULE_ICONS).map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Version</Label>
                      <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Route</Label>
                    <Input
                      placeholder="/modules/your-slug"
                      value={form.route}
                      onChange={(e) => setForm({ ...form, route: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end justify-between rounded-lg border border-border px-3 py-2">
                      <span className="text-sm">Enabled</span>
                      <Switch
                        checked={form.enabled}
                        onCheckedChange={(v) => setForm({ ...form, enabled: v })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={register} disabled={saving || !form.name || !form.slug}>
                    {saving ? "Registering…" : "Register module"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="panel overflow-x-auto p-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Connections</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const Icon = moduleIcon(m.icon);
              const links = (connections.data ?? []).filter(
                (c) => c.source_module_id === m.id || c.target_module_id === m.id,
              );
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.version}</TableCell>
                  <TableCell>
                    <StatusBadge label={m.status} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.enabled}
                      disabled={!can("modules.configure")}
                      onCheckedChange={(v) =>
                        update(
                          m.id,
                          { enabled: v, status: v ? "active" : "inactive" },
                          v ? "module.activated" : "module.disabled",
                          `${m.name} ${v ? "activated" : "disabled"}`,
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{links.length}</TableCell>
                  <TableCell className="text-right">
                    {can("modules.install") && (
                      <Button variant="ghost" size="sm" onClick={() => remove(m.id, m.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No modules installed.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
