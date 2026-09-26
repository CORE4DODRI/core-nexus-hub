import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search, Settings, ShieldCheck, Sparkles, Sun, User as UserIcon, UserCog } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { displayName, useAuth } from "@/hooks/useAuth";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/administration/users": "Administration / Users",
  "/administration/roles": "Administration / Roles",
  "/administration/permissions": "Administration / Permissions",
  "/administration/activity-logs": "Administration / Activity Logs",
  "/parameters": "Parameters / General Settings",
  "/parameters/modules": "Parameters / Modules Management",
  "/parameters/connections": "Parameters / Connections",
  "/parameters/system": "Parameters / System Configuration",
  "/parameters/api": "Parameters / API & Integrations",
};

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, roleName, user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const title = TITLES[pathname] ?? (pathname.startsWith("/modules/") ? "Modules" : "DODRI Core");
  const name = displayName(profile, user?.email);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/80 bg-card/75 px-2.5 shadow-[var(--shadow-soft)] backdrop-blur-xl md:px-4">
      <SidebarTrigger />
      <div className="hidden min-w-0 xl:block">
        <div className="truncate font-display text-xs font-semibold text-primary">{title}</div>
        <div className="label-tech hidden text-[8px] sm:block">Connect • Manage • Grow</div>
      </div>

      <div className="mx-auto hidden items-center gap-2 lg:flex">
        <Sparkles className="h-3.5 w-3.5 text-cyan" />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          The Intelligence Layer for Your Business
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search modules, users, settings..." className="h-8 w-56 rounded-md border-primary/15 bg-background/70 pl-9 text-xs lg:w-64" />
        </div>

        <Button variant="ghost" size="icon" aria-label="Appearance" className="hidden h-8 w-8 sm:inline-flex"><Sun /></Button>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full border border-card bg-destructive" />
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Settings" className="hidden h-8 w-8 sm:inline-flex">
          <Link to="/parameters">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md border border-border/70 bg-card/80 py-0.5 pl-0.5 pr-2 text-left transition-colors hover:bg-accent">
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials || "DC"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-semibold">{name}</span>
                <span className="block text-[10px] text-muted-foreground">{roleName ?? "No role"}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserCog className="mr-2 h-4 w-4" /> My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/security">
                <ShieldCheck className="mr-2 h-4 w-4" /> Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
