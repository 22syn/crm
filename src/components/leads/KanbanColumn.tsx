import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { LeadCard } from "./LeadCard";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface KanbanColumnProps {
  status: LeadStatus;
  label: string;
  color: string;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

export function KanbanColumn({ status, label, color, leads, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="min-w-[250px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <h3 className="font-medium">{label}</h3>
        <Badge variant="secondary" className="ml-auto">
          {leads.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? "bg-muted/50" : ""
        }`}
      >
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onEdit={onEdit} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
            No leads
          </div>
        )}
      </div>
    </div>
  );
}
