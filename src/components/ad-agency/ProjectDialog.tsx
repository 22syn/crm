import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;
type OpClient = Tables<"op_clients">;
type ProjectStatus = Database["public"]["Enums"]["op_project_status"];

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: OpProject | null;
  clients: OpClient[];
  preselectedClientId?: string | null;
  onSave: (data: Partial<OpProject> & { client_id: string; title: string }) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "טיוטה" },
  { value: "waiting_for_approval", label: "ממתין לאישור" },
  { value: "planning", label: "תכנון" },
  { value: "execution", label: "ביצוע" },
  { value: "collection", label: "גבייה" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  clients,
  preselectedClientId,
  onSave,
}: ProjectDialogProps) {
  const [formData, setFormData] = useState({
    client_id: preselectedClientId || "",
    title: "",
    budget_required: "",
    budget_approved: "",
    status: "draft" as ProjectStatus,
    start_date: "",
    end_date: "",
    notes: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        client_id: project.client_id ?? "",
        title: project.title ?? "",
        budget_required: project.budget_required != null ? String(project.budget_required) : "",
        budget_approved: project.budget_approved != null ? String(project.budget_approved) : "",
        status: (project.status ?? "draft") as ProjectStatus,
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
        notes: project.notes ?? "",
      });
    } else {
      setFormData({
        client_id: preselectedClientId || "",
        title: "",
        budget_required: "",
        budget_approved: "",
        status: "draft",
        start_date: "",
        end_date: "",
        notes: "",
      });
    }
  }, [project, preselectedClientId, open]);

  const isDraft =
    formData.status === "draft" || formData.status === "waiting_for_approval";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      client_id: formData.client_id,
      title: formData.title.trim(),
      budget_required: formData.budget_required ? Number(formData.budget_required) : 0,
      budget_approved: formData.budget_approved ? Number(formData.budget_approved) : 0,
      status: formData.status,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">לקוח *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(v) => setFormData((p) => ({ ...p, client_id: v }))}
              disabled={!!preselectedClientId}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">שם פרויקט *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_required">תקציב נדרש (טיוטה)</Label>
              <Input
                id="budget_required"
                type="number"
                min={0}
                step="0.01"
                value={formData.budget_required}
                onChange={(e) => setFormData((p) => ({ ...p, budget_required: e.target.value }))}
                disabled={!isDraft}
              />
              {!isDraft && (
                <p className="text-xs text-muted-foreground">מוצג לצורך עיון בלבד</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_approved">תקציב שאושר (צפי הכנסה)</Label>
              <Input
                id="budget_approved"
                type="number"
                min={0}
                step="0.01"
                value={formData.budget_approved}
                onChange={(e) => setFormData((p) => ({ ...p, budget_approved: e.target.value }))}
                disabled={isDraft}
              />
              {isDraft && (
                <p className="text-xs text-muted-foreground">
                  יוגדר בעת מעבר מאישור הטיוטה
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((p) => ({ ...p, status: v as ProjectStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">תאריך התחלה</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">תאריך סיום</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">{project ? "שמור שינויים" : "צור פרויקט"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
