#!/bin/bash
# patient retry: let staging release my zombie sessions, then finish the rollout
sleep 420
echo "=== retry publish v4 @me ==="
node tools/publish-me.mjs 2>&1 | head -c 200
echo
echo "=== verify bindings ==="
node tools/check-bindings.mjs 2>&1 | grep -o '"registryVersion":[0-9]*\|"rungs":\[[^]]*\]' | head -6
