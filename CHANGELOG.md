# Changelog

## Unreleased

### Added
- Stitch DemoCRM design implementation across core pages
- **EntityPageShell** — Optional `showBreadcrumbs` prop for Home > title
- **Deals** — Empty state (no deals / no match filters), breadcrumbs
- **NotFound** — Branded 404 with icon, accent CTA

### Changed
- **Auth** — Split layout: left brand panel (accent background, hero copy), right login form with show/hide password, Xsheva CRM branding
- **Customers** — Stitch "Client Directory" design: breadcrumbs, hero, filters bar, table with avatar initials, status badges, pagination
- **Dashboard** — Refined header typography (text-3xl, tracking-tight)
- **LeadDetail** — Breadcrumbs (Home > Leads > name), larger title, accent Edit button
- **Settings** — Breadcrumbs, hero "Settings & Team Management", rounded card
- **Table** — Sticky header (`position: sticky`) for scrollable tables
- **Leads, Deals, Contracts, DesignRequests, AdAgencyProjects** — Breadcrumbs, hero typography
- **Products, Suppliers, Automations** — Breadcrumbs, hero typography (text-3xl, tracking-tight)
- **QuoteApproval** — Breadcrumbs (Home > Contracts > Approve), rounded card
- **Contracts** — Empty state styling (rounded-xl, accent button)
