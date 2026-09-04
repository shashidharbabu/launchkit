# Direction: Gantry

## The design read

Reading this as: **a B2B product console plus a landing page, for technical founders taking
an app to market, in a calm, operator-grade language**, at the level of restraint of the best
current product tools, with its own identity rather than a borrowed one.

Dials (the taste-skill scale, 1 to 10):

| Surface | Variance | Motion | Density |
| --- | --- | --- | --- |
| Landing page | 6 | 5 | 3 |
| Application | 4 | 4 | 5 |

## Grounding

- **Subject:** the launch of a finished app. Not the app and not the model. The launch:
  who it is for, what it costs, where it goes, what gets posted, who is already asking.
- **Audience:** builders who shipped something real and now have to market it, and the
  clients who will judge the product by how it looks on the first screen. They trust
  evidence, checklists, and calm. They distrust hype, glow, and cleverness.
- **The product's single job:** turn a shipped app into a launch plan a human approved.
- **Product law:** assisted, never autonomous. Three human gates. Quality over volume.
  Verified signals. An empty queue is honest.

## The thesis

A rocket does not launch itself. Before liftoff it stands in a **gantry**: the structure
that holds it, services it, and swings away only when a human says go. That is exactly what
Launch Kit is. The system holds every draft in place; the builder decides when it releases.

So the product is drawn as a gantry:

- The seven stages are **nodes on one vertical track** in the rail. Order is real here, so
  the numbering is earned. The track is the only structural line in the app.
- The three approvals are **gates**: panels with one verb. Approving plays a release and the
  panel settles into a signed row.
- The accent is **flare**, the one hot color in a cool graphite world. It is spent on the
  moments of release: the gate verb, a running job, a selection, a focus ring.

The metaphor is structural, not decorative. Nothing in the UI is drawn to look like a rocket.

## Personality

Candid, calm, precise, quietly confident. The warmth comes from three places only: the
legibility of the type, the flare accent, and honest copy. Never from decoration,
gradients, or enthusiasm marks.

## Signature element: the Gate

The one thing a person should remember: **approval is a physical act.** A gate is a panel
with a numbered glyph, a status stamp, the thing being approved, its provenance, and a
single flare button. Pressing it sweeps a line across the top of the panel, springs an
"Approved" seal into view, and collapses the panel to a signed row. While that plays,
nothing else moves. Everything downstream of an unsigned gate says so plainly instead of
pretending to work.

Supporting motifs, system-wide:

1. **Stamps.** Status is a soft pill with fixed vocabulary: Approved, Needs review, Failed,
   Unverified, Running, Queued, Not started. Always the word, never the color alone.
2. **Provenance lines.** Every AI-drafted artifact carries a small mono line stating where
   it came from and whether it was verified. Honesty is the brand; provenance is how the UI
   performs it.
3. **The rail.** One left column does all navigation: four destinations, the current
   launch's stages on the gantry track, recent launches. The content area never repeats it.

## Type as personality

Instrument Sans carries the product. It is an engineered grotesque with open apertures and
a generous x-height, so 16px UI text and 17px reading text stay legible on a client's
laptop across a table. Headlines are set tight and semibold; emphasis inside a headline is
the same family in italic, never a second face. Geist Mono is reserved for data: refs,
counts, timestamps, code. No uppercase tracked labels anywhere.

## Atmosphere: the pad, drawn live

The product's world is a launch pad before liftoff, and the front doors show it. The
**ambient field** (`foundations/atmosphere.md`) is a small shader that paints three ridges
of noise under a sky, a horizon glow in flare, a faint drifting dot grid, and film grain,
from the tokens: dawn in the light theme, night in the dark one. It moves slowly and never
repeats. It sits behind the landing hero, the landing's closing band, and the empty chat
home, and it is never behind a work surface. It is the one atmospheric device in the
product, and it is where the product's boldness is spent; everything on top of it stays
quiet.

## Structure

- **Landing:** the field full-bleed behind a left-aligned hero (copy on the sky, no
  photograph), a sticky-heading timeline of the seven stages on the gantry track, a
  full-width band with a **real, interactive component preview** (the Gate and the chat
  from the product on sample data), a four-cell principles bento with one photograph and one
  tinted cell, an accordion of questions, and a closing band on the field at night with one
  action. No eyebrows. One accent. No marquee.
- **App:** rail + content. Every page opens with a page header (title, one sentence,
  actions). Pages and stages enter with a 200ms rise from a route template.
- **Home is a conversation.** The navigator chat is the first screen of the console:
  greeting, one question, the composer at optical centre, starters drawn from the person's
  real launches, and recent launches beneath.

## Rejected defaults

Named so nobody reintroduces them:

- The paper-and-ink "printed form" look: zero-radius boxes, hairlines around everything,
  mono uppercase procedure labels (`GATE 01`), stamps drawn as bordered chips. It read as a
  hackathon build and it was hard to read.
- Cobalt links plus orange buttons plus a green/amber/red trio: five hues competing. Links
  are ink now; buttons are graphite; the accent is one color.
- Top tab navigation plus a second horizontal stage strip. The rail replaced both.
- Purple gradients, glassmorphism, neon glows, acid green on black.
- Warm cream + serif + terracotta.
- Inter or Geist Sans as the text face. Instrument Sans was chosen for legibility and
  distinctiveness; Geist Mono stays for data.
- Emoji as icons; icon-only actions without labels; decorative status dots; em-dashes.
- Version stamps, countdowns, waitlist counters, "quietly used by" social proof.

## What was kept

- The seven stages, three gates, and the fixed vocabulary of the product.
- The photographs (launch pad, visor, pre-launch): real imagery, cool-toned, on brief.
- The honest-empty and provenance disciplines, now drawn in the new language.
