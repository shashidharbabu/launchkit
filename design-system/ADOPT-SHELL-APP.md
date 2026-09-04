# Brief: adopt the design system in `apps/launchkit`

This is the working brief for the shell app in this repo. `ADOPT.md` is the general
guide; this file records what is different about **this** target, so whoever does the
work is not surprised by it.

## The target

`apps/launchkit` is the live app: a React 18 remote built with rsbuild and Module
Federation, mounted inside the RocketRide shell's page. It is not a Next app, and three
of its properties drive every decision below.

| Property | Consequence |
| --- | --- |
| It renders inside someone else's page | Its CSS is compiled by `tools/gen-styles.mjs`, every selector rewritten under `.lk-root`, and injected as a string from `src/styles.generated.ts`. It cannot ship a stylesheet. |
| It owns no URL | `src/nav.tsx` holds navigation in state, so there is no router. `LinkButton` cannot be used. |
| It themes its own root | `src/theme.tsx` toggles `.dark` on `#lk-root`, not on `<html>`. `next-themes` is absent. |

It already depends on `@base-ui/react`, `motion`, `lucide-react`, `sonner`, `clsx`,
`tailwind-merge`, `recharts` and `@number-flow/react`, which is every peer the package
needs. Nothing new to install.

## What it already gets for free

`tools/gen-styles.mjs` compiles from `launchkit/frontend/app/globals.css`, and that file
now imports the package's `tokens.css` and `base.css`. So the moment this branch is
merged, re-running the script gives the shell app the entire token layer and base layer,
scoped correctly. The CSS side of the adoption is one command, not a migration.

The one thing to check is that the script's `@source` globs reach the package, or
Tailwind will not emit the classes the package's components use.

## The five things to do

1. **Make the package resolvable.** Add `- 'design-system'` to `pnpm-workspace.yaml`,
   then `pnpm install`. That is the proper fix for dependency resolution here; the
   symlink in `ADOPT.md` is for repos without a workspace.
2. **Point the style pipeline at the package.** In `tools/gen-styles.mjs`, add the
   package's source to the `@source` list so its classes survive the Tailwind pass, and
   re-run `node tools/gen-styles.mjs`.
3. **Delete the app's duplicated primitives** in `src/components/ui/` and
   `src/components/motion-primitives/` and import from `@launchkit/design-system`
   instead. Keep `platform-icons.tsx`; it is product content, not a primitive.
4. **Replace the two Next-bound components.** Anywhere `LinkButton` would be used, use
   `Button` with the app's own `go()` navigation from `nav.tsx`. Keep the app's existing
   `ThemeToggle`, restyled with the package's `Button`, since it drives `theme.tsx`.
5. **Adopt the page anatomy.** `PageContainer` and `PageHeader` on every view, so every
   screen has one width and one shape. Then work through the screens with the specs in
   `components/` and `patterns/`.

## What must not change

- The Module Federation boundary: `AppDescriptor.ts`, `index.ts`, the rsbuild config.
- The `.lk-root` scoping. Every rule the app injects stays under it.
- The data layer: `src/data/*`, the pipelines, the shell SDK calls.
- Behaviour of any screen. This is a presentation change.

## Where the theme lives

Because `.dark` sits on `#lk-root` rather than `<html>`, `tokens.css` must be scoped to
that root by the codegen (it already rewrites `:root` and `.dark` this way), and
`AmbientField`, if the app ever uses it, needs to be told where to watch:

```tsx
<AmbientField themeRoot={() => document.getElementById('lk-root')} />
```

The field belongs on front doors only. In this app that means the Home view, and nowhere
else.
