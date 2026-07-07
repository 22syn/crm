# hadaryaCRM Design System (Pencil)

Design files for the visual redesign. Managed via Pencil MCP.

## Files

- **hadarya-design-system.pen** — Design system tokens: colors, typography, spacing, Button/Input/Card/Badge components.
- **auth.pen** — Auth page: centered card, Demo CRM title, Email/Password fields, Sign in button.
- **dashboard.pen** — Dashboard: header, stats cards, Orders/Leads charts, Activity + Quick Actions.
- **leads.pen** — Leads: header, Add Lead button, filters (Source, Status), view toggle (Table/Kanban), table area.
- **lead-detail.pen** — Lead Detail: back button, header (name, date, Edit), Details + Contracts cards, Comments.
- **deals.pen** — Deals: header, New Deal button, Pipeline/Table/Report tabs, kanban columns.
- **contracts.pen** — Contracts (Quotes): header, New Contract button, Pipeline/Table tabs, table area.

## Usage

```text
# In Cursor, use Pencil MCP:
batch_get({ filePath: "designs/hadarya-design-system.pen", patterns: [{ reusable: true }] })
```
