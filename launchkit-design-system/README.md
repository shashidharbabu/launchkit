# Launch Kit Design System — "Flight Paperwork"

The application design system for **Launch Kit** (GTM-in-a-box for RocketRide
App Store publishers). Launch Kit renders your launch as signed flight
paperwork: procedure sheets, go/no-go gates, stamped approvals, telemetry
after liftoff.

Target stack: **Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui (Base UI
backend) · Motion v13 + motion-primitives**. Every choice in `stack.md` was
verified against the ecosystem as of **August 2026**, and every chart color
passed the CVD/contrast validator (see `dataviz.md`).

## Files

| File | What it defines |
| --- | --- |
| `01-direction.md` | The design thesis, personality, signature element, rejected defaults. Read first. |
| `foundations/tokens.css` | The single source of truth: Tailwind v4 `@theme` tokens (OKLCH), light + dark, radius, motion, charts. Drop into `app/globals.css`. |
| `foundations/typography.md` | IBM Plex roles and scale, `next/font` setup, numeral rules. |
| `foundations/color.md` | Color roles, the ember budget, status-stamp rules, contrast table. |
| `components.md` | Specs for every workspace component: stage rail, Gate Slip, stamps, signal queue, tables, forms, empty states. |
| `motion.md` | Motion principles + exact component/prop mapping (motion-primitives, Motion v13, number-flow, tw-animate-css). |
| `dataviz.md` | Chart forms, the validated categorical/status palettes, mark specs, Recharts wiring. |
| `stack.md` | Adopt / consider / avoid for every library, with versions and gotchas. |
| `voice.md` | Copy rules: vocabulary, honest-empty states, error style, provenance lines. |

## How to consume this system

**Humans:** read `01-direction.md`, then build with the tokens — components
never hardcode a color, radius, duration, or font. If a value isn't a token,
it isn't in the system.

**AI agents:** before generating any Launch Kit UI, read `01-direction.md`
and `foundations/tokens.css`, then the spec for the component you're
building in `components.md`. Use semantic utilities (`bg-background`,
`text-muted-foreground`, `bg-primary`) — never raw palette classes like
`bg-orange-600`.

## Quick start (frontend repo)

```bash
npx shadcn@latest init            # Base UI backend is the default
npm i motion @number-flow/react sonner lucide-react next-themes
npx motion-primitives@latest add text-shimmer animated-background transition-panel
```

1. Replace the generated token block in `app/globals.css` with
   `foundations/tokens.css`.
2. Wire fonts per `foundations/typography.md` (IBM Plex Sans + IBM Plex Mono
   via `next/font/google`).
3. Wrap the app in `<ThemeProvider attribute="class" defaultTheme="system"
   enableSystem disableTransitionOnChange>` (next-themes) and add
   `suppressHydrationWarning` to `<html>`.

## Non-negotiables

- **Assisted, never autonomous** is visible in the UI: AI output is a draft
  until a human stamps it. Drafts carry provenance lines; approvals are
  explicit acts with explicit feedback.
- **Sharp on paper, soft when floating.** On-surface elements (cards, slips,
  tables, inputs, stamps) have radius 0. Floating layers (menus, dialogs,
  toasts) get 4px + shadow.
- **One ember action per view.** Ember is the action color; it loses meaning
  if it's everywhere.
- **Status is never color alone.** Stamps always carry their text label.
- **Palette changes re-run the validator** (`dataviz.md` has the commands).
  A palette that hasn't passed doesn't ship.
