# shadcn theming — components.json and remapping tokens onto an existing palette

## components.json anatomy

Read by every CLI command; lives at project root.

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",          // IMMUTABLE after init; "default" is deprecated
  "rsc": true,                  // emit React Server Component-aware code
  "tsx": true,                  // .tsx vs .jsx output
  "tailwind": {
    "config": "tailwind.config.ts", // "" on Tailwind v4 (no config file)
    "css": "app/globals.css",       // file that holds the token variables
    "baseColor": "neutral",         // gray family used for generated defaults
    "cssVariables": true,           // IMMUTABLE; false = inline color utilities
    "prefix": ""                    // e.g. "tw-" to prefix generated classes
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": { /* see references/cli.md */ }
}
```

Aliases must match `tsconfig.json` paths (or `package.json#imports`) or every
generated import breaks. The two immutable fields (`style`, `cssVariables`)
require deleting and re-adding all components to change — decide once.

## The token convention

Semantic background/foreground pairs: the base token is the surface, the
`-foreground` suffix is the text/icon color sitting on it. `bg-primary
text-primary-foreground` is the whole idiom. Full set: `background`,
`foreground`, `card(-foreground)`, `popover(-foreground)`,
`primary(-foreground)`, `secondary(-foreground)`, `muted(-foreground)`,
`accent(-foreground)`, `destructive`, `border`, `input`, `ring`, `chart-1..5`,
`sidebar(-*)`, plus `--radius`. Dark mode is the same tokens overridden inside
a `.dark` selector — components never carry `dark:` variants themselves. That
is the entire trick, and it is why remapping is cheap.

## Tailwind v3.4 mechanics (shadcn@2.3.0 era — this repo's stack)

Variables are **HSL channel triplets without the `hsl()` wrapper**, and
`tailwind.config` wraps them:

```ts
// tailwind.config.ts
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  // ...same pattern for card/popover/secondary/muted/accent/destructive/border/input/ring
}
```

**Pitfall:** if your existing palette uses RGB channel variables (this repo's
`ink`/`paper`/`rule` are `rgb(var(--c-ink) / <alpha-value>)`), you cannot alias
`--background: var(--c-ink)` — an RGB triplet inside `hsl()` renders garbage.
Either restate the values as HSL triplets, or switch that token's wrapper to
`rgb(var(--background) / <alpha-value>)` in the config. Pick one convention per
token and don't mix.

## Worked remap: shadcn defaults → an existing dark-only palette

Never accept the default zinc theme on a branded surface. For a dark-only site
(e.g. this repo's Signal Bench: `panel #12151C`, `ember #FF6A3D`,
`muted #8A93A6`, hairlines `#2B2B2B`, text `#E8E8E8`), put the dark values
straight into `:root` and **omit the `.dark` block entirely** — a dark-only
site has no light mode to toggle away from:

```css
:root {
  --background: 222 22% 9%;         /* #12151C — the panel, not shadcn zinc */
  --foreground: 0 0% 91%;           /* #E8E8E8 */
  --card: 0 0% 10%;                 /* #191919 raised surface */
  --card-foreground: 0 0% 91%;
  --popover: 0 0% 10%;
  --popover-foreground: 0 0% 91%;
  --primary: 14 100% 62%;           /* #FF6A3D ember — the single action hue */
  --primary-foreground: 222 22% 9%; /* ink on ember, not white */
  --secondary: 0 0% 17%;            /* #2B2B2B */
  --secondary-foreground: 0 0% 91%;
  --muted: 222 20% 13%;
  --muted-foreground: 221 14% 60%;  /* #8A93A6 */
  --accent: 222 20% 13%;
  --accent-foreground: 0 0% 91%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 17%;
  --input: 0 0% 17%;
  --ring: 14 100% 62%;              /* focus ring = accent, visible on ink */
  --radius: 0.25rem;                /* match the surface's corner language */
}
```

Rules of the remap:

- **Map meaning, not lightness.** `--primary` is "the action color" — if the
  design system says one ember per view, primary is ember and `secondary`
  stays neutral. Don't promote a second hue just to fill slots.
- **`--primary-foreground` is contrast-checked against `--primary`**, not
  against the page. Ember at 62% lightness wants near-black text (4.5:1), not
  white.
- **`--ring` must survive the background.** On near-black, a dark ring is an
  invisible focus state — an accessibility failure. Use the accent.
- **`--radius` is part of the brand**, not a leftover. Sharp-cornered systems
  should set it near 0 rather than inherit shadcn's 0.5rem.
- Keep bespoke tokens (`bg-panel`, `text-ember`) for bespoke surfaces; the
  shadcn tokens exist so *copied components* drop in unedited. Two
  vocabularies, one source of truth: point both at the same values.

## Tailwind v4 mechanics (shadcn@latest — for reference)

No `tailwind.config`; tokens are oklch and wired in CSS:

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";
@custom-variant dark (&:is(.dark *));
:root  { --primary: oklch(0.205 0 0); /* ... */ }
.dark  { --primary: oklch(0.922 0 0); /* ... */ }
@theme inline { --color-primary: var(--primary); /* exposes bg-primary */ }
```

New tokens: define under `:root` (+ `.dark` if the site has two modes), expose
via `@theme inline` as `--color-<name>`, use as `bg-<name>`. The same remap
logic applies; only the plumbing differs. `shadcn/create` (ui.shadcn.com/create)
can generate a preset visually — useful for exploring, but commit the CSS it
outputs, not a dependency on the tool.

## cssVariables: false

Generates components with hardcoded Tailwind color utilities instead of
semantic tokens. Only defensible when shadcn components are a tiny minority in
an already-tokenized codebase and you intend to restyle each copy by hand.
Immutable — switching later means re-adding everything.
