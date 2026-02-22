import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdAgencyClients() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-display font-semibold">לקוחות</h1>
        <p className="text-body text-muted-foreground">רשימת לקוחות משרד הפרסום</p>
      </div>
    </DashboardLayout>
  );
}
