import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Quotes() {
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const approveQuoteMutation = useMutation({
    mutationFn: async (quote: any) => {
      // Update quote status to approved
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "approved" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      // Get quote items that require custom design
      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quote.id)
        .eq("requires_custom_design", true);

      if (itemsError) throw itemsError;

      // Create design requests for items that need custom design
      if (items && items.length > 0) {
        const designRequests = items.map((item: any) => ({
          quote_id: quote.id,
          quote_item_id: item.id,
          customer_notes: item.custom_design_notes,
          status: "pending",
        }));

        const { error: designError } = await supabase
          .from("design_requests")
          .insert(designRequests);

        if (designError) throw designError;

        return { quote, designRequestsCreated: items.length };
      }

      return { quote, designRequestsCreated: 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      
      if (result.designRequestsCreated > 0) {
        toast.success(`הצעה אושרה! נוצרו ${result.designRequestsCreated} בקשות עיצוב`);
      } else {
        toast.success("הצעה אושרה בהצלחה");
      }
    },
    onError: (error) => {
      toast.error("שגיאה באישור ההצעה: " + error.message);
    },
  });

  const draftQuotes = quotes.filter(q => q.status === "draft");
  const sentQuotes = quotes.filter(q => q.status === "sent");
  const approvedQuotes = quotes.filter(q => q.status === "approved");

  const handleViewQuote = async (quote: any) => {
    setSelectedQuote(quote);
    
    // Fetch quote items
    const { data: items } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id);
    
    setQuoteItems(items || []);
    setPreviewOpen(true);
  };

  const handleApproveQuote = (quote: any) => {
    approveQuoteMutation.mutate(quote);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-muted-foreground">Manage and create customer quotes</p>
          </div>
          <Button onClick={() => setBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Quotes</h3>
            <p className="text-muted-foreground mt-1">Create your first quote</p>
            <Button className="mt-4" onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({quotes.length})</TabsTrigger>
              <TabsTrigger value="draft">Drafts ({draftQuotes.length})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({sentQuotes.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedQuotes.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotes.map((quote) => (
                  <QuoteCard 
                    key={quote.id} 
                    quote={quote}
                    onView={handleViewQuote}
                    onConvertToOrder={handleApproveQuote}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="draft" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftQuotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} onView={handleViewQuote} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="sent" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sentQuotes.map((quote) => (
                  <QuoteCard 
                    key={quote.id} 
                    quote={quote}
                    onView={handleViewQuote}
                    onConvertToOrder={handleApproveQuote}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedQuotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} onView={handleViewQuote} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <QuoteBuilder open={builderOpen} onOpenChange={setBuilderOpen} />

        {selectedQuote && (
          <QuotePreview
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            customerName={selectedQuote.customer_name}
            quoteNumber={selectedQuote.quote_number}
            items={quoteItems}
            subtotal={selectedQuote.subtotal}
            discount={selectedQuote.discount || 0}
            tax={selectedQuote.tax || 0}
            total={selectedQuote.total}
            validUntil={selectedQuote.valid_until ? new Date(selectedQuote.valid_until) : undefined}
            notes={selectedQuote.notes}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
