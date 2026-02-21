import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, GripVertical, Pencil, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { he } from "date-fns/locale";

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

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
}

const probabilityColors: Record<number, string> = {
  0: "bg-destructive/20 text-destructive",
  25: "bg-destructive/20 text-destructive",
  50: "bg-yellow-500/20 text-yellow-700",
  75: "bg-primary/20 text-primary",
  100: "bg-green-500/20 text-green-700",
};

function getProbabilityColor(probability: number | null): string {
  if (probability === null) return probabilityColors[50];
  if (probability <= 25) return probabilityColors[25];
  if (probability <= 50) return probabilityColors[50];
  if (probability <= 75) return probabilityColors[75];
  return probabilityColors[100];
}

export function DealCard({ deal, onEdit }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <h3 className="font-medium text-sm line-clamp-2">{deal.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(deal);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {deal.leads?.customer_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{deal.leads.customer_name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <DollarSign className="h-3 w-3" />
          <span>₪{deal.amount.toLocaleString()}</span>
        </div>

        {deal.expected_close_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(deal.expected_close_date), "d MMM", { locale: he })}</span>
          </div>
        )}

        <Badge className={`text-xs ${getProbabilityColor(deal.probability)}`}>
          {deal.probability ?? 50}% chance
        </Badge>
      </CardContent>
    </Card>
  );
}
