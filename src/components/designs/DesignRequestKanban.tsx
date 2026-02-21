import { EntityKanban } from "@/components/entity-page";
import { DesignRequestKanbanCard, type DesignRequestKanbanItem } from "./DesignRequestKanbanCard";

const statusColumns = [
  { id: "pending", label: "Pending", color: "bg-yellow-500" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { id: "completed", label: "Completed", color: "bg-green-500" },
];

interface DesignRequestKanbanProps {
  requests: DesignRequestKanbanItem[];
  isLoading: boolean;
  onStartWork: (request: DesignRequestKanbanItem) => void;
  onUploadDesign: (request: DesignRequestKanbanItem) => void;
  onStatusChange: (requestId: string, status: string) => void;
}

export function DesignRequestKanban({
  requests,
  isLoading,
  onStartWork,
  onUploadDesign,
  onStatusChange,
}: DesignRequestKanbanProps) {
  return (
    <EntityKanban<DesignRequestKanbanItem>
      columns={statusColumns}
      items={requests}
      getItemId={(r) => r.id}
      getStatus={(r) => r.status}
      onStatusChange={onStatusChange}
      renderCard={(request) => (
        <DesignRequestKanbanCard
          request={request}
          onStartWork={onStartWork}
          onUploadDesign={onUploadDesign}
        />
      )}
      isLoading={isLoading}
      emptyLabel="No requests"
    />
  );
}
