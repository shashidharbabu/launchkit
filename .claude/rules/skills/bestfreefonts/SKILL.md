---
name: bestfreefonts
description: Source genuinely free fonts via Best Free Fonts (bestfreefonts.com) — a free curated directory of ~214 quality free typefaces (serif, sans, script, mono, display; many variable) where each font page shows styles, glyph counts, language support, designer, and the actual license, then links to the official download source — and integrate them into Next.js 14 + Tailwind 3.4: next/font/local self-hosting with woff2, next/font/google when the font is also on Google Fonts, variable fonts, subsetting, CLS-safe fallbacks, and this repo's --font-sans CSS-variable + fontFamily pattern. Use this whenever a task involves finding a free font, replacing or adding a typeface, "what font should we use (for free)", verifying whether a font is safe for a commercial site, self-hosting a font, woff2/subsetting/fallback work, a bestfreefonts.com link, or wiring any font into app/layout.tsx and tailwind.config.ts — hosting code lives in references/hosting.md. License verification before commercial use is this skill's non-negotiable.
---

# Best Free Fonts

Best Free Fonts (bestfreefonts.com) is a **free curated directory**, not a
host, foundry, or API. It catalogs ~214 free fonts (serif, sans serif, script,
mono, display — many variable). Each font page (`bestfreefonts.com/<font-slug>`)
lists style count, variable status, glyph count, language support, designer,
copyright, and **the license** (e.g. SIL Open Font License), then a "Get the
font" link to the *official source* — usually a GitHub repo or foundry page.
Downloads happen at the source, not on the site. No accounts, no npm package.

Its value over the raw internet: curation quality (real typefaces like Figtree,
Bricolage Grotesque, Clarity City, Host Grotesk — not 10,000-font dumps) and
license transparency per font.

## License verification — the non-negotiable

Commercial launch pages die on font licensing. **Verify twice, every time**:
once on the bestfreefonts font page, once at the "Get the font" source (the
LICENSE/OFL.txt in the repo or the foundry's terms). Directories can mislabel;
licenses change between versions.

- **SIL OFL** (most fonts here): commercial use, web embedding, self-hosting,
  and subsetting all allowed. You may not sell the font files themselves.
  Subsetting creates a "Modified Version" — if the license declares a
  **Reserved Font Name**, strip the original name from subset files' metadata.
  Commit the OFL.txt next to the woff2.
- **MIT/Apache-licensed fonts** (some, e.g. corporate design-system releases):
  fine commercially; keep the license file.
- **"Free" elsewhere on the internet** frequently means *personal-use-only* or
  a *demo cut* (missing weights/glyphs). Either on a commercial page is an
  invoice or C&D waiting to happen. Bestfreefonts curates toward truly-free,
  but the license field is per-font — read it, never assume.
- If the license can't be confirmed at the source, **the font does not ship.**

## Discovery workflow

1. Decide the *role* first (display voice, body text, mono/data). If the real
   question is "which two fonts pair well", reach for **ui-ux-pro-max** (74
   font pairings database) to choose the pairing — then come back here to
   source and verify the files. This skill owns sourcing, licensing, hosting.
2. Browse by style: `bestfreefonts.com/styles/sans-serif` (also serif, display,
   script, monospace). Prefer **variable** fonts — one file, all weights.
3. Shortlist 2–3, hand the human the font-page URLs to eyeball the specimens.
4. Check the font page: language support covers your content? Glyph count sane?
   License verified (above)?
5. Follow "Get the font" to the official source for the actual files.

## Integration — decision rule first

**Is the font also on Google Fonts?** Many of the directory's fonts are
(Figtree, Gabarito, Bricolage Grotesque, Familjen Grotesk, Murecho, Petrona…).

- **Yes → `next/font/google`.** It self-hosts at build time (no runtime Google
  request, GDPR-clean), subsets via `subsets: ["latin"]`, and generates a
  size-adjusted fallback automatically. Zero file management. This repo already
  does exactly this in `app/layout.tsx` (IBM Plex + Bricolage Grotesque).
- **No (e.g. Clarity City, Frick, Alpha Lyrae) → `next/font/local`.** Download
  woff2 (convert from TTF/OTF if needed), commit under `app/fonts/` with the
  license file, load with `localFont`.

Either way the wiring is this repo's existing pattern — full code in
`references/hosting.md`:

1. Load in `app/layout.tsx` with `variable: "--font-sans"` (or `--font-mono`,
   `--font-display`, `--font-lab`), apply `.variable` classes on `<html>`.
2. `tailwind.config.ts` `fontFamily` already reads
   `["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]` — swapping
   the loaded font requires **no Tailwind change**; adding a new role means one
   new variable + one `fontFamily` entry.
3. CLS safety: `display: "swap"` + next/font's automatic `adjustFontFallback`
   metrics; manual `@font-face` needs hand-tuned `size-adjust` (reference has it).
4. Subset self-hosted files (latin-only typically cuts 60–80%); load only the
   weights/axes actually used.

## When not to use

- **Choosing a pairing or a typographic direction** — **ui-ux-pro-max** (data),
  **frontend-design** / **taste-skill** (judgment). This skill starts once a
  candidate font needs sourcing, vetting, and shipping.
- **Brand ships a purchased font** (Söhne, GT America…): the foundry's license
  and files govern; verify *pageview/domain limits* instead — different game.
- **Icons**: not a font problem — use SVG icon sets (see **ui-ux-pro-max**).

## Anti-patterns

- Shipping a font whose license you inferred rather than read. Not once.
- `@import`/`<link>` from fonts.googleapis.com in a Next.js app — render-blocking,
  a third-party request with GDPR exposure, and strictly worse than `next/font/google`.
- Self-hosting 18 static weights when a variable file exists (one woff2 replaces them).
- Loading weights "to have them" — every weight is bytes before first paint.
- TTF/OTF on the wire — always woff2.
- Deleting the license file from the repo "to keep it clean" — it's your proof.
