# Uppbeat asset pipeline — from download to a shipped page

The chain: **human downloads → normalize/compress → mux into video → embed
muted → user opts into sound.** Claude Code owns everything after the
download; it cannot browse or download from Uppbeat itself. Say which track
brief you need ("60–90s, mid-tempo, no vocals, builds once") and wait for the
file — don't scaffold imports for audio that doesn't exist yet.

## Step 1 — What arrives

Uppbeat serves MP3 (and WAV on paid tiers for some assets). Treat the download
as a **master**: keep it in asset storage (not the repo), and derive
everything you ship from it.

## Step 2 — Trim, normalize, compress (ffmpeg)

```bash
# Trim to the segment you need, fade both ends, loudness-normalize.
# -14 LUFS is the streaming-platform convention; a bed under narration
# should sit well below the voice, so duck the music at mix time instead
# of normalizing it hot.
ffmpeg -i track-master.mp3 -ss 12 -t 45 \
  -af "afade=t=in:d=1.5,afade=t=out:st=43:d=2,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:a aac -b:a 128k track-bed.m4a
```

- **AAC 128 kbps** is the ship format for web video audio — transparent for
  bed music, ~1MB/min. 96k is acceptable for speech-over-music mixes; skip
  Opus-only outputs unless you control the player (Safari history makes AAC
  the safe default in MP4 containers).
- Never ship the WAV. Never ship 320k MP3 for a background bed.

## Step 3 — Mux into the video

```bash
# Video already compressed? Copy it, encode only audio.
ffmpeg -i demo-silent.mp4 -i track-bed.m4a \
  -c:v copy -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest demo.mp4
```

Ship **one MP4 with the soundtrack muxed in**, not a video element plus a
separate `<audio>` element you try to sync in JS — sync drifts, and muted
autoplay policy only has to be satisfied once on the single element.

## Step 4 — Embed

Ambient demo loop (autoplay allowed *because* muted):

```tsx
"use client";
import { useRef } from "react";

export function DemoLoop() {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <div className="relative">
      <video
        ref={ref}
        muted autoPlay loop playsInline preload="metadata"
        poster="/demo/poster.jpg"
        className="w-full rounded-lg"
        aria-label="Product demo (muted). Use the sound button to enable audio."
      >
        <source src="/demo/demo.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        className="absolute bottom-3 right-3 rounded bg-black/60 px-3 py-1.5 text-sm text-white"
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          v.muted = !v.muted;               // user gesture → unmute is allowed
          if (!v.muted) v.currentTime = 0;  // restart so the track makes sense
        }}
      >
        Sound
      </button>
    </div>
  );
}
```

Non-negotiables:

- `muted` + `playsInline` or mobile Safari won't autoplay at all.
- **Pause offscreen** (battery + courtesy): an `IntersectionObserver` calling
  `video.pause()` / `video.play()` at ~0.25 threshold.
- **Reduced motion:** when `matchMedia("(prefers-reduced-motion: reduce)")`
  matches, don't autoplay — show the poster with a play button. A user
  refusing motion hasn't asked for a silent movie either.
- Launch trailer with sound as the *point*: don't autoplay at all. Poster +
  play button (or YouTube embed via `next/dynamic`, below the fold). Sound
  starts because the user pressed play — this also satisfies the restraint
  rules and every browser policy at once.
- Free-tier track? The Uppbeat Credit must be visible on the page near the
  player (see `references/licensing.md`).

## Weight budget

| Asset | Budget | Notes |
|---|---|---|
| Ambient hero loop (10–20s, muted) | ≤ 2–4 MB | Consider whether it needs audio at all — a muted loop with no track shipped is smaller and honest |
| Demo video w/ bed (60–90s) | ≤ 10–15 MB, lazy-loaded | `preload="metadata"`, below-the-fold `loading` discipline |
| Standalone audio (podcast embed) | ~1 MB/min AAC 128k | Only with visible player controls |

Videos live in `public/` (or a CDN/bucket for anything over a few MB) — never
imported through the JS bundle. `preload="metadata"` keeps initial page cost
to a few KB until playback.

## Track selection notes (what to tell the human to look for)

- **One bed per video, one mood per page.** Track changes read as edits the
  content didn't earn.
- Instrumental over vocal for anything with narration or on-screen text.
- Loops: pick tracks Uppbeat tags as loopable, or trim on a musical bar and
  crossfade the seam (`afade` above); a hard loop seam is more noticeable
  than no music.
- SFX: use sparingly inside the video edit; sitewide UI sounds are not a
  thing to build (SKILL.md).

For playing designer-produced *motion* assets (Lottie/MP4 from motion tools),
the **jitter** skill owns the player-selection and embed patterns; this file
only governs the audio side.
