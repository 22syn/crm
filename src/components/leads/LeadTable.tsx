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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, MoreHorizontal, FileText, Phone, Mail } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onCreateQuote?: (lead: Lead) => void;
}

const sourceLabels: Record<string, { label: string; icon: string }> = {
  instagram: { label: "Instagram", icon: "📷" },
  website: { label: "Website", icon: "🌐" },
  architects: { label: "Architects", icon: "🏛️" },
  organic: { label: "Organic", icon: "🌱" },
  facebook: { label: "Facebook", icon: "📘" },
};

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "0 - New", color: "bg-blue-500" },
  { value: "in_process", label: "1 - In Process", color: "bg-yellow-500" },
  { value: "meeting_scheduled", label: "2 - Meeting Scheduled", color: "bg-purple-500" },
  { value: "meeting_done", label: "2.5 - Meeting Done", color: "bg-indigo-500" },
  { value: "waiting_for_approval", label: "3 - Waiting for Approval", color: "bg-orange-500" },
  { value: "done", label: "4 - Done", color: "bg-green-500" },
  { value: "not_done", label: "Not Done", color: "bg-red-500" },
];

export function LeadTable({ leads, onEdit, onStatusChange, onCreateQuote }: LeadTableProps) {
  const getStatusBadge = (status: LeadStatus) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        <span className={`w-2 h-2 rounded-full ${statusOption?.color} mr-2`} />
        {statusOption?.label || status}
      </Badge>
    );
  };

  const canCreateQuote = (status: LeadStatus) => 
    !["done", "not_done", "waiting_for_approval"].includes(status);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Meeting Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
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
                      {onCreateQuote && canCreateQuote(lead.status) && (
                        <DropdownMenuItem onClick={() => onCreateQuote(lead)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Create Quote
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
