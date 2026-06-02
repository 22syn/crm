# CRM — Database & Schema

## Supabase project

- **Project ID:** `fbtnhhurjwizcrmcisci`
- **URL:** `https://fbtnhhurjwizcrmcisci.supabase.co`
- **DB host:** `db.fbtnhhurjwizcrmcisci.supabase.co`

## Enums

| Enum | Values |
|------|--------|
| `app_role` | `admin`, `sales` (legacy — used only in old `user_roles`) |
| `lead_status` | `new`, `contacted`, `qualified`, `quoted`, `won`, `lost` |
| `lead_source` | `whatsapp`, `manual`, `walkin`, `website`, `referral` |
| `customer_status` | `new`, `in_progress`, `closed`, `returning` |
| `order_source` | `shopify`, `crm` (legacy) |
| `document_type` | `quote`, `invoice`, `receipt` (legacy) |
| `order_status` | `pending`, `confirmed`, etc. (legacy) |

## Tables

### Auth / Permissions

**`profiles`**
- `user_id` UUID (FK → auth.users)
- `full_name`, `email`, `avatar_url`
- `super_admin` BOOLEAN DEFAULT false ← added Feb 2026

**`user_roles`** (legacy — do not use for new features)
- `user_id`, `role app_role` — original admin/sales system
- Kept for backward compat; new code uses `user_module_roles`

**`user_module_roles`** (current system — added Feb 2026)
- `user_id`, `module TEXT` (leads/ad_agency/system), `role TEXT` (admin/user)
- UNIQUE(user_id, module)

### CRM Core

**`leads`**
- `source lead_source`, `status lead_status`
- `customer_name`, `customer_email`, `customer_phone` (required), `customer_address`
- `assigned_to` UUID (FK → auth.users)
- `converted_customer_id` UUID (FK → customers)

**`customers`**
- `shopify_customer_id`, `name`, `email` (required), `phone` (required), `address`
- `status customer_status` DEFAULT 'new'

**`products`**
- `shopify_variant_id`, `title`, `description`, `price`, `sku`, `stock_qty`, `image_url`, `is_active`

**`product_segments`**
- `name`, `description`, `is_active`
- Seeded: סלון, חדר שינה, מטבח ופינת אוכל, חדר עבודה, חדרי ילדים, אחסון, חוץ וגינה

**`suppliers`**
- `name`, `contact_name` (required), `email`, `phone` (required), `address`
- `specialties TEXT[]`, `notes`, `is_active`
- `category` (required)

**`deals`**
- Status-based pipeline (Kanban)
- Note: `order_id` FK was dropped (orders table no longer exists)

**`quotes`** (was `/contracts` in the UI)
- Quote header + approval flow
- Public approval at `/contracts/approve/:id` (no auth required)

**`quote_items`**
- `dimensions`, `product_type` ← added later
- Custom title/notes support

**`company_settings`**
- `module TEXT UNIQUE` (leads / ad_agency)
- `name`, `address`, `email`, `phone`, `website`
- Seeded: 'CRM' for leads, 'הר סיני הפקות' for ad_agency

### DROPPED tables (do not reference)
- `orders` — dropped migration 20260110230715
- `order_items` — dropped with orders
- `documents` — dropped with orders

### Storage

- `payment_proofs` bucket — added migration 20260301120000

## DB helper functions

| Function | Purpose |
|----------|---------|
| `is_super_admin(user_id)` | Returns true if profiles.super_admin = true |
| `has_module_access(user_id, module)` | is_super_admin OR has row in user_module_roles |
| `has_module_admin(user_id, module)` | is_super_admin OR has row with role='admin' |
| `has_crm_access(user_id)` | is_super_admin OR any row in user_module_roles |
| `has_role(user_id, app_role)` | legacy — checks user_roles table |

**Always use `has_module_access` / `has_module_admin` in new RLS policies**, not `has_role`.

## RLS pattern for new tables

```sql
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Module users can view" ON public.new_table
  FOR SELECT USING (has_module_access(auth.uid(), 'leads'));

CREATE POLICY "Module admins can insert" ON public.new_table
  FOR INSERT WITH CHECK (has_module_admin(auth.uid(), 'leads'));

CREATE POLICY "Module admins can update" ON public.new_table
  FOR UPDATE USING (has_module_admin(auth.uid(), 'leads'));

CREATE POLICY "Module admins can delete" ON public.new_table
  FOR DELETE USING (has_module_admin(auth.uid(), 'leads'));
```

## Migrations history (key events)

| Date | Migration | What changed |
|------|-----------|-------------|
| 2026-01-08 | Initial | profiles, user_roles, leads, customers, products, orders, order_items, documents |
| 2026-01-10 | Multiple | quotes, quote_items, deals, suppliers, product_segments, design_requests, lead_comments, lead_score |
| 2026-01-10 | 230715 | **Dropped** orders, order_items, documents tables |
| 2026-02-24 | 000000-000003 | **Modular permissions**: user_module_roles, profiles.super_admin, new DB helpers |
| 2026-02-24 | 000002 | ori@harsinai.co.il restricted to ad_agency only |
| 2026-03-01 | 120000 | payment_proofs storage bucket |
| 2026-03-11 | 120000 | company_settings table (per-module name/address/contact) |

## Supabase types

Generated types at `src/integrations/supabase/types.ts`. Regenerate after schema changes:
```bash
supabase gen types typescript --project-id fbtnhhurjwizcrmcisci > src/integrations/supabase/types.ts
```
