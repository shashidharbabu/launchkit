---
name: shadcn
description: Operate the shadcn/ui CLI and registry system (ui.shadcn.com) — initializing on an existing project, components.json anatomy, CSS-variable theming and remapping shadcn's --background/--foreground tokens onto an existing palette (like this repo's dark ink surfaces), third-party @namespace registries, and the upgrade/diff workflow. Use this whenever a task involves running npx shadcn init or add, editing components.json, theming or re-theming shadcn components, wiring shadcn into an existing Tailwind project, adding a component from a third-party or private registry (@acme/thing syntax), diffing local components against upstream, deciding which shadcn components belong on a marketing/launch page versus an app, or any question about the shadcn CLI, registry, or token system. Also use it BEFORE running any shadcn command on a Tailwind v3 project — the current CLI targets Tailwind v4, and the shadcn@2.3.0 vs shadcn@latest fork is the first decision, documented here.
---

# shadcn/ui

shadcn/ui is **not a component library you install as a dependency**. It is a
CLI plus a registry of open component source. `npx shadcn add button` copies
`button.tsx` into your repo; from that moment the code is yours to edit, and no
`npm update` will ever touch it. The system has three parts: the **CLI**
(init/add/search/build), **components.json** (per-project config the CLI reads),
and **registries** (the default `@shadcn` one plus any third-party or private
registry you configure).

This skill owns the CLI/registry/theming mechanics. For *whether* shadcn is the
right stack for an app, defer to **rocketride-frontend** (shadcn is its shared
baseline); for design rules and palettes, **ui-ux-pro-max**; for not looking
like a stock shadcn site, **frontend-design** / **taste-skill**; for animation
layered on top, **motion-primitives**.

## The version fork — decide this first

Verified against npm and live docs, Aug 2026:

| Your project | CLI to use | Docs |
|---|---|---|
| Tailwind **v4** / new project | `npx shadcn@latest` (4.18.0) | ui.shadcn.com/docs |
| Tailwind **v3.x** (this repo: 3.4) | `npx shadcn@2.3.0` — last v3-compatible CLI | v3.shadcn.com (legacy) |

`shadcn@latest` is Tailwind v4 + React 19 territory: it writes
`@import "shadcn/tailwind.css"` into your global CSS, uses `@theme inline` and
oklch tokens, and offers a `--base` choice (`base`, `radix`, `aria`) and presets.
**Do not run `@latest init` on a Tailwind 3.4 project** — it will scaffold
v4-style CSS your build can't process. There is no compatibility flag; the fork
is the version number itself. Full verified command reference for both:
`references/cli.md`.

## Workflow — existing Tailwind 3.4 + Next.js App Router project

1. `npx shadcn@2.3.0 init` — answers create `components.json`, add the `cn()`
   util, install `tailwindcss-animate` (1.0.7), and write default CSS variables.
2. **Immediately remap the tokens onto the existing palette** before adding
   components. Never ship shadcn's default zinc theme on a branded surface —
   the worked remap onto this repo's near-black `ink`/`panel` + `ember` palette
   is in `references/theming.md`.
3. `npx shadcn@2.3.0 add button dialog ...` — then edit the copied files
   directly. Restyling a copied component beats wrapping it in prop layers.
4. Third-party registries: configure once in `components.json`, then
   `add @acme/component` — syntax and trust model in `references/cli.md`.
5. Upgrades: components are owned source, so upgrading is a diff-and-merge, not
   an install. Workflow in `references/cli.md`.

Two settings are **immutable after init** (changing them means delete and
re-add every component): `style` and `tailwind.cssVariables`. Get them right
the first time: `style: "new-york"` (`default` is deprecated),
`cssVariables: true`.

## Which components earn their place

**Marketing / launch page** — shadcn is mostly overkill here. Earns its place:
`button`, `badge`, `accordion` (FAQ), `sheet`/`dialog` (mobile nav, video
modal), `navigation-menu`, `separator`, `skeleton`. A launch page that inits
the full kit for one button has bought a token system it will fight; a bespoke
20-line button is often the better trade. **App surfaces** are where shadcn
pays rent: `data-table`, `form` + field primitives, `command` (⌘K), `combobox`,
`tabs`, `dropdown-menu`, `toast`/`sonner`, `date-picker`, `sidebar` — exactly
the archetype furniture rocketride-frontend's admin-console reference assumes.

## When not to use

- **A page with its own design system already in flight** (this repo's
  Datasheet and Signal Bench specimens): shadcn's semantic tokens
  (`bg-background`, `text-muted-foreground`) would sit beside bespoke tokens
  (`bg-panel`, `text-ember`) as a second, competing vocabulary. Either remap
  shadcn's variables onto the existing tokens (references/theming.md) or skip
  shadcn for that surface.
- **One-off primitives.** Don't init the whole system to get one accordion on
  a static page; write it or copy just the file and its deps.
- **Non-React stacks.** The registry serves React/TSX. Vue/Svelte ports exist
  but are third-party — different projects, different quality bars.

## Anti-patterns

- Running `shadcn@latest init` on a Tailwind v3 project (see fork above).
- Shipping the default theme — remap tokens before the first component lands.
- Wrapping copied components in prop-forwarding wrappers instead of editing
  them. The whole point of copy-in-source is that you edit the source.
- Re-running `add -o` (overwrite) on a component you've customized without a
  clean branch — your edits are gone. Diff first (`references/cli.md`).
- Adding a registry namespace you don't control without reading what it
  installs: registry items can declare arbitrary file writes and dependencies.
  The CLI's trust model is "you trust what you configure" — treat a registry
  entry in `components.json` like a dependency review.
