---
name: recent-design
description: Stay visually current using Recent (recent.design), a daily curated feed of fresh design work across web, interfaces, branding, product, typography, motion, illustration, 3D, editorial, print, and packaging — judge whether a design "reads 2026" versus templated, run trend triage (adopt / adapt / skip) on what the feed surfaces, and translate a fresh reference into named decisions for Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`). Use this whenever someone asks "what does modern design look like right now", "does this look dated", "make it feel current/2026", "is this trend worth adopting"; whenever a recent.design URL appears in conversation; whenever a redesign brief includes freshness as a goal; or whenever you need to check what working designers are shipping this month before committing to a direction.
---

# Recent

Recent (recent.design) is a **daily curated feed of exceptional recent design
work** — free to browse, no login wall (an account exists for sign-up but the
feed and item pages render logged out). It curates far more than landing
pages: verified category chips are **All, Web, Interface, Branding, Product,
Typography, Motion, Illustration, 3D, Editorial, Print, Packaging** — motion
studies, brand systems, shaders, product UI, posters, packaging all appear.
Roughly 4,000 members as of mid-2026; the feed skews toward what working
designers are excited about *this week*, which is exactly its value and its
danger.

Use `https://recent.design` — **`www.recent.design` does not resolve.**

The skill owns two things:

1. **Selection** — how to browse the feed and read its unusually rich item
   metadata.
2. **Translation** — trend triage: separating durable freshness from fad, and
   turning the keepers into implementation decisions.

## Selection

- Feed: `https://recent.design` — category chips filter client-side (JS), so
  a human clicks them in the browser; a programmatic fetch gets the full
  mixed feed, which is fine for a survey.
- Item pages: `https://recent.design/i/<id>-<slug>` — server-rendered and
  fetchable. Each carries **structured metadata worth reading**: description,
  author + link, source link (often an X post), Category, plus tag axes for
  **Style** (e.g. Typographic, Editorial), **Color** (e.g. Dark, Vibrant),
  and **Interaction** (e.g. Transitions), and impression counts.
- For web-build work, weight **Web** and **Interface** items; treat Branding /
  Editorial / Print items as type-and-color references only.
- Survey, don't cherry-pick: skim 20–30 items before selecting 2–3. The point
  of a currency check is the *distribution* — what keeps recurring — not the
  single flashiest post.

## Translation — trend triage

Freshness is a property of choices, not effects. Run every candidate trend
through this triage before it touches the codebase:

- **Adopt** (cheap, durable, content-serving): confident type scale jumps,
  restrained palettes with one loud accent, generous negative space, visible
  grid discipline, honest borders/rules, tactile hover states. These read
  current for years and cost little.
- **Adapt** (good instinct, needs translation): a shader-driven gradient
  becomes a CSS/`haikei` wash; a custom variable-font animation becomes one
  weight transition; a 3D scene becomes a well-lit product screenshot. Keep
  the *effect's job*, swap the machinery.
- **Skip** (expensive, faddish, or content-hostile): WebGL for decoration,
  scroll-jacking, cursor gimmicks, liquid-glass everything, AI-gradient soup.
  If the feed shows fifteen of something this month, it will read as
  "template, 2026 vintage" by next year — being legibly *of a moment* is how
  things date fastest.

What "reads 2026" vs templated, concretely: templated is symmetric
three-column feature grids, stock gradient meshes, identical rounded-2xl
cards, center-everything cowardice. Current work shows **asymmetry with
discipline, editorial type doing structural work, one memorable move per
page, and motion that settles** (entrances finish; nothing loops for
attention).

Then implement the keepers as named decisions — layout grid, type scale,
spacing rhythm, color temperature, motion choreography — in
`tailwind.config.ts` tokens and motion v13 (`motion/react`) variants (entrances 0.4–0.7s
ease-out with stagger, `useReducedMotion` respected). Hand off:
**taste-skill** for the anti-slop landing-page build, **frontend-design** for
overall direction, **ui-ux-pro-max** for concrete palettes/fonts,
**motion-primitives** for pre-built animation components, **haikei** for
generated backgrounds.

## When not to use

- **Freshness isn't the goal.** Admin consoles, docs, and dense tools need
  clarity and convention; a currency pass adds risk, not value.
- **The brand is deliberately timeless.** Some directions (Swiss, brutalist,
  editorial classic) should ignore the feed on purpose.
- **You need a specific pattern, not currency**: hero anatomy →
  **supahero**; mood/temperature → **cosmos**; case-study narrative →
  **pafolios**.
- **Mid-build.** Trend-checking after the direction is locked produces churn.
  Triage happens before the first component, or at a declared redesign.

## Anti-patterns

- **Copying pixels instead of extracting patterns.** Recreating a feed item
  is double-wrong here: it's someone's fresh work, so the copy is both theft
  and instantly datable. Extract the choice, never the artifact.
- **Mixing three references into incoherence.** Three trends on one page =
  templated by committee. Pick one current move, execute it fully, let the
  rest of the page be quiet.
- **Chasing the feed.** Rebuilding whenever the feed shifts is how a site is
  permanently six months behind. Triage once per project phase.
- **Reading Branding/Print items as UI specs.** A poster's density has no
  scroll behavior. Cross-category references contribute type and color only.
- **Claiming unverified features.** Search and personalization weren't
  verified logged-out; don't promise them. Categories are the one filter.
