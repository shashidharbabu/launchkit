---
name: uppbeat
description: Source and integrate royalty-free music and sound effects from Uppbeat (uppbeat.io) — the creator-focused music licensing platform from Music Vine — including what each tier's license actually permits (free tier's per-video Uppbeat Credit, Premium's no-attribution safelisting, what client work and paid ads require), and the web integration discipline for a launch-page context: audio never autoplays, the download → compress → embed pipeline, and file-format/weight rules. Use this whenever a task involves uppbeat.io in any form, choosing background music or SFX for a product demo video, launch trailer, or recorded walkthrough, questions like "can I use this track commercially / for a client / in an ad", adding music or sound to a website or landing page (usually the answer is a restrained no — this skill documents why and the exceptions), embedding a soundtracked video with <video muted loop playsinline>, or clearing a YouTube copyright claim on Uppbeat music. Also use it BEFORE committing any downloaded audio to a repo — redistribution is the thing the license never allows.
---

# Uppbeat

Uppbeat (uppbeat.io) is a **royalty-free music and SFX subscription platform**
for content creators, run by the licensing company Music Vine. It is a website
with human-driven search and download — no npm package, no public API, no CLI.
A human browses, previews, downloads an audio file, and (on the free tier)
receives an attribution snippet. What you get is a **license to use the track
in your content**, never ownership of the file.

This skill owns two things: **what the license actually permits per tier**
(details and exact figures in `references/licensing.md`) and **integration
restraint** — what audio is allowed to do on a web page, and the asset
pipeline when it earns its place (`references/pipeline.md`).

## Licensing in one honest paragraph

As of Aug 2026 (verify at uppbeat.io/pricing before anything invoiced): the
**free tier** gives 3 downloads/month from roughly a quarter of the catalog,
and every download requires pasting that track's unique **Uppbeat Credit**
into the description of the one video it clears — monetized personal YouTube
is fine, forgetting the credit means copyright claims. **Premium**
(~$6.99/month billed yearly) unlocks the catalog, drops attribution, and
safelists your connected channels against Content ID. **Client work and paid
advertising are NOT covered by free or Premium** — that requires the business
tier. **No subscription covers broadcast TV/radio, cinema, or events**, and
**nothing ever permits redistributing the audio files themselves** — which
includes committing raw downloads to a public repo or re-hosting tracks as a
site's downloadable assets. Full tier table, edge cases, and the credit
mechanics: `references/licensing.md`.

## The restraint rules — audio on a launch page

Audio on the web is the autoplay-video problem with less tolerance. The rules,
parallel to how `prefers-reduced-motion` governs motion:

1. **Nothing autoplays with sound. Ever.** Browsers block it, users hate it,
   and it torpedoes the credibility a launch page exists to build.
2. **Sound is user-initiated and user-terminated.** An explicit unmute/play
   control, visible state, and it stops when the element leaves the viewport.
3. **Muted-by-default is the only default.** A demo loop is
   `<video muted loop playsinline autoplay>` — the soundtrack exists for the
   users who opt in.
4. **Respect `prefers-reduced-motion` as a proxy for sensory restraint** — a
   user asking for less motion should not get a pulsing equalizer either.
5. **Music is not polish.** If a page "feels flat", the fix is motion,
   typography, or content — see **motion-primitives**, **frontend-design**,
   **taste-skill** — not a background track. There is no legitimate ambient
   soundtrack for a marketing page.

## Legitimate uses in a web/launch context

- **Product demo videos** — a track under a screen-capture walkthrough,
  mixed low (dialog/VO −6 to −12 LUFS above music).
- **Launch trailers** — published to YouTube/socials, embedded on the page.
- **Recorded walkthroughs and tutorials** — consistent bed music across a
  series reads as production value; pick one artist/mood and stay there.
- **Podcast intros/beds** — podcasts are a permitted medium.
- **SFX in produced video** — whooshes and UI clicks inside a *video*. Not
  sitewide UI sounds on the page itself; the web stopped doing that for a
  reason.

The pipeline for all of these — download, loudness-normalize, compress, mux
into the video, embed with the right attributes, weight budgets — is in
`references/pipeline.md`.

## When not to use Uppbeat

- **Paid ad campaigns or client deliverables on a personal tier** — that's a
  license breach with a client's name on it. Upgrade tier or use properly
  licensed commissioned music.
- **Broadcast, cinema, events** — outside every Uppbeat subscription; Music
  Vine sells those licenses separately.
- **When silence works.** Most launch pages ship zero audio and lose nothing.
- **Music as a product feature** (meditation app beds, game soundtracks
  shipped in-app): "online games or applications" appear in permitted media,
  but shipping extractable audio files inside an app edges into
  redistribution — read `references/licensing.md` and when in doubt ask
  Uppbeat support in writing.
- **AI training or audio remix/resale of any kind** — redistribution, never
  allowed.

## Anti-patterns

- Committing downloaded `.wav`/`.mp3` masters to a git repo (public repo =
  redistribution; any repo = bloat — keep sources in asset storage, ship only
  the compressed, muxed output).
- Hotlinking Uppbeat's CDN URLs instead of self-hosting your licensed,
  compressed derivative inside your content.
- Free-tier track in a video, credit line forgotten — the claim lands on the
  client's channel, not yours.
- An unmuted `autoplay` attribute anywhere. Browsers will block it and the
  fallback behavior differs per engine; design for muted-first instead.
- Swapping tracks per section of one video/page: one bed, one mood — see
  the selection notes in `references/pipeline.md`.
