#!/bin/bash

# Usage: ./monitor-strategy-dynamic.sh <ASSIGNMENT_ID> [REPORT_FILE]

ASSIGNMENT_ID=$1
REPORT_FILE=${2:-"/Users/r/dev/github/aria-vega-market-maker/.agents/skills/experimental-strategy-tester/logs/execution-report-$(date +%s).md"}

if [ -z "$ASSIGNMENT_ID" ]; then
  echo "Error: ASSIGNMENT_ID is required."
  exit 1
fi

# Ensure logs directory exists
mkdir -p "$(dirname "$REPORT_FILE")"

# Find original position ID from the assignment first
INITIAL_POSITION_ID=$(node -e "const fs = require('fs'); const files = fs.readdirSync('/Users/r/dev/github/aria-vega-market-maker/data').filter(f => f.endsWith('_assignments.json')); if (files.length === 0) process.exit(0); const data = JSON.parse(fs.readFileSync('/Users/r/dev/github/aria-vega-market-maker/data/' + files[0], 'utf8')); const asg = data.find(a => a.id === '$ASSIGNMENT_ID'); console.log(asg ? asg.positionId : '');")

echo "" >> "$REPORT_FILE"
echo "## Dynamic Monitoring Started for Assignment $ASSIGNMENT_ID at $(date)" >> "$REPORT_FILE"
echo "### Initial Position Tracked: $INITIAL_POSITION_ID" >> "$REPORT_FILE"

# Track all positions we've seen in the lineage to grep for them
DECLARED_LINEAGE=("$INITIAL_POSITION_ID")

while true; do
  # Get the current position ID from assignment json file
  CURRENT_POSITION_ID=$(node -e "const fs = require('fs'); const files = fs.readdirSync('/Users/r/dev/github/aria-vega-market-maker/data').filter(f => f.endsWith('_assignments.json')); if (files.length === 0) process.exit(0); const data = JSON.parse(fs.readFileSync('/Users/r/dev/github/aria-vega-market-maker/data/' + files[0], 'utf8')); const asg = data.find(a => a.id === '$ASSIGNMENT_ID'); console.log(asg ? asg.positionId : '');")
  
  # If we have a new position in lineage, add it
  if [ ! -z "$CURRENT_POSITION_ID" ]; then
    FOUND=0
    for pos in "${DECLARED_LINEAGE[@]}"; do
      if [ "$pos" = "$CURRENT_POSITION_ID" ]; then
        FOUND=1
      fi
    done
    if [ $FOUND -eq 0 ]; then
      DECLARED_LINEAGE+=("$CURRENT_POSITION_ID")
      echo "### Lineage updated: Added $CURRENT_POSITION_ID" >> "$REPORT_FILE"
    fi
  fi

  echo "" >> "$REPORT_FILE"
  echo "### Update: $(date)" >> "$REPORT_FILE"
  echo '```text' >> "$REPORT_FILE"
  
  # Build a regex for grep of all IDs in the lineage
  GREP_PATTERN=""
  for pos in "${DECLARED_LINEAGE[@]}"; do
    if [ -z "$GREP_PATTERN" ]; then
      GREP_PATTERN="$pos"
    else
      GREP_PATTERN="$GREP_PATTERN|$pos"
    fi
  done

  # Get logs matching any ID in the lineage
  docker compose -f /Users/r/dev/github/aria-vega-market-maker/docker-compose.dev.yml logs --tail 100 market-maker | grep -E "$GREP_PATTERN" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  sleep 60
done
