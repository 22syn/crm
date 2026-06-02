# Create All hadaryaCRM Pages in Stitch

Generate design screens in Stitch for every hadaryaCRM page — **Desktop + Mobile** — with a **shared design system** so sidebar, table, Kanban, and all shared components are identical across pages.

**Prerequisites:**
- Stitch MCP configured (see `docs/stitch-mcp-setup-guide.md`)
- GCP auth: `gcloud auth application-default login`
- Project ID: `12969395350507001707` (DemoCRM)

---

## 1. Light & Dark Mode

Design both themes. Colors differ:

| Mode | Main area | Sidebar | Accent | Status badges |
|------|-----------|---------|--------|---------------|
| **Light** | ~98% light gray | Dark `#0f1025` | Neutral slate (no blue) | Light bg (blue-100, green-100) |
| **Dark** | ~10% dark | `#0f1025` | Blue `#1337ec` | Dark bg (blue-900/30, green-900/30) |

Cards: `#151938` in dark mode; light/s subtle in light mode.

---

## 2. Design System & Shared Components

All pages use the same components. Must look identical across pages.

### Layout

| Component | Spec |
|-----------|------|
| **Sidebar** | Dark `#0f1025`, 240px, logo top, nav items, active = accent. Collapsible. Same on every authenticated page. |
| **Header** | Search bar, theme toggle, notifications, user avatar dropdown. Same on all pages (desktop). |
| **Mobile header** | Hamburger → drawer, title center, theme toggle. Same on every page. |
| **Breadcrumb** | Dashboard > Section > Page. Same on Leads, Deals, Customers, Settings, etc. |

### Content

| Component | Spec |
|-----------|------|
| **Tabs** | Pipeline / Table / Report toggle. Icons + labels. Active = accent. Same on entity pages. |
| **Entity toolbar** | Filters, Views dropdown, Sort, Save/Reset, Column visibility, Clear filters. Rounded card. Same on Leads, Deals, Contracts, Ad Agency. |
| **Table** | Rounded card, sticky header, uppercase labels, avatar column, status pills, actions. Same for Leads, Customers, Products, Suppliers, Items, Members. |
| **Kanban** | Columns with dot + label + count. Cards: value, grip, assignee. Same for Leads, Deals, Contracts, Design Requests, Projects. |
| **Empty state** | Dashed border, icon, title, subtitle, Add / Clear filters buttons. Same when no data. |
| **Cards** | Stats, activity feed, detail sections. Same style. |

### UI Elements

| Component | Spec |
|-----------|------|
| **Status pill** | Rounded-full, colored dot + label. Same in table cells and cards. |
| **Buttons** | Accent (primary), outline, ghost. Same variants everywhere. |
| **Dialogs** | Overlay, rounded, Cancel + primary footer. Same for all forms. |
| **Pagination** | Prev/next, page numbers. Same footer in tables. |
| **Loader** | Centered spinner. Same in loading states. |

---

## 3. Consistency Workflow (extract_design_context)

To keep designs consistent across generations:

1. **Generate Dashboard (DESKTOP) first** — it has sidebar, cards, charts.
2. **Extract design context:**
   ```ts
   extract_design_context(screenId)
   ```
3. **Use the returned context** when generating all subsequent screens so they inherit fonts, colors, layouts, spacing.

---

## 4. Device Variants

Each page has **DESKTOP** and **MOBILE** prompts:

| Device | Layout |
|--------|--------|
| **DESKTOP** | Left sidebar, full table/Kanban, charts side-by-side |
| **MOBILE** | Hamburger header, drawer sidebar, stacked content, horizontal scroll for table/Kanban |

---

## 5. Run the Script

Generate prompts only:
```bash
npm run stitch:create-pages
```

Run prompts (generate screens in Stitch):
```bash
# First time: authenticate
gcloud auth application-default login
gcloud config set project democrm-489100

# Run 1 screen (default, dry run)
npm run stitch:run

# Run 5 screens
npm run stitch:run -- --limit 5

# Run all 46
npm run stitch:run -- --all
```

Prints all prompts (Desktop + Mobile) to the console.

For JSON output (for automation):

```bash
npx tsx scripts/create-stitch-pages.ts --json
```

---

## 6. Stitch MCP Usage

When Stitch MCP is working:

```ts
// 1. Generate base screen
const { screenId } = generate_screen_from_text({
  projectId: "12969395350507001707",
  prompt: "<Dashboard DESKTOP prompt>",
  deviceType: "DESKTOP"
});

// 2. Extract design context for consistency
const designContext = extract_design_context(screenId);

// 3. Generate other screens with designContext
generate_screen_from_text({
  projectId: "12969395350507001707",
  prompt: "<page prompt from script>",
  deviceType: "DESKTOP",  // or "MOBILE"
  designContext  // if supported by Stitch MCP
});
```

---

## 7. Page List (23 pages × 2 devices = 46 screens)

| Route | Desktop | Mobile |
|-------|---------|--------|
| `/auth` | Split login | Stacked login |
| `/dashboard` | Stats, charts, activity | 2x2 stats, stacked |
| `/leads` Kanban | Kanban + sidebar | Scroll columns |
| `/leads` Table | Table + sidebar | Scroll/stacked |
| `/leads/:id` | Tabs, cards | Stacked |
| `/deals` | Kanban | Same pattern |
| `/contracts` | Kanban | Same pattern |
| `/contracts/approve/:id` | Approve/Reject | Stacked |
| `/customers` | Table | Scroll |
| `/products` | Table | Scroll |
| `/suppliers` | Table | Scroll |
| `/design-requests` | Kanban | Same pattern |
| `/automations` | Rule cards | Stacked |
| `/settings` | Members table | Stacked |
| Ad Agency (6 pages) | Same patterns | Same patterns |
| 404, Add Lead Modal | Desktop/mobile variants | `noSidebar: true` — minimal design system |

---

## 8. Source: stitch-prompts.json

All prompts live in `scripts/stitch-prompts.json`:
- `designSystem` — shared component specs, `themeModes` (light/dark)
- `pages` — `desktop` and `mobile` prompt per page
- `devices` — `["DESKTOP", "MOBILE"]`

---

## 9. Shared Components Checklist (from codebase)

Verified across hadaryaCRM — all must look the same in Stitch:

| Component | Used on |
|-----------|---------|
| DashboardSidebar | All authenticated pages |
| DashboardHeader (search, theme, avatar) | All authenticated pages (desktop) |
| Mobile header | All pages (mobile) |
| DashboardBreadcrumb | Leads, Deals, Contracts, Customers, Settings, Ad Agency, etc. |
| EntityPageShell (tabs, title, add button) | Leads, Deals, Quotes, Design Requests, Ad Agency Projects |
| EntityToolbar | Leads, Deals, Quotes, Design Requests, Ad Agency (Projects, Tasks, Items, Clients) |
| EntityKanban + EntityKanbanColumn | Leads, Deals, Quotes, Design Requests, Projects |
| DataTable (variant=stitch) | LeadTable, CustomerTable, SupplierTable, MembersTable |
| LeadCard / DealCard / QuoteKanbanCard / DesignRequestKanbanCard / ProjectCard | Respective Kanbans |
| LeadsEmptyState (pattern) | Leads, Deals, Quotes, Design Requests |
| StatusPill / status badges | LeadTable, CustomerTable, cards |
| Button (accent, outline, ghost) | Everywhere |
| Dialog | LeadDialog, DealDialog, QuoteBuilder, Rename View, etc. |
| Select (Sort, Views, filters) | EntityToolbar, filters |
| Pagination | DataTable footer |
| Stats cards | Dashboard, Ad Agency Dashboard |
| Activity feed / timeline | Dashboard, Lead Detail |
| Charts (bar, line) | Dashboard, Ad Agency |
| **Filters bar** | LeadFilters, DealFilters, QuoteFilters, ProjectFilters, ClientFilters, TaskFilters, ItemFilters (search + Selects) |
| **GlobalCommandPalette** | Cmd+K — quick nav, search, recent leads |
| **Sheet** | Mobile filters drawer, mobile sidebar |
| **Form inputs** | Input, Label, Textarea, Select, Checkbox, Switch — all dialogs |
| **ColumnVisibilityDropdown** | Ad Agency tables, EntityToolbar |
| **LeadComments** (timeline) | Lead Detail Activity tab |
| **Skeleton** | LeadsTableSkeleton, loading states |
| **ModulePermissionsSelector** | Settings Members table |
| **ScrollArea, Separator, Tooltip** | LeadComments, dropdowns, sidebar |
