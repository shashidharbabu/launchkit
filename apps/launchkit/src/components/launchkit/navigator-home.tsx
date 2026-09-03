import * as React from 'react';
import { MessageList, useShellConnection } from 'shell';
import type { ChatMessage } from 'shell';
import { ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { askNavigator, launchContext, type NavTurn } from '../../data/navigator';
import { useNav, type NavState } from '../../nav';
import { cn } from '../../lib/utils';

/**
 * Home: a conversation is the landing surface (ChatGPT-shaped).
 *
 * Two states, one column. EMPTY — the composer sits at optical centre under a
 * single question, with starters drawn from the user's real launches. ACTIVE —
 * the thread takes the column and the composer docks to the bottom. The thread
 * is the shell's MessageList (markdown + scroll-locked autoscroll); everything
 * else is ours, because the shell's ChatView has no room for a greeting or
 * starters. Boldness is spent on the question and the composer; the rest stays
 * quiet.
 */
const COLUMN = 'mx-auto w-full max-w-[46rem] px-6';

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
    <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 shadow-sm focus-within:border-foreground/30">
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        value={value}
        disabled={!connected}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder={connected ? 'Ask where to go, or what to do next' : 'Connecting…'}
        aria-label="Message the navigator"
        className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-body text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!connected || busy || !value.trim()}
        aria-label="Send"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-foreground text-background transition-opacity disabled:opacity-30"
      >
        <ArrowUp size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

export function NavigatorHome() {
  const { nav, go } = useNav();
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

  return (
    <section aria-label="Navigator" className={cn('flex flex-col bg-background', started ? 'h-[calc(100vh-1px)]' : 'min-h-[calc(100vh-1px)]')}>
      {started ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn(COLUMN, 'py-8')}>
              <MessageList messages={messages} isTyping={typing} />
            </div>
          </div>
          <div className="border-t border-border py-4">
            <div className={COLUMN}>
              <Composer value={input} onChange={setInput} onSend={() => void send()} busy={typing} connected={isConnected} />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col justify-center py-16">
          <div className={COLUMN}>
            <p className="font-mono text-meta uppercase tracking-[0.08em] text-muted-foreground">Launch Kit</p>
            <h1 className="mt-3 text-display font-semibold tracking-tight text-foreground">What are you launching?</h1>
            <p className="mt-2 max-w-xl text-body text-muted-foreground">
              Ask for a stage, a launch, or what to do next. Seven stages, three approvals, nothing published without you.
            </p>
            <div className="mt-8">
              <Composer value={input} onChange={setInput} onSend={() => void send()} busy={typing} connected={isConnected} autoFocus />
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {starters.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => void send(s)}
                    disabled={!isConnected || typing}
                    className="rounded-full border border-border px-3 py-1.5 text-data text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
