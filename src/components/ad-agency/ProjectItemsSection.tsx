import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;
type OpProjectItem = Tables<"op_project_items">;

interface ProjectItemWithDetails extends OpProjectItem {
  op_items: OpItem | null;
}

interface ProjectItemsSectionProps {
  projectId: string;
}

export function ProjectItemsSection({ projectId }: ProjectItemsSectionProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const { data: items = [] } = useQuery({
    queryKey: ["op_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_items").select("*").order("type");
      if (error) throw error;
      return data as OpItem[];
    },
  });

  const { data: projectItems = [], isLoading } = useQuery({
    queryKey: ["op_project_items", projectId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("op_project_items")
        .select("id, project_id, item_id, quantity, created_at")
        .eq("project_id", projectId);
      if (error) throw error;
      if (!rows?.length) return [];
      const itemIds = [...new Set(rows.map((r) => r.item_id))];
      const { data: itemsData, error: itemsErr } = await supabase
        .from("op_items")
        .select("id, type, price")
        .in("id", itemIds);
      if (itemsErr) throw itemsErr;
      const itemsMap = new Map((itemsData ?? []).map((i) => [i.id, i]));
      return rows.map((r) => ({
        ...r,
        op_items: itemsMap.get(r.item_id) ?? null,
      })) as ProjectItemWithDetails[];
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async ({ item_id, quantity }: { item_id: string; quantity: number }) => {
      const { error } = await supabase.from("op_project_items").insert([{ project_id: projectId, item_id, quantity }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_items", projectId] });
      toast.success("פריט נוסף");
      setAddDialogOpen(false);
      setSelectedItemId("");
      setQuantity(1);
    },
    onError: () => toast.error("שגיאה בהוספת פריט"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_project_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_items", projectId] });
      toast.success("פריט הוסר");
    },
  });

  const totalItems = projectItems.reduce((sum, pi) => {
    const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
    return sum + price * pi.quantity;
  }, 0);

  const handleAdd = () => {
    if (!selectedItemId) return;
    addMutation.mutate({ item_id: selectedItemId, quantity });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">פריטים בפרויקט</h3>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          הוסף פריט
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : projectItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין פריטים. הוסף פריט מהקטלוג.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>סוג</TableHead>
              <TableHead>כמות</TableHead>
              <TableHead>מחיר ליחידה</TableHead>
              <TableHead>סך הכל</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectItems.map((pi) => {
              const unitPrice = pi.op_items?.price ? Number(pi.op_items.price) : 0;
              const rowTotal = unitPrice * pi.quantity;
              return (
                <TableRow key={pi.id}>
                  <TableCell>{pi.op_items?.type ?? "-"}</TableCell>
                  <TableCell>{pi.quantity}</TableCell>
                  <TableCell>₪{unitPrice.toLocaleString("he-IL")}</TableCell>
                  <TableCell>₪{rowTotal.toLocaleString("he-IL")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(pi.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {projectItems.length > 0 && (
        <p className="text-sm font-medium">
          סה״כ פריטים: ₪{totalItems.toLocaleString("he-IL")}
        </p>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף פריט לפרויקט</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>פריט</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פריט" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.type} – ₪{Number(i.price).toLocaleString("he-IL")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>כמות</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleAdd} disabled={!selectedItemId}>
                הוסף
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
