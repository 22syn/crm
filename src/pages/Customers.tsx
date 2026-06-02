import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { escapeIlike } from "@/lib/escapeIlike";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityToolbar } from "@/components/entity-page";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { toast } from "sonner";
import { Plus, Loader2, Users, ChevronRight, ChevronLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CustomerStatus = Database["public"]["Enums"]["customer_status"];

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
}

const STATUS_OPTIONS: { value: CustomerStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "closed", label: "Closed", color: "bg-green-500" },
  { value: "returning", label: "Returning", color: "bg-purple-500" },
];

export default function Customers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");

  // Pagination State
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Debounce search (300ms) to reduce request churn while typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("new");

  const handleSearchChange = (val: string) => setSearchInput(val);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers", page, searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchQuery) {
        const escaped = escapeIlike(searchQuery);
        query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data as Customer[],
        count: count || 0
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const customers = customersData?.data || [];
  const totalCount = customersData?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const saveMutation = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const customerData = {
        name,
        email,
        phone,
        address: address || null,
        notes: notes || null,
        status,
      };

      if (isEdit && editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customers")
          .insert(customerData);
        if (error) throw error;
      }
    },
    onSuccess: (_, isEdit) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(isEdit ? "Customer updated successfully" : "Customer added successfully");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Error saving: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setStatus("new");
    setEditingCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setAddress(customer.address || "");
    setNotes(customer.notes || "");
    setStatus(customer.status);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const isFormValid = name && phone && email;

  const hasActiveFilters = statusFilter !== "all" || !!searchQuery;
  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchInput("");
    setSearchQuery("");
  };

  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("customers");
  const CUSTOMER_COLUMNS = [
    { id: "client_name", header: "Client Name" },
    { id: "phone", header: "Phone" },
    { id: "email", header: "Email" },
    { id: "status", header: "Status" },
    { id: "address", header: "Address" },
    { id: "created_at", header: "Added" },
  ];

  const customerToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <CustomerFilters
          variant="searchOnly"
          search={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      }
      renderMobileFilters={
        <CustomerFilters
          variant="filtersOnly"
          search={searchInput}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={CUSTOMER_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
          columnsLabel="Columns"
          resetLabel="Reset to default"
        />
      }
    >
      <CustomerFilters
        search={searchInput}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </EntityToolbar>
  );

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero — Stitch: Client Directory + subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Client Directory</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Manage and monitor your long-term client relationships and lifetime value contribution.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2 rounded-lg">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "Edit Customer" : "New Customer"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+972..."
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={status} onValueChange={(val: CustomerStatus) => setStatus(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${option.color}`} />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => saveMutation.mutate(!!editingCustomer)}
                  disabled={!isFormValid || saveMutation.isPending}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {customerToolbar}

      {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-card">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No contacts yet</h3>
            <p className="text-muted-foreground mt-1">Add your first customer to get started</p>
            <Button variant="accent" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        ) : (
          <CustomerTable
            customers={customers}
            onEdit={openEditDialog}
            onDelete={(customer) => deleteMutation.mutate(customer.id)}
            visibleColumnIds={visibleColumnIds}
            renderFooter={
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded border"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {totalPages > 0 &&
                    Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        totalPages <= 5
                          ? i
                          : page < 2
                            ? i
                            : page > totalPages - 3
                              ? totalPages - 5 + i
                              : page - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "ghost"}
                          size="sm"
                          className={`rounded px-3 py-1 text-sm ${page === pageNum ? "font-bold" : "font-medium"}`}
                          onClick={() => setPage(pageNum)}
                          disabled={isLoading}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-muted-foreground">...</span>
                      <Button
                        variant={page === totalPages - 1 ? "default" : "ghost"}
                        size="sm"
                        className="rounded px-3 py-1 text-sm font-medium"
                        onClick={() => setPage(totalPages - 1)}
                        disabled={isLoading}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded border"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Rows per page: {PAGE_SIZE}</div>
              </>
            }
          />
        )}
    </div>
  );
}
