import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: OpClient | null;
  onSave: (data: Partial<OpClient> & { name: string }) => void;
}

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contact_name: "",
    contact_phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        contact_name: client.contact_name || "",
        contact_phone: client.contact_phone || "",
        address: client.address || "",
        notes: client.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        contact_name: "",
        contact_phone: "",
        address: "",
        notes: "",
      });
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם חברה/ארגון *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_name">שם איש קשר</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">טלפון איש קשר</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">{client ? "שמור שינויים" : "הוסף לקוח"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
