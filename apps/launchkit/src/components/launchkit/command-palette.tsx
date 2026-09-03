import * as React from 'react';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../ui/dialog';
import { useProjectMaybe } from './project-provider';
import { api } from '../../data/api';
import { STAGES } from '../../lib/stages';
import type { ProjectRow } from '../../lib/types';
import { useNav, type NavState } from '../../nav';

const GROUP_CLS =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-meta [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground';
const ITEM_CLS =
  'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-body data-[selected=true]:bg-accent';

const APP_PAGES: { href: string; label: string; to: NavState }[] = [
  { href: '/dashboard', label: 'Dashboard', to: { view: 'dashboard' } },
  { href: '/launches', label: 'Launches', to: { view: 'launches' } },
  { href: '/launches/new', label: 'New launch', to: { view: 'new-launch' } },
  { href: '/runs', label: 'Runs', to: { view: 'runs' } },
  { href: '/settings', label: 'Settings', to: { view: 'settings' } },
];

/**
 * Cmd+K palette (components.md): app pages, stages, launches, copy ref
 * link, restart pipe (dev). Works with or without an open workspace.
 */
export function CommandPalette() {
  const { nav, go } = useNav();
  const id = nav.view === 'workspace' ? nav.projectId : undefined;
  const ctx = useProjectMaybe();
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('lk:palette', onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('lk:palette', onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (open) api.listProjects().then((rows) => setProjects(rows as ProjectRow[])).catch(() => {});
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showClose={false} className="top-[20%] -translate-y-0 p-0" aria-label="Command palette">
        <Command label="Command palette" className="w-full">
          <Command.Input
            placeholder="Jump to a page, stage, or launch…"
            className="h-11 w-full border-b border-border bg-transparent px-4 text-body placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-[color:var(--ring)] focus-visible:-outline-offset-2"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-2 py-3 text-body text-muted-foreground">
              Nothing matches. Try a page or stage name, Dashboard, Runs, Assets…
            </Command.Empty>

            <Command.Group heading="Go to" className={GROUP_CLS}>
              {APP_PAGES.map((p) => (
                <Command.Item key={p.href} onSelect={() => run(() => go(p.to))} className={ITEM_CLS}>
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>

            {ctx?.project && id && (
              <Command.Group heading="Stages" className={GROUP_CLS}>
                {STAGES.map((s) => (
                  <Command.Item
                    key={s.slug}
                    onSelect={() => run(() => go({ view: 'workspace', projectId: id, stage: s.slug }))}
                    className={ITEM_CLS}
                  >
                    <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {s.num}
                    </span>
                    {s.name}
                    {!ctx.gate1 && s.slug !== 'profile' && (
                      <span className="ml-auto font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        locked
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {ctx?.plan && ctx.plan.targets.length > 0 && (
              <Command.Group heading="Tracked links" className={GROUP_CLS}>
                {ctx.plan.targets.map((t) => (
                  <Command.Item
                    key={t.ref}
                    onSelect={() =>
                      run(async () => {
                        await navigator.clipboard.writeText(t.ref_url);
                        toast('Link copied');
                      })
                    }
                    className={ITEM_CLS}
                  >
                    Copy ref link, {t.name}
                    <span className="ml-auto font-mono text-data text-muted-foreground">{t.ref}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Your launches" className={GROUP_CLS}>
              {projects.map((p) => (
                <Command.Item
                  key={p.id}
                  onSelect={() => run(() => go({ view: 'workspace', projectId: p.id, stage: 'profile' }))}
                  className={ITEM_CLS}
                >
                  {p.name}
                  {p.id === id && (
                    <span className="ml-auto font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      current
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            {ctx?.project && (
              <Command.Group heading="Dev" className={GROUP_CLS}>
                <Command.Item
                  onSelect={() =>
                    run(() => ctx.runJob('understand', () => api.runUnderstand(ctx.project!.id)))
                  }
                  className={ITEM_CLS}
                >
                  Restart pipe: understand (dev)
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
