import test from 'node:test';
import assert from 'node:assert/strict';
import { placeholder, ensureTableSql, loadSql, insertSql, updateSql, normalizeDialect, WORKSPACE_TABLE } from './.build/workspace-sql.js';

test('placeholders follow the dialect', () => {
  assert.equal(placeholder('postgres', 3), '$3');
  assert.equal(placeholder('mysql', 3), '?');
  assert.equal(placeholder('unknown', 1), '?');
});
test('ensure is idempotent DDL on the workspace table', () => {
  assert.ok(ensureTableSql().startsWith(`CREATE TABLE IF NOT EXISTS ${WORKSPACE_TABLE} (`));
});
test('load and insert bind in order', () => {
  const l = loadSql('postgres');
  assert.ok(l.sql.endsWith('WHERE team_id = $1'));
  assert.deepEqual(l.params('t1'), ['t1']);
  const i = insertSql('mysql');
  assert.ok(i.sql.includes('VALUES (?, 1, ?, ?, ?)'));
  assert.deepEqual(i.params('t1', '{}', 'me', 'now'), ['t1', '{}', 'me', 'now']);
});
test('update is optimistic: bumps the version and guards on the expected one', () => {
  const u = updateSql('postgres');
  assert.ok(u.sql.includes('WHERE team_id = $5 AND version = $6'));
  assert.deepEqual(u.params('t1', '{}', 'me', 'now', 4), [5, '{}', 'me', 'now', 't1', 4]);
});
test('dialect normalisation', () => {
  assert.equal(normalizeDialect('POSTGRES'), 'postgres');
  assert.equal(normalizeDialect({ toString: () => 'MySQL' }), 'mysql');
  assert.equal(normalizeDialect(undefined), 'unknown');
});
