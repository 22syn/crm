import type { LucideIcon } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Settings,
  LogOut,
  ChevronUp,
  User,
  Handshake,
  Truck,
  Palette,
  UserCheck,
  Zap,
  LayoutGrid,
  ListTodo,
  Receipt,
} from "lucide-react";

/** Dashboard first—leads module */
const primaryItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "leads" as const },
];

const menuItems = [
  { title: "Leads", url: "/leads", icon: Users, module: "leads" as const },
  { title: "Contracts", url: "/contracts", icon: FileText, module: "leads" as const },
  { title: "Designs", url: "/design-requests", icon: Palette, module: "leads" as const },
  { title: "Deals", url: "/deals", icon: Handshake, module: "leads" as const },
];

/** משרד פרסום */
const adAgencyItems = [
  { title: "דשבורד", url: "/ad-agency", icon: LayoutGrid, module: "ad_agency" as const },
  { title: "לקוחות", url: "/ad-agency/clients", icon: Users, module: "ad_agency" as const },
  { title: "פרויקטים", url: "/ad-agency/projects", icon: FileText, module: "ad_agency" as const },
  { title: "הצעות מחיר", url: "/contracts", icon: Receipt, module: "ad_agency" as const },
  { title: "משימות", url: "/ad-agency/tasks", icon: ListTodo, module: "ad_agency" as const },
  { title: "פריטים", url: "/ad-agency/items", icon: Package, module: "ad_agency" as const },
];

/** Admin section: leads (Customers, Products) + system (Suppliers, Automations, Settings) */
const adminItems = [
  { title: "Customers", url: "/customers", icon: UserCheck, module: "leads" as const },
  { title: "Products", url: "/products", icon: Package, module: "leads" as const },
  { title: "Suppliers", url: "/suppliers", icon: Truck, module: "system" as const },
  { title: "Automations", url: "/automations", icon: Zap, module: "system" as const },
  { title: "Settings", url: "/settings", icon: Settings, module: "system" as const },
];

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  module: "leads" | "ad_agency" | "system";
};

function NavItems({
  items,
  canShow,
  isActive,
}: {
  items: NavItem[];
  canShow: (item: NavItem) => boolean;
  isActive: (item: NavItem) => boolean;
}) {
  const visible = items.filter(canShow);
  return (
    <>
      {visible.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.title}>
            <Link to={item.url}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}

export function DashboardSidebar() {
  const location = useLocation();
  const { user, role, signOut, canAccessModule, isModuleAdmin } = useAuth();
  const { state } = useSidebar();

  const canShowAdminItem = (item: (typeof adminItems)[0]) =>
    item.module === "leads"
      ? canAccessModule("leads")
      : isModuleAdmin("system");

  const adminItemsVisible = adminItems.filter(canShowAdminItem);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
        >
          <div className="flex flex-col items-center w-full min-w-0 group-data-[collapsible=icon]:items-center">
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">Demo CRM</span>
            <LayoutDashboard className="h-5 w-5 shrink-0 text-sidebar-foreground hidden group-data-[collapsible=icon]:block" />
            <span className="text-[10px] tracking-[0.2em] text-sidebar-foreground/60 uppercase group-data-[collapsible=icon]:hidden">Premium Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={primaryItems}
                canShow={(i) => canAccessModule(i.module)}
                isActive={(i) => location.pathname === i.url}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2">
            <span>Menu</span>
            <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:hidden" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={menuItems}
                canShow={(i) => canAccessModule(i.module)}
                isActive={(i) => location.pathname === i.url}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>משרד פרסום</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItems
                items={adAgencyItems}
                canShow={(i) => canAccessModule(i.module)}
                isActive={(i) =>
                  location.pathname === i.url ||
                  (i.url !== "/ad-agency" && location.pathname.startsWith(i.url + "/"))
                }
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItemsVisible.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItemsVisible.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-8"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start text-sm min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-medium truncate max-w-[140px]">
                      {user?.email}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" hidden={state !== "collapsed"}>
              {user?.email}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
