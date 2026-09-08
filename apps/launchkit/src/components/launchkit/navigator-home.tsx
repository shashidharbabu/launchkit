import * as React from 'react';
import { useShellConnection } from 'shell';
import type { ChatMessage } from 'shell';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { useReducedMotion } from 'motion/react';
import { askNavigator, launchContext, type NavTurn } from '../../data/navigator';
import { useNav, type NavState } from '../../nav';
import { stageBySlug } from '../../lib/stages';
import { cn } from '@launchkit/design-system/lib/cn';
import { AmbientField } from '@launchkit/design-system/components/ambient-field';
import { LaunchKitMark } from '@launchkit/design-system/components/brand-mark';
import { Button } from '@launchkit/design-system/components/button';
import { Card, CardHeader, CardBody } from '@launchkit/design-system/components/card';
import { StatusStamp, type StampKind } from '@launchkit/design-system/components/status-stamp';

/**
 * Home: a conversation is the landing surface (patterns/chat.md, components/chat.md).
 *
 * Two states, one reading column. EMPTY: the greeting and the question on the sky,
 * the composer at optical centre, four starters, then the three most recent
 * launches as a card of link rows, all over the ambient field in its soft
 * variant (foundations/atmosphere.md). ACTIVE: a 56px bar, the thread in a
 * scrolling region, the composer docked below with the honesty line. The field
 * is gone the moment a conversation starts, so the thread reads on the calm
 * canvas. Message state and transport are the app's; the shell's MessageList
 * cannot put the mark beside a turn, so the thread is drawn here.
 */
const COLUMN = 'mx-auto w-full max-w-reading px-5 sm:px-8';
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; };

/**
 * This app themes its own root, not <html>. A module-level function keeps the
 * reference stable so the field's effect does not rebuild its shader per render.
 */
const themeRoot = () => document.getElementById('lk-root');

/** The latest run's state, as the stamp on a launch row. */
function stampFor(status: string): { kind: StampKind; label?: string } {
  if (status === 'done') return { kind: 'go', label: 'Completed' };
  if (status === 'running') return { kind: 'running' };
  if (status === 'queued') return { kind: 'queued' };
  if (status === 'error') return { kind: 'nogo' };
  return { kind: 'none' };
}

function Composer({ value, onChange, onSend, busy, connected, autoFocus }: {
  value: string; onChange: (v: string) => void; onSend: () => void;
  busy: boolean; connected: boolean; autoFocus?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = '0px'; el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);
  return (
    <div className="rounded-frame border border-border bg-surface-raised shadow-raised transition-[border-color,box-shadow] duration-(--duration-slow) focus-within:border-border-strong focus-within:shadow-overlay">
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        value={value}
        disabled={!connected}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); } }}
        placeholder={connected ? 'Ask where to go, or what to do next' : 'Connecting'}
        aria-label="Message the navigator"
        className="max-h-[220px] w-full resize-none bg-transparent px-5 pt-4 text-body text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pr-3">
        <span className="text-label text-muted-foreground">Enter to send. Shift+Enter for a new line.</span>
        <button
          type="button"
          onClick={onSend}
          disabled={!connected || busy || !value.trim()}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-[opacity,transform] duration-(--duration-fast) active:scale-95 disabled:opacity-30"
        >
          <ArrowUp size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * A reply reveals progressively at 30fps, capped at 1.2s; instantly under
 * reduced motion (components/chat.md). Turns already on screen stay whole.
 */
function useReveal(text: string, animate: boolean): string {
  const [shown, setShown] = React.useState(animate ? 0 : text.length);
  React.useEffect(() => {
    if (!animate) { setShown(text.length); return; }
    const total = text.length;
    const duration = Math.min(1200, Math.max(200, total * 12));
    const start = performance.now();
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      if (now - last >= 1000 / 30) {
        last = now;
        const n = Math.min(total, Math.round(((now - start) / duration) * total));
        setShown(n);
        if (n >= total) return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, animate]);
  return text.slice(0, shown);
}

function NavigatorTurn({ text, animate }: { text: string; animate: boolean }) {
  const shown = useReveal(text, animate);
  return (
    <li className="flex items-start gap-3">
      <LaunchKitMark size={22} className="mt-0.5" />
      <div className="chat-prose min-w-0 flex-1 whitespace-pre-wrap text-body text-foreground">{shown}</div>
    </li>
  );
}

function Thread({ messages, typing }: { messages: ChatMessage[]; typing: boolean }) {
  const reduced = useReducedMotion();
  const endRef = React.useRef<HTMLDivElement>(null);
  const latestId = messages[messages.length - 1]?.id;
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' });
  }, [latestId, typing, reduced]);
  return (
    <div>
      <ul className="grid gap-7">
        {messages.map((m) =>
          m.sender === 'user' ? (
            <li key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-panel rounded-br-control bg-sunken px-4 py-2.5 text-body text-foreground">
                {m.text}
              </p>
            </li>
          ) : (
            <NavigatorTurn key={m.id} text={m.text} animate={!reduced && m.id === latestId} />
          ),
        )}
        {typing && (
          <li className="flex items-center gap-3" aria-label="The navigator is replying">
            <LaunchKitMark size={22} />
            <span className="flex items-center gap-1.5" aria-hidden>
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
            </span>
          </li>
        )}
      </ul>
      <div ref={endRef} />
    </div>
  );
}

export function NavigatorHome() {
  const { nav, go, href } = useNav();
  const { isConnected } = useShellConnection();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const history = React.useRef<NavTurn[]>([]);
  const nextId = React.useRef(1);
  const started = messages.length > 0;

  const ctx = React.useMemo(() => launchContext(nav.view, nav.projectId), [nav.view, nav.projectId, started]);
  const starters = React.useMemo(() => {
    const first = ctx.launches[0];
    return [
      first ? `Where is my ${first.name} launch?` : 'Start my first launch',
      'What should I do next?',
      'What is Gate 2?',
      'Show me my runs',
    ];
  }, [ctx.launches]);
  const recent = ctx.launches.slice(0, 3);

  const push = (text: string, sender: ChatMessage['sender']) =>
    setMessages((m) => [...m, { id: nextId.current++, text, sender, timestamp: new Date().toISOString() }]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing || !isConnected) return;
    setInput(''); push(text, 'user'); history.current.push({ role: 'user', text }); setTyping(true);
    const ans = await askNavigator(launchContext(nav.view, nav.projectId), history.current, text);
    setTyping(false); push(ans.reply, 'bot'); history.current.push({ role: 'assistant', text: ans.reply });
    if (ans.action) { toast(ans.reply); go(ans.action as unknown as NavState); }
  };

  const openLaunch = (id: string, stage: string) => go({ view: 'workspace', projectId: id, stage } as NavState);

  return (
    // Empty state stops short of the fold so the launch-pad photograph below breaks
    // the bottom edge. That peek is the "there is more" signal; Gantry bans scroll
    // cues (checklist.md, patterns/landing.md), so the composition carries it.
    // Once a conversation starts the thread owns the viewport and nothing peeks.
    <section aria-label="Navigator" className={cn('flex flex-col bg-background', started ? 'h-[calc(100dvh-var(--spacing-topbar))]' : 'min-h-[calc(100dvh-var(--spacing-topbar)-5rem)]')}>
      {started ? (
        <>
          <div className="border-b border-border">
            <div className={cn(COLUMN, 'flex h-14 items-center')}>
              <span className="text-body font-medium">Navigator</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn(COLUMN, 'py-8')}>
              <Thread messages={messages} typing={typing} />
            </div>
          </div>
          <div className="border-t border-border py-4">
            <div className={cn(COLUMN, 'grid gap-2')}>
              <Composer value={input} onChange={setInput} onSend={() => void send()} busy={typing} connected={isConnected} />
              <p className="text-small text-muted-foreground">The navigator opens pages and explains gates. It never publishes anything.</p>
            </div>
          </div>
        </>
      ) : (
        // `isolate` starts a stacking context; the field is the first, absolutely
        // positioned child and the column is a later `relative` one, so the column
        // paints above it with no z-index at all (foundations/layout-spacing.md).
        <div className="relative isolate flex flex-1 flex-col justify-center pb-4 pt-24">
          {/* the pad at dawn or at night, masked so it dissolves before the edges;
              greeting and question sit on the sky, everything else on an opaque surface */}
          <AmbientField
            variant="soft"
            themeRoot={themeRoot}
            className="absolute inset-x-4 inset-y-3 rounded-frame opacity-80 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,black_35%,transparent_100%)] sm:inset-x-8"
          />
          <div className={cn(COLUMN, 'relative')}>
            <p className="text-small text-muted-foreground">{greeting()}</p>
            <h1 className="mt-2 text-display-lg text-balance text-foreground">What are you launching?</h1>
            <div className="mt-6">
              <Composer value={input} onChange={setInput} onSend={() => void send()} busy={typing} connected={isConnected} autoFocus />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {starters.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    disabled={!isConnected || typing}
                    className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-small text-muted-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:text-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>

            {/* the three most recent launches as link rows (components/tables-lists.md) */}
            {recent.length > 0 ? (
              <Card className="mt-12">
                <CardHeader
                  title="Recent launches"
                  actions={
                    <a
                      href={href({ view: 'launches' })}
                      onClick={(e) => { e.preventDefault(); go({ view: 'launches' }); }}
                      className="text-small text-muted-foreground hover:text-foreground"
                    >
                      All launches
                    </a>
                  }
                />
                <CardBody className="pt-0">
                  <ul className="-mx-2 grid">
                    {recent.map((l) => {
                      const stamp = stampFor(l.status);
                      const stage = stageBySlug(l.stage);
                      return (
                        <li key={l.id}>
                          <a
                            href={href({ view: 'workspace', projectId: l.id, stage: l.stage } as NavState)}
                            onClick={(e) => { e.preventDefault(); openLaunch(l.id, l.stage); }}
                            className="flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors duration-(--duration-fast) hover:bg-accent"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body font-medium text-foreground">{l.name}</span>
                              <span className="block text-small text-muted-foreground">{stage ? `At ${stage.name}` : 'Not started'}</span>
                            </span>
                            <StatusStamp kind={stamp.kind} label={stamp.label} />
                            <ArrowRight size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted-foreground" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </CardBody>
              </Card>
            ) : (
              <Card className="mt-12">
                <CardHeader title="No launches yet." description="Start with your app's name, live site and repo. Launch Kit reads them and drafts the profile you approve." />
                <CardBody className="pt-0">
                  <a href={href({ view: 'new-launch' })} onClick={(e) => { e.preventDefault(); go({ view: 'new-launch' }); }}>
                    <Button variant="secondary">Start your launch</Button>
                  </a>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
