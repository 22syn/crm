import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityToolbar } from "@/components/entity-page";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { SupplierFilters } from "@/components/suppliers/SupplierFilters";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Supplier = Tables<"suppliers">;

export default function Suppliers() {
  const { isModuleAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", showActiveOnly],
    queryFn: async () => {
      let query = supabase.from("suppliers").select("*").order("name");
      if (showActiveOnly) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; category: "sofas" | "cabinets" | "chairs" | "tables"; contact_name: string; phone: string; email?: string; address?: string; notes?: string; is_active: boolean }) => {
      const { error } = await supabase.from("suppliers").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier created successfully" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error creating supplier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Supplier> }) => {
      const { error } = await supabase.from("suppliers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier updated successfully" });
      setDialogOpen(false);
      setSelectedSupplier(null);
    },
    onError: () => {
      toast({ title: "Error updating supplier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Supplier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error deleting supplier", variant: "destructive" });
    },
  });

  const handleSave = (data: { name: string; category: "sofas" | "cabinets" | "chairs" | "tables"; contact_name: string; phone: string; email?: string; address?: string; notes?: string; is_active: boolean }) => {
    if (selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = isModuleAdmin("system");
  const hasActiveFilters = !!searchQuery.trim() || !showActiveOnly;
  const handleClearFilters = () => {
    setSearchQuery("");
    setShowActiveOnly(true);
  };

  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("suppliers");
  const SUPPLIER_COLUMNS = [
    { id: "name", header: "Name" },
    { id: "category", header: "Category" },
    { id: "contact", header: "Contact" },
    { id: "contact_details", header: "Contact Details" },
    { id: "status", header: "Status" },
  ];

  const supplierToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <SupplierFilters
          variant="searchOnly"
          search={searchQuery}
          onSearchChange={setSearchQuery}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
        />
      }
      renderMobileFilters={
        <SupplierFilters
          variant="filtersOnly"
          search={searchQuery}
          onSearchChange={setSearchQuery}
          showActiveOnly={showActiveOnly}
          onShowActiveOnlyChange={setShowActiveOnly}
        />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={SUPPLIER_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
          columnsLabel="Columns"
          resetLabel="Reset to default"
        />
      }
    >
      <SupplierFilters
        search={searchQuery}
        onSearchChange={setSearchQuery}
        showActiveOnly={showActiveOnly}
        onShowActiveOnlyChange={setShowActiveOnly}
      />
    </EntityToolbar>
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground mt-2">Manage suppliers and business partners</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setSelectedSupplier(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Supplier
            </Button>
          )}
        </div>

        {supplierToolbar}

        <Card>
          <CardHeader>
            <CardTitle>Supplier List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <SupplierTable
                suppliers={filteredSuppliers}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                visibleColumnIds={visibleColumnIds}
              />
            )}
          </CardContent>
        </Card>

        <SupplierDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          supplier={selectedSupplier}
          onSave={handleSave}
        />
    </div>
  );
}
