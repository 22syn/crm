import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  const budgetUpdateMutation = useMutation({
    mutationFn: async (data: { budget_required?: number; budget_approved?: number }) => {
      const { error } = await supabase.from("op_projects").update(data).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project", project.id] });
      toast.success("תקציב עודכן");
    },
  });

  const handleBudgetBlur = (field: "budget_required" | "budget_approved", value: string) => {
    const num = value ? Number(value) : 0;
    if (!Number.isNaN(num) && (project[field] ?? 0) !== num) {
      budgetUpdateMutation.mutate({ [field]: num });
    }
  };

  return (
    <Tabs defaultValue="budget" className="w-full">
      <TabsList>
        <TabsTrigger value="budget">תקציב</TabsTrigger>
        <TabsTrigger value="items">פריטים</TabsTrigger>
        <TabsTrigger value="tasks">משימות</TabsTrigger>
      </TabsList>
      <TabsContent value="budget" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>תקציב הפרויקט</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget_required">תקציב נדרש</Label>
                <Input
                  id="budget_required"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={project.budget_required ?? 0}
                  onBlur={(e) => handleBudgetBlur("budget_required", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_approved">תקציב אושר</Label>
                <Input
                  id="budget_approved"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={project.budget_approved ?? 0}
                  onBlur={(e) => handleBudgetBlur("budget_approved", e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              סכום הפריטים מחושב בלשונית פריטים.
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
