import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  MessageCircle,
  Mail,
  Save,
  Eye,
  Palette,
  Search
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { QuotePreview } from "./QuotePreview";
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
  dimensions?: string;
  product_type?: string;
  requires_custom_design?: boolean;
  custom_design_notes?: string;
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
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: products, isLoading: productsLoading } = useQuery<ShopifyProduct[]>({
    queryKey: ["shopify-products-quote"],
    queryFn: () => fetchShopifyProducts(50),
    enabled: open,
  });

  // Update customer info when lead changes or dialog opens
  useEffect(() => {
    if (open && lead) {
      setCustomerName(lead.customer_name);
      setCustomerEmail(lead.customer_email || "");
      setCustomerPhone(lead.customer_phone || "");
      setCustomerAddress(lead.customer_address || "");
    }
  }, [open, lead]);

  // Extract unique categories from products
  const categories = products 
    ? [...new Set(products.map(p => p.node.productType).filter(Boolean))]
    : [];

  // Filter products based on search and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = searchQuery === "" || 
      product.node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.node.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      product.node.productType === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Shopify prices include 17% VAT, so we need to extract the net price
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.17; // VAT already included in prices
  const total = subtotal + tax - discount;

  const getValidUntilDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + validDays);
    return date;
  };

  const addProduct = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    const existingIndex = items.findIndex(i => i.shopify_variant_id === variant.id);
    if (existingIndex >= 0) {
      updateQuantity(existingIndex, items[existingIndex].quantity + 1);
      return;
    }

    // Shopify price already includes 17% VAT
    const priceWithVat = parseFloat(variant.price.amount);

    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      shopify_product_id: product.node.id,
      shopify_variant_id: variant.id,
      title: product.node.title,
      description: product.node.description,
      image_url: product.node.images.edges[0]?.node.url,
      quantity: 1,
      unit_price: priceWithVat,
      total_price: priceWithVat,
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

  const updatePrice = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    const updated = [...items];
    updated[index].unit_price = newPrice;
    updated[index].total_price = newPrice * updated[index].quantity;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async (sendEmail: boolean) => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      // Create quote
      const quoteInsert: Database["public"]["Tables"]["quotes"]["Insert"] = {
        quote_number: `Q-${Date.now()}`,
        lead_id: lead?.id ?? null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress || null,
        status: sendEmail ? "sent" : "draft",
        subtotal,
        discount,
        tax,
        total,
        valid_until: validUntil.toISOString().split("T")[0],
        notes: notes || null,
      };
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert(quoteInsert)
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items with dimensions, product_type, and custom design info
      const quoteItems = items.map(item => ({
        quote_id: quote.id,
        shopify_product_id: item.shopify_product_id,
        shopify_variant_id: item.shopify_variant_id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        dimensions: item.dimensions,
        product_type: item.product_type,
        requires_custom_design: item.requires_custom_design || false,
        custom_design_notes: item.custom_design_notes,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      // Send email if requested
      if (sendEmail && customerEmail) {
        setIsSending(true);
        const response = await supabase.functions.invoke("send-quote", {
          body: {
            customerName,
            customerEmail,
            customerPhone,
            quoteNumber: quote.quote_number,
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
          toast.warning("Contract saved, but email failed to send");
          return quote;
        }
      }

      // Update lead status to waiting_for_approval if linked and quote is sent
      if (lead) {
        await supabase
          .from("leads")
          .update({ status: "waiting_for_approval" })
          .eq("id", lead.id);
      }

      return quote;
    },
    onSuccess: (quote, sendEmail) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(sendEmail ? "Contract saved and sent!" : "Contract saved as draft");
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error saving contract: " + error.message);
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
    setCustomerAddress("");
  };

  const updateItemDimensions = (index: number, dimensions: string) => {
    const updated = [...items];
    updated[index].dimensions = dimensions;
    setItems(updated);
  };

  const updateItemProductType = (index: number, productType: string) => {
    const updated = [...items];
    updated[index].product_type = productType;
    setItems(updated);
  };

  const updateItemCustomDesign = (index: number, requiresCustomDesign: boolean) => {
    const updated = [...items];
    updated[index].requires_custom_design = requiresCustomDesign;
    setItems(updated);
  };

  const updateItemCustomDesignNotes = (index: number, notes: string) => {
    const updated = [...items];
    updated[index].custom_design_notes = notes;
    setItems(updated);
  };

  const getWhatsAppLink = () => {
    if (!customerPhone) return "";
    const phone = customerPhone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello ${customerName}, please find your contract for ₪${total.toFixed(2)}. For more details, please contact us.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Contract {lead && `for ${lead.customer_name}`}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Products Selection */}
          <div className="flex flex-col min-h-0">
            <Label className="mb-2">Select Products from Catalog</Label>
            
            {/* Search and Filter Controls */}
            <div className="space-y-2 mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
              {categories.length > 0 && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <ScrollArea className="flex-1 border rounded-md p-2">
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredProducts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>{searchQuery || selectedCategory !== "all" ? "No matching products" : "No products in catalog"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts?.map((product) => (
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
                            loading="lazy"
                            width={48}
                            height={48}
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
                        {product.node.productType && (
                          <p className="text-xs text-muted-foreground">{product.node.productType}</p>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Contract Details */}
          <div className="flex flex-col min-h-0">
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+972..."
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Customer address"
                />
              </div>
            </div>

            <Label className="mb-2">Contract Items</Label>
            <ScrollArea className="flex-1 border rounded-md p-2 min-h-[150px]">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click on a product to add to contract</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-muted/50 rounded space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>₪</span>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                              className="w-20 h-5 text-xs p-1"
                              min={0}
                              step={0.01}
                            />
                            <span>x {item.quantity} = ₪{item.total_price.toFixed(2)}</span>
                          </div>
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
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Dimensions</Label>
                          <Input
                            value={item.dimensions || ""}
                            onChange={(e) => updateItemDimensions(index, e.target.value)}
                            placeholder="e.g. 180x90 cm"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Product Type</Label>
                          <Input
                            value={item.product_type || ""}
                            onChange={(e) => updateItemProductType(index, e.target.value)}
                            placeholder="e.g. Dining Table"
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                          id={`custom-design-${item.id}`}
                          checked={item.requires_custom_design || false}
                          onCheckedChange={(checked) => updateItemCustomDesign(index, !!checked)}
                        />
                        <Label htmlFor={`custom-design-${item.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                          <Palette className="h-3 w-3" />
                          Requires Custom Design
                        </Label>
                      </div>
                      {item.requires_custom_design && (
                        <div className="mt-2">
                          <Label className="text-xs">Designer Notes</Label>
                          <Input
                            value={item.custom_design_notes || ""}
                            onChange={(e) => updateItemCustomDesignNotes(index, e.target.value)}
                            placeholder="Design requirements..."
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-md">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (17%):</span>
                <span>₪{tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Discount:</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 text-right"
                  min={0}
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the contract..."
                className="h-16"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => setPreviewOpen(true)}
            disabled={items.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button
            variant="outline"
            onClick={() => saveMutation.mutate(false)}
            disabled={items.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending && !isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          <Button
            onClick={() => saveMutation.mutate(true)}
            disabled={items.length === 0 || !customerEmail || saveMutation.isPending}
          >
            {isSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>

          {customerPhone && (
            <Button
              variant="secondary"
              asChild
              disabled={items.length === 0}
            >
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send WhatsApp
              </a>
            </Button>
          )}
        </div>

        <QuotePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          customerName={customerName}
          customerAddress={customerAddress}
          items={items.map(i => ({
            title: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
            dimensions: i.dimensions,
            product_type: i.product_type,
          }))}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          validUntil={getValidUntilDate()}
          notes={notes}
        />
      </DialogContent>
    </Dialog>
  );
}
