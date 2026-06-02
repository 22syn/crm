import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format, startOfMonth } from "date-fns";

/** Build smooth cubic Bezier path through points (cardinal spline approximation) */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const tension = 0.3;
  const first = points[0];
  let d = `M ${first.x},${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[Math.max(0, i - 2)];
    const p1 = points[i - 1];
    const p2 = points[i];
    const p3 = points[Math.min(points.length - 1, i + 1)];
    const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

interface MonthlyRevenueChartProps {
  assignedTo?: string | null;
}

export function MonthlyRevenueChart({ assignedTo }: MonthlyRevenueChartProps = {}) {
  const id = useId();
  const gradientId = `revenueArea-${id}`;
  const glowId = `chartGlow-${id}`;
  const { data: chartData } = useQuery({
    queryKey: ["monthly-revenue", assignedTo],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      let q = supabase
        .from("deals")
        .select("created_at, amount, stage")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("stage", "delivered");
      if (assignedTo) {
        q = q.eq("assigned_to", assignedTo);
      }
      const { data } = await q;

      if (!data) return [];

      const monthlyData: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, "yyyy-MM");
        monthlyData[monthKey] = 0;
      }

      data.forEach((deal) => {
        const monthKey = format(new Date(deal.created_at), "yyyy-MM");
        if (monthKey in monthlyData) {
          monthlyData[monthKey] += Number(deal.amount);
        }
      });

      return Object.entries(monthlyData).map(([month, revenue]) => ({
        month: format(new Date(month + "-01"), "MMM"),
        revenue,
      }));
    },
  });

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col h-full min-h-[280px]">
        <h3 className="text-base font-medium text-foreground mb-4">Monthly Revenue (Last 6 Months)</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No revenue data</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const linePoints = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 50;
    const y = 50 - (d.revenue / maxRevenue) * 45;
    return { x, y };
  });
  const smoothLineD = smoothPath(linePoints);
  const areaD = `${smoothLineD} L 100,50 L 0,50 Z`;

  const formatY = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col overflow-hidden">
      <h3 className="text-base font-medium text-foreground mb-5">Monthly Revenue (Last 6 Months)</h3>
      <div className="flex-1 relative w-full min-h-[220px]">
        <div className="absolute left-0 top-0 bottom-10 w-10 flex flex-col justify-between text-xs text-muted-foreground/80 tabular-nums text-right pr-3">
          <span>{formatY(maxRevenue)}</span>
          <span>{formatY(maxRevenue * 0.75)}</span>
          <span>{formatY(maxRevenue * 0.5)}</span>
          <span>{formatY(maxRevenue * 0.25)}</span>
          <span>0</span>
        </div>
        <div className="absolute left-12 right-0 top-1 bottom-10">
          {/* Subtle dashed grid */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.02" />
              </linearGradient>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1="0"
                y1={50 * f}
                x2="100"
                y2={50 * f}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 50"
          >
            <path d={areaD} fill={`url(#${gradientId})`} />
            <path
              d={smoothLineD}
              fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#${glowId})`}
            />
            {linePoints.map((p, i) => (
              <circle
                key={chartData[i].month}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="hsl(var(--card))"
                stroke="hsl(var(--success))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
        <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs text-muted-foreground/90 px-0.5">
          {chartData.map((d) => (
            <span key={d.month} className="flex-1 text-center">
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
