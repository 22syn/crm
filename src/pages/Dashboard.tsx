import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeadsBySourceChart } from "@/components/dashboard/LeadsBySourceChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeRange } from "@/contexts/DashboardContext";

function DashboardContent() {
  const { timeRange, setTimeRange } = useDashboard();
  const { role, user } = useAuth();

  return (
    <div className="space-y-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display font-semibold">Dashboard</h1>
          <p className="text-body text-muted-foreground mt-1">
            {role === "sales" ? "My Pipeline" : "CRM performance overview"}
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
          <SelectTrigger className="w-[160px] rounded-sm">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatsCards timeRange={timeRange} role={role} userId={user?.id} />

      <div className="grid gap-4 md:grid-cols-2 animate-card-enter opacity-0" style={{ animationDelay: "200ms" }}>
        <OrdersChart assignedTo={role === "sales" ? user?.id : undefined} />
        <LeadsBySourceChart assignedTo={role === "sales" ? user?.id : undefined} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-card-enter opacity-0" style={{ animationDelay: "300ms" }}>
        <ActivityFeed assignedTo={role === "sales" ? user?.id : undefined} />
        <QuickActions />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </DashboardLayout>
  );
}
