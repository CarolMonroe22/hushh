#!/bin/bash

# Ralph - Autonomous AI Loop for Hushh Visual Improvements
# Based on: https://github.com/snarktank/ralph

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
SPRINT_FILE="$SCRIPT_DIR/sprint.json"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize progress file if it doesn't exist
touch "$PROGRESS_FILE"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ralph - Autonomous AI Loop${NC}"
echo -e "${BLUE}  Project: Hushh Visual Improvements${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Check if claude is installed
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: claude CLI is required but not installed.${NC}"
    exit 1
fi

# Parse sprint.json and get all tasks
get_tasks() {
    jq -r '.sprints[] | .tasks[] | "\(.id)|\(.description)|\(.details)"' "$SPRINT_FILE"
}

# Check if task is already completed
is_completed() {
    local task_id=$1
    grep -q "^$task_id|" "$PROGRESS_FILE" 2>/dev/null
}

# Mark task as completed
mark_completed() {
    local task_id=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$task_id|$timestamp|completed" >> "$PROGRESS_FILE"
}

# Mark task as failed
mark_failed() {
    local task_id=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$task_id|$timestamp|failed" >> "$PROGRESS_FILE"
}

# Read base prompt
BASE_PROMPT=$(cat "$PROMPT_FILE")

# Change to project directory
cd "$PROJECT_DIR"

echo -e "${YELLOW}Starting Ralph loop...${NC}"
echo -e "Project directory: $PROJECT_DIR"
echo -e "Progress file: $PROGRESS_FILE"
echo ""

# Counter for completed tasks
completed=0
failed=0
skipped=0

# Process each task
while IFS='|' read -r task_id description details; do
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${BLUE}Task $task_id: $description${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"

    # Check if already completed
    if is_completed "$task_id"; then
        echo -e "${YELLOW}Skipping (already completed)${NC}"
        ((skipped++))
        continue
    fi

    # Build the full prompt for this task
    TASK_PROMPT="$BASE_PROMPT

## Current Task
**ID:** $task_id
**Description:** $description
**Details:** $details

## Instructions
1. Read src/pages/Index.tsx
2. Implement ONLY this specific change: $description
3. $details
4. Run npm run build to verify
5. If successful, the task is complete

Do NOT make any other changes. Focus ONLY on this task."

    echo -e "${GREEN}Spawning Claude Code instance...${NC}"

    # Run Claude Code with the task
    if claude --dangerously-skip-permissions -p "$TASK_PROMPT" 2>&1; then
        echo -e "${GREEN}Task $task_id completed successfully${NC}"

        # Commit the change
        if git diff --quiet; then
            echo -e "${YELLOW}No changes detected, skipping commit${NC}"
        else
            git add -A
            git commit -m "Ralph: $task_id - $description

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
            echo -e "${GREEN}Changes committed${NC}"
        fi

        mark_completed "$task_id"
        ((completed++))
    else
        echo -e "${RED}Task $task_id failed${NC}"
        mark_failed "$task_id"
        ((failed++))

        # Ask if should continue
        read -p "Continue with next task? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            break
        fi
    fi

    echo ""
done < <(get_tasks)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Ralph Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Completed: ${GREEN}$completed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo -e "Skipped: ${YELLOW}$skipped${NC}"
echo ""

# Push to GitHub if there were changes
if [ $completed -gt 0 ]; then
    read -p "Push all changes to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        echo -e "${GREEN}Changes pushed to GitHub${NC}"
    fi
fi
