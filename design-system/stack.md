# Stack

Verified against `launchkit/frontend/package.json` on 3 September 2026.

## Adopt (in use)

| Package | Version | Role | Notes |
| --- | --- | --- | --- |
| next | 16.3 | App framework | App Router, `template.tsx` for page transitions, `next/font/google` for type, `next/image` for photographs. Turbopack dev server. |
| react, react-dom | 19.2 | | The hooks lint rules are the React 19 set: no synchronous `setState` in effects; derive during render instead. |
| tailwindcss, @tailwindcss/postcss | 4 | Styling | CSS-first config: every token is a `@theme` variable in `design-system/src/tokens.css`, imported by `app/globals.css`. Utilities like `rounded-card`, `text-heading`, `max-w-reading`, `duration-(--duration-base)` come from those tokens. No `tailwind.config`. |
| tw-animate-css | 1.4 | Enter/exit for Base UI | `data-[starting-style]` / `data-[ending-style]` transitions on dialogs, sheets, menus, tooltips. |
| @base-ui/react | 1.7 | Headless primitives | Dialog, Menu, Tooltip, Switch. Accessible by default; styled entirely with the tokens. |
| motion | 13 | Animation | Import from `motion/react`. Used at the leaf only. `useScroll` for the landing nav; `AnimatePresence` for exits; springs for the gate and send button. |
| lucide-react | 1.x | Icons | One family. Stroke 1.75. |
| @number-flow/react | 0.6 | Stat values | Rolls digits; respects reduced motion natively. |
| @tanstack/react-table | 9 | Sorting on the targets table | Headless; the `Table` primitives render it. |
| recharts | 3 | The attribution chart | Single-series bar, colors via `ChartContainer`'s CSS variables. |
| cmdk | 1.1 | Command palette | Inside `DialogContent`. |
| sonner | 2 | Toasts | Unstyled, classes from the tokens, clamped to `--duration-slow`. |
| next-themes | 0.4 | Theme | `attribute="class"`, system default. |
| clsx, tailwind-merge | | `cn()` | |

Vendored (owned source, in `design-system/src/components/motion/`): `AnimatedBackground`,
`AnimatedGroup`, `InView`, `MorphingDialog`. Three unused primitives were removed.

## Consider (not yet needed)

- **@base-ui/react Accordion** if the FAQ or profile sections outgrow native `details`.
- **@base-ui/react Popover** for inline help beyond tooltips.
- **shadcn/ui components** can be added on the Base UI backend; remap their tokens to
  these names before use and never ship a default shadcn look.

## Avoid

- A second animation runtime (GSAP, react-spring) beside Motion.
- `framer-motion` imports; the package is `motion`.
- Component libraries with their own tokens (Material, Chakra, Mantine): they fight the
  system.
- Tremor, Nivo, or chart kits with baked palettes; Recharts with token colors is enough.
- Vaul-style drawers; the sheet covers it.
- Google Fonts `<link>` tags; fonts go through `next/font`.
- Any dependency that draws icons in a second family.

## Build and check

```
cd launchkit/frontend
npm install
npx tsc --noEmit -p tsconfig.json     # types
npx eslint .                          # React 19 hooks rules, Next rules
npm run dev -- -p 3200                # against the backend on 8090
```

The backend is a FastAPI app (`launchkit/backend`); the frontend reads
`NEXT_PUBLIC_API_URL` (default `http://localhost:8090`) and `NEXT_PUBLIC_SITE_URL` for
the canonical origin. The chat needs `POST /navigator` (in `backend/app/navigator.py`)
and degrades to local answers without it.
