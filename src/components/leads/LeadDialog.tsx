import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, FileText, Eye, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSave: (data: LeadInsert) => void;
  isLoading: boolean;
  onCreateQuote?: (lead: Lead) => void;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
}

const sources = [
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "website", label: "Website", icon: "🌐" },
  { value: "architects", label: "Architects/Designers", icon: "🏛️" },
  { value: "organic", label: "Organic", icon: "🌱" },
  { value: "facebook", label: "Facebook", icon: "📘" },
] as const;

const statuses = [
  { value: "new", label: "0 - New" },
  { value: "in_process", label: "1 - In Process" },
  { value: "meeting_scheduled", label: "2 - Meeting Scheduled" },
  { value: "meeting_done", label: "2.5 - Meeting Done" },
  { value: "waiting_for_approval", label: "3 - Waiting for Approval" },
  { value: "done", label: "4 - Done" },
  { value: "not_done", label: "Not Done" },
] as const;

export function LeadDialog({ open, onOpenChange, lead, onSave, isLoading, onCreateQuote, onViewQuote, onUnlinkQuote }: LeadDialogProps) {
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  
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
      });
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
      });
    }
  }, [lead, form]);

  const handleSubmit = (data: LeadInsert) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "New Lead"}</DialogTitle>
        </DialogHeader>

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
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
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+972-50-000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        {sources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            <span className="flex items-center gap-2">
                              <span>{source.icon}</span>
                              <span>{source.label}</span>
                            </span>
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
            </div>

            <FormField
              control={form.control}
              name="meeting_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Meeting Date</FormLabel>
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

            {/* Quote Actions - only show when editing */}
            {lead && (
              <div className="space-y-2">
                <FormLabel>Quote</FormLabel>
                <div className="flex gap-2">
                  {quote ? (
                    <>
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
                        View Quote ({quote.quote_number})
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
                    </>
                  ) : canCreateQuote ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        onCreateQuote?.(lead);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create Quote
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">No quote linked</p>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {lead ? "Update Lead" : "Create Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this quote from the lead? The quote will not be deleted, but it will no longer be associated with this lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkConfirm}>
              Unlink Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
