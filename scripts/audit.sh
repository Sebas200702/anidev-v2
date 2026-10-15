#!/usr/bin/env bash
# Security audit gate: `bun audit` at high+ with the reviewed allowlist.
# Fails closed on any NEW (unlisted) advisory. Usage: `bun run audit`.
set -euo pipefail

ignores=()
while IFS= read -r line; do
  # Strip comments and blank lines; first token is the GHSA id.
  clean="${line%%#*}"
  id="$(echo "$clean" | tr -d '[:space:]')"
  if [ -n "$id" ]; then
    ignores+=("--ignore=$id")
  fi
done < audit-allowlist.txt

exec bun audit --audit-level=high "${ignores[@]}"
