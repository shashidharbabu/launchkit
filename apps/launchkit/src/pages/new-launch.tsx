import * as React from 'react';
import { BRAND } from '../brand/assets';
import { Clock } from 'lucide-react';
import { Button } from '@launchkit/design-system/components/button';
import { Field, Input } from '@launchkit/design-system/components/field';
import { Card } from '@launchkit/design-system/components/card';
import { Banner } from '@launchkit/design-system/components/banner';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { api } from '../data/api';
import { ConnectionBanner } from '../components/launchkit/connection-banner';
import { actionError } from '../lib/errors';
import type { ProjectRow } from '../lib/types';
import { useNav } from '../nav';
import { etaLabel } from '../lib/run-eta';

/** Match what the server will normalise the input to, so the duplicate hint
 *  fires on 'myapp.com' as well as 'https://myapp.com/'. */
const normSite = (s: string) =>
  s.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();

export default function NewLaunchPage() {
  const { go, href } = useNav();
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: '', repo_url: '', site_url: '' });
  const [creating, setCreating] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    api
      .listProjects()
      .then((rows) => setProjects(rows as ProjectRow[]))
      .catch((e) => setApiError(String(e instanceof Error ? e.message : e)));
  }, []);

  const duplicate = React.useMemo(() => {
    const site = normSite(form.site_url);
    return site ? projects.find((p) => normSite(p.site_url) === site) : undefined;
  }, [form.site_url, projects]);

  // errors land at the field they belong to; the summary only keeps the rest
  const siteError = /site|url/i.test(formError) && !/repo/i.test(formError) ? formError : '';
  const repoError = /repo/i.test(formError) ? formError : '';
  const nameError = /\bname\b/i.test(formError) ? formError : '';
  const summaryError = formError && !siteError && !repoError && !nameError ? formError : '';

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      // analysis starts server-side on create, the workspace picks up the job
      const p = await api.createProject({ ...form, autorun: true });
      go({ view: 'workspace', projectId: p.id, stage: 'profile' });
    } catch (err) {
      setFormError(actionError('start your launch', err));
      setCreating(false);
    }
  }

  return (
    <PageContainer className="grid gap-8">
      <PageHeader
        title="Start a launch"
        description="Launch Kit reads your live site, and your repo if it is public, then drafts your app profile. Analysis starts the moment the launch is created and takes one to three minutes."
      />
      <ConnectionBanner error={apiError} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="p-6">
      <form onSubmit={createProject} className="grid gap-6">
        <Field label="App name" htmlFor="nl-name" error={nameError}>
          <Input
            id="nl-name"
            required
            invalid={Boolean(nameError)}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field
          label="Live app URL"
          htmlFor="nl-site"
          helper={siteError ? undefined : 'The site people sign up on.'}
          error={siteError}
        >
          <Input
            id="nl-site"
            required
            inputMode="url"
            invalid={Boolean(siteError)}
            placeholder="myapp.com"
            value={form.site_url}
            onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))}
          />
        </Field>
        <Field
          label="GitHub repo (optional)"
          htmlFor="nl-repo"
          helper={repoError ? undefined : 'Public repos only. A repo gives a much stronger profile.'}
          error={repoError}
        >
          <Input
            id="nl-repo"
            inputMode="url"
            invalid={Boolean(repoError)}
            placeholder="github.com/you/your-app"
            value={form.repo_url}
            onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))}
          />
        </Field>

        {duplicate && (
          <Banner tone="info" title="You already have a launch for this site.">
            <a
              href={href({ view: 'workspace', projectId: duplicate.id, stage: 'profile' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'workspace', projectId: duplicate.id, stage: 'profile' });
              }}
              className="underline hover:text-link-hover"
            >
              Open {duplicate.name}
            </a>{' '}
            instead of starting over, or continue to create a second one.
          </Banner>
        )}
        {summaryError && <Banner tone="nogo" title={summaryError} />}
        <p className="flex flex-wrap items-center gap-x-2 text-small text-muted-foreground">
          <Clock size={14} strokeWidth={1.75} aria-hidden />
          <span>Reading your repo and site takes {etaLabel('understand')}. It runs in the background; you can leave this page and come back.</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="primary" size="lg" loading={creating} loadingLabel="Starting analysis">
            Analyze my app
          </Button>
          <a
            href={href({ view: 'launches' })}
            onClick={(e) => {
              e.preventDefault();
              go({ view: 'launches' });
            }}
          >
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </a>
        </div>
      </form>
      </Card>
      {/* the pad at dusk: a photograph in a 24px frame (identity.md), no overlaid label */}
      <aside className="relative hidden aspect-[3/4] overflow-hidden rounded-frame border border-border lg:block">
        <img
          src={BRAND.preLaunch}
          alt=""
          className="object-cover"
          style={{ position: 'absolute', height: '100%', width: '100%', left: 0, top: 0 }}
        />
      </aside>
      </div>
    </PageContainer>
  );
}
