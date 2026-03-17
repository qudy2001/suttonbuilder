#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${(%):-%N}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$PROJECT_ROOT/.service"
SITE_PID_FILE="$SERVICE_DIR/site.pid"
SITE_LOG_FILE="$SERVICE_DIR/site.log"
PORT="${PORT:-4173}"
SITE_HOST="${SITE_HOST:-127.0.0.1}"

ensure_service_dir() {
  mkdir -p "$SERVICE_DIR"
}

site_read_pid() {
  if [[ -f "$SITE_PID_FILE" ]]; then
    tr -d '[:space:]' < "$SITE_PID_FILE"
  fi
}

site_is_running() {
  local pid
  pid="$(site_read_pid)"

  if [[ -z "${pid:-}" ]]; then
    return 1
  fi

  kill -0 "$pid" 2>/dev/null
}

site_cleanup_stale_pid() {
  if [[ -f "$SITE_PID_FILE" ]] && ! site_is_running; then
    rm -f "$SITE_PID_FILE"
  fi
}

start_server() {
  local pid

  ensure_service_dir
  site_cleanup_stale_pid

  if site_is_running; then
    pid="$(site_read_pid)"
    echo "Site service is already running with PID $pid on http://$SITE_HOST:$PORT"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found in PATH."
    return 1
  fi

  pid="$(python3 "$SCRIPT_DIR/launch_server.py" "$PROJECT_ROOT" "$SITE_LOG_FILE" "$SITE_HOST" "$PORT")"
  printf '%s\n' "$pid" > "$SITE_PID_FILE"

  if [[ -z "${pid:-}" ]]; then
    echo "Failed to create a PID file for the site service."
    return 1
  fi

  for _ in {1..5}; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "Started site service with PID $pid"
      echo "URL: http://$SITE_HOST:$PORT"
      echo "Log: $SITE_LOG_FILE"
      return 0
    fi

    sleep 1
  done

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Failed to start site service. Check $SITE_LOG_FILE for details."
    rm -f "$SITE_PID_FILE"
    return 1
  fi

  echo "Started site service with PID $pid"
  echo "URL: http://$SITE_HOST:$PORT"
  echo "Log: $SITE_LOG_FILE"
}

stop_server() {
  local pid
  local attempts=0

  site_cleanup_stale_pid

  if ! [[ -f "$SITE_PID_FILE" ]]; then
    echo "Site service is not running."
    return 0
  fi

  pid="$(site_read_pid)"

  if [[ -z "${pid:-}" ]]; then
    rm -f "$SITE_PID_FILE"
    echo "Site service was not running."
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true

    while kill -0 "$pid" 2>/dev/null; do
      attempts=$((attempts + 1))

      if (( attempts >= 10 )); then
        kill -9 "$pid" 2>/dev/null || true
        break
      fi

      sleep 1
    done
  fi

  rm -f "$SITE_PID_FILE"
  echo "Stopped site service."
}
