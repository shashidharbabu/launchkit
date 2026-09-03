---
name: rocketride-frontend
description: Choose and wire the right frontend library stack for a RocketRide app based on what kind of app it is — admin console, media/timeline editor, creative review surface, agent chat, or pipeline observability. Use this whenever starting a new RocketRide app frontend, adding a major new screen to an existing one, deciding which UI library to reach for, or when a frontend feels generic and needs the right primitives. Trigger it even when the request is phrased as "build the UI for X", "what should I use for the review queue", "add a waveform editor", or "make this dashboard better" — anything where the answer depends on which libraries fit the app archetype.
---

# RocketRide Frontend Stack Selection

Picking frontend libraries by habit produces the same generic dashboard for every
app. The problem is that a medical document review queue and a podcast waveform
editor have almost nothing in common at the interaction layer, even though both
are "a Next.js app with Tailwind." This skill routes to the right primitives by
archetype, so the interaction model matches what the app actually does.

## Workflow

1. **Classify the app** against the archetypes below. Most apps have one primary
   archetype and one secondary — e.g. Extractly is primarily an admin console
   with a document-viewer secondary; Podcasts is a media timeline with an agent-chat
   secondary.
2. **Read the reference file(s)** for the primary archetype, and the secondary if
   the screen in question belongs to it. Don't read all of them — each is
   self-contained.
3. **Apply the shared baseline** below regardless of archetype.
4. **Verify versions before installing.** Library APIs move fast. Check the actual
   current major version (`npm view <pkg> version`) rather than assuming, and read
   the docs for anything where the API surface matters. Never invent an API
   signature — if unsure how a library's hook or prop works, say so and check.

## Archetype router

| Archetype | Reference | Signature problem it solves | RocketRide apps |
|---|---|---|---|
| **Admin console** | `references/admin-console.md` | Dense tabular data, filtering, bulk actions, review queues, CRUD forms | Extractly, LaunchPad, PulseBoard |
| **Media timeline** | `references/media-timeline.md` | Audio/video scrubbing, non-destructive edit decision lists, region selection | Podcasts, Brandi |
| **Creative review** | `references/creative-review.md` | Generated-asset grids, side-by-side variants, approve/reject at volume | Influenza, hackathon judging |
| **Agent chat** | `references/agent-chat.md` | Streaming responses, tool-call display, conversational editing of state | Extractly Copilot, LaunchPad Co-Pilot, Podcasts chat mode |
| **Pipeline observability** | `references/pipeline-observability.md` | Live per-stage execution tracing, DAG rendering, run history | FireScout-style tracing, PulseBoard, any `.pipe` visualizer |

If an app doesn't fit any of these, say so plainly rather than forcing it into the
nearest box — and describe what the actual interaction primitive is, so a new
reference file can be written for it.

## Shared baseline

Every RocketRide app frontend starts here. Don't re-litigate these per app;
consistency across the portfolio is worth more than local optimization.

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.** shadcn is
  copy-in-source, not a dependency, so components can be edited freely — do edit
  them rather than wrapping them in layers of props.
- **Server Components by default.** Reach for `"use client"` only at the leaf that
  actually needs interactivity. A table that fetches on the server and hydrates
  only its filter controls is dramatically faster than a fully client-side one.
- **TanStack Query** for anything the server owns and the client caches. **Zustand**
  only for genuinely client-owned state that spans components (editor selection,
  playback position). Don't reach for a global store when `useState` and URL state
  cover it.
- **URL as state** for anything shareable or reloadable — filters, selected record,
  active tab. `nuqs` gives typed search-param state hooks that survive refresh and
  make links pasteable into Slack, which matters a lot for review-queue workflows.
- **`react-hook-form` + `zod`** for forms, with the same zod schema validating on
  the server. One schema, two enforcement points.
- **`sonner`** for toasts, **`cmdk`** for command palettes. Add a command palette
  early in any app with more than about six screens — it's the cheapest
  power-user affordance there is, and RocketRide's ICP is professional developers.

## Design posture

RocketRide's ICP is professional builders shipping production systems. That has
direct UI consequences:

- **Information density over whitespace.** Pro tools earn trust by showing state,
  not by hiding it. Show the confidence score, the run duration, the node that
  failed. A cramped-looking screen that answers the user's question beats an airy
  one that doesn't.
- **Keyboard paths for repeated actions.** Anything a user does more than ten times
  a session needs a shortcut — approve/reject, next item, save, run.
- **Make pipeline execution legible.** This is the actual product differentiator.
  When a RocketRide pipeline is running underneath a screen, surface stage-level
  progress rather than a generic spinner. See `references/pipeline-observability.md`
  even when it isn't the primary archetype.
- **Empty and error states are not optional.** Every list gets a real empty state
  with the next action in it. Every pipeline failure surfaces which node failed and
  the error, not "something went wrong."

## Applying this to a new app

When the app is still an idea, produce a short **frontend architecture note**
before writing code — it slots into the idea + architecture doc that gets reviewed
before development starts:

```
## Frontend architecture — <app name>
**Primary archetype:** <one of the five>  **Secondary:** <or none>
**Screens:** <list, each mapped to its archetype>
**Libraries beyond baseline:** <name — one line on why each is needed>
**Pipeline surfaces:** <where .pipe execution becomes visible to the user>
**Riskiest interaction:** <the one thing most likely to need a rebuild>
```

Keep it to a page. Its job is to make the library choices arguable before they're
load-bearing, not to specify the whole UI.
