import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, FolderOpen, ListTodo, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function AdAgencyDashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["op_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("id, title, budget_required, budget_approved, status, op_clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; title: string; budget_required: number | null; budget_approved: number | null; status: string; op_clients?: { name: string } | null }[];
    },
  });

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

  const totalBudgetRequired = projects.reduce((s, p) => s + (p.budget_required ?? 0), 0);
  const totalBudgetApproved = projects.reduce((s, p) => s + (p.budget_approved ?? 0), 0);
  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">דשבורד משרד פרסום</h1>
        <p className="text-muted-foreground">סיכום תקציבים, פרויקטים פעילים, משימות קריטיות</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">תקציב נדרש (סה״כ)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-2xl font-bold">₪{totalBudgetRequired.toLocaleString("he-IL")}</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">תקציב אושר (סה״כ)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-2xl font-bold">₪{totalBudgetApproved.toLocaleString("he-IL")}</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פרויקטים פעילים</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="text-2xl font-bold">{activeCount}</span>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>פרויקטים אחרונים</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/ad-agency/projects">הכל</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין פרויקטים</p>
              ) : (
                <ul className="space-y-2">
                  {projects.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/ad-agency/projects/${p.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      {p.op_clients?.name && (
                        <span className="text-xs text-muted-foreground mr-2"> • {p.op_clients.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

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
                      <Link
                        to={`/ad-agency/projects/${t.project_id}`}
                        className="text-sm hover:underline"
                      >
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
      </div>
    </DashboardLayout>
  );
}
