/**
 * B1: a launch belongs to the person who created it.
 *
 * TEST-CHECKLIST.md line 5 asks for two signed-in accounts, which the API-key
 * preview cannot provide, so the rule is proven here against the real store
 * instead of asserted.
 */
import { initBlobStore, insert, select, uid, currentOwnerId, ownedByMe } from '../src/data/blobstore';

let failures = 0;
const ok = (name: string, cond: boolean) => {
  if (!cond) { failures += 1; console.log('  FAIL ' + name); } else { console.log('  pass ' + name); }
};

function mount(userId: string) {
  const state: Record<string, unknown> = {};
  initBlobStore(state, (u) => { Object.assign(state, u(state)); }, 'Display Name', userId);
  return state;
}

// one shared snapshot, the way a team workspace stores it
mount('user-1');
const mine = uid();
insert('projects', { id: mine, name: 'Mine', owner_id: currentOwnerId() });
const theirs = uid();
insert('projects', { id: theirs, name: 'Theirs', owner_id: 'user-2' });
const legacy = uid();
insert('projects', { id: legacy, name: 'Legacy' }); // written before ownership existed

console.log('signed in as user-1');
const asU1 = select('projects').filter((r) => ownedByMe(r as { owner_id?: unknown }));
ok('sees its own launch', asU1.some((r) => r.id === mine));
ok('does NOT see user-2 launch', !asU1.some((r) => r.id === theirs));
ok('still sees a legacy launch with no owner', asU1.some((r) => r.id === legacy));
ok('owner id is the stable id, not the display name', currentOwnerId() === 'user-1');

console.log('the same snapshot, signed in as user-2');
const rows = select('projects').map((r) => ({ ...r }));
mount('user-2');
for (const r of rows) insert('projects', r);
const asU2 = select('projects').filter((r) => ownedByMe(r as { owner_id?: unknown }));
ok('does NOT see user-1 launch', !asU2.some((r) => r.id === mine));
ok('sees its own launch', asU2.some((r) => r.id === theirs));
ok('still sees the legacy launch', asU2.some((r) => r.id === legacy));

console.log('nobody signed in (the API-key preview)');
mount('');
for (const r of rows) insert('projects', r);
const anon = select('projects').filter((r) => ownedByMe(r as { owner_id?: unknown }));
ok('filtering is inert rather than hiding every launch', anon.length === rows.length);

console.log(failures === 0 ? '\nOWNERSHIP OK' : `\nOWNERSHIP FAILED (${failures})`);
if (failures) process.exit(1);
