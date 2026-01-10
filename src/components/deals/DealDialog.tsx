import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

const dealSchema = z.object({
  title: z.string().min(1, "נדרשת כותרת"),
  stage: z.enum(["proposal", "negotiation", "contract_sent", "closed_won", "closed_lost"]),
  amount: z.coerce.number().min(0, "סכום לא יכול להיות שלילי"),
  expected_close_date: z.date().nullable(),
  probability: z.number().min(0).max(100),
  lead_id: z.string().nullable(),
  notes: z.string().nullable(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  lead_id: string | null;
  quote_id: string | null;
  order_id: string | null;
  notes: string | null;
}

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  onSubmit: (data: DealFormData) => void;
  isLoading?: boolean;
}

const STAGES = [
  { value: "proposal", label: "הצעה" },
  { value: "negotiation", label: "משא ומתן" },
  { value: "contract_sent", label: "חוזה נשלח" },
  { value: "closed_won", label: "נסגר בהצלחה" },
  { value: "closed_lost", label: "אבוד" },
];

export function DealDialog({ open, onOpenChange, deal, onSubmit, isLoading }: DealDialogProps) {
  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      stage: "proposal",
      amount: 0,
      expected_close_date: null,
      probability: 50,
      lead_id: null,
      notes: null,
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["leads-for-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, customer_name")
        .not("status", "in", '("won","lost")')
        .order("customer_name");
      return data || [];
    },
  });

  useEffect(() => {
    if (deal) {
      form.reset({
        title: deal.title,
        stage: deal.stage as DealFormData["stage"],
        amount: deal.amount,
        expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
        probability: deal.probability ?? 50,
        lead_id: deal.lead_id,
        notes: deal.notes,
      });
    } else {
      form.reset({
        title: "",
        stage: "proposal",
        amount: 0,
        expected_close_date: null,
        probability: 50,
        lead_id: null,
        notes: null,
      });
    }
  }, [deal, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{deal ? "ערוך עסקה" : "עסקה חדשה"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="שם העסקה" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שלב</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סכום (₪)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lead_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ליד מקושר</FormLabel>
                  <Select 
                    value={field.value || ""} 
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר ליד..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">ללא</SelectItem>
                      {leads?.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.customer_name}
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
              name="expected_close_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך סגירה צפוי</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: he })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        locale={he}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="probability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סיכוי סגירה: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([val]) => field.onChange(val)}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="הערות נוספות..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "שומר..." : deal ? "עדכן" : "צור עסקה"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
