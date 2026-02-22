import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemDialog } from "@/components/ad-agency/ItemDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;

export default function AdAgencyItems() {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OpItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["op_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_items").select("*").order("type");
      if (error) throw error;
      return data as OpItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; price: number }) => {
      const { error } = await supabase.from("op_items").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט נוסף בהצלחה" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "שגיאה בהוספת פריט", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { type: string; price: number } }) => {
      const { error } = await supabase.from("op_items").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט עודכן בהצלחה" });
      setDialogOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון פריט", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_items"] });
      toast({ title: "פריט נמחק בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת פריט", variant: "destructive" });
    },
  });

  const handleSave = (data: { type: string; price: number }) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: OpItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (item: OpItem) => {
    if (confirm(`האם למחוק את הפריט "${item.type}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = role === "admin";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold">פריטים</h1>
            <p className="text-muted-foreground">קטלוג פריטים – סוג ומחיר</p>
          </div>
          <Button onClick={() => { setSelectedItem(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            הוסף פריט
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>רשימת פריטים</CardTitle>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי סוג..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו פריטים
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>סוג</TableHead>
                    <TableHead>מחיר (₪)</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{Number(item.price).toLocaleString("he-IL")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              עריכה
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                מחיקה
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={selectedItem}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}
