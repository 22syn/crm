import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectItemsSection } from "./ProjectItemsSection";
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
        .select("quantity, days, prep_days, extras, op_items(price)")
        .eq("project_id", project.id);
      if (error) throw error;
      return rows as {
        quantity: number;
        days: number;
        prep_days?: number;
        extras?: number;
        op_items: { price: number } | null;
      }[];
    },
    enabled: !!project.id,
  });

  const rowTotal = (price: number, qty: number, days: number, prepDays: number, extras: number) =>
    price * qty * (days ?? 1) * (1 + (prepDays ?? 0)) + (extras ?? 0);

  const itemsTotal = projectItems.reduce((sum, pi) => {
    const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
    const d = pi.days ?? 1;
    const prep = pi.prep_days ?? 0;
    const ext = pi.extras ?? 0;
    return sum + rowTotal(price, pi.quantity, d, prep, ext);
  }, 0);

  const proj = project as OpProject & {
    production_fee_percent?: number;
    insurance?: number;
    discount?: number;
    description?: string;
    locations_schedule?: string;
    deliverables?: string;
  };
  const productionFeePct = proj.production_fee_percent ?? 15;
  const insuranceVal = proj.insurance ?? 0;
  const discountVal = proj.discount ?? 0;
  const productionFee = itemsTotal * (productionFeePct / 100);
  const grandTotal = itemsTotal + insuranceVal + productionFee - discountVal;

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

  const projectUpdateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("op_projects").update(data).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project", project.id] });
      toast.success("עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  const handleBudgetBlur = (value: string) => {
    const num = value ? Number(value) : 0;
    if (!Number.isNaN(num) && (project.budget_approved ?? 0) !== num) {
      budgetUpdateMutation.mutate({ budget_approved: num });
    }
  };

  return (
    <Tabs defaultValue="budget" className="w-full" dir="rtl">
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
        <TabsTrigger value="content">תוכן</TabsTrigger>
        <TabsTrigger value="budget">תקציב</TabsTrigger>
        <TabsTrigger value="items">פריטים</TabsTrigger>
      </TabsList>
      <TabsContent value="content" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>תוכן הפרויקט</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">תיאור העבודה</Label>
              <Textarea
                id="description"
                rows={3}
                defaultValue={proj.description ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (proj.description ?? "")) projectUpdateMutation.mutate({ description: v || null });
                }}
                placeholder="תיאור קצר של העבודה"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locations_schedule">לוקיישנים ולוח זמנים</Label>
              <Textarea
                id="locations_schedule"
                rows={2}
                defaultValue={proj.locations_schedule ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (proj.locations_schedule ?? ""))
                    projectUpdateMutation.mutate({ locations_schedule: v || null });
                }}
                placeholder="לוקיישנים ותאריכים"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliverables">תוצרים</Label>
              <Textarea
                id="deliverables"
                rows={2}
                defaultValue={proj.deliverables ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (proj.deliverables ?? ""))
                    projectUpdateMutation.mutate({ deliverables: v || null });
                }}
                placeholder="תוצרים צפויים"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="budget" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>תקציב</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.budget_required != null &&
              project.budget_required > 0 && (
              <div className="space-y-2 max-w-xs">
                <Label>תקציב נדרש (טיוטה)</Label>
                <p className="text-lg font-medium">
                  ₪{Number(project.budget_required).toLocaleString("he-IL")}
                </p>
                <p className="text-xs text-muted-foreground">
                  הסכום שהוגדר בהצעת המחיר לפני האישור
                </p>
              </div>
            )}
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="budget_approved">תקציב שאושר (צפי הכנסה)</Label>
              <Input
                id="budget_approved"
                type="number"
                min={0}
                step="0.01"
                defaultValue={project.budget_approved ?? 0}
                onBlur={(e) => handleBudgetBlur(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                הסכום שאושר לאחר אישור הטיוטה — מעודכן אוטומטית מאישור הצעה או הזנה ידנית
              </p>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <Label>סיכום תקציב</Label>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>סה״כ פריטים</span>
                  <span>₪{itemsTotal.toLocaleString("he-IL")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>ביטוח</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-24"
                    defaultValue={insuranceVal}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (v !== insuranceVal) projectUpdateMutation.mutate({ insurance: v });
                    }}
                  />
                </div>
                <div className="flex justify-between gap-4">
                  <span>עמלת הפקה (%)</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    className="h-8 w-20"
                    defaultValue={productionFeePct}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value) ?? 15;
                      if (v !== productionFeePct) projectUpdateMutation.mutate({ production_fee_percent: v });
                    }}
                  />
                </div>
                <div className="flex justify-between">
                  <span>עמלת הפקה</span>
                  <span>₪{productionFee.toLocaleString("he-IL")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>הנחה</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-24"
                    defaultValue={discountVal}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (v !== discountVal) projectUpdateMutation.mutate({ discount: v });
                    }}
                  />
                </div>
                <div className="flex justify-between font-semibold pt-2">
                  <span>סה״כ כללי</span>
                  <span>₪{grandTotal.toLocaleString("he-IL")}</span>
                </div>
              </div>
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
    </Tabs>
  );
}
