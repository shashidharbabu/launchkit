import prompt from './navigator.prompt.json';
import { byNewest, select } from './blobstore';
import { ask } from './runner';

/**
 * Navigator chat (Home): the app supplies persona + app map + action contract
 * in the question text (same pattern as every stage's build*Question), the
 * lk_navigator pipe (chat → Claude via compat → answers) returns ONE JSON
 * object { reply, action }. Everything the model may navigate to is validated
 * here against the real app map and the user's real launches — a hallucinated
 * view or project id degrades to reply-only, never to a wrong navigation.
 */
export const NAV_VIEWS = ['home', 'dashboard', 'launches', 'new-launch', 'runs', 'settings', 'workspace'] as const;
export const STAGES = ['profile', 'brand', 'commercial', 'assets', 'targets', 'signals', 'plan'] as const;
export type NavView = (typeof NAV_VIEWS)[number];
export type NavStage = (typeof STAGES)[number];
export type NavAction = { view: NavView; projectId?: string; stage?: NavStage } | null;
export type NavAnswer = { reply: string; action: NavAction };
export type LaunchSummary = { id: string; name: string; stage: NavStage; status: string };
export type NavContext = { currentView: string; currentProjectId?: string; launches: LaunchSummary[] };
export type NavTurn = { role: 'user' | 'assistant'; text: string };

const KIND_STAGE: Record<string, NavStage> = {
  understand: 'profile', brand_dna: 'brand', brand_campaigns: 'brand', pricing: 'commercial', listing: 'commercial',
  targets: 'targets', signals: 'signals',
};
const stageForKind = (kind: string): NavStage => KIND_STAGE[kind] ?? (kind.startsWith('asset') ? 'assets' : 'profile');

/** The user's launches with their most recent run, from the workspace store. */
export function launchContext(currentView: string, currentProjectId?: string): NavContext {
  const projects = byNewest(select('projects', {}), 'created_at') as Array<Record<string, unknown>>;
  const launches: LaunchSummary[] = projects.map((p) => {
    const run = byNewest(select('runs', { project_id: p.id }), 'created_at')[0] as Record<string, unknown> | undefined;
    return {
      id: String(p.id), name: String(p.name ?? 'Untitled'),
      stage: run ? stageForKind(String(run.kind ?? '')) : 'profile',
      status: run ? String(run.status ?? 'unknown') : 'not started',
    };
  });
  return { currentView, currentProjectId, launches };
}

export function buildNavigatorQuestion(ctx: NavContext, history: NavTurn[], message: string): string {
  const turns = history.slice(-6).map((t) => `${t.role === 'user' ? 'USER' : 'ASSISTANT'}: ${t.text}`).join('\n');
  return [
    ...(prompt as { instructions: string[] }).instructions,
    'CONTEXT: ' + JSON.stringify(ctx),
    turns ? 'RECENT TURNS:\n' + turns : '',
    'USER: ' + message,
  ].filter(Boolean).join('\n\n');
}

export function parseNavigatorAnswer(raw: unknown, ctx: NavContext): NavAnswer {
  const o = (raw ?? {}) as Record<string, unknown>;
  const reply = typeof o.reply === 'string' && o.reply.trim() ? o.reply.trim() : 'Use the rail on the left to move around.';
  const a = o.action as Record<string, unknown> | null | undefined;
  if (!a || typeof a !== 'object') return { reply, action: null };
  const view = String(a.view ?? '');
  if (!(NAV_VIEWS as readonly string[]).includes(view)) return { reply, action: null };
  const action: NonNullable<NavAction> = { view: view as NavView };
  if (view === 'workspace') {
    const pid = String(a.projectId ?? '');
    if (!ctx.launches.some((l) => l.id === pid)) return { reply, action: null };
    action.projectId = pid;
    const st = String(a.stage ?? '');
    action.stage = (STAGES as readonly string[]).includes(st) ? (st as NavStage) : ctx.launches.find((l) => l.id === pid)!.stage;
  }
  return { reply, action };
}

export async function askNavigator(ctx: NavContext, history: NavTurn[], message: string): Promise<NavAnswer> {
  try {
    const raw = await ask('lk_navigator.pipe', buildNavigatorQuestion(ctx, history, message));
    return parseNavigatorAnswer(raw, ctx);
  } catch (e) {
    return { reply: `I couldn't reach the navigator (${String((e as Error)?.message ?? e).slice(0, 120)}). Use the rail on the left.`, action: null };
  }
}
