#!/bin/bash
# Keeps tier2 hydrate + index watcher alive; restarts on crash. Prevents Mac sleep.
set -uo pipefail

BACKEND="/Users/kyle.weixu/src/ai-assistant/packages/backend"
PROJECT_ID="731cfd5d-e647-4551-89e7-0a3cc4915115"
LOG="/tmp/tier2-supervisor.log"
HYDRATE_LOG="/tmp/tier2-hydrate.log"
INDEX_LOG="/tmp/tier2-overnight-index.log"
PIDFILE="/tmp/tier2-overnight.pids"

cd "$BACKEND"

log() { echo "[supervisor] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG"; }

start_index() {
  nohup pnpm tier2:index -- \
    --preset corpus \
    --project-id "$PROJECT_ID" \
    --concurrency 2 \
    --watch-seconds 120 \
    >> "$INDEX_LOG" 2>&1 < /dev/null &
  INDEX_PID=$!
  log "started index watcher PID $INDEX_PID"
}

start_hydrate() {
  nohup pnpm tier2:hydrate -- --concurrency 2 \
    >> "$HYDRATE_LOG" 2>&1 < /dev/null &
  HYDRATE_PID=$!
  log "started hydrate PID $HYDRATE_PID"
}

if [[ -f "$PIDFILE" ]]; then
  while read -r oldpid; do
    kill -0 "$oldpid" 2>/dev/null && kill "$oldpid" 2>/dev/null || true
  done < "$PIDFILE"
fi

log "supervisor starting (caffeinate prevents sleep)"
start_index
start_hydrate
printf '%s\n' "$INDEX_PID" "$HYDRATE_PID" > "$PIDFILE"

# caffeinate keeps Mac awake while supervisor runs
exec caffeinate -dims bash -c '
  INDEX_PID='"$INDEX_PID"'
  HYDRATE_PID='"$HYDRATE_PID"'
  while true; do
    if ! kill -0 "$INDEX_PID" 2>/dev/null; then
      echo "[supervisor] $(date -u +%Y-%m-%dT%H:%M:%SZ) index died — restarting" >> '"$LOG"'
      cd '"$BACKEND"' && nohup pnpm tier2:index -- --preset corpus --project-id '"$PROJECT_ID"' --concurrency 2 --watch-seconds 120 >> '"$INDEX_LOG"' 2>&1 < /dev/null &
      INDEX_PID=$!
      echo "$INDEX_PID" > '"$PIDFILE"'.index
    fi
    if ! kill -0 "$HYDRATE_PID" 2>/dev/null; then
      echo "[supervisor] $(date -u +%Y-%m-%dT%H:%M:%SZ) hydrate died — restarting" >> '"$LOG"'
      cd '"$BACKEND"' && nohup pnpm tier2:hydrate -- --concurrency 2 >> '"$HYDRATE_LOG"' 2>&1 < /dev/null &
      HYDRATE_PID=$!
      echo "$HYDRATE_PID" >> '"$PIDFILE"'
    fi
    # refresh pid file
    { echo "$INDEX_PID"; echo "$HYDRATE_PID"; } > '"$PIDFILE"'
    sleep 60
  done
'
