#!/usr/bin/env bash
# Builds the public-site publish set from .github/publish-manifest.txt.
# Usage: bash scripts/build-publish-set.sh [docs_dir] [manifest] [out_dir]
# Only manifest-listed entries are copied; everything else stays unpublished.
set -euo pipefail
DOCS_DIR="${1:-docs}"
MANIFEST="${2:-.github/publish-manifest.txt}"
OUT="${3:-_publish}"
cd "$(dirname "$0")/.."

rm -rf "$OUT"
mkdir -p "$OUT"
while IFS= read -r entry; do
  case "$entry" in ''|'#'*) continue ;; esac
  if [ -d "$DOCS_DIR/$entry" ]; then
    mkdir -p "$OUT/$entry"
    cp -a "$DOCS_DIR/$entry." "$OUT/$entry/"
  elif [ -f "$DOCS_DIR/$entry" ]; then
    mkdir -p "$OUT/$(dirname "$entry")"
    cp "$DOCS_DIR/$entry" "$OUT/$entry"
  else
    echo "::error::publish-manifest entry missing under $DOCS_DIR/: $entry"
    exit 1
  fi
done < "$MANIFEST"
echo "Publish set: $(find "$OUT" -type f | wc -l) files -> $OUT"
