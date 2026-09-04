import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@launchkit/design-system/components/button';
import { Field, Input, Select } from '@launchkit/design-system/components/field';
import { Card, CardHeader, CardBody } from '@launchkit/design-system/components/card';
import { Segmented } from '@launchkit/design-system/components/segmented';
import { Badge } from '@launchkit/design-system/components/status-stamp';
import { Banner } from '@launchkit/design-system/components/banner';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { useLkWorkspace, mountedSnapshotBytes, type Member } from './workspace-provider';
import { workspaceLabel } from '../../data/workspace-state';

const Meta = ({ children }: { children: React.ReactNode }) => (
  <p className="text-label text-muted-foreground">{children}</p>
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
      <CardHeader
        title="Workspace"
        description={`${ws.org ? ws.org.name : 'No organisation'}${ws.me?.email ? `, ${ws.me.email}` : ''}`}
      />
      <CardBody className="grid gap-6">
        <p className="text-body text-muted-foreground">
          Launches live in a workspace. Personal is yours alone. A team workspace is shared by every
          member of that RocketRide team: what they save, you see within half a minute.
        </p>
        {ws.error && <Banner tone="nogo" title={ws.error} />}

        <div className="grid gap-2">
          <Meta>Open workspace</Meta>
          <Segmented
            ariaLabel="Open workspace"
            value={ws.active.kind === 'team' ? ws.active.teamId : 'personal'}
            onChange={(id) => {
              setSelected(id === 'personal' ? '' : id);
              const team = ws.teams.find((t) => t.id === id);
              void ws.switchTo(team ? { kind: 'team', teamId: team.id, name: team.name } : { kind: 'personal' }).catch(() => undefined);
            }}
            options={[{ value: 'personal', label: 'Personal' }, ...ws.teams.map((t) => ({ value: t.id, label: t.name }))]}
            className={ws.switching ? 'pointer-events-none self-start opacity-60' : 'self-start'}
          />
          <ProvenanceLine
            parts={[
              workspaceLabel(ws.active),
              `${Math.round(bytes / 1024)} KB`,
              ws.active.kind === 'team' && ws.teamVersion != null ? `version ${ws.teamVersion}` : null,
              ws.lastSync ? `synced ${new Date(ws.lastSync).toLocaleTimeString()}` : null,
            ]}
          />
        </div>

        <div className="grid gap-2">
          <Meta>Teams</Meta>
          {ws.teams.length === 0 && <p className="text-body text-muted-foreground">No teams in this organisation yet.</p>}
          {ws.teams.length > 0 && (
            <Segmented
              ariaLabel="Team"
              value={selected}
              onChange={setSelected}
              options={ws.teams.map((t) => ({ value: t.id, label: t.memberCount != null ? `${t.name} (${t.memberCount})` : t.name }))}
              className="self-start"
            />
          )}
          <div className="flex flex-wrap items-end gap-2">
            <Field label="New team" htmlFor="ws-new-team" className="min-w-56">
              <Input id="ws-new-team" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="e.g. Launch crew" />
            </Field>
            <Button variant="secondary" loading={busy === 'create'} loadingLabel="Creating" disabled={!newTeam.trim()}
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
                    {m.role && <Badge tone="neutral">{m.role}</Badge>}
                    {m.status && <Badge tone="neutral">{m.status}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Meta>Invite a teammate</Meta>
          <div className="grid gap-2 sm:grid-cols-4">
            <Field label="Email" htmlFor="ws-inv-email" className="sm:col-span-2">
              <Input id="ws-inv-email" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="name@company.com" />
            </Field>
            <Field label="First name" htmlFor="ws-inv-given">
              <Input id="ws-inv-given" value={inv.givenName} onChange={(e) => setInv({ ...inv, givenName: e.target.value })} />
            </Field>
            <Field label="Last name" htmlFor="ws-inv-family">
              <Input id="ws-inv-family" value={inv.familyName} onChange={(e) => setInv({ ...inv, familyName: e.target.value })} />
            </Field>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Role" htmlFor="ws-inv-role">
              <Select id="ws-inv-role" value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })} className="w-auto min-w-36">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Button variant="secondary" loading={busy === 'invite'} loadingLabel="Inviting" disabled={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inv.email)}
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

        <div className="grid gap-2">
          <Meta>Shared store</Meta>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" loading={ws.storeChecking} loadingLabel="Checking" onClick={() => void ws.runStoreCheck()}>
              Check store
            </Button>
            {ws.store && (
              <span className={ws.store.ok ? 'text-small text-muted-foreground' : 'text-small text-nogo-text'}>
                {ws.store.ok ? `Connected, ${ws.store.dialect}, ${ws.store.ms} ms` : `Failed after ${ws.store.ms} ms: ${ws.store.error}`}
              </span>
            )}
          </div>
          <p className="text-body text-muted-foreground">
            Team workspaces are kept in the shared store, which needs your signed-in identity. Run this once in the deployed app; a preview opened with an API key cannot pass it.
          </p>
        </div>
        {note && <p className="text-small text-muted-foreground">{note}</p>}
      </CardBody>
    </Card>
  );
}
