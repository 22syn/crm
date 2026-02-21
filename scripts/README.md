# Scripts

## Seed admin + 100 leads (`npm run seed:run`)

Runs the seed migration via pooler (uses `supabase/.temp/pooler-url` when linked):

```bash
DB_PASSWORD=yourpass npm run seed:run
```

Or with full URL (note **aws-1** for Frankfurt):

```bash
DATABASE_URL="postgres://postgres.fbtnhhurjwizcrmcisci:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" npm run seed:run
```

---

## Migrate from old Supabase to new

Copies business data (customers, leads, quotes, deals, etc.) from the old project to the new one.

### Requirements

- **Service Role Key** from both projects (bypasses RLS).
- Get it: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Project Settings** → **API** → **service_role** (click Reveal).

### Run

```bash
OLD_SUPABASE_URL="https://ngmbijlwmnsnncpfnyjg.supabase.co" \
OLD_SERVICE_ROLE_KEY="eyJ..." \
NEW_SUPABASE_URL="https://fbtnhhurjwizcrmcisci.supabase.co" \
NEW_SERVICE_ROLE_KEY="eyJ..." \
npx tsx scripts/migrate-data.ts
```

Or add to `.env.local` (do not commit) and source it:

```bash
# .env.local
OLD_SUPABASE_URL=https://ngmbijlwmnsnncpfnyjg.supabase.co
OLD_SERVICE_ROLE_KEY=your_old_service_role_key
NEW_SUPABASE_URL=https://fbtnhhurjwizcrmcisci.supabase.co
NEW_SERVICE_ROLE_KEY=your_new_service_role_key
```

```bash
export $(cat .env.local | xargs) && npx tsx scripts/migrate-data.ts
```

### Tables migrated

- customers
- suppliers
- leads
- quotes
- quote_items
- deals
- design_requests
- lead_comments

### Not migrated

- **profiles**, **user_roles**, **user_table_preferences** – tied to auth. Re‑register in the new project and assign roles in Settings.

### After migration

1. Register in the new project (Auth page).
2. In Settings, add yourself to **user_roles** (admin/sales).
3. `assigned_to` and `created_by` in migrated data still point to old user IDs; they will show as unassigned until you reassign.
