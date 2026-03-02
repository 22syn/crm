# hadaryaCRM — Compliance Audit (2026-03-02)

**פרויקט:** Demo CRM. Path: 02-projects/hadaryaCRM

## בדיקה נדרשת

### 1. Folders: kebab-case

| Folder | Status |
|--------|--------|
| `entity-page` | ✓ OK |
| `ad-agency` | ✓ OK |
| `data-table` | ✓ OK |
| `data` | ✓ OK (single word) |

**Base לא מגדיר** — hadaryaCRM-standards adds: Folders kebab-case. All feature folders comply.

### 2. Components, Hooks, Lib — תואמים ל-base

| Type | Pattern | Examples |
|------|---------|----------|
| Components | PascalCase | `LeadCard`, `EntityPageShell`, `LeadsHeaderActions` |
| Hooks | `use` + PascalCase | `useLeads`, `useCrmTeam`, `useColumnVisibility` |
| Lib / utils | camelCase | `escapeIlike`, `quotesByLeadId`, `arrayToRecord`, `getLeadPriority` |

**Note:** `use-toast`, `use-mobile` use kebab-case filenames (shadcn convention) — exports still `useToast` / hook names.

### 3. `any` audit

- **Grep:** `: any` / `as any` — **0 matches** in src/

### 4. Exhaustive switch

- `src/utils/leadSort.ts` — switch on `sortField` covers all `SortField` union members
- Other switches (QuoteTable, DealTable, etc.) — existing, not modified this refactor

### 5. Imports at top

- All modified files: imports at top, no inline imports

## Summary

| Check | Result |
|-------|--------|
| Folders kebab-case | ✓ Pass |
| Components PascalCase | ✓ Pass |
| Hooks use+PascalCase | ✓ Pass |
| Lib camelCase | ✓ Pass |
| No `any` | ✓ Pass |
| Exhaustive switch | ✓ Pass (where applicable) |
| Imports at top | ✓ Pass |
