import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Handshake, TrendingUp, Calendar, Percent, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, subMonths, subWeeks, subQuarters } from "date-fns";
import type { TimeRange } from "@/contexts/DashboardContext";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  trend?: number | null;
}

function StatCard({ title, value, description, icon: Icon, href, trend }: StatCardProps) {
  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend != null && !Number.isNaN(trend) && (
            <span className={`flex items-center text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? <ArrowUp className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDown className="h-3.5 w-3.5 mr-0.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">{content}</Card>
      </Link>
    );
  }
  return <Card>{content}</Card>;
}

/** Get date range for time range selector. */
function getDateRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "week":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "last_week": {
      const lastWeek = subWeeks(now, 1);
      return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
    }
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
  }
}

/** Get previous period for trend comparison. */
function getPreviousRange(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "week":
      return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
    case "last_week":
      return { start: startOfWeek(subWeeks(now, 2)), end: endOfWeek(subWeeks(now, 2)) };
    case "month":
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case "quarter":
      return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
  }
}

interface StatsCardsProps {
  timeRange: TimeRange;
  role: "admin" | "sales" | null;
  userId?: string | null;
}

export function StatsCards({ timeRange, role, userId }: StatsCardsProps) {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", timeRange, role, userId],
    queryFn: async () => {
      const { start: currStart, end: currEnd } = getDateRange(timeRange);
      const { start: prevStart, end: prevEnd } = getPreviousRange(timeRange);

      const filterByAssignee = role === "sales" && userId;

      let leadsQuery = supabase.from("leads").select("id, status, meeting_date, assigned_to");
      let dealsQuery = supabase.from("deals").select("id, amount, stage, assigned_to");
      if (filterByAssignee) {
        leadsQuery = leadsQuery.eq("assigned_to", userId);
        dealsQuery = dealsQuery.eq("assigned_to", userId);
      }

      let currDealsQuery = supabase
        .from("deals")
        .select("id", { count: "exact" })
        .gte("created_at", currStart.toISOString())
        .lte("created_at", currEnd.toISOString());
      let prevDealsQuery = supabase
        .from("deals")
        .select("id", { count: "exact" })
        .gte("created_at", prevStart.toISOString())
        .lte("created_at", prevEnd.toISOString());
      if (filterByAssignee) {
        currDealsQuery = currDealsQuery.eq("assigned_to", userId);
        prevDealsQuery = prevDealsQuery.eq("assigned_to", userId);
      }

      const [leadsResult, dealsResult, quotesResult, currDealsResult, prevDealsResult] = await Promise.all([
        leadsQuery,
        dealsQuery,
        supabase.from("quotes").select("id, status"),
        currDealsQuery,
        prevDealsQuery,
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
        .filter(d => d.stage === "delivered")
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const doneLeads = leads.filter(l => l.status === "done").length;
      const closedLeads = leads.filter(l => ["done", "not_done"].includes(l.status)).length;
      const conversionRate = closedLeads > 0 ? Math.round((doneLeads / closedLeads) * 100) : 0;

      const activeDeals = deals.filter(d => !["delivered", "cancelled"].includes(d.stage)).length;

      const currDeals = currDealsResult.count || 0;
      const prevDeals = prevDealsResult.count || 0;
      const dealsTrend = prevDeals > 0 ? Math.round(((currDeals - prevDeals) / prevDeals) * 100) : null;

      return {
        totalLeads: leads.length,
        activeLeads,
        leadsWithoutMeeting,
        totalDeals: deals.length,
        activeDeals,
        currDeals,
        dealsTrend,
        openQuotes,
        totalRevenue,
        conversionRate,
      };
    },
  });

  const periodLabel =
    timeRange === "week" ? "This Week" :
    timeRange === "last_week" ? "Last Week" :
    timeRange === "quarter" ? "This Quarter" : "This Month";

  const statCards = [
    {
      title: "Active Leads",
      value: stats?.activeLeads ?? 0,
      description: `${stats?.totalLeads ?? 0} total leads`,
      icon: Users,
      href: "/leads",
      trend: null as number | null,
    },
    {
      title: "Without Meeting",
      value: stats?.leadsWithoutMeeting ?? 0,
      description: "Leads requiring attention",
      icon: Calendar,
      href: "/leads?noMeeting=1",
      trend: null as number | null,
    },
    {
      title: "Open Contracts",
      value: stats?.openQuotes ?? 0,
      description: "Awaiting approval",
      icon: FileText,
      href: "/contracts",
      trend: null as number | null,
    },
    {
      title: `Deals ${periodLabel}`,
      value: stats?.currDeals ?? 0,
      description: timeRange === "last_week" ? "vs week before" : `vs previous ${timeRange}`,
      icon: Handshake,
      href: "/deals",
      trend: stats?.dealsTrend ?? null,
    },
    {
      title: "Active Deals",
      value: stats?.activeDeals ?? 0,
      description: `${stats?.totalDeals ?? 0} total deals`,
      icon: Handshake,
      href: "/deals",
      trend: null as number | null,
    },
    {
      title: "Revenue",
      value: `₪${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      description: "Total closed deals",
      icon: TrendingUp,
      href: undefined,
      trend: null as number | null,
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate ?? 0}%`,
      description: "Leads converted to customers",
      icon: Percent,
      href: undefined,
      trend: null as number | null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat, index) => (
        <div
          key={stat.title}
          className="animate-card-enter opacity-0"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <StatCard {...stat} href={stat.href} trend={stat.trend} />
        </div>
      ))}
    </div>
  );
}
