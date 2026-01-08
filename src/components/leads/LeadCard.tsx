import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MessageSquare, GripVertical, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  manual: "Manual",
  walkin: "Walk-in",
  website: "Website",
  referral: "Referral",
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onCreateQuote?: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit, onCreateQuote }: LeadCardProps) {
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
          {sourceLabels[lead.source] || lead.source}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {lead.customer_phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.customer_phone}</span>
          </div>
        )}
        {lead.customer_email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.customer_email}</span>
          </div>
        )}
        {lead.notes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 mt-0.5" />
            <span className="line-clamp-2">{lead.notes}</span>
          </div>
        )}
        {onCreateQuote && lead.status !== "won" && lead.status !== "lost" && lead.status !== "quoted" && (
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
            צור הצעת מחיר
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
