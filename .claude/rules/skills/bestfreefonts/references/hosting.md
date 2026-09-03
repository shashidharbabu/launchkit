# Font hosting in this repo (Next.js 14 + Tailwind 3.4)

The repo's live pattern: `app/layout.tsx` loads fonts with CSS-variable
bindings; `tailwind.config.ts` `fontFamily` reads the variables. Fonts change
in exactly one file.

## Path A — font is on Google Fonts: next/font/google

Already in use in `app/layout.tsx` (IBM Plex Sans/Mono, Bricolage Grotesque).
To swap the body face to, say, Figtree:

```tsx
// app/layout.tsx
import { Figtree } from "next/font/google";

const sans = Figtree({
  subsets: ["latin"],          // build-time subsetting
  variable: "--font-sans",
  display: "swap",
  // Variable font: omit `weight` to get the full axis range.
  // Static-only families must enumerate: weight: ["400", "500", "600"]
});
```

`<html className={`${sans.variable} …`}>` stays as-is; Tailwind's
`fontFamily.sans` already reads `var(--font-sans)`. Done — no config change,
no files to manage, no runtime Google request (next/font downloads at build
and serves from your origin).

Variable-axis note: non-default axes must be requested explicitly, as the repo
already does for Bricolage Grotesque (`axes: ["opsz", "wdth"]`).

## Path B — not on Google Fonts: next/font/local

1. Download from the font's official source (the bestfreefonts "Get the font"
   link). Prefer the variable file if one exists.
2. Convert to woff2 if only TTF/OTF ships (see Subsetting below — the subset
   step outputs woff2 anyway).
3. Commit under `app/fonts/` **with the license file**:

```
app/fonts/
  ClarityCity-Variable.woff2
  OFL.txt
```

```tsx
// app/layout.tsx
import localFont from "next/font/local";

const sans = localFont({
  src: "./fonts/ClarityCity-Variable.woff2",
  weight: "100 900",           // the variable weight range
  variable: "--font-sans",
  display: "swap",
  // adjustFontFallback defaults to "Arial" metrics for sans faces —
  // leave it on; it's the CLS fix. ("Times New Roman" for serifs.)
});
```

Multiple static files, one family:

```tsx
const sans = localFont({
  src: [
    { path: "./fonts/ClarityCity-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ClarityCity-Medium.woff2",  weight: "500", style: "normal" },
    { path: "./fonts/ClarityCity-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
```

Load **only** the weights the design uses.

## Adding a new role (not swapping)

One variable + one Tailwind entry, mirroring the existing four:

```tsx
// layout.tsx: variable: "--font-serif", add serif.variable to <html> className
```

```ts
// tailwind.config.ts → theme.extend.fontFamily
serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
```

Then `font-serif` works everywhere. Fallback stack rule: variable reference
first, then `ui-*` generic, then a metric-similar system face, then the CSS
generic — matching the repo's existing entries.

## Subsetting (self-hosted files)

`next/font/google` subsets for you; `next/font/local` serves what you give it.
Latin-only subsetting typically cuts 60–80% of a multi-script font.

fonttools (Python) is the canonical tool:

```bash
pip install fonttools brotli
pyftsubset ClarityCity-Variable.ttf \
  --flavor=woff2 \
  --layout-features='*' \
  --unicodes="U+0000-00FF,U+2010-2027,U+2030-205E,U+20AC,U+2212" \
  --output-file=app/fonts/ClarityCity-Variable.woff2
```

npm alternative: `glyphhanger` (verified: 6.0.0) wraps pyftsubset and can crawl
pages to compute the exact used character set — note it still requires Python
fonttools installed underneath.

**OFL compliance**: a subset is a Modified Version. If the font declares a
Reserved Font Name, strip/rename the family name in the subset's metadata
(`pyftsubset` keeps names by default — check with `fonttools ttx -t name`).
Keep OFL.txt beside the file regardless.

## CLS and fallback tuning

- next/font (both paths) injects a metric-adjusted fallback automatically
  (`adjustFontFallback`) — swap happens with near-zero layout shift. Prefer
  this over manual tuning.
- Only for hand-written `@font-face` (rare — e.g. a font loaded in a CSS-only
  context): tune the fallback yourself:

```css
@font-face {
  font-family: "ClarityCity-fallback";
  src: local("Arial");
  size-adjust: 98%;        /* match x-height/advance widths to the web font */
  ascent-override: 92%;
  descent-override: 24%;
}
```

Measure the overrides with a tool (e.g. Malte Ubl's fallback-font calculators)
rather than guessing; then `font-family: ClarityCity, ClarityCity-fallback, sans-serif`.

## Verification checklist

- [ ] License read at bestfreefonts **and** at the source; license file committed
- [ ] woff2 only on the wire; variable file used when available
- [ ] Only used weights/axes loaded
- [ ] `display: "swap"` + adjustFontFallback in effect (default — don't disable)
- [ ] Headings/body render during font load without visible reflow (throttle network to check)
- [ ] `--font-*` variable + Tailwind `fontFamily` wired; no hardcoded family names in components
