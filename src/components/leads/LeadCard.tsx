import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, MessageSquare, GripVertical, FileText, Calendar, Eye, User, Flame, Thermometer, Snowflake, Clock, Banknote } from "lucide-react";
import { getLeadPriority, getDaysSinceTouch, getStalenessLevel, type LeadPriority } from "@/utils/leadScore";
import { getSourceConfig } from "@/utils/sourceIcons";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; icon: typeof Flame; className: string; pillClass: string }> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400", pillClass: "bg-orange-500/25 text-orange-400 border-0" },
  warm: { label: "Warm", icon: Thermometer, className: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400", pillClass: "bg-amber-500/25 text-amber-400 border-0" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400", pillClass: "bg-sky-500/25 text-sky-400 border-0" },
};

interface LeadCardProps {
  lead: Lead;
  /** O(1) lookup by user_id for assignee display */
  membersByUserId?: Map<string, CrmTeamMember>;
  onEdit: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onCreateQuote?: (lead: Lead) => void;
  quote?: Quote;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
  /** Hadarya Dark Kanban v2: dark card, value prominent, "Updated X ago" */
  variant?: "default" | "stitch-dark";
}

export function LeadCard({ lead, membersByUserId, onEdit, onViewLead, onCreateQuote, quote, onViewQuote, onUnlinkQuote, variant = "default" }: LeadCardProps) {
  const { role } = useAuth();
  const hidePhone = role === "sales";
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
  const isDark = variant === "stitch-dark";
  const updatedAt = lead.updated_at || lead.created_at;
  const assignee = lead.assigned_to ? membersByUserId?.get(lead.assigned_to) : null;
  const initials = assignee?.full_name
    ? assignee.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : assignee?.email?.[0]?.toUpperCase() ?? "?";

  if (isDark) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-xl cursor-grab active:cursor-grabbing bg-[#151938] border-white/10 shadow-md hover:border-accent-action/40 focus-within:ring-2 focus-within:ring-accent-action focus-within:ring-offset-2 focus-within:ring-offset-[#0f1025] motion-reduce:transition-none"
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white/80 shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold text-white truncate block">
                  {onViewLead ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewLead(lead);
                      }}
                      className="text-left hover:underline focus:underline focus:outline-none"
                    >
                      {lead.customer_name}
                    </button>
                  ) : (
                    lead.customer_name
                  )}
                </CardTitle>
                <div className="text-sm font-medium text-accent-action mt-0.5">
                  {quote ? (
                    <span>₪{quote.total.toLocaleString("he-IL")}</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
              </div>
            </div>
            <Badge className={`text-[10px] uppercase tracking-wide shrink-0 ${priorityConfig.pillClass}`}>
              {priorityConfig.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-white/50 hover:text-white/80"
              onClick={() => onEdit(lead)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 ml-6">
            {assignee && (
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-accent-action/30 flex items-center justify-center text-[10px] font-medium text-white shrink-0">
                  {initials}
                </div>
                <span className="text-xs text-white/70 truncate max-w-[80px]">
                  {assignee.full_name || assignee.email}
                </span>
              </div>
            )}
            <span className="text-[11px] text-white/50">
              Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {quote ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs bg-white/5 border-white/15 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onViewQuote?.(lead.id);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Quote
            </Button>
          ) : (
            onCreateQuote &&
            canCreateQuote && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs bg-white/5 border-white/15 hover:bg-white/10"
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:border-accent-action/30 focus-within:ring-2 focus-within:ring-accent-action focus-within:ring-offset-2 motion-reduce:transition-none"
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
            <span>
              {(() => {
                const assignee = membersByUserId?.get(lead.assigned_to!);
                return assignee?.full_name || assignee?.email || "Assigned";
              })()}
            </span>
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
            {hidePhone ? (
              <>
                <a
                  href={`tel:${lead.customer_phone.replace(/[^0-9]/g, "")}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                  title="חייג"
                >
                  חייג
                </a>
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
              </>
            ) : (
              <>
                <span dir="ltr">{lead.customer_phone}</span>
                <a
                  href={`tel:${lead.customer_phone.replace(/[^0-9]/g, "")}`}
                  className="text-primary hover:underline mr-1"
                  onClick={(e) => e.stopPropagation()}
                  title="חייג"
                >
                  חייג
                </a>
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
              </>
            )}
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
