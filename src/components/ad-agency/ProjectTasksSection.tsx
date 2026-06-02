import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type OpProjectTask = Tables<"op_project_tasks">;
type OpTaskSubtask = Tables<"op_task_subtasks">;
type TaskStatus = Database["public"]["Enums"]["op_task_status"];

interface TaskWithSubtasks extends OpProjectTask {
  op_task_subtasks?: OpTaskSubtask[];
}

interface ProjectTasksSectionProps {
  projectId: string;
}

const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "לבצע" },
  { value: "in_progress", label: "בביצוע" },
  { value: "done", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

export function ProjectTasksSection({ projectId }: ProjectTasksSectionProps) {
  const queryClient = useQueryClient();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpProjectTask | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    status: "todo" as TaskStatus,
    assigned_to: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, user_id, full_name").order("full_name");
      if (error) throw error;
      return data as { id: string; user_id: string; full_name: string | null }[];
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["op_project_tasks", projectId],
    queryFn: async () => {
      const { data: tasksData, error: tasksError } = await supabase
        .from("op_project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (tasksError) throw tasksError;

      const { data: subtasksData, error: subError } = await supabase
        .from("op_task_subtasks")
        .select("*")
        .in("task_id", (tasksData ?? []).map((t) => t.id));
      if (subError) throw subError;

      const subsByTask = (subtasksData ?? []).reduce<Record<string, OpTaskSubtask[]>>((acc, s) => {
        if (!acc[s.task_id]) acc[s.task_id] = [];
        acc[s.task_id].push(s);
        return acc;
      }, {});

      return (tasksData ?? []).map((t) => ({
        ...t,
        op_task_subtasks: subsByTask[t.id] ?? [],
      })) as TaskWithSubtasks[];
    },
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<OpProjectTask> & { title: string }) => {
      const { error } = await supabase.from("op_project_tasks").insert([{ ...data, project_id: projectId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks", projectId] });
      toast.success("משימה נוספה");
      setTaskDialogOpen(false);
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OpProjectTask> }) => {
      const { error } = await supabase.from("op_project_tasks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks", projectId] });
      toast.success("משימה עודכנה");
      setEditingTask(null);
      setTaskDialogOpen(false);
      resetForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks", projectId] });
      toast.success("משימה נמחקה");
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async ({ task_id, title }: { task_id: string; title: string }) => {
      const { error } = await supabase.from("op_task_subtasks").insert([{ task_id, title }]);
      if (error) throw error;
    },
    onSuccess: (_, { task_id }) => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks", projectId] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("op_task_subtasks").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks", projectId] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      status: "todo",
      assigned_to: "",
      start_date: "",
      end_date: "",
      notes: "",
    });
    setEditingTask(null);
  };

  const openEdit = (task: OpProjectTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      status: (task.status as TaskStatus) ?? "todo",
      assigned_to: task.assigned_to ?? "",
      start_date: task.start_date ?? "",
      end_date: task.end_date ?? "",
      notes: task.notes ?? "",
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (editingTask) {
      updateTaskMutation.mutate({
        id: editingTask.id,
        data: {
          title: formData.title,
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          notes: formData.notes || null,
        },
      });
    } else {
      createTaskMutation.mutate({
        title: formData.title,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">משימות</h3>
        <Button size="sm" onClick={() => { resetForm(); setTaskDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          הוסף משימה
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין משימות</p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {tasks.map((task) => (
            <AccordionItem key={task.id} value={task.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span>{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    ({TASK_STATUS_OPTIONS.find((o) => o.value === task.status)?.label ?? task.status})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      עריכה
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("למחוק משימה?")) deleteTaskMutation.mutate(task.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      מחיקה
                    </Button>
                  </div>
                  <TaskSubtasksInline
                    taskId={task.id}
                    subtasks={task.op_task_subtasks ?? []}
                    onAddSubtask={(title) => addSubtaskMutation.mutate({ task_id: task.id, title })}
                    onToggle={(id, done) => toggleSubtaskMutation.mutate({ id, done })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={taskDialogOpen} onOpenChange={(o) => { setTaskDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת *</Label>
              <Input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v as TaskStatus }))}>
                <SelectTrigger dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {TASK_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>אחראי</Label>
              <Select value={formData.assigned_to} onValueChange={(v) => setFormData((p) => ({ ...p, assigned_to: v }))}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {profiles.map((pr) => (
                    <SelectItem key={pr.id} value={pr.user_id}>{pr.full_name ?? pr.user_id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תאריך התחלה</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>תאריך סיום</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Input value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>ביטול</Button>
              <Button onClick={handleSaveTask}>{editingTask ? "שמור" : "הוסף"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskSubtasksInline({
  taskId,
  subtasks,
  onAddSubtask,
  onToggle,
}: {
  taskId: string;
  subtasks: OpTaskSubtask[];
  onAddSubtask: (title: string) => void;
  onToggle: (id: string, done: boolean) => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">תת-משימות</p>
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={s.done}
            onChange={(e) => onToggle(s.id, e.target.checked)}
          />
          <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.title}</span>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="תת-משימה חדשה"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTitle.trim()) {
              onAddSubtask(newTitle.trim());
              setNewTitle("");
            }
          }}
        />
        <Button size="sm" onClick={() => { if (newTitle.trim()) { onAddSubtask(newTitle.trim()); setNewTitle(""); } }}>
          הוסף
        </Button>
      </div>
    </div>
  );
}
