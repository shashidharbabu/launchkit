// Photographs for the film and the launch cards, made with OpenAI's image
// models from briefs the pipeline writes. The forge holds the key
// (OPENAI_API_KEY in services/studio-forge/.env); the browser never sees it.
//
// Every brief gets one of two house grades appended, so the plates read as
// one photographer's work: cold for the problem half of the film, warm for
// the arrival and the launch image. No text is ever asked for, since the film
// and the cards set their own type: screens may glow with charts, code or
// lists, banners and badges may hang, all wordless.
//
// Each brief is shot STUDIO_IMAGE_TAKES times (two by default), every take in
// parallel, then a vision judge (STUDIO_IMAGE_JUDGE, gpt-5-mini by default,
// gpt-4.1-mini when the first model is refused) scores every take from 1 to
// 10 on domain specificity, brief fidelity, room for type and photographic
// quality, and picks the plate. The winner is saved as plate-<id>.jpg, the
// file the film and the cards use; the others stay beside it as
// plate-<id>-take2.jpg and so on, so the builder can still choose by hand.
// When the judge fails, take 1 is kept and judge.why says so.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const imagesEnabled = () => Boolean(process.env.OPENAI_API_KEY);
export const imageModel = () => process.env.STUDIO_IMAGE_MODEL || 'gpt-image-2';
export const imageJudge = () => process.env.STUDIO_IMAGE_JUDGE || 'gpt-5-mini';
export const JUDGE_FALLBACK = 'gpt-4.1-mini';
export const MAX_TAKES = 4;

/** Takes per brief: STUDIO_IMAGE_TAKES, 1 to MAX_TAKES, default 2. */
export function imageTakes() {
  const n = Number(process.env.STUDIO_IMAGE_TAKES);
  return Number.isInteger(n) && n >= 1 && n <= MAX_TAKES ? n : 2;
}

const WORDLESS = 'No text, no captions, no logos, no watermarks. Screens may glow with charts, code or lists, banners, badges and lanyards may be in frame, all wordless: no legible letters or numbers anywhere.';
export const GRADES = {
  cold: `Cinematic still photograph, 35mm film, shallow depth of field, cold desaturated teal and slate palette, deep shadows, low-key lighting, subtle grain. ${WORDLESS}`,
  warm: `Cinematic still photograph, 35mm film, shallow depth of field, warm neutral palette with soft daylight, clean and calm, subtle grain. ${WORDLESS}`,
};

const SIZES = new Set(['1024x1024', '1024x1536', '1536x1024']);
const QUALITIES = new Set(['low', 'medium', 'high']);

const headers = () => ({ authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' });

async function generateOne({ prompt, size, quality, model }) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model, prompt, size, quality, n: 1, output_format: 'jpeg', output_compression: 88 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.error?.message ? String(body.error.message).slice(0, 300) : 'no detail';
    const err = new Error(`OpenAI images ${res.status}: ${detail}`);
    err.status = res.status;
    throw err;
  }
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI images returned no image data');
  return { buffer: Buffer.from(b64, 'base64'), tokens: body?.usage?.total_tokens ?? null };
}

/** One take with the retry loop: three attempts, none after a bad key, a bad request or a missing permission. */
async function shoot({ prompt, size, quality, model }) {
  let last = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ts = Date.now();
      const { buffer, tokens } = await generateOne({ prompt, size, quality, model });
      return { buffer, tokens, seconds: Math.round((Date.now() - ts) / 100) / 10 };
    } catch (e) {
      last = e;
      if (e.status === 400 || e.status === 401 || e.status === 403) break;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw last ?? new Error('image take failed');
}

// ---------------------------------------------------------------- the judge

const TYPE_ROOM = {
  portrait: 'the top third of the frame should be a quiet, darker area (ceiling, wall, shadow, an out-of-focus distance) with no faces and no busy detail, because a headline sits there',
  landscape: 'the left third of the frame should be a quiet, plainer or darker area with no faces and no busy detail, because a headline sits there; the subject belongs in the right two thirds',
};

function judgePrompt({ id, brief, orientation, n }) {
  return [
    `You judge photographs for a launch film and its launch cards. A photographer was given the brief below and made ${n} takes, attached in order (take 1 first). Score every take from 1 to 10 on four things, then pick the best.`,
    `BRIEF (plate "${id}", ${orientation}): ${brief}`,
    'SCORE EACH TAKE ON: 1) domain: read the brief and name the world it belongs to (a hackathon hall, a hospital ward, a warehouse floor, a courtroom); would a stranger who sees only the photograph know it is THAT world within one second, from the people, the props and the place? A generic office, desk, meeting room or conference table scores 1 to 3 here whatever else it does well. ' +
    '2) fidelity: does the photograph show what the brief asked for: the people by role, what they are doing, the named props, the moment and the camera position? ' +
    `3) type_room: ${TYPE_ROOM[orientation]}. ` +
    '4) quality: photographic quality: a real lens and real light, natural faces and hands, no warped objects, no legible letters or numbers anywhere (legible text costs points). ' +
    'Then give score: one overall mark from 1 to 10 that weighs domain and fidelity most, type_room next, quality last.',
    'OUTPUT: ONLY one JSON object, no fences, no commentary: {"takes": [{"index": 1, "domain": n, "fidelity": n, "type_room": n, "quality": n, "score": n, "why": "one sentence"}, ...one entry per take, in order], "best": <the index of the best take>, "why": "one sentence on why that take won"}',
  ].join('\n\n');
}

/** Chat Completions with image inputs (base64 jpeg data URLs); JSON back. */
async function askJudge({ model, prompt, images }) {
  const content = [{ type: 'text', text: prompt }];
  images.forEach((buf, i) => {
    content.push({ type: 'text', text: `Take ${i + 1}:` });
    content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${buf.toString('base64')}`, detail: 'auto' } });
  });
  const body = { model, messages: [{ role: 'user', content }], response_format: { type: 'json_object' }, max_completion_tokens: 2000 };
  if (/^(gpt-5|o\d)/.test(model)) body.reasoning_effort = 'low';
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error?.message ? String(data.error.message).slice(0, 300) : 'no detail';
    throw new Error(`${model} ${res.status}: ${detail}`);
  }
  const choice = data?.choices?.[0];
  if (choice?.message?.refusal) throw new Error(`${model} refused: ${String(choice.message.refusal).slice(0, 200)}`);
  const text = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
  if (!text) throw new Error(`${model} returned no content (finish_reason ${choice?.finish_reason ?? 'unknown'})`);
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch { /* no JSON */ } } }
  if (!parsed || typeof parsed !== 'object') throw new Error(`${model} returned no JSON`);
  return { parsed, tokens: data?.usage?.total_tokens ?? null };
}

const mark = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.max(1, Math.min(10, Math.round(n * 10) / 10)) : null; };
/** The judge's prose as the stage shows it: one line, no em or en dashes (the app's own writing rule). */
const prose = (v, max = 300) => String(v ?? '').replace(/\s*[\u2014\u2013]\s*/g, ': ').replace(/\s+/g, ' ').trim().slice(0, max);

/** The judge's answer as one entry per take in order, and the winner's index (0-based). */
function readVerdict(parsed, n) {
  const list = Array.isArray(parsed?.takes) ? parsed.takes : [];
  const takes = [];
  for (let i = 0; i < n; i++) {
    const hit = list.find((t) => Number(t?.index) === i + 1) ?? list[i] ?? {};
    takes.push({
      index: i + 1, score: mark(hit.score), domain: mark(hit.domain), fidelity: mark(hit.fidelity), type_room: mark(hit.type_room), quality: mark(hit.quality),
      why: prose(hit.why),
    });
  }
  if (!takes.some((t) => t.score !== null)) return null;
  let best = Number(parsed?.best) - 1;
  if (!Number.isInteger(best) || best < 0 || best >= n) best = takes.reduce((b, t, i) => ((t.score ?? -1) > (takes[b].score ?? -1) ? i : b), 0);
  const why = prose(parsed?.why) || takes[best].why;
  return { takes, best, why };
}

/**
 * Score the takes of one brief and pick the winner. The first model is
 * STUDIO_IMAGE_JUDGE; when it is refused (an unknown model, a rejected
 * request, a refusal) the fallback is asked once. When both fail, take 1
 * stays and judge.why says why.
 */
export async function judgeTakes({ id, brief, orientation, takes }) {
  const prompt = judgePrompt({ id, brief, orientation, n: takes.length });
  // a smaller copy for the judge: it looks, it does not print
  const small = await Promise.all(takes.map((t) => sharp(t.buffer).resize({ width: 800, height: 800, fit: 'inside' }).jpeg({ quality: 82 }).toBuffer()));
  const models = [imageJudge()];
  if (models[0] !== JUDGE_FALLBACK) models.push(JUDGE_FALLBACK);
  const errors = [];
  for (const model of models) {
    try {
      const { parsed, tokens } = await askJudge({ model, prompt, images: small });
      const verdict = readVerdict(parsed, takes.length);
      if (!verdict) throw new Error(`${model} answered without usable scores`);
      // errors: what the first model said when the fallback had to answer, so a fell_back verdict explains itself
      return { ok: true, model, tokens, fell_back: model !== models[0], ...(errors.length > 0 ? { errors } : {}), ...verdict };
    } catch (e) {
      errors.push(String(e?.message ?? e));
    }
  }
  return {
    ok: false, model: models.join(', then '), tokens: null, fell_back: models.length > 1, best: 0, errors,
    why: `judge failed, take 1 kept: ${errors.join('; ')}`.slice(0, 400),
    takes: takes.map((_, i) => ({ index: i + 1, score: null, domain: null, fidelity: null, type_room: null, quality: null, why: '' })),
  };
}

// ---------------------------------------------------------------- the run

/**
 * Shoot every brief `takes` times, all takes in parallel (eight images take
 * about as long as one), judge each brief's takes, and save the winner as
 * plate-<id>.jpg. briefs: [{ id, prompt, size?, grade? }]. Every image comes
 * back with its brief, the final prompt, its takes (file, score, why, chosen)
 * and the judge's verdict, so the stage can show exactly what was asked and
 * why a take won.
 */
export async function generateImages({ briefs, outDir, fileUrl, model = imageModel(), quality = 'medium', takes = imageTakes(), onStep }) {
  if (!imagesEnabled()) throw new Error('image generation is off on this forge: put OPENAI_API_KEY in services/studio-forge/.env and restart it');
  if (!QUALITIES.has(quality)) quality = 'medium';
  takes = Number.isInteger(takes) && takes >= 1 && takes <= MAX_TAKES ? takes : imageTakes();
  await mkdir(outDir, { recursive: true });
  const t0 = Date.now();
  const total = briefs.length * takes;
  let made = 0;
  onStep?.(`asking ${model} for ${total} take${total === 1 ? '' : 's'} (${briefs.length} plate${briefs.length === 1 ? '' : 's'}, ${takes} each)`);

  // every take of every brief at once; a brief survives as long as one take does
  const shots = await Promise.all(briefs.map(async (b) => {
    const size = SIZES.has(b.size) ? b.size : '1024x1536';
    const grade = b.grade === 'warm' ? 'warm' : 'cold';
    const prompt = `${String(b.prompt).trim()} ${GRADES[grade]}`;
    const settled = await Promise.allSettled(Array.from({ length: takes }, () => shoot({ prompt, size, quality, model }).then((r) => {
      made += 1;
      onStep?.(`${made} of ${total} takes made (${b.id})`);
      return r;
    })));
    const results = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
    if (results.length === 0) throw settled.find((s) => s.status === 'rejected')?.reason ?? new Error(`image ${b.id} failed`);
    return { id: b.id, brief: String(b.prompt).trim(), prompt, size, grade, results, failed: takes - results.length };
  }));

  // the judge, one call per brief, in parallel
  if (takes > 1) onStep?.(`judging ${total} takes with ${imageJudge()}`);
  let chosen = 0;
  const images = await Promise.all(shots.map(async (s) => {
    const orientation = s.size.startsWith('1536') ? 'landscape' : 'portrait';
    const verdict = s.results.length > 1
      ? await judgeTakes({ id: s.id, brief: s.brief, orientation, takes: s.results })
      : { ok: true, model: null, tokens: null, fell_back: false, best: 0, why: takes > 1 ? 'only one take survived, nothing to choose' : 'one take, nothing to choose', takes: [{ index: 1, score: null, domain: null, fidelity: null, type_room: null, quality: null, why: '' }] };
    // the winner is the plate; the others keep their numbers beside it
    let loser = 2;
    const takeOut = [];
    for (let i = 0; i < s.results.length; i++) {
      const isBest = i === verdict.best;
      const file = isBest ? `plate-${s.id}.jpg` : `plate-${s.id}-take${loser++}.jpg`;
      await writeFile(path.join(outDir, file), s.results[i].buffer);
      const v = verdict.takes[i] ?? {};
      takeOut.push({
        // take: the shooting number the judge's prose refers to ("take 2 wins"); the file name says only who won
        take: i + 1, file, url: `${fileUrl}/${file}`, file_path: path.join(outDir, file), chosen: isBest,
        score: v.score ?? null, domain: v.domain ?? null, fidelity: v.fidelity ?? null, type_room: v.type_room ?? null, quality: v.quality ?? null, why: v.why ?? '',
        seconds: s.results[i].seconds, tokens: s.results[i].tokens,
      });
    }
    const win = takeOut[verdict.best];
    const meta = await sharp(s.results[verdict.best].buffer).metadata();
    chosen += 1;
    onStep?.(`${chosen} of ${briefs.length} plates chosen (${s.id}: take ${verdict.best + 1})`);
    return {
      id: s.id, file: win.file, url: win.url, file_path: win.file_path, w: meta.width ?? null, h: meta.height ?? null,
      grade: s.grade, brief: s.brief, prompt: s.prompt, model, quality, seconds: win.seconds,
      tokens: s.results.reduce((n, r) => n + (r.tokens ?? 0), 0) || null,
      takes: takeOut, failed_takes: s.failed,
      judge: { model: verdict.model, why: verdict.why, ok: verdict.ok, fell_back: verdict.fell_back, tokens: verdict.tokens, ...(verdict.errors ? { errors: verdict.errors } : {}) },
    };
  }));
  return { model, quality, takes, judge: takes > 1 ? imageJudge() : null, images, seconds: Math.round((Date.now() - t0) / 100) / 10 };
}
