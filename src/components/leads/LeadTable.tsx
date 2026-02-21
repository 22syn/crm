import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Edit, MoreHorizontal, FileText, Phone, Mail, Eye, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { Database } from "@/integrations/supabase/types";
import type { CrmTeamMember } from "@/hooks/useCrmTeam";
import { getSourceConfig } from "@/utils/sourceIcons";
import {
  sortLeads,
  parseSortOption,
  toSortOption,
  type SortField,
  type SortDirection,
  type SortOption,
} from "@/utils/leadSort";
import { StatusPill, LEAD_STATUS_OPTIONS } from "./StatusPill";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type InlineEditField = "customer_name" | "customer_phone" | "customer_email";

interface LeadTableProps {
  leads: Lead[];
  teamMembers?: CrmTeamMember[];
  onEdit: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onAssigneeChange?: (leadId: string, userId: string | null) => void;
  onInlineUpdate?: (leadId: string, field: InlineEditField, value: string | null) => void;
  savingCell?: { leadId: string; field: string } | null;
  selectedLeadIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onCreateQuote?: (lead: Lead) => void;
  leadQuotes?: Record<string, Quote>;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
  /** Sort controlled from toolbar */
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
}

export function LeadTable({
  leads,
  teamMembers = [],
  onEdit,
  onViewLead,
  onStatusChange,
  onAssigneeChange,
  onInlineUpdate,
  savingCell,
  selectedLeadIds = new Set(),
  onSelectionChange,
  onCreateQuote,
  leadQuotes = {},
  onViewQuote,
  onUnlinkQuote,
  sortOption,
  onSortOptionChange,
}: LeadTableProps) {
  const { field: sortField, direction: sortDirection } = parseSortOption(sortOption);
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: InlineEditField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell) inputRef.current?.focus();
  }, [editingCell]);

  const handleStartEdit = useCallback((lead: Lead, field: InlineEditField) => {
    const val = lead[field];
    setEditingCell({ leadId: lead.id, field });
    setEditValue(typeof val === "string" ? val : "");
  }, []);

  const handleCommitEdit = useCallback(() => {
    if (!editingCell || !onInlineUpdate) return;
    const trimmed = editValue.trim();
    onInlineUpdate(editingCell.leadId, editingCell.field, trimmed || null);
    setEditingCell(null);
  }, [editingCell, editValue, onInlineUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, leadId: string, field: InlineEditField) => {
    if (e.key === "Enter") { e.preventDefault(); handleCommitEdit(); }
    if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
  }, [handleCommitEdit]);

  const handleHeaderSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      onSortOptionChange(toSortOption(f, sortDirection === "asc" ? "desc" : "asc"));
    } else {
      onSortOptionChange(toSortOption(f, "asc"));
    }
  };

  const sortedLeads = sortLeads(leads, sortField, sortDirection, LEAD_STATUS_OPTIONS);
  const canCreateQuote = (lead: Lead) =>
    !["done", "not_done", "waiting_for_approval"].includes(lead.status) && !leadQuotes[lead.id];

  const columns: DataTableColumn<Lead>[] = useMemo(() => [
    {
      id: "customer_name",
      header: "Customer",
      sortable: true,
      sortKey: "customer_name",
      minWidth: "160px",
      render: (lead) => {
        if (onInlineUpdate && editingCell?.leadId === lead.id && editingCell?.field === "customer_name") {
          return (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => handleKeyDown(e, lead.id, "customer_name")}
                className="h-8 text-body rounded-sm"
              />
              {savingCell?.leadId === lead.id && savingCell?.field === "customer_name" && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              )}
            </div>
          );
        }
        return (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`${onInlineUpdate || onViewLead ? "cursor-pointer rounded px-1 -mx-1 hover:bg-muted/80 min-h-[32px] flex flex-col justify-center" : ""} ${onViewLead ? "hover:underline" : ""}`}
                  onClick={onInlineUpdate ? () => handleStartEdit(lead, "customer_name") : onViewLead ? () => onViewLead(lead) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{lead.customer_name}</span>
                  </div>
                  {lead.customer_address && (
                    <div className="text-meta text-muted-foreground">{lead.customer_address}</div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">{onViewLead ? "View lead" : "Click to edit"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      render: (lead) => (
        <div className="flex flex-col gap-1">
          {onInlineUpdate && editingCell?.leadId === lead.id && editingCell?.field === "customer_phone" ? (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0" />
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => handleKeyDown(e, lead.id, "customer_phone")}
                className="h-8 text-body"
                dir="ltr"
              />
            </div>
          ) : (
            <div
              className={onInlineUpdate ? "flex items-center gap-2 text-body cursor-pointer rounded px-1 -mx-1 hover:bg-muted/80 min-h-[32px]" : "flex items-center gap-2 text-body"}
              onClick={onInlineUpdate ? () => handleStartEdit(lead, "customer_phone") : undefined}
            >
              {lead.customer_phone ? (
                <>
                  <Phone className="h-3 w-3 shrink-0" />
                  <span dir="ltr">{lead.customer_phone}</span>
                  <a href={`https://wa.me/${lead.customer_phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700" onClick={(e) => e.stopPropagation()}>💬</a>
                </>
              ) : (
                <span className="text-muted-foreground italic">{onInlineUpdate ? "Add phone" : "—"}</span>
              )}
            </div>
          )}
          {onInlineUpdate && editingCell?.leadId === lead.id && editingCell?.field === "customer_email" ? (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" />
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => handleKeyDown(e, lead.id, "customer_email")}
                className="h-8 text-body"
                dir="ltr"
              />
            </div>
          ) : (
            <div
              className={onInlineUpdate ? "flex items-center gap-2 text-body text-muted-foreground cursor-pointer rounded px-1 -mx-1 hover:bg-muted/80 min-h-[32px]" : "flex items-center gap-2 text-body text-muted-foreground"}
              onClick={onInlineUpdate ? () => handleStartEdit(lead, "customer_email") : undefined}
            >
              {lead.customer_email ? (
                <><Mail className="h-3 w-3 shrink-0" /><span dir="ltr">{lead.customer_email}</span></>
              ) : (
                <span className={onInlineUpdate ? "italic" : ""}>{onInlineUpdate ? "Add email" : "—"}</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "source",
      header: "Source",
      sortable: true,
      sortKey: "source",
      render: (lead) => {
        const { label, Icon } = getSourceConfig(lead.source);
        return (
          <Badge variant="outline">
            <span className="flex items-center gap-1"><Icon className="h-3 w-3" /><span>{label}</span></span>
          </Badge>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      render: (lead) => <StatusPill leadId={lead.id} status={lead.status} onStatusChange={onStatusChange} />,
    },
    {
      id: "assigned_to",
      header: "Assigned to",
      render: (lead) =>
        onAssigneeChange && teamMembers.length > 0 ? (
          <div className="flex items-center gap-1 min-w-[140px]">
            <Select
              value={lead.assigned_to ?? "unassigned"}
              onValueChange={(v) => onAssigneeChange(lead.id, v === "unassigned" ? null : v)}
              disabled={savingCell?.leadId === lead.id && savingCell?.field === "assigned_to"}
            >
              <SelectTrigger className="h-8 text-body rounded-sm"><SelectValue placeholder="Assign..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email || m.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingCell?.leadId === lead.id && savingCell?.field === "assigned_to" && (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            )}
          </div>
        ) : (
          lead.assigned_to ? (teamMembers.find((m) => m.user_id === lead.assigned_to)?.full_name || "—") : "—"
        ),
    },
    {
      id: "quote",
      header: "Quote",
      render: (lead) => {
        const quote = leadQuotes[lead.id];
        return quote ? (
          <button type="button" onClick={() => onViewQuote?.(lead.id)} className="text-left hover:underline font-mono text-sm">
            {quote.quote_number} ₪{quote.total.toLocaleString()}
          </button>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        );
      },
    },
    {
      id: "meeting_date",
      header: "Meeting Date",
      sortable: true,
      sortKey: "meeting_date",
      render: (lead) => lead.meeting_date ? format(new Date(lead.meeting_date), "dd/MM/yyyy") : "—",
    },
    {
      id: "created_at",
      header: "Created",
      sortable: true,
      sortKey: "created_at",
      render: (lead) => <span className="text-sm text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yyyy")}</span>,
    },
    {
      id: "days_since_created",
      header: "Days",
      sortable: true,
      sortKey: "days_since_created",
      render: (lead) => (
        <span className="text-sm text-muted-foreground">
          {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000)}
        </span>
      ),
    },
  ], [editingCell, editValue, savingCell, leadQuotes, teamMembers, onInlineUpdate, onViewLead, onAssigneeChange, onViewQuote, handleStartEdit, handleCommitEdit, handleKeyDown]);

  return (
    <DataTable<Lead>
      columns={columns}
      data={sortedLeads}
      getRowId={(l) => l.id}
      emptyMessage="No leads found"
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      enableSelection={!!onSelectionChange}
      selectedIds={selectedLeadIds}
      onSelectionChange={onSelectionChange}
      renderActions={(lead) => {
        const quote = leadQuotes[lead.id];
        return (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-9 w-9 min-w-[44px] min-h-[44px] md:h-8 md:w-8" onClick={() => onEdit(lead)} aria-label="Edit lead">
              <Edit className="h-4 w-4" />
            </Button>
            {onCreateQuote && canCreateQuote(lead) && (
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => onCreateQuote(lead)} aria-label="Create quote">
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {quote && onViewQuote && (
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => onViewQuote(lead.id)} aria-label="View quote">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(lead)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                {onCreateQuote && canCreateQuote(lead) && (
                  <DropdownMenuItem onClick={() => onCreateQuote(lead)}><FileText className="h-4 w-4 mr-2" />Create Quote</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }}
    />
  );
}
