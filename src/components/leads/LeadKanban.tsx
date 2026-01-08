import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Phone, Mail, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadKanbanProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "bg-blue-500" },
  { status: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { status: "qualified", label: "Qualified", color: "bg-purple-500" },
  { status: "quoted", label: "Quoted", color: "bg-orange-500" },
  { status: "won", label: "Won", color: "bg-green-500" },
  { status: "lost", label: "Lost", color: "bg-red-500" },
];

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  manual: "Manual",
  walkin: "Walk-in",
  website: "Website",
  referral: "Referral",
};

export function LeadKanban({ leads, isLoading, onEdit, onStatusChange }: LeadKanbanProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusColumns.map((col) => (
          <div key={col.status} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const getLeadsByStatus = (status: LeadStatus) => 
    leads.filter((lead) => lead.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
      {statusColumns.map((column) => {
        const columnLeads = getLeadsByStatus(column.status);
        
        return (
          <div key={column.status} className="min-w-[250px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-3 w-3 rounded-full ${column.color}`} />
              <h3 className="font-medium">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnLeads.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {columnLeads.map((lead) => (
                <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">
                        {lead.customer_name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onEdit(lead)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs">
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
                  </CardContent>
                </Card>
              ))}

              {columnLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
