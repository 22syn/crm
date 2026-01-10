import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { subMonths, format, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";

export function OrdersChart() {
  const { data: chartData } = useQuery({
    queryKey: ["deals-by-month"],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      const { data } = await supabase
        .from("deals")
        .select("created_at, amount, stage")
        .gte("created_at", sixMonthsAgo.toISOString());

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
          if (deal.stage === "closed_won") {
            monthlyData[monthKey].revenue += Number(deal.amount);
          }
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month: format(new Date(month + "-01"), "MMM", { locale: he }),
        עסקאות: data.count,
        הכנסות: data.revenue,
      }));
    },
  });

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>עסקאות לפי חודש</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">אין נתונים להצגה</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>עסקאות לפי חודש</CardTitle>
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
                name === "הכנסות" ? `₪${value.toLocaleString()}` : value,
                name
              ]}
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar 
              dataKey="עסקאות" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
