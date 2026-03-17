#!/bin/sh

set -eu

APP_ROOT="${APP_ROOT:-/app}"
PORT="${PORT:-8080}"
MODE="${1:-site}"
DEFAULTS_ROOT="${DEFAULTS_ROOT:-/opt/builder-defaults}"

mkdir -p "$APP_ROOT/assets/data" "$APP_ROOT/assets/uploads"

if [ ! -f "$APP_ROOT/assets/data/site-content.json" ] && [ -f "$DEFAULTS_ROOT/site-content.json" ]; then
  cp "$DEFAULTS_ROOT/site-content.json" "$APP_ROOT/assets/data/site-content.json"
fi

case "$MODE" in
  site)
    exec python -m http.server "$PORT" --bind 0.0.0.0 --directory "$APP_ROOT"
    ;;
  admin)
    exec python "$APP_ROOT/scripts/admin_server.py" 0.0.0.0 "$PORT"
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    echo "Expected one of: site, admin" >&2
    exit 1
    ;;
esac
