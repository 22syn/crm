import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdAgencyItems() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-display font-semibold">פריטים</h1>
        <p className="text-body text-muted-foreground">קטלוג פריטים – סוג ומחיר</p>
      </div>
    </DashboardLayout>
  );
}
