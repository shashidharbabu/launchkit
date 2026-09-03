---
name: pafolios
description: Mine Pafolios (pafolios.com), a free gallery of designer portfolio examples and annotated product-design case studies, for process narrative and presentation structure — how designers frame problem, process, before/after, and outcome — and translate that narrative anatomy into showcase, specimen, and case-study pages built with Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`). Use this whenever building or improving a portfolio site, case-study page, project showcase, specimen page, "our work" section, or design-process writeup; whenever someone asks "how should I present this project", "structure my case study", "make the showcase tell a story", or "find portfolio inspiration"; and whenever a pafolios.com link appears in conversation or a Design Lab specimen page needs a narrative spine rather than just aesthetics.
---

# Pafolios

Pafolios (pafolios.com) is a **free, no-login gallery of designer portfolio
examples**, run on a "Portfolio of the Day" model. Per-designer coverage is
thin by design: one screenshot, the designer's role, a date, and a "Visit
site" link — the real portfolio is always one click away. The homepage is
**JS-rendered** (a fetch sees only "Loading portfolios..."), so humans browse
it in a browser; Claude gets in through the side doors below. The site's
hidden gem is `/case-studies`: a small curated set (13 at last check) of
product-design case studies, each **annotated with why it works**.

This skill's angle is deliberately not aesthetics: it mines portfolios for
**process narrative and presentation structure** — how strong designers pace
a story — and applies that to showcase and specimen pages (including this
repo's Design Lab specimens).

1. **Selection** — routes into the site for humans and for Claude.
2. **Translation** — a narrative-anatomy catalog, then page structure.

## Selection

- Humans browse `https://pafolios.com` (grid, JS-rendered) and
  `https://pafolios.com/staff-picks` (curated subset).
- Claude enumerates via `https://pafolios.com/sitemap.xml` — it lists every
  designer page as `https://pafolios.com/<designer-slug>` (e.g.
  `/ilia-lushnikov`); those pages are fetchable and carry the role in the
  page title ("UX & Product Designer Portfolio Inspiration"), the screenshot,
  and the outbound link. Follow the outbound link — **the live portfolio is
  the actual reference**; Pafolios is only the index.
- Case studies: `https://pafolios.com/case-studies` — fully fetchable. Each
  entry names the study, tags it (Product, Behind the scene, Process,
  Redesign, User research, User retention, UX Writing, Web, UI Design), and
  gives a one-line editorial note on why it's good. Examples on the shelf:
  Uber "Perfecting the Pickup", Building SoundCloud, Jason Yuan's Apple Music
  redesign, Ueno's Lonely Planet, the evolution of HEY.
- Pick **one portfolio + one case study**, chosen for the *kind of story* the
  current page must tell (shipped product vs speculative redesign vs
  process retrospective), not for visual style.

## Translation — narrative anatomy

Read the chosen reference end to end and catalog its **story mechanics**:

| Axis | What to record |
|---|---|
| Opening claim | What the first screen asserts (outcome? role? artifact?) and how fast |
| Framing | Problem → constraint → approach order; where context stops and work starts |
| Before/after | Shown side-by-side, sequentially, or withheld for reveal; what's honest about it |
| Evidence pacing | Ratio of artifact to explanation; where process shots (sketches, iterations, dead ends) appear |
| Outcome | Metrics vs qualitative close; whether numbers are load-bearing or decoration |
| Scroll rhythm | Full-bleed moments vs dense text blocks; how often the page breathes |

Then structure the page as named decisions:

1. **Spine**: hook (one-sentence claim) → context (2–3 lines max) → the work
   in 3–5 beats, each beat = one artifact + one decision explained → outcome
   → next project. Cut anything that is neither artifact nor decision.
2. **Layout grid**: text column narrow (`max-w-prose`) so artifacts going
   full-bleed *means* something; alternate rhythm, don't stripe uniformly.
3. **Type scale**: beat headings one step above body, page title reserved for
   the claim; spacing rhythm gives artifacts double the air of text
   (`py-24` vs `py-12`).
4. **Before/after**: side-by-side grid or a motion v13 (`motion/react`) drag/clip
   comparison — never auto-playing toggles; the reader controls revelation.
5. **Motion choreography**: `whileInView` reveals per beat (0.5s, ease-out,
   small `y`), triggered once, `useReducedMotion` respected. Narrative pages
   earn scroll-linked motion less often than you think.

Hand off: **taste-skill** for the anti-slop page build, **frontend-design**
for aesthetic direction, **ui-ux-pro-max** for palette/type,
**motion-primitives** for the reveal components, **supahero** if the
portfolio needs a hero.

## When not to use

- **The page lists, it doesn't narrate.** Team grids, contact pages, plain
  galleries — no story spine needed.
- **You need visual direction, not structure.** Mood → **cosmos**; currency
  → **recent-design**; hero anatomy → **supahero**.
- **There is no real process to show.** A narrative skeleton wrapped around
  no artifacts reads as padding. Ship a simple gallery instead.

## Anti-patterns

- **Copying pixels instead of extracting patterns.** Reproducing a
  designer's portfolio layout — someone's professional identity — is the
  worst possible theft. Extract the story mechanics; design the surface
  yourself.
- **Mixing three references into incoherence.** Three narrative structures
  braided together tell no story. One spine per page.
- **Judging from the Pafolios screenshot.** One JPEG can't show pacing;
  always read the live portfolio before cataloging.
- **Fake metrics.** Case-study framing tempts invented "+34% conversion"
  numbers. Real numbers or a qualitative close — never decorative ones.
- **Process theater.** Sketches and iteration shots included as aesthetic
  props, unconnected to any decision, are noise wearing a lanyard.
