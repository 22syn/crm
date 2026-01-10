import { useDroppable } from "@dnd-kit/core";
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

interface DealColumnProps {
  stage: string;
  label: string;
  color: string;
  deals: Deal[];
  onEdit: (deal: Deal) => void;
}

export function DealColumn({ stage, label, color, deals, onEdit }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[500px] rounded-lg border bg-muted/30 transition-colors ${
        isOver ? "bg-muted/60 border-primary" : ""
      }`}
    >
      <div className="p-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-medium text-sm">{label}</h3>
          <span className="text-xs text-muted-foreground mr-auto">
            {deals.length}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          ₪{totalAmount.toLocaleString()}
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
