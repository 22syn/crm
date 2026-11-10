import { Fragment } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAreaLanguage } from "@/hooks/useAppLanguage";
import { getShellCopy } from "@/lib/shellCopy";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Route-to-label mapping for breadcrumb trails and mobile header title. */
export const ROUTE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/quotes": "Contracts",
  "/contracts": "Contracts",
  "/deals": "Deals",
  "/design-requests": "Designs",
  "/customers": "Customers",
  "/products": "Products",
  "/suppliers": "Suppliers",
  "/automations": "Automations",
  "/settings": "Settings",
  "/ad-agency": "משרד פרסום",
  "/ad-agency/clients": "לקוחות",
  "/ad-agency/projects": "פרויקטים",
  "/ad-agency/tasks": "משימות",
  "/ad-agency/items": "פריטים",
  "/ad-agency/price-quotes": "הצעות מחיר",
};

export function DashboardBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  const { language } = useAreaLanguage();
  const dashboardLabel = getShellCopy(language).dashboard;

  // Build breadcrumb segments from path — Stitch spec: "Dashboard > Section > Page"
  const segments = pathname.split("/").filter(Boolean);
  const items: { path: string; label: string }[] = [];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    let label = ROUTE_MAP[acc] ?? (seg === "approve" ? "Approve" : decodeURIComponent(seg));
    if (i === 1 && segments[0] === "leads" && seg?.match(/^[0-9a-f-]{36}$/i)) label = "Lead";
    items.push({ path: acc, label });
  }

  // The ad agency area has its own dashboard at /ad-agency; /dashboard belongs to the leads module.
  const isAgencyArea = segments[0] === "ad-agency";
  if (items.length === 0) {
    items.push({ path: "/dashboard", label: dashboardLabel });
  } else if (items[0]?.path === "/dashboard") {
    items[0] = { path: "/dashboard", label: dashboardLabel };
  } else if (!isAgencyArea) {
    items.unshift({ path: "/dashboard", label: dashboardLabel });
  }

  if (items.length <= 1) {
    const path = items[0]?.path ?? "/dashboard";
    const label = items[0]?.label ?? dashboardLabel;
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={path}>{label}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={item.path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
