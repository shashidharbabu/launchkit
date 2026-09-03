import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/field';
import { Card } from './stage-common';
import { useLkWorkspace, mountedSnapshotBytes, type Member } from './workspace-provider';
import { workspaceLabel } from '../../data/workspace-state';
import { cn } from '../../lib/utils';

const Meta = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">{children}</span>
);
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Settings → Workspace: the organisation, its teams, the members of the
 * selected team, invitations, and a one-click store check. Server-side role
 * checks decide what works; their errors are shown as they come.
 */
export function WorkspaceCard() {
  const ws = useLkWorkspace();
  const [selected, setSelected] = React.useState<string>('');
  const [members, setMembers] = React.useState<Member[] | null>(null);
  const [membersError, setMembersError] = React.useState<string | null>(null);
  const [newTeam, setNewTeam] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);
  const [inv, setInv] = React.useState({ email: '', givenName: '', familyName: '', role: 'member' });
  const [note, setNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selected && ws.active.kind === 'team') setSelected(ws.active.teamId);
  }, [ws.active, selected]);

  React.useEffect(() => {
    if (!selected) { setMembers(null); return; }
    let cancelled = false;
    setMembers(null); setMembersError(null);
    ws.membersOf(selected).then((m) => { if (!cancelled) setMembers(m); }).catch((e) => { if (!cancelled) setMembersError(errMsg(e)); });
    return () => { cancelled = true; };
  }, [selected, ws]);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setNote(null);
    try { await fn(); } catch (e) { setNote(errMsg(e)); } finally { setBusy(null); }
  };

  const bytes = mountedSnapshotBytes();
  const selectedTeam = ws.teams.find((t) => t.id === selected) ?? null;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Meta>Workspace</Meta>
        <span className="text-body">
          {ws.org ? ws.org.name : 'no organisation'} · {ws.me?.email ?? ''}
        </span>
      </div>
      <div className="grid gap-5 border-t border-border px-4 py-4">
        <p className="text-body text-muted-foreground">
          Launches live in a workspace. Personal is yours alone. A team workspace is shared by every
          member of that RocketRide team: what they save, you see within half a minute.
        </p>
        {ws.error && <p className="text-body text-nogo">{ws.error}</p>}

        <div className="grid gap-2">
          <Meta>Open workspace</Meta>
          <div className="flex flex-wrap items-center gap-2">
            {[{ id: 'personal', name: 'Personal' }, ...ws.teams].map((t) => {
              const isActive = (ws.active.kind === 'team' ? ws.active.teamId : 'personal') === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={ws.switching}
                  onClick={() => { setSelected(t.id === 'personal' ? '' : t.id); void ws.switchTo(t.id === 'personal' ? { kind: 'personal' } : { kind: 'team', teamId: t.id, name: t.name }).catch(() => undefined); }}
                  className={cn('rounded-sm border px-3 py-1.5 text-body', isActive ? 'border-foreground bg-muted font-medium text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          <p className="font-mono text-data text-muted-foreground">
            {workspaceLabel(ws.active)} · {Math.round(bytes / 1024)} KB
            {ws.active.kind === 'team' && ws.teamVersion != null ? ` · version ${ws.teamVersion}` : ''}
            {ws.lastSync ? ` · synced ${new Date(ws.lastSync).toLocaleTimeString()}` : ''}
          </p>
        </div>

        <div className="grid gap-2">
          <Meta>Teams</Meta>
          {ws.teams.length === 0 && <p className="text-body text-muted-foreground">No teams in this organisation yet.</p>}
          <div className="flex flex-wrap items-center gap-2">
            {ws.teams.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelected(t.id)}
                className={cn('rounded-sm border px-3 py-1.5 text-body', selected === t.id ? 'border-foreground text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                {t.name}{t.memberCount != null ? ` · ${t.memberCount}` : ''}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label htmlFor="ws-new-team">New team</Label>
              <Input id="ws-new-team" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="e.g. Launch crew" />
            </div>
            <Button variant="secondary" loading={busy === 'create'} loadingLabel="Creating…" disabled={!newTeam.trim()}
              onClick={() => act('create', async () => { await ws.createTeam(newTeam.trim()); toast(`Team ${newTeam.trim()} created`); setNewTeam(''); })}>
              Create team
            </Button>
          </div>
        </div>

        {selectedTeam && (
          <div className="grid gap-2">
            <Meta>Members of {selectedTeam.name}</Meta>
            {membersError && <p className="text-body text-nogo">{membersError}</p>}
            {members && members.length === 0 && <p className="text-body text-muted-foreground">No members yet.</p>}
            {members && members.length > 0 && (
              <ul className="grid gap-1">
                {members.map((m) => (
                  <li key={m.userId || m.email} className="flex flex-wrap items-center gap-2 text-body">
                    <span className="text-foreground">{m.name || m.email}</span>
                    <span className="font-mono text-data text-muted-foreground">{m.email}</span>
                    {m.role && <span className="font-mono text-data text-muted-foreground">{m.role}</span>}
                    {m.status && <span className="font-mono text-data text-muted-foreground">{m.status}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Meta>Invite a teammate</Meta>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="ws-inv-email">Email</Label>
              <Input id="ws-inv-email" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="name@company.com" />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-inv-given">First name</Label>
              <Input id="ws-inv-given" value={inv.givenName} onChange={(e) => setInv({ ...inv, givenName: e.target.value })} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ws-inv-family">Last name</Label>
              <Input id="ws-inv-family" value={inv.familyName} onChange={(e) => setInv({ ...inv, familyName: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <Label htmlFor="ws-inv-role">Role</Label>
              <select id="ws-inv-role" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}
                className="rounded-sm border border-border bg-background px-2 py-2 text-body text-foreground">
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <Button variant="primary" loading={busy === 'invite'} loadingLabel="Inviting…" disabled={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inv.email)}
              onClick={() => act('invite', async () => {
                const msg = await ws.invite({ ...inv, teamId: selected || undefined });
                toast(msg); setNote(msg); setInv({ email: '', givenName: '', familyName: '', role: 'member' });
                if (selected) setMembers(await ws.membersOf(selected));
              })}>
              {selectedTeam ? `Invite to ${selectedTeam.name}` : 'Invite to organisation'}
            </Button>
          </div>
          <p className="text-body text-muted-foreground">
            Invitations are sent by RocketRide. Only organisation admins can invite; the server says so if you are not one.
          </p>
        </div>

        <div className="grid gap-2 border-t border-border pt-3">
          <Meta>Shared store</Meta>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" loading={ws.storeChecking} loadingLabel="Checking…" onClick={() => void ws.runStoreCheck()}>
              Check store
            </Button>
            {ws.store && (
              <span className={cn('font-mono text-data', ws.store.ok ? 'text-muted-foreground' : 'text-nogo')}>
                {ws.store.ok ? `ok · ${ws.store.dialect} · ${ws.store.ms} ms` : `failed after ${ws.store.ms} ms: ${ws.store.error}`}
              </span>
            )}
          </div>
          <p className="text-body text-muted-foreground">
            Team workspaces are stored through the store pipeline, which needs your signed-in identity. Run this once in the deployed app; a preview opened with an API key cannot pass it.
          </p>
        </div>
        {note && <p className="font-mono text-data text-muted-foreground">{note}</p>}
      </div>
    </Card>
  );
}
