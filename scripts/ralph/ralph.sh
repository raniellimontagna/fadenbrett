#!/usr/bin/env bash
set -e

# Defaults
TOOL="claude"
MAX_ITERATIONS=10

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    [0-9]*)
      MAX_ITERATIONS="$1"
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ "$TOOL" != "amp" && "$TOOL" != "claude" && "$TOOL" != "codex" ]]; then
  echo "Invalid tool: $TOOL. Use 'amp', 'claude', or 'codex'"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

PRD_FILE="$ROOT_DIR/prd.json"
PROGRESS_FILE="$ROOT_DIR/progress.txt"
LAST_BRANCH_FILE="$ROOT_DIR/.last-branch"

if [[ "$TOOL" == "amp" ]]; then
  PROMPT_FILE="$SCRIPT_DIR/prompt.md"
elif [[ "$TOOL" == "codex" && -f "$ROOT_DIR/CODEX.md" ]]; then
  PROMPT_FILE="$ROOT_DIR/CODEX.md"
elif [[ "$TOOL" == "codex" ]]; then
  PROMPT_FILE="$ROOT_DIR/CLAUDE.md"
elif [[ "$TOOL" == "claude" ]]; then
  PROMPT_FILE="$ROOT_DIR/CLAUDE.md"
else
  PROMPT_FILE="$SCRIPT_DIR/prompt.md"
fi

get_branch() {
  jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo ""
}

check_branch_change() {
  local current_branch last_branch=""
  current_branch=$(get_branch)

  [[ -z "$current_branch" ]] && return

  [[ -f "$LAST_BRANCH_FILE" ]] && last_branch=$(cat "$LAST_BRANCH_FILE")

  if [[ -n "$last_branch" && "$last_branch" != "$current_branch" ]]; then
    local safe_branch archive_dir
    safe_branch=$(echo "$last_branch" | sed 's|ralph/||g' | tr '/' '-')
    archive_dir="$ROOT_DIR/.ralph-archive/$(date +%Y%m%d-%H%M%S)-$safe_branch"
    mkdir -p "$archive_dir"
    [[ -f "$PRD_FILE" ]]      && cp "$PRD_FILE"      "$archive_dir/"
    [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$archive_dir/"
    echo "Archived previous run to $archive_dir"
    : > "$PROGRESS_FILE"
  fi

  echo "$current_branch" > "$LAST_BRANCH_FILE"
}

echo "Starting Helix (ralph) — tool=$TOOL, max_iterations=$MAX_ITERATIONS"
echo "Started at: $(date)" >> "$PROGRESS_FILE"

check_branch_change

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "=== Iteration $i / $MAX_ITERATIONS ==="
  echo ""

  OUTPUT=""

  if [[ "$TOOL" == "claude" ]]; then
    OUTPUT=$(claude --dangerously-skip-permissions --print < "$PROMPT_FILE" 2>&1) || true
  elif [[ "$TOOL" == "codex" ]]; then
    OUTPUT=$(codex exec --full-auto -C "$ROOT_DIR" - < "$PROMPT_FILE" 2>&1) || true
  else
    OUTPUT=$(amp --dangerously-allow-all < "$PROMPT_FILE" 2>&1) || true
  fi

  echo "$OUTPUT"
  echo "--- Iteration $i completed at $(date) ---" >> "$PROGRESS_FILE"

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    exit 0
  fi
done

echo ""
echo "Max iterations ($MAX_ITERATIONS) reached without completing all tasks."
exit 1
