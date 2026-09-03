import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Label } from '../ui/field';
import { Textarea } from '../ui/field';
import { Card } from './stage-common';
import { insert } from '../../data/blobstore';
import { rulesFor } from '../../data/rules';
import { ASSET_TYPES } from '../../lib/asset-types';
import { GLOBAL_RULES } from '../../lib/rulebooks';
import { cn } from '../../lib/utils';

/**
 * Platform rulebooks live in the app database (`platform_rules`); this edits
 * them. Saving appends a new version (newest wins), so every draft since a
 * save is written to the rules shown here. The global rules are shown but not
 * editable: the no-dash rule is enforced in code either way.
 */
export function RulebookEditor() {
  const [platform, setPlatform] = React.useState<string>(ASSET_TYPES[0]);
  const [text, setText] = React.useState(() => rulesFor(ASSET_TYPES[0]).rules.join('\n'));
  const [saving, setSaving] = React.useState(false);
  const current = rulesFor(platform);
  const pick = (p: string) => {
    setPlatform(p);
    setText(rulesFor(p).rules.join('\n'));
  };
  const save = async () => {
    const rules = text.split('\n').map((s) => s.trim()).filter(Boolean);
    if (rules.length === 0) {
      toast('Add at least one rule');
      return;
    }
    setSaving(true);
    try {
      await insert('platform_rules', {
        id: crypto.randomUUID(),
        platform,
        name: current.name,
        summary: current.summary,
        rules,
        updated_at: new Date().toISOString(),
      });
      toast(`${current.name} rulebook saved`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card>
      <div className="px-4 py-3">
        <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Platform rulebooks
        </span>
      </div>
      <div className="grid gap-4 border-t border-border px-4 py-4">
        <p className="text-body text-muted-foreground">
          Every Social Launch draft is written to the rulebook of its platform. One rule per line.
          Saving takes effect on the next draft.
        </p>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Platform">
          {ASSET_TYPES.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === platform}
              onClick={() => pick(p)}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-body',
                p === platform
                  ? 'border-foreground bg-muted font-medium text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {rulesFor(p).name}
            </button>
          ))}
        </div>
        <p className="text-body">{current.summary}</p>
        <div className="grid gap-2">
          <Label htmlFor="rulebook-text">{current.name} rules</Label>
          <Textarea
            id="rulebook-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="font-mono text-data"
          />
        </div>
        <div>
          <Button variant="primary" loading={saving} loadingLabel="Saving…" onClick={save}>
            Save {current.name} rulebook
          </Button>
        </div>
        <div className="grid gap-1 border-t border-border pt-3">
          <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Global rules (every platform, enforced in code)
          </span>
          <ul className="grid gap-1 text-body text-muted-foreground">
            {GLOBAL_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
