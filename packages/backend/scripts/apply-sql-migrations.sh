#!/usr/bin/env bash
# Apply numbered SQL migrations from packages/backend/drizzle/*.sql
#
# Tracks applied files in schema_sql_migrations. Safe to re-run (skips applied).
#
# Usage:
#   pnpm db:apply-migrations
#   DATABASE_URL=postgresql://... pnpm db:apply-migrations
#   pnpm db:apply-migrations -- --baseline   # mark all existing files applied (existing DBs)
#
# Requires: psql, DATABASE_URL in env or repo-root .env

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIGRATIONS_DIR="$ROOT/packages/backend/drizzle"
BASELINE=0

log() { printf '%s\n' "$*"; }
log_err() { printf 'ERROR: %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
Usage: apply-sql-migrations.sh [--baseline]

  --baseline   Record every drizzle/*.sql file as applied without executing SQL.
               Use once when pointing at a database that already has the schema
               (e.g. Neon after manual psql). New migrations still run normally.

Environment:
  DATABASE_URL   Postgres connection string (or set in repo-root .env)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --baseline)
      BASELINE=1
      shift
      ;;
    --)
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log_err "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  log_err "DATABASE_URL is not set. Add it to .env or export it."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  log_err "psql is not installed. Install PostgreSQL client tools and retry."
  exit 1
fi

log "Using migrations from $MIGRATIONS_DIR"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_sql_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
if (( ${#files[@]} == 0 )); then
  log_err "No .sql migration files found."
  exit 1
fi

IFS=$'\n' sorted_files=($(printf '%s\n' "${files[@]}" | sort))
unset IFS

applied=0
skipped=0
baselined=0

for file in "${sorted_files[@]}"; do
  filename="$(basename "$file")"
  # Escape single quotes for SQL literal
  escaped_filename="${filename//\'/\'\'}"

  already="$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c \
    "SELECT 1 FROM schema_sql_migrations WHERE filename = '${escaped_filename}' LIMIT 1;")"

  if [[ "$already" == "1" ]]; then
    log "skip  $filename (already applied)"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ "$BASELINE" -eq 1 ]]; then
    log "baseline $filename"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
      "INSERT INTO schema_sql_migrations (filename) VALUES ('${escaped_filename}');"
    baselined=$((baselined + 1))
    continue
  fi

  log "apply $filename ..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO schema_sql_migrations (filename) VALUES ('${escaped_filename}');"
  applied=$((applied + 1))
done

log ""
if [[ "$BASELINE" -eq 1 ]]; then
  log "Done. baselined=$baselined skipped=$skipped"
else
  log "Done. applied=$applied skipped=$skipped"
fi

if psql "$DATABASE_URL" -At -c "SELECT to_regclass('public.project_members');" | grep -q project_members; then
  member_count="$(psql "$DATABASE_URL" -At -c "SELECT COUNT(*) FROM project_members;")"
  log "project_members rows: $member_count"
fi
