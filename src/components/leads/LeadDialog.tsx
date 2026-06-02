import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, FileText, Eye, Unlink, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { escapeIlike } from "@/lib/escapeIlike";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";
import { getSourceConfig } from "@/utils/sourceIcons";
import { LEAD_STAGES } from "@/utils/leadStages";
import { LeadComments } from "./LeadComments";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

/** Normalize phone to digits only for comparison. */
function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize email for comparison. */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSave: (data: LeadInsert) => void;
  isLoading: boolean;
  teamMembers?: CrmTeamMember[];
  onCreateQuote?: (lead: Lead) => void;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
  onAssociateQuote?: (quoteId: string, leadId: string) => void;
  /** When duplicate lead is found (create flow), call with existing lead id to close and open that lead. */
  onViewExistingLead?: (leadId: string) => void;
  /** When provided, show a "View" button in header to open lead detail page (edit flow only). */
  onViewLead?: (leadId: string) => void;
}

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "architects", label: "Architects/Designers" },
  { value: "organic", label: "Organic" },
  { value: "facebook", label: "Facebook" },
] as const;

const statuses = LEAD_STAGES.map((s) => ({ value: s.value, label: s.label })) as { value: typeof LEAD_STAGES[number]["value"]; label: string }[];

export function LeadDialog({ open, onOpenChange, lead, onSave, isLoading, teamMembers = [], onCreateQuote, onViewQuote, onUnlinkQuote, onAssociateQuote, onViewExistingLead, onViewLead }: LeadDialogProps) {
  const { role } = useAuth();
  const hidePhoneInEdit = !!lead && role === "sales";
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
  /** When creating a new lead, set if phone/email blur finds an existing lead (duplicate). */
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  // Fetch unlinked quotes
  const { data: unlinkedQuotes } = useQuery<Quote[]>({
    queryKey: ["unlinked-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .is("lead_id", null)
        .is("archived_at", null);

      if (error) throw error;
      return data || [];
    },
    enabled: open && isLinking,
  });

  // Fetch quote for this lead
  const { data: quote } = useQuery<Quote | null>({
    queryKey: ["lead-quote", lead?.id],
    queryFn: async () => {
      if (!lead) return null;
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("lead_id", lead.id)
        .is("archived_at", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!lead && open,
  });

  const form = useForm<LeadInsert & { customer_address?: string }>({
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      source: "organic",
      status: "new",
      notes: "",
      meeting_date: null,
      customer_address: "",
      assigned_to: null,
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        customer_name: lead.customer_name,
        customer_email: lead.customer_email || "",
        customer_phone: lead.customer_phone || "",
        source: lead.source,
        status: lead.status,
        notes: lead.notes || "",
        meeting_date: lead.meeting_date || null,
        customer_address: lead.customer_address || "",
        assigned_to: lead.assigned_to ?? null,
      });
      setDuplicateLead(null);
    } else {
      form.reset({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        source: "organic",
        status: "new",
        notes: "",
        meeting_date: null,
        customer_address: "",
        assigned_to: null,
      });
      setDuplicateLead(null);
    }
  }, [lead, form]);

  /** Check for existing lead by email or phone (create flow only). Normalizes and queries; sets duplicateLead if found. */
  const checkDuplicate = async (field: "email" | "phone", value: string) => {
    if (lead) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setDuplicateLead(null);
      return;
    }
    setDuplicateChecking(true);
    setDuplicateLead(null);
    try {
      if (field === "email") {
        const norm = normalizeEmail(trimmed);
        const { data } = await supabase
          .from("leads")
          .select("id, customer_name, customer_email, customer_phone")
          .not("customer_email", "is", null)
          .limit(10);
        const match = (data ?? []).find(
          (row) => normalizeEmail((row.customer_email as string) ?? "") === norm
        );
        if (match) setDuplicateLead(match as Lead);
      } else {
        const digits = normalizePhone(trimmed);
        if (digits.length < 8) {
          setDuplicateChecking(false);
          return;
        }
        const { data } = await supabase
          .from("leads")
          .select("id, customer_name, customer_email, customer_phone")
          .not("customer_phone", "is", null)
          .ilike("customer_phone", `%${escapeIlike(digits)}%`)
          .limit(20);
        const match = (data ?? []).find(
          (row) => normalizePhone((row.customer_phone as string) ?? "") === digits
        );
        if (match) setDuplicateLead(match as Lead);
      }
    } finally {
      setDuplicateChecking(false);
    }
  };

  const handleSubmit = (data: LeadInsert) => {
    if (duplicateLead) return;
    onSave(data);
  };

  const canCreateQuote = lead && !["done", "not_done", "waiting_for_approval"].includes(lead.status) && !quote;

  const handleUnlinkConfirm = () => {
    if (lead) {
      onUnlinkQuote?.(lead.id);
      setUnlinkConfirmOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
              <DialogDescription className="sr-only">
                {lead ? "Edit lead details, notes, and activity" : "Create a new lead with customer details"}
              </DialogDescription>
            </div>
            {lead && onViewLead && (
              <Button variant="outline" size="sm" onClick={() => { onViewLead(lead.id); onOpenChange(false); }}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_name"
              rules={{ required: "Customer name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          if (!lead) checkDuplicate("email", e.target.value);
                        }}
                        onChange={(e) => {
                          field.onChange(e);
                          setDuplicateLead(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                rules={{ required: "Phone is required" }}
                render={({ field }) => (
                  <FormItem className={hidePhoneInEdit ? "hidden" : undefined}>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+972-50-000-0000"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          if (!lead) checkDuplicate("phone", e.target.value);
                        }}
                        onChange={(e) => {
                          field.onChange(e);
                          setDuplicateLead(null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duplicate lead warning (create flow only). Block submit until resolved. */}
            {!lead && duplicateLead && (
              <Alert variant="destructive" className="rounded-sm">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Possible duplicate</AlertTitle>
                <AlertDescription>
                  A lead with this email or phone already exists: <strong>{duplicateLead.customer_name}</strong>.
                  Open the existing lead or change the value to create a new one.
                </AlertDescription>
                {onViewExistingLead && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onViewExistingLead(duplicateLead.id);
                      onOpenChange(false);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View existing lead
                  </Button>
                )}
              </Alert>
            )}
            {!lead && duplicateChecking && (
              <p className="text-meta text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking for duplicates…
              </p>
            )}

            <FormField
              control={form.control}
              name="customer_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map((opt) => {
                          const { Icon } = getSourceConfig(opt.value);
                          return (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5" />
                                <span>{opt.label}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned to (optional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "unassigned" ? null : v)}
                      value={field.value ?? "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.full_name || m.email || m.user_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meeting_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Meeting Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Select date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString() || null)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract Actions - only show when editing */}
            {lead && (
              <div className="space-y-2">
                <FormLabel>Contract</FormLabel>
                <div className="flex flex-col gap-2">
                  {quote ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onOpenChange(false);
                          onViewQuote?.(lead.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Contract ({quote.quote_number})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setUnlinkConfirmOpen(true)}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Unlink
                      </Button>
                    </div>
                  ) : isLinking ? (
                    <div className="space-y-2 border p-3 rounded-md bg-accent/50">
                      <Label className="text-xs">Select Contract to Link</Label>
                      <Select onValueChange={setSelectedQuoteId} value={selectedQuoteId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Choose a contract..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unlinkedQuotes?.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              {q.quote_number} - {q.customer_name} (₪{q.total.toFixed(2)})
                            </SelectItem>
                          ))}
                          {unlinkedQuotes?.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No unlinked contracts found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => {
                            if (selectedQuoteId) {
                              onAssociateQuote?.(selectedQuoteId, lead.id);
                              setIsLinking(false);
                              setSelectedQuoteId("");
                            }
                          }}
                          disabled={!selectedQuoteId}
                        >
                          Confirm Link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => setIsLinking(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onOpenChange(false);
                          onCreateQuote?.(lead);
                        }}
                        disabled={!canCreateQuote}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Create Contract
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setIsLinking(true)}
                      >
                        <Unlink className="h-4 w-4 rotate-180 mr-2" />
                        Link Existing
                      </Button>
                    </div>
                  )}
                  {!quote && !isLinking && !canCreateQuote && (
                    <p className="text-xs text-muted-foreground">Cannot create new contract for this status</p>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add relevant notes about the lead..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {lead && (
              <LeadComments leadId={lead.id} />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !!duplicateLead}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {lead ? "Update Lead" : "Create Lead"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>

      <AlertDialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this contract from the lead? The contract will not be deleted, but it will no longer be associated with this lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkConfirm}>
              Unlink Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
