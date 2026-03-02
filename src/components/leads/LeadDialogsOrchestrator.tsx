import { LeadDialog } from "@/components/leads/LeadDialog";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { QuotePreview } from "@/components/quotes/QuotePreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database, Tables } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

export interface LeadDialogsOrchestratorProps {
  /** Lead create/edit dialog */
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
  editingLead: Lead | null;
  setEditingLead: (v: Lead | null) => void;
  onSave: (lead: Lead | LeadInsert) => void | Promise<void>;
  savePending: boolean;
  teamMembers: CrmTeamMember[];
  onCreateQuote: (lead: Lead) => void;
  onViewQuote: (leadId: string) => void;
  onUnlinkQuote: (leadId: string) => void;
  onAssociateQuote: (quoteId: string, leadId: string) => void;
  onViewExistingLead: (leadId: string) => void;
  onViewLead: (leadId: string) => void;

  /** Quote builder */
  quoteBuilderOpen: boolean;
  setQuoteBuilderOpen: (v: boolean) => void;
  quoteLead: Lead | null;

  /** Quote preview */
  previewOpen: boolean;
  setPreviewOpen: (v: boolean) => void;
  selectedQuote: Quote | null;
  quoteItems: Tables<"quote_items">["Row"][];

  /** Save view dialog */
  saveViewDialogOpen: boolean;
  setSaveViewDialogOpen: (v: boolean) => void;
  newViewName: string;
  setNewViewName: (v: string) => void;
  onSaveAsNewView: () => void;
  saveAsNewViewPending: boolean;
}

export function LeadDialogsOrchestrator({
  dialogOpen,
  setDialogOpen,
  editingLead,
  setEditingLead,
  onSave,
  savePending,
  teamMembers,
  onCreateQuote,
  onViewQuote,
  onUnlinkQuote,
  onAssociateQuote,
  onViewExistingLead,
  onViewLead,
  quoteBuilderOpen,
  setQuoteBuilderOpen,
  quoteLead,
  previewOpen,
  setPreviewOpen,
  selectedQuote,
  quoteItems,
  saveViewDialogOpen,
  setSaveViewDialogOpen,
  newViewName,
  setNewViewName,
  onSaveAsNewView,
  saveAsNewViewPending,
}: LeadDialogsOrchestratorProps) {
  return (
    <>
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={onSave}
        isLoading={savePending}
        teamMembers={teamMembers}
        onCreateQuote={onCreateQuote}
        onViewQuote={onViewQuote}
        onUnlinkQuote={onUnlinkQuote}
        onAssociateQuote={onAssociateQuote}
        onViewExistingLead={(leadId) => {
          setDialogOpen(false);
          setEditingLead(null);
          onViewExistingLead(leadId);
        }}
        onViewLead={(leadId) => {
          setDialogOpen(false);
          setEditingLead(null);
          onViewLead(leadId);
        }}
      />

      <QuoteBuilder
        open={quoteBuilderOpen}
        onOpenChange={setQuoteBuilderOpen}
        lead={quoteLead}
      />

      {selectedQuote && (
        <QuotePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          customerName={selectedQuote.customer_name}
          customerAddress={selectedQuote.customer_address ?? undefined}
          quoteNumber={selectedQuote.quote_number}
          quoteDate={
            selectedQuote.created_at
              ? new Date(selectedQuote.created_at)
              : undefined
          }
          items={quoteItems}
          subtotal={selectedQuote.subtotal}
          discount={selectedQuote.discount || 0}
          tax={selectedQuote.tax || 0}
          total={selectedQuote.total}
          validUntil={
            selectedQuote.valid_until
              ? new Date(selectedQuote.valid_until)
              : undefined
          }
          notes={selectedQuote.notes}
        />
      )}

      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as new view</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Save current filters as a named view so you can switch back to it
            later.
          </p>
          <div className="grid gap-2 py-2">
            <Label htmlFor="view-name">View name</Label>
            <Input
              id="view-name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="e.g. My pipeline"
              onKeyDown={(e) => e.key === "Enter" && onSaveAsNewView()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveViewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={onSaveAsNewView}
              disabled={saveAsNewViewPending}
            >
              {saveAsNewViewPending ? "Saving…" : "Save view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
