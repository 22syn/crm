import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "lead" | "quote" | "deal";
  title: string;
  timestamp: Date;
}

interface ActivityFeedStitchProps {
  assignedTo?: string | null;
}

export function ActivityFeedStitch({ assignedTo }: ActivityFeedStitchProps = {}) {
  const { data: activities } = useQuery({
    queryKey: ["recent-activity", assignedTo],
    queryFn: async () => {
      let leadsQuery = supabase
        .from("leads")
        .select("id, customer_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (assignedTo) {
        leadsQuery = leadsQuery.eq("assigned_to", assignedTo);
      }
      let dealsQuery = supabase
        .from("deals")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (assignedTo) {
        dealsQuery = dealsQuery.eq("assigned_to", assignedTo);
      }
      const [leadsRes, quotesRes, dealsRes] = await Promise.all([
        leadsQuery,
        supabase
          .from("quotes")
          .select("id, customer_name, quote_number, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        dealsQuery,
      ]);

      const items: ActivityItem[] = [];

      leadsRes.data?.forEach((lead) => {
        items.push({
          id: lead.id,
          type: "lead",
          title: `New lead '${lead.customer_name}' added`,
          timestamp: new Date(lead.created_at),
        });
      });

      quotesRes.data?.forEach((quote) => {
        items.push({
          id: quote.id,
          type: "quote",
          title: `Quote ${quote.quote_number} for '${quote.customer_name}'`,
          timestamp: new Date(quote.created_at),
        });
      });

      dealsRes.data?.forEach((deal) => {
        items.push({
          id: deal.id,
          type: "deal",
          title: `'${deal.title}' deal`,
          timestamp: new Date(deal.created_at),
        });
      });

      return items
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 8);
    },
  });

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-lg overflow-hidden flex flex-col">
      <h3 className="font-semibold text-muted-foreground mb-4">Recent Activity</h3>
      <div className="overflow-y-auto custom-scrollbar dark:custom-scrollbar-dark pr-2 flex-1 max-h-[280px]">
        {!activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet</p>
        ) : (
          <ul className="relative border-l border-border ml-2 space-y-6 pb-2">
            {activities.map((activity, index) => (
              <li key={`${activity.type}-${activity.id}`} className="ml-6 relative">
                <span
                  className={`absolute flex items-center justify-center w-3 h-3 rounded-full -left-[1.6rem] ring-4 ring-card ${
                    index === 0 ? "bg-accent-action" : "bg-muted"
                  }`}
                />
                <h4 className="flex items-center mb-0.5 text-sm font-semibold text-foreground">
                  {activity.title}
                </h4>
                <time className="block mb-2 text-xs font-normal leading-none text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
