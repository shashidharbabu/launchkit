# Direction: Flight Paperwork

## Grounding

- **Subject:** the launch of a finished app. Not the app, not the runtime —
  the launch itself: venues, posts, replies, sign-offs, attribution.
- **Audience:** builders who shipped something real and dread marketing.
  They trust documents, checklists, and evidence; they distrust hype.
- **The product's single job:** turn a built app into a confident, honest
  launch plan — with a human approving every step.
- **Product law (from the spec):** assisted, never autonomous. Three human
  gates. Quality over volume — 5 right venues beat 50. Verified signals,
  honest-empty queues.

## The thesis

RocketRide's brand language is the **engineering document** — its homepage
direction is literally "the printed datasheet" (paper ground, ink, hairline
rules, IBM Plex, cobalt as blueprint ink). Launch Kit lives on the same
shelf, one document over: **if the runtime's homepage is the component
datasheet, Launch Kit is the flight paperwork.**

The metaphor is exact, not decorative. Mission control approves a launch by
polling stations for **GO / NO-GO** — that is precisely what Launch Kit's
three gates are. A launch plan is a procedure sheet. Attribution is
telemetry after liftoff. And IBM Plex is IBM's engineering voice — the
company that ran Apollo's computers. The vernacular writes itself; we just
have to set it well.

## Personality

Candid, procedural, calm, a little austere. The warmth comes from two
places only: **ember** (the one hot color in a cool paper world — launch
exhaust) and **honest copy** (see `voice.md`). Never from decoration,
gradients, or enthusiasm marks.

## Signature element: the Gate Slip and its stamp

The one thing a user should remember: **approval is a physical act.** Each
gate is a sign-off slip — a bordered sheet with a mono procedure header
(`GATE 01 — PROFILE`), the thing being approved, and an Approve action.
Approving stamps the slip **GO**: a 240ms stamp-down (scale 1.15 → 1.0,
opacity in), then the slip collapses to a signed row. Everything downstream
of an unapproved gate says so plainly instead of pretending to work.

Two supporting motifs, system-wide:

1. **Stamps** — status is a mono, uppercase, sharp-cornered, 1px-bordered
   chip: `GO` `HOLD` `NO-GO` `UNVERIFIED` `RUNNING`. Always with the word,
   never color alone.
2. **Provenance lines** — every AI-drafted artifact carries a small mono
   line stating where it came from and whether it was verified:
   `drafted from repo + site · aug 11` · `verified against thread`.
   Honesty is the brand; provenance is how the UI performs it.

## Structure

The six stages are a true sequence (gates unlock downstream stages), so
numbered procedure labels are *earned* here, not decorative:
`01 PROFILE → 02 COMMERCIAL → 03 ASSETS → 04 TARGETS → 05 SIGNALS → 06 PLAN`.
Use numbering only for the stage sequence — nowhere else.

## Dials

- Variance 5 — disciplined system, one bold element (the stamp ritual).
- Motion 3 — workspace restraint; motion explains state or rewards approval
  (see `motion.md`).
- Density 6 — worklist density, not BI density.
- Modes: light-first ("day console" — paper), full dark mode ("night
  console"). This is a workspace people use at midnight before a launch;
  unlike the print-emulating marketing site, it ships both modes.

## Rejected defaults

Named so nobody reintroduces them:

- Dark-mode-with-glow AI-infra look; acid-green-on-black accent.
- Warm cream + high-contrast serif + terracotta (the template answer).
- Purple gradients, glassmorphism, sticky glass nav.
- Fake urgency: countdowns, scarcity banners, waitlist-count theater
  (a generic "launch tool" pattern — Launch Kit sells honesty).
- Geist/Inter-by-default typography. Plex is a *choice* with brand and
  subject lineage; the 2026 default face is not.
- Emoji as icons; icon-only actions without labels.

One borrowed convention, kept deliberately: **sharp corners** come from the
RocketRide datasheet language (printed forms), not from the broadsheet
template — and we soften floating layers (4px) so the workspace still feels
operable, not brutalist.
