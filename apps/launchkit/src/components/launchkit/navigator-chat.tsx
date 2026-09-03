import * as React from 'react';
import { toast } from 'sonner';
import { ChatView, useShellConnection } from 'shell';
import type { ChatMessage } from 'shell';
import { askNavigator, launchContext, type NavTurn } from '../../data/navigator';
import { useNav, type NavState } from '../../nav';

/**
 * The Home navigator: a chat that answers "where am I / what next" and moves
 * the user around the app. The app owns message state and transport (the
 * shell's useChatMessages is bound to its own send path, which cannot carry
 * our context or parse the JSON action); ChatView only renders and collects
 * input. Every model-proposed action was validated in data/navigator.ts.
 */
export function NavigatorChat() {
  const { nav, go } = useNav();
  const { isConnected } = useShellConnection();
  const [messages, setMessages] = React.useState<ChatMessage[]>([{
    id: 1, sender: 'bot', timestamp: new Date().toISOString(),
    text: "Hi — I'm the Launch Kit navigator. Ask where to go, what a gate means, or what to do next.",
  }]);
  const [typing, setTyping] = React.useState(false);
  const history = React.useRef<NavTurn[]>([]);
  const nextId = React.useRef(2);
  const push = (text: string, sender: ChatMessage['sender']) =>
    setMessages((m) => [...m, { id: nextId.current++, text, sender, timestamp: new Date().toISOString() }]);

  const onSend = async (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    push(t, 'user'); history.current.push({ role: 'user', text: t }); setTyping(true);
    const ans = await askNavigator(launchContext(nav.view, nav.projectId), history.current, t);
    setTyping(false); push(ans.reply, 'bot'); history.current.push({ role: 'assistant', text: ans.reply });
    if (ans.action) {
      toast(ans.reply); // the view is about to change; keep the answer visible
      go(ans.action as unknown as NavState);
    }
  };

  return (
    <section aria-label="Navigator" className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 pt-6 pb-2">
        <p className="font-mono text-meta uppercase tracking-[0.08em] text-muted-foreground">Navigator</p>
      </div>
      <div className="mx-auto h-[26rem] w-full max-w-5xl px-6 pb-6">
        <ChatView
          messages={messages}
          isTyping={typing}
          isConnected={isConnected}
          onSend={onSend}
          placeholder="Where do you want to go, or what do you want to know?"
          emptyTitle="Ask the navigator"
          emptyDescription="Open a launch, find a stage, or ask what a gate means."
        />
      </div>
    </section>
  );
}
