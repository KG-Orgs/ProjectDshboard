#!/bin/bash
# Overnight on macOS: run hydrate + index watcher as detached sibling processes.
set -euo pipefail

BACKEND="/Users/kyle.weixu/src/ai-assistant/packages/backend"
PROJECT_ID="731cfd5d-e647-4551-89e7-0a3cc4915115"
LOG="/tmp/tier2-overnight.log"
PIDFILE="/tmp/tier2-overnight.pids"

cd "$BACKEND"

if [[ -f "$PIDFILE" ]]; then
  alive=0
  while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then alive=1; fi
  done < "$PIDFILE"
  if [[ "$alive" -eq 1 ]]; then
    echo "[overnight] already running (see $PIDFILE)"
    exit 1
  fi
fi

echo "[overnight] $(date -u +%Y-%m-%dT%H:%M:%SZ) starting" | tee -a "$LOG"
df -h "/Users/kyle.weixu/Library/CloudStorage/OneDrive-Personal" | tee -a "$LOG"

if [[ "${SKIP_INITIAL_TIER1:-}" != "1" ]]; then
  echo "[overnight] tier1 ingest" | tee -a "$LOG"
  pnpm tier1:ingest >> "$LOG" 2>&1
fi

nohup pnpm tier2:index -- \
  --preset corpus \
  --project-id "$PROJECT_ID" \
  --concurrency 2 \
  --watch-seconds 120 \
  >> /tmp/tier2-overnight-index.log 2>&1 < /dev/null &
INDEX_PID=$!

nohup pnpm tier2:hydrate -- --concurrency 2 \
  >> /tmp/tier2-hydrate.log 2>&1 < /dev/null &
HYDRATE_PID=$!

printf '%s\n' "$INDEX_PID" "$HYDRATE_PID" > "$PIDFILE"
echo "[overnight] index PID $INDEX_PID | hydrate PID $HYDRATE_PID" | tee -a "$LOG"
echo "[overnight] tail -f /tmp/tier2-hydrate.log /tmp/tier2-overnight-index.log" | tee -a "$LOG"
