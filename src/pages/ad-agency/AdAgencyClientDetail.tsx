import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Plus, Phone, Mail, MapPin, User, CreditCard } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;
type OpProject = Tables<"op_projects">;

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  waiting_for_approval: "ממתין לאישור",
  planning: "תכנון",
  execution: "ביצוע",
  collection: "גבייה",
  completed: "הושלם",
  cancelled: "בוטל",
};

export default function AdAgencyClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ["op_client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data as OpClient;
    },
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["op_projects", "client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OpProject[];
    },
    enabled: !!id,
  });

  if (!id) return null;
  if (isLoading || !client) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ad-agency/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזרה ללקוחות
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{client.name}</CardTitle>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </a>
              )}
              {client.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {client.address}
                </span>
              )}
              {client.contact_name && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {client.contact_name}
                  {client.contact_phone && ` • ${client.contact_phone}`}
                </span>
              )}
              {(client as { payment_terms?: string | null }).payment_terms && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  תנאי תשלום: {(client as { payment_terms: string }).payment_terms}
                </span>
              )}
            </div>
            {client.notes && (
              <p className="mt-2 text-sm text-muted-foreground">{client.notes}</p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>פרויקטים</CardTitle>
              <Button
                onClick={() => navigate("/ad-agency/projects", { state: { clientId: id, clientName: client.name } })}
              >
                <Plus className="h-4 w-4 mr-2" />
                פרויקט חדש
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">אין פרויקטים</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם פרויקט</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>צפי הכנסה</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link to={`/ad-agency/projects/${p.id}`} className="text-primary hover:underline">
                          {p.title}
                        </Link>
                      </TableCell>
                      <TableCell>{STATUS_LABELS[p.status] ?? p.status}</TableCell>
                      <TableCell>{p.budget_approved != null ? `₪${Number(p.budget_approved).toLocaleString("he-IL")}` : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/ad-agency/projects/${p.id}`}>צפייה</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
