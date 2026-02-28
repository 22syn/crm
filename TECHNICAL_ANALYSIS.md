# Technical Analysis: Hadarya CRM

This document provides a high-level overview of the repository's architecture, identifies tech debt hotspots, and suggests areas for logic consolidation.

## 1. Architectural Overview

The application is a modern CRM and Sales Pipeline management tool built with a React/TypeScript frontend and a Supabase backend.

### Core Modules & Responsibilities

-   **`src/pages/`**: Primary orchestration layer. Components like `Leads.tsx` and `Deals.tsx` manage page-level state, integrate with React Query for data fetching, and coordinate between specialized UI components.
-   **`src/components/entity-page/`**: A shared abstraction layer for "Entity" pages (Leads, Deals, Contracts).
    -   `EntityPageShell`: Standardizes the layout, including view toggling (Kanban vs. Table).
    -   `EntityToolbar`: A unified component for search, filtering, and "Saved Views" management.
    -   `EntityKanban`: A generic Kanban component built on `@dnd-kit`.
-   **`src/integrations/supabase/`**: Contains the database client initialization and auto-generated TypeScript types, ensuring end-to-end type safety.
-   **`src/hooks/`**: Custom hooks for shared logic, such as `useTablePreferences` for persisting user view settings and the newly created `useEntityFilters` for centralized filter state management.
-   **`src/utils/`**: Domain-specific logic, including sorting utilities (`leadSort.ts`) and stage definitions.

---

## 2. Tech Debt Hotspots & Risky Areas

### God Components (`Leads.tsx`)
The `Leads.tsx` component is overly large (500+ lines), making it difficult to maintain. It mixes data fetching, complex mutations, bulk action state, and multi-view rendering logic.
*   **Risk**: Higher probability of regressions during refactoring and steep learning curve for new developers.

### Inconsistent Filtering Implementation
While `Leads.tsx` uses server-side filtering and pagination (via Supabase queries), `Deals.tsx` and `Quotes.tsx` often fetch the entire dataset and filter client-side.
*   **Risk**: Performance degradation as the database grows. Client-side filtering will eventually cause UI lag and high memory usage.

### Type Safety Gaps
There is a widespread use of `any` in business-critical areas, particularly in `Quotes.tsx` and `QuoteBuilder.tsx`.
*   **Risk**: Runtime errors that could have been caught at compile-time, especially during refactoring or when database schemas change.

### Duplicated UI Logic
The pattern for "Saved Views" and search debouncing was manually implemented in every page, leading to subtle differences in behavior and bugs (e.g., missing debouncing in some views).

---

## 3. Duplicate Logic & Suggested Consolidation

### `useEntityFilters` Hook (Implemented)
**Observed**: Every page manually handled search debouncing, preference syncing, and filter state management.
**Solution**: Extracted into `src/hooks/useEntityFilters.ts`. This hook now centralizes:
- Search debouncing.
- Integration with `useTablePreferences`.
- Filter normalization (handling inconsistent data from the database).

### `BulkActionToolbar` (Proposed)
**Observed**: Only `Leads.tsx` has a robust bulk action bar.
**Solution**: Extract this into a reusable component within `src/components/entity-page/` so it can be enabled for Deals and Contracts with minimal effort.

### Centralized Mutation Factory (Proposed)
**Observed**: Status updates and assignments use nearly identical `useMutation` logic across multiple pages.
**Solution**: Create a generic `useEntityMutations(tableName)` hook to standardize success toasts and cache invalidation patterns.

### Unified Sorting Utility (Proposed)
**Observed**: Manual sorting logic is scattered across page components.
**Solution**: Generalize `leadSort.ts` into a universal `sorting.ts` utility that works with any object containing standard fields like `created_at` or `title`.
