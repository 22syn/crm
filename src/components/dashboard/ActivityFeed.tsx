import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "lead" | "quote" | "order";
  title: string;
  timestamp: Date;
}

export function ActivityFeed() {
  const { data: activities } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const [leadsRes, quotesRes, ordersRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, customer_name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("quotes")
          .select("id, customer_name, quote_number, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("orders")
          .select("id, order_number, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: ActivityItem[] = [];

      leadsRes.data?.forEach((lead) => {
        items.push({
          id: lead.id,
          type: "lead",
          title: `ליד חדש: ${lead.customer_name}`,
          timestamp: new Date(lead.created_at),
        });
      });

      quotesRes.data?.forEach((quote) => {
        items.push({
          id: quote.id,
          type: "quote",
          title: `הצעת מחיר ${quote.quote_number} ל${quote.customer_name}`,
          timestamp: new Date(quote.created_at),
        });
      });

      ordersRes.data?.forEach((order) => {
        items.push({
          id: order.id,
          type: "order",
          title: `הזמנה ${order.order_number}`,
          timestamp: new Date(order.created_at),
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
      case "order":
        return <ShoppingCart className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>פעילות אחרונה</CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            עדיין אין פעילות להצגה
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: he })}
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
