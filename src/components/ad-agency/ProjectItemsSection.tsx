import { useState, useEffect } from "react";
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
import { Plus, Minus, Trash2, Save, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;
type OpProjectItem = Tables<"op_project_items">;

interface ProjectItemWithDetails extends OpProjectItem {
  op_items: OpItem | null;
}

interface PendingItem {
  tempId: string;
  item_id: string;
  quantity: number;
  days: number;
  prep_days: number;
  extras: number;
}

interface ProjectItemsSectionProps {
  projectId: string;
}

export function ProjectItemsSection({ projectId }: ProjectItemsSectionProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  useEffect(() => {
    if (!addDialogOpen) setSearchQuery("");
  }, [addDialogOpen]);

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
        .select("id, project_id, item_id, quantity, days, prep_days, extras, created_at")
        .eq("project_id", projectId);
      if (error) {
        const { data: fallback, error: err2 } = await supabase
          .from("op_project_items")
          .select("id, project_id, item_id, quantity, days, created_at")
          .eq("project_id", projectId);
        if (err2) throw err2;
        const fallbackRows = (fallback ?? []).map((r) => ({ ...r, prep_days: 0, extras: 0 }));
        if (fallbackRows.length === 0) return [];
        const itemIds = [...new Set(fallbackRows.map((r) => r.item_id))];
        const { data: itemsData, error: itemsErr } = await supabase
          .from("op_items")
          .select("id, type, price")
          .in("id", itemIds);
        if (itemsErr) throw itemsErr;
        const itemsMap = new Map((itemsData ?? []).map((i) => [i.id, i]));
        return fallbackRows.map((r) => ({
          ...r,
          op_items: itemsMap.get(r.item_id) ?? null,
        })) as ProjectItemWithDetails[];
      }
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

  const saveAllMutation = useMutation({
    mutationFn: async (toSave: PendingItem[]) => {
      if (toSave.length === 0) return;
      const rows = toSave.map((p) => ({
        project_id: projectId,
        item_id: p.item_id,
        quantity: p.quantity,
        days: p.days,
        prep_days: p.prep_days ?? 0,
        extras: p.extras ?? 0,
      }));
      const { error } = await supabase.from("op_project_items").insert(rows);
      if (error) throw error;
      return toSave.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["op_project_items", projectId] });
      toast.success(`${count} פריטים נשמרו`);
      setPendingItems([]);
    },
    onError: () => toast.error("שגיאה בשמירת פריטים"),
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

  const rowTotal = (price: number, qty: number, days: number, prepDays: number, extras: number) =>
    price * qty * (days ?? 1) * (1 + (prepDays ?? 0)) + (extras ?? 0);

  const totalItems =
    projectItems.reduce((sum, pi) => {
      const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
      const d = pi.days != null ? Number(pi.days) : 1;
      const prep = (pi as { prep_days?: number }).prep_days ?? 0;
      const ext = (pi as { extras?: number }).extras ?? 0;
      return sum + rowTotal(price, pi.quantity, d, prep, ext);
    }, 0) +
    pendingItems.reduce((sum, p) => {
      const opItem = items.find((i) => i.id === p.item_id);
      const price = opItem?.price ? Number(opItem.price) : 0;
      return sum + rowTotal(price, p.quantity, p.days, p.prep_days, p.extras);
    }, 0);

  const handleAddItem = (itemId: string) => {
    setPendingItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), item_id: itemId, quantity: 1, days: 1, prep_days: 0, extras: 0 },
    ]);
  };

  const removePendingItem = (tempId: string) => {
    setPendingItems((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const updatePendingItem = (tempId: string, updates: Partial<Pick<PendingItem, "quantity" | "days" | "prep_days" | "extras">>) => {
    setPendingItems((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, ...updates } : p))
    );
  };

  const filteredItems = items.filter((i) =>
    searchQuery.trim() === ""
      ? true
      : i.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const itemsMap = new Map(items.map((i) => [i.id, i]));
  const hasPending = pendingItems.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-medium">פריטים בפרויקט</h3>
        <div className="flex gap-2">
          {hasPending && (
            <Button
              size="sm"
              variant="default"
              onClick={() => saveAllMutation.mutate(pendingItems)}
              disabled={saveAllMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              שמור {pendingItems.length} פריטים
            </Button>
          )}
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            הוסף פריט
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : projectItems.length === 0 && pendingItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין פריטים. הוסף פריט מהקטלוג.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>סוג</TableHead>
              <TableHead>כמות</TableHead>
              <TableHead>ימים</TableHead>
              <TableHead>ימי הכנות</TableHead>
              <TableHead>תוספות</TableHead>
              <TableHead>מחיר ליום</TableHead>
              <TableHead>סך הכל</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectItems.map((pi) => {
              const pricePerDay = pi.op_items?.price ? Number(pi.op_items.price) : 0;
              const d = pi.days != null ? Number(pi.days) : 1;
              const prep = (pi as { prep_days?: number }).prep_days ?? 0;
              const ext = (pi as { extras?: number }).extras ?? 0;
              const total = rowTotal(pricePerDay, pi.quantity, d, prep, ext);
              return (
                <TableRow key={pi.id}>
                  <TableCell>{pi.op_items?.type ?? "-"}</TableCell>
                  <TableCell>{pi.quantity}</TableCell>
                  <TableCell>{d}</TableCell>
                  <TableCell>{prep}</TableCell>
                  <TableCell>₪{(ext || 0).toLocaleString("he-IL")}</TableCell>
                  <TableCell>₪{pricePerDay.toLocaleString("he-IL")}</TableCell>
                  <TableCell>₪{total.toLocaleString("he-IL")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(pi.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {pendingItems.map((p) => {
              const opItem = itemsMap.get(p.item_id);
              const pricePerDay = opItem?.price ? Number(opItem.price) : 0;
              const total = rowTotal(pricePerDay, p.quantity, p.days, p.prep_days, p.extras);
              return (
                <TableRow key={p.tempId} className="bg-muted/30">
                  <TableCell>{opItem?.type ?? "-"}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{p.days}</TableCell>
                  <TableCell>{p.prep_days}</TableCell>
                  <TableCell>₪{(p.extras || 0).toLocaleString("he-IL")}</TableCell>
                  <TableCell>₪{pricePerDay.toLocaleString("he-IL")}</TableCell>
                  <TableCell>₪{total.toLocaleString("he-IL")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removePendingItem(p.tempId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {(projectItems.length > 0 || pendingItems.length > 0) && (
        <p className="text-sm font-medium">
          סה״כ פריטים: ₪{totalItems.toLocaleString("he-IL")}
          {hasPending && (
            <span className="text-muted-foreground font-normal mr-2">
              ({pendingItems.length} מחכים לשמירה)
            </span>
          )}
        </p>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>הוסף פריט לפרויקט</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 min-h-0 flex-1">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש פריט לפי סוג..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 h-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">בחר פריט להוספה</p>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-2 space-y-0.5">
                  {filteredItems.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-sm hover:bg-muted/50"
                    >
                      <span className="text-sm">
                        {i.type} – ₪{Number(i.price).toLocaleString("he-IL")}/יום
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleAddItem(i.id)}
                        aria-label={`הוסף ${i.type}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {items.length === 0 ? "אין פריטים בקטלוג" : "לא נמצאו תוצאות. נסה לחפש אחרת."}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
            {pendingItems.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">פריטים שנוספו ({pendingItems.length})</p>
                <ScrollArea className="h-[180px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {pendingItems.map((p) => {
                      const opItem = itemsMap.get(p.item_id);
                      const pricePerDay = opItem?.price ? Number(opItem.price) : 0;
                      const total = rowTotal(pricePerDay, p.quantity, p.days, p.prep_days, p.extras);
                      return (
                        <div
                          key={p.tempId}
                          className="flex items-center gap-2 px-3 py-2 rounded-sm bg-muted/50"
                        >
                          <span className="text-sm shrink-0 min-w-[80px]">{opItem?.type ?? "-"}</span>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 w-14 text-center"
                            value={p.quantity}
                            onChange={(e) =>
                              updatePendingItem(p.tempId, {
                                quantity: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">×</span>
                          <Input
                            type="number"
                            min={1}
                            step="0.5"
                            className="h-8 w-14 text-center"
                            value={p.days}
                            onChange={(e) =>
                              updatePendingItem(p.tempId, {
                                days: parseFloat(e.target.value) || 1,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">יום</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.5"
                            className="h-8 w-12 text-center"
                            value={p.prep_days}
                            onChange={(e) =>
                              updatePendingItem(p.tempId, {
                                prep_days: parseFloat(e.target.value) || 0,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">ימי הכנה</span>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            className="h-8 w-16 text-center"
                            value={p.extras}
                            onChange={(e) =>
                              updatePendingItem(p.tempId, {
                                extras: parseFloat(e.target.value) || 0,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">תוספות</span>
                          <span className="text-sm font-medium flex-1 text-end">
                            ₪{total.toLocaleString("he-IL")}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => removePendingItem(p.tempId)}
                            aria-label="הסר"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setAddDialogOpen(false)}>סיום</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
