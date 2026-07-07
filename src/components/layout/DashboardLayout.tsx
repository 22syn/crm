import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { ROUTE_MAP } from "./DashboardBreadcrumb";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

function MobileHeaderTitle() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const label =
    ROUTE_MAP[pathname]
    ?? (segments[0] === "leads" && segments[1]?.match(/^[0-9a-f-]{36}$/i) ? "Lead" : null)
    ?? (pathname.startsWith("/contracts/approve") ? "Approve" : null)
    ?? ROUTE_MAP[`/${segments[0]}`]
    ?? segments[segments.length - 1]
    ?? "Dashboard";
  return <span className="text-lg font-semibold text-foreground truncate">{label}</span>;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session, role, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-display font-semibold">Access Pending</h1>
          <p className="text-muted-foreground">
            Your account has been created but you don't have CRM access yet.
            Please contact an administrator to get your role assigned.
          </p>
        </div>
      </div>
    );
  }

  const isAdAgency = pathname.startsWith("/ad-agency");
  const mainDir = isAdAgency ? "rtl" : undefined;

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:hidden">
          <SidebarTrigger aria-label="Open menu" className="shrink-0" />
          <div className="flex-1 min-w-0 flex items-center">
            <MobileHeaderTitle />
          </div>
        </header>
        <main
          className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden bg-white"
          dir={mainDir}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
