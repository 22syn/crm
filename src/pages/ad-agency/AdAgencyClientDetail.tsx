import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdAgencyClientDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ad-agency/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזרה ללקוחות
          </Link>
        </Button>
        <h1 className="text-display font-semibold">דף לקוח</h1>
        <p className="text-body text-muted-foreground">פרטי לקוח {id}</p>
      </div>
    </DashboardLayout>
  );
}
