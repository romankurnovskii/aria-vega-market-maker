#!/bin/bash

# monitor-strategy.sh — Managed long-running position monitor
# START/STOP/RESTART/STATUS controls with log retention and PID tracking

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
PID_DIR="$LOG_DIR/pids"

# Derive project root (two levels up from script: .agents/skills/experimental-strategy-tester/scripts/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCKER_COMPOSE="$PROJECT_ROOT/docker-compose.dev.yml"

POSITION_ID="${1:?Usage: $0 <POSITION_ID> [ACTION] [REPORT_FILE]}"
ACTION="${2:-start}"
REPORT_FILE="${3:-}"

if [ -z "$REPORT_FILE" ]; then
  REPORT_FILE="$LOG_DIR/execution-report-${POSITION_ID}-$(date +%Y%m%d-%H%M%S).md"
fi

PID_FILE="$PID_DIR/monitor-${POSITION_ID}.pid"
STDOUT_LOG="$LOG_DIR/monitor-${POSITION_ID}.out"
STDERR_LOG="$LOG_DIR/monitor-${POSITION_ID}.err"

mkdir -p "$PID_DIR"

running=1
cleanup() {
  echo "Received signal, shutting down gracefully..." >> "$REPORT_FILE"
  running=0
}
trap cleanup SIGTERM SIGINT SIGHUP

case "$ACTION" in
  start)
    # Detect any existing monitor process for this position (excluding self)
    if pgrep -f "[m]onitor-strategy\.sh[[:space:]].* $POSITION_ID " >/dev/null 2>&1; then
      for pid in $(pgrep -f "[m]onitor-strategy\.sh[[:space:]].* $POSITION_ID "); do
        if [ "$pid" -ne $$ ]; then
          echo "ERROR: A monitor for position $POSITION_ID is already running (PID $pid). Use '$0 $POSITION_ID status' to check or '$0 $POSITION_ID stop' to stop it."
          exit 1
        fi
      done
    fi

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "ERROR: Monitor already running for position $POSITION_ID (PID $(cat $PID_FILE)). Use '$0 $POSITION_ID restart' to restart."
      exit 1
    fi

    if [ ! -f "$DOCKER_COMPOSE" ]; then
      echo "ERROR: docker-compose file not found at $DOCKER_COMPOSE"
      exit 1
    fi

    echo "=== Starting monitor for position $POSITION_ID at $(date) ===" > "$REPORT_FILE"
    echo "Logs: $REPORT_FILE" | tee -a "$REPORT_FILE"

    # Rotate old logs: keep last 10 per position
    find "$LOG_DIR" -maxdepth 1 -name "execution-report-${POSITION_ID}-*.md" | sort -r | tail -n +11 | xargs -r rm -f

    # daemonize
    nohup bash -c "
      trap 'exit 0' SIGTERM SIGINT SIGHUP
      echo \"Monitor started with PID \$ at \$(date)\" >> \"$STDOUT_LOG\"
      while [ \$running -eq 1 ]; do
        echo '' >> \"$REPORT_FILE\"
        echo \"### Update: \$(date)\" >> \"$REPORT_FILE\"
        echo '\`\`\`text' >> \"$REPORT_FILE\"
        docker compose -f \"$DOCKER_COMPOSE\" logs --tail 50 market-maker 2>/dev/null | grep -F \"$POSITION_ID\" >> \"$REPORT_FILE\" || true
        echo '\`\`\`' >> \"$REPORT_FILE\"
        sleep 60
      done
    " > "$STDOUT_LOG" 2> "$STDERR_LOG" &
    PID=$!
    echo "$PID" > "$PID_FILE"
    echo "Started (PID $PID). Report: $REPORT_FILE"
    ;;

  stop)
    if [ ! -f "$PID_FILE" ]; then
      echo "No running monitor found for position $POSITION_ID."
      exit 0
    fi
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      sleep 1
      if kill -0 "$PID" 2>/dev/null; then
        echo "WARN: Process $PID did not exit, sending TERM again..."
        kill -TERM "$PID" 2>/dev/null || true
      fi
      rm -f "$PID_FILE"
      echo "Stopped monitor for position $POSITION_ID (PID $PID)."
    else
      echo "Stale PID file found (process $PID not running). Cleaning up."
      rm -f "$PID_FILE"
    fi
    ;;

  restart)
    $0 "$POSITION_ID" stop || true
    sleep 1
    $0 "$POSITION_ID" start
    ;;

  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "RUNNING: position=$POSITION_ID PID=$(cat $PID_FILE)"
      echo "Report: $REPORT_FILE"
      echo "Logs: $STDOUT_LOG (err: $STDERR_LOG)"
    else
      echo "STOPPED: position=$POSITION_ID"
      [ -f "$PID_FILE" ] && echo "(stale PID file removed)" && rm -f "$PID_FILE"
    fi
    ;;

  logs)
    if [ -f "$REPORT_FILE" ]; then
      echo "=== Tailing $REPORT_FILE ==="
      tail -f "$REPORT_FILE"
    else
      echo "No report file found: $REPORT_FILE"
      exit 1
    fi
    ;;

  clean)
    # Remove all logs older than 7 days for this position OR all stale pids
    find "$LOG_DIR" -maxdepth 1 -name "execution-report-${POSITION_ID}-*.md" -mtime +7 -delete
    find "$PID_DIR" -name "monitor-*.pid" -exec sh -c 'p=$(cat "{}"); kill -0 "$p" 2>/dev/null || rm -f "{}"' \;
    echo "Cleaned old logs (>7d) and stale PID files for $POSITION_ID."
    ;;

  *)
    echo "Usage: $0 <POSITION_ID> {start|stop|restart|status|logs|clean} [REPORT_FILE]"
    echo ""
    echo "Commands:"
    echo "  start   — Start monitoring (default). Creates PID, rotates old logs (keep 10)."
    echo "  stop    — Stop by PID tracking. Removes PID file."
    echo "  restart — Stop then start."
    echo "  status  — Show running state and paths."
    echo "  logs    — Tail the current report file."
    echo "  clean   — Delete logs >7d and stale PID files."
    exit 1
    ;;
esac
