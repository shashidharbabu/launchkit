/** The active workspace, readable outside React (api.createProject tags rows with it). */
export type Workspace = { kind: 'personal' } | { kind: 'team'; teamId: string; name: string };
let active: Workspace = { kind: 'personal' };
export function getActiveWorkspace(): Workspace { return active; }
export function setActiveWorkspaceState(ws: Workspace): void { active = ws; }
export function activeWorkspaceId(): string { return active.kind === 'team' ? active.teamId : 'personal'; }
export function workspaceLabel(ws: Workspace): string { return ws.kind === 'team' ? ws.name : 'Personal'; }
