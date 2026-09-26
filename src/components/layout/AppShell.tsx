import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { AccessGate } from "./AccessGate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/60">
        <AppSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppHeader />
          <SubscriptionBanner />
          <main className="flex min-w-0 flex-1 flex-col p-2.5 md:p-3">
            <AccessGate>{children}</AccessGate>
          </main>
          <footer className="mx-3 flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-border/70 px-2 py-2 text-[10px] text-muted-foreground">
            <span className="font-display font-bold text-primary">DODRI CORE</span>
            <span>Build your ecosystem, module by module.</span>
            <span className="flex items-center gap-1.5 text-success"><span className="status-dot bg-success" /> All Systems Operational</span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
