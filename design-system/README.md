# Launch Kit design system: "Gantry"

The design system for Launch Kit, the product that takes an app you already built to market:
profile, brand, pricing and listing, launch posts, ranked venues, live demand signals, and a
launch plan with tracked links. Assisted, never autonomous: AI drafts everything, a human
approves everything.

This system is standalone. It has no dependency on, and no reference to, any platform the
product may run on. It describes one application, end to end, in two places that must agree:

- **The written system**, this folder.
- **The living system**, the `/design` page inside the app
  (`launchkit/frontend/app/(app)/design/page.tsx`), which renders every token and component
  with the real code in the current theme.

Target stack (verified against `launchkit/frontend/package.json`): Next 16, React 19,
Tailwind CSS v4, Base UI (`@base-ui/react`), Motion v13 (`motion/react`), lucide-react,
sonner, number-flow, TanStack Table, Recharts. See `stack.md`.

## Map

| File | What it settles |
| --- | --- |
| `00-direction.md` | The thesis, the design read and dials, personality, the signature element, what was rejected. Read first. |
| `src/tokens.css` | The single source of truth: every color, radius, shadow, type role, width, easing and duration. Imported by the app's `globals.css`. |
| `src/base.css` | The base layer and the utilities the components rely on. Imported after the tokens. |
| `ADOPT.md` | How an existing app takes the package on: wiring, fonts, theme, migration. |
| `ADOPT-SHELL-APP.md` | The working brief for `apps/launchkit`: what is different about that target and the five steps. |
| `foundations/color.md` | Roles, the accent budget, status rules, contrast table, dark mode. |
| `foundations/typography.md` | Instrument Sans + Geist Mono, the eleven type roles, legibility rules. |
| `foundations/shape-elevation.md` | The radius system and the three shadows. |
| `foundations/layout-spacing.md` | Widths, the app grid, spacing rhythm, breakpoints. |
| `foundations/motion.md` | Durations, easings, springs, what moves and why, reduced motion. |
| `foundations/iconography.md` | Icon family, sizes, stroke, the platform marks. |
| `foundations/identity.md` | The mark, the wordmark, clearspace, favicon. |
| `foundations/atmosphere.md` | The ambient field: the pad drawn live behind the front doors, its tokens, budget, and limits. |
| `components/*.md` | One spec per component family: buttons, inputs and forms, cards and surfaces, status, feedback states, tables and lists, dialogs and sheets, navigation, the Gate, chat, data viz. |
| `patterns/*.md` | How components compose into screens: the app shell, page anatomy, the workspace and its seven stages, page transitions, the chat home, the landing page. |
| `voice.md` | Copy rules: vocabulary, labels, empty and error states, what is banned. |
| `accessibility.md` | Contrast, focus, keyboard, motion, semantics. |
| `stack.md` | Adopt, consider, avoid, with versions and gotchas. |
| `checklist.md` | The pre-flight check every screen passes before it ships. |

## How to consume this system

**Humans:** read `00-direction.md`, then build with the tokens. A component never hardcodes a
color, radius, duration, or font. If a value is not a token, it is not in the system. Open
`/design` in the running app to see any component before you use it.

**AI agents:** before generating any Launch Kit UI, read `00-direction.md`,
`src/tokens.css`, and the spec for the component you are building in `components/`.
Use semantic utilities (`bg-surface`, `text-muted-foreground`, `rounded-card`,
`shadow-raised`), never raw palette classes (`bg-orange-600`, `rounded-lg`). Then run
`checklist.md`.

## Where the code lives

The system is a package, `@launchkit/design-system`, and the app is its consumer. Nothing
in `src/` knows about Launch Kit's routes or data; everything in the app that is specific
to the product (the rail, the workspace, the stages, the navigator) is built from it.

```
design-system/                          the package
  package.json                          @launchkit/design-system (exports below)
  src/tokens.css                        every token, both themes
  src/base.css                          base layer + the utilities components rely on
  src/index.ts                          the barrel
  src/lib/                              cn (tailwind-merge taught the tokens), motion, use-mounted
  src/components/                       the primitives, the Gate, the mark, the ambient field
  src/components/motion/                animated-background, animated-group, in-view, morphing-dialog
  ADOPT.md                              how another app takes this on

launchkit/frontend/                     the reference consumer
  app/globals.css                       imports the package's tokens.css and base.css
  app/fonts.ts                          Instrument Sans + Geist Mono via next/font
  tsconfig.json                         paths: @launchkit/design-system/* -> ../../design-system/src/*
  components/launchkit/*                the product components (shell, sidebar, chat, stages)
  app/(app)/design/page.tsx             the living styleguide
```

Import by file (`@launchkit/design-system/components/button`) or from the barrel. See
`ADOPT.md` for the full wiring, including fonts, theme, and the workspace note.

## Non-negotiables

- **Assisted, never autonomous** is visible in the UI: AI output is a draft until a human
  approves it. Drafts carry a provenance line; approvals are explicit acts with explicit
  feedback (the Gate).
- **One accent, spent deliberately.** Flare appears on the gate verb, the running state,
  selection, and focus. Everything else is graphite.
- **Status is never color alone.** A stamp always carries its word.
- **One soft shape system.** Controls 8, cards 12, panels 16, frames 24, pills for chips.
- **Legibility over density.** 16px UI text, 17px reading text, secondary text at 6:1 or
  better. Mono is for data, never for labels.
- **Both themes are first-class.** Every screen is checked in light and dark.
- **No filler.** No em-dashes, no decorative dots, no uppercase tracked labels, no fake
  numbers, no version stamps, no cute copy.
