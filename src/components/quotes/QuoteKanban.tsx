import { EntityKanban } from "@/components/entity-page";
import { QuoteKanbanCard, type QuoteKanbanItem } from "./QuoteKanbanCard";

const statusColumns = [
  { id: "draft", label: "Draft", color: "bg-yellow-500" },
  { id: "sent", label: "Sent", color: "bg-blue-500" },
  { id: "approved", label: "Approved", color: "bg-green-500" },
];

interface QuoteKanbanProps {
  quotes: QuoteKanbanItem[];
  isLoading: boolean;
  onView: (quote: QuoteKanbanItem) => void;
  onEdit?: (quote: QuoteKanbanItem) => void;
  onStatusChange: (quoteId: string, status: string) => void;
}

export function QuoteKanban({
  quotes,
  isLoading,
  onView,
  onEdit,
  onStatusChange,
}: QuoteKanbanProps) {
  return (
    <EntityKanban<QuoteKanbanItem>
      columns={statusColumns}
      items={quotes}
      getItemId={(q) => q.id}
      getStatus={(q) => q.status}
      onStatusChange={onStatusChange}
      renderCard={(quote) => (
        <QuoteKanbanCard
          quote={quote}
          onView={onView}
          onEdit={onEdit}
        />
      )}
      isLoading={isLoading}
      emptyLabel="No contracts"
    />
  );
}
