import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityToolbar } from "@/components/entity-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDialog } from "@/components/ad-agency/ClientDialog";
import { ClientFilters } from "@/components/ad-agency/ClientFilters";
import { ClientTable } from "@/components/ad-agency/ClientTable";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpClient = Tables<"op_clients">;

export default function AdAgencyClients() {
  const { isModuleAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
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

  const handleSetActive = (client: OpClient, isActive: boolean) => {
    updateMutation.mutate({ id: client.id, data: { is_active: isActive } });
  };

  const filteredClients = clients.filter((c) => {
    const matchSearch =
      !searchQuery.trim() ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = c.is_active ?? true;
    const matchActive =
      activeFilter === "all" ||
      (activeFilter === "active" && isActive) ||
      (activeFilter === "inactive" && !isActive);
    return matchSearch && matchActive;
  });

  const isAdmin = isModuleAdmin("ad_agency");
  const hasActiveFilters = !!searchQuery.trim() || activeFilter !== "all";
  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };

  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("ad-agency-clients");

  const CLIENT_COLUMNS = [
    { id: "name", header: "שם" },
    { id: "status", header: "סטטוס" },
    { id: "contact_name", header: "איש קשר" },
    { id: "contact_phone", header: "טלפון איש קשר" },
    { id: "phone", header: "טלפון" },
    { id: "email", header: "אימייל" },
    { id: "address", header: "כתובת" },
    { id: "payment_terms", header: "תנאי תשלום" },
  ];

  const clientToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <ClientFilters
          variant="searchOnly"
          search={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
        />
      }
      renderMobileFilters={
        <ClientFilters
          variant="filtersOnly"
          search={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
        />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={CLIENT_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
        />
      }
    >
      <ClientFilters
        search={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
      />
    </EntityToolbar>
  );

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-display font-semibold">לקוחות</h1>
            <p className="text-muted-foreground">לקוחות משרד הפרסום</p>
          </div>
          <Button onClick={() => { setSelectedClient(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            הוסף לקוח
          </Button>
        </div>

        {clientToolbar}

        <Card>
          <CardHeader>
            <CardTitle>רשימת לקוחות</CardTitle>
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
                onSetActive={handleSetActive}
                visibleColumnIds={visibleColumnIds}
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
  );
}
