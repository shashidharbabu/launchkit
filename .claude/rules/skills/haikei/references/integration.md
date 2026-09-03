# Integration

Everything after the download. This is the part that goes wrong, and the part
Claude Code fully owns.

## What a Haikei export actually looks like

```xml
<svg id="visual" viewBox="0 0 900 600" width="900" height="600"
     xmlns="http://www.w3.org/2000/svg" version="1.1">
  <path d="M0 433L900 366L900 601L0 601Z" fill="#2563eb"></path>
  <path d="M0 486L900 419L900 601L0 601Z" fill="#1d4ed8"></path>
  ...
</svg>
```

Three properties drive every gotcha below:

1. **Fixed `width`/`height` alongside `viewBox`.** The intrinsic size wins in
   most layouts, so the SVG will not fill its container.
2. **Hardcoded hex fills**, sometimes `<linearGradient>` stops. No
   `currentColor`, no CSS variables.
3. **Path counts scale with generator complexity** — 3–8 paths for waves,
   hundreds for `low-poly-grid` and scatter fields.

## Step 1 — Optimize (always)

```bash
npx svgo --multipass public/backgrounds/hero-waves.svg
```

To also strip the fixed dimensions (the responsive fix in step 2), you need the
`removeDimensions` plugin, which is **not** in `preset-default`. The old
`--enable=removeDimensions` flag was removed in SVGO v3 — it now requires a
config file:

```js
// svgo.config.mjs
export default {
  multipass: true,
  plugins: ['preset-default', 'removeDimensions'],
};
```

```bash
npx svgo --config svgo.config.mjs -f public/backgrounds/
```

`removeDimensions` deletes `width`/`height` and keeps `viewBox` — exactly what
step 2 needs. Verified: 31.7% reduction on a 3-path wave export, `viewBox`
retained, path data shortened to relative commands.

Verify the result before shipping: if a `low-poly-grid` export is still over
~80KB optimized, re-export at lower triangle resolution rather than accepting it.

## Step 2 — Make it responsive

The single most common failure. A Haikei SVG at a fixed 900×600 dropped into a
full-width hero will letterbox with gaps, or scale non-uniformly.

Pick the behavior deliberately:

| Intent | `preserveAspectRatio` | Notes |
|---|---|---|
| Full-bleed background, stretch to fit | `none` | Distorts. Fine for waves and gradients, bad for blobs and scatter (shapes visibly squash). |
| Cover-crop like `object-fit: cover` | `xMidYMid slice` | No distortion; edges crop. Best default for scatter and low-poly. |
| Divider anchored to bottom edge | `xMidYMax slice` | Keeps the wave crest pinned to the bottom while cropping the top. |
| Contain, letterbox allowed | `xMidYMid meet` | Rarely what you want for a background. |

After `removeDimensions`, set it in the markup or via props:

```xml
<svg viewBox="0 0 900 600" preserveAspectRatio="none" ...>
```

## Step 3 — Choose a delivery method

| Method | Use when | Cost |
|---|---|---|
| CSS `background-image: url(...)` | Purely decorative, no theming needed | Cached separately, zero JS, but not themeable and `preserveAspectRatio` isn't controllable from CSS — bake it into the file |
| `<img>` / Next `<Image>` | Decorative, needs `object-fit` control | Cached; add `aria-hidden` and `priority` for above-the-fold heroes |
| Inlined React component | Colors must respond to theme, or the asset is small (waves) | Ships in the JS bundle — never inline low-poly or scatter output |

### Next.js: inline as a component

With `@svgr/webpack` configured, or by hand for small exports. By hand is
usually better here because you want to parameterize the fills:

```tsx
export function HeroWaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 900 600'
      preserveAspectRatio='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      className={className}
    >
      <path d='M0 433L900 366L900 601L0 601Z' className='fill-blue-600' />
      <path d='M0 486L900 419L900 601L0 601Z' className='fill-blue-700' />
      <path d='M0 539L900 472L900 601L0 601Z' className='fill-blue-800' />
    </svg>
  );
}
```

Swapping `fill="#2563eb"` for `className="fill-blue-600"` is what buys you dark
mode (`dark:fill-blue-900`) and brand-token consistency. Do this whenever the
path count is small enough to stay readable.

### As a positioned background layer

```tsx
<section className='relative isolate overflow-hidden'>
  <HeroWaves className='pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 w-full' />
  <div className='relative px-6 py-24'>{/* content */}</div>
</section>
```

`isolate` on the parent creates a stacking context so `-z-10` doesn't escape
behind the page background. `pointer-events-none` prevents the decoration from
eating clicks. Both are required, not optional.

## Step 4 — Dark mode

Haikei bakes colors in. Three options, in order of preference:

1. **Tokenize on inline** — replace hex fills with Tailwind classes as above,
   add `dark:` variants. Only practical for low path counts.
2. **Export twice** — roll the same generator with dark brand colors, save as
   `hero-waves-dark.svg`, swap via `<picture>` or a theme-aware `<Image>`.
   Caveat: the dice re-rolls composition, so match parameters carefully or the
   two versions won't be the same shape.
3. **Scripted swap** — run a build step replacing known hex values. Brittle;
   use only for large exports where option 1 is impractical.

For `blurry-gradient` specifically, a dark variant usually needs *lower*
saturation, not just darker hues — a directly darkened export reads as muddy.

## Step 5 — Accessibility and performance checklist

- `aria-hidden="true"` and `focusable="false"` on every decorative SVG.
- `pointer-events-none` so it never intercepts input.
- Contrast: check text over the busiest region of the asset, not the average.
  Low-poly and scatter backgrounds frequently fail WCAG AA under headlines —
  add a scrim (`bg-gradient-to-t from-black/60`) rather than re-rolling forever.
- Above-the-fold hero assets: preload or use `priority`; a late-loading
  background causes a visible flash.
- If the same asset appears on many routes, put it in `public/` and reference by
  URL rather than inlining it into each bundle.

## Anti-patterns

- **Committing the raw export.** Always SVGO first.
- **Inlining a low-poly or scatter SVG into a React component.** Hundreds of
  paths in the JS bundle on every page load.
- **Re-rolling the dice per page for the same brand surface.** Export once,
  reuse; consistency beats novelty.
- **Using `preserveAspectRatio="none"` on blobs or scatter fields.** Circles
  become ovals and it looks broken. Use `slice` instead.
- **Assuming the file exists.** This skill cannot generate it — wait for the
  human to confirm the download before writing imports.
