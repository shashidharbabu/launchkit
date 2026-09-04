'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { api } from '@/lib/api';
import { actionError } from '@/lib/errors';
import type { ProjectRow } from '@/lib/types';

/** Match what the server will normalise the input to, so the duplicate hint
 *  fires on 'myapp.com' as well as 'https://myapp.com/'. */
const normSite = (s: string) =>
  s.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();

export default function NewLaunchPage() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [apiUp, setApiUp] = React.useState(true);
  const [form, setForm] = React.useState({ name: '', repo_url: '', site_url: '' });
  const [creating, setCreating] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    api.listProjects().then(setProjects).catch(() => setApiUp(false));
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
      // analysis starts server-side on create — the workspace picks up the job
      const p = await api.createProject({ ...form, autorun: true });
      router.push(`/p/${p.id}/profile`);
    } catch (err) {
      setFormError(actionError('start your launch', err));
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl items-start gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-6">
      <div>
        <h1 className="text-display font-semibold tracking-[-0.01em]">Start a launch</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Launch Kit reads your live site (and repo, if public) and drafts your app profile.
          Analysis starts the moment your launch is created and takes 1–3 minutes.
        </p>
      </div>

      {!apiUp && (
        <p className="border border-nogo bg-nogo/10 p-3 text-body">
          Couldn&rsquo;t reach the backend at{' '}
          <span className="font-mono text-data">
            {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'}
          </span>
          . Start it, then reload:{' '}
          <code className="font-mono text-data">
            .venv/bin/uvicorn app.main:app --app-dir backend --port 8090
          </code>
        </p>
      )}

      <form onSubmit={createProject} className="grid gap-4 rounded-sm border border-border bg-card p-6">
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
          helper={siteError ? undefined : 'The site users sign up on.'}
          error={siteError}
        >
          <Input
            id="nl-site"
            required
            invalid={Boolean(siteError)}
            placeholder="myapp.com"
            value={form.site_url}
            onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))}
          />
        </Field>
        <Field
          label="GitHub repo"
          htmlFor="nl-repo"
          helper={
            repoError ? undefined : 'Optional — public repos only. A repo gives a much stronger profile.'
          }
          error={repoError}
        >
          <Input
            id="nl-repo"
            invalid={Boolean(repoError)}
            placeholder="github.com/you/your-app"
            value={form.repo_url}
            onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))}
          />
        </Field>

        {duplicate && (
          <p className="border border-border bg-muted p-3 text-body">
            You already have a launch for this site —{' '}
            <Link
              href={`/p/${duplicate.id}/profile`}
              className="text-link underline underline-offset-2 hover:text-link-hover"
            >
              open {duplicate.name}
            </Link>{' '}
            instead of starting over, or continue to create a second one.
          </p>
        )}
        {summaryError && (
          <p className="flex items-start gap-2 border border-nogo bg-nogo/10 p-3 text-body">
            <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-nogo" />
            <span>{summaryError}</span>
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" loading={creating} loadingLabel="Starting analysis…">
            Analyze my app
          </Button>
          <Link href="/launches">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
      </div>

      {/* on the pad — decorative, hidden on small screens */}
      <aside className="relative hidden aspect-[3/4] overflow-hidden rounded-sm border border-border lg:block">
        <Image
          src="/brand/pre-launch.jpg"
          alt=""
          fill
          sizes="288px"
          className="object-cover"
        />
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.182_0.009_264/0.85)] to-transparent p-3 pt-8 font-mono text-meta font-medium uppercase tracking-[0.08em] text-[oklch(0.937_0.006_264)]">
          On the pad
        </p>
      </aside>
    </div>
  );
}
