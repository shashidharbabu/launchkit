# Gantry adoption: audit and remaining work in `apps/launchkit`

Audited 8 September 2026 against the running preview on `localhost:3400` and the source
in this repo. This file is the task list. `ADOPT-SHELL-APP.md` is the brief that explains
the target; read that first if you have not.

The design system in `design-system/` is current: 33 documents, the wave-line shader, the
`themeRoot` portability fix. Nothing in the package needs changing to finish this work.

---

## Part 1: what has already landed. Do not redo any of it.

| Area | Evidence |
| --- | --- |
| Package wired | `design-system` in `pnpm-workspace.yaml`; 34 files import `@launchkit/design-system` |
| Duplicates removed | `src/components/ui/` and `src/components/motion-primitives/` are gone |
| Deployability | `src/ds/` vendored copy plus `tools/sync-ds.mjs`, so the Module Federation bundle is self-contained |
| Tokens live | The browser reports `--background: oklch(97.4% .003 286)`, `--flare: oklch(58% .182 35)`, Instrument Sans |
| Dark mode | `.dark` applies to `#lk-root`; the Runs screen reads correctly in dark |
| Page anatomy | `PageContainer` + `PageHeader` on dashboard, launches, new-launch, runs, settings |
| Voice | Zero em/en dashes and zero middle dots in shipped copy, plus `domain/sanitize.ts` and a gate in `domain/gates.ts` |
| Gantry track | `gantry-track` used in four places |

`home.tsx` and `workspace.tsx` have no `PageContainer` on purpose: the first is the chat
(`patterns/chat.md`), the second uses `WorkspaceShell`
(`patterns/workspace-stage-anatomy.md`). Leave both as they are.

---

## Part 2: the six remaining items, in priority order

### 1. Bring back the ambient field (the biggest gap)

Every page currently reports zero canvases. The signature atmosphere is not in the
product. `tools/sync-ds.mjs` has `components/ambient-field.tsx` in its `SKIP` set, so the
vendored copy has no field.

It was skipped for a real reason that no longer holds: the field used to read the theme
from `<html>`, which a Module Federation remote cannot set. The component now reads its
palette from its own canvas (custom properties inherit) and accepts a `themeRoot`
callback for change detection.

Do this:

- Remove `components/ambient-field.tsx` from the `SKIP` set in `tools/sync-ds.mjs` and
  re-run the script. Confirm `src/ds/components/ambient-field.tsx` appears.
- Render it on the **Home empty state only**, scoped to this app's theme root:

  ```tsx
  <AmbientField
    variant="soft"
    themeRoot={() => document.getElementById('lk-root')}
    className="absolute inset-x-4 inset-y-3 -z-10 rounded-frame opacity-80
               [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,black_35%,transparent_100%)] sm:inset-x-8"
  />
  ```

- It must disappear once a conversation starts, and it must never appear behind a work
  surface: no stages, tables, forms, dialogs or the rail.
- Verify: the Home empty state shows one `<canvas>`, the wave lines move, and switching
  the theme repaints it.

Read `foundations/atmosphere.md` before writing any of this. It governs where the field
may appear, the mask, the intensity budget, and the performance rules.

### 2. Replace `min-h-screen` on Home

`pages/home.tsx` line 21 uses `min-h-screen`. `foundations/layout-spacing.md` forbids it
because of the iOS address bar. Use `min-h-dvh`. Check the file for any other `h-screen`.

### 3. Replace thirteen ad-hoc z-index values

In `components/launchkit/procedure-flow.tsx`, `components/launchkit/stage-rail.tsx`,
`pages/home.tsx` and three files under `src/ds/`. `foundations/layout-spacing.md` defines
five tokens: `--z-sticky`, `--z-sidebar`, `--z-overlay`, `--z-dialog`, `--z-toast`. Use
them as `z-(--z-dialog)`.

Leave the vendored `src/ds/` files alone; fix those upstream in `design-system/src/` and
re-run `tools/sync-ds.mjs`, or the next sync will overwrite you.

### 4. Decide what happens to Dashboard

The nav is Home / Dashboard / Launches / Runs / Settings. Gantry merged Dashboard into
Launches, putting the stat row at the top of that page and keeping the old slug as a
redirect. See `components/navigation.md`.

Do not merge it silently. Either adopt the merge, or keep Dashboard and add a line to
`components/navigation.md` recording that this app diverges and why. Ask before choosing.

### 5. Use the Gantry mark in the thread

`design-system/src/components/brand-mark.tsx` is never imported. The top-bar logo belongs
to the platform shell and is not yours to change, but `patterns/chat.md` puts the mark
beside every assistant turn in the thread, and the thread currently has none.

### 6. Close the dead space above the composer on Home

There is roughly 250px of empty band between the shell chrome and the greeting.
`patterns/chat.md` puts the composer at optical centre with the greeting and the question
directly above it.

---

## Part 3: things that look like violations but are not. Leave them.

- `components/error-boundary.tsx` uses five hardcoded hex values on purpose: it has to
  render when the generated stylesheet never loaded. Add a one-line comment in
  `foundations/color.md` recording the exception so future audits stop flagging it.
- `theme-toggle.tsx` is correctly excluded from the vendored copy: it depends on
  `next-themes`, and this app has its own `theme.tsx`.
- `dropdown-menu.tsx` is unused. No action.
- The em dashes in `domain/questions.ts`, `domain/sanitize.ts`, `domain/gates.ts` and
  `lib/rulebooks.ts` are model prompt text and the dash-stripping machinery itself.
  Correct as they are.

---

## Part 4: how to work

Order: item 1, then 2 and 3 together, then 5 and 6. Item 4 needs a decision from the
human first. Stop after each and show what changed.

Hard constraints:

- **Presentation only.** Every field, action, API call, state and empty/error/loading
  path behaves exactly as it does now.
- Do not touch `AppDescriptor.ts`, `index.ts`, the rsbuild config, or `src/data/*`.
- Everything stays scoped under `.lk-root`. The theme class lives on `#lk-root`, not
  `<html>`.
- No raw palette classes, no hardcoded hex, radius, shadow or font size. Tokens only.
- Sentence case. No em dashes, en dashes, middle dots or exclamation marks in any string
  a person sees.

Before you write any component, read its spec in `design-system/components/`. Before you
write any visible string, read `design-system/voice.md`. Run
`design-system/checklist.md` against every screen you touch.

Verify with a typecheck, then the app's build, then look at the screens in both themes
at desktop and phone width. Report what you changed and anything you could not do.

---

## Status, 8 September 2026 (evening)

Items 1, 2, 3, 5 and 6 are done and verified on the preview at 1440 and 390 in both
themes: one canvas on the Home empty state, none once a conversation starts, the field
repaints on theme switch (`--field-sky-top` flips to the night value), the mark sits
beside each navigator turn, the composer sits at 40% of the section, no screen scrolls
sideways, zero page errors. Item 4: the owner chose the merge; Dashboard is gone, Launches carries the stat row and the old view lands there.

Three things the audit did not list surfaced while running the checklist and were fixed:

- **Portals escaped `.lk-root`.** Every dialog, sheet, tooltip and the palette rendered
  unstyled and unthemed because the package portals to `document.body`. Fixed upstream
  with `PortalContainerProvider` (`lib/portal.ts`); the app provides `#lk-root`.
- **The phone top bar wrapped over the content.** Below `lg` the bar is now the spec's
  56px logo-and-menu bar with the destinations in a left sheet, and the gantry is the
  spec's horizontal pill strip above the stage title.
- **Sideways scroll at 390px** came from single-column grids stretching to one wide child
  (fixed with `grid-cols-[minmax(0,1fr)]` on every page and stage grid), a seven-option
  `Segmented` that could not scroll (upstream: `max-w-full overflow-x-auto`), and
  screen-reader-only column labels escaping the table's scroll container (upstream:
  `TableFrame` is now `relative`).
