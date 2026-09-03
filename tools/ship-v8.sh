#!/bin/bash
for attempt in 1 2 3 4 5; do
  echo "=== attempt $attempt ==="
  node tools/publish-team.mjs 2>&1 | tail -2
  node tools/publish-me.mjs 2>&1 | head -c 80; echo
  BINDINGS=$(node tools/check-bindings.mjs 2>&1 | grep -o '"registryVersion":8[^]]*"rungs":\[[^]]*\]' | head -1)
  echo "v8 bindings: $BINDINGS"
  if echo "$BINDINGS" | grep -q 'team.*team.*user'; then echo "ALL RUNGS ON v8"; break; fi
  sleep 180
done
