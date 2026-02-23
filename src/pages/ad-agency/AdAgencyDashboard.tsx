import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, ListTodo, Loader2, Percent } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

type ProjectRow = {
  id: string;
  title: string;
  budget_approved: number | null;
  status: string;
  op_clients?: { name: string } | null;
};

type ProjectItemRow = {
  project_id: string;
  quantity: number;
  days: number;
  prep_days?: number;
  extras?: number;
  op_items: { price: number } | null;
};

const ACTIVE_STATUSES = ["planning", "execution", "collection"];
/** Only projects with approved price proposals are included in financial metrics. */
const APPROVED_STATUSES = ["planning", "execution", "collection", "completed"];

export default function AdAgencyDashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["op_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("id, title, budget_approved, status, op_clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  const { data: projectItems = [] } = useQuery({
    queryKey: ["op_project_items_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_project_items")
        .select("project_id, quantity, days, prep_days, extras, op_items(price)");
      if (error) throw error;
      return data as ProjectItemRow[];
    },
  });

  const rowTotal = (price: number, qty: number, days: number, prepDays: number, extras: number) =>
    price * qty * (days ?? 1) * (1 + (prepDays ?? 0)) + (extras ?? 0);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["op_project_tasks_due"],
    queryFn: async () => {
      const inSevenDays = new Date();
      inSevenDays.setDate(inSevenDays.getDate() + 7);
      const { data, error } = await supabase
        .from("op_project_tasks")
        .select("id, project_id, title, end_date, status")
        .not("end_date", "is", null)
        .lte("end_date", inSevenDays.toISOString().slice(0, 10))
        .neq("status", "done")
        .neq("status", "cancelled")
        .order("end_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as { id: string; project_id: string; title: string; end_date: string | null; status: string }[];
    },
  });

  const approvedProjectIds = useMemo(
    () => new Set(projects.filter((p) => APPROVED_STATUSES.includes(p.status)).map((p) => p.id)),
    [projects]
  );

  const { projectExpensesMap, totalExpenses, totalRevenue, totalProfit, profitPct } = useMemo(() => {
    const expensesByProject = new Map<string, number>();
    let totalExp = 0;
    for (const pi of projectItems) {
      if (!approvedProjectIds.has(pi.project_id)) continue;
      const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
      const d = pi.days ?? 1;
      const prep = pi.prep_days ?? 0;
      const ext = pi.extras ?? 0;
      const tot = rowTotal(price, pi.quantity, d, prep, ext);
      expensesByProject.set(pi.project_id, (expensesByProject.get(pi.project_id) ?? 0) + tot);
      totalExp += tot;
    }
    const totalRev = projects
      .filter((p) => APPROVED_STATUSES.includes(p.status))
      .reduce((s, p) => s + (p.budget_approved ?? 0), 0);
    const profit = totalRev - totalExp;
    const pct = totalRev > 0 ? (profit / totalRev) * 100 : null;
    return {
      projectExpensesMap: expensesByProject,
      totalExpenses: totalExp,
      totalRevenue: totalRev,
      totalProfit: profit,
      profitPct: pct,
    };
  }, [projects, projectItems, approvedProjectIds]);

  const activeProjects = projects.filter((p) => ACTIVE_STATUSES.includes(p.status)).slice(0, 8);
  const draftProjects = projects.filter((p) => p.status === "draft").slice(0, 8);

  const getProjectMetrics = (p: ProjectRow) => {
    const expenses = projectExpensesMap.get(p.id) ?? 0;
    const revenue = p.budget_approved ?? 0;
    const profit = revenue - expenses;
    const pct = revenue > 0 ? (profit / revenue) * 100 : null;
    return { expenses, revenue, profit, pct };
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">דשבורד משרד פרסום</h1>
        <p className="text-muted-foreground">סיכום פיננסי, פרויקטים פעילים וטיוטה, משימות קריטיות</p>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה״כ הוצאות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-2xl font-bold">₪{totalExpenses.toLocaleString("he-IL")}</span>
              )}
            </CardContent>
          </Card>
          <Card title="סכום תקציבים שאושרו מפרויקטים שאינם בטיוטה (תכנון, ביצוע, גבייה, הושלם)">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">צפי הכנסה</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-2xl font-bold">₪{totalRevenue.toLocaleString("he-IL")}</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סה״כ רווח</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className={`text-2xl font-bold ${totalProfit >= 0 ? "" : "text-destructive"}`}>
                  ₪{totalProfit.toLocaleString("he-IL")}
                </span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">אחוז רווח</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : profitPct != null ? (
                <span className={`text-2xl font-bold ${profitPct >= 0 ? "" : "text-destructive"}`}>
                  {profitPct.toFixed(1)}%
                </span>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">—</span>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>פרויקטים פעילים</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/ad-agency/projects">הכל</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין פרויקטים פעילים</p>
              ) : (
                <ul className="space-y-2">
                  {activeProjects.map((p) => {
                    const m = getProjectMetrics(p);
                    return (
                      <li key={p.id} className="flex flex-col gap-0.5">
                        <Link to={`/ad-agency/projects/${p.id}`} className="text-sm font-medium hover:underline">
                          {p.title}
                        </Link>
                        {p.op_clients?.name && (
                          <span className="text-xs text-muted-foreground">• {p.op_clients.name}</span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          עלות: ₪{m.expenses.toLocaleString("he-IL")} | הכנסה: ₪{m.revenue.toLocaleString("he-IL")}
                          {m.pct != null ? ` | רווח: ${m.pct.toFixed(0)}%` : ""}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>פרויקטים בטיוטה</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/ad-agency/projects">הכל</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : draftProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין פרויקטים בטיוטה</p>
              ) : (
                <ul className="space-y-2">
                  {draftProjects.map((p) => {
                    const m = getProjectMetrics(p);
                    return (
                      <li key={p.id} className="flex flex-col gap-0.5">
                        <Link to={`/ad-agency/projects/${p.id}`} className="text-sm font-medium hover:underline">
                          {p.title}
                        </Link>
                        {p.op_clients?.name && (
                          <span className="text-xs text-muted-foreground">• {p.op_clients.name}</span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          עלות: ₪{m.expenses.toLocaleString("he-IL")} | הכנסה: ₪{m.revenue.toLocaleString("he-IL")}
                          {m.pct != null ? ` | רווח: ${m.pct.toFixed(0)}%` : ""}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>משימות עד לתאריך</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין משימות בשבוע הקרוב</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <Link to={`/ad-agency/tasks?project=${t.project_id}`} className="text-sm hover:underline">
                      {t.title}
                    </Link>
                    {t.end_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(t.end_date), "d MMM", { locale: he })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
