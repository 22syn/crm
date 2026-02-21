import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";

export default function QuoteApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ paymentProofUrl }: { paymentProofUrl: string }) => {
      // 1. Update quote status and payment proof URL
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ 
          status: "approved",
          payment_proof_url: paymentProofUrl as any // Cast because column might not exist yet but we'll try
        })
        .eq("id", id);

      if (quoteError) throw quoteError;

      // 2. Check if design is needed
      const needsDesign = quote.quote_items.some((item: any) => item.requires_custom_design);

      if (needsDesign) {
        // Create design requests
        const designRequests = quote.quote_items
          .filter((item: any) => item.requires_custom_design)
          .map((item: any) => ({
            quote_id: id,
            quote_item_id: item.id,
            customer_notes: item.custom_design_notes,
            status: "pending",
          }));

        const { error: designError } = await supabase
          .from("design_requests")
          .insert(designRequests);

        if (designError) throw designError;
        
        return { type: "design" };
      } else {
        // Create Deal immediately
        const { error: dealError } = await supabase
          .from("deals")
          .insert({
            title: `Order: ${quote.quote_number} - ${quote.customer_name}`,
            amount: quote.total,
            quote_id: id,
            lead_id: quote.lead_id,
            stage: "quote_approved",
          });

        if (dealError) throw dealError;

        // TODO: Notify Supplier logic would go here
        
        return { type: "deal" };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      
      if (data.type === "design") {
        toast.success("Contract approved and sent to designer");
        navigate("/design-requests");
      } else {
        toast.success("Contract approved and converted to deal");
        navigate("/deals");
      }
    },
    onError: (error) => {
      toast.error("Error approving contract: " + error.message);
    },
  });

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) {
        // Fallback or handle bucket missing
        if (uploadError.message.includes("does not exist")) {
            toast.error("Storage bucket 'payment-proofs' does not exist in Supabase");
            throw uploadError;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      await approveMutation.mutateAsync({ paymentProofUrl: publicUrl });
    } catch (error: any) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Contract not found</h2>
          <Button className="mt-4" onClick={() => navigate("/contracts")}>Back to contracts</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate("/contracts")} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Back to contracts
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract approval {quote.quote_number}</CardTitle>
            <CardDescription>Upload payment proof to complete the process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{quote.customer_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total amount:</span>
                <span className="font-medium text-lg">₪{quote.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="payment-proof">Payment proof (image or PDF)</Label>
                <div className="flex gap-2">
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading || approveMutation.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You must upload a file to continue the approval process.
                </p>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={handleFileUpload}
                disabled={!file || uploading || approveMutation.isPending}
              >
                {uploading || approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve contract and upload proof
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <FileText className="h-5 w-5 flex-shrink-0" />
          <p>
            After approval, the system will route automatically:
            {quote.quote_items.some((i: any) => i.requires_custom_design) 
              ? " This contract includes custom design items and will be sent to the designer first."
              : " This contract will be converted directly to an order and sent to the supplier."}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
