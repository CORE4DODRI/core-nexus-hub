import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logActivity, type ModuleRow } from "@/hooks/useCore";
import { cn } from "@/lib/utils";

export type ModuleFileNode = {
  name: string;
  type: "folder" | "file";
  language?: string;
  content?: string;
  children?: ModuleFileNode[];
};

function starterFiles(module: ModuleRow): ModuleFileNode[] {
  const component = module.name.replace(/[^a-zA-Z0-9]/g, "") || "Module";
  return [
    {
      name: module.slug,
      type: "folder",
      children: [
        {
          name: "src",
          type: "folder",
          children: [
            { name: "components", type: "folder", children: [] },
            {
              name: "pages",
              type: "folder",
              children: [
                {
                  name: "Home.tsx",
                  type: "file",
                  language: "TypeScript React",
                  content: `import { ${component}Overview } from "../components/${component}Overview";\n\nexport default function Home() {\n  return (\n    <main>\n      <${component}Overview />\n    </main>\n  );\n}\n`,
                },
                { name: "About.tsx", type: "file", language: "TypeScript React", content: `export default function About() {\n  return <main>${module.name} module</main>;\n}\n` },
                { name: "Contact.tsx", type: "file", language: "TypeScript React", content: "export default function Contact() {\n  return <main>Contact</main>;\n}\n" },
              ],
            },
            {
              name: "sections",
              type: "folder",
              children: [
                { name: "Hero.tsx", type: "file", language: "TypeScript React", content: `export function Hero() {\n  return <section>${module.name}</section>;\n}\n` },
                { name: "ModuleGrid.tsx", type: "file", language: "TypeScript React", content: "export function ModuleGrid() {\n  return <section />;\n}\n" },
                { name: "Footer.tsx", type: "file", language: "TypeScript React", content: "export function Footer() {\n  return <footer />;\n}\n" },
              ],
            },
          ],
        },
        { name: "assets", type: "folder", children: [{ name: "images", type: "folder", children: [] }, { name: "icons", type: "folder", children: [] }] },
        { name: "styles", type: "folder", children: [] },
        { name: "config", type: "folder", children: [
          { name: "settings.ts", type: "file", language: "TypeScript", content: `export const moduleName = "${module.name}";\nexport const version = "${module.version}";\n` },
          { name: "routes.ts", type: "file", language: "TypeScript", content: `export const baseRoute = "${module.route ?? `/modules/${module.slug}`}";\n` },
        ] },
        { name: "package.json", type: "file", language: "JSON", content: `{"name":"@dodri/${module.slug}","version":"${module.version}"}\n` },
        { name: "README.md", type: "file", language: "Markdown", content: `# ${module.name}\n\n${module.description ?? "DODRI module workspace."}\n` },
      ],
    },
  ];
}

function configuredFiles(module: ModuleRow): ModuleFileNode[] {
  const value = module.configuration?.["files"];
  return Array.isArray(value) ? (value as ModuleFileNode[]) : starterFiles(module);
}

function flattenFiles(nodes: ModuleFileNode[], prefix = ""): Array<{ path: string; node: ModuleFileNode }> {
  return nodes.flatMap((node) => {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    return node.type === "file" ? [{ path, node }] : flattenFiles(node.children ?? [], path);
  });
}

function updateFile(nodes: ModuleFileNode[], path: string, content: string, prefix = ""): ModuleFileNode[] {
  return nodes.map((node) => {
    const nodePath = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.type === "file" && nodePath === path) return { ...node, content };
    if (node.type === "folder") return { ...node, children: updateFile(node.children ?? [], path, content, nodePath) };
    return node;
  });
}

function FileIcon({ name }: { name: string }) {
  if (name.endsWith(".json")) return <FileJson className="text-warning" />;
  if (name.endsWith(".md")) return <FileText className="text-violet" />;
  return <FileCode2 className="text-primary" />;
}

function TreeRow({
  node,
  path,
  depth,
  selectedPath,
  onSelect,
}: {
  node: ModuleFileNode;
  path: string;
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  if (node.type === "folder") {
    return (
      <li>
        <button className="file-tree-row" style={{ paddingLeft: `${depth * 12 + 4}px` }} onClick={() => setOpen((value) => !value)}>
          {open ? <ChevronDown /> : <ChevronRight />}
          {open ? <FolderOpen className="text-warning" /> : <Folder className="text-warning" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && <ul>{(node.children ?? []).map((child) => <TreeRow key={`${path}/${child.name}`} node={child} path={`${path}/${child.name}`} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />)}</ul>}
      </li>
    );
  }
  return (
    <li>
      <button className={cn("file-tree-row", selectedPath === path && "is-selected")} style={{ paddingLeft: `${depth * 12 + 20}px` }} onClick={() => onSelect(path)}>
        <FileIcon name={node.name} />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  );
}

export function ModuleWorkspace({
  modules,
  center,
  aside,
}: {
  modules: ModuleRow[];
  center?: ReactNode;
  aside?: ReactNode;
}) {
  const { can, user, profile } = useAuth();
  const queryClient = useQueryClient();
  const enabledModules = modules.filter((module) => module.enabled);
  const [moduleId, setModuleId] = useState(enabledModules[0]?.id ?? "");
  const module = enabledModules.find((item) => item.id === moduleId) ?? enabledModules[0];
  const files = useMemo(() => (module ? configuredFiles(module) : []), [module]);
  const flatFiles = useMemo(() => flattenFiles(files), [files]);
  const [selectedPath, setSelectedPath] = useState("");
  const selectedFile = flatFiles.find((file) => file.path === selectedPath) ?? flatFiles[0];
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (module && module.id !== moduleId) setModuleId(module.id);
  }, [module, moduleId]);

  useEffect(() => {
    const first = flatFiles[0];
    setSelectedPath(first?.path ?? "");
  }, [moduleId]);

  useEffect(() => {
    setDraft(selectedFile?.node.content ?? "");
  }, [selectedFile?.path, selectedFile?.node.content]);

  const dirty = Boolean(selectedFile && draft !== (selectedFile.node.content ?? ""));
  const lineCount = Math.max(1, draft.split("\n").length);

  async function save() {
    if (!module || !selectedFile || !can("modules.configure")) return;
    setSaving(true);
    const nextFiles = updateFile(files, selectedFile.path, draft);
    const { error } = await supabase.from("modules").update({ configuration: { ...module.configuration, files: nextFiles } }).eq("id", module.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user) await logActivity({ userId: user.id, actor: profile?.email ?? null, action: "module.file.updated", entityType: "module", entityId: module.id, description: `${selectedFile.node.name} saved in ${module.name}` });
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["modules"] }), queryClient.invalidateQueries({ queryKey: ["activity_logs"] })]);
    toast.success(`${selectedFile.node.name} saved`);
  }

  if (!module) {
    return (
      <div className="grid gap-2.5 xl:grid-cols-[230px_minmax(420px,1fr)_330px]">
        <section className="panel grid min-h-[200px] place-items-center p-6 text-center text-xs text-muted-foreground">Enable a module to open its workspace.</section>
        {center}
        <div className="flex min-w-0 flex-col gap-2.5">{aside}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 xl:grid-cols-[230px_minmax(420px,1fr)_330px]">
      <section className="panel flex min-h-[510px] min-w-0 flex-col overflow-hidden p-3">
        <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
          <div className="section-title">Project Files</div>
          <div className="flex items-center gap-1 text-primary"><Plus className="h-3.5 w-3.5" /><RefreshCw className="h-3.5 w-3.5" /></div>
        </div>
        <Select value={module.id} onValueChange={setModuleId}>
          <SelectTrigger className="mt-3 h-9 border-primary/20 bg-primary/5 text-xs font-semibold"><SelectValue /></SelectTrigger>
          <SelectContent>{enabledModules.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="mt-2 min-h-0 flex-1 overflow-auto pr-1 text-xs">
          <ul>{files.map((node) => <TreeRow key={node.name} node={node} path={node.name} depth={0} selectedPath={selectedFile?.path ?? ""} onSelect={setSelectedPath} />)}</ul>
        </div>
        <div className="mt-2 border-t border-border/60 pt-2 font-mono text-[9px] text-muted-foreground">{flatFiles.length} files · {module.version}</div>
      </section>

      {center}

      <div className="flex min-h-[510px] min-w-0 flex-col gap-2.5">
      {aside}
      <section className="panel flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden p-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 pb-2">
          <div className="min-w-0"><div className="section-title truncate">Editing: {selectedFile?.node.name ?? "No file"}{dirty && <span className="ml-1 text-warning">●</span>}</div><div className="mt-1 truncate font-mono text-[8px] text-muted-foreground">{selectedFile?.path}</div></div>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="code-editor flex min-h-0 flex-1 flex-col overflow-hidden rounded-md">
          <div className="flex h-9 items-center border-b border-editor-line px-2 text-[10px]">
            <span className="flex h-full items-center gap-1.5 border-r border-editor-line bg-editor-active px-2 text-editor-foreground"><Code2 className="h-3.5 w-3.5 text-cyan" />{selectedFile?.node.name}<X className="ml-2 h-3 w-3" /></span>
            <Plus className="ml-2 h-3.5 w-3.5 text-editor-muted" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[38px_minmax(0,1fr)]">
            <div className="overflow-hidden border-r border-editor-line py-3 text-right font-mono text-[10px] leading-5 text-editor-muted">{Array.from({ length: lineCount }, (_, i) => <div key={i} className="pr-2">{i + 1}</div>)}</div>
            <textarea aria-label="Module file editor" spellCheck={false} value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[180px] w-full resize-none bg-transparent p-3 font-mono text-[11px] leading-5 text-editor-foreground outline-none" />
          </div>
          <div className="flex min-h-9 items-center gap-3 border-t border-editor-line px-3 font-mono text-[9px] text-editor-muted">
            <span>Ln {lineCount}, Col 1</span><span>{selectedFile?.node.language ?? "Text"}</span><span>UTF-8</span>
            <Button size="sm" onClick={save} disabled={!dirty || saving || !can("modules.configure")} className="ml-auto h-7"><Save />{saving ? "Saving" : "Save"}</Button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}