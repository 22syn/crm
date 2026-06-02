import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STAGE_LABELS: Record<string, string> = {
  quote_approved: "Quote Approved",
  in_production: "In Production",
  ready_for_delivery: "Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Short labels for chart display (single line) */
const STAGE_LABELS_SHORT: Record<string, string> = {
  quote_approved: "Quote",
  in_production: "Production",
  ready_for_delivery: "Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface SalesPipelineChartProps {
  assignedTo?: string | null;
}

export function SalesPipelineChart({ assignedTo }: SalesPipelineChartProps = {}) {
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["sales-pipeline", assignedTo],
    queryFn: async () => {
      let q = supabase
        .from("deals")
        .select("stage")
        .in("stage", [
          "quote_approved",
          "in_production",
          "ready_for_delivery",
          "shipped",
          "delivered",
        ]);
      if (assignedTo) {
        q = q.eq("assigned_to", assignedTo);
      }
      const { data, error } = await q;
      if (error) throw error;
      if (!data) return [];

      const counts: Record<string, number> = {};
      data.forEach((d) => {
        counts[d.stage] = (counts[d.stage] ?? 0) + 1;
      });

      const order = [
        "quote_approved",
        "in_production",
        "ready_for_delivery",
        "shipped",
        "delivered",
      ];
      return order.map((stage) => ({
        stage,
        label: STAGE_LABELS[stage],
        count: counts[stage] ?? 0,
      }));
    },
  });

  const totalDeals = pipeline?.reduce((sum, p) => sum + p.count, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border p-5 rounded-xl shadow-lg flex flex-col h-full min-h-[280px]">
        <h3 className="font-semibold text-muted-foreground mb-6">Sales Pipeline (By Stage)</h3>
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex gap-2 w-full max-w-xs h-32">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 bg-muted rounded-t-md" style={{ height: `${20 + i * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pipeline || pipeline.length === 0 || totalDeals === 0) {
    return (
      <div className="bg-card border border-border p-5 rounded-xl shadow-lg flex flex-col h-full min-h-[280px]">
        <h3 className="font-semibold text-muted-foreground mb-6">Sales Pipeline (By Stage)</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No deals yet</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...pipeline.map((p) => p.count), 1);
  const BAR_HEIGHT_MAX = 160;

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-lg flex flex-col h-full min-h-[280px]">
      <h3 className="font-semibold text-muted-foreground mb-6">Sales Pipeline (By Stage)</h3>
      <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 h-[200px]">
        {pipeline.map((item) => {
          const ratio = item.count / maxCount;
          const barHeightPx = Math.max((ratio * BAR_HEIGHT_MAX), item.count > 0 ? 12 : 4);
          return (
            <div
              key={item.stage}
              className="flex flex-col items-center group flex-1 min-w-0 justify-end"
            >
              <span className="text-xs text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.count}
              </span>
              <div
                className="w-full bg-accent-action/30 rounded-t-md bar-animate hover:bg-accent-action transition-colors duration-300"
                style={{
                  height: `${barHeightPx}px`,
                }}
              />
              <span
                className="text-[10px] text-muted-foreground mt-2 text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis block w-full"
                title={item.label}
              >
                {STAGE_LABELS_SHORT[item.stage]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
