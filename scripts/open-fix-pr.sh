#!/usr/bin/env bash
# Open a PR for a ticket fix. Run after you've applied the fix and committed (or stage+commit here).
#
# Usage:
#   ./scripts/open-fix-pr.sh TICKET_ID "fix: short description"
#   ./scripts/open-fix-pr.sh 442 "fix: dashboard 500 for session abc-123"
#
# Requires: gh (GitHub CLI), git

set -e

TICKET_ID="${1:?Usage: $0 TICKET_ID \"fix: short description\"}"
TITLE="${2:?Usage: $0 TICKET_ID \"fix: short description\"}"
BRANCH="fix/TICKET-${TICKET_ID}"

if [[ -n "$(git status -s)" ]]; then
  git checkout -b "$BRANCH"
  git add -A
  git commit -m "${TITLE} (TICKET-${TICKET_ID})"
else
  # Already committed; ensure branch name
  current=$(git branch --show-current)
  if [[ "$current" != "$BRANCH" ]]; then
    git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"
  fi
fi

gh pr create --title "${TITLE} (TICKET-${TICKET_ID})" --body "Fixes TICKET-${TICKET_ID}."
