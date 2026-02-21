import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { subMonths, format, startOfMonth } from "date-fns";

interface OrdersChartProps {
  assignedTo?: string | null;
}

export function OrdersChart({ assignedTo }: OrdersChartProps = {}) {
  const navigate = useNavigate();
  const { data: chartData } = useQuery({
    queryKey: ["deals-by-month", assignedTo],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      let q = supabase
        .from("deals")
        .select("created_at, amount, stage")
        .gte("created_at", sixMonthsAgo.toISOString());
      if (assignedTo) {
        q = q.eq("assigned_to", assignedTo);
      }
      const { data } = await q;

      if (!data) return [];

      // Group by month
      const monthlyData: Record<string, { count: number; revenue: number }> = {};
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        monthlyData[monthKey] = { count: 0, revenue: 0 };
      }

      data.forEach((deal) => {
        const monthKey = format(new Date(deal.created_at), "yyyy-MM");
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count += 1;
          // Only count won deals for revenue
          if (deal.stage === "delivered") {
            monthlyData[monthKey].revenue += Number(deal.amount);
          }
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month: format(new Date(month + "-01"), "MMM"),
        Deals: data.count,
        Revenue: data.revenue,
      }));
    },
  });

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deals by Month</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] gap-4">
          <p className="text-muted-foreground">No data to display</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/deals")}>
            Create your first deal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "Revenue" ? `₪${value.toLocaleString()}` : value,
                name
              ]}
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar 
              dataKey="Deals" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
