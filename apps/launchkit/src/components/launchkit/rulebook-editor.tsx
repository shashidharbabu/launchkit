import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@launchkit/design-system/components/button';
import { Field, Textarea } from '@launchkit/design-system/components/field';
import { Card, CardHeader, CardBody } from '@launchkit/design-system/components/card';
import { Segmented } from '@launchkit/design-system/components/segmented';
import { insert } from '../../data/blobstore';
import { rulesFor } from '../../data/rules';
import { ASSET_TYPES } from '../../lib/asset-types';
import { GLOBAL_RULES } from '../../lib/rulebooks';

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
      <CardHeader
        title="Platform rulebooks"
        description="Every Social Launch draft is written to the rulebook of its platform. One rule per line. Saving takes effect on the next draft."
      />
      <CardBody className="grid gap-4">
        <Segmented
          ariaLabel="Platform"
          value={platform}
          onChange={pick}
          options={ASSET_TYPES.map((p) => ({ value: p, label: rulesFor(p).name }))}
          className="self-start"
        />
        <p className="text-body">{current.summary}</p>
        <Field label={`${current.name} rules`} htmlFor="rulebook-text">
          <Textarea
            id="rulebook-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="font-mono text-data"
          />
        </Field>
        <div>
          <Button variant="secondary" loading={saving} loadingLabel="Saving" onClick={save}>
            Save {current.name} rulebook
          </Button>
        </div>
        <div className="grid gap-1.5">
          <p className="text-label text-muted-foreground">Global rules, every platform, enforced in code</p>
          <ul className="grid gap-1 text-body text-muted-foreground">
            {GLOBAL_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
