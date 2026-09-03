#!/bin/bash
sleep 480
echo "=== v6 -> remaining rungs ==="
node tools/publish-team.mjs 2>&1 | tail -2
node tools/publish-me.mjs 2>&1 | head -c 120
echo
echo "=== final bindings ==="
node tools/check-bindings.mjs 2>&1 | grep -o '"registryVersion":[0-9]*\|"rungs":\[[^]]*\]' | head -4
