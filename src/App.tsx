import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Deals from "./pages/Deals";
import Quotes from "./pages/Quotes";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import DesignRequests from "./pages/DesignRequests";
import Customers from "./pages/Customers";
import Automations from "./pages/Automations";
import QuoteApproval from "./pages/QuoteApproval";
import NotFound from "./pages/NotFound";
import AdAgencyDashboard from "./pages/ad-agency/AdAgencyDashboard";
import AdAgencyClients from "./pages/ad-agency/AdAgencyClients";
import AdAgencyClientDetail from "./pages/ad-agency/AdAgencyClientDetail";
import AdAgencyProjects from "./pages/ad-agency/AdAgencyProjects";
import AdAgencyProjectDetail from "./pages/ad-agency/AdAgencyProjectDetail";
import AdAgencyItems from "./pages/ad-agency/AdAgencyItems";
import { GlobalCommandPalette } from "./components/GlobalCommandPalette";

const queryClient = new QueryClient();

function RedirectToContractApproval() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/contracts/approve/${id}` : "/contracts"} replace />;
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
          <GlobalCommandPalette />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/contracts" element={<Quotes />} />
            <Route path="/contracts/approve/:id" element={<QuoteApproval />} />
            <Route path="/quotes" element={<Navigate to="/contracts" replace />} />
            <Route path="/quotes/approve/:id" element={<RedirectToContractApproval />} />
            <Route path="/products" element={<Products />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/design-requests" element={<DesignRequests />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/ad-agency" element={<AdAgencyDashboard />} />
            <Route path="/ad-agency/clients" element={<AdAgencyClients />} />
            <Route path="/ad-agency/clients/:id" element={<AdAgencyClientDetail />} />
            <Route path="/ad-agency/projects" element={<AdAgencyProjects />} />
            <Route path="/ad-agency/projects/:id" element={<AdAgencyProjectDetail />} />
            <Route path="/ad-agency/items" element={<AdAgencyItems />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
