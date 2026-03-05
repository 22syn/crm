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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookmarkPlus, RotateCcw, Pencil, Trash2, X, SlidersHorizontal } from "lucide-react";
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
  onApplyView?: (filters: Record<string, any>) => void;
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

  /** Mobile: Search slot (e.g. LeadFilters variant="searchOnly") */
  renderMobileSearch?: ReactNode;
  /** Mobile: Filters slot for Sheet (e.g. LeadFilters variant="filtersOnly") */
  renderMobileFilters?: ReactNode;
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
  renderMobileSearch,
  renderMobileFilters,
}: EntityToolbarProps) {
  const [renameViewId, setRenameViewId] = useState<string | null>(null);
  const [renameViewName, setRenameViewName] = useState("");

  const showSavedViews =
    savedViews.length > 0 &&
    onApplyView != null &&
    onRenameView != null &&
    onDeleteView != null;

  const showViews = quickViews.length > 0 || showSavedViews;

  const Divider = () => (
    <div className="w-px h-5 bg-border/60 shrink-0 mx-1.5" aria-hidden />
  );

  const VerticalDivider = () => (
    <div className="h-px w-full bg-border/60 shrink-0 my-2" aria-hidden />
  );

  const useMobileLayout = renderMobileSearch != null && renderMobileFilters != null;
  const sheetSide =
    typeof document !== "undefined" && document.documentElement.dir === "rtl"
      ? "left"
      : "right";

  const desktopToolbar = (
    <div className="flex flex-nowrap items-center gap-0 overflow-x-auto">
        {/* Group 1: Filters */}
        <div className="flex items-center gap-2 shrink-0 pr-1">
          {children}
        </div>

        {/* Group 2: Views */}
        {showViews && (
          <>
            <Divider />
            <div className="flex items-center gap-2 shrink-0 px-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0 h-9 rounded-md font-normal">
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
          </>
        )}

        {/* Group 3: Sort */}
        {renderSort && (
          <>
            <Divider />
            <div className="flex items-center gap-2 shrink-0 px-1.5">
              {renderSort}
            </div>
          </>
        )}

        {/* Group 4: Save / Reset */}
        {(onSaveView || onReset) && (
          <>
            <Divider />
            <div className="flex items-center gap-1.5 shrink-0 px-1.5">
              {onSaveView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveView}
                  disabled={savePending}
                  className="shrink-0 h-9 rounded-md"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="hidden sm:inline">Save preferences</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              )}
              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  disabled={resetPending}
                  className="shrink-0 h-9 rounded-md"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5 shrink-0" />
                  <span className="hidden sm:inline">Reset to default</span>
                  <span className="sm:hidden">Reset</span>
                </Button>
              )}
            </div>
          </>
        )}

        {/* Group 5: Clear filters */}
        {hasFilters && onClearFilters && (
          <>
            <Divider />
            <div className="flex items-center shrink-0 pl-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="shrink-0 h-9 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1.5 shrink-0" />
                Clear filters
              </Button>
            </div>
          </>
        )}

        {/* Legacy: renderExtra (for backward compat during migration) */}
        {renderExtra && (
          <>
            <Divider />
            <div className="shrink-0 pl-1.5">{renderExtra}</div>
          </>
        )}
      </div>
  );

  const mobileToolbar = useMobileLayout ? (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">{renderMobileSearch}</div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 h-9 rounded-md font-normal gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            Filters
            {hasFilters && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                •
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side={sheetSide as "left" | "right"} className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4">
            {renderMobileFilters}
            {(showViews || renderSort || onSaveView || onReset || (hasFilters && onClearFilters)) && (
              <>
                <VerticalDivider />
                {showViews && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Views</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-between h-9 rounded-md font-normal">
                          {showSavedViews ? `Views (${savedViews.length})` : "Views"}
                          <span className="sr-only">Open</span>
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
                {renderSort && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Sort</span>
                    {renderSort}
                  </div>
                )}
                {(onSaveView || onReset) && (
                  <div className="flex gap-2">
                    {onSaveView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onSaveView}
                        disabled={savePending}
                        className="flex-1 h-9 rounded-md"
                      >
                        <BookmarkPlus className="h-4 w-4 mr-1.5 shrink-0" />
                        Save
                      </Button>
                    )}
                    {onReset && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        disabled={resetPending}
                        className="flex-1 h-9 rounded-md"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5 shrink-0" />
                        Reset
                      </Button>
                    )}
                  </div>
                )}
                {hasFilters && onClearFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="w-full h-9 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1.5 shrink-0" />
                    Clear filters
                  </Button>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ) : null;

  return (
    <div className="rounded-lg border border-border/60 bg-card/80 px-4 py-2.5">
      {useMobileLayout && (
        <>
          <div className="md:hidden">{mobileToolbar}</div>
          <div className="hidden md:block">{desktopToolbar}</div>
        </>
      )}
      {!useMobileLayout && desktopToolbar}

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
