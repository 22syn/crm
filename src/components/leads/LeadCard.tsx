import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MessageSquare, GripVertical, FileText, Calendar, Eye, User, Flame, Thermometer, Snowflake, Clock, Banknote } from "lucide-react";
import { getLeadPriority, getDaysSinceTouch, getStalenessLevel, type LeadPriority } from "@/utils/leadScore";
import { getSourceConfig } from "@/utils/sourceIcons";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; icon: typeof Flame; className: string }> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400" },
  warm: { label: "Warm", icon: Thermometer, className: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400" },
};

interface LeadCardProps {
  lead: Lead;
  teamMembers?: CrmTeamMember[];
  onEdit: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onCreateQuote?: (lead: Lead) => void;
  quote?: Quote;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
}

export function LeadCard({ lead, teamMembers = [], onEdit, onViewLead, onCreateQuote, quote, onViewQuote, onUnlinkQuote }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  // Only apply transform when dragging to avoid layout/overlap issues when idle
  const style: React.CSSProperties = isDragging
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: 0.5,
      }
    : {};

  // Hide create quote button for done/not_done/waiting_for_approval statuses or if quote exists
  const canCreateQuote = !["done", "not_done", "waiting_for_approval"].includes(lead.status) && !quote;

  const priority = getLeadPriority(lead);
  const daysSinceTouch = getDaysSinceTouch(lead);
  const staleness = getStalenessLevel(lead);
  const priorityConfig = PRIORITY_CONFIG[priority];
  const PriorityIcon = priorityConfig.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-sm cursor-grab active:cursor-grabbing transition-shadow duration-200 ease-out shadow-sm hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card motion-reduce:transition-none"
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
              {onViewLead ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onViewLead(lead); }}
                  className="text-left hover:underline focus:underline focus:outline-none"
                >
                  {lead.customer_name}
                </button>
              ) : (
                lead.customer_name
              )}
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
        <div className="flex flex-wrap gap-1.5 ml-6">
          <Badge variant="outline" className={`w-fit text-xs ${priorityConfig.className}`}>
            <PriorityIcon className="h-3 w-3 mr-1" />
            {priorityConfig.label}
          </Badge>
          <Badge variant="outline" className="w-fit text-xs">
            {(() => {
              const { label, Icon } = getSourceConfig(lead.source);
              return (
                <span className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </span>
              );
            })()}
          </Badge>
          {staleness !== "fresh" && daysSinceTouch > 0 && (
            <Badge variant="outline" className="w-fit text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {daysSinceTouch}d
            </Badge>
          )}
        </div>
        {lead.assigned_to && (
          <div className="flex items-center gap-1 text-meta text-muted-foreground mt-1 ml-6">
            <User className="h-3 w-3" />
            <span>{teamMembers.find((m) => m.user_id === lead.assigned_to)?.full_name || teamMembers.find((m) => m.user_id === lead.assigned_to)?.email || "Assigned"}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {quote && (
          <div className="flex items-center gap-2 text-xs font-medium text-accent-action">
            <Banknote className="h-3 w-3" />
            <span>₪{quote.total.toLocaleString("he-IL")}</span>
          </div>
        )}
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
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewQuote?.(lead.id);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Quote
          </Button>
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
