---
name: supahero
description: Extract hero-section design direction from Supahero (supahero.io), a free curated gallery of website hero-section screenshots — catalog a reference hero's anatomy (headline treatment, background system, CTA placement, nav integration, above-fold economy) and adapt the pattern into a Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`) hero for the current project. Use this whenever a task involves designing or redesigning a hero section, above-the-fold layout, landing page opening, or homepage top; whenever someone shares a supahero.io link or asks "find me hero inspiration", "make the hero more interesting", "what should go above the fold", or "our hero looks generic"; and whenever a hero reference from any source needs to be decomposed into reusable structure rather than copied.
---

# Supahero

Supahero (supahero.io) is a **free, no-login curated gallery of website
hero-section screenshots** (now owned by screensdesign, per the site banner).
It is deliberately thin: a flat, reverse-chronological grid on the homepage;
each entry is one static screenshot, a one-line description of the company, a
date, and a "Visit Website" link. **No categories, no tags, no filters, no
search** were found on the site — selection means scanning the grid with your
eyes. There is no code, no live embed, and screenshots freeze all motion.

So the site contributes exactly one thing: a dense, pre-curated field of hero
references. Everything else — filtering, anatomy analysis, adaptation — is
this skill's job:

1. **Selection** — how to scan the grid and pick 2–3 relevant references.
2. **Translation** — a fixed anatomy catalog to run on each reference, then
   adaptation into the current project's stack.

## Selection

- Browse: `https://www.supahero.io` (the entire library is this one grid).
- Detail pages: `https://www.supahero.io/hero/<slug>` (e.g. `/hero/zed`,
  `/hero/better-stack`) — screenshot + link out. Pages are server-rendered and
  fetchable; screenshots are plain `.webp` images Claude can view directly.
- **The live site is the ground truth.** The screenshot cannot show load
  choreography, scroll behavior, or hover states. Always follow "Visit
  Website" (or send the user there) before cataloging motion.
- Since there are no filters, select by *structural* relevance, not industry:
  a dev-tool hero can be the right reference for a bakery if the structure
  (dense product-shot right, copy left) is what the project needs.
- Pick **2–3 references max**, and pick them for different reasons you can
  name ("A for its nav treatment, B for its background system").

## Translation — the anatomy catalog

Run this catalog on each reference and write the answers down as named
observations. This is the skill's core artifact.

| Axis | What to record |
|---|---|
| Headline treatment | Word count, size relative to viewport, weight/width contrast, one type family or a serif/sans pair, line breaks as meaning |
| Background system | Flat color / gradient / photo / product screenshot / 3D-video / generated pattern — and how copy stays legible over it |
| CTA placement | Primary verb, primary vs secondary visual gap, position relative to headline, whether social proof touches the CTA |
| Nav integration | Transparent overlay vs solid bar vs floating pill; item count; whether the nav CTA duplicates the hero CTA |
| Above-fold economy | Count the elements (eyebrow, headline, subhead, CTAs, proof, visual). Good heroes ship 4–6; note what the reference *omitted* |
| Motion choreography | From the live site only: entrance order, stagger timing, what loops forever vs settles, scroll response |

Then adapt:

1. **Keep the structure, replace every material.** Reuse the skeleton (copy
   left / visual right; centered stack; full-bleed background) with the
   project's own palette, type, and voice. Structure is a pattern; materials
   are identity.
2. **Name the decisions**: layout grid (e.g. 12-col, copy spans 1–6),
   type scale for h1/subhead (e.g. `text-6xl`/`text-xl`, tracking-tight),
   spacing rhythm (vertical stack gaps as one scale, e.g. 4/6/10),
   background recipe, CTA pair, entrance choreography (element order +
   stagger, e.g. 80ms steps, 0.5s, ease-out, `translate-y` 12px).
3. **Implement**: hero as a server component with a small `"use client"`
   motion wrapper; motion v13 (`motion/react`) `variants` + `staggerChildren` for the
   entrance; respect `useReducedMotion`; background per **haikei** if
   generated, plain Tailwind gradient if not. Keep CLS at zero — reserve
   space for the hero visual, never pop it in late.

Hand off: **taste-skill** owns the full landing page around the hero;
**motion-primitives** has ready-made text reveals and entrance components;
**ui-ux-pro-max** supplies concrete palette/font pairings; **frontend-design**
for overall aesthetic direction when the hero is part of a bigger reshape.

## When not to use

- **The page isn't marketing.** Dashboards, editors, and review queues have
  work surfaces, not heroes. Don't graft a hero onto a tool.
- **You need whole-page or non-web inspiration.** Supahero is heroes only —
  broader currency lives in **recent-design**, mood in **cosmos**, narrative
  in **pafolios**.
- **The direction is already fixed.** If the design system dictates the hero,
  build it; a reference trip only invites drift.

## Anti-patterns

- **Copying pixels instead of extracting patterns.** Rebuilding Zed's hero
  with your logo swapped in is plagiarism that also won't fit your product.
  If your adaptation would be recognized side-by-side, you copied.
- **Mixing three references into incoherence.** One reference per axis at
  most. A's nav + B's background + C's typography + D's motion = nobody's
  hero. Two or three references, each mined for one named thing.
- **Cataloging motion from a screenshot.** The screenshot has no motion by
  definition. Visit the live site or leave the motion row blank.
- **Admiring the visual, ignoring the economy.** The most copyable trait of
  a great hero is what it left out. Count elements before you count colors.
- **Inventing gallery features.** Supahero has no tags or search; don't tell
  a user to "filter by SaaS" there.
