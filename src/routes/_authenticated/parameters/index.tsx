import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSystemSettings } from "@/hooks/useCore";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/parameters/")({
  head: () => ({
    meta: [
      { title: "General Settings — DODRI Platform Core" },
      { name: "description", content: "Platform identity, timezone and maintenance settings." },
      { property: "og:title", content: "General Settings — DODRI Platform Core" },
      { property: "og:description", content: "Platform identity and maintenance settings." },
    ],
  }),
  component: GeneralSettingsPage,
});

function valueOf(v: unknown) {
  return typeof v === "string" ? v : JSON.stringify(v ?? "");
}

function GeneralSettingsPage() {
  const settings = useSystemSettings();
  const { can } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const rows = settings.data ?? [];
    const next: Record<string, string> = {};
    for (const r of rows) next[r.key] = valueOf(r.value);
    setDraft(next);
    setMaintenance(rows.find((r) => r.key === "maintenance_mode")?.value === true);
  }, [settings.data]);

  const editable = can("settings.manage");

  async function save(key: string, value: string | boolean) {
    const { error } = await supabase.from("system_settings").update({ value }).eq("key", key);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Setting saved.");
    qc.invalidateQueries({ queryKey: ["system_settings"] });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Parameters"
        title="General Settings"
        description="Core identity and global behaviour."
      />

      <div className="panel space-y-5 p-5">
        {["platform_name", "platform_timezone"].map((key) => (
          <div key={key} className="space-y-1.5">
            <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
            <div className="flex gap-2">
              <Input
                value={draft[key] ?? ""}
                disabled={!editable}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
              {editable && (
                <Button variant="secondary" onClick={() => save(key, draft[key] ?? "")}>
                  Save
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div>
            <div className="text-sm font-medium">Maintenance mode</div>
            <div className="text-xs text-muted-foreground">Temporarily restrict access to the platform.</div>
          </div>
          <Switch
            checked={maintenance}
            disabled={!editable}
            onCheckedChange={(v) => {
              setMaintenance(v);
              void save("maintenance_mode", v);
            }}
          />
        </div>
      </div>
    </div>
  );
}
