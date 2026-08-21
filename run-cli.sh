#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js was not found. Install Node.js 20 LTS or newer, then run this file again." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing Eidovara dependencies..."
  if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
    pnpm install --frozen-lockfile
  else
    npm install
  fi
fi

exec node src/cli.js "$@"
