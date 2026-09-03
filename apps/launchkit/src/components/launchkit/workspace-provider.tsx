import * as React from 'react';
import { toast } from 'sonner';
import { useAuthUser, useWorkspace } from 'shell';
import { initBlobStore, mountTables, snapshotTables } from '../../data/blobstore';
import { seedRulebooksIfEmpty, seedVenuesIfEmpty } from '../../data/seed';
import { getClient } from '../../data/runner';
import { checkStore, loadWorkspace, saveWorkspace, workspaceVersion, type StoreCheck } from '../../data/teamstore';
import { setActiveWorkspaceState, type Workspace } from '../../data/workspace-state';

/**
 * Workspaces: Personal (the user's own appState, as before) or a RocketRide
 * team (a shared snapshot in the store pipe). Switching swaps the blobstore's
 * backing tables and bumps `epoch`, which remounts every page so it re-reads.
 * Teams, members and invites come from the SDK account API; every call is
 * role-checked server-side and its error is shown verbatim.
 */
export type Team = { id: string; name: string; memberCount: number | null };
export type Member = { userId: string; email: string; name: string; role: string; status: string };

type AccountApi = {
  getProfile(): Promise<Record<string, unknown>>;
  getOrg(orgId?: string): Promise<Record<string, unknown>>;
  listMembers(orgId: string): Promise<Record<string, unknown>[]>;
  inviteMember(orgId: string, p: { email: string; givenName: string; familyName: string; role: string; teamAssignments?: Array<{ teamId: string; permissions: string[] }> }): Promise<void>;
  listTeams(orgId: string): Promise<Record<string, unknown>[]>;
  getTeamDetail(orgId: string, teamId: string): Promise<Record<string, unknown>>;
  createTeam(orgId: string, name: string): Promise<void>;
  addTeamMember(orgId: string, p: { teamId: string; userId: string; permissions: string[] }): Promise<void>;
};

type Ctx = {
  org: { id: string; name: string } | null;
  me: { userId: string; email: string; name: string } | null;
  teams: Team[];
  active: Workspace;
  epoch: number;
  switching: boolean;
  error: string | null;
  teamVersion: number | null;
  lastSync: string | null;
  store: StoreCheck | null;
  storeChecking: boolean;
  switchTo(ws: Workspace): Promise<void>;
  refreshTeams(): Promise<void>;
  membersOf(teamId: string): Promise<Member[]>;
  orgMembers(): Promise<Member[]>;
  invite(p: { email: string; givenName?: string; familyName?: string; role: string; teamId?: string }): Promise<string>;
  createTeam(name: string): Promise<void>;
  addToTeam(teamId: string, userId: string, admin: boolean): Promise<void>;
  runStoreCheck(): Promise<StoreCheck>;
};

const WsContext = React.createContext<Ctx | null>(null);
const WS_KEY = 'launchkit_ws';
const POLL_MS = 30_000;

const str = (v: unknown) => (v == null ? '' : String(v));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function account(): AccountApi {
  return (getClient() as unknown as { account: AccountApi }).account;
}

function toTeam(r: Record<string, unknown>): Team {
  const count = r.memberCount ?? r.member_count ?? (Array.isArray(r.members) ? r.members.length : null);
  return { id: str(r.id ?? r.teamId), name: str(r.name) || str(r.id), memberCount: count == null ? null : Number(count) };
}

function toMember(r: Record<string, unknown>): Member {
  const name = [str(r.givenName), str(r.familyName)].filter(Boolean).join(' ') || str(r.displayName) || str(r.name);
  const perms = Array.isArray(r.permissions) ? (r.permissions as unknown[]).map(String).join(', ') : '';
  return { userId: str(r.userId ?? r.id), email: str(r.email), name, role: str(r.role) || perms, status: str(r.status) };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const identity = useAuthUser();
  const workspace = useWorkspace();
  const actor = identity?.displayName ?? identity?.email ?? 'user';
  const [org, setOrg] = React.useState<Ctx['org']>(null);
  const [me, setMe] = React.useState<Ctx['me']>(null);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [active, setActive] = React.useState<Workspace>({ kind: 'personal' });
  const [epoch, setEpoch] = React.useState(0);
  const [switching, setSwitching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [teamVersion, setTeamVersion] = React.useState<number | null>(null);
  const [lastSync, setLastSync] = React.useState<string | null>(null);
  const [store, setStore] = React.useState<StoreCheck | null>(null);
  const [storeChecking, setStoreChecking] = React.useState(false);
  const versionRef = React.useRef(0);
  const activeRef = React.useRef<Workspace>({ kind: 'personal' });
  const orgIdRef = React.useRef<string>('');

  const remount = React.useCallback(() => setEpoch((e) => e + 1), []);

  // Personal backing store: the shell's per-user appState, exactly as before.
  const mountPersonal = React.useCallback(() => {
    initBlobStore(workspace.appState ?? {}, workspace.updateAppState, actor);
    seedVenuesIfEmpty();
    seedRulebooksIfEmpty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.updateAppState, actor]);

  const mountTeam = React.useCallback(async (ws: Extract<Workspace, { kind: 'team' }>) => {
    let row = await loadWorkspace(ws.teamId);
    if (!row) {
      const created = await saveWorkspace(ws.teamId, {}, 0, actor);
      if (!created.ok) throw new Error(created.reason === 'conflict' ? 'workspace was created by a teammate at the same moment; retry' : created.error ?? 'could not create the workspace row');
      row = { version: 1, snapshot: {}, updated_by: actor, updated_at: new Date().toISOString() };
    }
    versionRef.current = row.version;
    const persister = (snapshot: Record<string, unknown>) => {
      void (async () => {
        const r = await saveWorkspace(ws.teamId, snapshot, versionRef.current, actor);
        if (r.ok) {
          versionRef.current = r.version;
          setTeamVersion(r.version);
          setLastSync(new Date().toISOString());
          return;
        }
        if (r.reason === 'conflict') {
          const fresh = await loadWorkspace(ws.teamId);
          if (fresh) {
            versionRef.current = fresh.version;
            mountTables(fresh.snapshot as Record<string, Record<string, unknown>[]>, persister);
            setTeamVersion(fresh.version);
            remount();
          }
          toast(`A teammate saved ${ws.name} first. Reloaded their version; make your change again.`);
          return;
        }
        toast(`Couldn't save to ${ws.name}: ${r.error ?? 'store error'}`);
      })();
    };
    mountTables(row.snapshot as Record<string, Record<string, unknown>[]>, persister);
    seedVenuesIfEmpty();
    seedRulebooksIfEmpty();
    setTeamVersion(row.version);
    setLastSync(new Date().toISOString());
  }, [actor, remount]);

  const persistChoice = React.useCallback((ws: Workspace) => {
    workspace.updateAppState((prev) => ({ ...prev, [WS_KEY]: ws }));
  }, [workspace]);

  const switchTo = React.useCallback(async (ws: Workspace) => {
    setSwitching(true);
    setError(null);
    try {
      if (ws.kind === 'team') await mountTeam(ws);
      else mountPersonal();
      activeRef.current = ws;
      setActiveWorkspaceState(ws);
      setActive(ws);
      persistChoice(ws);
      remount();
    } catch (e) {
      const msg = errMsg(e);
      setError(`Couldn't open ${ws.kind === 'team' ? ws.name : 'Personal'}: ${msg}`);
      if (ws.kind === 'team') {
        mountPersonal();
        activeRef.current = { kind: 'personal' };
        setActiveWorkspaceState({ kind: 'personal' });
        setActive({ kind: 'personal' });
        remount();
      }
      throw e;
    } finally {
      setSwitching(false);
    }
  }, [mountPersonal, mountTeam, persistChoice, remount]);

  const refreshTeams = React.useCallback(async () => {
    const orgId = orgIdRef.current;
    if (!orgId) return;
    const rows = await account().listTeams(orgId);
    setTeams(rows.map(toTeam));
  }, []);

  // Boot: profile + org + teams, then restore the last workspace choice.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await account().getProfile();
        const orgs = Array.isArray(p.organizations) ? (p.organizations as Record<string, unknown>[]) : [];
        const memberships = Array.isArray(p.memberships) ? (p.memberships as Record<string, unknown>[]) : [];
        const orgId = str(p.defaultOrgId) || str(orgs[0]?.id) || str(memberships[0]?.orgId ?? memberships[0]?.organizationId);
        orgIdRef.current = orgId;
        if (cancelled) return;
        setMe({ userId: str(p.userId), email: str(p.email), name: str(p.displayName) || str(p.email) });
        if (orgId) {
          let orgName = str(orgs.find((o) => str(o.id) === orgId)?.name);
          try { orgName = str((await account().getOrg(orgId)).name) || orgName; } catch { /* member without org read: keep the membership name */ }
          setOrg({ id: orgId, name: orgName || orgId });
          const rows = await account().listTeams(orgId);
          if (cancelled) return;
          const list = rows.map(toTeam);
          setTeams(list);
          const saved = (workspace.appState?.[WS_KEY] as Workspace | undefined) ?? null;
          if (saved && saved.kind === 'team' && list.some((t) => t.id === saved.teamId)) {
            await switchTo({ kind: 'team', teamId: saved.teamId, name: list.find((t) => t.id === saved.teamId)?.name ?? saved.name });
          }
        }
      } catch (e) {
        if (!cancelled) setError(`Workspace directory unavailable: ${errMsg(e)}`);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the team row's version; a teammate's save reloads the tables.
  React.useEffect(() => {
    if (active.kind !== 'team') return;
    const ws = active;
    const id = setInterval(async () => {
      try {
        const v = await workspaceVersion(ws.teamId);
        if (v != null && v > versionRef.current) {
          const fresh = await loadWorkspace(ws.teamId);
          if (fresh && activeRef.current.kind === 'team' && activeRef.current.teamId === ws.teamId) {
            await mountTeam(ws);
            remount();
            toast(`${ws.name} was updated by ${fresh.updated_by || 'a teammate'}.`);
          }
        }
        setLastSync(new Date().toISOString());
      } catch { /* transient; next tick */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [active, mountTeam, remount]);

  const membersOf = React.useCallback(async (teamId: string) => {
    const d = await account().getTeamDetail(orgIdRef.current, teamId);
    const rows = Array.isArray(d.members) ? (d.members as Record<string, unknown>[]) : [];
    return rows.map(toMember);
  }, []);

  const orgMembers = React.useCallback(async () => (await account().listMembers(orgIdRef.current)).map(toMember), []);

  const invite = React.useCallback(async (p: { email: string; givenName?: string; familyName?: string; role: string; teamId?: string }) => {
    const orgId = orgIdRef.current;
    const teamName = p.teamId ? teams.find((t) => t.id === p.teamId)?.name ?? 'the team' : null;
    await account().inviteMember(orgId, {
      email: p.email,
      givenName: p.givenName ?? '',
      familyName: p.familyName ?? '',
      role: p.role,
      ...(p.teamId ? { teamAssignments: [{ teamId: p.teamId, permissions: [] }] } : {}),
    });
    return p.teamId ? `Invited ${p.email} to ${teamName}. They see the workspace once they accept.` : `Invited ${p.email} to the organisation.`;
  }, [teams]);

  const createTeam = React.useCallback(async (name: string) => {
    await account().createTeam(orgIdRef.current, name);
    await refreshTeams();
  }, [refreshTeams]);

  const addToTeam = React.useCallback(async (teamId: string, userId: string, admin: boolean) => {
    await account().addTeamMember(orgIdRef.current, { teamId, userId, permissions: admin ? ['team.admin'] : [] });
  }, []);

  const runStoreCheck = React.useCallback(async () => {
    setStoreChecking(true);
    try {
      const r = await checkStore();
      setStore(r);
      return r;
    } finally {
      setStoreChecking(false);
    }
  }, []);

  const value = React.useMemo<Ctx>(() => ({
    org, me, teams, active, epoch, switching, error, teamVersion, lastSync, store, storeChecking,
    switchTo, refreshTeams, membersOf, orgMembers, invite, createTeam, addToTeam, runStoreCheck,
  }), [org, me, teams, active, epoch, switching, error, teamVersion, lastSync, store, storeChecking, switchTo, refreshTeams, membersOf, orgMembers, invite, createTeam, addToTeam, runStoreCheck]);

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useLkWorkspace(): Ctx {
  const c = React.useContext(WsContext);
  if (!c) throw new Error('useLkWorkspace must be used within WorkspaceProvider');
  return c;
}

/** Snapshot of the mounted tables, for the Settings card's size line. */
export function mountedSnapshotBytes(): number {
  try { return JSON.stringify(snapshotTables()).length; } catch { return 0; }
}
