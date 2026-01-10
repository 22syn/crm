import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "וואטסאפ",
  manual: "ידני",
  walkin: "נכנס לחנות",
  website: "אתר",
  referral: "הפניה",
  instagram: "אינסטגרם",
  campaign: "קמפיין",
  architects: "אדריכלים",
  facebook: "פייסבוק",
};

const COLORS = [
  "hsl(142 71% 45%)", // whatsapp green
  "hsl(30 15% 45%)",  // manual
  "hsl(35 25% 55%)",  // walkin
  "hsl(200 70% 50%)", // website blue
  "hsl(280 60% 55%)", // referral purple
  "hsl(330 70% 55%)", // instagram pink
  "hsl(45 80% 50%)",  // campaign yellow
  "hsl(20 70% 50%)",  // architects orange
  "hsl(220 70% 55%)", // facebook blue
];

export function LeadsBySourceChart() {
  const { data: chartData } = useQuery({
    queryKey: ["leads-by-source"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("source");
      if (!data) return [];

      const counts: Record<string, number> = {};
      data.forEach((lead) => {
        counts[lead.source] = (counts[lead.source] || 0) + 1;
      });

      return Object.entries(counts).map(([source, count]) => ({
        name: SOURCE_LABELS[source] || source,
        value: count,
        source,
      }));
    },
  });

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>לידים לפי מקור</CardTitle>
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
        <CardTitle>לידים לפי מקור</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} לידים`, ""]}
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
