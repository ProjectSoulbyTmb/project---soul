#!/usr/bin/env bash
set -euo pipefail
npm ci || npm install
npm test
npm run smoke
npm run dist:linux
npm run dist:win
npm run dist:mac:x64
npm run dist:mac:arm64
