import * as React from 'react';
import { Users } from 'lucide-react';
import { useLkWorkspace } from './workspace-provider';
import { cn } from '../../lib/utils';

/** Top-bar workspace switcher: Personal, or any team the user belongs to. */
export function WorkspaceSwitcher() {
  const ws = useLkWorkspace();
  const value = ws.active.kind === 'team' ? ws.active.teamId : 'personal';
  return (
    <label className="flex items-center gap-2 text-body text-muted-foreground" title={ws.error ?? undefined}>
      <Users size={14} strokeWidth={1.5} aria-hidden />
      <span className="sr-only">Workspace</span>
      <select
        aria-label="Workspace"
        value={value}
        disabled={ws.switching}
        onChange={(e) => {
          const v = e.target.value;
          const team = ws.teams.find((t) => t.id === v);
          void ws.switchTo(team ? { kind: 'team', teamId: team.id, name: team.name } : { kind: 'personal' }).catch(() => undefined);
        }}
        className={cn(
          'rounded-sm border border-border bg-background px-2 py-1 text-body text-foreground',
          ws.switching && 'opacity-60',
        )}
      >
        <option value="personal">Personal</option>
        {ws.teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      {ws.switching && <span className="font-mono text-data">opening…</span>}
    </label>
  );
}
