# Wiring a UI Colors scale into Tailwind (this repo's conventions)

## 1. Paste into tailwind.config.ts

Named scale under `theme.extend.colors`, hex values straight from the tool.
Example for brand hex `#2563EB` (which uicolors keeps verbatim in the scale):

```ts
// tailwind.config.ts → theme.extend.colors
brand: {
  50:  "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",   // ← the input hex, preserved
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
  950: "#172554",
},
```

(Values above are illustrative — `#2563EB` *is* Tailwind `blue-600`, so its
generated scale tracks stock blue closely. Always paste what the tool outputs
for your hex, not stock Tailwind.)

Give the scale a semantic name (`brand`, or the color's actual name like this
repo's `cobalt`) — never `blue2`. If the design consumes only a few steps,
prefer the repo's `cobalt` pattern:

```ts
cobalt: { DEFAULT: "#1C4FD8", deep: "#16409F" },   // two steps, two jobs
```

`DEFAULT` enables bare `bg-brand` / `text-brand`; named steps (`deep`, or
numbered) are deliberate additions.

## 2. Role assignment — which step does what

Light mode (white/near-white page):

| Role | Step | Contrast requirement |
|---|---|---|
| Tinted section/page background | 50 | n/a (decorative) |
| Selected/hover surface, badges bg | 100 | n/a |
| Borders, dividers on white | 200–300 | 3:1 vs white if load-bearing |
| Icons/decoration | 400–500 | 3:1 if meaningful |
| Links, buttons bg (white text), body-text accent | **600–700** | 4.5:1 |
| Hover/active of the above | 700–800 | keep 4.5:1 |
| Headings-on-tint, high-emphasis text | 800–900 | 4.5:1 vs its bg |

Dark mode mirrors, it doesn't reuse:

| Role | Step |
|---|---|
| Page background | 950 (or a neutral 950 with brand only as accent) |
| Raised surfaces/cards | 900 |
| Borders on dark | 800 |
| Links/actions, icons | **400** (300 for hover) |
| Body text on brand surfaces | 100–200 |
| Button bg keeping white text | 600 still works on dark pages |

The pattern: light mode puts *high* steps on text and *low* steps on surfaces;
dark mode swaps which end of the scale does which job. Encode with `dark:`
utilities (`text-brand-700 dark:text-brand-300`) or channel-variable tokens as
this repo's `paper`/`ink`/`rule` do in globals.css — variables scale better
once more than a couple of pairs flip.

## 3. Contrast-check the actual pairs

Dependency-free WCAG checker — run per pair you ship:

```js
// scripts/contrast.mjs — usage: node scripts/contrast.mjs "#2563eb" "#ffffff"
const lum = (hex) => {
  const [r, g, b] = hex.match(/[0-9a-f]{2}/gi).map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const [a, b] = process.argv.slice(2).map(lum);
console.log(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
```

Thresholds: **4.5** body text; **3.0** large text (≥24px / ≥18.66px bold), UI
components, focus rings, meaningful borders. Check at minimum:

- link/button step on page background (both themes)
- white (or 50) text on button steps, default *and* hover
- body text on any tinted (50/100 or 900/950) surface
- border steps against their surface, if the border conveys structure

Typical results worth internalizing: mid-500s on white hover around 3.5–4:1 —
fine for large text, **failing for body**; that's why the tables put links at
600–700. On 950 surfaces, 400 passes comfortably while 600 often drops under
4.5 — hence the flip.

## 4. Pruning discipline

JIT means unused config steps cost no CSS — the risk is *usage sprawl*, not
bytes. Pick one:

- **Minimal commit**: only role-assigned steps in the config (the `cobalt`
  pattern). Adding a step later is a visible, reviewable diff.
- **Full scale + documented roles**: keep 50–950 but comment the assigned
  roles inline; treat novel step usage in components as a review flag.

Either is defensible; eleven undocumented steps is not.

## 5. Regenerating

Scale not working (muddy mids, hue drift in the 800s)? Nudge the *input* hex at
`uicolors.app/generate/<hex>` and re-export the whole scale. Hand-tuning one
step breaks the ramp's monotonic lightness — the property the role tables
depend on.
