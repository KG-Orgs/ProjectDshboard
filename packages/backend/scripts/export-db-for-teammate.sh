#!/usr/bin/env bash
#
# Export local ContractorAI Postgres for a teammate (embeddings + index data).
#
# --- For George (restore on your machine) ---
# 1. Install PostgreSQL client tools (pg_dump/pg_restore/psql) and run local Postgres.
# 2. Create empty DB (adjust user/password to match your docker-compose or .env):
#      createdb contractorai
#    Or: psql postgres -c "CREATE USER contractor WITH PASSWORD '...'; CREATE DATABASE contractorai OWNER contractor;"
# 3. Restore (replace path and connection string):
#      pg_restore \
#        --dbname='postgresql://contractor:YOUR_PASSWORD@localhost:5432/contractorai' \
#        --clean --if-exists --no-owner --no-acl --jobs=4 \
#        ~/Downloads/contractorai-full-YYYYMMDD.dump
# 4. Copy .env.example → .env; set DATABASE_URL to your local URL above.
# 5. From repo root: pnpm dev — sign in at http://localhost:3000/login
#
# Large files (>5GB): split for Google Drive upload limits:
#   split -b 4000m contractorai-full-YYYYMMDD.dump contractorai-full-YYYYMMDD.dump.part-
# George reassembles: cat contractorai-full-YYYYMMDD.dump.part-* > contractorai-full-YYYYMMDD.dump
#
# --- For Kyle (export) ---
#   pnpm --filter @contractor/backend db:export-for-teammate
# Or:
#   OUTPUT_FILE=~/Downloads/contractorai-full-$(date +%Y%m%d).dump bash ./scripts/export-db-for-teammate.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-}"
MLJ017_PROJECT_ID="731cfd5d-e647-4551-89e7-0a3cc4915115"
EXPECTED_FILE_RECORDS=10721
FILE_COUNT_TOLERANCE=200

usage() {
  cat <<'EOF'
Usage: export-db-for-teammate.sh [options]

Dumps the local contractorai database to a custom-format pg_dump file for sharing.

Environment:
  SOURCE_DATABASE_URL   Override source (default: localhost from .env or dev default)
  OUTPUT_FILE           Full path to .dump file (default: ~/Downloads/contractorai-full-YYYYMMDD.dump)
  SKIP_VERIFY=1         Skip count checks

Options:
  --source-url URL      Same as SOURCE_DATABASE_URL
  --output PATH         Same as OUTPUT_FILE
  --dry-run             Print planned actions only
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

redact_url() {
  local url="$1"
  node -e "
    const u = new URL(process.argv[1].replace(/^postgresql:/, 'postgres:'));
    const db = (u.pathname || '/').replace(/^\//, '') || '(default)';
    const port = u.port ? ':' + u.port : '';
    console.log(u.hostname + port + '/' + db);
  " "$url" 2>/dev/null || echo "(unparseable-url)"
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

url_host_is_local() {
  local url="$1"
  node -e "
    const u = new URL(process.argv[1].replace(/^postgresql:/, 'postgres:'));
    const h = u.hostname;
    process.exit(h === 'localhost' || h === '127.0.0.1' ? 0 : 1);
  " "$url"
}

require_cmds() {
  local missing=0
  for cmd in pg_dump pg_restore psql node; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_err "missing required command: $cmd"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --source-url)
        SOURCE_DATABASE_URL="${2:-}"
        shift 2
        ;;
      --output)
        OUTPUT_FILE="${2:-}"
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

resolve_source_url() {
  if [[ -n "$SOURCE_DATABASE_URL" ]]; then
    return 0
  fi
  local env_url=""
  if env_url="$(read_env_database_url 2>/dev/null || true)" && [[ -n "$env_url" ]]; then
    if url_host_is_local "$env_url"; then
      SOURCE_DATABASE_URL="$env_url"
      log "Using local DATABASE_URL from .env ($(redact_url "$SOURCE_DATABASE_URL"))"
      return 0
    fi
    SOURCE_DATABASE_URL="postgresql://contractor:contractor_dev_password@localhost:5432/contractorai"
    log "DATABASE_URL in .env is not localhost; using default local source ($(redact_url "$SOURCE_DATABASE_URL"))"
    return 0
  fi
  SOURCE_DATABASE_URL="postgresql://contractor:contractor_dev_password@localhost:5432/contractorai"
  log "Using default local source ($(redact_url "$SOURCE_DATABASE_URL"))"
}

fetch_counts() {
  psql "$SOURCE_DATABASE_URL" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL'
SELECT 'users', COUNT(*)::text FROM users;
SELECT 'projects', COUNT(*)::text FROM projects;
SELECT 'file_records', COUNT(*)::text FROM file_records;
SELECT 'mlj017', COUNT(*)::text FROM projects WHERE id = '731cfd5d-e647-4551-89e7-0a3cc4915115' OR name ILIKE '%MLJ-017%';
SELECT 'file_chunks', COUNT(*)::text FROM file_chunks;
SQL
}

print_counts() {
  local label="$1"
  local counts="$2"
  log "$label"
  local user_count=0 project_count=0 file_count=0 mlj017_count=0 chunk_count=0
  while IFS='|' read -r key value; do
    case "$key" in
      users) user_count="$value" ;;
      projects) project_count="$value" ;;
      file_records) file_count="$value" ;;
      mlj017) mlj017_count="$value" ;;
      file_chunks) chunk_count="$value" ;;
    esac
  done <<<"$counts"
  log "  users:        $user_count"
  log "  projects:     $project_count"
  log "  file_records: $file_count"
  log "  MLJ-017 rows: $mlj017_count"
  log "  file_chunks:  $chunk_count"
}

verify_counts() {
  local counts="$1"
  local file_count=0 chunk_count=0 mlj017_count=0
  while IFS='|' read -r key value; do
    case "$key" in
      file_records) file_count="$value" ;;
      file_chunks) chunk_count="$value" ;;
      mlj017) mlj017_count="$value" ;;
    esac
  done <<<"$counts"

  if [[ "$mlj017_count" -lt 1 ]]; then
    log_err "verification failed: MLJ-017 project not found"
    exit 1
  fi
  local min_files=$((EXPECTED_FILE_RECORDS - FILE_COUNT_TOLERANCE))
  local max_files=$((EXPECTED_FILE_RECORDS + FILE_COUNT_TOLERANCE))
  if [[ "$file_count" -lt "$min_files" || "$file_count" -gt "$max_files" ]]; then
    log_err "verification failed: file_records=$file_count (expected ~$EXPECTED_FILE_RECORDS ±$FILE_COUNT_TOLERANCE)"
    exit 1
  fi
  if [[ "$chunk_count" -lt 900000 ]]; then
    log_err "verification failed: file_chunks=$chunk_count (expected ~964k)"
    exit 1
  fi
}

human_size() {
  local bytes="$1"
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec-i --suffix=B "$bytes"
  else
    echo "${bytes} bytes"
  fi
}

main() {
  DRY_RUN=0
  OUTPUT_FILE="${OUTPUT_FILE:-}"
  parse_args "$@"
  require_cmds
  resolve_source_url

  if ! url_host_is_local "$SOURCE_DATABASE_URL"; then
    log_err "refusing to dump a non-localhost source (set SOURCE_DATABASE_URL to local explicitly if intended)"
    exit 1
  fi

  if [[ -z "$OUTPUT_FILE" ]]; then
    OUTPUT_FILE="${HOME}/Downloads/contractorai-full-$(date +%Y%m%d).dump"
  fi

  log "Source: $(redact_url "$SOURCE_DATABASE_URL")"
  log "Output: $OUTPUT_FILE"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would verify counts → pg_dump → validate dump"
    exit 0
  fi

  if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    log_err "Postgres does not appear to be accepting connections on localhost:5432"
    exit 1
  fi

  local before after
  before="$(fetch_counts)"
  if [[ "${SKIP_VERIFY:-0}" != "1" ]]; then
    print_counts "Source counts (before export):" "$before"
    verify_counts "$before"
  fi

  mkdir -p "$(dirname "$OUTPUT_FILE")"
  log "Dumping (custom format, compressed)..."
  pg_dump "$SOURCE_DATABASE_URL" \
    --format=custom \
    --no-owner \
    --no-acl \
    --file="$OUTPUT_FILE"

  if ! pg_restore -l "$OUTPUT_FILE" >/dev/null 2>&1; then
    log_err "dump file failed pg_restore -l validation"
    exit 1
  fi

  local size
  size="$(wc -c <"$OUTPUT_FILE" | tr -d ' ')"
  log "Dump written: $OUTPUT_FILE ($(human_size "$size"))"

  after="$(fetch_counts)"
  if [[ "${SKIP_VERIFY:-0}" != "1" ]]; then
    print_counts "Source counts (after export — should match before):" "$after"
  fi

  log ""
  log "Share this file with George (Drive, etc.). Do not commit the .dump to git."
  log "George restore:"
  log "  pg_restore --dbname='postgresql://USER:PASS@localhost:5432/contractorai' \\"
  log "    --clean --if-exists --no-owner --no-acl --jobs=4 \\"
  log "    '$OUTPUT_FILE'"
}

main "$@"
