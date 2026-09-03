# Systematic logo implementation (Next.js 14 + Tailwind 3.4)

Applies to any logo asset, wherever it came from. The point: ship a *system*
(variants + rules encoded in code), not a lone file.

## 1. One component, explicit variants

Inline SVG for the header logo — it's small, themeable, and avoids a request.
Keep both drawings in one component so variants can't drift apart.

```tsx
// components/brand/logo.tsx
type LogoProps = { variant?: "lockup" | "mark"; className?: string };

export function Logo({ variant = "lockup", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
        <path d="…mark path…" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 64" aria-hidden="true" focusable="false" className={className}>
      <path d="…mark path…" fill="currentColor" />
      <path d="…wordmark paths…" fill="currentColor" />
    </svg>
  );
}
```

Accessibility: the SVG is `aria-hidden`; the accessible name lives on the link.

```tsx
<Link href="/" aria-label="Acme — home" className="text-ink hover:text-cobalt">
  <Logo variant="lockup" className="hidden h-7 w-auto md:block" />
  <Logo variant="mark" className="h-7 w-auto md:hidden" />
</Link>
```

`currentColor` + Tailwind text utilities buys theming and hover states for
free. `h-7 w-auto` (not `w-full`) preserves aspect ratio; the `viewBox` supplies it.

## 2. Clearspace as CSS

Brand guidelines usually define clearspace as a fraction of mark height
(commonly the height of one letterform, ~25–50%). Encode it once:

```tsx
// Mark is h-8 (32px) → clearspace 8px on every side. Tie them together:
<div className="p-[0.25em] text-[32px] leading-none">
  <Logo variant="mark" className="h-[1em] w-auto" />
</div>
```

Sizing the mark in `em` against a wrapper font-size makes clearspace scale with
the logo automatically. Simpler fixed version: `h-8` mark inside `p-2`. Either
way, the wrapper *is* the exclusion zone — adjacent UI butts against the
wrapper, never the glyphs.

## 3. Scaling floor

Decide the minimum size at which the full lockup is legible (test at 16px,
24px, 32px rendered height). Encode the decision, don't leave it to layout:

- Below ~24px rendered height: `variant="mark"` only.
- Favicon/avatar sizes: mark only, and if the mark has fine detail, a
  simplified favicon-specific drawing (thicker strokes, dropped detail).

## 4. Dark mode

- **Single-color mark**: `currentColor` handles it — done. This is the
  strongest argument for requesting a single-color variant from any designer
  or generator.
- **Multi-color mark**: two assets, class-strategy swap (this repo sets
  `darkMode: "class"` in tailwind.config.ts, so `prefers-color-scheme` /
  `<picture media>` approaches will NOT follow the toggle):

```tsx
<Image src="/brand/logo-light.svg" alt="" className="dark:hidden" … />
<Image src="/brand/logo-dark.svg" alt="" className="hidden dark:block" … />
```

- Never "invert" a multi-color logo with CSS filters; brand colors shift badly.

## 5. Animated logo

If a reference had an animated variant worth emulating: draw-on and reveal
effects for an inline SVG mark are a stroke-dashoffset or clip-path animation
(see **motion-primitives**); designer-authored motion exports flow through the
**jitter** skill as Lottie. Always gate with `prefers-reduced-motion` and render
the static mark as the reduced state.

## 6. File-hygiene rules

- Optimize every SVG with SVGO before committing — the **haikei** skill's
  `references/integration.md` documents the exact SVGO v3+ config
  (`preset-default` + `removeDimensions`); the same discipline applies to logos.
- Keep canonical brand assets in one place (`public/brand/` + the inline
  component), never scattered per-page copies.
- Favicon and app-icon wiring (Next.js `app/icon.svg`, `app/apple-icon.png`,
  OG images) is documented in the **logoai** skill's `references/integration.md`
  — it applies to any logo, not just generated ones.
