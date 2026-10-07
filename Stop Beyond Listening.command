#!/bin/bash
# Double-click to stop Beyond Listening and its local database (your data is kept).
cd "$(dirname "$0")" || exit 1
source scripts/bootstrap-node.sh
bl_ensure_node || exit 1
node scripts/launcher.mjs stop
