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
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadKanbanProps {
  leads: Lead[];
  isLoading: boolean;
  onEdit: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onCreateQuote?: (lead: Lead) => void;
}

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "bg-blue-500" },
  { status: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { status: "qualified", label: "Qualified", color: "bg-purple-500" },
  { status: "quoted", label: "Quoted", color: "bg-orange-500" },
  { status: "won", label: "Won", color: "bg-green-500" },
  { status: "lost", label: "Lost", color: "bg-red-500" },
];

export function LeadKanban({ leads, isLoading, onEdit, onStatusChange, onCreateQuote }: LeadKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetStatus = statusColumns.find((col) => col.status === overId);
    if (targetStatus) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== targetStatus.status) {
        onStatusChange(leadId, targetStatus.status);
      }
      return;
    }

    // Check if dropped on another lead - get that lead's column
    const targetLead = leads.find((l) => l.id === overId);
    if (targetLead) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== targetLead.status) {
        onStatusChange(leadId, targetLead.status);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusColumns.map((col) => (
          <div key={col.status} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const getLeadsByStatus = (status: LeadStatus) =>
    leads.filter((lead) => lead.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            color={column.color}
            leads={getLeadsByStatus(column.status)}
            onEdit={onEdit}
            onCreateQuote={onCreateQuote}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} onEdit={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
