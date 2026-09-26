import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, LayoutTemplate, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/cms/")({
  head: () => ({
    meta: [
      { title: "DODRI CMS — Content Management" },
      { name: "description", content: "Create, manage and publish content with DODRI CMS." },
      { property: "og:title", content: "DODRI CMS — Content Management" },
      { property: "og:description", content: "Create, manage and publish content with DODRI CMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CmsHomePage,
});

const features = [
  {
    icon: FileText,
    title: "Pages",
    description: "Build and manage website pages through a structured file tree.",
  },
  {
    icon: LayoutTemplate,
    title: "Sections",
    description: "Reusable content blocks: Hero, Grid, Footer, and more.",
  },
  {
    icon: Layers,
    title: "Modules",
    description: "CMS connects to Catalog, CRM, Orders and future modules.",
  },
];

function CmsHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/cms" className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span className="font-display text-sm font-bold">D</span>
            </span>
            <span className="font-display font-bold tracking-tight">DODRI CMS</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pb-12 pt-16 md:pt-24">
          <div
            className="absolute inset-x-0 top-0 h-[420px] opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 50% 0%, var(--primary-glow), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Powered by DODRI Platform Core</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Create. Manage.{" "}
              <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                Publish.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              The intelligent content layer for your business. Build pages, organize sections, and
              deliver content through one modular core.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-brand)" }}
              >
                Open Editor <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Back to Core
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group panel flex flex-col p-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span className="font-display font-semibold text-foreground">DODRI CORE</span>
          <span>Build your ecosystem, module by module.</span>
        </div>
      </footer>
    </div>
  );
}
