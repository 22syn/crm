import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
  /** Hadarya Dark v2: uppercase labels, ellipsis menu, dark drop zone */
  variant?: "default" | "stitch-dark";
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
  variant = "stitch-dark",
}: EntityKanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isDark = variant === "stitch-dark";

  return (
    <div className="min-w-[220px] md:min-w-[280px] shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
        <h3
          className={`font-medium truncate ${isDark ? "text-sm uppercase tracking-wider text-white/90" : ""}`}
        >
          {label}
        </h3>
        <Badge
          variant="secondary"
          className={`ml-auto shrink-0 ${isDark ? "bg-white/15 text-white/90 border-0" : ""}`}
        >
          {items.length}
        </Badge>
        {isDark && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-white/60 hover:text-white/90"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem className="text-white/90 focus:bg-white/10">
                Collapse column
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white/90 focus:bg-white/10">
                Add card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden p-2 rounded-xl transition-colors custom-scrollbar-dark ${
          isDark
            ? isOver
              ? "bg-accent-action/20 ring-2 ring-accent-action/50"
              : "bg-card/90"
            : isOver
              ? "bg-accent-action/10 ring-2 ring-accent-action/30"
              : "bg-white/60 dark:bg-card/50"
        }`}
      >
        {items.length === 0 ? (
          <div
            className={`text-center py-8 text-sm border-2 border-dashed rounded-lg ${
              isDark ? "text-white/50 border-white/20" : "text-muted-foreground"
            }`}
          >
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
