---
name: logoai
description: Generate a logo with LogoAI (logoai.com) — a freemium AI logo-and-brand-kit SaaS where designing is free in the browser but every download is a one-time paid package ($29 Basic / $59 Pro / $99 Brand as of Aug 2026) — then wire the delivered files into Next.js 14 + Tailwind 3.4: app/icon.svg favicons and app icons, inline currentColor header logo, dark-mode variants, OG images, clearspace as CSS. Use this whenever a task involves logoai.com, generating a logo with AI, "make me a logo", "we need a logo fast", a cheap logo for an MVP/side project, choosing a LogoAI package or export format, questions about who owns an AI-generated logo, or when a purchased LogoAI zip has arrived and needs integrating — favicon conventions, SVG cleanup, theming, and OG images are in references/integration.md. Also the licensing reality check before any commercial launch ships an AI-generated mark.
---

# LogoAI

LogoAI (logoai.com) is a **paid browser SaaS**, not a library or API. An AI
engine generates logo candidates from a name + industry + style preferences;
editing is free, but **every download costs money** — one-time packages, no
subscription. There is no public generation API, no npm package. A human does
the browser session and the checkout; this skill owns what to tell them and
everything after the zip arrives.

## Pricing and packages (verified Aug 2026 — recheck logoai.com/pricing; the chart is JS-rendered)

| Package | Price | You get | Enough for |
|---|---|---|---|
| Basic | $29 | Low-res 800×600 logo, transparent PNG, one vector file | Website/social only — barely |
| Pro | $59 | High-res files, **SVG + EPS vectors**, transparent backgrounds | Web + print. **Minimum for real integration work** |
| Brand | $99 | Pro formats + logo animation + brand kit: business cards, social templates, email signatures, Word/PPT, brand center | Full identity in a hurry |

Extras: repeat-purchase code `LOGOPRO` (40–60% off 2nd+ logos); "Designer
Manual Fix" +$40 for up to 3 human revisions. Generating and previewing costs
nothing — pay only when a candidate is chosen.

**Always steer the purchase to Pro or Brand.** Web integration without an SVG
means shipping raster logos, and every step of `references/integration.md`
assumes vector input.

## Licensing — read before any commercial launch

Blunt summary of LogoAI's terms (logoai.com/term) plus US copyright reality:

- **You buy a license, not the copyright.** The terms state no trademark,
  copyright, or service marks are conveyed. No use at all until payment.
- **No uniqueness guarantee.** LogoAI performs no trademark/copyright search
  and disclaims any duty to. Template-driven AI output can resemble other
  customers' logos or existing marks. **Run your own trademark search**
  (USPTO TESS or counsel) before the mark fronts a commercial product.
- **Purely AI-generated art is likely not copyrightable at all** under current
  US Copyright Office guidance (human authorship requirement) — so nobody may
  hold enforceable copyright in the mark. Real protection for a logo is
  **trademark registration through use in commerce**, which you can pursue
  regardless of copyright status.
- Ownership of a purchased logo can be transferred between LogoAI accounts
  (relevant when generating on a client's behalf).

Acceptable risk for an MVP or internal tool; a funded company should treat a
LogoAI mark as a placeholder and budget for a designed identity.

## Selection — the human's browser trip

1. Before generating, extract a direction: 3–5 references via the
   **logosystem** skill, distilled into style/mood/type vocabulary (monoline,
   geometric, wordmark-only…). Feeding LogoAI a real brief beats roulette.
2. Send the human to `https://www.logoai.com/logo-maker` with: exact brand
   name and tagline spelling, industry, 2–3 style keywords, and brand hex
   codes if they exist (pairs with the **uicolors** skill's scale).
3. Tell them what to buy: **Pro minimum**; Brand only if the kit will be used.
   Request/keep: full-color SVG, **single-color SVG** (the dark-mode workhorse),
   mark-only SVG if the design is a lockup.
4. **Stop and wait.** Do not scaffold imports for files that don't exist.
   Expected on receipt: a zip with SVG/EPS/PNG; put sources in `public/brand/`.

## Integration — after the zip arrives

Full code in `references/integration.md`. The non-negotiables:

- **Clean the SVG first**: SVGO, strip fixed width/height, keep viewBox — same
  discipline as the **haikei** skill documents; generated SVGs often carry
  editor cruft and outlined-text bloat.
- **Favicons/app icons via Next.js file conventions**: `app/icon.svg`,
  `app/favicon.ico`, `app/apple-icon.png` — derived from the mark, never the
  full lockup.
- **Header logo inline with `currentColor`** (single-color variant) so one
  asset themes with `text-*` utilities; multi-color needs explicit `dark:` swaps
  (this repo is `darkMode: "class"` — media-query tricks won't follow the toggle).
- **OG image**: static `app/opengraph-image.png` (1200×630) composed from the
  logo with generous margin.
- **Clearspace as CSS padding**, and lockup-vs-mark responsive swapping —
  patterns shared with the **logosystem** skill's `references/implementation.md`.

## When not to use

- **Funded/brand-led company**: commission a designer; AI logos are template-adjacent.
- **You only need placeholder identity for a demo**: a set-in-type wordmark
  (repo fonts, see **bestfreefonts**) is free and often classier.
- **You need inspiration, not generation** — **logosystem**.
- **The "logo" is really an illustration or 3D hero** — **spline** / **haikei** territory.

## Anti-patterns

- Shipping the Basic package's raster into a codebase (blurry header, no theming).
- Skipping the trademark search because "the AI made it" — it can still infringe.
- Putting the full lockup in a favicon (illegible at 16–48px).
- Recoloring a multi-color mark with CSS filters for dark mode.
- Claiming files exist before the human confirms the purchase and download.
