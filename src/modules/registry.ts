import { lazy, type ComponentType } from "react";

/**
 * Module UI registry.
 *
 * Drop a module folder here — src/modules/<slug>/index.tsx — exporting a
 * default React component. The Core picks it up automatically and renders it
 * inside the dashboard when the matching registry entry (same slug) is
 * enabled in the database.
 *
 * Nothing is hard-coded: existence in the DB registry controls navigation,
 * this folder controls the UI surface.
 */
export type ModuleUIProps = {
  slug: string;
  name: string;
  version: string;
};

const loaders = import.meta.glob("./*/index.tsx") as Record<
  string,
  () => Promise<{ default: ComponentType<ModuleUIProps> }>
>;

const bySlug = new Map<string, () => Promise<{ default: ComponentType<ModuleUIProps> }>>(
  Object.entries(loaders).map(([path, loader]) => [path.split("/")[1] ?? "", loader]),
);

export function hasModuleUI(slug: string) {
  return bySlug.has(slug);
}

export function getModuleUI(slug: string) {
  const loader = bySlug.get(slug);
  return loader ? lazy(loader) : null;
}

export function registeredModuleUIs() {
  return Array.from(bySlug.keys());
}
