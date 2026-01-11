import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DealKanban } from "@/components/deals/DealKanban";
import { DealDialog } from "@/components/deals/DealDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type DealStage = "proposal" | "negotiation" | "contract_sent" | "closed_won" | "closed_lost";

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  lead_id: string | null;
  quote_id: string | null;
  notes: string | null;
  created_at: string;
  leads?: { customer_name: string } | null;
}

export default function Deals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          leads(customer_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Deal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Deal, "id" | "quote_id" | "leads">) => {
      const { data: result, error } = await supabase
        .from("deals")
        .insert({
          title: data.title,
          stage: data.stage as DealStage,
          amount: data.amount,
          expected_close_date: data.expected_close_date,
          probability: data.probability,
          lead_id: data.lead_id,
          notes: data.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("העסקה נוצרה בהצלחה");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("שגיאה ביצירת העסקה");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Deal> & { id: string }) => {
      const { error } = await supabase
        .from("deals")
        .update({
          title: data.title,
          stage: data.stage as DealStage,
          amount: data.amount,
          expected_close_date: data.expected_close_date,
          probability: data.probability,
          lead_id: data.lead_id,
          notes: data.notes,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("העסקה עודכנה בהצלחה");
      setDialogOpen(false);
      setSelectedDeal(null);
    },
    onError: () => {
      toast.error("שגיאה בעדכון העסקה");
    },
  });

  const handleStageChange = async (dealId: string, stage: DealStage) => {
    const { error } = await supabase
      .from("deals")
      .update({ stage })
      .eq("id", dealId);
    
    if (error) {
      toast.error("שגיאה בעדכון השלב");
    } else {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  };

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedDeal) {
      updateMutation.mutate({ id: selectedDeal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedDeal(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">עסקאות</h1>
            <p className="text-muted-foreground">ניהול צינור המכירות</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            עסקה חדשה
          </Button>
        </div>

        <DealKanban
          deals={deals}
          isLoading={isLoading}
          onEdit={handleEdit}
          onStageChange={handleStageChange}
        />

        <DealDialog
          open={dialogOpen}
          onOpenChange={handleDialogChange}
          deal={selectedDeal}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
