import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdAgencyProjects() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-display font-semibold">פרויקטים</h1>
        <p className="text-body text-muted-foreground">רשימת פרויקטים + Kanban</p>
      </div>
    </DashboardLayout>
  );
}
