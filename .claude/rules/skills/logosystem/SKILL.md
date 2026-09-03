---
name: logosystem
description: Mine Logosystem (logosystem.co) — a free curated gallery of 1,300+ real logo systems (wordmarks, symbols, and animated logos by studios like Pentagram, Porto Rocha, DNCO, Accept and Proceed), filterable by type, industry, style, shape, color, and mood — for logo direction, then implement any logo systematically in Next.js 14 + Tailwind 3.4: lockup variants, clearspace as CSS, responsive mark/lockup swapping, currentColor theming, dark-mode variants, favicon derivation. Use this whenever a task involves logo inspiration or references, briefing a logo direction ("what should our logo look like", "find logo references", "symbol or wordmark?"), studying how real brands structure marks and lockups, a logosystem.co link appearing in conversation, or building a brand-identity moodboard. Also use it whenever an existing logo asset from ANY source needs systematic implementation — responsive lockups, clearspace, scaling rules — via references/implementation.md.
---

# Logosystem

Logosystem (logosystem.co) is a **free, browser-based inspiration gallery**, not
a design tool. It curates 1,300+ real logo systems — wordmarks, symbols, and
animated logos — aggregated from designers' public posts (each entry links back
to the original on X/Dribbble/etc.), tagged by studio: Pentagram, Porto Rocha,
DNCO, Locomotive, Accept and Proceed, and hundreds of independents. There is no
API, no asset downloads, no npm package. Saving to collections/moodboards needs
an account; browsing doesn't.

## Name resolution

"Logosystem" is ambiguous. This skill resolves it to **logosystem.co** (an
actual product at exactly that name). It could also have meant: (a) the generic
logo-grid design methodology (base/construction/lockup/clearspace grids —
covered in this skill's implementation reference), or (b) various Figma
logo-asset plugins, none actually named LogoSystem. If someone means those,
the implementation reference here still applies.

## The hard rule

Every logo in the gallery is **someone's real trademark and someone's real
work**. It is reference material only. Never copy, trace, recolor, or "adapt
closely". Extract *structural* lessons — how a lockup is spaced, how a mark
simplifies at small sizes, what a monoline style does for a fintech — never
the shapes themselves. A launch page shipping a lookalike of a gallery logo is
a trademark dispute, not an homage.

## Selection — using the gallery

1. **Browse with facets**, don't scroll blind. Filters are URL-addressable:
   - Type: `logosystem.co/?type=Symbol%20%26%20Text` (also Wordmark, Symbol, Animated)
   - Industry: `/?industries=Fashion` — Style: `/?styles=Monoline` (Bold, Rounded, Outline…)
   - Color: `/?colors=Black` — Mood: `/?moods=Playful` — Designer: `/?q=Pentagram`
2. **Hand the human 2–3 pre-filtered URLs** matching the brief (e.g. a dev-tool
   brand: `/?styles=Monoline&moods=Bold` plus `/?type=Wordmark`) and ask them to
   pick 3–5 references. Detail pages live at `logosystem.co/logo/<slug>`.
3. **Translate picks into a brief using the gallery's own facet vocabulary** —
   type, style, shape, mood — plus named structural observations ("mark holds up
   at 16px", "wordmark-only, no symbol", "animated variant exists"). That brief
   feeds a human designer, or the **logoai** skill if generating.
4. For animated logo references, note *what* animates (draw-on, morph, reveal);
   implementation goes through the **jitter** skill (Lottie) or **motion-primitives**.

## Integration — systematic logo implementation

Once a logo exists (from a designer, or via the **logoai** skill), the gallery's
lesson is that good logos ship as *systems*, not files. Implement all of this —
concrete Next.js/Tailwind code in `references/implementation.md`:

- **Lockup variants**: full lockup (mark + wordmark) in headers/footers at wide
  widths, mark-only below `md:` and in constrained slots (favicon, avatar, mobile nav).
- **Clearspace as CSS**: encode the exclusion zone as padding tied to mark
  height, so no one places UI inside it by accident.
- **currentColor theming**: single-color marks inherit text color — one asset
  serves light and dark. Multi-color marks need explicit `dark:` variant swaps
  (this repo uses `darkMode: "class"`, so `<picture media>` tricks won't follow the toggle).
- **Scaling floor**: define the minimum rendered size at which the mark stays
  legible; below it, swap to a simplified mark or drop the wordmark.
- **Favicon derives from the mark**, never the lockup (Next.js `app/icon.svg`
  conventions — details in the logoai skill's integration reference).

## When not to use

- **You need an actual logo file** — this site produces nothing. Generate via
  the **logoai** skill or commission a designer.
- **Hero/layout inspiration, not logos** — that's **supahero** (heroes),
  **cosmos** (moodboards), or **recent-design** (trend freshness).
- **Overall visual direction for a page** — **frontend-design** / **taste-skill**.
- **The brand already has a logo and guidelines** — implement the guidelines;
  don't relitigate the mark against a gallery.

## Anti-patterns

- Copying or closely adapting a gallery logo (trademark + copyright exposure).
- Sending the human to the unfiltered firehose instead of pre-filtered facet URLs.
- Collecting 30 references with no extracted brief — inspiration without
  decisions is procrastination.
- Shipping one logo file with no size/clearspace/dark-mode rules, then watching
  every page crop it differently.
- Treating "we saw it on Logosystem" as evidence a style fits *this* brand —
  facets describe the reference, the brief must argue the fit.
