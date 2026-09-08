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
// src/theme.tsx, which themes #lk-root rather than <html>). The barrel re-exports
// the package ThemeToggle, and the app imports by file, so it goes too. The
// ambient field IS mirrored: it reads its palette from its own canvas and takes a
// themeRoot callback, so it works under a scoped #lk-root theme. Leaving these in
// fails the SERVER typecheck, which only installs what apps/launchkit declares
// (this is what killed v24/v25).
const SKIP = new Set([
  'index.ts',
  path.join('components', 'theme-toggle.tsx'),
]);

// Overwrite in place, then prune what the source no longer has. Deleting the
// whole mirror first opened a window in which the dev server's watcher compiled
// a half-copied tree ("Cannot find module '../lib/cn'") and stayed stuck on it.
const keep = (rel) => rel === '' || !SKIP.has(rel);
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true, force: true, filter: (from) => keep(path.relative(src, from)) });

const listFiles = async (dir, base = dir) => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
};
const wanted = new Set((await listFiles(src)).filter(keep));
for (const rel of await listFiles(dest)) {
  if (rel !== 'GENERATED.md' && !wanted.has(rel)) await rm(path.join(dest, rel), { force: true });
}

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
