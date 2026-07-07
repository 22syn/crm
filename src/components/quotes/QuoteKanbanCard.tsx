import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, GripVertical, Pencil } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

export interface QuoteKanbanItem {
  id: string;
  quote_number: string;
  customer_name: string;
  status: string;
  total: number;
  valid_until: string | null;
  created_at: string;
}

interface QuoteKanbanCardProps {
  quote: QuoteKanbanItem;
  onView: (quote: QuoteKanbanItem) => void;
  onEdit?: (quote: QuoteKanbanItem) => void;
}

export function QuoteKanbanCard({ quote, onView, onEdit }: QuoteKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quote.id,
  });

  const style: React.CSSProperties = isDragging
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: 0.5,
      }
    : {};

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 flex-shrink-0 overflow-hidden cursor-grab active:cursor-grabbing transition-shadow duration-200 ease-out shadow-sm hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card motion-reduce:transition-none"
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm truncate">{quote.quote_number}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onView(quote);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1.5">
        <p className="font-medium text-sm line-clamp-1">{quote.customer_name}</p>
        <p className="text-base font-semibold">₪{quote.total.toLocaleString()}</p>
        <div className="text-xs text-muted-foreground">
          {format(new Date(quote.created_at), "d MMM yyyy")}
          {quote.valid_until && (
            <span className="ml-1">• Valid {format(new Date(quote.valid_until), "dd/MM/yy")}</span>
          )}
        </div>
        {onEdit && quote.status === "draft" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(quote);
            }}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
