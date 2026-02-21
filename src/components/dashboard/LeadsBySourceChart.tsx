import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  manual: "Manual",
  walkin: "Walk-in",
  website: "Website",
  referral: "Referral",
  instagram: "Instagram",
  campaign: "Campaign",
  architects: "Architects",
  facebook: "Facebook",
};

/* Production company theme - cool palette */
const COLORS = [
  "hsl(142 65% 42%)",  // whatsapp - success green
  "hsl(262 55% 50%)",  // manual - accent purple-magenta
  "hsl(220 50% 52%)",  // walkin - cool blue-gray
  "hsl(200 60% 50%)",  // website - cyan
  "hsl(280 55% 55%)",  // referral - purple
  "hsl(320 50% 55%)",  // instagram - magenta
  "hsl(190 50% 48%)",  // campaign - teal
  "hsl(250 55% 55%)",  // architects - violet
  "hsl(210 55% 52%)",  // facebook - blue
];

interface LeadsBySourceChartProps {
  assignedTo?: string | null;
}

export function LeadsBySourceChart({ assignedTo }: LeadsBySourceChartProps = {}) {
  const { data: chartData } = useQuery({
    queryKey: ["leads-by-source", assignedTo],
    queryFn: async () => {
      let q = supabase.from("leads").select("source");
      if (assignedTo) {
        q = q.eq("assigned_to", assignedTo);
      }
      const { data } = await q;
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
          <CardTitle>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Source</CardTitle>
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
              formatter={(value: number) => [`${value} leads`, ""]}
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
