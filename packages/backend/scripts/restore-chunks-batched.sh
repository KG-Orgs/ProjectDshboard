#!/usr/bin/env bash
#
# Copy file_chunks from local Postgres to cloud in batches (resumable).
#
# Use when metadata (file_records, projects, chunk_links) is already on Neon but
# file_chunks failed to restore — typically because the Free tier 512 MB limit
# was hit mid-pg_restore. Existing chunk_links on Neon reference the same chunk
# UUIDs as local; once chunks are copied, links become valid automatically.
#
# --- Prerequisites ---
# 1. Upgrade Neon to Launch (paid). Free tier cannot hold ~9 GB.
#    Storage: ~$0.35/GB-month → ~12 GB ≈ $4.20/month + compute during restore.
# 2. Local DB running with full chunks (~964k rows, ~8.6 GB).
# 3. Cloud DB has file_records (10,721 rows) and MLJ-017 project.
#
# --- Recommended path (Kyle) ---
#   # 1. Upgrade at https://console.neon.tech → project → Upgrade to Launch
#   # 2. Optional: ensure cloud file_chunks is empty
#   pnpm --filter @contractor/backend db:clean-cloud-chunks
#   # 3. Batched copy (~1–3 hours depending on network; resumable)
#   pnpm --filter @contractor/backend db:restore-chunks-batched
#   # 4. Verify
#   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM file_chunks"
#   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM chunk_links cl WHERE NOT EXISTS (SELECT 1 FROM file_chunks fc WHERE fc.id = cl.source_chunk_id)"
#
# --- Alternative: full data-only restore from existing dump ---
#   pg_restore --dbname="$DATABASE_URL" --data-only --no-owner --no-acl \
#     --table=file_chunks /tmp/contractorai-neon-migrate.dump
#   (Use keepalives URL; may still timeout — batched copy is safer.)
#
# --- Resume after interruption ---
#   LAST_ID='<last logged uuid>' pnpm --filter @contractor/backend db:restore-chunks-batched
#
# --- For George (after migration completes) ---
#   Copy .env.example → .env, set DATABASE_URL to shared cloud URL, pnpm dev, sign in.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-postgresql://contractor:contractor_dev_password@localhost:5432/contractorai}"
TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-}"
BATCH_SIZE="${BATCH_SIZE:-5000}"
LAST_ID="${LAST_ID:-00000000-0000-0000-0000-000000000000}"
EXPECTED_CHUNKS="${EXPECTED_CHUNKS:-964000}"
CHUNK_TOLERANCE="${CHUNK_TOLERANCE:-5000}"
DRY_RUN=0

FILE_CHUNKS_COLUMNS="id, project_id, file_id, onedrive_item_id, file_name, chunk_index, chunk_text, source_type, page_number, section_label, metadata, confidence, token_count, embedding_model, embedding_vector, created_at"

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
    log "Using cloud DATABASE_URL from .env ($(redact_url "$TARGET_DATABASE_URL"))"
    return 0
  fi
  log_err "TARGET_DATABASE_URL is required (or set a non-localhost DATABASE_URL in .env)."
  exit 1
}

usage() {
  cat <<'EOF'
Usage: restore-chunks-batched.sh [options]

Environment:
  SOURCE_DATABASE_URL   Local DB (default: localhost contractorai)
  TARGET_DATABASE_URL   Cloud DB (or non-local DATABASE_URL in .env)
  BATCH_SIZE            Rows per batch (default: 5000)
  LAST_ID               Resume after this chunk UUID (default: all zeros)
  EXPECTED_CHUNKS       Verification target (default: 964000)

Options:
  --batch-size N        Same as BATCH_SIZE
  --last-id UUID        Resume from chunk id
  --dry-run             Show plan only
  -h, --help            Show this help
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --batch-size)
        BATCH_SIZE="${2:-}"
        shift 2
        ;;
      --last-id)
        LAST_ID="${2:-}"
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

preflight() {
  command -v psql >/dev/null 2>&1 || { log_err "missing psql"; exit 1; }

  local source_count target_chunks target_files orphan_links
  source_count="$(psql "$SOURCE_DATABASE_URL" -At -c "SELECT COUNT(*) FROM file_chunks;")"
  target_chunks="$(psql "$TARGET_DATABASE_URL" -At -c "SELECT COUNT(*) FROM file_chunks;")"
  target_files="$(psql "$TARGET_DATABASE_URL" -At -c "SELECT COUNT(*) FROM file_records;")"
  orphan_links="$(psql "$TARGET_DATABASE_URL" -At -c "SELECT COUNT(*) FROM chunk_links cl WHERE NOT EXISTS (SELECT 1 FROM file_chunks fc WHERE fc.id = cl.source_chunk_id);")"

  log "Source file_chunks: $source_count ($(redact_url "$SOURCE_DATABASE_URL"))"
  log "Target file_chunks: $target_chunks, file_records: $target_files"
  log "Target orphan chunk_links: $orphan_links"

  if [[ "$target_files" -lt 10000 ]]; then
    log_err "target has too few file_records ($target_files). Run db:migrate-to-cloud metadata first."
    exit 1
  fi

  if [[ "$source_count" -lt 100000 ]]; then
    log_err "source file_chunks count suspiciously low ($source_count). Is local DB the source of truth?"
    exit 1
  fi

  if [[ "$target_chunks" -gt 0 && "$LAST_ID" == "00000000-0000-0000-0000-000000000000" ]]; then
    log_err "target already has $target_chunks chunks. Set LAST_ID to resume, or run db:clean-cloud-chunks first."
    exit 1
  fi
}

copy_batch() {
  local last_id="$1"
  local target_url
  target_url="$(with_keepalives_url "$TARGET_DATABASE_URL")"

  psql "$SOURCE_DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "
    COPY (
      SELECT ${FILE_CHUNKS_COLUMNS}
      FROM file_chunks
      WHERE id > '${last_id}'::uuid
      ORDER BY id
      LIMIT ${BATCH_SIZE}
    ) TO STDOUT
  " | psql "$target_url" -v ON_ERROR_STOP=1 -c "
    COPY file_chunks (${FILE_CHUNKS_COLUMNS}) FROM STDIN
  "
}

verify_target() {
  local count orphan
  count="$(psql "$TARGET_DATABASE_URL" -At -c "SELECT COUNT(*) FROM file_chunks;")"
  orphan="$(psql "$TARGET_DATABASE_URL" -At -c "SELECT COUNT(*) FROM chunk_links cl WHERE NOT EXISTS (SELECT 1 FROM file_chunks fc WHERE fc.id = cl.source_chunk_id);")"
  local min_ok=$((EXPECTED_CHUNKS - CHUNK_TOLERANCE))

  log "Verification: file_chunks=$count, orphan chunk_links=$orphan"

  if [[ "$count" -lt "$min_ok" ]]; then
    log_err "expected at least $min_ok file_chunks, got $count"
    exit 1
  fi
  if [[ "$orphan" -gt 100 ]]; then
    log_err "expected orphan chunk_links near 0, got $orphan (chunk UUID mismatch?)"
    exit 1
  fi
  log "Verification passed."
}

main() {
  parse_args "$@"
  resolve_target_url

  if url_host_is_local "$TARGET_DATABASE_URL"; then
    log_err "refusing to restore into localhost"
    exit 1
  fi

  log "Source: $(redact_url "$SOURCE_DATABASE_URL")"
  log "Target: $(redact_url "$TARGET_DATABASE_URL")"
  log "Batch size: $BATCH_SIZE, starting after id: $LAST_ID"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] would copy file_chunks in batches of $BATCH_SIZE"
    exit 0
  fi

  preflight

  local last_id="$LAST_ID"
  local batch_num=0
  local copied=0
  local batch_count new_last_id

  while true; do
    batch_num=$((batch_num + 1))
    batch_count="$(psql "$SOURCE_DATABASE_URL" -At -c "
      SELECT COUNT(*)::text FROM (
        SELECT 1 FROM file_chunks
        WHERE id > '${last_id}'::uuid
        ORDER BY id
        LIMIT ${BATCH_SIZE}
      ) t;
    ")"

    if [[ "$batch_count" == "0" ]]; then
      log "No more rows after id $last_id."
      break
    fi

    log "Batch $batch_num: copying $batch_count rows after $last_id ..."
    copy_batch "$last_id"

    new_last_id="$(psql "$SOURCE_DATABASE_URL" -At -c "
      SELECT id::text FROM file_chunks
      WHERE id > '${last_id}'::uuid
      ORDER BY id
      LIMIT 1 OFFSET $((BATCH_SIZE - 1));
    ")"

    if [[ -z "$new_last_id" ]]; then
      new_last_id="$(psql "$SOURCE_DATABASE_URL" -At -c "
        SELECT id::text FROM file_chunks
        WHERE id > '${last_id}'::uuid
        ORDER BY id DESC
        LIMIT 1;
      ")"
      copied=$((copied + batch_count))
      log "  done. last_id=$new_last_id (final batch, total copied this run: $copied)"
      break
    fi

    last_id="$new_last_id"
    copied=$((copied + batch_count))
    log "  done. last_id=$last_id (total copied this run: $copied)"
  done

  verify_target
  log "Batched chunk restore complete."
}

main "$@"
