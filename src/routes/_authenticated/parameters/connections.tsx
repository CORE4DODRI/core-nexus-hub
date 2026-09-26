import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConnectionGraph } from "@/components/core/ConnectionGraph";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { logActivity, useConnections, useModules } from "@/hooks/useCore";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/parameters/connections")({
  head: () => ({
    meta: [
      { title: "Connections — DODRI Platform Core" },
      { name: "description", content: "Wire modules to the Core and to each other with scoped permissions." },
      { property: "og:title", content: "Connections — DODRI Platform Core" },
      { property: "og:description", content: "Module to Core and module to module links." },
    ],
  }),
  component: ConnectionsPage,
});

const PERMISSION_OPTIONS = ["core.read", "core.write", "data.read", "data.write", "events.subscribe"];

export function isWrite(code: string) {
  return code.endsWith(".write");
}

function ConnectionsPage() {
  const modules = useModules();
  const connections = useConnections();
  const { can, user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("core");
  const [type, setType] = useState("module_to_core");
  const [status, setStatus] = useState("active");
  const [perms, setPerms] = useState<string[]>(["core.read"]);

  const moduleRows = modules.data ?? [];
  const nameOf = (id: string | null) =>
    id ? (moduleRows.find((m) => m.id === id)?.name ?? "Unknown") : "DODRI Core";

  async function create() {
    const { error } = await supabase.from("module_connections").insert({
      source_module_id: source || null,
      target_module_id: type === "module_to_core" ? null : target,
      connection_type: type,
      status,
      permissions: perms,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        actor: profile?.email ?? null,
        action: "connection.created",
        entityType: "connection",
        description: `${nameOf(source)} → ${type === "module_to_core" ? "Core" : nameOf(target)}`,
      });
    }
    toast.success("Connection created.");
    setOpen(false);
    setPerms(["core.read"]);
    qc.invalidateQueries({ queryKey: ["module_connections"] });
    qc.invalidateQueries({ queryKey: ["activity_logs"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("module_connections").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["module_connections"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Parameters"
        title="Module Connections"
        description="Write access is never granted automatically — select it explicitly."
        actions={
          can("connections.create") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New connection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New connection</DialogTitle>
                  <DialogDescription>Link a module to the Core or to another module.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>Source module</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleRows.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Connection type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="module_to_core">Module → Core</SelectItem>
                        <SelectItem value="module_to_module">Module → Module</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {type === "module_to_module" && (
                    <div className="space-y-1.5">
                      <Label>Target module</Label>
                      <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleRows
                            .filter((m) => m.id !== source)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
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
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    {PERMISSION_OPTIONS.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={perms.includes(p)}
                          onCheckedChange={(v) =>
                            setPerms((prev) => (v ? [...prev, p] : prev.filter((x) => x !== p)))
                          }
                        />
                        <span className="font-mono text-xs">{p}</span>
                        {isWrite(p) && (
                          <span className="text-[11px] text-warning">grants write access</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={create} disabled={!source}>
                    Create connection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <ConnectionGraph modules={moduleRows} connections={connections.data ?? []} />

      <div className="panel mt-4 overflow-x-auto p-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(connections.data ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{nameOf(c.source_module_id)}</TableCell>
                <TableCell>{c.target_module_id ? nameOf(c.target_module_id) : "DODRI Core"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.connection_type}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(c.permissions ?? []).map((p) => (
                      <span key={p} className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge label={c.status} />
                </TableCell>
                <TableCell className="text-right">
                  {can("connections.delete") && (
                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(connections.data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No connections defined.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
