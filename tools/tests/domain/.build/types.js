"use strict";
/**
 * Shared types for the ported Launch Kit domain logic.
 *
 * These mirror the JSON shapes the deployed pipes emit (CONTRACT.md D1: "JSON
 * payload columns keep today's shapes — the pipeline output contracts do not
 * change in this migration"). They are deliberately PERMISSIVE: every shape
 * carries an unknown-index signature because pipe output is model-generated
 * and unknown extra keys must be tolerated, never dropped or rejected.
 */
Object.defineProperty(exports, "__esModule", { value: true });
