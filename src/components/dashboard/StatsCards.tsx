import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Handshake, TrendingUp, Calendar, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      const [leadsResult, dealsResult, quotesResult, monthlyDealsResult] = await Promise.all([
        supabase.from("leads").select("id, status, meeting_date", { count: "exact" }),
        supabase.from("deals").select("id, amount, stage", { count: "exact" }),
        supabase.from("quotes").select("id, status", { count: "exact" }),
        supabase.from("deals")
          .select("id", { count: "exact" })
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd),
      ]);

      const leads = leadsResult.data || [];
      const deals = dealsResult.data || [];
      const quotes = quotesResult.data || [];
      
      const activeLeads = leads.filter(l => !["done", "not_done"].includes(l.status)).length;
      const leadsWithoutMeeting = leads.filter(l => 
        !["done", "not_done"].includes(l.status) && !l.meeting_date
      ).length;
      const openQuotes = quotes.filter(q => ["draft", "sent"].includes(q.status)).length;
      const totalRevenue = deals
        .filter(d => d.stage === "closed_won")
        .reduce((sum, d) => sum + Number(d.amount), 0);
      
      const doneLeads = leads.filter(l => l.status === "done").length;
      const closedLeads = leads.filter(l => ["done", "not_done"].includes(l.status)).length;
      const conversionRate = closedLeads > 0 ? Math.round((doneLeads / closedLeads) * 100) : 0;

      const activeDeals = deals.filter(d => !["closed_won", "closed_lost"].includes(d.stage)).length;

      return {
        totalLeads: leadsResult.count || 0,
        activeLeads,
        leadsWithoutMeeting,
        totalDeals: dealsResult.count || 0,
        activeDeals,
        monthlyDeals: monthlyDealsResult.count || 0,
        openQuotes,
        totalRevenue,
        conversionRate,
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
      title: "Without Meeting",
      value: stats?.leadsWithoutMeeting ?? 0,
      description: "Leads requiring attention",
      icon: Calendar,
    },
    {
      title: "Open Quotes",
      value: stats?.openQuotes ?? 0,
      description: "Awaiting approval",
      icon: FileText,
    },
    {
      title: "Active Deals",
      value: stats?.activeDeals ?? 0,
      description: `${stats?.totalDeals ?? 0} total deals`,
      icon: Handshake,
    },
    {
      title: "Revenue",
      value: `₪${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      description: "Total closed deals",
      icon: TrendingUp,
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      description: "Leads converted to customers",
      icon: Percent,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
