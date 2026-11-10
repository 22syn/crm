#!/usr/bin/env bash
# Database permission (RLS) tests.
#
# Applies the Supabase stand-ins, every migration in supabase/migrations/ (in filename
# order), the test seed, and the access matrix to an EMPTY throwaway Postgres, then fails
# if any check fails.
#
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres supabase/tests/rls/run.sh
#
# Local run with Docker:
#   docker run -d --name crm-rls-pg -e POSTGRES_PASSWORD=postgres -p 56543:5432 postgres:15
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:56543/postgres supabase/tests/rls/run.sh
#   docker rm -f crm-rls-pg
#
# Never point this at a real Supabase project: it creates roles and test users.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to an empty throwaway Postgres}"

case "$DATABASE_URL" in
  *supabase.co*|*supabase.com*|*pooler.supabase*)
    echo "Refusing to run against a hosted Supabase database." >&2
    exit 2
    ;;
esac

here="$(cd "$(dirname "$0")" && pwd)"
migrations="$here/../../migrations"

psql_run() {
  psql "$DATABASE_URL" --no-psqlrc -q -v ON_ERROR_STOP=1 "$@"
}

if [ "$(psql_run -Atc "select to_regnamespace('rls_test') is not null")" = "t" ]; then
  echo "Database already has the rls_test schema; use a fresh, empty database." >&2
  exit 2
fi

echo "== Supabase stand-ins"
psql_run -f "$here/00_supabase_stubs.sql"

echo "== Migrations"
count=0
for f in "$migrations"/*.sql; do
  # Hide "does not exist, skipping" notices from idempotent DROP ... IF EXISTS.
  PGOPTIONS="-c client_min_messages=warning" psql_run -f "$f" > /dev/null
  count=$((count + 1))
done
echo "applied $count migration(s)"

echo "== Seed"
psql_run -f "$here/10_harness.sql"
psql_run -f "$here/20_seed.sql"

echo "== Access matrix"
# Results arrive as NOTICE lines on stderr; the query output itself carries nothing.
psql_run -o /dev/null -f "$here/30_rls_matrix.sql" 2>&1 | sed -E 's/^psql:[^ ]+ (NOTICE|ERROR): +//'
exit "${PIPESTATUS[0]}"
