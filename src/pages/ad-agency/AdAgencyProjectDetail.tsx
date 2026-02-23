import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectDetailTabs } from "@/components/ad-agency/ProjectDetailTabs";
import { ProjectQuoteBuilder } from "@/components/ad-agency/ProjectQuoteBuilder";
import { exportBudgetToExcel } from "@/lib/exportBudgetToExcel";
import { ArrowLeft, FileText, Loader2, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type OpProject = Tables<"op_projects">;

export default function AdAgencyProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quoteBuilderOpen, setQuoteBuilderOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("quote") === "1" && id) {
      setQuoteBuilderOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, id]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["op_project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("op_projects")
        .select("*, op_clients(name, payment_terms)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as OpProject & { op_clients?: { name: string; payment_terms?: string } | null };
    },
    enabled: !!id,
  });

  const { data: projectItemsForExport = [] } = useQuery({
    queryKey: ["op_project_items_export", id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("op_project_items")
        .select("quantity, days, prep_days, extras, op_items(type, price, section_id)")
        .eq("project_id", id);
      if (error) {
        // fallback when migration not run (prep_days, extras, section_id missing)
        const { data: fallback, error: err2 } = await supabase
          .from("op_project_items")
          .select("quantity, days, op_items(type, price)")
          .eq("project_id", id);
        if (err2) throw err2;
        return (fallback ?? []).map((r) => ({
          ...r,
          prep_days: 0,
          extras: 0,
          op_items: r.op_items ? { ...r.op_items, section_id: null } : null,
        }));
      }
      return rows as {
        quantity: number;
        days: number;
        prep_days?: number;
        extras?: number;
        op_items: { type: string; price: number; section_id?: string | null } | null;
      }[];
    },
    enabled: !!id && !!project,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["op_budget_sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("op_budget_sections").select("id, name").order("sort_order");
      if (error) return []; // table may not exist if migration not run
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!id && !!project,
  });
  const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

  const [exporting, setExporting] = useState(false);
  const handleExportExcel = async () => {
    if (!project) return;
    setExporting(true);
    try {
      const rowTotal = (p: number, q: number, d: number, prep: number, ext: number) =>
        p * q * (d ?? 1) * (1 + (prep ?? 0)) + (ext ?? 0);
      const itemsTotal = projectItemsForExport.reduce((sum, pi) => {
        const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
        const d = pi.days ?? 1;
        const prep = pi.prep_days ?? 0;
        const ext = pi.extras ?? 0;
        return sum + rowTotal(price, pi.quantity, d, prep, ext);
      }, 0);
      const proj = project as OpProject & {
        production_fee_percent?: number;
        insurance?: number;
        discount?: number;
      };
      const feePct = proj.production_fee_percent ?? 15;
      const insurance = proj.insurance ?? 0;
      const discount = proj.discount ?? 0;
      const productionFee = itemsTotal * (feePct / 100);
      const grandTotal = itemsTotal + insurance + productionFee - discount;

      const items = projectItemsForExport.map((pi) => {
        const price = pi.op_items?.price ? Number(pi.op_items.price) : 0;
        const d = pi.days ?? 1;
        const prep = pi.prep_days ?? 0;
        const ext = pi.extras ?? 0;
        const total = rowTotal(price, pi.quantity, d, prep, ext);
        const sectionId = pi.op_items?.section_id;
        return {
          sectionName: sectionId ? sectionMap.get(sectionId) ?? "" : "",
          type: pi.op_items?.type ?? "",
          pricePerDay: price,
          quantity: pi.quantity,
          days: d,
          prepDays: prep,
          extras: ext,
          rowTotal: total,
        };
      });

      await exportBudgetToExcel({
        project: {
          title: project.title,
          description: (project as OpProject & { description?: string }).description ?? undefined,
          locations_schedule: (project as OpProject & { locations_schedule?: string }).locations_schedule ?? undefined,
          deliverables: (project as OpProject & { deliverables?: string }).deliverables ?? undefined,
          notes: project.notes ?? undefined,
        },
        client: {
          name: project.op_clients?.name ?? "",
          payment_terms: project.op_clients?.payment_terms ?? undefined,
        },
        items,
        summary: { itemsTotal, insurance, productionFee, discount, grandTotal },
      });
    } finally {
      setExporting(false);
    }
  };

  if (!id) return null;
  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
    }

  return (
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} disabled={exporting} size="default">
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              ייצוא לאקסל
            </Button>
            <Button onClick={() => setQuoteBuilderOpen(true)} size="default">
              <FileText className="h-4 w-4 mr-2" />
              בנה הצעת מחיר
            </Button>
          </div>
        </div>

        <ProjectDetailTabs project={project} />

        <ProjectQuoteBuilder
          open={quoteBuilderOpen}
          onOpenChange={setQuoteBuilderOpen}
          project={project}
          onSuccess={() => {}}
        />
    </div>
  );
}
