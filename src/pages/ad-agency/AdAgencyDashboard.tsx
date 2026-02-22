import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdAgencyDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-display font-semibold">דשבורד משרד פרסום</h1>
        <p className="text-body text-muted-foreground">סיכום תקציבים, פרויקטים פעילים, משימות קריטיות</p>
      </div>
    </DashboardLayout>
  );
}
