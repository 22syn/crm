import { useMemo } from "react";
import { format } from "date-fns";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Mail, MapPin, Edit, Trash2, MoreHorizontal } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CustomerStatus = Database["public"]["Enums"]["customer_status"];

export interface Customer {
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

function getStatusBadge(customerStatus: CustomerStatus) {
  const option = STATUS_OPTIONS.find((s) => s.value === customerStatus);
  const variantClasses: Record<CustomerStatus, string> = {
    new: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    in_progress: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    closed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    returning: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${variantClasses[customerStatus] || variantClasses.new}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${option?.color} mr-1.5`} />
      {option?.label || customerStatus}
    </span>
  );
}

function getAvatarColor(name: string) {
  const colors = ["bg-blue-100 text-blue-600", "bg-orange-100 text-orange-600", "bg-purple-100 text-purple-600", "bg-slate-100 text-slate-500"];
  const i = name.charCodeAt(0) % colors.length;
  return colors[i];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  renderFooter?: React.ReactNode;
  visibleColumnIds?: string[] | null;
}

export function CustomerTable({ customers, onEdit, onDelete, renderFooter, visibleColumnIds }: CustomerTableProps) {
  const columns: DataTableColumn<Customer>[] = useMemo(
    () => [
      {
        id: "client_name",
        header: "Client Name",
        minWidth: "200px",
        render: (customer) => (
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(customer.name)}`}
            >
              {initials(customer.name)}
            </div>
            <div>
              <div className="text-sm font-bold">{customer.name}</div>
              <div className="text-xs text-muted-foreground">{customer.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        render: (customer) => (
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-1 text-sm hover:underline"
          >
            <Phone className="h-3 w-3" />
            {customer.phone}
          </a>
        ),
      },
      {
        id: "email",
        header: "Email",
        render: (customer) => (
          <a
            href={`mailto:${customer.email}`}
            className="flex items-center gap-1 text-sm hover:underline"
          >
            <Mail className="h-3 w-3" />
            {customer.email}
          </a>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (customer) => getStatusBadge(customer.status),
      },
      {
        id: "address",
        header: "Address",
        render: (customer) =>
          customer.address ? (
            <span className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[120px]">{customer.address}</span>
            </span>
          ) : (
            "—"
          ),
      },
      {
        id: "created_at",
        header: "Added",
        render: (customer) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(customer.created_at), "dd MMM yyyy")}
          </span>
        ),
      },
    ],
    []
  );

  const displayedColumns = useMemo(() => {
    if (!visibleColumnIds || visibleColumnIds.length === 0) return columns;
    const set = new Set(visibleColumnIds);
    const filtered = columns.filter((c) => set.has(c.id));
    return filtered.length > 0 ? filtered : columns;
  }, [columns, visibleColumnIds]);

  return (
    <DataTable<Customer>
      columns={displayedColumns}
      data={customers}
      getRowId={(c) => c.id}
      emptyMessage="No contacts yet"
      variant="stitch"
      renderFooter={renderFooter}
      renderActions={(customer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(customer)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
