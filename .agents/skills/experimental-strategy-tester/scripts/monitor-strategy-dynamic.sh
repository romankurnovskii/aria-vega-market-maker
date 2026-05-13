#!/bin/bash

# monitor-strategy-dynamic.sh — Assignment-aware dynamic monitor with lineage tracking
# START/STOP/RESTART/STATUS controls with PID tracking and log retention

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
PID_DIR="$LOG_DIR/pids"

ASSIGNMENT_ID="${1:?Usage: $0 <ASSIGNMENT_ID> {start\|stop\|restart\|status\|logs\|clean\} [REPORT_FILE]}"
ACTION="${2:-start}"
REPORT_FILE="${3:-}"

DATA_DIR="/Users/r/dev/github/aria-vega-market-maker/data"

if [ -z "$REPORT_FILE" ]; then
  REPORT_FILE="$LOG_DIR/execution-report-dynamic-${ASSIGNMENT_ID}-$(date +%Y%m%d-%H%M%S).md"
fi

PID_FILE="$PID_DIR/monitor-dynamic-${ASSIGNMENT_ID}.pid"
STDOUT_LOG="$LOG_DIR/monitor-dynamic-${ASSIGNMENT_ID}.out"
STDERR_LOG="$LOG_DIR/monitor-dynamic-${ASSIGNMENT_ID}.err"

mkdir -p "$PID_DIR"

get_initial_position_id() {
  node -e "
    const fs = require('fs');
    try {
      const files = fs.readdirSync('$DATA_DIR').filter(f => f.endsWith('_assignments.json'));
      if (files.length === 0) { process.exit(0); }
      const data = JSON.parse(fs.readFileSync('$DATA_DIR/' + files[0], 'utf8'));
      const asg = data.find(a => a.id === '$ASSIGNMENT_ID');
      console.log(asg ? asg.positionId : '');
    } catch (e) { console.log(''); }
  "
}

get_current_position_id() {
  node -e "
    const fs = require('fs');
    try {
      const files = fs.readdirSync('$DATA_DIR').filter(f => f.endsWith('_assignments.json'));
      if (files.length === 0) { process.exit(0); }
      const data = JSON.parse(fs.readFileSync('$DATA_DIR/' + files[0], 'utf8'));
      const asg = data.find(a => a.id === '$ASSIGNMENT_ID');
      console.log(asg ? asg.positionId : '');
    } catch (e) { console.log(''); }
  "
}

case "$ACTION" in
  start)
    # Detect any existing dynamic monitor process for this assignment (excluding self)
    if pgrep -f "[m]onitor-strategy-dynamic\.sh.*$ASSIGNMENT_ID" >/dev/null 2>&1; then
      for pid in $(pgrep -f "[m]onitor-strategy-dynamic\.sh.*$ASSIGNMENT_ID"); do
        if [ "$pid" -ne $$ ]; then
          echo "ERROR: A dynamic monitor for assignment $ASSIGNMENT_ID is already running (PID $pid). Use '$0 $ASSIGNMENT_ID status' to check or '$0 $ASSIGNMENT_ID stop' to stop it."
          exit 1
        fi
      done
    fi

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "ERROR: Dynamic monitor already running for assignment $ASSIGNMENT_ID (PID $(cat $PID_FILE))."
      exit 1
    fi

    INITIAL_POSITION_ID=$(get_initial_position_id)
    if [ -z "$INITIAL_POSITION_ID" ]; then
      echo "ERROR: Assignment $ASSIGNMENT_ID not found in data directory."
      exit 1
    fi

    echo "=== Starting dynamic monitor for assignment $ASSIGNMENT_ID at $(date) ===" > "$REPORT_FILE"
    echo "Initial Position: $INITIAL_POSITION_ID" | tee -a "$REPORT_FILE"

    # Retention: keep last 10 dynamic reports for this assignment
    find "$LOG_DIR" -maxdepth 1 -name "execution-report-dynamic-${ASSIGNMENT_ID}-*.md" | sort -r | tail -n +11 | xargs -r rm -f

    # daemonize
    nohup bash -c "
      DECLARED_LINEAGE=(\"${INITIAL_POSITION_ID}\")
      echo \"Dynamic monitor started with PID \$\$ at \$(date)\" >> \"$STDOUT_LOG\"

      while true; do
        CURRENT_POSITION_ID=\$(get_initial_position_id 2>/dev/null || true)

        if [ -n \"\$CURRENT_POSITION_ID\" ]; then
          FOUND=0
          for pos in \"\${DECLARED_LINEAGE[@]}\"; do
            [ \"\$pos\" = \"\$CURRENT_POSITION_ID\" ] && FOUND=1
          done
          if [ \$FOUND -eq 0 ]; then
            DECLARED_LINEAGE+=(\"\$CURRENT_POSITION_ID\")
            echo \"\n### Lineage updated: Added \$CURRENT_POSITION_ID at \$(date)\" >> \"$REPORT_FILE\"
          fi
        fi

        echo '' >> \"$REPORT_FILE\"
        echo \"### Update: \$(date)\" >> \"$REPORT_FILE\"
        echo '\`\`\`text' >> \"$REPORT_FILE\"

        GREP_PATTERN=\"\"
        for pos in \"\${DECLARED_LINEAGE[@]}\"; do
          if [ -z \"\$GREP_PATTERN\" ]; then GREP_PATTERN=\"\$pos\"; else GREP_PATTERN=\"\$GREP_PATTERN|\$pos\"; fi
        done

        docker compose -f /Users/r/dev/github/aria-vega-market-maker/docker-compose.dev.yml logs --tail 100 market-maker 2>/dev/null | grep -E \"\$GREP_PATTERN\" >> \"$REPORT_FILE\" || true
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
      echo "No running dynamic monitor found for assignment $ASSIGNMENT_ID."
      exit 0
    fi
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID"
      sleep 1
      if kill -0 "$PID" 2>/dev/null; then
        kill -TERM "$PID" 2>/dev/null || true
      fi
      rm -f "$PID_FILE"
      echo "Stopped dynamic monitor for assignment $ASSIGNMENT_ID (PID $PID)."
    else
      echo "Stale PID file found (process $PID not running). Cleaning up."
      rm -f "$PID_FILE"
    fi
    ;;

  restart)
    $0 "$ASSIGNMENT_ID" stop || true
    sleep 1
    $0 "$ASSIGNMENT_ID" start
    ;;

  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "RUNNING: assignment=$ASSIGNMENT_ID PID=$(cat $PID_FILE)"
      echo "Report: $REPORT_FILE"
      echo "Logs: $STDOUT_LOG (err: $STDERR_LOG)"
    else
      echo "STOPPED: assignment=$ASSIGNMENT_ID"
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
    find "$LOG_DIR" -maxdepth 1 -name "execution-report-dynamic-${ASSIGNMENT_ID}-*.md" -mtime +7 -delete
    find "$PID_DIR" -name "monitor-dynamic-*.pid" -exec sh -c 'p=$(cat "{}"); kill -0 "$p" 2>/dev/null || rm -f "{}"' \;
    echo "Cleaned old dynamic logs (>7d) and stale PID files for $ASSIGNMENT_ID."
    ;;

  *)
    echo "Usage: $0 <ASSIGNMENT_ID> {start|stop|restart|status|logs|clean} [REPORT_FILE]"
    echo ""
    echo "Commands:"
    echo "  start   — Start dynamic monitoring with lineage tracking."
    echo "  stop    — Stop by PID tracking; removes PID file."
    echo "  restart — Stop then start."
    echo "  status  — Show running state and paths."
    echo "  logs    — Tail the current report file."
    echo "  clean   — Delete logs >7d and stale PID files."
    exit 1
    ;;
esac
