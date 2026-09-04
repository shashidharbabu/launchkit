# Chat

Source: `components/launchkit/navigator/composer.tsx`, `thread.tsx`,
`navigator-home.tsx`; `lib/navigator.ts`; backend `app/navigator.py`.
Pattern: `patterns/chat.md`. Specimen: `/design#chat`.

The navigator is the console's front door. It answers "where am I, what does this mean,
what next", and it opens the right page. It never publishes anything, and it says so
under the composer.

## Composer

One raised panel, 24px radius, hairline border, `shadow-raised`; on focus the border
strengthens and the shadow deepens to overlay. Inside: a textarea that grows from one
line to 220px, then scrolls; below it a hint in `text-label` muted ("Enter to send.
Shift+Enter for a new line.") and the send button.

The send button is a 36px ink circle with an up arrow, the only ink circle in the
product. It is 30% opaque until there is text, and presses with a 0.95 scale.

Enter sends; Shift+Enter breaks a line; composition (IME) is respected. The textarea has
a visually hidden label ("Message the navigator").

## Thread

- **The person's turn:** right-aligned, up to 85% width, `bg-sunken`, 16px radius with
  the bottom-right corner reduced to 8px, `text-body`, whitespace preserved.
- **The navigator's turn:** left-aligned beside the 22px mark, no bubble, `text-body` in
  `.chat-prose` (paragraphs, bold, inline code, short lists). While waiting: three
  pulsing dots. When the reply arrives it reveals progressively at 30fps, capped at
  1.2s; instantly under reduced motion.
- **An action card** under a reply that proposes navigation: a small card with
  "Opening" and a secondary `LinkButton` naming the destination ("Open Targets for
  Pingdeck"). The app follows the action 900ms later, so the person can read the reply
  first.
- Turns are 28px apart. The newest turn scrolls into view; static previews pass
  `autoScroll={false}`.

## Home, empty

Greeting by time of day in muted body text, the question "What are you launching?" in
`text-display-lg`, the composer, four starter pills, then the three most recent launches
(or an invitation to start the first). The column is `max-w-reading` at optical centre.
Behind it, the ambient field in its soft variant (`foundations/atmosphere.md`), masked
radially so it dissolves before the rail; the composer and the launches card sit on
opaque surfaces, the greeting and question on the sky. It is gone once the conversation
starts, so the thread reads on the calm canvas.

Starters come from the person's real data: "Where is Pingdeck?", "What should I do
next?", "What is Gate 2?", "Show my runs".

## Home, active

A 56px bar with "Navigator" and a ghost "New conversation" button; the thread in a
scrolling region; the composer docked below with the honesty line: "The navigator opens
pages and explains gates. It never publishes anything."

## Trust boundary

The model returns one JSON object `{reply, action}`. The backend validates the action
against the real launches and the app map; the client validates again. A hallucinated
view or id degrades to reply-only, never to a wrong navigation. When the backend is
unreachable, `localAnswer` in `lib/navigator.ts` handles the common asks (gates, runs,
settings, a named launch, a stage) so the chat still moves the person around.

## Don't

- No avatars, no names, no timestamps on turns.
- No markdown headers or tables in replies; the prompt forbids them.
- No suggestion chips after every reply; starters appear only on the empty state.
- No streaming theatre beyond the 1.2s reveal.
