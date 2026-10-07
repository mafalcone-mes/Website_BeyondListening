#!/bin/bash
# Double-click to start Beyond Listening on a Mac.
# First time only: right-click this file → Open (macOS asks for confirmation once).
cd "$(dirname "$0")" || exit 1
printf '\033]0;Beyond Listening\007'
source scripts/bootstrap-node.sh
if ! bl_ensure_node; then
  echo
  read -r -p "Could not prepare Node.js. Press Enter to close..."
  exit 1
fi
exec node scripts/launcher.mjs start
