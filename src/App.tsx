import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import { GlobalCommandPalette } from "./components/GlobalCommandPalette";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const Deals = lazy(() => import("./pages/Deals"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Products = lazy(() => import("./pages/Products"));
const Settings = lazy(() => import("./pages/Settings"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const DesignRequests = lazy(() => import("./pages/DesignRequests"));
const Customers = lazy(() => import("./pages/Customers"));
const Automations = lazy(() => import("./pages/Automations"));
const QuoteApproval = lazy(() => import("./pages/QuoteApproval"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdAgencyDashboard = lazy(() => import("./pages/ad-agency/AdAgencyDashboard"));
const AdAgencyClients = lazy(() => import("./pages/ad-agency/AdAgencyClients"));
const AdAgencyClientDetail = lazy(() => import("./pages/ad-agency/AdAgencyClientDetail"));
const AdAgencyProjects = lazy(() => import("./pages/ad-agency/AdAgencyProjects"));
const AdAgencyProjectDetail = lazy(() => import("./pages/ad-agency/AdAgencyProjectDetail"));
const AdAgencyTasks = lazy(() => import("./pages/ad-agency/AdAgencyTasks"));
const AdAgencyItems = lazy(() => import("./pages/ad-agency/AdAgencyItems"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function RedirectToContractApproval() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/contracts/approve/${id}` : "/contracts"} replace />;
}

function AuthAwareCommandPalette() {
  const { session } = useAuth();
  if (!session) return null;
  return <GlobalCommandPalette />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AuthAwareCommandPalette />
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-600 dark:text-zinc-400" />
              </div>
            }
          >
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="deals" element={<Deals />} />
              <Route path="contracts" element={<Quotes />} />
              <Route path="contracts/approve/:id" element={<QuoteApproval />} />
              <Route path="quotes" element={<Navigate to="/contracts" replace />} />
              <Route path="quotes/approve/:id" element={<RedirectToContractApproval />} />
              <Route path="products" element={<Products />} />
              <Route path="settings" element={<Settings />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="design-requests" element={<DesignRequests />} />
              <Route path="customers" element={<Customers />} />
              <Route path="automations" element={<Automations />} />
              <Route path="ad-agency" element={<AdAgencyDashboard />} />
              <Route path="ad-agency/clients" element={<AdAgencyClients />} />
              <Route path="ad-agency/clients/:id" element={<AdAgencyClientDetail />} />
              <Route path="ad-agency/projects" element={<AdAgencyProjects />} />
              <Route path="ad-agency/projects/:id" element={<AdAgencyProjectDetail />} />
              <Route path="ad-agency/tasks" element={<AdAgencyTasks />} />
              <Route path="ad-agency/items" element={<AdAgencyItems />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
