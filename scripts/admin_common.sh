#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${(%):-%N}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$PROJECT_ROOT/.service"
ADMIN_PID_FILE="$SERVICE_DIR/admin.pid"
ADMIN_LOG_FILE="$SERVICE_DIR/admin.log"
ADMIN_PORT="${ADMIN_PORT:-4174}"
ADMIN_HOST="${ADMIN_HOST:-127.0.0.1}"

ensure_service_dir() {
  mkdir -p "$SERVICE_DIR"
}

admin_read_pid() {
  if [[ -f "$ADMIN_PID_FILE" ]]; then
    tr -d '[:space:]' < "$ADMIN_PID_FILE"
  fi
}

admin_is_running() {
  local pid
  pid="$(admin_read_pid)"

  if [[ -z "${pid:-}" ]]; then
    return 1
  fi

  kill -0 "$pid" 2>/dev/null
}

admin_cleanup_stale_pid() {
  if [[ -f "$ADMIN_PID_FILE" ]] && ! admin_is_running; then
    rm -f "$ADMIN_PID_FILE"
  fi
}

start_admin_server() {
  local pid

  ensure_service_dir
  admin_cleanup_stale_pid

  if admin_is_running; then
    pid="$(admin_read_pid)"
    echo "Admin service is already running with PID $pid on http://$ADMIN_HOST:$ADMIN_PORT"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found in PATH."
    return 1
  fi

  pid="$(python3 "$SCRIPT_DIR/launch_admin.py" "$PROJECT_ROOT" "$ADMIN_LOG_FILE" "$ADMIN_HOST" "$ADMIN_PORT")"
  printf '%s\n' "$pid" > "$ADMIN_PID_FILE"

  if [[ -z "${pid:-}" ]]; then
    echo "Failed to create a PID file for the admin service."
    return 1
  fi

  for _ in {1..5}; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "Started admin service with PID $pid"
      echo "URL: http://$ADMIN_HOST:$ADMIN_PORT"
      echo "Log: $ADMIN_LOG_FILE"
      return 0
    fi

    sleep 1
  done

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "Failed to start admin service. Check $ADMIN_LOG_FILE for details."
    rm -f "$ADMIN_PID_FILE"
    return 1
  fi

  echo "Started admin service with PID $pid"
  echo "URL: http://$ADMIN_HOST:$ADMIN_PORT"
  echo "Log: $ADMIN_LOG_FILE"
}

stop_admin_server() {
  local pid
  local attempts=0

  admin_cleanup_stale_pid

  if ! [[ -f "$ADMIN_PID_FILE" ]]; then
    echo "Admin service is not running."
    return 0
  fi

  pid="$(admin_read_pid)"

  if [[ -z "${pid:-}" ]]; then
    rm -f "$ADMIN_PID_FILE"
    echo "Admin service was not running."
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

  rm -f "$ADMIN_PID_FILE"
  echo "Stopped admin service."
}
