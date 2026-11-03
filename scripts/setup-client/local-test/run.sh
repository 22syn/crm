#!/usr/bin/env bash
# End-to-end test of the setup script on a throwaway local Postgres (needs initdb/pg_ctl/psql on PATH).
# Creates a fresh cluster, fakes the Supabase pieces, runs setup twice, checks the result, cleans up.
# Usage: bash scripts/setup-client/local-test/run.sh
set -euo pipefail
export LC_ALL=C LANG=C

PG_PORT=54339
STUB_PORT=54409
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WORK="$(mktemp -d)"
DB_URL="postgres://postgres@localhost:${PG_PORT}/client"

cleanup() {
  if [[ -n "${STUB_PID:-}" ]]; then kill "$STUB_PID" 2>/dev/null || true; wait "$STUB_PID" 2>/dev/null || true; fi
  pg_ctl -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

q() { psql -X -q -t -A -h localhost -p "$PG_PORT" -U postgres -d client -c "$1"; }
check() { # name, actual, expected
  if [[ "$2" == "$3" ]]; then echo "PASS  $1"; else echo "FAIL  $1: got '$2', expected '$3'"; FAILED=1; fi
}

initdb -D "$WORK/data" -U postgres -A trust --locale=C -E UTF8 >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PG_PORT -c unix_socket_directories= -c listen_addresses=localhost" -l "$WORK/pg.log" -w start >/dev/null
psql -X -q -h localhost -p "$PG_PORT" -U postgres -c "CREATE DATABASE client"
psql -X -q -v ON_ERROR_STOP=1 -h localhost -p "$PG_PORT" -U postgres -d client -f "$ROOT/scripts/setup-client/local-test/supabase-stubs.sql"

DATABASE_URL="$DB_URL" node "$ROOT/scripts/setup-client/local-test/invite-stub.mjs" "$STUB_PORT" >"$WORK/stub.log" 2>&1 &
STUB_PID=$!
sleep 1

run_setup() {
  (cd "$ROOT" && DATABASE_URL="$DB_URL" SUPABASE_URL="http://localhost:$STUB_PORT" SUPABASE_SERVICE_ROLE_KEY=local-test \
    npx tsx scripts/setup-client/index.ts --name "$1" --admin-email owner@acme.test --modules leads \
    --primary-color "#0F766E" --super-admin-email support@xsheva.test) >"$WORK/setup.log" 2>&1
}

FAILED=0
run_setup "Acme Furniture" || { cat "$WORK/setup.log"; exit 1; }
q "UPDATE company_settings SET features = '{\"quotes\": true}'" >/dev/null
run_setup "Acme Furniture Ltd" || { cat "$WORK/setup.log"; exit 1; }

check "migrations recorded" "$(q "SELECT count(*) FROM supabase_migrations.schema_migrations")" \
  "$(ls "$ROOT"/supabase/migrations/*.sql | wc -l | tr -d ' ')"
check "demo-data migrations not run" "$(q "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE cardinality(statements) = 0")" "2"
check "every public table has RLS" "$(q "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity")" "0"
check "no demo data" "$(q "SELECT (SELECT count(*) FROM leads) + (SELECT count(*) FROM deals) + (SELECT count(*) FROM op_clients)")" "0"
check "only the client's company row" "$(q "SELECT string_agg(module || '=' || name, ',') FROM company_settings")" "leads=Acme Furniture Ltd"
check "demo contact details cleared" "$(q "SELECT count(*) FROM company_settings WHERE coalesce(address, email, phone, website) IS NOT NULL")" "0"
check "re-run keeps feature flags" "$(q "SELECT features->>'quotes' FROM company_settings")" "true"
check "two users, no duplicates" "$(q "SELECT count(*) FROM auth.users")" "2"
check "first admin roles" "$(q "SELECT string_agg(module || '/' || role, ',' ORDER BY module) FROM user_module_roles r JOIN profiles p USING (user_id) WHERE p.email = 'owner@acme.test'")" "leads/admin,system/admin"
check "only Xsheva is super admin" "$(q "SELECT string_agg(email, ',') FROM profiles WHERE super_admin")" "support@xsheva.test"

[[ "$FAILED" == 0 ]] && echo "All checks passed." || { echo "Some checks failed."; exit 1; }
