# Integrating a delivered logo (Next.js 14 App Router + Tailwind 3.4)

Assumes a LogoAI Pro/Brand zip (SVG + PNG), but applies to any delivered logo.

## Step 0 — Triage and clean the delivery

1. Inventory the zip. You want: full-color SVG, single-color SVG, mark-only
   SVG. If the single-color or mark-only variant is missing, the LogoAI editor
   can usually re-export recolored/cropped variants at no extra cost — ask the
   human before working around it.
2. Run SVGO on every SVG (the **haikei** skill's `references/integration.md`
   has the exact v3+ config: `preset-default` + `removeDimensions`, which
   strips fixed `width`/`height` and keeps `viewBox`). Generated logos often
   embed editor metadata and text outlined into verbose paths.
3. Check for embedded `<text>` elements. If the wordmark is live text, the SVG
   depends on a font the browser won't have — it must be converted to outlines
   (re-export, or Inkscape "object to path") before shipping.
4. Canonical location: `public/brand/` for files, one inline component for the
   header (below).

## Favicons and app icons (App Router file conventions)

Next.js 14 turns files in `app/` into icon routes and `<head>` tags automatically:

| File | Purpose | Notes |
|---|---|---|
| `app/icon.svg` | Modern favicon | The cleaned **mark-only** SVG. Scales everywhere |
| `app/favicon.ico` | Legacy fallback | 32×32 (or multi-size) ICO from the mark |
| `app/apple-icon.png` | iOS home screen | 180×180 PNG, solid background — iOS ignores transparency (renders it black) |

Generate the rasters from the SVG deterministically with `sharp` (verified:
0.35.3):

```bash
node -e "const s=require('sharp');s('public/brand/mark.svg').resize(180,180,{fit:'contain',background:'#FBFCFD'}).png().toFile('app/apple-icon.png')"
```

Dark-mode favicon: `app/icon.svg` may embed a media query — this is the one
place `prefers-color-scheme` is correct even in a class-strategy repo, because
the browser chrome (tab bar) follows the OS, not the site toggle:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>path{fill:#16409F}@media(prefers-color-scheme:dark){path{fill:#FBFCFD}}</style>
  <path d="…mark…"/>
</svg>
```

## Header logo — inline, currentColor

Use the **single-color** variant, fills replaced with `currentColor`:

```tsx
// components/brand/logo.tsx
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 64" aria-hidden="true" focusable="false" className={className}>
      <path d="…" fill="currentColor" />
    </svg>
  );
}
```

```tsx
// in the nav — accessible name on the link, not the svg
<Link href="/" aria-label="Acme — home" className="text-ink transition-colors hover:text-cobalt">
  <Logo className="h-7 w-auto" />
</Link>
```

`text-ink` in this repo resolves through CSS channel variables
(tailwind.config.ts), so the logo re-themes wherever those variables change —
`currentColor` rides along for free.

## Dark-mode variants (multi-color marks)

The repo sets `darkMode: "class"`. `<picture media="(prefers-color-scheme:…)">`
follows the OS, not the class — wrong tool here (except favicons, above). Use:

```tsx
import Image from "next/image";

<Image src="/brand/logo-full.svg" alt="" width={160} height={32} className="dark:hidden" />
<Image src="/brand/logo-full-dark.svg" alt="" width={160} height={32} className="hidden dark:block" />
```

Both files load; SVGs this size make that cost negligible. Never CSS-`invert`
a multi-color logo.

## OG image

Static is the reliable path: compose `app/opengraph-image.png` at **1200×630**
— mark or lockup at roughly 1/3 of canvas width, centered or golden-ratio
placed, on a brand-colored field with generous margin. Next.js emits the
`og:image` tags automatically from the file's presence.

Dynamic (`app/opengraph-image.tsx` + `ImageResponse` from `next/og`) is worth
it only for per-page titles; note it renders JSX to PNG and cannot reference an
SVG file directly — inline the mark's paths as JSX or embed a PNG via absolute
URL.

## Clearspace and placement

Encode the exclusion zone as a wrapper, not a habit:

```tsx
// clearspace = 25% of logo height on all sides
<div className="inline-block p-2">      {/* h-7 logo → ~8px zone */}
  <Logo className="h-7 w-auto" />
</div>
```

Responsive lockup-vs-mark swapping and scaling-floor rules are documented in
the **logosystem** skill's `references/implementation.md` — same system, any
logo source.

## Pre-ship checklist

- [ ] SVGO-cleaned, no fixed dimensions, no live `<text>`
- [ ] `app/icon.svg` (mark), `app/favicon.ico`, `app/apple-icon.png` (opaque bg)
- [ ] Header logo inline, `currentColor`, accessible name on the link
- [ ] Dark variant strategy chosen (currentColor vs `dark:` swap) and tested with the actual toggle
- [ ] `app/opengraph-image.png` 1200×630, verified in a link-preview debugger
- [ ] Trademark search done — before launch, not after
