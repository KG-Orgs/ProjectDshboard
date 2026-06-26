#!/usr/bin/env bash
#
# Migrate local ContractorAI Postgres (source of truth) to shared cloud Postgres.
#
# Prerequisites: pg_dump, pg_restore, psql (PostgreSQL client tools), pnpm.
#
# --- For George (onboarding to Kyle's shared cloud DB) ---
# 1. Copy .env.example to .env
# 2. Set DATABASE_URL to the same cloud URL Kyle uses (ask Kyle — do not commit it)
# 3. Set the same MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET (shared Azure app)
# 4. From repo root: pnpm dev, then sign in at http://localhost:3000/login
#
# --- For Kyle (one-time local → cloud copy) ---
# Paste the cloud DATABASE_URL into .env (or pass TARGET_DATABASE_URL), then:
#   pnpm --filter @contractor/backend db:migrate-to-cloud
# Or explicitly:
#   TARGET_DATABASE_URL='postgresql://...' pnpm --filter @contractor/backend db:migrate-to-cloud
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-postgresql://contractor:contractor_dev_password@localhost:5432/contractorai}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
SKIP_VERIFY="${SKIP_VERIFY:-0}"

MLJ017_PROJECT_ID="731cfd5d-e647-4551-89e7-0a3cc4915115"
EXPECTED_FILE_RECORDS=10721
EXPECTED_USER_EMAIL="kyle.xu4@gmail.com"
FILE_COUNT_TOLERANCE=200

usage() {
  cat <<'EOF'
Usage: migrate-db-to-cloud.sh [options]

Copies the local contractorai database to cloud Postgres, runs Drizzle migrations
on the target, and verifies core data (users, MLJ-017 project, file_records).

Environment:
  SOURCE_DATABASE_URL   Local DB (default: localhost:5432/contractorai)
  TARGET_DATABASE_URL   Cloud DB (required unless DATABASE_URL in .env is non-local)
  SKIP_VERIFY=1         Skip post-restore verification queries

Options:
  --target-url URL      Same as TARGET_DATABASE_URL
  --source-url URL      Same as SOURCE_DATABASE_URL
  --dry-run             Print planned actions without dumping/restoring
  -h, --help            Show this help

Connection strings are never printed (only hostnames).
EOF
}

log() {
  printf '%s\n' "$*"
}

log_err() {
  printf 'error: %s\n' "$*" >&2
}

# Print host[:port]/dbname only — never credentials.
redact_url() {
  local url="$1"
  node -e "
    const u = new URL(process.argv[1].replace(/^postgresql:/, 'postgres:'));
    const db = (u.pathname || '/').replace(/^\//, '') || '(default)';
    const port = u.port ? ':' + u.port : '';
    console.log(u.hostname + port + '/' + db);
  " "$url" 2>/dev/null || echo "(unparseable-url)"
}

url_host_is_local() {
  local url="$1"
  node -e "
    const u = new URL(process.argv[1].replace(/^postgresql:/, 'postgres:'));
    const h = u.hostname;
    process.exit(h === 'localhost' || h === '127.0.0.1' ? 0 : 1);
  " "$url"
}

read_env_database_url() {
  if [[ ! -f "$ENV_FILE" ]]; then
    return 1
  fi
  node -e "
    const fs = require('fs');
    const line = fs.readFileSync(process.argv[1], 'utf8')
      .split('\n')
      .find((l) => /^DATABASE_URL=/.test(l));
    if (!line) process.exit(1);
    let v = line.slice('DATABASE_URL='.length).trim();
    if ((v.startsWith('\"') && v.endsWith('\"')) || (v.startsWith(\"'\") && v.endsWith(\"'\"))) {
      v = v.slice(1, -1);
    }
    process.stdout.write(v);
  " "$ENV_FILE"
}

require_cmds() {
  local missing=0
  for cmd in pg_dump pg_restore psql node pnpm; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_err "missing required command: $cmd"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    log_err "Install PostgreSQL client tools (pg_dump, pg_restore, psql) and retry."
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --target-url)
        TARGET_DATABASE_URL="${2:-}"
        shift 2
        ;;
      --source-url)
        SOURCE_DATABASE_URL="${2:-}"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log_err "unknown argument: $1"
        usage >&2
        exit 1
        ;;
    esac
  done
}

resolve_target_url() {
  if [[ -n "$TARGET_DATABASE_URL" ]]; then
    return 0
  fi

  local env_url=""
  if env_url="$(read_env_database_url 2>/dev/null || true)" && [[ -n "$env_url" ]]; then
    if url_host_is_local "$env_url"; then
      log_err "DATABASE_URL in .env points to localhost. Set a cloud TARGET_DATABASE_URL or update .env."
      exit 1
    fi
    TARGET_DATABASE_URL="$env_url"
    log "Using cloud DATABASE_URL from .env ($(redact_url "$TARGET_DATABASE_URL"))"
    return 0
  fi

  log_err "TARGET_DATABASE_URL is required (or set a non-localhost DATABASE_URL in .env)."
  usage >&2
  exit 1
}

run_migrations() {
  log "Running Drizzle migrations on target..."
  (cd "$BACKEND_DIR" && DATABASE_URL="$TARGET_DATABASE_URL" pnpm db:migrate)
}

verify_target() {
  log "Verifying target database..."
  local counts
  counts="$(psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL'
SELECT 'users', COUNT(*)::text FROM users;
SELECT 'projects', COUNT(*)::text FROM projects;
SELECT 'file_records', COUNT(*)::text FROM file_records;
SELECT 'mlj017', COUNT(*)::text FROM projects WHERE id = '731cfd5d-e647-4551-89e7-0a3cc4915115' OR name ILIKE '%MLJ-017%';
SELECT 'kyle_user', COUNT(*)::text FROM users WHERE email = 'kyle.xu4@gmail.com';
SELECT 'file_chunks', COUNT(*)::text FROM file_chunks;
SELECT 'orphan_chunk_links', COUNT(*)::text FROM chunk_links cl
  WHERE NOT EXISTS (SELECT 1 FROM file_chunks fc WHERE fc.id = cl.source_chunk_id);
SQL
)"

  local user_count=0 project_count=0 file_count=0 mlj017_count=0 kyle_count=0
  local chunk_count=0 orphan_links=0
  while IFS='|' read -r label value; do
    case "$label" in
      users) user_count="$value" ;;
      projects) project_count="$value" ;;
      file_records) file_count="$value" ;;
      mlj017) mlj017_count="$value" ;;
      kyle_user) kyle_count="$value" ;;
      file_chunks) chunk_count="$value" ;;
      orphan_chunk_links) orphan_links="$value" ;;
    esac
  done <<<"$counts"

  local failed=0
  log "  users:        $user_count"
  log "  projects:     $project_count"
  log "  file_records: $file_count"
  log "  MLJ-017 rows: $mlj017_count"
  log "  kyle user:    $kyle_count"
  log "  file_chunks:  $chunk_count"
  log "  orphan links: $orphan_links"

  if [[ "$chunk_count" -lt 900000 ]]; then
    log_err "verification warning: file_chunks=$chunk_count (expected ~964k). Neon Free tier often fails mid-restore."
    log_err "  Upgrade Neon to Launch, then: pnpm db:restore-chunks-batched"
    failed=1
  fi
  if [[ "$orphan_links" -gt 1000 ]]; then
    log_err "verification failed: $orphan_links orphan chunk_links (chunks missing or UUID mismatch)"
    failed=1
  fi

  if [[ "$user_count" -lt 1 ]]; then
    log_err "verification failed: expected at least 1 user"
    failed=1
  fi
  if [[ "$project_count" -lt 1 ]]; then
    log_err "verification failed: expected at least 1 project"
    failed=1
  fi
  if [[ "$mlj017_count" -lt 1 ]]; then
    log_err "verification failed: MLJ-017 project not found (id $MLJ017_PROJECT_ID)"
    failed=1
  fi
  if [[ "$kyle_count" -lt 1 ]]; then
    log_err "verification failed: user $EXPECTED_USER_EMAIL not found"
    failed=1
  fi

  local min_files=$((EXPECTED_FILE_RECORDS - FILE_COUNT_TOLERANCE))
  local max_files=$((EXPECTED_FILE_RECORDS + FILE_COUNT_TOLERANCE))
  if [[ "$file_count" -lt "$min_files" || "$file_count" -gt "$max_files" ]]; then
    log_err "verification failed: file_records=$file_count (expected ~$EXPECTED_FILE_RECORDS ±$FILE_COUNT_TOLERANCE)"
    failed=1
  fi

  if [[ "$failed" -ne 0 ]]; then
    exit 1
  fi
  log "Verification passed."
}


with_keepalives_url() {
  node -e "
    const raw = process.argv[1];
    const u = new URL(raw.replace(/^postgresql:/, 'postgres:'));
    u.searchParams.set('keepalives', '1');
    u.searchParams.set('keepalives_idle', '30');
    u.searchParams.set('keepalives_interval', '10');
    u.searchParams.set('keepalives_count', '10');
    process.stdout.write(u.toString().replace(/^postgres:/, 'postgresql:'));
  " "$1"
}

restore_to_target() {
  local dump_file="$1"
  local target_url
  target_url="$(with_keepalives_url "$TARGET_DATABASE_URL")"
  local restore_log="${dump_file}.restore.log"
  local attempt max_attempts=3

  for attempt in $(seq 1 "$max_attempts"); do
    log "Restoring to target (clean + if-exists), attempt ${attempt}/${max_attempts}..."
    if pg_restore       --dbname="$target_url"       --clean       --if-exists       --no-owner       --no-acl       --jobs=1       "$dump_file" 2>"$restore_log"; then
      rm -f "$restore_log"
      return 0
    fi
    if [[ "$attempt" -lt "$max_attempts" ]]; then
      log "pg_restore attempt ${attempt} failed (see ${restore_log}); retrying in 15s..."
      sleep 15
    fi
  done

  log_err "pg_restore failed after ${max_attempts} attempts (see ${restore_log})."
  return 1
}

main() {
  DRY_RUN=0
  parse_args "$@"
  require_cmds
  resolve_target_url

  if url_host_is_local "$TARGET_DATABASE_URL"; then
    log_err "refusing to restore into a localhost TARGET (would overwrite local source of truth)"
    exit 1
  fi

  log "Source: $(redact_url "$SOURCE_DATABASE_URL")"
  log "Target: $(redact_url "$TARGET_DATABASE_URL")"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would pg_dump → pg_restore → db:migrate → verify"
    exit 0
  fi

  local dump_file
  dump_file="$(mktemp "${TMPDIR:-/tmp}/contractorai-migrate.XXXXXX.dump")"
  trap 'rm -f "$dump_file"' EXIT

  log "Dumping source database..."
  pg_dump "$SOURCE_DATABASE_URL" \
    --format=custom \
    --no-owner \
    --no-acl \
    --file="$dump_file"

  if ! restore_to_target "$dump_file"; then
    exit 1
  fi

  run_migrations

  if [[ "$SKIP_VERIFY" != "1" ]]; then
    verify_target
  fi

  log "Migration complete."
}

main "$@"
