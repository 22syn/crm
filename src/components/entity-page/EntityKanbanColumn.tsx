import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

export interface EntityKanbanColumnProps<T> {
  /** Column id (status/stage value) - used as droppable id */
  id: string;
  label: string;
  color: string;
  items: T[];
  getItemId: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  emptyLabel?: string;
}

/** Generic Kanban column — matches Leads KanbanColumn structure */
export function EntityKanbanColumn<T>({
  id,
  label,
  color,
  items,
  getItemId,
  renderCard,
  emptyLabel = "No items",
}: EntityKanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="min-w-[220px] md:min-w-[280px] shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className={`h-3 w-3 rounded-full shrink-0 ${color}`} />
        <h3 className="font-medium truncate">{label}</h3>
        <Badge variant="secondary" className="ml-auto shrink-0">
          {items.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden p-2 rounded-sm transition-colors ${
          isOver ? "bg-muted/50" : ""
        }`}
      >
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-sm">
            {emptyLabel}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={getItemId(item)} className="flex-shrink-0">
                {renderCard(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
