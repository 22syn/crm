import type { LucideIcon } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useDirection } from "@radix-ui/react-direction";
import { useAuth } from "@/contexts/AuthContext";
import { useAppBranding } from "@/hooks/useAppBranding";
import { getLogoFitClass } from "@/lib/branding";
import { useAreaLanguage, useModuleDirection } from "@/hooks/useAppLanguage";
import { getShellCopy } from "@/lib/shellCopy";
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
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Settings,
  Handshake,
  Truck,
  Palette,
  UserCheck,
  Zap,
  LayoutGrid,
  ListTodo,
  Receipt,
} from "lucide-react";

/** Hadarya module: Dashboard + leads pipeline */
/** Hadarya section: Dashboard first, then Leads, Contracts, etc. */
const hadaryaItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, module: "leads" as const },
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
  { title: "הצעות מחיר", url: "/ad-agency/price-quotes", icon: Receipt, module: "ad_agency" as const },
  { title: "משימות", url: "/ad-agency/tasks", icon: ListTodo, module: "ad_agency" as const },
  { title: "פריטים", url: "/ad-agency/items", icon: Package, module: "ad_agency" as const },
];

/** Menu sub-menu: Customers, Products, Suppliers */
const catalogSubItems = [
  { title: "Customers", url: "/customers", icon: UserCheck, module: "leads" as const },
  { title: "Products", url: "/products", icon: Package, module: "leads" as const },
  { title: "Suppliers", url: "/suppliers", icon: Truck, module: "system" as const },
];

/** Admin section: Automations, Settings. Shown to admins of any module, so labels follow the area's language. */
const adminItems = [
  { labelKey: "automations", url: "/automations", icon: Zap, module: "system" as const },
  { labelKey: "settings", url: "/settings", icon: Settings, module: "system" as const },
] as const;

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
          <SidebarMenuButton
            asChild
            isActive={isActive(item)}
            tooltip={item.title}
            className="group px-3 py-2 rounded-lg hover:!bg-transparent hover:!text-inherit data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary-foreground"
          >
            <Link to={item.url} className="flex items-center gap-3">
              <item.icon className="h-5 w-5 shrink-0 text-sidebar-foreground/70 group-data-[active=true]:text-sidebar-primary" />
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
  const { canAccessModule, isModuleAdmin } = useAuth();
  const { branding, isLoading: brandingLoading } = useAppBranding();
  const copy = getShellCopy(useAreaLanguage().language);
  // Menu sits on the reading-start side: right for Hebrew clients, left for English ones.
  const side = useDirection() === "rtl" ? "right" : "left";
  // In the shared demo the two modules differ in language, so each group keeps its own direction.
  const leadsDir = useModuleDirection(canAccessModule("leads") ? "leads" : undefined);
  const adAgencyDir = useModuleDirection(canAccessModule("ad_agency") ? "ad_agency" : undefined);

  const canShowCatalogItem = (item: (typeof catalogSubItems)[0]) =>
    item.module === "leads" ? canAccessModule("leads") : isModuleAdmin("system");
  // Module admins reach Settings to edit their own company branding.
  const canShowAdminItem = (item: (typeof adminItems)[number]) =>
    isModuleAdmin("system") ||
    (item.url === "/settings" && (isModuleAdmin("leads") || isModuleAdmin("ad_agency")));

  const adminItemsVisible = adminItems.filter(canShowAdminItem);

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center gap-2 px-3 group-data-[collapsible=icon]:px-2">
        <Link
          to="/dashboard"
          className={`flex min-w-0 flex-1 items-center gap-3 group-data-[collapsible=icon]:flex-initial ${brandingLoading ? "invisible" : ""}`}
        >
          <img
            src={branding.logoUrl}
            alt={copy.logoAlt(branding.name)}
            className={`w-8 h-8 shrink-0 rounded-lg ${getLogoFitClass(branding.logoUrl)}`}
          />
          <div className="flex min-w-0 flex-1 flex-col items-start group-data-[collapsible=icon]:hidden">
            <span className="text-white font-semibold text-xl tracking-tight truncate">{branding.name}</span>
          </div>
        </Link>
        <SidebarTrigger className="shrink-0 cursor-pointer text-sidebar-foreground/70 transition-colors duration-200 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {canAccessModule("leads") && (
          <SidebarGroup className="p-1.5" dir={leadsDir}>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">Hadarya</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItems
                  items={hadaryaItems}
                  canShow={(i) => canAccessModule(i.module)}
                  isActive={(i) => location.pathname === i.url || (i.url !== "/dashboard" && location.pathname.startsWith(i.url + "/"))}
                />
                <NavItems
                  items={catalogSubItems}
                  canShow={canShowCatalogItem}
                  isActive={(i) => location.pathname === i.url || location.pathname.startsWith(i.url + "/")}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canAccessModule("ad_agency") && (
          <SidebarGroup className="mt-2 p-1.5" dir={adAgencyDir}>
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
        )}

        {adminItemsVisible.length > 0 && (
          <SidebarGroup className="mt-2 p-1.5">
            <SidebarGroupLabel>{copy.adminGroup}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItemsVisible.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={copy[item.labelKey]}
                      className="group px-3 py-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary/20 data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0 text-sidebar-foreground/70 group-data-[active=true]:text-sidebar-primary" />
                        <span>{copy[item.labelKey]}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {/* Desktop: edge rail for collapse/expand (VS Code, Linear pattern) */}
      <SidebarRail />
    </Sidebar>
  );
}
