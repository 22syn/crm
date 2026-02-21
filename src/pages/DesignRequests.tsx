import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityPageShell, EntityToolbar } from "@/components/entity-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Palette, Upload, Loader2 } from "lucide-react";
import { DesignRequestTable } from "@/components/designs/DesignRequestTable";
import { DesignRequestKanban } from "@/components/designs/DesignRequestKanban";
import type { EntityViewMode } from "@/components/entity-page";

interface DesignRequest {
  id: string;
  quote_id: string;
  quote_item_id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  designer_id: string | null;
  design_file_url: string | null;
  design_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  quote_item?: {
    title: string;
    dimensions: string | null;
    product_type: string | null;
    image_url: string | null;
    custom_design_notes: string | null;
  };
  quote?: {
    quote_number: string;
    customer_name: string;
    customer_phone: string | null;
  };
}

export default function DesignRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [designNotes, setDesignNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<EntityViewMode>("kanban");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["design-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_requests")
        .select(`
          *,
          quote_item:quote_items(title, dimensions, product_type, image_url, custom_design_notes),
          quote:quotes(quote_number, customer_name, customer_phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as DesignRequest[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      design_file_url,
      design_notes
    }: {
      id: string;
      status?: string;
      design_file_url?: string;
      design_notes?: string;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (design_file_url) updates.design_file_url = design_file_url;
      if (design_notes !== undefined) updates.design_notes = design_notes;
      if (status === "completed") updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from("design_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-requests"] });
      toast.success("Request updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating: " + error.message);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedRequest) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedRequest.id}-${Date.now()}.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("designs")
        .getPublicUrl(fileName);

      await updateMutation.mutateAsync({
        id: selectedRequest.id,
        design_file_url: publicUrl,
        status: "completed",
        design_notes: designNotes,
      });

      // After design is completed, create a Deal and notify supplier
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", selectedRequest.quote_id)
        .single();

      if (!quoteError && quote) {
        // Create Deal
        const { error: dealError } = await supabase
          .from("deals")
          .insert({
            title: `Order: ${quote.quote_number} - ${quote.customer_name}`,
            amount: quote.total,
            quote_id: quote.id,
            lead_id: quote.lead_id,
            stage: "quote_approved",
          });

        if (dealError) {
          console.error("Error creating deal:", dealError);
        } else {
          toast.success("Deal created and supplier notified");
          // TODO: Actual notification to supplier logic
        }
      }

      setDialogOpen(false);
      setSelectedRequest(null);
      setDesignNotes("");
    } catch (error: any) {
      toast.error("Error uploading file: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openDesignDialog = (request: DesignRequest) => {
    setSelectedRequest(request);
    setDesignNotes(request.design_notes || "");
    setDialogOpen(true);
  };

  const startWork = (request: DesignRequest) => {
    updateMutation.mutate({ id: request.id, status: "in_progress" });
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const inProgressRequests = requests.filter((r) => r.status === "in_progress");
  const completedRequests = requests.filter((r) => r.status === "completed");

  const getTableRequests = () => {
    if (activeTab === "pending") return pendingRequests;
    if (activeTab === "in_progress") return inProgressRequests;
    return completedRequests;
  };

  if (isLoading) {
    return (
      <EntityPageShell
        title="Custom Designs"
        subtitle="Manage custom design requests"
        viewMode="kanban"
        onViewModeChange={() => {}}
        renderKanban={null}
        renderTable={null}
        isLoading
      />
    );
  }

  if (requests.length === 0) {
    return (
      <EntityPageShell
        title="Custom Designs"
        subtitle="Manage custom design requests"
        viewMode="kanban"
        onViewModeChange={() => {}}
        renderKanban={null}
        renderTable={null}
        isEmpty
        renderEmptyState={
          <div className="text-center py-12">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No design requests</h3>
            <p className="text-muted-foreground mt-1">
              Custom design requests will appear here after contract approval
            </p>
          </div>
        }
      />
    );
  }

  return (
    <EntityPageShell
      title="Custom Designs"
      subtitle="Manage custom design requests"
      viewMode={viewMode}
      onViewModeChange={(m) => m !== "report" && setViewMode(m)}
      renderKanban={
        <DesignRequestKanban
          requests={getTableRequests()}
          isLoading={false}
          onStartWork={startWork}
          onUploadDesign={openDesignDialog}
          onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
        />
      }
      renderTable={
        <DesignRequestTable
          requests={getTableRequests()}
          onStartWork={startWork}
          onUploadDesign={openDesignDialog}
        />
      }
      renderToolbar={() => (
        <EntityToolbar>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="rounded-sm">
              <TabsTrigger value="pending" className="rounded-sm">Pending ({pendingRequests.length})</TabsTrigger>
              <TabsTrigger value="in_progress" className="rounded-sm">In Progress ({inProgressRequests.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-sm">Completed ({completedRequests.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </EntityToolbar>
      )}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Custom Design</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedRequest && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequest.quote_item?.title}</p>
                  {selectedRequest.quote_item?.dimensions && (
                    <p className="text-sm text-muted-foreground">
                      Dimensions: {selectedRequest.quote_item.dimensions}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>Design notes</Label>
                <Textarea
                  value={designNotes}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  placeholder="Additional design details..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Design file</Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </EntityPageShell>
  );
}
