#!/usr/bin/env node
// No em or en dashes in anything we write. Brand rulebook 1.1 calls the em dash
// "a hard tell that AI wrote it" and bans it in all writing; the app enforces the
// same rule on every draft it produces (domain/sanitize.ts). This applies the
// rule to the repository itself.
//
//   node tools/no-dashes.mjs --check     list offending files, exit 1 if any
//   node tools/no-dashes.mjs --fix       rewrite them in place
//
// Replacement is the sanitiser's: an unspaced en dash inside a range becomes a
// hyphen ($8-$10, 2019-2024); any other dash becomes a comma, with the joins
// tidied. Prose reads a little flatter in places; the rule is the rule.
//
// Left alone, on purpose:
//   - files that must hold the literals to do their job: the sanitiser, the
//     rulebook line that names the characters, regex character classes
//   - recorded model output and saved stores under evals/results and eval-10:
//     evidence is not edited
//   - documentation that is not ours (app-development-docs is the platform's)
//   - the retired backend, generated bundles, node_modules, the extension-owned
//     launchkit/ tree
//   - any single line that names the rule ("em dash", "en dash", "[—")
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const mode = process.argv.includes('--fix') ? 'fix' : 'check';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.rocketride', '.claude', '.cursor', '.vscode',
  'app-development-docs', 'results', 'eval-10', '__pycache__', 'backend',
  'vendor', 'out', 'downloads']);
// at the repo root only: the extension-owned launchkit/ tree, and pipelines/, a stale copy of the
// app's pipes from 2026-09-03 that nothing imports. apps/launchkit is ours and must be swept.
const SKIP_ROOT_DIRS = new Set(['launchkit', 'pipelines']);
const SKIP_FILES = new Set([
  'apps/launchkit/src/domain/sanitize.ts',
  'apps/launchkit/src/lib/rulebook-checks.ts',
  'tools/no-dashes.mjs',
  'tools/tests/domain/sanitize.test.mjs', // its inputs are the dashes the sanitiser must remove
  'CLAUDE.md', 'AGENTS.md',                // project instruction files with edits that are not ours
  'launchkit-src/frontend/AGENTS.md',      // rewritten by `next dev` on every start, dash and all
]);
// untracked scaffolds in the workspace that are not this project's, and the domain test
// suite, whose dashes are the inputs and expected strings of the tests themselves
const SKIP_PATHS = ['apps/test-ui', 'apps/testing-ui', 'apps/testapp-ui', 'tools/tests',
  'docs/visual-baseline']; // saved app-state snapshots from the 1b and flow drives: evidence, not prose
const isVenv = (name) => name.startsWith('.venv') || name === 'venv';
const TEXT = /\.(md|txt|ts|tsx|mts|mjs|js|jsx|py|css|json|pipe|html|yml|yaml|sh)$/;
const EM = /\s*—\s*/g;
const EN_RANGE = /([\w$%])–(\$?\w)/g;
const EN = /\s*–\s*/g;
const NAMES_THE_RULE = /em dash|en dash|em-dash|en-dash|\[—|—–\]|–—\]|\\u2014|\\u2013/i;
// a dash inside a regex character class or a regex literal is code, not prose: [\s:,.|–—-], /…—…/
// a literal starts where a value may (after = ( , : ; ! & | ? [ { or at the line start) and its first
// character is not * / or a space, so a /** doc comment */ or a // line comment is still prose
const IN_REGEX = /\[[^\]\n]*[—–][^\]\n]*\]|(?:^|[=(,:;!&|?\[{]\s*)\/(?![*/ ])[^/\n]*[—–][^/\n]*\/[gimsuy]*/;

// Only a dash and the whitespace touching it are ever rewritten. The first version
// of this tool ran tidy-up passes over whole lines and turned "name, !chosen" into
// "name!chosen" on a line that held no dash at all; a line without a dash is
// returned untouched, and that is checked by the caller as well.
const CLOSERS = new Set([',', '.', '!', '?', ':', ';', ')', ']', '}']);
const BRACKETS = new Set(['(', '[', '{']);
const SEPARATORS = new Set([',', ':', ';']);
// a comment marker, list bullet or heading mark just before the dash: the dash opens the line's prose
const LINE_OPENER = /(?:\/\/|\/\*\*?|\*|#+|-|\d+\.)$/;
export function clean(line) {
  if (!/[—–]/.test(line)) return line;
  if (NAMES_THE_RULE.test(line) || IN_REGEX.test(line)) return line;
  // a table cell that is only a dash means "none"
  line = line.replace(/\|(\s*)[—–](\s*)\|/g, '|$1none$2|');
  // an unspaced en dash inside a range is a hyphen: $8-$10, 2019-2024, A-C
  line = line.replace(EN_RANGE, '$1-$2');
  let out = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch !== '—' && ch !== '–') { out += ch; i += 1; continue; }
    // the run of whitespace on either side belongs to the dash
    let left = out.length; while (left > 0 && (out[left - 1] === ' ' || out[left - 1] === '\t')) left -= 1;
    let right = i + 1; while (right < line.length && (line[right] === ' ' || line[right] === '\t')) right += 1;
    const head = out.slice(0, left);
    const before = head[head.length - 1];
    const after = line[right];
    if (before === undefined || LINE_OPENER.test(head)) out = out;                 // leading dash: drop it, keep the indent or marker's own space
    else if (BRACKETS.has(before)) out = head;                                     // "(see below)"
    else if (SEPARATORS.has(before)) out = head + ' ';                             // "a, b": the separator is already there
    else if (after === undefined || CLOSERS.has(after)) out = head;                // "done." and "x, y": nothing dangling before a closer
    else out = head + ', ';
    i = right;
  }
  return out;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name) && !isVenv(name) && !SKIP_ROOT_DIRS.has(rel)) yield* walk(p); continue; }
    if (!TEXT.test(name) || SKIP_FILES.has(rel) || SKIP_PATHS.some((s) => rel === s || rel.startsWith(s + '/'))) continue;
    yield { p, rel };
  }
}

// only sweep when run as a script; importing the module (to test clean) must do nothing
import { pathToFileURL } from 'node:url';
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

let touched = 0, replaced = 0;
const offenders = [];
for (const { p, rel } of (isMain ? walk(ROOT) : [])) {
  const src = readFileSync(p, 'utf8');
  if (!/[—–]/.test(src)) continue;
  const lines = src.split('\n');
  let count = 0;
  const out = lines.map((l) => { const c = clean(l); if (c !== l) count += (l.match(/[—–]/g) || []).length; return c; }).join('\n');
  const left = (out.match(/[—–]/g) || []).length;
  // a file whose every dashed line names the rule is reported, never silently skipped
  offenders.push({ rel, count, left });
  if (count === 0) continue;
  if (mode === 'fix') {
    if (rel.endsWith('.pipe') || rel.endsWith('.json')) {
      try { JSON.parse(out); } catch (e) { console.error(`REFUSED ${rel}: would no longer parse (${e.message})`); process.exitCode = 1; continue; }
    }
    writeFileSync(p, out);
    touched += 1; replaced += count;
  }
}

for (const o of offenders) console.log(`${String(o.count).padStart(5)}  ${o.rel}${o.left ? `  (${o.left} kept: names the rule)` : ''}`);
if (mode === 'fix') console.log(`\nfixed ${replaced} dashes in ${touched} files`);
else { console.log(`\n${offenders.length} files carry ${offenders.reduce((n, o) => n + o.count, 0)} dashes`); if (offenders.length) process.exitCode = 1; }
