#!/bin/bash
# Loads Swiftaw's schema into a local Postgres with just enough of Supabase
# stubbed to make it possible. Reports per file.
S="$(cd "$(dirname "$0")" && pwd)"
M="$S/../migrations"
P="psql -h /var/run/postgresql -p 5433 -U postgres"
$P -q -c "drop database if exists swiftaw;" -c "create database swiftaw;" 2>/dev/null
$P -d swiftaw -q -v ON_ERROR_STOP=1 -f "$S/00-stubs.sql" >/dev/null 2>&1
fail=0
for f in 2026-09-05-swiftaw-icons ${EXTRA:-}; do
  [ -f "$M/$f.sql" ] || continue
  out=$($P -d swiftaw -q -v ON_ERROR_STOP=1 -f "$M/$f.sql" 2>&1)
  if [ $? -eq 0 ]; then echo "ok    $f"; else echo "FAIL  $f"; echo "$out" | grep -i ERROR | head -3; fail=1; fi
done
exit $fail
