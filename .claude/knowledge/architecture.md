# CRM — Architecture Deep-Dive

## Component organization

Components are grouped by domain under `src/components/`:

| Folder | Contents |
|--------|----------|
| `entity-page/` | Shared shell: `EntityPageShell`, `EntityKanban`, `EntityKanbanColumn`, `EntityToolbar` |
| `layout/` | `DashboardLayout`, `DashboardSidebar`, `DashboardHeader`, `DashboardBreadcrumb`, `ProtectedLayout`, `ThemeSelector` |
| `leads/` | `LeadTable`, `LeadKanban`, `LeadCard`, `LeadDialog`, `LeadFilters`, `LeadComments`, `LeadDialogsOrchestrator`, `StatusPill`, `LeadsHeaderActions`, skeleton + empty states |
| `deals/` | `DealTable`, `DealKanban`, `DealCard`, `DealDialog`, `DealFilters` |
| `quotes/` | `QuoteTable`, `QuoteKanban`, `QuoteKanbanCard`, `QuoteBuilder`, `QuoteFilters`, `QuotePreview` |
| `designs/` | `DesignRequestTable`, `DesignRequestKanban`, `DesignRequestKanbanCard` |
| `customers/` | `CustomerTable`, `CustomerFilters` |
| `suppliers/` | `SupplierTable`, `SupplierDialog`, `SupplierFilters` |
| `products/` | `ProductCard` |
| `dashboard/` | `StatsCards`, `ActivityFeed`, `SalesPipelineChart`, `MonthlyRevenueChart`, `LeadsBySourceChart`, `OrdersChart`, `TopPerformingAgents`, `QuickActions` |
| `ad-agency/` | Full ad agency module components (see below) |
| `settings/` | `MembersTable`, `ModulePermissionsSelector` |
| `data-table/` | Generic `DataTable` (TanStack Table) |
| `ui/` | shadcn primitives — **do not modify** |

## Entity pattern

All list-view pages (Leads, Deals, Contracts, DesignRequests) follow the same pattern:

```
Page (e.g. Leads.tsx)
└── EntityPageShell
    ├── EntityToolbar          ← search, filter, sort, view toggle
    ├── [Table view]           ← e.g. LeadTable (uses DataTable)
    └── [Kanban view]          ← e.g. LeadKanban (uses EntityKanban)
         └── EntityKanbanColumn[]
              └── [Card]       ← e.g. LeadCard
```

When building a new list page: wrap in `EntityPageShell`, pass a table component and a kanban component.

## Ad Agency module

The `ad_agency` module is a separate sub-app under `/ad-agency/`:

```
AdAgencyDashboard     /ad-agency
AdAgencyClients       /ad-agency/clients
AdAgencyClientDetail  /ad-agency/clients/:id
AdAgencyProjects      /ad-agency/projects
AdAgencyProjectDetail /ad-agency/projects/:id
AdAgencyTasks         /ad-agency/tasks
AdAgencyItems         /ad-agency/items
```

Key components: `ClientTable`, `ClientDialog`, `ProjectCard`, `ProjectDialog`, `ProjectDetailTabs`, `ProjectKanban`, `ProjectQuoteBuilder`, `TaskTable`, `ItemTable`, `ApproveBudgetDialog`.

Access guard: always check `canAccessModule("ad_agency")` before rendering ad_agency content.

## Hooks

| Hook | Purpose |
|------|---------|
| `useLeads` | Fetch + manage leads (list, create, update, delete) |
| `useCrmTeam` | Fetch team members (for assignment dropdowns) |
| `useCompanySettings` | Fetch company settings per module (name, address, etc.) |
| `useTablePreferences` | Persist column visibility + sort in localStorage |
| `useColumnVisibility` | Manage which columns are shown |
| `use-mobile` | Media query hook for responsive behavior |

## Contexts

- `AuthContext` — session, user, moduleRoles, superAdmin, loading, signOut, `canAccessModule()`, `isModuleAdmin()`
- `DashboardContext` — dashboard-level state (date range filters, etc.)

## Global command palette

`GlobalCommandPalette` is rendered at app root (only when authenticated). It listens for `Cmd+K` / `Ctrl+K`. Add new commands there when adding new major features.

## Lazy loading

All pages are lazy-loaded via `React.lazy()` + `Suspense` with a centered spinner fallback. New pages must follow this pattern in `App.tsx`.

## Theme

`next-themes` with `attribute="class"` (Tailwind dark mode). Storage key: `"hadarya-theme"`. Theme selector in `DashboardLayout` header.

## Error monitoring

Sentry initialized in `src/sentry.ts`, `ErrorBoundary` in `src/main.tsx`. `VITE_SENTRY_DSN` env var — if unset, Sentry is no-op (safe to omit in local dev). Performance tracing not yet enabled.

## Active worktree: visual-redesign

Location: `.worktrees/visual-redesign/`
Designs in: `.worktrees/visual-redesign/designs/*.pen` (Pencil/Stitch files)
Design files: `auth.pen`, `dashboard.pen`, `leads.pen`, `lead-detail.pen`, `deals.pen`, `contracts.pen`, `hadarya-design-system.pen`

Use this worktree for UI work to keep redesign isolated from main.
