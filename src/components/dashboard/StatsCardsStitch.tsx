import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subWeeks,
  subQuarters,
} from "date-fns";
import type { TimeRange } from "@/contexts/DashboardContext";

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

function getPeriodLabel(range: TimeRange): string {
  switch (range) {
    case "week":
      return "this week";
    case "last_week":
      return "last week";
    case "quarter":
      return "this quarter";
    default:
      return "this month";
  }
}

function getVsPreviousLabel(range: TimeRange): string {
  switch (range) {
    case "week":
      return "vs previous week";
    case "last_week":
      return "vs 2 weeks ago";
    case "quarter":
      return "vs previous quarter";
    default:
      return "vs previous month";
  }
}

interface StatsCardsStitchProps {
  timeRange: TimeRange;
  role: "admin" | "sales" | null;
  userId?: string | null;
}

function StatCard({
  title,
  value,
  trendLabel,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  trendLabel: string;
  trend?: number | null;
  href?: string;
}) {
  const content = (
    <div className="bg-card rounded-xl p-5 shadow-lg border border-border relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{value}</span>
        </div>
        <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {trend != null && !Number.isNaN(trend) ? (
            <>
              {trend >= 0 ? "+" : ""}
              {trend}% <span className="text-muted-foreground font-normal">{trendLabel}</span>
            </>
          ) : (
            <span className="text-muted-foreground font-normal">{trendLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
}

export function StatsCardsStitch({ timeRange, role, userId }: StatsCardsStitchProps) {
  const filterByAssignee = role === "sales" && userId;

  /** Static stats — do not depend on time range selection */
  const { data: staticStats } = useQuery({
    queryKey: ["dashboard-stats-static", role, userId],
    queryFn: async () => {
      let dealsQuery = supabase.from("deals").select("id, amount, stage, assigned_to");
      if (filterByAssignee) {
        dealsQuery = dealsQuery.eq("assigned_to", userId);
      }

      const { data: deals } = await dealsQuery;
      const dealsList = deals || [];

      const potentialRevenue = dealsList
        .filter((d) => !["delivered", "cancelled"].includes(d.stage))
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const activeDeals = dealsList.filter(
        (d) => !["delivered", "cancelled"].includes(d.stage)
      ).length;

      return {
        potentialRevenue,
        activeDeals,
      };
    },
  });

  /** Dynamic stats — change with time range selection */
  const { data: periodStats } = useQuery({
    queryKey: ["dashboard-stats-period", timeRange, role, userId],
    queryFn: async () => {
      const { start: currStart, end: currEnd } = getDateRange(timeRange);
      const { start: prevStart, end: prevEnd } = getPreviousRange(timeRange);

      let dealsQuery = supabase.from("deals").select("id, amount, stage, created_at, assigned_to");
      let leadsQuery = supabase.from("leads").select("id, status, created_at, updated_at, assigned_to");
      if (filterByAssignee) {
        dealsQuery = dealsQuery.eq("assigned_to", userId);
        leadsQuery = leadsQuery.eq("assigned_to", userId);
      }

      const [dealsRes, leadsRes] = await Promise.all([dealsQuery, leadsQuery]);
      const dealsList = dealsRes.data || [];
      const leads = leadsRes.data || [];

      const currRevenue = dealsList
        .filter(
          (d) =>
            d.stage === "delivered" &&
            new Date(d.created_at) >= currStart &&
            new Date(d.created_at) <= currEnd
        )
        .reduce((sum, d) => sum + Number(d.amount), 0);
      const prevRevenue = dealsList
        .filter(
          (d) =>
            d.stage === "delivered" &&
            new Date(d.created_at) >= prevStart &&
            new Date(d.created_at) <= prevEnd
        )
        .reduce((sum, d) => sum + Number(d.amount), 0);
      const revenueTrend =
        prevRevenue > 0
          ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100)
          : null;

      const currLeads = leads.filter(
        (l) =>
          new Date(l.created_at) >= currStart && new Date(l.created_at) <= currEnd
      ).length;
      const prevLeads = leads.filter(
        (l) =>
          new Date(l.created_at) >= prevStart && new Date(l.created_at) <= prevEnd
      ).length;
      const leadsTrend =
        prevLeads > 0 ? Math.round(((currLeads - prevLeads) / prevLeads) * 100) : null;

      const closedInPeriod = leads.filter(
        (l) =>
          ["done", "not_done"].includes(l.status) &&
          new Date(l.updated_at) >= currStart &&
          new Date(l.updated_at) <= currEnd
      );
      const doneInPeriod = closedInPeriod.filter((l) => l.status === "done").length;
      const conversionRate =
        closedInPeriod.length > 0
          ? Math.round((doneInPeriod / closedInPeriod.length) * 100)
          : null;

      return {
        periodRevenue: currRevenue,
        revenueTrend,
        newLeads: currLeads,
        leadsTrend,
        conversionRate,
      };
    },
  });

  const periodLabel = getPeriodLabel(timeRange);
  const vsPreviousLabel = getVsPreviousLabel(timeRange);

  return (
    <div className="space-y-6">
      {/* Static — current snapshot, does not change with time range */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Current snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <StatCard
            title="Potential Revenue"
            value={`₪${(staticStats?.potentialRevenue ?? 0).toLocaleString()}`}
            trendLabel="in pipeline"
            href="/deals"
          />
          <StatCard
            title="Active Deals"
            value={staticStats?.activeDeals ?? 0}
            trendLabel="active now"
            href="/deals"
          />
        </div>
      </div>

      {/* Dynamic — changes with time range selector */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Period performance — {periodLabel}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Revenue"
            value={`₪${(periodStats?.periodRevenue ?? 0).toLocaleString()}`}
            trendLabel={vsPreviousLabel}
            trend={periodStats?.revenueTrend}
          />
          <StatCard
            title="New Leads"
            value={periodStats?.newLeads ?? 0}
            trendLabel={vsPreviousLabel}
            trend={periodStats?.leadsTrend}
            href="/leads"
          />
          <StatCard
            title="Conversion Rate"
            value={
              periodStats?.conversionRate != null
                ? `${periodStats.conversionRate}%`
                : "—"
            }
            trendLabel={periodLabel}
          />
        </div>
      </div>
    </div>
  );
}
