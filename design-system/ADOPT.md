# Adopting the design system in an existing app

The system is a package: `@launchkit/design-system`. It ships source (TypeScript + CSS),
not a build, so the consuming app compiles it like its own code. The Launch Kit frontend
in this repo is the reference consumer; every step below is what it does.

Requirements: React 18.2 or newer, Tailwind CSS v4, and the peer dependencies in
`package.json` (`@base-ui/react`, `motion`, `lucide-react`, `next-themes`, `sonner`,
`clsx`, `tailwind-merge`, `tw-animate-css`; `next`, `recharts` and `@number-flow/react`
only for the components that use them).

## 1. Bring the package in

Pick one:

- **Same repo (a workspace).** Keep `design-system/` at the repo root and point at it
  from the app's `tsconfig.json`:

  ```json
  "paths": {
    "@launchkit/design-system": ["../../design-system/src/index.ts"],
    "@launchkit/design-system/components/*": ["../../design-system/src/components/*"],
    "@launchkit/design-system/motion/*": ["../../design-system/src/components/motion/*"],
    "@launchkit/design-system/lib/*": ["../../design-system/src/lib/*"]
  }
  ```

  and add `"../../design-system/src/**/*.ts"` and `"../../design-system/src/**/*.tsx"`
  to `include`, so `tsc` checks the package with the app.

- **A dependency.** `"@launchkit/design-system": "file:../design-system"` in the app's
  `package.json` (or a published version). The package `exports` map covers
  `./tokens.css`, `./base.css`, `./components/*`, `./motion/*`, `./lib/*` and the root
  barrel.

Install the peer dependencies:

```
npm i @base-ui/react motion lucide-react next-themes sonner clsx tailwind-merge tw-animate-css
```

The package resolves its own imports (`react`, `motion`, `@base-ui/react`) from a
`node_modules` above `design-system/src`. In a pnpm or npm workspace that is the hoisted
root install. Without a workspace, link the app's install once and commit nothing:

```
ln -sfn ../launchkit/frontend/node_modules design-system/node_modules
```

Either way there must be exactly one copy of React between the app and the package.

With Next and Turbopack, importing source from above the app directory needs the repo
root declared in `next.config.ts`:

```ts
turbopack: { root: path.resolve(process.cwd(), '../..') }
```

## 2. Wire the styles

In the app's global stylesheet (Tailwind v4, CSS-first):

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@launchkit/design-system/tokens.css";   /* or the relative path */
@import "@launchkit/design-system/base.css";
@custom-variant dark (&:is(.dark *));
@source "../node_modules/@launchkit/design-system/src";   /* or the relative path */
```

`tokens.css` is every color, radius, shadow, type role, width, easing and duration, for
both themes. `base.css` is the base layer (body, focus, links, placeholders, reduced
motion) plus the utilities the components rely on (`text-shimmer`, `gantry-track`,
`chat-prose`, `skeleton`). The `@source` line makes Tailwind scan the package for
classes; without it, styles are silently missing.

Do not add a `tailwind.config`. Do not redefine a token in the app; if a value is
missing, add it to `tokens.css` so every consumer gets it.

## 3. Load the type

Two families: Instrument Sans and Geist Mono, both on Google Fonts. The tokens chain to
the CSS variables `--font-instrument-sans` and `--font-geist-mono`; set them on `<html>`.

With Next:

```ts
import { Instrument_Sans, Geist_Mono } from 'next/font/google';
export const instrumentSans = Instrument_Sans({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-instrument-sans', display: 'swap' });
export const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono', display: 'swap' });
// <html className={`${instrumentSans.variable} ${geistMono.variable}`}>
```

Anywhere else: a `<link>` to Google Fonts for the two families, then
`:root { --font-instrument-sans: "Instrument Sans"; --font-geist-mono: "Geist Mono"; }`.

## 4. Theme

Wrap the app in `next-themes` (it is not Next-specific) with `attribute="class"` and
`defaultTheme="system"`, and put `suppressHydrationWarning` on `<html>`. The tokens
switch on the `.dark` class; components never write `dark:` for colors. `ThemeToggle`
and `AmbientField` read the resolved theme from this provider.

## 5. Use the components

Import by file for the smallest bundles and clean client boundaries:

```ts
import { Button, LinkButton } from '@launchkit/design-system/components/button';
import { Card, CardHeader, CardBody, CardFooter } from '@launchkit/design-system/components/card';
import { cn } from '@launchkit/design-system/lib/cn';
```

or from the barrel `@launchkit/design-system`. Always use the package's `cn`: it teaches
`tailwind-merge` the custom tokens, and a plain `twMerge` will drop classes such as
`text-primary-foreground` beside `text-small`.

Product components (the rail, the workspace, the stages, the navigator) live in the
app, not the package. Build yours from the primitives the same way, following the
patterns in `patterns/`.

## 6. What depends on Next or on next-themes

Two components, both replaceable in a few lines:

- `LinkButton` renders `next/link`. On another router, wrap your own link with
  `buttonClasses()` from the button module.
- `ThemeToggle` reads `next-themes`. With another theme mechanism, write a four-line
  toggle against your own context and style it with `Button variant="ghost" size="icon"`.

Everything else is plain React, including `AmbientField`.

## 6a. When the theme is scoped to a subtree

Some apps cannot put a class on `<html>`: a Module Federation remote, a widget embedded
in someone else's page, a preview pane. Those put the theme class on their own root
instead. The tokens work unchanged, because custom properties inherit, and `AmbientField`
reads its palette from its own element for the same reason. Give it the element to watch
for changes:

```tsx
<AmbientField themeRoot={() => document.getElementById('app-root')} />
```

The one thing to get right is that `tokens.css` must be scoped to that root too, so
`:root` becomes your root selector and `.dark` becomes `<root>.dark`.

## 7. Before shipping a screen

Run `checklist.md`. Open `/design` in the reference app (or build the same page from
`app/(app)/design/page.tsx`) to see every component rendered by the real code in both
themes.

## Migrating an existing screen

1. Replace the app's own button, input, card, badge, table and dialog with the package's;
   keep the behaviour, change the presentation.
2. Move every color, radius, shadow and font size to a token utility
   (`bg-surface`, `rounded-card`, `shadow-raised`, `text-heading`). No raw palette
   classes, no hardcoded hex.
3. Give the page the standard anatomy: `PageContainer`, `PageHeader`, then blocks
   32px apart; the four states (loading, empty, error, running).
4. Rewrite labels in sentence case, remove uppercase tracked labels and mono headings,
   remove dashes and middle dots from strings.
5. Check both themes and a phone width.
