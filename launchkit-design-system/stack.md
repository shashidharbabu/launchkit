# Stack

Every entry verified against npm/GitHub/docs in **August 2026** (research
run: 5 agents, sources incl. motion.dev/changelog, ui.shadcn.com/docs,
tailwindcss.com/blog, github.com/TanStack). Versions are the floor at
verification time; pin as noted.

## Adopt

| Library | Version (Aug 2026) | Role | Notes / gotchas |
| --- | --- | --- | --- |
| Next.js 16 · React 19 · TS | — | Framework | Server Components for initial data; client components at animated/interactive leaves |
| tailwindcss | 4.3.x | Styling + tokens | CSS-first config; `@theme inline` pattern (see tokens.css). `darkMode` in a JS config silently no-ops in v4 — kill `tailwind.config.ts` unless a plugin forces `@config` |
| shadcn/ui CLI | v4 | Component foundation + registry | **Base UI backend is the default since Jul 2026** — use it for new components; Radix remains a `-b radix` flag. Registry can distribute this whole design system as a `registry:base` payload later |
| @base-ui/react | 1.7.x | Headless primitives (via shadcn) | The Radix-team successor, 9.5M dl/wk. Gotcha: the stale rc package is `@base-ui-components/react` — never pin that name |
| lucide-react | 1.x (weekly releases) | Icons | shadcn default, ~97M dl/wk. Import individually (`import { Rocket } from "lucide-react"`), wrap once to standardize `strokeWidth={1.5}` |
| motion | 13.x | JS animation runtime | Import `motion/react`. v13 breaking change is only `isValidProp` (see motion.md). Interpolates OKLCH natively — pairs with our tokens |
| motion-primitives | vendored (registry ~0.1.0) | Animated component recipes | Copy-in like shadcn; we own the source. Upstream cadence is slow — that's fine for vendored code |
| @number-flow/react | ~0.6.x (pin minor) | Animated KPIs | 1.27M dl/wk, dependency-free, `Intl` formatting, respects reduced-motion. Still 0.x → gate upgrades through this repo |
| tw-animate-css | 1.4.x (pin — v2 has planned breaking changes) | CSS state animations | The shadcn-era replacement for tailwindcss-animate; 36M dl/wk. Zero-JS `data-[state]` enter/exits |
| sonner | 2.x | Toasts | 49.6M dl/wk, actively maintained, no caveats |
| cmdk via shadcn `Command` | 1.1.x | Cmd+K palette | cmdk itself is frozen-but-stable (~17 months no release); consuming it through the shadcn wrapper makes any future engine swap a registry update, not a rewrite |
| @tanstack/react-table | 9.x (stable 2026-08-04 — pin minor, it's days old) | Headless tables | v9 = React-Compiler-era rewrite; most community snippets still show v8 APIs — keep the migration guide handy |
| @tanstack/react-query | 5.101.x | Server state | v6 is pre-release only — don't wait for it. `useSuspenseQuery` + HydrationBoundary; initial loads stay in Server Components |
| @tanstack/react-virtual | 3.14.x | Long lists (>50 rows) | Set `useFlushSync: false` on React 19. Only where row counts warrant |
| recharts | 3.x | Charts | ~57M dl/wk, an order of magnitude above alternatives; a11y layer on by default. Use via shadcn `ChartContainer` + `var(--chart-*)` |
| next-themes | 0.4.x | Dark mode switching | `attribute="class"`, `defaultTheme="system"`, `disableTransitionOnChange`, `suppressHydrationWarning` on `<html>` |
| IBM Plex Sans / Mono | Google Fonts via next/font | Type | See typography.md |

Tooling (not dependencies): **tweakcn** (tweakcn.com, 10.2k★) to preview
token variants — export matches our `:root`/`.dark` + `@theme inline`
format; hand-tune in git afterward.

## Consider (documented fallbacks)

- **React Aria Components** 1.20 — the a11y/i18n heavyweight; revisit only
  if deep multi-locale support becomes a requirement.
- **visx** 4.x — back-pocket for one bespoke signature visualization
  Recharts can't express; never the default.
- **GSAP** 3.15 — fully free since the Webflow acquisition (all Club
  plugins included), but imperative and a second runtime; marketing pages
  only, never the component library.
- **View Transitions** — React `<ViewTransition>` still canary-only;
  Next 16 flag `experimental.viewTransition`. Optional CSS crossfade as
  progressive enhancement; promote when stable.
- **Geist Sans/Mono** — the documented rebrand alternative to Plex.

## Avoid (and why)

- **vaul** — unmaintained ~20 months; Base UI-backed shadcn Drawer/Sheet
  replaced it. Its 38M downloads are legacy installs, not momentum.
- **Tremor** — npm package frozen since Vercel acquisition (Jan 2025);
  the blocks import someone else's design language.
- **Nivo** — still 0.x, BI-shaped; would split chart theming.
- **Radix as a new foundation** — supported, but its authors build Base UI
  now and shadcn's guidance for new projects is explicit.
- **HeroUI / Hugeicons / Phosphor-alongside-Lucide** — styled kit conflicts
  with token ownership; freemium icon lock-in; two icon voices fracture UI.
- **@tailwindcss/container-queries** — v3 plugin; `@container` is core in
  v4 (use it for panels that render wide and narrow).
- **tailwindcss-animate** — deprecated for tw-animate-css.
- **Berkeley Mono** — gorgeous, but paid license; fails the free
  requirement. Free stand-in if ever needed: Commit Mono.
- **A second JS animation runtime** of any kind.

## Install

```bash
npx shadcn@latest init
npx shadcn@latest add button card tabs dialog sheet dropdown-menu command \
  tooltip textarea input label table skeleton sonner chart
npm i motion @number-flow/react lucide-react next-themes \
  @tanstack/react-table @tanstack/react-query @tanstack/react-virtual recharts
npx motion-primitives@latest add text-shimmer animated-background \
  transition-panel animated-group morphing-dialog
```
