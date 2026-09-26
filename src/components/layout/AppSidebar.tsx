import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  Cable,
  Cog,
  Gauge,
  KeyRound,
  LayoutGrid,
  Plug,
  Plus,
  Settings2,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DodriLogo, DodriMark } from "@/components/brand/DodriLogo";
import { useModules } from "@/hooks/useCore";
import { moduleIcon } from "@/lib/dodri/icons";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openModule = useRouterState({
    select: (s) => (s.location.search as { module?: string })?.module,
  });
  const { data: modules } = useModules();
  const activeModules = (modules ?? []).filter((m) => m.enabled);

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/90 shadow-[var(--shadow-soft)]">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-2.5">
        {collapsed ? <DodriMark className="mx-auto h-8 w-8" /> : <DodriLogo />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <Gauge />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/administration/users")} tooltip="Users">
                  <Link to="/administration/users">
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/administration/roles")} tooltip="Roles">
                  <Link to="/administration/roles">
                    <Shield />
                    <span>Roles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/administration/permissions")}
                  tooltip="Permissions"
                >
                  <Link to="/administration/permissions">
                    <KeyRound />
                    <span>Permissions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/administration/activity-logs")}
                  tooltip="Activity Logs"
                >
                  <Link to="/administration/activity-logs">
                    <Activity />
                    <span>Activity Logs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeModules.length === 0 && !collapsed && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No modules installed</div>
              )}
              {activeModules.map((module) => {
                const Icon = moduleIcon(module.icon);
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/dashboard" && openModule === module.slug}
                      tooltip={module.name}
                    >
                      <Link to="/dashboard" search={{ module: module.slug }}>
                        <Icon />
                        <span>{module.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Add New Module">
                  <Link
                    to="/parameters/modules"
                    className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  >
                    <Plus />
                    <span>Add New Module</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Parameters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/parameters")} tooltip="General Settings">
                  <Link to="/parameters">
                    <SlidersHorizontal />
                    <span>General Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/parameters/company")}
                  tooltip="Company & Subscription"
                >
                  <Link to="/parameters/company">
                    <Building2 />
                    <span>Company &amp; Subscription</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/parameters/modules")}
                  tooltip="Modules Management"
                >
                  <Link to="/parameters/modules">
                    <LayoutGrid />
                    <span>Modules Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/parameters/connections")}
                  tooltip="Connections"
                >
                  <Link to="/parameters/connections">
                    <Cable />
                    <span>Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/parameters/system")}
                  tooltip="System Configuration"
                >
                  <Link to="/parameters/system">
                    <Cog />
                    <span>System Configuration</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/parameters/api")}
                  tooltip="API & Integrations"
                >
                  <Link to="/parameters/api">
                    <Plug />
                    <span>API &amp; Integrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        {!collapsed && (
          <div className="rounded-md border border-primary/15 bg-primary/5 px-3 py-2.5 text-center">
            <Settings2 className="mx-auto mb-1 h-4 w-4 text-primary" />
            <div className="font-display text-sm font-semibold text-gradient">DODRI CORE</div>
            <div className="label-tech mt-1">v1.0.0</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
