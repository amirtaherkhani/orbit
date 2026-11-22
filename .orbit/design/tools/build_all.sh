#!/bin/sh
# One entry point for the generated boards. Order matters: every builder starts from pre_lifecycle/ snapshots,
# lc_post fixes names, lc_r12 applies button zones and PageTreeRow, tpl_build updates the page templates.
# ARCHITECTURE.md is edited directly (lc_arch.py is retired).
# Python is chosen by tools/py (no virtual environment to activate); it stops before any file changes
# when playwright or Pillow is missing.
set -e
cd "$(dirname "$0")/.."
sh tools/py --check
for t in lc_s12 lc_flow lc_s15 lc_r10 lc_refs lc_misc lc_s17 lc_od28 lc_post lc_r12 lc_s22 lc_components lc_ids tpl_build lc_compose lc_proto lc_pages lc_fit; do
  # a failing step stops the build: '&&' alone hides the failure from 'set -e'
  [ -f tools/$t.py ] || continue
  sh tools/py tools/$t.py > /dev/null || { echo "FAILED $t"; exit 1; }
  echo "ok $t"
done
