---
name: design-arsenal
description: Master router over the Design Lab's 21-skill design stack — maps any design need (direction, identity, typography, color, components, glass surfaces, texture, backgrounds, motion, 3D, video, audio, logo) to the right skill and sequences them into a complete design-system build for an application. Use this whenever a task is bigger than one asset — "build a design system", "do a full design pass", "make this app look premium", "set up the visual identity", "redesign this whole product" — or when unsure which design skill applies, or when starting design work on a new repo and deciding what to load in what order. Also owns the glass/glassmorphism recipe (no single site-skill covers it) and the aggregated licensing pre-flight for commercial launches.
---

# Design Arsenal

A router, not a tool. Twenty-one skills live in this lab; each owns one tool or
practice. This skill owns the map between them and the order they compose in
when the job is a whole design system rather than a single asset.

## The roster

| Need | Skill | What it yields |
|---|---|---|
| Visual direction / moodboard | `cosmos` | Reference → named decisions loop |
| Hero-section direction | `supahero` | Hero anatomy catalog + adaptation |
| "Does this read current?" | `recent-design` | Trend triage: adopt / adapt / skip |
| Case-study / showcase narrative | `pafolios` | Narrative spine for showcase pages |
| Logo direction (real-world refs) | `logosystem` | 1,300+ real logo systems, faceted |
| Logo generation (fast, cheap) | `logoai` | AI logo + brand kit, paid download |
| Free fonts, safely | `bestfreefonts` | Licensed fonts + next/font hosting |
| Font pairings / style database | `ui-ux-pro-max` | Curated pairing + palette data |
| Brand color → full scale | `uicolors` | Tailwind 50–950 scale from one hex |
| Chart / dashboard color | `dataviz` | Validated viz palette method |
| Component base | `shadcn` | CLI/registry mechanics, token remap |
| Animated spectacle components | `componentry` | ~60 MIT registry components |
| Animation primitives | `motion-primitives` | Text reveals, tickers, marquees |
| Motion direction / choreography | `motionsites` | Preview → framer-motion translation |
| Designer-authored animation | `jitter` | MP4/GIF/Lottie exports + players |
| Interactive 3D | `spline` | react-spline embed or export fallback |
| SVG backgrounds (waves, blobs) | `haikei` | Generator handoff + integration |
| Texture, grain, glow, patterns | `fffuel` | ~40 generators routed by use case |
| Music / SFX for video | `uppbeat` | License tiers + audio restraint |
| Anti-slop direction + taste | `taste-skill`, `frontend-design` | Judgment, not assets |

## Check the stack before writing a line of code

These skills were authored against Next 14 + framer-motion 11. Real repos drift,
and the drift is silent — the API matches, only the import path differs, so a
wrong import fails at build time rather than in review.

Verified in `rocketride-podcasts` (Aug 2026): Next **16**, React **19**,
Tailwind **3.4**, and `motion` **v13** — imports are `from "motion/react"`, not
`"framer-motion"`. Read `package.json` first, every time. A component library
that declares `framer-motion` as its own dependency (componentry does) can
coexist, but that is two copies of the same engine — say so before installing.

## Build sequence for a full design system

Phases in order; each consumes the previous phase's output. Skip nothing
silently — say what was skipped and why.

1. **Direction** — `taste-skill` + `frontend-design` first (judgment), then
   `cosmos` / `recent-design` for references, `supahero` for the hero,
   `pafolios` if showcase pages exist. Output: a one-page direction doc with
   named decisions (grid, type scale, spacing rhythm, color temperature,
   motion character).
2. **Identity** — `logosystem` for direction, `logoai` only if a mark must be
   generated; `bestfreefonts` (or `ui-ux-pro-max` pairings) for type;
   `uicolors` to expand brand hexes into scales. Output: tokens on paper.
3. **Tokens in code** — tailwind.config.ts + CSS variables, dark mode strategy
   decided (class vs media) before any component lands.
4. **Component base** — `shadcn` (the Tailwind v3 vs v4 CLI fork is decision
   one), remap its tokens onto the palette from phase 3 — never accept defaults.
5. **Surfaces** — glass recipe below; `fffuel` for grain/noise/texture;
   `haikei` for structural backgrounds. Texture is seasoning, not structure.
6. **Motion system** — `motionsites` for choreography patterns, implemented in
   framer-motion; `motion-primitives` / `componentry` for pre-built pieces;
   `jitter` when a designer authors the animation. One easing vocabulary,
   defined once.
7. **Spectacle (optional, budgeted)** — `spline` for 3D (582KB gz runtime —
   demand it earns its LCP cost), video with `uppbeat` audio rules (never
   autoplay with sound).
8. **QA pass** — contrast on the busiest region, prefers-reduced-motion on
   every animation, bundle audit, licensing pre-flight below.

## Glass recipe

No site-skill owns glassmorphism; it's pure CSS plus restraint:

```tsx
<div className="rounded-2xl border border-white/10 bg-white/[0.06]
  backdrop-blur-xl backdrop-saturate-150
  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
```

- Glass needs something behind it — a gradient, image, or `haikei`/`fffuel`
  background. Over a flat color it just reads as gray.
- Light mode: flip to `bg-black/[0.04] border-black/10`.
- Add a `fffuel` nnnoise texture at 2–4% opacity to kill banding.
- `backdrop-blur` is expensive; don't stack more than ~3 glass layers per view,
  and never animate blur radius.
- Text on glass must still pass AA against the *busiest* backdrop region.

## Licensing pre-flight (commercial launch)

- Fonts: license verified at source, OFL rename rule if subsetting
  (`bestfreefonts`).
- Logo: AI marks are a license not a copyright; trademark search done
  (`logoai`).
- Audio: tier covers the use — client work and paid ads need Business tier
  (`uppbeat`); no masters committed to the repo.
- 3D/animation: Spline watermark/plan checked; Jitter free tier watermarks.
- Components: `componentry` and shadcn are MIT — fine; `motionsites` prompts
  are paid with no published license text.

## When not to use

- One asset, known tool → go straight to that skill.
- Dense work surfaces (dashboards, tables) → `rocketride-frontend` picks the
  stack; most of this arsenal is marketing-surface weaponry.
- Restraint is the arsenal's real skill: a hero carries at most one spectacle
  layer (3D *or* animated background *or* video — never two).
