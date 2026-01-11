import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MessageSquare, GripVertical, FileText, Calendar, Eye, Unlink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const sourceLabels: Record<string, { label: string; icon: string }> = {
  instagram: { label: "Instagram", icon: "📷" },
  website: { label: "Website", icon: "🌐" },
  architects: { label: "Architects", icon: "🏛️" },
  organic: { label: "Organic", icon: "🌱" },
  facebook: { label: "Facebook", icon: "📘" },
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onCreateQuote?: (lead: Lead) => void;
  quote?: Quote;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
}

export function LeadCard({ lead, onEdit, onCreateQuote, quote, onViewQuote, onUnlinkQuote }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Hide create quote button for done/not_done/waiting_for_approval statuses or if quote exists
  const canCreateQuote = !["done", "not_done", "waiting_for_approval"].includes(lead.status) && !quote;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-medium">
              {lead.customer_name}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(lead)}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <Badge variant="outline" className="w-fit text-xs ml-6">
          <span className="flex items-center gap-1">
            <span>{sourceLabels[lead.source]?.icon || "📌"}</span>
            <span>{sourceLabels[lead.source]?.label || lead.source}</span>
          </span>
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {lead.meeting_date && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <Calendar className="h-3 w-3" />
            <span>Meeting: {format(new Date(lead.meeting_date), "dd/MM/yyyy")}</span>
          </div>
        )}
        {lead.customer_phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span dir="ltr">{lead.customer_phone}</span>
            <a
              href={`https://wa.me/${lead.customer_phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 mr-1"
              onClick={(e) => e.stopPropagation()}
              title="Open WhatsApp"
            >
              💬
            </a>
          </div>
        )}
        {lead.customer_email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate" dir="ltr">{lead.customer_email}</span>
          </div>
        )}
        {lead.notes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mt-0.5" />
            <span className="line-clamp-2">{lead.notes}</span>
          </div>
        )}
        
        {/* Quote Actions */}
        {quote ? (
          <div className="flex gap-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewQuote?.(lead.id);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Quote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onUnlinkQuote?.(lead.id);
              }}
              title="Unlink Quote"
            >
              <Unlink className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          onCreateQuote && canCreateQuote && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onCreateQuote(lead);
              }}
            >
              <FileText className="h-3 w-3 mr-1" />
              Create Quote
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
