// Photographs for the film and the launch cards, made with OpenAI's image
// models from briefs the pipeline writes. The forge holds the key
// (OPENAI_API_KEY in services/studio-forge/.env); the browser never sees it.
//
// Every brief gets one of two house grades appended, so four separate
// generations read as one photographer's work: cold for the problem half of
// the film, warm for the arrival and the launch image. No text is ever asked
// for, since the film and the cards set their own type.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const imagesEnabled = () => Boolean(process.env.OPENAI_API_KEY);
export const imageModel = () => process.env.STUDIO_IMAGE_MODEL || 'gpt-image-2';

export const GRADES = {
  cold: 'Cinematic still photograph, 35mm film, shallow depth of field, cold desaturated teal and slate palette, deep shadows, low-key lighting, subtle grain. No text, no captions, no logos, no watermarks, no readable screens or signs.',
  warm: 'Cinematic still photograph, 35mm film, shallow depth of field, warm neutral palette with soft daylight, clean and calm, subtle grain. No text, no captions, no logos, no watermarks, no readable screens or signs.',
};

const SIZES = new Set(['1024x1024', '1024x1536', '1536x1024']);
const QUALITIES = new Set(['low', 'medium', 'high']);

async function generateOne({ prompt, size, quality, model }) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
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

/**
 * Make every brief in parallel (four images take about as long as one).
 * briefs: [{ id, prompt, size?, grade? }]. Returns the files, their briefs and
 * the final prompts, so the stage can show exactly what was asked for.
 */
export async function generateImages({ briefs, outDir, fileUrl, model = imageModel(), quality = 'medium', onStep }) {
  if (!imagesEnabled()) throw new Error('image generation is off on this forge: put OPENAI_API_KEY in services/studio-forge/.env and restart it');
  if (!QUALITIES.has(quality)) quality = 'medium';
  await mkdir(outDir, { recursive: true });
  const t0 = Date.now();
  let made = 0;
  onStep?.(`asking ${model} for ${briefs.length} image${briefs.length === 1 ? '' : 's'}`);
  const images = await Promise.all(briefs.map(async (b) => {
    const size = SIZES.has(b.size) ? b.size : '1024x1536';
    const grade = b.grade === 'warm' ? 'warm' : 'cold';
    const prompt = `${String(b.prompt).trim()} ${GRADES[grade]}`;
    let last = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const ts = Date.now();
        const { buffer, tokens } = await generateOne({ prompt, size, quality, model });
        const file = `plate-${b.id}.jpg`;
        await writeFile(path.join(outDir, file), buffer);
        const meta = await sharp(buffer).metadata();
        made += 1;
        onStep?.(`${made} of ${briefs.length} images made (${b.id})`);
        return {
          id: b.id, file, url: `${fileUrl}/${file}`, file_path: path.join(outDir, file), w: meta.width ?? null, h: meta.height ?? null,
          grade, brief: String(b.prompt).trim(), prompt, model, quality, seconds: Math.round((Date.now() - ts) / 100) / 10, tokens,
        };
      } catch (e) {
        last = e;
        // a bad key, a bad request or a missing permission will not fix itself
        if (e.status === 400 || e.status === 401 || e.status === 403) break;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    throw last ?? new Error(`image ${b.id} failed`);
  }));
  return { model, quality, images, seconds: Math.round((Date.now() - t0) / 100) / 10 };
}
