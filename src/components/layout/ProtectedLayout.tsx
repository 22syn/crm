import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";

/** Routes that require leads module */
const LEADS_PATHS = ["/dashboard", "/leads", "/deals", "/design-requests", "/products", "/customers"];
/** Routes that require ad_agency module */
const AD_AGENCY_PREFIX = "/ad-agency";
/** Routes that require system admin */
const SYSTEM_PATHS = ["/suppliers", "/automations", "/settings"];
/** Shared routes - accessible by leads OR ad_agency */
const SHARED_PATHS = ["/contracts"];

function getDefaultRedirect(canAccessModule: (m: "leads" | "ad_agency" | "system") => boolean, isModuleAdmin: (m: "leads" | "ad_agency" | "system") => boolean) {
  if (canAccessModule("leads")) return "/dashboard";
  if (canAccessModule("ad_agency")) return "/ad-agency";
  if (isModuleAdmin("system")) return "/settings";
  return "/dashboard";
}

export function ProtectedLayout() {
  const { session, loading, role, canAccessModule, isModuleAdmin } = useAuth();
  const { pathname } = useLocation();
  const defaultRedirect = getDefaultRedirect(canAccessModule, isModuleAdmin);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-900 p-4">
        <p className="text-zinc-600 dark:text-zinc-400">Access Pending</p>
      </div>
    );
  }

  // Ad agency routes - require ad_agency
  if (pathname.startsWith(AD_AGENCY_PREFIX)) {
    if (!canAccessModule("ad_agency")) return <Navigate to={defaultRedirect} replace />;
  }
  // System routes - require system admin
  else if (SYSTEM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!isModuleAdmin("system")) return <Navigate to={defaultRedirect} replace />;
  }
  // Shared routes (contracts) - require leads OR ad_agency
  else if (SHARED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!canAccessModule("leads") && !canAccessModule("ad_agency")) return <Navigate to={defaultRedirect} replace />;
  }
  // Leads-only routes
  else if (LEADS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!canAccessModule("leads")) return <Navigate to={defaultRedirect} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
