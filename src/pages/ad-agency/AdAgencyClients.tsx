import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDialog } from "@/components/ad-agency/ClientDialog";
import { ClientTable } from "@/components/ad-agency/ClientTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;

export default function AdAgencyClients() {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<OpClient | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["op_clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_clients").select("*").order("name");
      if (error) throw error;
      return data as OpClient[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<OpClient> & { name: string }) => {
      const { error } = await supabase.from("op_clients").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_clients"] });
      toast({ title: "לקוח נוסף בהצלחה" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "שגיאה בהוספת לקוח", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OpClient> }) => {
      const { error } = await supabase.from("op_clients").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_clients"] });
      toast({ title: "לקוח עודכן בהצלחה" });
      setDialogOpen(false);
      setSelectedClient(null);
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון לקוח", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_clients"] });
      toast({ title: "לקוח נמחק בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת לקוח", variant: "destructive" });
    },
  });

  const handleSave = (data: Partial<OpClient> & { name: string }) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: OpClient) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleDelete = (client: OpClient) => {
    if (confirm(`האם למחוק את הלקוח "${client.name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = role === "admin";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold">לקוחות</h1>
            <p className="text-muted-foreground">לקוחות משרד הפרסום</p>
          </div>
          <Button onClick={() => { setSelectedClient(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            הוסף לקוח
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>רשימת לקוחות</CardTitle>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">לא נמצאו לקוחות</div>
            ) : (
              <ClientTable
                clients={filteredClients}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>

        <ClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={selectedClient}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}
