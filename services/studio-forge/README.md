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
node verdict-smoke.mjs [--no-probe] [--images|--no-images] [--voice|--no-voice]   # the Verdict film with hand-written copy (photographs, voice), plus a seam contact sheet
python3 frames.py reel.mp4 sheet.jpg 0.4,1.0,1.9   # frames at those seconds, five per row
node site-copy.mjs https://your-site         # the visible copy the probe hands to the prompt
```

`GET /health` says whether ffmpeg and Chromium are present and which
concepts exist. Concepts live in `templates/<concept>/` in one of two
shapes: a module (`concept.mjs` exporting `spec` and `build`, the composition
generated from the script so it can draw scenes; `verdict` is one) or a
tokenised HyperFrames composition plus `slots.json` (`signal`, kept for
reference). Either way `spec.slots` is the contract the app's prompt and
editor read. The reel needs `npx --yes hyperframes@0.8.3`, fetched on the
first render and cached.

Environment: `STUDIO_PORT` (3500), `STUDIO_HOST` (127.0.0.1), `STUDIO_OUT`
(`./out`, gitignored). Secrets go in `./.env` (gitignored, loaded at start):
`OPENAI_API_KEY` turns on `POST /images` (photographs for the film and the
cards, `gpt-image-2` by default, `STUDIO_IMAGE_MODEL` to change it). The key
stays on this machine; the browser only ever sees the files.

Voice (`POST /voice`, open source, no key): install one engine next to the
forge and restart it. Chatterbox (MIT, expressive): `uv venv --python 3.12
.venv-tts && VIRTUAL_ENV=.venv-tts uv pip install chatterbox-tts "setuptools<81"`
(setuptools 81 dropped `pkg_resources`, which Chatterbox's watermarker imports)
(first run downloads the model). Kokoro (Apache 2.0, fast): `npm install
kokoro-js`. The first present wins; `STUDIO_TTS=kokoro` chooses. The reel
takes the spoken lines and ducks the music under them.

Design, the asset brainstorm and the open decisions: `docs/ASSETS-STAGE.md`.
