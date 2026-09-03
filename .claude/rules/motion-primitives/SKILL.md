---
name: motion-primitives
description: Add polished, pre-built animations to React/Next.js apps using the motion-primitives component library (motion-primitives.com) — animated text reveals, number tickers, morphing dialogs, marquees, scroll reveals, hover effects. Use this whenever a task involves animating UI, making a landing page or hero section feel alive, animating numbers/KPIs on a dashboard, adding entrance/reveal animations, marquee/logo sliders, animated dialogs or popovers, shimmer/loading text states, or when someone says an interface feels "static", "flat", or "needs polish". Also use it to decide when NOT to animate. Always consult references/component-api.md for exact prop names before writing any motion-primitives code — the APIs here are extracted from source and several differ from what you'd guess.
---

# Motion-Primitives

Motion-primitives is a copy-in-source animation component library (same
philosophy as shadcn/ui) built on **Motion for React** (`motion`, the successor
to framer-motion) and Tailwind. 33 components across six categories: core
containers, text effects, number effects, interactive elements, toolbars, and
advanced effects. MIT licensed, by @ibelick.

**Why it's good:** it occupies the layer shadcn deliberately doesn't — the
expressive/delight layer. shadcn gives you accessible structure; motion-primitives
gives you the animated moments (a headline that reveals, a KPI that rolls, a
thumbnail that morphs into a fullscreen preview). Because components are copied
into your repo, they're editable and there's no runtime dependency beyond
`motion` itself — no version treadmill, no lock-in.

## Setup (once per project)

Prerequisites: Tailwind, then:

```bash
npm install motion lucide-react
# lib/utils.ts must exist with the cn() helper (clsx + tailwind-merge)
```

Add components one at a time — either CLI works, both copy source into
`components/motion-primitives/` (path configurable):

```bash
npx motion-primitives@latest add text-effect
# or via shadcn CLI:
npx shadcn@latest add "https://motion-primitives.com/c/text-effect.json"
```

If CLI/network is unavailable, copy the component file directly from
`github.com/ibelick/motion-primitives` → `components/core/<name>.tsx`. Imports
use `motion/react` (not `framer-motion`).

**Per-component dependencies (verified by compile):** the CLI resolves these
automatically, but manual copies must add them: `infinite-slider` and
`sliding-number` need `react-use-measure`; `morphing-dialog` needs
`lucide-react` and the repo's `hooks/useClickOutside.tsx` (copy it to
`hooks/`). If a copied component fails to resolve an import, check the repo's
`hooks/` directory before assuming it's an npm package.

## Workflow

1. **Decide whether motion belongs here at all** (see "Where it makes sense"
   below). If the surface is a dense work queue, the answer is usually no.
2. **Pick the component** from the decision table below.
3. **Read `references/component-api.md`** for that component's exact props —
   never write props from memory. Several props are non-obvious (e.g. Tilt's
   reverse prop is spelled `isRevese` in the shipped source; most text
   components accept `children: string` only, not ReactNode).
4. **Read `references/recipes.md`** if the task matches a recipe (hero reveal,
   KPI ticker, asset-morph preview, marquee, streaming-text shimmer).
5. **Compose, don't stack.** One motion idea per screen region. Two animated
   text effects next to each other read as broken, not polished.

## Where it makes sense

| Surface | Verdict | Reach for |
|---|---|---|
| Landing pages, hero sections, App Store listings | **Yes — primary habitat** | TextEffect, AnimatedGroup, InView, InfiniteSlider, Spotlight |
| Dashboard KPI tiles, stat counters | **Yes** | AnimatedNumber, SlidingNumber, TextShimmer for loading |
| Empty states, onboarding steps, first-run | **Yes** | TextEffect, TransitionPanel, AnimatedGroup |
| Asset/media preview (grid → fullscreen) | **Yes** | MorphingDialog, MorphingPopover, ImageComparison |
| AI streaming / "thinking" states | **Yes** | TextShimmer, TextShimmerWave, TextLoop |
| Marketing social proof, logo walls | **Yes** | InfiniteSlider, InView |
| Dense admin tables, review queues | **Mostly no** — motion taxes throughput. At most: a subtle exit animation on approve/reject. |
| Forms, settings pages | **No** — nothing to earn. |
| High-frequency live data (updates >1/sec) | **No** — springs never settle; numbers become unreadable. Snap values instead. |
| Anywhere `prefers-reduced-motion` users land | Respect it: gate decorative motion behind the media query. Number/text *content* changes may remain. |

The test: motion should either **explain a state change** (this thing appeared /
moved / completed) or **reward a moment that matters** (first load, launch,
success). Motion that does neither is noise.

## Decision table — task → component

| You need | Component |
|---|---|
| Headline/paragraph reveal on load or scroll | `text-effect` (presets: blur, scale, fade, slide; per word/char/line) |
| Rotating word in a headline ("build **apps/agents/pipelines**") | `text-loop` |
| Loading/streaming text shimmer | `text-shimmer` or `text-shimmer-wave` |
| Hacker-style character scramble | `text-scramble` |
| Smooth text swap when a label changes | `text-morph` |
| Per-letter rolling flip | `text-roll` |
| Animated stat/KPI value | `animated-number` (spring) or `sliding-number` (odometer digits) |
| Stagger-in a group of cards/items | `animated-group` |
| Animate when scrolled into view | `in-view` |
| Logo/testimonial marquee | `infinite-slider` |
| Segmented control / tab hover highlight that follows the pointer | `animated-background` |
| Multi-step panel transitions (wizards, onboarding) | `transition-panel` |
| Thumbnail that morphs into a fullscreen dialog | `morphing-dialog` |
| Button that morphs into a form/popover | `morphing-popover` |
| Standard animated modal | `dialog` |
| Expand/collapse single section | `disclosure`; multiple sections: `accordion` |
| Swipeable/draggable carousel | `carousel` |
| Before/after image slider | `image-comparison` |
| macOS-style magnifying dock | `dock` |
| Animated glow behind an element | `glow-effect`; running light around a border: `border-trail` |
| Mouse-following spotlight on cards | `spotlight` |
| 3D tilt on hover | `tilt` |
| Element attracted to cursor | `magnetic` |
| Custom cursor | `cursor` |
| Circular rotating text badge | `spinning-text` |
| Reading progress bar | `scroll-progress` |
| Edge fade/blur on scrollable content | `progressive-blur` |

**Note on toolbars:** `toolbar-dynamic` and `toolbar-expandable` are page-level
demos (default exports, hard-coded content), not composable primitives. Treat
them as reference implementations to adapt, not components to install and use
as-is.

## Non-negotiables

- Every motion-primitives component is a client component — it or its parent
  needs `'use client'`. Keep the boundary at the leaf: animate the headline
  component, not the whole page.
- Import from `motion/react`, never `framer-motion`, in any code you write
  alongside these components.
- Text-effect family takes `children: string`. Passing JSX will type-error —
  wrap mixed content by composing multiple instances instead.
- Don't animate layout-critical dimensions on containers with data-heavy
  children; animate transform/opacity instead (the components already do this
  internally — keep your customizations consistent with it).
- Check `references/component-api.md` before writing props. If a prop you want
  isn't listed, it doesn't exist — extend the copied source instead of guessing.
