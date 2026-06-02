import { StatsCardsStitch } from "@/components/dashboard/StatsCardsStitch";
import { SalesPipelineChart } from "@/components/dashboard/SalesPipelineChart";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { ActivityFeedStitch } from "@/components/dashboard/ActivityFeedStitch";
import { TopPerformingAgents } from "@/components/dashboard/TopPerformingAgents";
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
  const { user, isModuleAdmin } = useAuth();
  const filterByMe = !isModuleAdmin("leads");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            {filterByMe ? "My pipeline" : "CRM performance overview"}
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(v: TimeRange) => setTimeRange(v)}
          className="md:ml-auto"
        >
          <SelectTrigger className="w-[160px] rounded-lg">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatsCardsStitch
        timeRange={timeRange}
        role={filterByMe ? "sales" : "admin"}
        userId={user?.id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[280px]">
        <div className="lg:col-span-4">
          <SalesPipelineChart assignedTo={filterByMe ? user?.id : undefined} />
        </div>
        <div className="lg:col-span-5">
          <MonthlyRevenueChart assignedTo={filterByMe ? user?.id : undefined} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeedStitch assignedTo={filterByMe ? user?.id : undefined} />
        </div>
      </div>

      <TopPerformingAgents assignedTo={filterByMe ? user?.id : undefined} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
