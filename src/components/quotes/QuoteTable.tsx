import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DataTable, type DataTableColumn, type SortOption } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Eye } from "lucide-react";

export interface QuoteRow {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  total: number;
  valid_until: string | null;
  created_at: string;
  lead_id?: string | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
};

const QUOTE_SORT_OPTIONS: SortOption[] = [
  { value: "quote_number_asc", label: "Contract # A → Z" },
  { value: "quote_number_desc", label: "Contract # Z → A" },
  { value: "customer_name_asc", label: "Customer A → Z" },
  { value: "customer_name_desc", label: "Customer Z → A" },
  { value: "status_asc", label: "Status A → Z" },
  { value: "status_desc", label: "Status Z → A" },
  { value: "total_asc", label: "Total (low to high)" },
  { value: "total_desc", label: "Total (high to low)" },
  { value: "created_at_desc", label: "Created (newest first)" },
  { value: "created_at_asc", label: "Created (oldest first)" },
];

type SortField = "quote_number" | "customer_name" | "status" | "total" | "valid_until" | "created_at";
type SortDirection = "asc" | "desc";

function parseSortValue(value: string): { field: SortField; direction: SortDirection } {
  const [field, dir] = value.split("_") as [SortField, SortDirection];
  return { field, direction: dir ?? "asc" };
}

function toSortValue(field: SortField, direction: SortDirection): string {
  return `${field}_${direction}`;
}

interface QuoteTableProps {
  quotes: QuoteRow[];
  onView: (quote: QuoteRow) => void;
  onEdit?: (quote: QuoteRow) => void;
  onApprove?: (quote: QuoteRow) => void;
  onDelete?: (quote: QuoteRow) => void;
}

export function QuoteTable({ quotes, onView, onEdit, onApprove, onDelete }: QuoteTableProps) {
  const [sortValue, setSortValue] = useState("created_at_desc");
  const { field: sortField, direction: sortDirection } = parseSortValue(sortValue);

  const handleSortChange = (value: string) => setSortValue(value);

  const handleHeaderSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortValue(toSortValue(f, sortDirection === "asc" ? "desc" : "asc"));
    } else {
      setSortValue(toSortValue(f, "asc"));
    }
  };

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "quote_number":
          comparison = a.quote_number.localeCompare(b.quote_number);
          break;
        case "customer_name":
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "valid_until":
          comparison =
            (a.valid_until ? new Date(a.valid_until).getTime() : 0) -
            (b.valid_until ? new Date(b.valid_until).getTime() : 0);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [quotes, sortField, sortDirection]);

  const columns: DataTableColumn<QuoteRow>[] = [
    {
      id: "quote_number",
      header: "Contract #",
      sortable: true,
      sortKey: "quote_number",
      minWidth: "120px",
      render: (q) => <span className="font-mono font-medium">{q.quote_number}</span>,
    },
    {
      id: "customer_name",
      header: "Customer",
      sortable: true,
      sortKey: "customer_name",
      minWidth: "140px",
      render: (q) => (
        <div>
          <div className="font-medium">{q.customer_name}</div>
          {q.customer_phone && (
            <div className="text-meta text-muted-foreground" dir="ltr">
              {q.customer_phone}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      render: (q) => {
        const config = statusConfig[q.status] || statusConfig.draft;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "total",
      header: "Total",
      sortable: true,
      sortKey: "total",
      render: (q) => <span className="text-body">₪{q.total.toLocaleString()}</span>,
    },
    {
      id: "valid_until",
      header: "Valid until",
      sortable: true,
      sortKey: "valid_until",
      render: (q) =>
        q.valid_until ? (
          <span className="text-sm">{format(new Date(q.valid_until), "dd/MM/yyyy")}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "created_at",
      header: "Created",
      sortable: true,
      sortKey: "created_at",
      render: (q) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(q.created_at), "dd/MM/yyyy")}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedQuotes}
      getRowId={(q) => q.id}
      emptyMessage="No contracts found"
      sortOptions={QUOTE_SORT_OPTIONS}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      renderActions={(quote) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onView(quote)}
            aria-label="View contract"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(quote)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(quote)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onApprove && quote.status === "sent" && (
                <DropdownMenuItem onClick={() => onApprove(quote)}>Approve</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(quote)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    />
  );
}
