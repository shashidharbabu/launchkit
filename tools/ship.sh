#!/bin/bash
# deploy current build + publish to all rungs, with patience for staging sessions
set -e
node tools/deploy-app.mjs "v7: truthful store-error banner (no localhost lie), client.tool fallback for shell clients without .database" 2>&1 | grep -E "verifyApp|FAILED" | head -2
