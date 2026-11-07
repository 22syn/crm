import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { getHomePath } from "@/lib/homePath";
import { DashboardLayout } from "./DashboardLayout";
import { AccessPending } from "./AccessPending";

/** Routes that require leads module */
const LEADS_PATHS = ["/dashboard", "/leads", "/deals", "/design-requests", "/products", "/customers"];
/** Routes that require ad_agency module */
const AD_AGENCY_PREFIX = "/ad-agency";
/** Routes that require system admin */
const SYSTEM_PATHS = ["/suppliers", "/automations"];
/** Settings: system admins manage the team; module admins edit their company branding */
const SETTINGS_PATH = "/settings";
/** Shared routes - accessible by leads OR ad_agency */
const SHARED_PATHS = ["/contracts"];

export function ProtectedLayout() {
  const { session, loading, role, canAccessModule, isModuleAdmin } = useAuth();
  const { pathname } = useLocation();
  const homePath = getHomePath({ canAccessModule, isModuleAdmin });

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

  // No page to open (no roles, or only system/user): without this the guards below
  // redirect to a page the user also cannot open, in a loop, leaving a blank screen.
  if (!role || !homePath) {
    return <AccessPending />;
  }

  // Ad agency routes - require ad_agency
  if (pathname.startsWith(AD_AGENCY_PREFIX)) {
    if (!canAccessModule("ad_agency")) return <Navigate to={homePath} replace />;
  }
  else if (pathname === SETTINGS_PATH || pathname.startsWith(SETTINGS_PATH + "/")) {
    const canOpenSettings = isModuleAdmin("system") || isModuleAdmin("leads") || isModuleAdmin("ad_agency");
    if (!canOpenSettings) return <Navigate to={homePath} replace />;
  }
  // System routes - require system admin
  else if (SYSTEM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!isModuleAdmin("system")) return <Navigate to={homePath} replace />;
  }
  // Shared routes (contracts) - require leads OR ad_agency
  else if (SHARED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!canAccessModule("leads") && !canAccessModule("ad_agency")) return <Navigate to={homePath} replace />;
  }
  // Leads-only routes
  else if (LEADS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!canAccessModule("leads")) return <Navigate to={homePath} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
