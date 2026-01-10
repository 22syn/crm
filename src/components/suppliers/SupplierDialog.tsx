import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

type Supplier = Tables<"suppliers">;
type ProductSegment = Tables<"product_segments">;

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSave: (data: Partial<Supplier> & { name: string }) => void;
}

export function SupplierDialog({ open, onOpenChange, supplier, onSave }: SupplierDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    is_active: true,
    segment_id: null as string | null,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["product-segments-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_segments")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as ProductSegment[];
    },
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        contact_name: supplier.contact_name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        notes: supplier.notes || "",
        is_active: supplier.is_active ?? true,
        segment_id: supplier.segment_id || null,
      });
    } else {
      setFormData({
        name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        is_active: true,
        segment_id: null,
      });
    }
  }, [supplier, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{supplier ? "עריכת ספק" : "ספק חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם הספק *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment">סגמנט</Label>
            <Select
              value={formData.segment_id || "__none__"}
              onValueChange={(val) => setFormData(prev => ({ ...prev, segment_id: val === "__none__" ? null : val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סגמנט..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ללא</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    {segment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">איש קשר</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">ספק פעיל</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {supplier ? "שמור שינויים" : "צור ספק"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
