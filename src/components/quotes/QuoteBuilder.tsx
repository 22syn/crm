import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchShopifyProducts, type ShopifyProduct } from "@/lib/shopify";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Send, 
  MessageCircle,
  Mail,
  Save
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface QuoteItem {
  id: string;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface QuoteBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function QuoteBuilder({ open, onOpenChange, lead }: QuoteBuilderProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(14);
  const [customerName, setCustomerName] = useState(lead?.customer_name || "");
  const [customerEmail, setCustomerEmail] = useState(lead?.customer_email || "");
  const [customerPhone, setCustomerPhone] = useState(lead?.customer_phone || "");
  const [isSending, setIsSending] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery<ShopifyProduct[]>({
    queryKey: ["shopify-products-quote"],
    queryFn: () => fetchShopifyProducts(50),
    enabled: open,
  });

  // Update customer info when lead changes
  useState(() => {
    if (lead) {
      setCustomerName(lead.customer_name);
      setCustomerEmail(lead.customer_email || "");
      setCustomerPhone(lead.customer_phone || "");
    }
  });

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = (subtotal - discount) * 0.17; // 17% VAT
  const total = subtotal - discount + tax;

  const addProduct = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    const existingIndex = items.findIndex(i => i.shopify_variant_id === variant.id);
    if (existingIndex >= 0) {
      updateQuantity(existingIndex, items[existingIndex].quantity + 1);
      return;
    }

    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      shopify_product_id: product.node.id,
      shopify_variant_id: variant.id,
      title: product.node.title,
      description: product.node.description,
      image_url: product.node.images.edges[0]?.node.url,
      quantity: 1,
      unit_price: parseFloat(variant.price.amount),
      total_price: parseFloat(variant.price.amount),
    };

    setItems([...items, newItem]);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = [...items];
    updated[index].quantity = quantity;
    updated[index].total_price = updated[index].unit_price * quantity;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async (sendEmail: boolean) => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      // Create quote - using any to bypass type check since quotes table was just created
      const { data: quote, error: quoteError } = await supabase
        .from("quotes" as any)
        .insert({
          lead_id: lead?.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          status: sendEmail ? "sent" : "draft",
          subtotal,
          discount,
          tax,
          total,
          valid_until: validUntil.toISOString().split('T')[0],
          notes,
        } as any)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItems = items.map(item => ({
        quote_id: (quote as any).id,
        shopify_product_id: item.shopify_product_id,
        shopify_variant_id: item.shopify_variant_id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items" as any)
        .insert(quoteItems as any);

      if (itemsError) throw itemsError;

      // Send email if requested
      if (sendEmail && customerEmail) {
        setIsSending(true);
        const response = await supabase.functions.invoke("send-quote", {
          body: {
            customerName,
            customerEmail,
            customerPhone,
            quoteNumber: (quote as any).quote_number,
            items: items.map(i => ({
              title: i.title,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total_price: i.total_price,
            })),
            subtotal,
            discount,
            tax,
            total,
            validUntil: validUntil.toISOString(),
            notes,
          },
        });

        if (response.error) {
          console.error("Email send error:", response.error);
          // Quote was saved but email failed - still show success
          toast.warning("הצעה נשמרה, אך שליחת המייל נכשלה");
          return quote;
        }
      }

      // Update lead status to quoted if linked
      if (lead) {
        await supabase
          .from("leads")
          .update({ status: "quoted" })
          .eq("id", lead.id);
      }

      return quote;
    },
    onSuccess: (quote, sendEmail) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(sendEmail ? "הצעה נשמרה ונשלחה!" : "הצעה נשמרה כטיוטה");
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("שגיאה בשמירת ההצעה: " + error.message);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  const resetForm = () => {
    setItems([]);
    setDiscount(0);
    setNotes("");
    setValidDays(14);
  };

  const getWhatsAppLink = () => {
    if (!customerPhone) return "";
    const phone = customerPhone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `שלום ${customerName}, מצורפת הצעת המחיר שלך בסך ₪${total.toFixed(2)}. לפרטים נוספים אנא צרו קשר.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>יצירת הצעת מחיר {lead && `עבור ${lead.customer_name}`}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Products Selection */}
          <div className="flex flex-col min-h-0">
            <Label className="mb-2">בחר מוצרים מהקטלוג</Label>
            <ScrollArea className="flex-1 border rounded-md p-2">
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : products?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>אין מוצרים בקטלוג</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {products?.map((product) => (
                    <Card
                      key={product.node.id}
                      className="p-2 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => addProduct(product)}
                    >
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {product.node.images.edges[0]?.node.url ? (
                          <img
                            src={product.node.images.edges[0].node.url}
                            alt={product.node.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.node.title}</p>
                        <p className="text-sm text-muted-foreground">
                          ₪{parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Quote Details */}
          <div className="flex flex-col min-h-0">
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>שם לקוח</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="שם הלקוח"
                  />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+972..."
                  />
                </div>
              </div>
              <div>
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <Label className="mb-2">פריטים בהצעה</Label>
            <ScrollArea className="flex-1 border rounded-md p-2 min-h-[150px]">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>לחץ על מוצר להוספה להצעה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ₪{item.unit_price.toFixed(2)} x {item.quantity} = ₪{item.total_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-md">
              <div className="flex justify-between text-sm">
                <span>סכום ביניים:</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>הנחה:</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 text-right"
                  min={0}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>מע"מ (17%):</span>
                <span>₪{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>סה"כ:</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3">
              <Label>הערות</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות להצעה..."
                className="h-16"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate(false)}
            disabled={items.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending && !isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            שמור כטיוטה
          </Button>
          
          <Button
            onClick={() => saveMutation.mutate(true)}
            disabled={items.length === 0 || !customerEmail || saveMutation.isPending}
          >
            {isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Mail className="h-4 w-4 mr-2" />
            שלח במייל
          </Button>

          {customerPhone && (
            <Button
              variant="secondary"
              asChild
              disabled={items.length === 0}
            >
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                שלח בוואטסאפ
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
