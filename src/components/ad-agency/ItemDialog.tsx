import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: OpItem | null;
  onSave: (data: { type: string; price: number }) => void;
}

export function ItemDialog({ open, onOpenChange, item, onSave }: ItemDialogProps) {
  const [type, setType] = useState("");
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setType(item.type);
      setPrice(Number(item.price) ?? 0);
    } else {
      setType("");
      setPrice(0);
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ type: type.trim(), price });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "עריכת פריט" : "פריט חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">סוג *</Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="למשל: צלם, איפור, שיער, מפיק"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">מחיר (₪) *</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price || ""}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {item ? "שמור שינויים" : "הוסף פריט"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
