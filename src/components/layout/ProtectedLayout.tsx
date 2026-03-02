import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "./DashboardLayout";

export function ProtectedLayout() {
  const { session, loading, role, canAccessModule } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 p-4">
        <p className="text-zinc-600 dark:text-zinc-400">Access Pending</p>
      </div>
    );
  }

  if (pathname.startsWith("/ad-agency") && !canAccessModule("ad_agency")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
