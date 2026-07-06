# CRM — Memory

Project-specific decisions and context across sessions. Entries are dated and never deleted — only added to.

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-10 | Dropped orders/order_items/documents tables | Moved to quote-based model; orders were unused after Shopify integration changed |
| 2026-02-24 | Replaced global user_roles with per-module user_module_roles | Needed to support two separate orgs (CRM + הר סיני הפקות) with different access rules |
| 2026-02-24 | Restricted ori@harsinai.co.il to ad_agency module only | User belongs only to הר סיני הפקות — no access to leads/CRM data |
| 2026-03-11 | Added company_settings per module | Needed separate branding (name, address, logo) for each org's quote PDFs |
| 2026-XX-XX | Renamed /quotes → /contracts in routing | Business rebranding; /quotes still redirects to /contracts |
| 2026-07-06 | Put project ON HOLD — turned off Vercel hosting + Supabase | Project paused indefinitely. Vercel: git disconnected + prod alias `hadaryacrm.vercel.app` removed (site 404), project/deployment kept. Supabase paused >90d → unrestorable; DB row data abandoned (schema in git). All reversible, nothing deleted. |

## Resolved Issues

| Date | Issue | Fix |
|------|-------|-----|
| ~2025-02 | Unused files accumulating (Index.tsx, App.css, NavLink.tsx, KanbanColumn variants, QuoteCard, tagger) | Deleted in FILE_AUDIT cleanup — see `.worktrees/visual-redesign/.cursor/FILE_AUDIT.md` |
| 2026-XX-XX | BUG-03: Pages loading at mid-scroll position on route change | Added `ScrollToTop` component in App.tsx that calls `window.scrollTo(0,0)` on pathname change |
| ~2026-01 | use-toast in two locations (hooks/ and components/ui/) | Kept as-is: hooks/use-toast is the source; components/ui/use-toast re-exports it (shadcn convention) |

## User Preferences

- Kobi is the super admin (kobi@leadslords.com)
- Project is in active development — visual-redesign worktree is ongoing work
- Obsidian (Maestro vault) was the previous source of truth for rules/standards; now migrated to .claude/

## Active Context

- **⏸️ ON HOLD since 2026-07-06** — hosting + deployment off (see Decisions row). To revive: `vercel git connect` + `vercel alias set <deployment> hadaryacrm.vercel.app`; Supabase needs Pro/support to restore (data may be gone).
- **visual-redesign** branch is active in `.worktrees/visual-redesign/` — designs exist as `.pen` files
- Knowledge layer migrated from Obsidian to Cowork on 2026-04-29
- Obsidian files at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Maestro/` are still the source for: security audit details, UI/UX improvement plan details, and cursor MCP setup — consider copying key findings into knowledge/ files

## TODOs for knowledge layer

- [ ] Copy security audit findings from Obsidian → create `knowledge/security.md`
- [ ] Copy UI/UX improvement plan from Obsidian → create `knowledge/ui-ux-plan.md`
- [ ] Add ad_agency DB schema details (ad_agency-specific tables not yet documented)
