import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DataTable, type DataTableColumn, type SortOption } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, ChevronDown } from "lucide-react";

export type DealStage =
  | "quote_approved"
  | "in_production"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  lead_id: string | null;
  quote_id: string | null;
  notes: string | null;
  created_at: string;
  leads?: { customer_name: string } | null;
}

const STAGE_OPTIONS: { value: DealStage; label: string; color: string }[] = [
  { value: "quote_approved", label: "Quote Approved", color: "bg-blue-500" },
  { value: "in_production", label: "In Production", color: "bg-amber-500" },
  { value: "ready_for_delivery", label: "Ready for Delivery", color: "bg-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-cyan-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive" },
];

const DEAL_SORT_OPTIONS: SortOption[] = [
  { value: "title_asc", label: "Title A → Z" },
  { value: "title_desc", label: "Title Z → A" },
  { value: "stage_asc", label: "Stage A → Z" },
  { value: "stage_desc", label: "Stage Z → A" },
  { value: "amount_asc", label: "Amount (low to high)" },
  { value: "amount_desc", label: "Amount (high to low)" },
  { value: "expected_close_date_asc", label: "Expected close (soonest)" },
  { value: "expected_close_date_desc", label: "Expected close (latest)" },
  { value: "created_at_desc", label: "Created (newest first)" },
  { value: "created_at_asc", label: "Created (oldest first)" },
];

type SortField = "title" | "stage" | "amount" | "expected_close_date" | "created_at";
type SortDirection = "asc" | "desc";

function parseSortValue(value: string): { field: SortField; direction: SortDirection } {
  const [field, dir] = value.split("_") as [SortField, SortDirection];
  return { field, direction: dir ?? "asc" };
}

function toSortValue(field: SortField, direction: SortDirection): string {
  return `${field}_${direction}`;
}

interface DealTableProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

function StagePill({
  dealId,
  stage,
  onStageChange,
}: {
  dealId: string;
  stage: string;
  onStageChange: (dealId: string, stage: DealStage) => void;
}) {
  const current = STAGE_OPTIONS.find((s) => s.value === stage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-body hover:bg-muted transition-colors cursor-pointer"
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${current?.color}`} />
          <span className="whitespace-nowrap">{current?.label ?? stage}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STAGE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onStageChange(dealId, option.value)}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${option.color}`} />
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DealTable({ deals, onEdit, onStageChange }: DealTableProps) {
  const [sortValue, setSortValue] = useState("created_at_desc");
  const { field: sortField, direction: sortDirection } = parseSortValue(sortValue);

  const handleSortChange = (value: string) => {
    setSortValue(value);
  };

  const handleHeaderSort = (field: string) => {
    const f = field as SortField;
    if (sortField === f) {
      setSortValue(toSortValue(f, sortDirection === "asc" ? "desc" : "asc"));
    } else {
      setSortValue(toSortValue(f, "asc"));
    }
  };

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "stage":
          comparison = a.stage.localeCompare(b.stage);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "expected_close_date":
          comparison =
            (a.expected_close_date ? new Date(a.expected_close_date).getTime() : 0) -
            (b.expected_close_date ? new Date(b.expected_close_date).getTime() : 0);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [deals, sortField, sortDirection]);

  const columns: DataTableColumn<Deal>[] = [
    {
      id: "title",
      header: "Title",
      sortable: true,
      sortKey: "title",
      render: (deal) => <span className="font-medium">{deal.title}</span>,
    },
    {
      id: "stage",
      header: "Stage",
      sortable: true,
      sortKey: "stage",
      render: (deal) => (
        <StagePill dealId={deal.id} stage={deal.stage} onStageChange={onStageChange} />
      ),
    },
    {
      id: "amount",
      header: "Amount",
      sortable: true,
      sortKey: "amount",
      render: (deal) => <span className="text-body">{deal.amount.toLocaleString()}</span>,
    },
    {
      id: "expected_close_date",
      header: "Expected close",
      sortable: true,
      sortKey: "expected_close_date",
      render: (deal) =>
        deal.expected_close_date ? (
          <span className="text-body">{format(new Date(deal.expected_close_date), "dd/MM/yyyy")}</span>
        ) : (
          <span className="text-muted-foreground text-body">—</span>
        ),
    },
    {
      id: "lead",
      header: "Lead",
      render: (deal) => <span className="text-body">{deal.leads?.customer_name ?? "—"}</span>,
    },
    {
      id: "created_at",
      header: "Created",
      sortable: true,
      sortKey: "created_at",
      render: (deal) => (
        <span className="text-meta text-muted-foreground">
          {format(new Date(deal.created_at), "dd/MM/yyyy")}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedDeals}
      getRowId={(d) => d.id}
      emptyMessage="No deals found"
      sortOptions={DEAL_SORT_OPTIONS}
      sortValue={sortValue}
      onSortChange={handleSortChange}
      sortField={sortField}
      sortDirection={sortDirection}
      onHeaderSort={handleHeaderSort}
      renderActions={(deal) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(deal)}
            aria-label="Edit deal"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(deal)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    />
  );
}
