# The Assets stage (branch `short-video`)

A new stage after Social Launch. It turns everything Launch Kit already knows
about an app (the approved profile from the site and the repo, the Business
DNA from the Brand stage, the campaign angle the builder chose) into the
things a launch needs that are not words: a brand kit, launch cards, and a
short vertical video.

Status: v1 on the `short-video` branch. Not on main, not deployed.

## 1. Where the reel toolchain came from, and what it can do without keys

`vendor/reel-creation` (upstream nihalnihalani/reel-creation) was tested
standalone on 2026-09-08:

| Check | Result |
|---|---|
| `make doctor` | 12 of 12 hard checks pass; warnings only for the two API keys, the `google-genai` package, and the empty `video-use` submodule |
| `make aithon-english` (Pipeline A re-assembly from checked-in assets) | 34.5 s 1080x1920 H.264 reel, mastered to -14 LUFS, frame-identical to the checked-in final; 1 m 38 s wall clock |
| `npx --yes hyperframes@0.8.3 render` in `hyperframes/aithon-v4-signal` (Pipeline B) | 24 s 1080x1920 reel, 3.1 MB, 1 m 12 s wall clock |
| Quality read (filmstrips of seven finished reels) | Clean typography, legible at phone size, well-timed seams, brand lockup on every ending |

What needs keys we do not have:

- New generative footage (`gen_clip.py`) needs `GEMINI_API_KEY`.
- New voice-over and music (`vo_gen.py`, `/v1/music`) need `ELEVENLABS_API_KEY`
  on a paid tier.

What works with no key at all: the kinetic-typography pipeline (HyperFrames
plus GSAP, rendered by a local Chromium and ffmpeg). That is the path v1 is
built on, because it produces a finished, on-brand reel from text alone.

What the owner's OpenAI key adds (2026-09-08): photographs. The forge makes
four of them per launch with `gpt-image-2` and puts them behind the film and
onto the platform images (section 5b). The key lives in
`services/studio-forge/.env` (gitignored) and never reaches the browser.

Music note: the bundled track (`music.mp3` in the Signal template) was
generated with ElevenLabs Music by the upstream author. Reusing it inside
Launch Kit for other people's apps is an owner decision (see section 7).

## 2. The brainstorm: what assets a launch actually needs

Grouped by what they are made from. "Observed" means taken from the live site
or the repo, never invented; that is the same rule every other stage follows.

**Identity (observed, then derived)**

1. Brand palette: the site's surface, ink, primary and accent colors, read
   from the page (theme-color, computed body and button colors, `:root`
   custom properties, and a screenshot quantization as a check). From the
   primary, a 50 to 950 scale plus contrast-checked role assignments (text on
   surface, ink on primary, accent on dark).
2. Mark: the site's own logo (header image or inline SVG, apple-touch-icon,
   favicon, og:image) with the best candidate picked and the rest shown. If
   the site has none, a set-in-type monogram in the brand colors, labelled as
   generated.
3. Type: the font families the site actually uses (computed on `h1` and
   `body`), with the reel and cards falling back to the kit's own faces.

**Launch cards (rendered from the kit)**

4. Open Graph card, 1200x630, for link previews everywhere.
5. Square card, 1080x1080, for LinkedIn and Instagram feed posts.
6. Story card, 1080x1920, the poster frame for the reel and for Stories.
7. README banner, 1280x640, for the repo's top of page.
8. App icon set, 512 and below, derived from the mark.

**Video (rendered from the script)**

9. The launch reel, 24 s, 1080x1920, kinetic typography in the brand palette,
   written in the Business DNA voice from the profile's real claims. One
   concept in v1 ("Signal": an incoming-transmission decode); the four other
   upstream concepts (Platform departures board, The Fork, Vanishing Day,
   User to Builder) are forkable the same way.
10. A 4K variant of the same reel (the renderer supports `--resolution
    portrait-4k`), for platforms that upscale badly.
11. A site walkthrough clip: a scripted scroll of the live site captured by
    the same headless browser, cut into a reel as real footage. Needs no key.
    Not in v1.
12. Generative footage plus voice-over (Pipeline A). Blocked on the two keys.

**Words that ship with the visuals**

13. Per-post thumbnails: one card per approved Social Launch post carrying
    its hook line, sized for X and LinkedIn.
14. A one-page brand sheet in Markdown: palette with roles, mark usage,
    type, tagline, boilerplate, links. Pasteable into a press kit or a repo.
15. Shields-style README badges in the brand color ("Launched with Launch
    Kit", "Live on the RocketRide App Store").

v1 builds 1 through 9. The rest are listed so the stage has a roadmap.

## 3. Architecture

Everything in Launch Kit runs in the browser against RocketRide pipelines and
the appState store. The RocketRide server has no Chromium and no ffmpeg, so
rendering cannot be a pipeline node. The stage therefore has two halves:

```
browser (apps/launchkit)                      local machine
─────────────────────────                      ──────────────────────────────
api.runStudio('probe')  ── HTTP ──▶  studio forge  POST /probe   (Playwright: screenshot, palette, logo, fonts)
api.runStudio('kit')    ── HTTP ──▶               POST /kit     (cards rendered from HTML templates)
api.runStudio('script') ── pipe ──▶  lk_studio.pipe (Claude via RocketRide: writes the reel's 30 slots)
api.runStudio('reel')   ── HTTP ──▶  studio forge  POST /reel    (HyperFrames render, loudnorm, poster, filmstrip)
```

- **Studio forge** is `services/studio-forge`, a dependency-light Node HTTP
  service. It owns the tokenised reel template (`templates/signal`), the
  card templates, the palette maths, and the job queue. Files it produces are
  served back at `/files/...`; the store keeps URLs and the small JSON, never
  media bytes.
- **`lk_studio.pipe`** is a toolless LLM pipe (the `lk_rescore.pipe` shape).
  The whole prompt travels in the question (`buildStudioQuestion`): the
  profile, the Business DNA when present, the chosen campaign angle, and the
  slot contract with per-slot character limits. The pipe returns the slots as
  JSON; the app clamps lengths and records what it clamped.
- **Store**: one new table, `studio`, rows of kind `probe`, `kit`, `script`,
  `reel`. Scripts version like assets do and can be edited before rendering.
  A reel can be approved; that is the stage's "go" state.

The forge URL lives in Settings (default `http://localhost:3500`) with a
health check that reports Chromium, ffmpeg and HyperFrames availability.

Why a local service and not a pipeline: the render needs a browser and
ffmpeg, both absent from the pipeline runtime. Why not the n8n or HTTP tool
nodes: they still need something on the far end that can render, which is
this service. The same service can later run in a container with the same
API; the app does not change.

## 4. Running it locally

```bash
# once
cd services/studio-forge && npm install

# every session (keep it running; it binds 127.0.0.1:3500)
npm start

# then the app, as usual
cd apps/launchkit && npx rsbuild dev -c rsbuild.preview.mts     # :3400
```

Playwright's Chromium is shared with the drive scripts
(`launchkit-src/frontend`); `npm install` in the forge reuses the same
Playwright version, so no extra browser download is needed. ffmpeg comes from
Homebrew. HyperFrames is fetched by `npx` on first render and cached.

Smoke test without the app:

```bash
curl -s localhost:3500/health
curl -s -X POST localhost:3500/probe -H 'content-type: application/json' \
  -d '{"project_id":"demo","site_url":"https://hackathon-judge-aid.onrender.com"}'
```

## 5. The reel: the Verdict concept

The first cut (the "Signal" template, a re-skin of the upstream event reel)
was judged frame by frame and rejected: twenty-four seconds of words in a
hacker skin, filler beats, no problem, no product on screen. It stays in the
repo as `templates/signal` for reference; the stage renders **Verdict**.

Verdict is a problem-then-solution launch film, 24 s, 1080x1920, generated
by `services/studio-forge/templates/verdict/concept.mjs`: the composition is
built from the script rather than substituted into a fixed page, so it can
draw scenes. It hangs on the duel track (`m_v3_duel`, trimmed): a cold string
build to 6.5 s, the drop, a groove to 19, a dip, an impact at 20.0, a fade.

| Time | Beat | What is on screen |
|---|---|---|
| 0.0 | The scene | one calm line: when and where the problem happens |
| 1.6 | The load | three scenario numbers slam in (submissions, judges, minutes), the last in the alarm colour |
| 3.4 | The pile | cards rain into a heap; a sagging caption says what must be done to each by hand |
| 5.0 | The doubt | two questions the person cannot answer, cold and sagging, rack-focus swap |
| 6.1 | The cost | one mocking line in the alarm colour |
| 6.5 | The drop | the frame collides, the canvas turns to the brand, the app name lands with a glow and a stamped line |
| 8.5 | Step one | the product's real input field, three lines type themselves, the real button |
| 10.5 | Step two | rows pass under a scan line and receive the product's real verdict chips |
| 12.5 | Step three | a commit timeline, a date marker, pre-event commits turn alarm-red, the penalty chip |
| 14.5 | The product | the live screenshot in a browser frame, pushing in |
| 16.6 | The payoff | one true number and unit, a timer counting down, a checklist ticking |
| 18.6 | Breath | near-empty, a cursor, one quiet line |
| 20.0 | Arrival | the call to action on the impact, the host as a chip |
| 22.0 | Lockup | who it is for, the name, the tagline, the host, held in the fade |

Character comes from a colour arc (cold canvas, cold grey type and an alarm
colour before the drop; the brand palette after) and from drawing the
product's own mechanics rather than describing them. The copy is written by
`lk_studio.pipe` from the profile, the Business DNA and the site's own copy
(the probe now reads labels, buttons and categories from the live page and
hands them to the prompt as SITE_COPY), so the chips say "Significant,
Moderate, Less, None" because the site does.

Fitting: every slot has a face, a base size and a line budget. Display lines
that may wrap get two rows before they shrink; stamps and the call to action
stay on one line and shrink instead. The slot examples in the concept
describe an unrelated product on purpose, so the model cannot borrow them.

Limits: the model occasionally overruns a slot by a character or two. When it
does, the app sends only the offending slots back to `lk_studio.pipe` for a
rewrite inside the limit (a second, small ask, a few seconds) and records them
as `repaired`. Only if that fails does the mechanical clamp run, and it now
cuts the way an editor would: at a sentence end when one leaves enough room,
otherwise at a word, dropping a dangling "by" or "the" and keeping the line's
own end mark. The same clamp lives in the forge and in the app's editor.

Palette: the forge maps the brand onto the film. The accent is lightened
until it clears 5.5:1 on the canvas, the canvas takes a faint tint of the
brand hue, and the alarm colour is red unless the brand itself is red (then
amber).

Quality loop: `node verdict-smoke.mjs --no-probe` renders the film with
hand-written copy in about fifteen seconds and cuts a frame just after every
cut (`frames.py`) into a contact sheet. Four rounds went through it with
hand-written copy, then three full runs through the UI with pipeline-written
copy (one with the concept's examples deliberately pointing at an unrelated
product, to prove the copy comes from the site and not the examples). Every
round was judged frame by frame; the findings and fixes are in the git
history of `concept.mjs`.

## 5b. Photographs: the launch images

Why the first Verdict cut had no pictures: Claude cannot make raster images,
there was no image key, and charts need real numbers (the only real number
the site gives is the 15-minute batch timer, which the film already animates
as a countdown). With the owner's OpenAI key the stage gained a step,
**Launch images**, between the site read and the cards:

1. `lk_studio.pipe` writes four photo briefs from the profile, the Business
   DNA and the campaign angle (`buildStudioImagesQuestion`). A brief is a
   scene, never a poster: who is in frame (a role, not a name), what they are
   doing, what is around them, the hour, the light. No text, no logos, no
   product interface, since the film and the cards set their own type.
2. The forge (`POST /images`, `lib/images.mjs`) makes them in parallel with
   `gpt-image-2` at medium quality, appending one of two house grades so the
   four read as one photographer's work: cold (desaturated teal and slate,
   low key) for the problem, warm (soft daylight, calm) for the arrival and
   the launch image. About 35 seconds for all four; roughly 1,500 tokens
   each.

The four plates the Verdict concept asks for (`spec.plates`):

| Plate | Where it goes | Grade | What the brief describes |
|---|---|---|---|
| scene | the film, 0 to 3.4 s, under the opening line and the three tiles | cold | the room where the problem happens, wide, from the back; nobody is the subject yet |
| pile | the film, 3.4 to 6.5 s, under the card rain, the doubt and the cost | cold | the one person doing the job by hand, close, surrounded by the volume |
| arrival | the film, 20 to 22 s, under the call to action; also the story-size card | warm | the same kind of person after the app, calm, with room to breathe |
| hero | the platform images, landscape | warm | the person and the place at a glance, subject right so a headline can sit left |

In the film the plates sit under a scrim in the canvas colour (so the type
stays the subject), push in slowly, darken under the tiles, defocus with the
doubt (a rack focus onto the questions), and are crushed with the cost line
on the drop. The solution half stays drawn: the product's own mechanics and
the live screenshot are the truth, and no photograph should pretend to be
the product. The arrival plate returns on the impact with the inverse zoom,
tinted toward the brand. The film renders exactly as before when no
photographs exist.

The launch cards gained a second set when the images exist: one photo-backed
image per platform Launch Kit writes posts for, each carrying the first line
of that platform's own draft from Social Launch (or the tagline until one
exists), the brand row, and the host:

| File | Size | For |
|---|---|---|
| x | 1600x900 | X posts |
| linkedin | 1200x627 | LinkedIn posts |
| producthunt | 1270x760 | the Product Hunt gallery |
| reddit | 1200x900 | Reddit image posts |
| newsletter | 1200x400 | the newsletter pitch header |
| og-photo | 1200x630 | link previews on Hacker News, Reddit and Slack |
| story-photo | 1080x1920 | stories and the reel poster (uses the arrival plate) |

Every PNG downloads on its own, and `launch-kit.zip` holds the whole set.
The stage tells the builder when the images are newer than the cards or the
reel, so a remake or a re-render picks them up.

Not done, and why: three.js. A 3D card pile or a camera move through the
submissions would triple the render time, add a non-deterministic WebGL path
to the headless render, and compete with the photographs for the same three
seconds of screen. The photographs carry the "people in a room" weight the
owner asked for; the drawn scenes carry the product. Revisit only for a
concept whose subject is spatial.

## 5c. The voice-over (branch `short-video-audio`)

The film is spoken as a pitch, not narrated. Open source, on this machine,
no key:

- **Engines.** Chatterbox (Resemble AI, MIT), expressive, with an exaggeration
  control that suits a pitch; runs in a Python 3.12 venv next to the forge
  (`uv venv --python 3.12 .venv-tts && VIRTUAL_ENV=.venv-tts uv pip install
  chatterbox-tts "setuptools<81"`, PyTorch on Metal; about 7 seconds a line,
  a minute for the five). Kokoro-82M (Apache 2.0)
  through `kokoro-js`, ONNX in the forge process, fast and clean, flatter
  delivery. The forge takes the first one present; `STUDIO_TTS=kokoro`
  chooses. The health card names the engine.
- **The lines.** The Verdict concept declares five windows (`spec.voice`):
  problem (0.4 to 6.3 s), drop (6.7 to 8.4), how (8.7 to 14.3), proof (14.7 to
  18.4), close (20.2 to 23.6), each with a word budget at about 2.4 spoken
  words a second. `lk_studio.pipe` writes them as the founder speaking to a
  room (`buildStudioVoiceQuestion`): present tense, plain words, numbers said
  as a speaker says them, the app name in the drop and the close, never the
  web address, never a description of what is on screen. The on-screen lines
  travel along in the prompt so the spoken lines land on the right beat
  without reading the screen aloud. The breath (18.6 to 20.0) stays silent.
- **Fitting.** Every line is spoken on its own, trimmed, levelled to -16 LUFS
  and measured. Over its window it is sped up by at most 15%; still over, the
  app asks the pipe for a shorter take sized from the measured overrun and
  speaks it again. Lines over the word budget on paper get one shorter take
  before anything is spoken.
- **The mix.** The rendered film keeps its music; the forge places the lines
  at their times, ducks the music under them with a sidechain compressor
  (ratio 10, 12 ms attack, 420 ms release), sums, and masters to -14 LUFS.
  The stage previews the lines over the music before the render.
- **The stage.** A Voice-over section under the script: Write the voice-over,
  a player, the five lines with their measured seconds, a stale banner when
  the script changes, and Voice on the reel's facts. The drive covers it.

Also in this branch: the room dissolves into the person across the 3.4 s seam
instead of cutting, the arrival plate breathes in under the dip before the
impact, the photo briefs keep one person through the pile, the arrival and
the hero, and every plate has an "Another take" so the builder can choose.

## 6. What v1 does not do yet

- One concept, Verdict. The scene library inside it (tiles, pile, doubt,
  collision, input, scan, timeline, product shot, payoff, arrival, lockup)
  is written so a second concept can reorder or swap scenes; that is the next
  step once a second app has been through it.
- No voice-over and no generative footage (the Gemini and ElevenLabs keys);
  photographs yes (OpenAI key on the forge).
- The approved reel is not yet added to the Plan stage's checklist.
- Cards use the kit's faces (Space Grotesk, Anton) rather than the site's own
  font files; the observed families are recorded and shown.

## 7. Decisions for the owner

1. **Music licensing.** The bundled track was generated by the upstream
   author with ElevenLabs Music. Options: keep it for internal demos only,
   buy a track under a business license (Uppbeat Business tier covers client
   and ad use), or generate a fresh one per app once an ElevenLabs key exists.
2. **Keys.** `OPENAI_API_KEY` (in `services/studio-forge/.env`) makes the
   photographs; the key was pasted into a chat on 2026-09-08 and should be
   rotated at the owner's convenience. `GEMINI_API_KEY` and
   `ELEVENLABS_API_KEY` would unlock Pipeline A (footage plus voice-over).
   Image runs cost money: four images per run at medium quality.
3. **Where the forge runs after the demo.** Local now. A container with
   Chromium and ffmpeg behind the same API is the next step if this ships.
4. **Stage name.** The stage is called "Assets" in the UI (slug `studio` in
   code, because `assets` is already Social Launch's internal slug).
