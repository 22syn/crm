import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List, BarChart3 } from "lucide-react";

export type EntityViewMode = "kanban" | "table" | "report";

export interface EntityPageShellProps {
  /** Page title (e.g. "Leads", "Deals") */
  title: string;
  /** Subtitle below title */
  subtitle: string;
  /** Add button label (e.g. "New Lead"). If omitted, no button shown. */
  addButtonText?: string;
  /** Called when add button clicked */
  onAddClick?: () => void;
  /** Extra header actions (e.g. "Add 50 demo leads") — rendered before add button */
  headerActions?: ReactNode;

  /** Current view mode */
  viewMode: EntityViewMode;
  /** Called when user switches view */
  onViewModeChange: (mode: EntityViewMode) => void;

  /** Kanban/Pipeline content */
  renderKanban: ReactNode;
  /** Table content */
  renderTable: ReactNode;

  /** Optional toolbar (filters, tabs, etc.) — receives current viewMode. Shown above content for kanban/table. */
  renderToolbar?: (viewMode: EntityViewMode) => ReactNode;

  /** Optional Kanban tab label (default: "Pipeline") */
  kanbanTabLabel?: string;
  /** Optional Table tab label (default: "Table") */
  tableTabLabel?: string;
  /** Sprint 3: Optional count badge for Kanban tab */
  kanbanCount?: number;
  /** Sprint 3: Optional count badge for Table tab */
  tableCount?: number;
  /** Optional Report tab label (default: "Report") */
  reportTabLabel?: string;

  /** Text direction: "rtl" for Hebrew/Arabic pages (e.g. ad-agency) */
  dir?: "rtl" | "ltr";

  /** Show Report tab (e.g. Deals) */
  showReportTab?: boolean;
  /** Report tab content */
  renderReport?: ReactNode;

  /** Show loading state instead of content */
  isLoading?: boolean;
  /** Show empty state instead of content */
  isEmpty?: boolean;
  /** Custom empty state (overrides default message) */
  renderEmptyState?: ReactNode;

  /** Additional content to render after the main area (e.g. dialogs, modals) */
  children?: ReactNode;
}

export function EntityPageShell({
  title,
  subtitle,
  addButtonText,
  onAddClick,
  headerActions,
  viewMode,
  onViewModeChange,
  renderKanban,
  renderTable,
  renderToolbar,
  kanbanTabLabel = "Pipeline",
  tableTabLabel = "Table",
  reportTabLabel = "Report",
  kanbanCount,
  tableCount,
  dir,
  showReportTab,
  renderReport,
  isLoading,
  isEmpty,
  renderEmptyState,
  children,
}: EntityPageShellProps) {
  const handleViewChange = (value: string) => {
    if (value && ["kanban", "table", "report"].includes(value)) {
      onViewModeChange(value as EntityViewMode);
    }
  };

  return (
    <div className="space-y-section min-w-0 overflow-x-hidden" dir={dir}>
        {/* Header — on mobile the breadcrumb bar already shows the page title (e.g. "Leads"), so we hide title/subtitle there to avoid duplication */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!(headerActions || (addButtonText && onAddClick)) ? "hidden md:flex" : ""}`}
        >
          <div className="min-w-0 hidden md:block">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>
          {(headerActions || (addButtonText && onAddClick)) && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 md:flex-1 md:justify-end">
              {headerActions}
              {addButtonText && onAddClick && (
                <Button variant="accent" className="rounded-lg shrink-0" onClick={onAddClick}>
                  <Plus className="h-4 w-4 mr-2 shrink-0" />
                  {addButtonText}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* View toggle + Toolbar + Content — matches Leads */}
        <Tabs value={viewMode} onValueChange={handleViewChange} className="w-full" dir={dir}>
          <TabsList className="w-full sm:w-auto justify-start text-white [&_[role=tab]]:text-white">
            <TabsTrigger value="kanban" className="gap-2 text-white data-[state=active]:text-accent-action">
              <LayoutGrid className="h-4 w-4" />
              {kanbanTabLabel}
              {kanbanCount != null && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs font-normal bg-white/15 text-white/90 border-0">
                  {kanbanCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 text-white data-[state=active]:text-accent-action">
              <List className="h-4 w-4" />
              {tableTabLabel}
              {tableCount != null && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs font-normal bg-white/15 text-white/90 border-0">
                  {tableCount}
                </Badge>
              )}
            </TabsTrigger>
            {showReportTab && (
              <TabsTrigger value="report" className="gap-2 text-white data-[state=active]:text-accent-action">
                <BarChart3 className="h-4 w-4" />
                {reportTabLabel}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            {renderToolbar?.("kanban")}
            <div className={renderToolbar?.("kanban") ? "mt-4" : undefined}>
              {isEmpty && renderEmptyState ? (
                renderEmptyState
              ) : isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
              ) : (
                renderKanban
              )}
            </div>
          </TabsContent>
          <TabsContent value="table" className="mt-4">
            {renderToolbar?.("table")}
            <div className={renderToolbar?.("table") ? "mt-4" : undefined}>
              {isEmpty && renderEmptyState ? (
                renderEmptyState
              ) : isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
              ) : (
                renderTable
              )}
            </div>
          </TabsContent>
          {showReportTab && renderReport && (
            <TabsContent value="report" className="mt-4">
              {renderReport}
            </TabsContent>
          )}
        </Tabs>

        {children}
      </div>
  );
}
