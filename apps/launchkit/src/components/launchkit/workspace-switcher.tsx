import * as React from 'react';
import { Users } from 'lucide-react';
import { useLkWorkspace } from './workspace-provider';
import { Select } from '@launchkit/design-system/components/field';

/** Top-bar workspace switcher: Personal, or any team the user belongs to. */
export function WorkspaceSwitcher() {
  const ws = useLkWorkspace();
  const value = ws.active.kind === 'team' ? ws.active.teamId : 'personal';
  return (
    <label className="flex items-center gap-2 text-small text-muted-foreground" title={ws.error ?? undefined}>
      <Users size={16} strokeWidth={1.75} aria-hidden />
      <span className="sr-only">Workspace</span>
      <Select
        aria-label="Workspace"
        value={value}
        disabled={ws.switching}
        onChange={(e) => {
          const v = e.target.value;
          const team = ws.teams.find((t) => t.id === v);
          void ws.switchTo(team ? { kind: 'team', teamId: team.id, name: team.name } : { kind: 'personal' }).catch(() => undefined);
        }}
        className="h-9 w-auto min-w-36 text-small"
      >
        <option value="personal">Personal</option>
        {ws.teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </Select>
      {ws.switching && <span className="text-shimmer text-small">Opening</span>}
    </label>
  );
}
