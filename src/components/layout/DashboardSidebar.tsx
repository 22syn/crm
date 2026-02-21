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
} from "lucide-react";

/** Dashboard first—visible to all users. */
const primaryItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const menuItems = [
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Contracts", url: "/contracts", icon: FileText },
  { title: "Designs", url: "/design-requests", icon: Palette },
  { title: "Deals", url: "/deals", icon: Handshake },
];

/** Admin section—excludes Dashboard (now in primary). */
const adminItems = [
  { title: "Customers", url: "/customers", icon: UserCheck },
  { title: "Products", url: "/products", icon: Package },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Automations", url: "/automations", icon: Zap },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const { state } = useSidebar();

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
              {primaryItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2">
            <span>Menu</span>
            <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:hidden" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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

        {role === "admin" && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
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
