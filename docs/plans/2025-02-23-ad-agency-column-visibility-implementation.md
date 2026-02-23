# Ad Agency Column Visibility — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let each user customize which columns appear in each Ad Agency table (clients, projects, items, tasks) and persist that preference per user.

**Architecture:** Extend `user_table_preferences` with `column_visibility jsonb`; add `useColumnVisibility` hook; add `ColumnVisibilityDropdown` component; integrate into EntityToolbar and all four Ad Agency tables.

**Tech Stack:** React, TanStack Query, Supabase, shadcn/ui

---

## Task 1: Migration — add column_visibility to user_table_preferences

**Files:**
- Create: `supabase/migrations/20260223140000_add_column_visibility.sql`
- Regenerate types (or manually update): `src/integrations/supabase/types.ts`

**Step 1: Create migration**

Create `supabase/migrations/20260223140000_add_column_visibility.sql`:

```sql
-- Add column_visibility for per-user table column show/hide preferences
ALTER TABLE public.user_table_preferences
  ADD COLUMN IF NOT EXISTS column_visibility jsonb DEFAULT NULL;

COMMENT ON COLUMN public.user_table_preferences.column_visibility IS 'Array of column ids to show, e.g. ["name","status"]. NULL = show all columns.';
```

**Step 2: Run migration**

Run: `npx supabase db push` (or `supabase migration up` in local dev)
Expected: migration applied successfully

**Step 3: Update Supabase types**

Run: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`  
Or manually add `column_visibility: Json | null` to `user_table_preferences` Row/Insert/Update.

**Step 4: Commit**

```bash
git add supabase/migrations/20260223140000_add_column_visibility.sql src/integrations/supabase/types.ts
git commit -m "feat(db): add column_visibility to user_table_preferences"
```

---

## Task 2: useColumnVisibility hook

**Files:**
- Create: `src/hooks/useColumnVisibility.ts`
- Test: manual QA after integration

**Step 1: Create hook**

Create `src/hooks/useColumnVisibility.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useColumnVisibility(pageKey: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["column-visibility", pageKey, user?.id ?? ""];

  const {
    data: visibleIds = null,
    isLoading,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<string[] | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_table_preferences")
        .select("column_visibility")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .eq("view_name", "default")
        .maybeSingle();
      if (error) throw error;
      const raw = data?.column_visibility;
      if (!raw || !Array.isArray(raw)) return null;
      return raw as string[];
    },
    enabled: !!user?.id,
  });

  const setMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_table_preferences").upsert(
        {
          user_id: user.id,
          page_key: pageKey,
          view_name: "default",
          filters: {},
          column_visibility: ids,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,page_key,view_name",
        }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("לא ניתן לשמור העדפות עמודות"),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { data: row } = await supabase
        .from("user_table_preferences")
        .select("id")
        .eq("user_id", user.id)
        .eq("page_key", pageKey)
        .eq("view_name", "default")
        .maybeSingle();
      if (row?.id) {
        const { error } = await supabase
          .from("user_table_preferences")
          .update({ column_visibility: null, updated_at: new Date().toISOString() })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("לא ניתן לאפס"),
  });

  return {
    visibleColumnIds: visibleIds,
    isLoading: isLoading && !!user?.id,
    setVisibleColumns: (ids: string[]) => setMutation.mutate(ids),
    setVisibleColumnsPending: setMutation.isPending,
    resetToDefault: () => resetMutation.mutate(),
    resetPending: resetMutation.isPending,
  };
}
```

**Note:** If upsert `onConflict` does not match the unique index name, use the actual constraint. The unique index is `idx_user_table_preferences_user_page_view` on `(user_id, page_key, view_name)`. Supabase upsert uses `user_id,page_key,view_name` as conflict columns.

**Step 2: Verify unique constraint**

Check `supabase/migrations/20260218000000_user_table_views.sql` — unique index is on `(user_id, page_key, view_name)`. Use:

```ts
// In upsert:
{
  onConflict: "user_id,page_key,view_name",
}
```

Postgres requires a unique constraint or primary key for upsert. If the table has a unique index, the conflict target must reference it. Verify the migration that added view_name.

**Step 3: Commit**

```bash
git add src/hooks/useColumnVisibility.ts
git commit -m "feat: add useColumnVisibility hook"
```

---

## Task 3: ColumnVisibilityDropdown component

**Files:**
- Create: `src/components/ad-agency/ColumnVisibilityDropdown.tsx`
- Modify: uses `@/components/ui/dropdown-menu`, `Checkbox`, `Button`, `Columns` icon from lucide-react

**Step 1: Create component**

Create `src/components/ad-agency/ColumnVisibilityDropdown.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns, RotateCcw } from "lucide-react";

export interface ColumnDef {
  id: string;
  header: string;
}

interface ColumnVisibilityDropdownProps {
  allColumns: ColumnDef[];
  visibleIds: string[] | null;
  onChange: (ids: string[]) => void;
  onReset: () => void;
  resetPending?: boolean;
}

export function ColumnVisibilityDropdown({
  allColumns,
  visibleIds,
  onChange,
  onReset,
  resetPending = false,
}: ColumnVisibilityDropdownProps) {
  const effectiveVisible = visibleIds ?? allColumns.map((c) => c.id);

  const toggle = (id: string) => {
    const isVisible = effectiveVisible.includes(id);
    if (isVisible && effectiveVisible.length <= 1) return; // Keep at least one
    if (isVisible) {
      onChange(effectiveVisible.filter((x) => x !== id));
    } else {
      const idx = allColumns.findIndex((c) => c.id === id);
      const next = [...effectiveVisible];
      next.splice(idx, 0, id);
      onChange(next);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0 h-9 rounded-md font-normal">
          <Columns className="h-4 w-4 mr-1.5 shrink-0" />
          עמודות
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {allColumns.map((col) => (
          <label
            key={col.id}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm text-sm"
          >
            <Checkbox
              checked={effectiveVisible.includes(col.id)}
              onCheckedChange={() => toggle(col.id)}
            />
            {col.header}
          </label>
        ))}
        <DropdownMenuSeparator />
        <button
          type="button"
          onClick={onReset}
          disabled={resetPending || visibleIds === null}
          className="flex items-center gap-2 px-2 py-1.5 w-full text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          איפוס לברירת מחדל
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ad-agency/ColumnVisibilityDropdown.tsx
git commit -m "feat: add ColumnVisibilityDropdown component"
```

---

## Task 4: EntityToolbar — add renderColumnVisibility slot

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1: Add prop**

In `EntityToolbarProps`, add:

```typescript
/** Column visibility dropdown (e.g. Ad Agency tables) */
renderColumnVisibility?: ReactNode;
```

**Step 2: Add to desktop toolbar**

After Group 5 (Clear filters) and before renderExtra, add:

```tsx
{/* Group: Column visibility */}
{renderColumnVisibility && (
  <>
    <Divider />
    <div className="shrink-0 pl-1.5">{renderColumnVisibility}</div>
  </>
)}
```

**Step 3: Add to mobile sheet**

Inside the mobile Sheet, after `renderSort` and before `(onSaveView || onReset)`, add a section for `renderColumnVisibility` if provided.

**Step 4: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat: add renderColumnVisibility slot to EntityToolbar"
```

---

## Task 5: ClientTable — support visible column filtering

**Files:**
- Modify: `src/components/ad-agency/ClientTable.tsx`
- Modify: `src/pages/ad-agency/AdAgencyClients.tsx`

**Step 1: Update ClientTable props**

Add optional prop `visibleColumnIds?: string[] | null`. When provided, filter `columns` to only those whose `id` is in `visibleColumnIds` (or show all if null/empty).

```typescript
interface ClientTableProps {
  // ...existing
  visibleColumnIds?: string[] | null;
}
```

In ClientTable, after defining `columns`, filter:

```typescript
const displayedColumns = useMemo(() => {
  if (!visibleColumnIds || visibleColumnIds.length === 0) return columns;
  const set = new Set(visibleColumnIds);
  const filtered = columns.filter((c) => set.has(c.id));
  return filtered.length > 0 ? filtered : columns; // fallback
}, [columns, visibleColumnIds]);
```

Use `displayedColumns` instead of `columns` in DataTable.

**Step 2: Wire AdAgencyClients**

- Import `useColumnVisibility`, `ColumnVisibilityDropdown`, `EntityToolbar`
- Use `useColumnVisibility("ad-agency-clients")`
- Pass `renderColumnVisibility={<ColumnVisibilityDropdown allColumns={CLIENT_COLUMNS} visibleIds={...} onChange={...} onReset={...} />}` to EntityToolbar
- Define `CLIENT_COLUMNS` as `[{id:"name",header:"שם"}, {id:"status",header:"סטטוס"}, ...]` matching ClientTable columns
- Pass `visibleColumnIds` to ClientTable

**Step 3: Commit**

```bash
git add src/components/ad-agency/ClientTable.tsx src/pages/ad-agency/AdAgencyClients.tsx
git commit -m "feat: column visibility for Ad Agency Clients"
```

---

## Task 6: ProjectTable + AdAgencyProjects

**Files:**
- Modify: `src/components/ad-agency/ProjectTable.tsx`
- Modify: `src/pages/ad-agency/AdAgencyProjects.tsx`

**Step 1:** Same pattern as Task 5 — add `visibleColumnIds` to ProjectTable, define PROJECT_COLUMNS, wire useColumnVisibility("ad-agency-projects"), renderColumnVisibility, pass to EntityToolbar and ProjectTable.

**Step 2: Commit**

```bash
git add src/components/ad-agency/ProjectTable.tsx src/pages/ad-agency/AdAgencyProjects.tsx
git commit -m "feat: column visibility for Ad Agency Projects"
```

---

## Task 7: ItemTable + AdAgencyItems

**Files:**
- Modify: `src/components/ad-agency/ItemTable.tsx`
- Modify: `src/pages/ad-agency/AdAgencyItems.tsx`

**Step 1:** Same pattern — `visibleColumnIds`, ITEM_COLUMNS, useColumnVisibility("ad-agency-items"), renderColumnVisibility.

**Step 2: Commit**

```bash
git add src/components/ad-agency/ItemTable.tsx src/pages/ad-agency/AdAgencyItems.tsx
git commit -m "feat: column visibility for Ad Agency Items"
```

---

## Task 8: TaskTable + AdAgencyTasks

**Files:**
- Modify: `src/components/ad-agency/TaskTable.tsx`
- Modify: `src/pages/ad-agency/AdAgencyTasks.tsx`

**Step 1:** Same pattern — `visibleColumnIds`, TASK_COLUMNS, useColumnVisibility("ad-agency-tasks"), renderColumnVisibility.

**Step 2: Commit**

```bash
git add src/components/ad-agency/TaskTable.tsx src/pages/ad-agency/AdAgencyTasks.tsx
git commit -m "feat: column visibility for Ad Agency Tasks"
```

---

## Task 9: Mobile — renderColumnVisibility in Sheet

**Files:**
- Modify: `src/components/entity-page/EntityToolbar.tsx`

**Step 1:** In the mobile Sheet content, add renderColumnVisibility section (between filters and views/sort), so the column picker is available on mobile too.

**Step 2: Commit**

```bash
git add src/components/entity-page/EntityToolbar.tsx
git commit -m "feat: column visibility in mobile toolbar"
```

---

## Task 10: Verify upsert conflict

**Files:**
- Modify: `src/hooks/useColumnVisibility.ts`

**Step 1:** Verify that `user_table_preferences` has a unique constraint on `(user_id, page_key, view_name)`. If the upsert fails with "conflict target" error, check `\d user_table_preferences` and use the correct conflict columns. Supabase expects the constraint name or the columns. For `CREATE UNIQUE INDEX ... ON (user_id, page_key, view_name)`, the conflict is on those three columns.

**Step 2:** If needed, adjust the upsert call. Some Supabase versions use `ignoreDuplicates` or require a different format.

---

## Manual QA Checklist

1. Navigate to `/ad-agency/clients` — all columns visible, "עמודות" button in toolbar
2. Click "עמודות", uncheck one column — it hides
3. Refresh page — preference persists
4. Click "איפוס לברירת מחדל" — all columns return
5. Repeat for projects, items, tasks
6. Log in as different user — verify separate preferences
