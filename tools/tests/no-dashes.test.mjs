// clean() may rewrite a dash and the whitespace touching it, and nothing else.
// The first version ran tidy passes over whole lines and turned "name, !chosen"
// into "name!chosen" on a line that held no dash; every case here is a line
// shape that was corrupted or nearly corrupted by that, plus the shapes the
// rule is meant to handle.
import test from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../no-dashes.mjs';

const EM = '—', EN = '–';

test('a line with no dash is returned byte for byte', () => {
  for (const l of [
    'await api.selectCampaign(project.id, name, !chosenAngles.includes(name));',
    'const withMeta: Row = { created_at: new Date().toISOString(), ...row };',
    'const kept = [...bands[0], ...bands[1], ...bands[2]].map((t, i) => ({ ...t, rank: i + 1 }));',
    'f(a, b,)', '[a, , b]', '| x | y |', '',
  ]) assert.equal(clean(l), l);
});

test('a regex character class or literal holding a dash is left alone', () => {
  for (const l of [
    `  const m = objective.trim().match(/^(awareness|signups)\\b[\\s:,.|${EN}${EM}-]*/i);`,
    `name: probe.title.split(/[|:${EN}${EM}-]/)[0].trim()`,
    `const EM = /\\s*${EM}\\s*/g;`,
  ]) assert.equal(clean(l), l);
});

test('a line that names the rule is left alone', () => {
  const l = `'Never use an em dash (${EM}) or an en dash (${EN}) anywhere.'`;
  assert.equal(clean(l), l);
});

test('prose: a spaced em dash becomes a comma', () => {
  assert.equal(clean(`Pipe question-payload builders ${EM} byte-faithful port`), 'Pipe question-payload builders, byte-faithful port');
  assert.equal(clean(`/** rr.run_understand ${EM} repo_url may be empty */`), '/** rr.run_understand, repo_url may be empty */');
  assert.equal(clean(`### A9. Two menus in one view ${EM} chrome rendered twice`), '### A9. Two menus in one view, chrome rendered twice');
});

test('a dash next to punctuation never doubles it', () => {
  assert.equal(clean(`x ${EM}, y`), 'x, y');
  assert.equal(clean(`(${EM} see below)`), '(see below)');
  assert.equal(clean(`done ${EM}.`), 'done.');
  assert.equal(clean(`a, ${EM} b`), 'a, b');
});

test('a leading dash is dropped, not turned into a comma', () => {
  assert.equal(clean(`${EM} see the note below`), 'see the note below');
  assert.equal(clean(`// ${EM} the shell owns this`), '// the shell owns this');
  assert.equal(clean(`- ${EM} first item`), '- first item');
});

test('an en dash in a range is a hyphen; elsewhere a comma', () => {
  assert.equal(clean(`takes 30${EN}60 seconds`), 'takes 30-60 seconds');
  assert.equal(clean(`$8${EN}$10 a seat, 2019${EN}2024`), '$8-$10 a seat, 2019-2024');
  assert.equal(clean(`cheap ${EN} and it works`), 'cheap, and it works');
});

test('a table cell that is only a dash reads none', () => {
  assert.equal(clean(`| \`icon\` | \`string\` | ${EM} | App-folder-relative icon path |`), '| `icon` | `string` | none | App-folder-relative icon path |');
});

test('several dashes on one line, each handled locally', () => {
  assert.equal(clean(`one ${EM} two ${EM} three`), 'one, two, three');
  assert.equal(clean(`a ${EM} b, ${EN} c`), 'a, b, c');
});
