import { useState, useEffect } from "react";
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
import type { Tables } from "@/integrations/supabase/types";

const PAYMENT_TERMS_OPTIONS: { value: string; label: string }[] = [
  { value: "__none__", label: "ללא" },
  { value: "מקדמה 50%", label: "מקדמה 50%" },
  { value: "תשלום מראש", label: "תשלום מראש" },
  { value: "תוך 7 ימי עסקים", label: "תוך 7 ימי עסקים" },
  { value: "תוך 14 ימי עסקים", label: "תוך 14 ימי עסקים" },
  { value: "תוך 30 יום", label: "תוך 30 יום" },
  { value: "תוך 45 יום", label: "תוך 45 יום" },
  { value: "תוך 60 יום", label: "תוך 60 יום" },
  { value: "עם קבלת הסחורה", label: "עם קבלת הסחורה" },
];

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
    payment_terms: "",
    notes: "",
    is_active: true,
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
        payment_terms: (client as { payment_terms?: string | null }).payment_terms || "__none__",
        notes: client.notes || "",
        is_active: client.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        contact_name: "",
        contact_phone: "",
        address: "",
        payment_terms: "__none__",
        notes: "",
        is_active: true,
      });
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      is_active: formData.is_active,
      payment_terms: formData.payment_terms === "__none__" ? null : formData.payment_terms,
    });
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
            <Label htmlFor="payment_terms">תנאי תשלום</Label>
            <Select
              value={formData.payment_terms}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, payment_terms: v }))}
            >
              <SelectTrigger id="payment_terms">
                <SelectValue placeholder="בחר תנאי תשלום" />
              </SelectTrigger>
              <SelectContent>
                {[
                  ...PAYMENT_TERMS_OPTIONS,
                  ...(formData.payment_terms &&
                  formData.payment_terms !== "__none__" &&
                  !PAYMENT_TERMS_OPTIONS.some((o) => o.value === formData.payment_terms)
                    ? [{ value: formData.payment_terms, label: formData.payment_terms }]
                    : []),
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          {client && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="is_active">לקוח פעיל</Label>
                <p className="text-sm text-muted-foreground">לקוחות לא פעילים לא יופיעו ברשימת הלקוחות בעת יצירת פרויקט חדש</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_active: v }))}
              />
            </div>
          )}
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
