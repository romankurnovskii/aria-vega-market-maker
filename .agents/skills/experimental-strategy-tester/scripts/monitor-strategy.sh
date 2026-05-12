#!/bin/bash

# Usage: ./monitor-strategy.sh <POSITION_ID> [REPORT_FILE]

POSITION_ID=$1
REPORT_FILE=${2:-"/Users/r/dev/github/aria-vega-market-maker/.agents/skills/experimental-strategy-tester/logs/execution-report-$(date +%s).md"}

if [ -z "$POSITION_ID" ]; then
  echo "Error: POSITION_ID is required."
  echo "Usage: ./monitor-strategy.sh <POSITION_ID> [REPORT_FILE]"
  exit 1
fi

# Ensure logs directory exists
mkdir -p "$(dirname "$REPORT_FILE")"

echo "" >> "$REPORT_FILE"
echo "## Monitoring Started for Position $POSITION_ID at $(date)" >> "$REPORT_FILE"

while true; do
  echo "" >> "$REPORT_FILE"
  echo "### Update: $(date)" >> "$REPORT_FILE"
  echo '```text' >> "$REPORT_FILE"
  # Get data only related to the position without mix
  docker compose -f /Users/r/dev/github/aria-vega-market-maker/docker-compose.dev.yml logs --tail 50 market-maker | grep "$POSITION_ID" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  sleep 60
done
