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
import { Package, Play, Upload, Eye, MoreHorizontal } from "lucide-react";

export interface DesignRequestRow {
  id: string;
  quote_id: string;
  quote_item_id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  design_file_url: string | null;
  design_notes: string | null;
  created_at: string;
  quote_item?: {
    title: string;
    dimensions: string | null;
    product_type: string | null;
    image_url: string | null;
    custom_design_notes: string | null;
  } | null;
  quote?: {
    quote_number: string;
    customer_name: string;
    customer_phone: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-500" },
};

const SORT_OPTIONS: SortOption[] = [
  { value: "title_asc", label: "Item A → Z" },
  { value: "title_desc", label: "Item Z → A" },
  { value: "quote_number_asc", label: "Quote # A → Z" },
  { value: "quote_number_desc", label: "Quote # Z → A" },
  { value: "customer_name_asc", label: "Customer A → Z" },
  { value: "customer_name_desc", label: "Customer Z → A" },
  { value: "status_asc", label: "Status A → Z" },
  { value: "status_desc", label: "Status Z → A" },
  { value: "created_at_desc", label: "Created (newest first)" },
  { value: "created_at_asc", label: "Created (oldest first)" },
];

type SortField = "title" | "quote_number" | "customer_name" | "status" | "created_at";

function parseSortValue(value: string): { field: SortField; direction: "asc" | "desc" } {
  const [field, dir] = value.split("_");
  return { field: field as SortField, direction: (dir ?? "asc") as "asc" | "desc" };
}

function toSortValue(field: SortField, direction: "asc" | "desc"): string {
  return `${field}_${direction}`;
}

interface DesignRequestTableProps {
  requests: DesignRequestRow[];
  onStartWork: (request: DesignRequestRow) => void;
  onUploadDesign: (request: DesignRequestRow) => void;
}

export function DesignRequestTable({
  requests,
  onStartWork,
  onUploadDesign,
}: DesignRequestTableProps) {
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

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = (a.quote_item?.title ?? "").localeCompare(b.quote_item?.title ?? "");
          break;
        case "quote_number":
          comparison = (a.quote?.quote_number ?? "").localeCompare(b.quote?.quote_number ?? "");
          break;
        case "customer_name":
          comparison = (a.quote?.customer_name ?? "").localeCompare(b.quote?.customer_name ?? "");
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [requests, sortField, sortDirection]);

  const columns: DataTableColumn<DesignRequestRow>[] = [
    {
      id: "item",
      header: "Item",
      sortable: true,
      sortKey: "title",
      minWidth: "160px",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
            {r.quote_item?.image_url ? (
              <img
                src={r.quote_item.image_url}
                alt=""
                className="w-full h-full object-cover rounded"
                loading="lazy"
                width={40}
                height={40}
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <span className="font-medium">{r.quote_item?.title ?? "—"}</span>
        </div>
      ),
    },
    {
      id: "quote_number",
      header: "Quote #",
      sortable: true,
      sortKey: "quote_number",
      render: (r) => (
        <span className="font-mono text-sm">{r.quote?.quote_number ?? "—"}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      sortKey: "customer_name",
      render: (r) => (
        <span className="text-body">{r.quote?.customer_name ?? "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      render: (r) => {
        const config = statusConfig[r.status] ?? statusConfig.pending;
        return (
          <Badge variant="outline" className="gap-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${config.color}`} />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "dimensions",
      header: "Dimensions",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.quote_item?.dimensions ?? "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Created",
      sortable: true,
      sortKey: "created_at",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(r.created_at), "dd/MM/yyyy")}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedRequests}
      getRowId={(r) => r.id}
      emptyMessage="No design requests found"
      sortOptions={SORT_OPTIONS}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      renderActions={(request) => (
        <>
          {request.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onStartWork(request)}
              aria-label="Start work"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {request.status === "in_progress" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onUploadDesign(request)}
              aria-label="Upload design"
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
          {request.status === "completed" && request.design_file_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a
                href={request.design_file_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View design"
              >
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {request.status === "pending" && (
                <DropdownMenuItem onClick={() => onStartWork(request)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Work
                </DropdownMenuItem>
              )}
              {request.status === "in_progress" && (
                <DropdownMenuItem onClick={() => onUploadDesign(request)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Design
                </DropdownMenuItem>
              )}
              {request.status === "completed" && request.design_file_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={request.design_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Design
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    />
  );
}
