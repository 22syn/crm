import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Handshake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "lead" | "quote" | "deal";
  title: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  assignedTo?: string | null;
}

export function ActivityFeed({ assignedTo }: ActivityFeedProps = {}) {
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
          title: `New lead: ${lead.customer_name}`,
          timestamp: new Date(lead.created_at),
        });
      });

      quotesRes.data?.forEach((quote) => {
        items.push({
          id: quote.id,
          type: "quote",
          title: `Quote ${quote.quote_number} for ${quote.customer_name}`,
          timestamp: new Date(quote.created_at),
        });
      });

      dealsRes.data?.forEach((deal) => {
        items.push({
          id: deal.id,
          type: "deal",
          title: `New deal: ${deal.title}`,
          timestamp: new Date(deal.created_at),
        });
      });

      // Sort by timestamp and take top 8
      return items
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 8);
    },
  });

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "lead":
        return <Users className="h-4 w-4 text-primary" />;
      case "quote":
        return <FileText className="h-4 w-4 text-primary" />;
      case "deal":
        return <Handshake className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No activity yet
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
