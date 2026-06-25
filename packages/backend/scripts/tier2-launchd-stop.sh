#!/bin/bash
set -euo pipefail

UID_NUM="$(id -u)"
AGENT_DIR="$HOME/Library/LaunchAgents"

for label in com.contractorai.tier2-hydrate com.contractorai.tier2-index; do
  dest="$AGENT_DIR/${label}.plist"
  launchctl bootout "gui/${UID_NUM}" "$dest" 2>/dev/null || true
  echo "stopped $label"
done

if [[ -f /tmp/tier2-caffeinate.pid ]]; then
  kill "$(cat /tmp/tier2-caffeinate.pid)" 2>/dev/null || true
  rm -f /tmp/tier2-caffeinate.pid
fi

pkill -f "tier2-hydrate|tier2-index.*watch-seconds|tier2-supervisor" 2>/dev/null || true
echo "done"
