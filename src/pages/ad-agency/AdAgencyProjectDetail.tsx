import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdAgencyProjectDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ad-agency/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזרה לפרויקטים
          </Link>
        </Button>
        <h1 className="text-display font-semibold">דף פרויקט</h1>
        <p className="text-body text-muted-foreground">פרויקט {id} – תקציב, פריטים, משימות</p>
      </div>
    </DashboardLayout>
  );
}
