import { ExternalLink, FileText, LayoutTemplate, Image } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { ModuleUIProps } from "@/modules/registry";

/**
 * Demo module UI — proves the Core can host a module in-place.
 * Replace this content with the real CMS front-office when it ships.
 */
export default function CmsModuleUI({ name, version }: ModuleUIProps) {
  const cards = [
    { label: "Pages", value: "Home, About, Contact", icon: LayoutTemplate },
    { label: "Sections", value: "Hero, Grid, Footer", icon: FileText },
    { label: "Assets", value: "Images, Icons", icon: Image },
  ];

  return (
    <div className="space-y-3">
      <div>
        <div className="label-tech">Module surface</div>
        <h2 className="font-display text-lg font-bold text-gradient">{name} workspace</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Rendered inside the Core by <code className="font-mono">src/modules/cms/index.tsx</code> · v{version}
        </p>
        <Button asChild size="sm" className="mt-2">
          <Link to="/cms">
            <ExternalLink className="mr-2 h-4 w-4" /> Open Front-office
          </Link>
        </Button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-border/80 bg-card/75 p-3">
            <card.icon className="h-4 w-4 text-primary" />
            <div className="mt-2 text-xs font-semibold">{card.label}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
