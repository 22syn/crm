import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadComments } from "@/components/leads/LeadComments";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { Loader2, ArrowLeft, Pencil, FileText, Eye, Unlink, Phone, Mail, MapPin, Calendar, User } from "lucide-react";
import { getSourceConfig } from "@/utils/sourceIcons";
import { getStageConfig } from "@/utils/leadStages";
import { useCrmTeam } from "@/hooks/useCrmTeam";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type Quote = Database["public"]["Tables"]["quotes"]["Row"];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: teamMembers = [], membersByUserId } = useCrmTeam();
  const [editOpen, setEditOpen] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });

  const { data: quote } = useQuery<Quote | null>({
    queryKey: ["lead-quote", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("lead_id", id)
        .is("archived_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<LeadInsert>) => {
      if (!id) throw new Error("No lead id");
      const { id: _id, ...rest } = data as LeadInsert & { id?: string };
      const { error } = await supabase.from("leads").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditOpen(false);
    },
  });

  if (!id) return null;
  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stageConfig = getStageConfig(lead.status);
  const assignee = lead.assigned_to ? membersByUserId.get(lead.assigned_to) : null;

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/leads")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold hidden md:block">{lead.customer_name}</h1>
            <p className="text-base font-medium md:hidden truncate">{lead.customer_name}</p>
            <p className="text-sm text-muted-foreground mt-1 hidden md:block">
              Created {format(new Date(lead.created_at), "MMM d, yyyy")} · ID {lead.id.slice(0, 8)}
            </p>
          </div>
          <Button onClick={() => setEditOpen(true)} className="gap-2 shrink-0 md:ml-auto">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`https://wa.me/${lead.customer_phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    {lead.customer_phone}
                  </a>
                </div>
              )}
              {lead.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.customer_email}</span>
                </div>
              )}
              {lead.customer_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.customer_address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline" className="gap-1">
                  {(() => {
                    const { label, Icon } = getSourceConfig(lead.source);
                    return <><Icon className="h-3 w-3" />{label}</>;
                  })()}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Status</span>
                {stageConfig && (
                  <Badge variant="outline" className="gap-1">
                    <span className={`w-2 h-2 rounded-full ${stageConfig.color}`} />
                    {stageConfig.label}
                  </Badge>
                )}
              </div>
              {lead.meeting_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Meeting: {format(new Date(lead.meeting_date), "MMM d, yyyy")}</span>
                </div>
              )}
              {assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{assignee.full_name || assignee.email}</span>
                </div>
              )}
              {lead.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              {quote ? (
                <div className="flex items-center justify-between">
                  <span>{quote.quote_number} — ₪{quote.total.toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => navigate("/contracts")}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contract yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <LeadComments leadId={lead.id} />
          </CardContent>
        </Card>
      </div>

      <LeadDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSave={(data) => updateMutation.mutate({ ...data, id: lead.id } as LeadInsert)}
        isLoading={updateMutation.isPending}
        teamMembers={teamMembers}
      />
    </>
  );
}
