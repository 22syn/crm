import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DealColumn } from "./DealColumn";
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
  order_id: string | null;
  notes: string | null;
  leads?: { customer_name: string } | null;
}

type DealStage = "proposal" | "negotiation" | "contract_sent" | "closed_won" | "closed_lost";

interface DealKanbanProps {
  deals: Deal[];
  isLoading: boolean;
  onEdit: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

const stageColumns: { stage: DealStage; label: string; color: string }[] = [
  { stage: "proposal", label: "הצעה", color: "bg-blue-500" },
  { stage: "negotiation", label: "משא ומתן", color: "bg-yellow-500" },
  { stage: "contract_sent", label: "חוזה נשלח", color: "bg-purple-500" },
  { stage: "closed_won", label: "נסגר בהצלחה", color: "bg-green-500" },
  { stage: "closed_lost", label: "אבוד", color: "bg-destructive" },
];

export function DealKanban({ deals, isLoading, onEdit, onStageChange }: DealKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetStage = stageColumns.find((col) => col.stage === overId);
    if (targetStage) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== targetStage.stage) {
        onStageChange(dealId, targetStage.stage);
      }
      return;
    }

    // Check if dropped on another deal - get that deal's column
    const targetDeal = deals.find((d) => d.id === overId);
    if (targetDeal) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== targetDeal.stage) {
        onStageChange(dealId, targetDeal.stage as DealStage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stageColumns.map((col) => (
          <div key={col.stage} className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const getDealsByStage = (stage: DealStage) =>
    deals.filter((deal) => deal.stage === stage);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {stageColumns.map((column) => (
          <DealColumn
            key={column.stage}
            stage={column.stage}
            label={column.label}
            color={column.color}
            deals={getDealsByStage(column.stage)}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} onEdit={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
