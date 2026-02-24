import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type OpItem = Tables<"op_items">;

interface Section {
  id: string;
  name: string;
  sort_order: number;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: OpItem | null;
  sections?: Section[];
  onSave: (data: { type: string; price: number; section_id?: string | null }) => void;
}

export function ItemDialog({ open, onOpenChange, item, sections = [], onSave }: ItemDialogProps) {
  const [type, setType] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [sectionId, setSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setType(item.type);
      setPrice(Number(item.price) || 0);
      setSectionId((item as OpItem & { section_id?: string | null }).section_id ?? null);
    } else {
      setType("");
      setPrice(0);
      setSectionId(null);
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ type: type.trim(), price, section_id: sectionId || null });
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
          {sections.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="section">סקציה</Label>
              <Select value={sectionId ?? "none"} onValueChange={(v) => setSectionId(v === "none" ? null : v)}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="ללא סקציה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא סקציה</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
