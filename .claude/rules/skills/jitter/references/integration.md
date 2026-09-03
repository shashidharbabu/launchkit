# Jitter export integration

Everything after the designer hands over the file. Stack: Next.js 14 App
Router, Tailwind 3.4, motion v13 (`motion/react`), TypeScript.

## Player choice (verified on npm, Aug 2026)

| | `lottie-react` 2.4.1 | `@lottiefiles/dotlottie-react` 0.19.14 |
|---|---|---|
| License | MIT | MIT |
| Peer deps | react + react-dom ^16.8–^19 | react ^17–^19 |
| Renderer | lottie-web 5.13.0 (SVG/canvas/HTML) | dotlottie-web (WASM + canvas) |
| Wire cost (measured) | lottie.min.js 306KB raw / **77KB gz**; lottie_light (SVG-only) 168KB raw / **47KB gz** | JS ~156KB raw; WASM binary fetched at runtime (self-host it — see below) |
| File format | `.json` (what Jitter exports) | `.lottie` (zipped) and `.json` |
| DOM output | SVG nodes (styleable, themeable) | `<canvas>` (opaque, cheaper for many instances) |

**Default: `lottie-react` for Jitter exports.** Jitter emits plain `.json`,
SVG rendering keeps vectors crisp and lets you theme via CSS, and the API is a
thin idiomatic wrapper. Choose `dotlottie-react` when a page plays several
animations at once (canvas avoids SVG DOM bloat) or assets arrive as `.lottie`.
`@lottiefiles/react-lottie-player` 3.6.0 exists but is 3MB unpacked and
effectively legacy — do not add it.

`npm i lottie-react` also pulls `lottie-web` (25MB unpacked on disk; only the
player build ships to the browser). To get the 47KB light build, alias it:

```ts
// next.config.mjs
webpack: (config) => {
  config.resolve.alias['lottie-web'] = 'lottie-web/build/player/lottie_light';
  return config;
},
```

Light build = SVG renderer only, no expressions. Jitter exports don't use
expressions, so this is safe and saves ~30KB gz.

## Baseline component

Client-only, lazy, reduced-motion aware, decorative by default:

```tsx
// components/lottie-player.tsx
'use client';
import { useReducedMotion } from "motion/react";
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import heroLogo from '@/public/lottie/hero-logo.json'; // static import = code-split chunk

export function HeroLogoAnimation({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <img src="/lottie/hero-logo-poster.svg" alt="" aria-hidden="true"
           className={className} />
    );
  }
  return (
    <div className={className} aria-hidden="true">
      <Lottie animationData={heroLogo} loop autoplay />
    </div>
  );
}
```

Notes:

- `dynamic(..., { ssr: false })` is mandatory — lottie-web touches `document`.
- The poster: export a still SVG/PNG of frame 0 from Jitter alongside the
  animation. Every animation needs one for the reduced-motion path anyway.
- `aria-hidden` because it's decorative. If the animation carries meaning,
  drop `aria-hidden` and add adjacent visible text instead — never rely on the
  animation alone.
- Wrap in `pointer-events-none` when layered over/under clickable content.

## Lazy loading below the fold

Don't mount the player (or even parse the JSON) until visible. framer-motion's
`useInView` is already available:

```tsx
'use client';
import { useInView } from "motion/react";
import { useRef } from 'react';

export function DeferredLottie(props: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '200px' });
  return <div ref={ref} className={props.className}>{inView && <LottieFromUrl {...props} />}</div>;
}
```

For URL loading, fetch the JSON in an effect and pass `animationData`; keep
files in `public/lottie/` so they're cached and CDN-served, not bundled.
Bundling via static import is fine for one small (<50KB) above-the-fold asset;
everything else loads by URL.

## MP4 / WebM exports

Background or demo video from Jitter (Pro+ for 1080p, no watermark):

```tsx
<video
  className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
  autoPlay muted loop playsInline preload="none"
  poster="/video/hero-poster.jpg" aria-hidden="true"
>
  <source src="/video/hero.webm" type="video/webm" />
  <source src="/video/hero.mp4" type="video/mp4" />
</video>
<img src="/video/hero-poster.jpg" alt="" aria-hidden="true"
     className="hidden motion-reduce:block absolute inset-0 h-full w-full object-cover" />
```

- `muted` + `playsInline` are what make iOS autoplay work.
- Tailwind's `motion-reduce:` variant handles reduced motion with zero JS.
- Transparent overlay video (Max plan): export WebM (VP9 alpha) **and**
  HEVC-with-alpha `.mov` for Safari; order `<source>` HEVC first for Safari,
  it ignores WebM alpha.
- GIF on a web page is an anti-pattern: 10x the bytes of MP4, no pause
  control. Convert or re-export.

## Dark mode

Lottie colors are baked in (hex values inside the JSON), same problem as
Haikei SVGs. Options, best first:

1. **Design theme-neutral** — brief the designer to animate in a palette that
   works on both surfaces (or on a transparent background using brand colors
   with ≥4.5:1 on both). Cheapest by far.
2. **Two exports** — `hero-logo-light.json` / `hero-logo-dark.json`, swap on
   `resolvedTheme`. Reliable; doubles asset weight (usually trivial).
3. **Scripted recolor** — walk `layers[].shapes[]` and rewrite `c.k` color
   arrays at build time. Brittle across re-exports; last resort.

SVG renderer bonus: lottie-react emits real SVG, so a targeted
`[data-lottie] path { ... }` or CSS filter can nudge colors — acceptable for
monochrome marks only.

## Performance checklist

- Budget: player (~47–77KB gz, once) + JSON per animation. A landing page
  should carry **one** player library, not both.
- JSON >200KB almost always means embedded base64 raster images — Jitter will
  do this if the comp contains bitmaps. Re-export those comps as MP4 instead.
- One `loop`ing Lottie = continuous main-thread rasterization. Pause when
  off-screen (`lottieRef.current?.pause()` on `useInView` exit) and cap
  simultaneous loops at ~2 per viewport.
- `next/font` + Lottie text: Jitter bakes text to paths, so no font loading
  concerns — but that also means no copy edits without re-export.
- Lighthouse: the `<video preload="none" poster>` pattern above keeps hero
  LCP on the poster image; `priority`-load that poster with `next/image` if
  it is the LCP element.

## Anti-patterns

- Shipping a watermarked free-tier export to production.
- `import Lottie from 'lottie-react'` at the top of a Server Component (build
  error) or of the landing route's shared layout (bundle bloat).
- Rebuilding a 3-property fade/slide as a Lottie. That's framer-motion's job.
- Looping animation with no reduced-motion path and no pause affordance
  (WCAG 2.2.2 failure for anything longer than 5s).
- Two Lottie player libraries in one app.
- Claiming the asset exists before the designer confirms the export.
