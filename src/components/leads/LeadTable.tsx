import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, MoreHorizontal, FileText, Phone, Mail, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onCreateQuote?: (lead: Lead) => void;
  leadQuotes?: Record<string, Quote>;
  onViewQuote?: (leadId: string) => void;
  onUnlinkQuote?: (leadId: string) => void;
}

type SortField = "customer_name" | "source" | "status" | "meeting_date" | "created_at";
type SortDirection = "asc" | "desc";

const sourceLabels: Record<string, { label: string; icon: string }> = {
  instagram: { label: "Instagram", icon: "📷" },
  website: { label: "Website", icon: "🌐" },
  architects: { label: "Architects", icon: "🏛️" },
  organic: { label: "Organic", icon: "🌱" },
  facebook: { label: "Facebook", icon: "📘" },
};

const statusOptions: { value: LeadStatus; label: string; color: string; order: number }[] = [
  { value: "new", label: "0 - New", color: "bg-blue-500", order: 0 },
  { value: "in_process", label: "1 - In Process", color: "bg-yellow-500", order: 1 },
  { value: "meeting_scheduled", label: "2 - Meeting Scheduled", color: "bg-purple-500", order: 2 },
  { value: "meeting_done", label: "2.5 - Meeting Done", color: "bg-indigo-500", order: 3 },
  { value: "waiting_for_approval", label: "3 - Waiting for Approval", color: "bg-orange-500", order: 4 },
  { value: "done", label: "4 - Done", color: "bg-green-500", order: 5 },
  { value: "not_done", label: "Not Done", color: "bg-red-500", order: 6 },
];

export function LeadTable({ leads, onEdit, onStatusChange, onCreateQuote, leadQuotes = {}, onViewQuote, onUnlinkQuote }: LeadTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "customer_name":
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case "source":
        comparison = a.source.localeCompare(b.source);
        break;
      case "status":
        const aOrder = statusOptions.find(s => s.value === a.status)?.order ?? 0;
        const bOrder = statusOptions.find(s => s.value === b.status)?.order ?? 0;
        comparison = aOrder - bOrder;
        break;
      case "meeting_date":
        const aDate = a.meeting_date ? new Date(a.meeting_date).getTime() : 0;
        const bDate = b.meeting_date ? new Date(b.meeting_date).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case "created_at":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const getStatusBadge = (status: LeadStatus) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        <span className={`w-2 h-2 rounded-full ${statusOption?.color} mr-2`} />
        {statusOption?.label || status}
      </Badge>
    );
  };

  const canCreateQuote = (lead: Lead) => 
    !["done", "not_done", "waiting_for_approval"].includes(lead.status) && !leadQuotes[lead.id];

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => handleSort("customer_name")}
              >
                Customer
                {getSortIcon("customer_name")}
              </Button>
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => handleSort("source")}
              >
                Source
                {getSortIcon("source")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => handleSort("status")}
              >
                Status
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead>Quote</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => handleSort("meeting_date")}
              >
                Meeting Date
                {getSortIcon("meeting_date")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent"
                onClick={() => handleSort("created_at")}
              >
                Created
                {getSortIcon("created_at")}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            sortedLeads.map((lead) => {
              const quote = leadQuotes[lead.id];
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{lead.customer_name}</div>
                    {lead.customer_address && (
                      <div className="text-xs text-muted-foreground">{lead.customer_address}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {lead.customer_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          <span dir="ltr">{lead.customer_phone}</span>
                          <a
                            href={`https://wa.me/${lead.customer_phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            💬
                          </a>
                        </div>
                      )}
                      {lead.customer_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span dir="ltr">{lead.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <span className="flex items-center gap-1">
                        <span>{sourceLabels[lead.source]?.icon || "📌"}</span>
                        <span>{sourceLabels[lead.source]?.label || lead.source}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value: LeadStatus) => onStatusChange(lead.id, value)}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue>
                          {getStatusBadge(lead.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${option.color}`} />
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {quote ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {quote.quote_number}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onViewQuote?.(lead.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.meeting_date ? (
                      <span className="text-sm">
                        {format(new Date(lead.meeting_date), "dd/MM/yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "dd/MM/yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(lead)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {onCreateQuote && canCreateQuote(lead) && (
                          <DropdownMenuItem onClick={() => onCreateQuote(lead)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Create Quote
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
