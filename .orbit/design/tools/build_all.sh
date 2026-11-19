#!/bin/sh
# One entry point for the generated boards. Order matters: every builder starts from pre_lifecycle/ snapshots,
# lc_post fixes names, lc_r12 applies button zones and PageTreeRow, tpl_build updates the page templates.
# ARCHITECTURE.md is edited directly (lc_arch.py is retired).
# Python is chosen by tools/py (no virtual environment to activate); it stops before any file changes
# when playwright or Pillow is missing.
set -e
cd "$(dirname "$0")/.."
sh tools/py --check
for t in lc_s12 lc_flow lc_s15 lc_r10 lc_refs lc_misc lc_s17 lc_od28 lc_post lc_r12 lc_ids tpl_build lc_fit; do
  [ -f tools/$t.py ] && sh tools/py tools/$t.py > /dev/null && echo "ok $t"
done
