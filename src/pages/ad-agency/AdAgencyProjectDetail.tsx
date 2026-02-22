import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ProjectDetailTabs } from "@/components/ad-agency/ProjectDetailTabs";
import { ProjectQuoteBuilder } from "@/components/ad-agency/ProjectQuoteBuilder";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;

export default function AdAgencyProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["op_project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("*, op_clients(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as OpProject & { op_clients?: { name: string } | null };
    },
    enabled: !!id,
  });

  if (!id) return null;
  if (isLoading || !project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ad-agency/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזרה לפרויקטים
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            {project.op_clients?.name && (
              <p className="text-muted-foreground">לקוח: {project.op_clients.name}</p>
            )}
          </div>
          <Button onClick={() => setQuoteBuilderOpen(true)} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            בנה הצעת מחיר
          </Button>
        </div>

        <ProjectDetailTabs project={project} />

        <ProjectQuoteBuilder
          open={quoteBuilderOpen}
          onOpenChange={setQuoteBuilderOpen}
          project={project}
          onSuccess={() => {}}
        />
      </div>
    </DashboardLayout>
  );
}
