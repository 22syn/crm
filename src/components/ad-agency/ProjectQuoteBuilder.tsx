import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Eye } from "lucide-react";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;
type OpClient = Tables<"op_clients">;

type ProjectWithClient = OpProject & { op_clients?: OpClient | null };

interface ProjectItemWithPrice {
  id: string;
  quantity: number;
  days: number;
  prep_days?: number;
  extras?: number;
  op_items: { type: string; price: number } | null;
}

interface ProjectQuoteBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithClient;
  onSuccess?: () => void;
}

export function ProjectQuoteBuilder({ open, onOpenChange, project, onSuccess }: ProjectQuoteBuilderProps) {
  const queryClient = useQueryClient();
  const { data: company } = useCompanySettings("ad_agency");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(14);
  const [previewOpen, setPreviewOpen] = useState(false);

  const clientId = project.client_id;

  const { data: client } = useQuery({
    queryKey: ["op_client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_clients").select("*").eq("id", clientId).single();
      if (error) throw error;
      return data as OpClient;
    },
    enabled: open && !!clientId,
  });

  const { data: projectItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["op_project_items", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_project_items")
        .select("id, quantity, days, prep_days, extras, op_items(type, price)")
        .eq("project_id", project.id);
      if (error) {
        const { data: fallback, error: err2 } = await supabase
          .from("op_project_items")
          .select("id, quantity, days, op_items(type, price)")
          .eq("project_id", project.id);
        if (err2) throw err2;
        return (fallback ?? []).map((r) => ({ ...r, prep_days: 0, extras: 0 })) as ProjectItemWithPrice[];
      }
      return data as ProjectItemWithPrice[];
    },
    enabled: open && !!project.id,
  });

  const rowTotal = (price: number, qty: number, days: number, prepDays: number, extras: number) =>
    price * qty * (days ?? 1) * (1 + (prepDays ?? 0)) + (extras ?? 0);

  const quoteItems = projectItems.map((pi) => {
    const type = pi.op_items?.type ?? "פריט";
    const pricePerDay = pi.op_items?.price ? Number(pi.op_items.price) : 0;
    const d = pi.days ?? 1;
    const prep = pi.prep_days ?? 0;
    const ext = pi.extras ?? 0;
    const totalPrice = rowTotal(pricePerDay, pi.quantity, d, prep, ext);
    const unitPrice = pi.quantity > 0 ? totalPrice / pi.quantity : 0;
    return {
      title: d > 1 ? `${type} • ${d} ימים` : type,
      quantity: pi.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };
  });

  const subtotal = quoteItems.reduce((s, i) => s + i.total_price, 0);
  const tax = (subtotal - discount) * 0.17;
  const total = subtotal - discount + tax;

  useEffect(() => {
    if (open && project.notes) setNotes(project.notes || "");
  }, [open, project.notes]);

  const saveMutation = useMutation({
    mutationFn: async (sendEmail: boolean) => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          project_id: project.id,
          customer_name: client?.name ?? "",
          customer_email: client?.email ?? null,
          customer_phone: client?.phone ?? null,
          customer_address: client?.address ?? null,
          status: sendEmail ? "sent" : "draft",
          subtotal,
          discount,
          tax,
          total,
          valid_until: validUntil.toISOString().split("T")[0],
          notes: notes || null,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      const itemsToInsert = quoteItems.map((item) => ({
        quote_id: quote.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from("quote_items").insert(itemsToInsert);
      if (itemsError) throw itemsError;

      if (sendEmail && client?.email) {
        const response = await supabase.functions.invoke("send-quote", {
          body: {
            customerName: client.name,
            customerEmail: client.email,
            customerPhone: client.phone ?? undefined,
            customerAddress: client.address ?? undefined,
            quoteNumber: (quote as { quote_number: string }).quote_number,
            quoteDate: new Date().toISOString(),
            items: quoteItems,
            subtotal,
            discount,
            tax,
            total,
            validUntil: validUntil.toISOString(),
            notes: notes || undefined,
            paymentTerms: (client as { payment_terms?: string | null })?.payment_terms ?? undefined,
          },
        });
        if (response.error) {
          console.error("Email send error:", response.error);
          toast.warning("ההצעה נשמרה, אך שליחת המייל נכשלה");
        }
      }

      if (sendEmail) {
        await supabase
          .from("op_projects")
          .update({ status: "waiting_for_approval" })
          .eq("id", project.id);
      }

      return { quote, sendEmail };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["op_project", project.id] });
      toast.success(data.sendEmail ? "ההצעה נשלחה" : "ההצעה נשמרה");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error("שגיאה בשמירת ההצעה"),
  });

  const hasItems = quoteItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>בנה הצעת מחיר מפרויקט</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {itemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasItems ? (
            <p className="text-sm text-muted-foreground">אין פריטים בפרויקט. הוסף פריטים בלשונית פריטים.</p>
          ) : (
            <>
              <div className="rounded border p-3 text-sm">
                <p className="font-medium">לקוח: {client?.name ?? "-"}</p>
                <p className="text-muted-foreground">
                  {quoteItems.length} פריטים | סה״כ: ₪{total.toLocaleString("he-IL")}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>הנחה (₪)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תוקף (ימים)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value, 10) || 14)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!hasItems}>
                  <Eye className="h-4 w-4 me-2" />
                  תצוגה מקדימה
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveMutation.mutate(false)}
                  disabled={saveMutation.isPending || !hasItems}
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                  שמור כטיוטה
                </Button>
                <Button onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending || !hasItems}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  שמור ושלוח במייל
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <QuotePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        customerName={client?.name ?? ""}
        customerAddress={client?.address ?? undefined}
        companyName={company?.name}
        companyAddress={company?.address ?? undefined}
        contactInfo={
          company
            ? {
                email: company.email ?? undefined,
                phone: company.phone ?? undefined,
                website: company.website ?? undefined,
              }
            : undefined
        }
        quoteNumber=""
        quoteDate={new Date()}
        items={quoteItems}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        total={total}
        validUntil={new Date(Date.now() + validDays * 24 * 60 * 60 * 1000)}
        notes={notes || undefined}
        paymentTerms={(client as { payment_terms?: string | null })?.payment_terms ?? undefined}
      />
    </Dialog>
  );
}
