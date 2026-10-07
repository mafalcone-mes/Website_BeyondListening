#!/bin/bash
# Double-click to save a backup of all stories and recordings into the "backups" folder.
# The site must be running (use "Start Beyond Listening" first).
cd "$(dirname "$0")" || exit 1
source scripts/bootstrap-node.sh
bl_ensure_node || exit 1
node scripts/backup.mjs backup
read -r -p "Press Enter to close..."
