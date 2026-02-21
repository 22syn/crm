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
import { ReactNode, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityKanbanColumn } from "./EntityKanbanColumn";

export interface EntityKanbanColumnConfig {
  id: string;
  label: string;
  color: string;
}

export interface EntityKanbanSortOption {
  value: string;
  label: string;
}

export interface EntityKanbanProps<T> {
  /** Column definitions (status/stage + label + color) */
  columns: EntityKanbanColumnConfig[];
  /** Items to display */
  items: T[];
  getItemId: (item: T) => string;
  getStatus: (item: T) => string;
  onStatusChange: (itemId: string, newStatus: string) => void;
  renderCard: (item: T) => ReactNode;
  /** Optional: only show these columns (filter by id) */
  selectedColumns?: string[];
  /** Sort dropdown — when provided, shows Sort by dropdown (matches Leads) */
  sortOptions?: EntityKanbanSortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  /** Sort items within each column — receives items for column, returns sorted */
  sortItems?: (items: T[]) => T[];
  isLoading?: boolean;
  emptyLabel?: string;
}

/** Generic Pipeline Kanban — matches Leads structure: Sort dropdown, DnD, same layout */
export function EntityKanban<T>({
  columns,
  items,
  getItemId,
  getStatus,
  onStatusChange,
  renderCard,
  selectedColumns,
  sortOptions,
  sortValue,
  onSortChange,
  sortItems,
  isLoading = false,
  emptyLabel = "No items",
}: EntityKanbanProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const visibleColumns = selectedColumns?.length
    ? columns.filter((col) => selectedColumns.includes(col.id))
    : columns;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeItem = activeId ? items.find((i) => getItemId(i) === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const item = items.find((i) => getItemId(i) === itemId);
      if (item && getStatus(item) !== targetColumn.id) {
        onStatusChange(itemId, targetColumn.id);
      }
      return;
    }

    const targetItem = items.find((i) => getItemId(i) === overId);
    if (targetItem) {
      const item = items.find((i) => getItemId(i) === itemId);
      if (item && getStatus(item) !== getStatus(targetItem)) {
        onStatusChange(itemId, getStatus(targetItem));
      }
    }
  };

  const getItemsByColumn = (columnId: string) => {
    const filtered = items.filter((i) => getStatus(i) === columnId);
    return sortItems ? sortItems(filtered) : filtered;
  };

  if (isLoading) {
    return (
      <div
        className="kanban-grid grid gap-4 overflow-x-auto pb-2 overscroll-x-contain"
        style={{ "--col-count": visibleColumns.length } as React.CSSProperties}
      >
        {visibleColumns.map((col) => (
          <div key={col.id} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortOptions && sortValue != null && onSortChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className="w-[220px] h-8 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="kanban-grid grid gap-4 overflow-x-auto pb-2 overscroll-x-contain"
          style={{ "--col-count": visibleColumns.length } as React.CSSProperties}
        >
          {visibleColumns.map((col) => (
            <EntityKanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              items={getItemsByColumn(col.id)}
              getItemId={getItemId}
              renderCard={renderCard}
              emptyLabel={emptyLabel}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="w-[268px]">{renderCard(activeItem)}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
