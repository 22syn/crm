import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Package, Play, Upload, Eye } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

export interface DesignRequestKanbanItem {
  id: string;
  status: string;
  design_file_url: string | null;
  created_at: string;
  quote_item?: {
    title: string;
    dimensions: string | null;
  } | null;
  quote?: {
    quote_number: string;
    customer_name: string;
  } | null;
}

interface DesignRequestKanbanCardProps {
  request: DesignRequestKanbanItem;
  onStartWork?: (request: DesignRequestKanbanItem) => void;
  onUploadDesign?: (request: DesignRequestKanbanItem) => void;
}

export function DesignRequestKanbanCard({
  request,
  onStartWork,
  onUploadDesign,
}: DesignRequestKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: request.id,
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
      className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-sm cursor-grab active:cursor-grabbing transition-shadow duration-200 ease-out shadow-sm hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card motion-reduce:transition-none"
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm line-clamp-2">{request.quote_item?.title ?? "—"}</h3>
            <p className="text-xs text-muted-foreground">
              {request.quote?.quote_number} • {request.quote?.customer_name}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {request.quote_item?.dimensions && (
          <p className="text-xs text-muted-foreground">Dimensions: {request.quote_item.dimensions}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(request.created_at), "d MMM yyyy")}
        </p>
        {request.status === "pending" && onStartWork && (
          <Button
            size="sm"
            className="h-7 w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onStartWork(request);
            }}
          >
            <Play className="h-3 w-3 mr-1" />
            Start Work
          </Button>
        )}
        {request.status === "in_progress" && onUploadDesign && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUploadDesign(request);
            }}
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload Design
          </Button>
        )}
        {request.status === "completed" && request.design_file_url && (
          <Button size="sm" variant="outline" className="h-7 w-full text-xs" asChild>
            <a href={request.design_file_url} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3 w-3 mr-1" />
              View Design
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
