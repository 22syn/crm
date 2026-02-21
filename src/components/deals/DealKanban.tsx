import { EntityKanban } from "@/components/entity-page";
import { DealCard } from "./DealCard";

interface Deal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  lead_id: string | null;
  quote_id: string | null;
  notes: string | null;
  leads?: { customer_name: string } | null;
}

type DealStage =
  | "quote_approved"
  | "in_production"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "cancelled";

const stageColumns = [
  { id: "quote_approved" as const, label: "Quote Approved", color: "bg-blue-500" },
  { id: "in_production" as const, label: "In Production", color: "bg-amber-500" },
  { id: "ready_for_delivery" as const, label: "Ready for Delivery", color: "bg-purple-500" },
  { id: "shipped" as const, label: "Shipped", color: "bg-cyan-500" },
  { id: "delivered" as const, label: "Delivered", color: "bg-green-500" },
  { id: "cancelled" as const, label: "Cancelled", color: "bg-destructive" },
];

interface DealKanbanProps {
  deals: Deal[];
  isLoading: boolean;
  onEdit: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

export function DealKanban({ deals, isLoading, onEdit, onStageChange }: DealKanbanProps) {
  return (
    <EntityKanban<Deal>
      columns={stageColumns}
      items={deals}
      getItemId={(d) => d.id}
      getStatus={(d) => d.stage}
      onStatusChange={onStageChange}
      renderCard={(deal) => <DealCard deal={deal} onEdit={onEdit} />}
      isLoading={isLoading}
      emptyLabel="No deals"
    />
  );
}
