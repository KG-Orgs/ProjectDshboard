#!/usr/bin/env bash
#
# Reset chunk-related tables on cloud Postgres before a full re-migrate or
# batched chunk restore.
#
# Use when Neon has orphaned chunk_links (links restored but file_chunks failed
# due to the 512 MB free-tier limit) OR before pg_restore --clean.
#
# --- Prerequisites ---
# 1. Neon on Launch (paid) — Free tier blocks writes past 512 MB.
# 2. TARGET_DATABASE_URL or non-localhost DATABASE_URL in repo-root .env
#
# --- Typical flow (after Neon upgrade) ---
#   pnpm --filter @contractor/backend db:clean-cloud-chunks
#   pnpm --filter @contractor/backend db:restore-chunks-batched
#
# To wipe links too (only needed before a full pg_restore with new UUIDs):
#   TRUNCATE_LINKS=1 pnpm --filter @contractor/backend db:clean-cloud-chunks
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
TRUNCATE_LINKS="${TRUNCATE_LINKS:-0}"
DRY_RUN=0

log() { printf '%s\n' "$*"; }
log_err() { printf 'error: %s\n' "$*" >&2; }

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
    process.exit(u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? 0 : 1);
  " "$url"
}

read_env_database_url() {
  [[ -f "$ENV_FILE" ]] || return 1
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

resolve_target_url() {
  if [[ -n "$TARGET_DATABASE_URL" ]]; then
    return 0
  fi
  local env_url=""
  if env_url="$(read_env_database_url 2>/dev/null || true)" && [[ -n "$env_url" ]]; then
    if url_host_is_local "$env_url"; then
      log_err "DATABASE_URL in .env points to localhost. Set TARGET_DATABASE_URL."
      exit 1
    fi
    TARGET_DATABASE_URL="$env_url"
    return 0
  fi
  log_err "TARGET_DATABASE_URL is required (or set a non-localhost DATABASE_URL in .env)."
  exit 1
}

usage() {
  cat <<'EOF'
Usage: clean-cloud-chunk-state.sh [--dry-run]

Truncates file_chunks on the cloud target. By default keeps chunk_links intact
(they become valid once chunks are copied with the same UUIDs).

Environment:
  TARGET_DATABASE_URL   Cloud DB URL
  TRUNCATE_LINKS=1      Also truncate chunk_links (use before full pg_restore)

Options:
  --dry-run             Print actions without executing
  -h, --help            Show this help
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dry-run) DRY_RUN=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) log_err "unknown argument: $1"; usage >&2; exit 1 ;;
    esac
  done
}

main() {
  parse_args "$@"
  command -v psql >/dev/null 2>&1 || { log_err "missing psql"; exit 1; }
  resolve_target_url

  if url_host_is_local "$TARGET_DATABASE_URL"; then
    log_err "refusing to clean localhost (local DB is source of truth)"
    exit 1
  fi

  log "Target: $(redact_url "$TARGET_DATABASE_URL")"

  local counts
  counts="$(psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL'
SELECT 'file_chunks', COUNT(*)::text FROM file_chunks;
SELECT 'chunk_links', COUNT(*)::text FROM chunk_links;
SELECT 'orphan_links', COUNT(*)::text FROM chunk_links cl
  WHERE NOT EXISTS (SELECT 1 FROM file_chunks fc WHERE fc.id = cl.source_chunk_id);
SQL
)"
  while IFS='|' read -r label value; do
    log "  before $label: $value"
  done <<<"$counts"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would TRUNCATE file_chunks${TRUNCATE_LINKS:+ and chunk_links}"
    exit 0
  fi

  if [[ "$TRUNCATE_LINKS" == "1" ]]; then
    log "Truncating chunk_links and file_chunks..."
    psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
TRUNCATE chunk_links;
TRUNCATE file_chunks;
SQL
  else
    log "Truncating file_chunks only (keeping chunk_links for UUID reuse)..."
    psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE file_chunks;"
  fi

  counts="$(psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL'
SELECT 'file_chunks', COUNT(*)::text FROM file_chunks;
SELECT 'chunk_links', COUNT(*)::text FROM chunk_links;
SQL
)"
  while IFS='|' read -r label value; do
    log "  after $label: $value"
  done <<<"$counts"

  log "Clean complete."
}

main "$@"
