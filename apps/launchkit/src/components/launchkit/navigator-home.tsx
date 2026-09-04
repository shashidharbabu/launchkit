import * as React from 'react';
import { MessageList, useShellConnection } from 'shell';
import type { ChatMessage } from 'shell';
import { ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { askNavigator, launchContext, type NavTurn } from '../../data/navigator';
import { useNav, type NavState } from '../../nav';
import { cn } from '@launchkit/design-system/lib/cn';

/**
 * Home: a conversation is the landing surface (ChatGPT-shaped).
 *
 * Two states, one column. EMPTY, the composer sits at optical centre under a
 * single question, with starters drawn from the user's real launches. ACTIVE
 * the thread takes the column and the composer docks to the bottom. The thread
 * is the shell's MessageList (markdown + scroll-locked autoscroll); everything
 * else is ours, because the shell's ChatView has no room for a greeting or
 * starters. Boldness is spent on the question and the composer; the rest stays
 * quiet.
 */
const COLUMN = 'mx-auto w-full max-w-reading px-5 sm:px-8';
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; };

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
    <section aria-label="Navigator" className={cn('flex flex-col bg-background', started ? 'h-[calc(100dvh-var(--spacing-topbar))]' : 'min-h-[calc(100dvh-var(--spacing-topbar))]')}>
      {started ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className={cn(COLUMN, 'py-8')}>
              <MessageList messages={messages} isTyping={typing} />
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
        <div className="flex flex-1 flex-col justify-center py-16">
          <div className={COLUMN}>
            <p className="text-small text-muted-foreground">{greeting()}</p>
            <h1 className="mt-2 text-display-lg text-balance text-foreground">What are you launching?</h1>
            <p className="mt-3 max-w-xl text-body text-muted-foreground">
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
                    className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-small text-muted-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:text-foreground disabled:opacity-50"
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
