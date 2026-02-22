import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectItemsSection } from "./ProjectItemsSection";
import { ProjectTasksSection } from "./ProjectTasksSection";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;

interface ProjectDetailTabsProps {
  project: OpProject;
}

export function ProjectDetailTabs({ project }: ProjectDetailTabsProps) {
  const queryClient = useQueryClient();

  const { data: projectItems = [] } = useQuery({
    queryKey: ["op_project_items", project.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("op_project_items")
        .select("quantity, days, op_items(price)")
        .eq("project_id", project.id);
      if (error) throw error;
      return rows as { quantity: number; days: number; op_items: { price: number } | null }[];
    },
    enabled: !!project.id,
  });

  const itemsTotal = projectItems.reduce((sum, pi) => {
    const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
    const d = pi.days ?? 1;
    return sum + price * pi.quantity * d;
  }, 0);

  const revenue = project.budget_approved ?? 0;
  const profit = revenue - itemsTotal;
  const profitPct = revenue > 0 ? (profit / revenue) * 100 : null;

  const budgetUpdateMutation = useMutation({
    mutationFn: async (data: { budget_approved?: number }) => {
      const { error } = await supabase.from("op_projects").update(data).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project", project.id] });
      toast.success("צפי הכנסה עודכן");
    },
  });

  const handleBudgetBlur = (value: string) => {
    const num = value ? Number(value) : 0;
    if (!Number.isNaN(num) && (project.budget_approved ?? 0) !== num) {
      budgetUpdateMutation.mutate({ budget_approved: num });
    }
  };

  return (
    <Tabs defaultValue="budget" className="w-full">
      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle>סיכום פרויקט</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">עלות הוצאות</p>
              <p className="text-lg font-semibold">₪{itemsTotal.toLocaleString("he-IL")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">צפי הכנסה</p>
              <p className="text-lg font-semibold">₪{revenue.toLocaleString("he-IL")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">אחוז רווח</p>
              <p className="text-lg font-semibold">
                {profitPct != null ? `${profitPct.toFixed(1)}%` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <TabsList>
        <TabsTrigger value="budget">צפי הכנסה</TabsTrigger>
        <TabsTrigger value="items">פריטים</TabsTrigger>
        <TabsTrigger value="tasks">משימות</TabsTrigger>
      </TabsList>
      <TabsContent value="budget" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>צפי הכנסה (תקציב אושר)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="budget_approved">סכום</Label>
              <Input
                id="budget_approved"
                type="number"
                min={0}
                step="0.01"
                defaultValue={project.budget_approved ?? 0}
                onBlur={(e) => handleBudgetBlur(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              סכום הפריטים מחושב בלשונית פריטים. עלות הוצאות לעומת צפי הכנסה מעל.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="items" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <ProjectItemsSection projectId={project.id} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tasks" className="mt-4">
        <Card>
          <CardContent className="pt-6">
            <ProjectTasksSection projectId={project.id} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
