---
name: uicolors
description: Generate a full Tailwind color scale from a brand hex with UI Colors (uicolors.app) — a free browser tool (paid Pro tier and paid API exist) that turns one hexcode into a Tailwind-convention 50–950 scale, previews it on real UI mockups (cards, dashboards, shadcn/ui, charts, gradients), and is deep-linkable per hex (uicolors.app/generate/2563eb) — then wire it into tailwind.config.ts extend.colors, pick which steps carry text vs surfaces in light and dark mode, and contrast-check the pairs (WCAG AA 4.5:1 body / 3:1 large-text-and-UI). Use this whenever a task involves uicolors.app, turning a brand hex into a palette ("we have #2563EB, build the theme"), extending Tailwind with custom brand colors, choosing shade steps for dark mode, checking color contrast for text on brand surfaces, or when a design uses one accent hex and needs hover/border/surface tints derived from it. Step-choosing tables, the contrast script, and the paste-into-config workflow live in references/integration.md.
---

# UI Colors

UI Colors (uicolors.app, by Erik de Vries) is a **free browser tool** — no
account needed to generate — that expands one hexcode into an 11-step,
Tailwind-convention color scale (50–950) and previews it on realistic UI:
tabs for Cards, Website, Branding, Dashboard, Components, shadcn/ui, Apps,
Charts, Gradients, Logos, Headings. Deep-linkable: `uicolors.app/generate/<hex-without-#>`.
Spacebar randomizes; shades are click-to-copy.

The paid edges, honestly: **Pro** unlocks secondary/neutral/status scales and
font pickers in the previewer; saving palettes needs sign-in; a **paid API**
exists (`POST https://uicolors.app/api/v1/color-scales/tailwindcss3/generate/<hex>`,
`x-api-key` header, returns hex + HSL per shade; its ToS bans building
competing generators). There's also a free Figma plugin, and reference pages
for every stock Tailwind color with click-to-copy HEX/HSL/OKLCH
(`uicolors.app/tailwind-colors/<name>`). The core loop — brand hex in, full
scale out — is free, and that's all this skill needs.

## Workflow — brand hex to shipped theme

1. **Have a brand hex first.** If there's no anchor color yet, this is the
   wrong tool — pick a palette with **ui-ux-pro-max** (192 curated palettes) or
   the direction skills (**frontend-design** / **taste-skill**), *then* come here
   to expand the chosen hex into a scale.
2. Open `https://uicolors.app/generate/2563eb` (your hex, no `#`). The tool
   **preserves your exact hex as one of the steps**, slotted at the
   lightness-appropriate position (a mid-lightness hex like `#2563EB` lands
   around 500–600) — so the brand color survives verbatim, verified behavior
   per the API docs' example.
3. Sanity-check on previews: **Components** and **Dashboard** tabs for UI use,
   **Website** for marketing surfaces. If the 100–300 range looks gray-washed
   or the 700–900 range shifts hue badly, nudge the input hex, don't hand-fix
   eleven values.
4. Copy the scale (click-to-copy per shade, or the export/copy affordance —
   whatever format it offers, hex is what goes in the config) and paste into
   `tailwind.config.ts` under `theme.extend.colors` as a named scale.
5. **Assign roles, then prune** — decide which steps carry text, surfaces,
   borders, hovers in light AND dark mode (tables in
   `references/integration.md`), contrast-check the actual pairs, and ship only
   the steps with jobs.

## The 11-vs-3 anti-pattern

Generating 11 steps is free; **shipping 11 steps as API surface is not**.
Tailwind's JIT means unused config colors cost zero CSS bytes — the cost is
design entropy: eleven available steps invite eleven slightly-different blues
across the codebase. This repo's own config is the counter-example: `cobalt`
ships exactly two steps (`DEFAULT`, `deep`) because the Datasheet direction
uses exactly two. Match that discipline — either commit only the steps with
assigned roles, or commit the full scale with the used steps documented and
treat additions as design decisions, not grab-bag picks.

## Contrast is not optional

Every text/background pair that ships gets checked — WCAG AA: **4.5:1 body
text, 3:1 large text (≥24px, or ≥18.66px bold) and UI components/borders**.
Rules of thumb that the reference quantifies: 500 is usually the *brand* step
but usually **fails** as body-text-on-white; 600–700 is where white-text
buttons and links-on-white live; dark mode flips the scale — 300–400 for
links/actions on 900–950 surfaces. A dependency-free check script is in
`references/integration.md`.

## When not to use

- **No brand hex exists yet** — palette selection is **ui-ux-pro-max** /
  direction-skill territory (see Workflow step 1).
- **Status colors** (success/warning/error): stock Tailwind `green`/`amber`/`red`
  scales are already well-tuned; generate custom status scales only when brand
  guidelines demand it (that's also a uicolors Pro feature in-tool).
- **Neutral/gray ramp**: start from stock `zinc`/`gray`/`stone` (or the site's
  neutral generator under Pro); a brand-tinted neutral is a deliberate choice,
  not a default.
- **Data-visualization palettes**: categorical/sequential chart color needs
  perceptual spacing across *hues*, not one hue's lightness ramp — a single
  brand scale makes unreadable charts (see the **dataviz** skill).
- **shadcn/ui theming**: scales feed it, but token mapping is the **shadcn**
  skill's job.

## Anti-patterns

- Shipping 11 steps when the design uses 3 (above).
- Hand-editing individual generated steps — regenerate from a nudged input
  hex instead, or the ramp's lightness curve breaks.
- Using brand-500 for body text on white because "it's the brand color" — check
  it; it almost always fails AA.
- Same step numbers for both themes ("text-brand-600 everywhere") — dark mode
  needs mirrored assignments, not shared ones.
- Pasting scales as one-off hexes in components instead of named config tokens.
