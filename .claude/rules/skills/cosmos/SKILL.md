---
name: cosmos
description: Extract design direction from Cosmos (cosmos.so), the visual discovery and moodboarding platform ("Pinterest for creatives") — build a moodboard vocabulary before starting a design, and run the human+Claude reference loop where the user drops Cosmos links or screenshots and Claude translates them into named design decisions (layout grid, type scale, spacing rhythm, motion choreography, color temperature) for Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`). Use this whenever a design task starts without a visual direction, when someone says "I want it to feel like this" with a Cosmos link or moodboard, when a cosmos.so URL or cdn.cosmos.so image appears in the conversation, when a project needs a moodboard or reference-gathering phase, when the user wants to browse for inspiration before building, or when scattered screenshots need to be distilled into one coherent direction.
---

# Cosmos

Cosmos (cosmos.so) is a **visual discovery and moodboarding platform** — save
images into "clusters" (their word for boards), follow other people's taste,
search a large pool of photography, art, graphic design, and interfaces. It is
an iOS app plus a web app. **An account is required to save, cluster, or
search; browsing curated categories works logged out.** Much of the site is
JS-hydrated: programmatic fetches of `/discover` return skeleton placeholders,
so the browsing seat belongs to the human. The homepage advertises search by
color, visual similarity, and AI-content labeling — these are account/app
features; do not rely on them programmatically.

What Claude CAN do: fetch individual cluster pages and category pages (they
render enough to read), and view images served from `cdn.cosmos.so` directly.
What Claude CANNOT do: search Cosmos, save anything, or see what the user sees
in their logged-in feed. That split shapes the skill:

1. **Selection** — direct the human to the right shelf of Cosmos and tell them
   what to bring back.
2. **Translation** — turn what they bring back (links, screenshots) into named
   design decisions and implementation notes.

## Selection — where to send the human

- Entry point: `https://www.cosmos.so/discover` (search box + featured clusters).
- Category shelves (verified, browsable logged out): `https://www.cosmos.so/explore`
  (Featured), plus `/explore/ui-ux` (Interfaces), `/explore/graphic-design`,
  `/explore/typography`, `/explore/branding`, `/explore/motion`, `/explore/art`,
  `/explore/architecture`, `/explore/interior-design`, `/explore/technology`,
  `/explore/cinema`, `/explore/fashion`, `/explore/nature`, `/explore/portraiture`,
  `/explore/quotes`, `/explore/emotion`, `/explore/spirituality`, `/explore/shop`,
  `/explore/weddings`.
- Clusters live at `cosmos.so/<username>/<cluster-slug>`. Ask the user to send
  cluster URLs or individual image links — both are fetchable.
- For UI work, send them to `/explore/ui-ux` and `/explore/typography` first;
  Cosmos skews heavily toward photography and art everywhere else.

Ask for **5–9 references, one feeling**. Fewer than 5 is an anecdote; more than
9 is a landfill. Ask the user to say in one sentence what the board is *for*
("the checkout should feel like this calm interior photography").

## Translation — reference to named decisions

Cosmos boards are mostly *not* UI. The cardinal move is translating mood into
system, never layout into layout.

1. **Per reference, extract four observations** (write them down, named):
   color temperature (warm/cool, saturated/muted, one dominant hue?), contrast
   structure (soft tonal vs hard graphic), density (how much air; where the
   mass sits), texture (grain, gloss, flatness, material).
2. **Vote across the board.** Keep what 5+ references agree on; name and drop
   the outliers out loud ("two neon references dropped — board reads muted").
3. **Write the direction as 5 named decisions**: palette temperature + neutral
   scale, type scale + weight contrast, spacing rhythm (tight editorial vs airy
   gallery), layout gravity (centered, left-massed, scattered grid), motion
   temperament (still / drift / snap).
4. **Implement**: palette becomes Tailwind theme tokens in `tailwind.config.ts`
   (never inline hexes); airy boards → generous `space-y-24`/`py-32` rhythm and
   a loose grid; dense boards → tight leading and rule-lines. Motion
   temperament maps to framer-motion defaults: drift = long durations
   (0.8–1.2s) + `easeOut` opacity/translate; snap = 0.2–0.3s + slight scale.
   Photography-heavy direction usually means the build needs real art
   direction on images (`next/image` with fixed aspect crops), not decoration.
5. **Trace every decision to a reference.** If a decision cites no reference,
   it's a default wearing a costume — flag it.

Hand off from here: **frontend-design** for the overall aesthetic build,
**ui-ux-pro-max** to pick concrete palettes/font pairings that satisfy the
named temperature, **taste-skill** when the deliverable is a landing page,
**motion-primitives** for implementing the motion temperament, **haikei** if
the direction calls for a generated background wash.

## When not to use

- **Direction already exists.** If the project has a design system or the
  brief names one, don't re-moodboard; go build.
- **You need UI mechanics, not mood.** Hero layouts → **supahero**; what's
  current → **recent-design**; case-study narrative → **pafolios**.
- **No human in the loop.** Claude cannot search Cosmos. Without a user to
  browse and drop links, use the local **ui-ux-pro-max** database instead.
- **Deadline is now.** Moodboarding is a pre-design phase; it does not belong
  inside a bug fix or a copy change.

## Anti-patterns

- **Copying pixels instead of extracting patterns.** Recreating one Cosmos
  image as a hero background is theft of the wrong asset; the extractable
  value is temperature, density, contrast — never the composition itself.
- **Mixing three boards into incoherence.** One board, one feeling, one
  direction. If the user brings brutalist type AND soft pastel interiors AND
  neon 3D, force a choice before writing any code.
- **Treating photography as a layout spec.** A photo's rule-of-thirds is not
  a CSS grid. Translate mood; design the layout on its own merits.
- **Claiming Cosmos features you can't see.** Never assert what's in the
  user's feed or claim a search result; ask them to browse and report.
- **Moodboarding forever.** One selection round, one vote, one written
  direction — then build. A second board is only justified if the first one
  failed in a nameable way.
