# studio-forge

The local half of Launch Kit's Assets stage. It does the three things a
RocketRide pipeline cannot, because they need a browser and ffmpeg:

- `POST /probe` reads a live site: surface, ink, primary and accent colours
  with their evidence, the logo the site serves, the fonts it renders with, a
  screenshot.
- `POST /kit` renders the launch cards (Open Graph, square, story, README
  banner, app icon) from that palette and the app's words.
- `POST /reel` renders a 24 s vertical kinetic-typography reel from a script
  (the slot values `lk_studio.pipe` writes) in the brand's colours, masters it
  to -14 LUFS, and cuts a poster and a filmstrip.

Every POST returns a job id; `GET /jobs/:id` reports `status`, a human `step`
line, and the `result`. Files come back as URLs under `/files/`.

```bash
npm install          # once; reuses the Playwright Chromium the drives use
npm start            # 127.0.0.1:3500
node smoke.mjs https://your-site --reel    # probe, cards, reel, no app needed
node jobs-list.mjs                          # the job table
```

`GET /health` says whether ffmpeg and Chromium are present and which
concepts exist. Concepts live in `templates/<concept>/` as a tokenised
HyperFrames composition plus `slots.json`, the contract the app's prompt and
editor read. The reel needs `npx --yes hyperframes@0.8.3`, fetched on the
first render and cached.

Environment: `STUDIO_PORT` (3500), `STUDIO_HOST` (127.0.0.1), `STUDIO_OUT`
(`./out`, gitignored).

Design, the asset brainstorm and the open decisions: `docs/ASSETS-STAGE.md`.
