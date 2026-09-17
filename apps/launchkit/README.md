# Launch Kit

GTM-in-a-box for an app that is already live. Launch Kit reads your app, works
out who it is for and what it is worth, then writes the launch: the venues, the
posts for each one, and the people publicly asking for what you built.

Nothing is ever posted for you. Every stage stops at a human approval gate.

## What it does

Eight stages, each one a real artefact you can use or throw away.

1. **Understand.** Reads your site and repository and writes an app profile:
   what it does, who it is for, the proof it can point at, and a confidence
   score. You approve the profile before anything is built on it.
2. **Brand.** Extracts the business DNA, then drafts campaign angles. You choose
   one, and every later stage writes to it.
3. **Commercial.** Researches what comparable tools charge, proposes tiers you
   can edit or drop, and drafts the store listing.
4. **Targets.** Ranks 10 to 14 launch venues for this specific app, from a
   curated set plus whatever it finds, each with the venue's own posting rules
   and where they were read. A venue that sells the listing itself is left out.
5. **Assets.** Drafts a post for X, LinkedIn, Reddit, Product Hunt, Hacker News
   and a newsletter pitch, each written to that platform's rules and checked
   against them before you see it. A draft that fails a hard rule cannot be
   approved until it is fixed.
6. **Signals.** Searches public threads for people describing the problem your
   app solves, checks each one against the live thread, and drafts a reply that
   answers them first and mentions you once.
7. **Plan.** The whole launch as Markdown, with a tracked link per venue.
8. **Attribution.** Which venue actually sent the signups.

## What it will not do

- It never posts anything anywhere. It drafts; you approve; you post.
- It never invents a person, a customer, an origin story or a number. Where your
  profile has no fact, the draft leaves a placeholder in your words rather than
  filling the gap with fiction.
- It does not pretend a thin profile is a rich one. A short true post beats a
  complete invented one, and the draft tells you which rule it could not meet.

## Rules and gates

Every post is written against a per-platform rulebook and then checked by the
machine: length caps, banned phrasing, hashtags, links where a platform forbids
them, a vote ask on Product Hunt, marketing tone on Hacker News. Hard rules
block approval. Softer findings come back as warnings on the draft.

The rulebooks are editable in Settings, and every venue carries the rules that
were read for it and the date they were read, because a stale snapshot is the
difference between a launch and a ban.

## Getting started

Create a launch with your app name and site URL, add the repository if it is
public, and approve the profile. Each stage unlocks the next.

## Development

Open the `.rrapp` file to launch the App Builder: live preview on the Design
tab, identity and packaging on the Package tab, publishing on the Deploy tab.
