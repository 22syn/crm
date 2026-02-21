import { Fragment, ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookmarkPlus, RotateCcw, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export interface SavedView {
  id: string;
  view_name: string;
  filters: Record<string, unknown>;
}

export interface QuickViewItem {
  value: string;
  label: string;
  onSelect: () => void;
}

export interface EntityToolbarProps {
  /** Filters UI (LeadFilters, DealFilters, QuoteFilters, etc.) */
  children: ReactNode;

  /** Save preferences - when provided, shows Save button */
  onSaveView?: () => void;
  savePending?: boolean;

  /** Reset to default - when provided, shows Reset button */
  onReset?: () => void;
  resetPending?: boolean;

  /** Saved views - when provided, shows Saved views dropdown */
  savedViews?: SavedView[];
  onApplyView?: (filters: Record<string, string>) => void;
  onRenameView?: (id: string, name: string) => Promise<void>;
  onDeleteView?: (id: string) => void | Promise<void>;

  /** Quick views (e.g. My pipeline, Unassigned) — merged with Saved views in one dropdown */
  quickViews?: QuickViewItem[];

  /** Sort control slot — rendered between Views and Save/Reset */
  renderSort?: ReactNode;

  /** When true, shows Clear filters button */
  hasFilters?: boolean;

  /** Called when Clear filters clicked */
  onClearFilters?: () => void;

  /** Extra content (e.g. Quick views Select) - optional, deprecated in favor of quickViews */
  renderExtra?: ReactNode;
}

export function EntityToolbar({
  children,
  onSaveView,
  savePending = false,
  onReset,
  resetPending = false,
  savedViews = [],
  onApplyView,
  onRenameView,
  onDeleteView,
  quickViews = [],
  renderSort,
  hasFilters = false,
  onClearFilters,
  renderExtra,
}: EntityToolbarProps) {
  const [renameViewId, setRenameViewId] = useState<string | null>(null);
  const [renameViewName, setRenameViewName] = useState("");

  const showSavedViews =
    savedViews.length > 0 &&
    onApplyView != null &&
    onRenameView != null &&
    onDeleteView != null;

  const showViews = quickViews.length > 0 || showSavedViews;

  return (
    <div className="flex flex-wrap items-center gap-2 gap-y-3">
      {/* Group 1: Filters */}
      <div className="flex flex-wrap items-center gap-2 pr-2 mr-2 border-r border-muted/50 max-md:border-r-0 max-md:pr-0 max-md:mr-0">
        {children}
      </div>

      {/* Group 2: Views */}
      {showViews && (
        <div className="flex items-center gap-2 pr-2 mr-2 border-r border-muted/50 max-md:border-r-0 max-md:pr-0 max-md:mr-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 rounded-sm">
                {showSavedViews ? `Views (${savedViews.length})` : "Views"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {quickViews.map((qv) => (
                <DropdownMenuItem key={qv.value} onSelect={qv.onSelect}>
                  {qv.label}
                </DropdownMenuItem>
              ))}
              {quickViews.length > 0 && showSavedViews && <DropdownMenuSeparator />}
              {showSavedViews &&
                savedViews.map((v) => {
                  const displayName = v.view_name === "default" ? "Default" : v.view_name;
                  return (
                    <Fragment key={v.id}>
                      <DropdownMenuItem
                        onSelect={() => onApplyView!(v.filters as Record<string, string>)}
                      >
                        {displayName}
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="pl-6 text-muted-foreground">
                          Manage "{displayName}"
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setRenameViewId(v.id);
                              setRenameViewName(displayName);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={async (e) => {
                              e.preventDefault();
                              try {
                                await onDeleteView!(v.id);
                                toast.success("View deleted");
                              } catch {
                                toast.error("Failed to delete view");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </Fragment>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Group 3: Sort */}
      {renderSort && (
        <div className="flex items-center gap-2 pr-2 mr-2 border-r border-muted/50 max-md:border-r-0 max-md:pr-0 max-md:mr-0">
          {renderSort}
        </div>
      )}

      {/* Group 4: Save / Reset */}
      {(onSaveView || onReset) && (
        <div className="flex flex-wrap items-center gap-2 pr-2 mr-2 border-r border-muted/50 max-md:border-r-0 max-md:pr-0 max-md:mr-0">
          {onSaveView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveView}
              disabled={savePending}
              className="shrink-0 rounded-sm max-md:text-xs max-md:px-2"
            >
              <BookmarkPlus className="h-4 w-4 mr-1 shrink-0" />
              <span className="hidden md:inline">Save preferences</span>
              <span className="md:hidden">Save</span>
            </Button>
          )}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={resetPending}
              className="shrink-0 rounded-sm max-md:text-xs max-md:px-2"
            >
              <RotateCcw className="h-4 w-4 mr-1 shrink-0" />
              <span className="hidden md:inline">Reset to default</span>
              <span className="md:hidden">Reset</span>
            </Button>
          )}
        </div>
      )}

      {/* Group 5: Clear filters */}
      {hasFilters && onClearFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="shrink-0 rounded-sm max-md:text-xs max-md:px-2"
          >
            <X className="h-4 w-4 mr-1 max-md:mr-0" />
            Clear filters
          </Button>
        </div>
      )}

      {/* Legacy: renderExtra (for backward compat during migration) */}
      {renderExtra}

      {renameViewId && onRenameView && (
        <Dialog
          open={!!renameViewId}
          onOpenChange={(open) => !open && setRenameViewId(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename view</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="entity-rename-view-name">View name</Label>
              <Input
                id="entity-rename-view-name"
                value={renameViewName}
                onChange={(e) => setRenameViewName(e.target.value)}
                placeholder="View name"
                className="rounded-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameViewId) {
                    onRenameView(renameViewId, renameViewName).then(() => {
                      setRenameViewId(null);
                      setRenameViewName("");
                    });
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRenameViewId(null);
                  setRenameViewName("");
                }}
                className="rounded-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (renameViewId) {
                    onRenameView(renameViewId, renameViewName).then(() => {
                      setRenameViewId(null);
                      setRenameViewName("");
                    });
                  }
                }}
                disabled={!renameViewName.trim()}
                className="rounded-sm"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
