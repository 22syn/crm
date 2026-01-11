import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileText, Loader2, Archive } from "lucide-react";
import { toast } from "sonner";

export default function Quotes() {
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: archivedQuotes = [] } = useQuery({
    queryKey: ["archived-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-archive unlinked quotes older than 14 days
  const archiveOldQuotesMutation = useMutation({
    mutationFn: async () => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const { error } = await supabase
        .from("quotes")
        .update({ archived_at: new Date().toISOString() })
        .is("lead_id", null)
        .not("unlinked_at", "is", null)
        .lt("unlinked_at", fourteenDaysAgo.toISOString())
        .is("archived_at", null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["archived-quotes"] });
    },
  });

  // Run auto-archive on mount
  useEffect(() => {
    archiveOldQuotesMutation.mutate();
  }, []);

  const approveQuoteMutation = useMutation({
    mutationFn: async (quote: any) => {
      // Update quote status to approved
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "approved" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      // If quote has a lead, convert lead to customer
      let customerId = null;
      if (quote.lead_id) {
        // Get the lead details
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .select("*")
          .eq("id", quote.lead_id)
          .single();

        if (leadError) throw leadError;

        // Check if lead is already converted
        if (!lead.converted_customer_id) {
          // Create customer from lead info
          const { data: customer, error: customerError } = await supabase
            .from("customers")
            .insert({
              name: lead.customer_name,
              email: lead.customer_email,
              phone: lead.customer_phone,
              address: lead.customer_address,
              notes: lead.notes,
            })
            .select()
            .single();

          if (customerError) throw customerError;

          customerId = customer.id;

          // Update lead with converted customer id and status to done
          const { error: updateLeadError } = await supabase
            .from("leads")
            .update({ 
              converted_customer_id: customer.id,
              status: "done"
            })
            .eq("id", quote.lead_id);

          if (updateLeadError) throw updateLeadError;
        } else {
          customerId = lead.converted_customer_id;
        }
      }

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

        return { quote, designRequestsCreated: items.length, customerId };
      }

      return { quote, designRequestsCreated: 0, customerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      let message = "Quote approved successfully";
      if (result.customerId) {
        message += " - Customer created";
      }
      if (result.designRequestsCreated > 0) {
        message += ` - ${result.designRequestsCreated} design request(s) created`;
      }
      toast.success(message);
    },
    onError: (error) => {
      toast.error("Error approving quote: " + error.message);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      // First delete quote items
      const { error: itemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);
      
      if (itemsError) throw itemsError;

      // Then delete the quote
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["archived-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quotes"] });
      toast.success("Quote deleted successfully");
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    },
    onError: (error) => {
      toast.error("Error deleting quote: " + error.message);
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

  const handleEditQuote = async (quote: any) => {
    // Show the quote preview - full edit requires more changes
    handleViewQuote(quote);
  };

  const handleDeleteQuote = (quote: any) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (quoteToDelete) {
      deleteQuoteMutation.mutate(quoteToDelete.id);
    }
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
        ) : quotes.length === 0 && archivedQuotes.length === 0 ? (
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
              {archivedQuotes.length > 0 && (
                <TabsTrigger value="archived">
                  <Archive className="h-4 w-4 mr-1" />
                  Archived ({archivedQuotes.length})
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotes.map((quote) => (
                  <QuoteCard 
                    key={quote.id} 
                    quote={quote}
                    onView={handleViewQuote}
                    onConvertToOrder={handleApproveQuote}
                    onEdit={handleEditQuote}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="draft" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftQuotes.map((quote) => (
                  <QuoteCard 
                    key={quote.id} 
                    quote={quote} 
                    onView={handleViewQuote}
                    onEdit={handleEditQuote}
                    onDelete={handleDeleteQuote}
                  />
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
                    onEdit={handleEditQuote}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedQuotes.map((quote) => (
                  <QuoteCard 
                    key={quote.id} 
                    quote={quote} 
                    onView={handleViewQuote}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>
            </TabsContent>

            {archivedQuotes.length > 0 && (
              <TabsContent value="archived" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedQuotes.map((quote) => (
                    <QuoteCard 
                      key={quote.id} 
                      quote={quote} 
                      onView={handleViewQuote}
                      onDelete={handleDeleteQuote}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        <QuoteBuilder 
          open={builderOpen} 
          onOpenChange={setBuilderOpen}
        />

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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quote</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete quote {quoteToDelete?.quote_number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
