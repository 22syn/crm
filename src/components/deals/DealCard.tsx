import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, GripVertical, Pencil, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, formatDistanceToNow } from "date-fns";
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
  created_at?: string;
  updated_at?: string;
  leads?: { customer_name: string } | null;
}

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  /** Hadarya Dark Kanban v2: dark card, value prominent */
  variant?: "default" | "stitch-dark";
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

export const DealCard = React.memo(function DealCard({
  deal,
  onEdit,
  variant = "default",
}: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style: React.CSSProperties = isDragging
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: 0.5,
      }
    : {};

  const isDark = variant === "stitch-dark";
  const updatedAt = deal.updated_at || deal.created_at;

  if (isDark) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-xl cursor-grab active:cursor-grabbing bg-[#151938] border-white/10 shadow-md hover:border-accent-action/40 focus-within:ring-2 focus-within:ring-accent-action focus-within:ring-offset-2 focus-within:ring-offset-[#0f1025] motion-reduce:transition-none"
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white/80 shrink-0"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-white line-clamp-2 bidi-plaintext">
                  {deal.leads?.customer_name ?? deal.title}
                </h3>
                <div className="text-sm font-medium text-accent-action mt-0.5">
                  ₪{deal.amount.toLocaleString("he-IL")}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-white/50 hover:text-white/80"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(deal);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2 ml-6">
            {deal.expected_close_date && (
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(deal.expected_close_date), "d MMM", { locale: he })}</span>
              </div>
            )}
            {updatedAt && (
              <span className="text-[11px] text-white/50">
                Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full min-w-0 flex-shrink-0 overflow-hidden rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 ease-out shadow-sm hover:shadow-md hover:border-accent-action/30 focus-within:ring-2 focus-within:ring-accent-action focus-within:ring-offset-2 motion-reduce:transition-none"
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
            <h3 className="font-medium text-sm line-clamp-2 bidi-plaintext">{deal.title}</h3>
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
            <span className="truncate bidi-plaintext">{deal.leads.customer_name}</span>
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
});
