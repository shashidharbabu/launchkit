# Pattern: the chat home

Files: `app/(app)/home/page.tsx`, `components/launchkit/navigator/*`, `lib/navigator.ts`,
backend `app/navigator.py`. Component spec: `components/chat.md`.

## The idea

The console opens on a conversation, the way the best assistants do: nothing to configure,
one question, and an input that takes plain language. It answers "where am I", "what is
this gate", "what should I do next", and it opens the right page. It is also the fastest
way around the app for someone who does not yet know the rail.

## Layout

The page owns its height: `h-[calc(100dvh-3.5rem)]` under the mobile top bar, `h-dvh`
beside the rail. Two states, one 46rem column:

**Empty.** Vertically centred: greeting (14px muted), the question (`text-display-lg`),
the composer, four starter pills, and, 48px below, the three most recent launches as a
card of link rows (or a card inviting the first launch).

**Active.** A 56px bar ("Navigator", ghost "New conversation"), the thread in a scrolling
region, the composer docked at the bottom with the honesty line under it.

## The turn

1. The person's text appears on the right; a pending navigator turn shows three dots.
2. The request goes to `POST /navigator` with the last six turns, the current view, and
   the current launch id. The backend builds the context from the database (every launch,
   its latest profile status and last run) and asks the model for one JSON object.
3. The reply reveals over at most 1.2s. If it carries an action, an action card names the
   destination and the app follows it 900ms later.
4. If the backend is unreachable, `localAnswer` produces a deterministic reply and action
   for the common asks, and the chat says so only by answering plainly.

## Copy

- Greeting by hour: Good morning / afternoon / evening, followed by a period.
- The question is fixed: "What are you launching?"
- Starters are drawn from real data and read as things a person would type.
- The honesty line is fixed: "The navigator opens pages and explains gates. It never
  publishes anything."
- Replies are one to three plain sentences; the prompt forbids markdown structure and
  dashes.

## Don't

- No welcome message from the assistant before the person types.
- No "AI" badge, sparkle icon, or model name anywhere on the page.
- No autoplaying demo conversation.
- No sidebar of past conversations; the thread resets with "New conversation".
