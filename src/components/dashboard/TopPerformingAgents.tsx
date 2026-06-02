import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AgentStats {
  userId: string;
  fullName: string;
  dealsClosed: number;
  totalRevenue: number;
  performance: number;
}

interface TopPerformingAgentsProps {
  assignedTo?: string | null;
}

export function TopPerformingAgents({ assignedTo }: TopPerformingAgentsProps = {}) {
  const { data: agents } = useQuery({
    queryKey: ["top-performing-agents", assignedTo],
    queryFn: async () => {
      let q = supabase
        .from("deals")
        .select("assigned_to, amount")
        .eq("stage", "delivered");
      if (assignedTo) {
        q = q.eq("assigned_to", assignedTo);
      }
      const { data: deals } = await q;
      if (!deals) return [];

      const byUser: Record<
        string,
        { dealsClosed: number; totalRevenue: number }
      > = {};
      deals.forEach((d) => {
        const uid = d.assigned_to ?? "unassigned";
        if (!byUser[uid]) byUser[uid] = { dealsClosed: 0, totalRevenue: 0 };
        byUser[uid].dealsClosed += 1;
        byUser[uid].totalRevenue += Number(d.amount);
      });

      const userIds = Object.keys(byUser).filter((k) => k !== "unassigned");
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p.full_name ?? p.user_id.slice(0, 8)])
      );

      const maxRevenue = Math.max(
        ...Object.values(byUser).map((v) => v.totalRevenue),
        1
      );

      return userIds
        .map((userId) => {
          const stats = byUser[userId];
          const performance = Math.min(
            100,
            Math.round((stats.totalRevenue / maxRevenue) * 100)
          );
          return {
            userId,
            fullName: profileMap.get(userId) ?? "Unknown",
            dealsClosed: stats.dealsClosed,
            totalRevenue: stats.totalRevenue,
            performance,
          } satisfies AgentStats;
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);
    },
  });

  if (!agents || agents.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-muted-foreground">Top Performing Agents</h3>
        </div>
        <div className="p-6">
          <p className="text-muted-foreground text-sm">No data yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-muted-foreground">Top Performing Agents</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/30 text-muted-foreground font-medium">
            <tr>
              <th className="px-6 py-3" scope="col">
                Agent Name
              </th>
              <th className="px-6 py-3" scope="col">
                Deals Closed
              </th>
              <th className="px-6 py-3" scope="col">
                Total Revenue
              </th>
              <th className="px-6 py-3" scope="col">
                Performance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.map((agent) => (
              <tr
                key={agent.userId}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-foreground">
                  {agent.fullName}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {agent.dealsClosed} deals
                </td>
                <td className="px-6 py-4 text-foreground font-medium">
                  ₪{agent.totalRevenue.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium w-8">
                      {agent.performance}%
                    </span>
                    <div className="w-full max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${agent.performance}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">target</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
