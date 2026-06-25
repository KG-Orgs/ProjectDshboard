#!/bin/bash
# Install launchd agents for durable overnight hydrate + index (survives IDE/terminal exit).
set -euo pipefail

DIR="$(cd "$(dirname "$0")/launchd" && pwd)"
UID_NUM="$(id -u)"
AGENT_DIR="$HOME/Library/LaunchAgents"

mkdir -p "$AGENT_DIR"

for label in com.contractorai.tier2-hydrate com.contractorai.tier2-index; do
  plist="$DIR/${label}.plist"
  dest="$AGENT_DIR/${label}.plist"
  cp "$plist" "$dest"
  # Unload if already loaded (ignore errors)
  launchctl bootout "gui/${UID_NUM}" "$dest" 2>/dev/null || true
  launchctl bootstrap "gui/${UID_NUM}" "$dest"
  launchctl enable "gui/${UID_NUM}/${label}" 2>/dev/null || true
  launchctl kickstart -k "gui/${UID_NUM}/${label}" 2>/dev/null || true
  echo "loaded $label"
done

# Prevent sleep while jobs run
caffeinate -dims &
echo $! > /tmp/tier2-caffeinate.pid
echo "caffeinate PID $(cat /tmp/tier2-caffeinate.pid)"
echo ""
echo "Monitor:"
echo "  tail -f /tmp/tier2-hydrate.log /tmp/tier2-overnight-index.log"
echo "Stop:"
echo "  bash $(dirname "$0")/tier2-launchd-stop.sh"
