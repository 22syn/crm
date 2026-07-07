import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityToolbar } from "@/components/entity-page";
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
import { TaskFilters } from "@/components/ad-agency/TaskFilters";
import { TaskTable } from "@/components/ad-agency/TaskTable";
import { ColumnVisibilityDropdown } from "@/components/ad-agency/ColumnVisibilityDropdown";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type OpProjectTask = Tables<"op_project_tasks">;
type TaskStatus = Database["public"]["Enums"]["op_task_status"];

interface TaskWithProject extends OpProjectTask {
  op_projects?: { id: string; title: string } | null;
}

const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "לבצע" },
  { value: "in_progress", label: "בביצוע" },
  { value: "done", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];

export default function AdAgencyTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get("project") ?? "";
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    status: "todo" as TaskStatus,
    assigned_to: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["op_projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_projects").select("id, title").order("title");
      if (error) throw error;
      return data as { id: string; title: string }[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, user_id, full_name").order("full_name");
      if (error) throw error;
      return data as { id: string; user_id: string; full_name: string | null }[];
    },
  });

  const { data: tasksRaw = [], isLoading } = useQuery({
    queryKey: ["op_project_tasks_all", projectFilter],
    queryFn: async () => {
      let query = supabase
        .from("op_project_tasks")
        .select("*, op_projects(id, title)")
        .order("created_at", { ascending: false });
      if (projectFilter) {
        query = query.eq("project_id", projectFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as TaskWithProject[];
    },
  });

  const tasks = tasksRaw.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter.length === 0 || (t.status && statusFilter.includes(t.status));
    return matchSearch && matchStatus;
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<OpProjectTask> & { title: string; project_id: string }) => {
      const { error } = await supabase.from("op_project_tasks").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks_all"] });
      toast.success("משימה נוספה");
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OpProjectTask> }) => {
      const { error } = await supabase.from("op_project_tasks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks_all"] });
      toast.success("משימה עודכנה");
      setEditingTask(null);
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("op_project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_project_tasks_all"] });
      toast.success("משימה נמחקה");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      project_id: projectFilter || "",
      status: "todo",
      assigned_to: "",
      start_date: "",
      end_date: "",
      notes: "",
    });
    setEditingTask(null);
  };

  const openAdd = () => {
    setFormData({
      title: "",
      project_id: projectFilter || "",
      status: "todo",
      assigned_to: "",
      start_date: "",
      end_date: "",
      notes: "",
    });
    setEditingTask(null);
    setDialogOpen(true);
  };

  const openEdit = (task: TaskWithProject) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      project_id: task.project_id,
      status: (task.status as TaskStatus) ?? "todo",
      assigned_to: task.assigned_to ?? "",
      start_date: task.start_date ?? "",
      end_date: task.end_date ?? "",
      notes: task.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTask) {
      updateMutation.mutate({
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
      if (!formData.project_id) {
        toast.error("נא לבחור פרויקט");
        return;
      }
      createMutation.mutate({
        title: formData.title,
        project_id: formData.project_id,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
      });
    }
  };

  const hasActiveFilters = !!projectFilter || statusFilter.length > 0 || !!search.trim();
  const {
    visibleColumnIds,
    setVisibleColumns,
    resetToDefault,
    resetPending,
  } = useColumnVisibility("ad-agency-tasks");
  const TASK_COLUMNS = [
    { id: "title", header: "כותרת" },
    { id: "project", header: "פרויקט" },
    { id: "status", header: "סטטוס" },
    { id: "end_date", header: "תאריך סיום" },
  ];
  const handleClearFilters = () => {
    setSearchParams({});
    setStatusFilter([]);
    setSearch("");
  };

  const handleProjectChange = (v: string) => setSearchParams(v === "all" ? {} : { project: v });

  const taskToolbar = (
    <EntityToolbar
      hasFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
      renderMobileSearch={
        <TaskFilters
          variant="searchOnly"
          search={search}
          onSearchChange={setSearch}
          projectId={projectFilter}
          onProjectChange={handleProjectChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          projects={projects}
        />
      }
      renderMobileFilters={
        <TaskFilters
          variant="filtersOnly"
          search={search}
          onSearchChange={setSearch}
          projectId={projectFilter}
          onProjectChange={handleProjectChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          projects={projects}
        />
      }
      renderColumnVisibility={
        <ColumnVisibilityDropdown
          allColumns={TASK_COLUMNS}
          visibleIds={visibleColumnIds}
          onChange={setVisibleColumns}
          onReset={resetToDefault}
          resetPending={resetPending}
        />
      }
    >
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        projectId={projectFilter}
        onProjectChange={handleProjectChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        projects={projects}
      />
    </EntityToolbar>
  );

  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display font-semibold">משימות</h1>
            <p className="text-muted-foreground">ניהול משימות מקושרות לפרויקטים</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            משימה חדשה
          </Button>
        </div>

        {taskToolbar}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg border p-12 text-center text-muted-foreground">
            {projectFilter ? "אין משימות לפרויקט זה" : "אין משימות. הוסף משימה חדשה."}
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            onEdit={openEdit}
            onDelete={(task) => deleteMutation.mutate(task.id)}
            visibleColumnIds={visibleColumnIds}
          />
        )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>פרויקט</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, project_id: v }))}
                disabled={!!editingTask}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((p) => ({ ...p, status: v as TaskStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>אחראי</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(v) => setFormData((p) => ({ ...p, assigned_to: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((pr) => (
                    <SelectItem key={pr.id} value={pr.user_id}>
                      {pr.full_name ?? pr.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תאריך התחלה</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך סיום</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleSave}>{editingTask ? "שמור" : "הוסף"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
