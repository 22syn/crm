import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeadsBySourceChart } from "@/components/dashboard/LeadsBySourceChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold">דשבורד</h1>
          <p className="text-muted-foreground">סקירה כללית של ביצועי ה-CRM</p>
        </div>

        <StatsCards />

        <div className="grid gap-4 md:grid-cols-2">
          <OrdersChart />
          <LeadsBySourceChart />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ActivityFeed />
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  );
}
