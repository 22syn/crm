import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, ShoppingCart, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [leadsResult, ordersResult, quotesResult] = await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id, total, status", { count: "exact" }),
        supabase.from("documents").select("id", { count: "exact" }).eq("type", "quote"),
      ]);

      const leads = leadsResult.data || [];
      const orders = ordersResult.data || [];
      
      const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status)).length;
      const totalRevenue = orders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0);

      return {
        totalLeads: leadsResult.count || 0,
        activeLeads,
        totalOrders: ordersResult.count || 0,
        totalQuotes: quotesResult.count || 0,
        totalRevenue,
      };
    },
  });

  const statCards = [
    {
      title: "Active Leads",
      value: stats?.activeLeads ?? 0,
      description: `${stats?.totalLeads ?? 0} total leads`,
      icon: Users,
    },
    {
      title: "Quotes Created",
      value: stats?.totalQuotes ?? 0,
      description: "Total quotes generated",
      icon: FileText,
    },
    {
      title: "Orders",
      value: stats?.totalOrders ?? 0,
      description: "Total orders placed",
      icon: ShoppingCart,
    },
    {
      title: "Revenue",
      value: `₪${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      description: "Total order value",
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your CRM performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Activity feed will appear here as you create leads and orders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Use the sidebar to navigate to Leads, Quotes, Orders, and Products.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
