// Copy the authored Gantry design system into the app so the deploy bundle can
// carry it.
//
// Why this exists: `apps/launchkit` used to depend on `@launchkit/design-system`
// as a pnpm `workspace:*` package. That resolves locally through the workspace
// symlink, but the deploy bundle packs ONLY `apps/launchkit`, so the server's
// install step cannot resolve the workspace dependency and the build fails at
// phase "install" (this is exactly what killed v23).
//
// The fix keeps ONE authored copy. `design-system/src` is the source of truth;
// this script mirrors it to `apps/launchkit/src/ds`, which is gitignored and
// regenerated, the same way `src/styles.generated.ts` is. Imports are unchanged
// because tsconfig `paths` maps `@launchkit/design-system/*` onto the mirror.
//
// Run automatically by the app's typecheck/build scripts and by deploy-app.mjs.

import { cp, mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'design-system', 'src');
const dest = path.join(root, 'apps', 'launchkit', 'src', 'ds');

if (!existsSync(src)) {
  console.error(`sync-ds: authored source missing at ${src}`);
  process.exit(1);
}

// Files the app does not use that would drag `next-themes` into the app's
// dependencies. The adoption brief keeps the app's own ThemeToggle (it drives
// src/theme.tsx, which themes #lk-root rather than <html>), and AmbientField is
// a landing-page-only extra we never mounted. The barrel re-exports the package
// ThemeToggle, and the app imports by file, so it goes too. Leaving these in
// fails the SERVER typecheck, which only installs what apps/launchkit declares
// (this is what killed v24/v25).
const SKIP = new Set([
  'index.ts',
  path.join('components', 'theme-toggle.tsx'),
  path.join('components', 'ambient-field.tsx'),
]);

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, {
  recursive: true,
  filter: (from) => {
    const rel = path.relative(src, from);
    return rel === '' || !SKIP.has(rel);
  },
});

await writeFile(
  path.join(dest, 'GENERATED.md'),
  [
    '# Generated — do not edit',
    '',
    'This directory is a mirror of `design-system/src`, produced by',
    '`node tools/sync-ds.mjs`. Edit the design system at `design-system/src`',
    'and re-run the script; anything changed here is overwritten.',
    '',
    'It exists because the deploy bundle packs only `apps/launchkit`, so the',
    'design system has to live inside the app for the server build to resolve it.',
    '',
  ].join('\n'),
);

const count = async (dir) => {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await count(path.join(dir, e.name)) : 1;
  }
  return n;
};

console.log(`sync-ds: design-system/src -> apps/launchkit/src/ds (${await count(dest)} files)`);
