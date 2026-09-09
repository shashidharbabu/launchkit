// The voice-over: open-source speech on this machine, no key, no cloud.
//
// Engines, first present wins unless STUDIO_TTS names one:
//  - chatterbox: Resemble AI's Chatterbox (MIT), expressive, with an
//    exaggeration control that suits a pitch; runs in ./.venv-tts through
//    tts/say.py (PyTorch on Metal, CPU fallback).
//  - kokoro: Kokoro-82M (Apache 2.0) through kokoro-js, ONNX in this process,
//    fast and clean, flatter delivery.
//
// Every line is spoken on its own, trimmed, levelled to -16 LUFS, and
// measured. A line that runs past its window is sped up by at most 15%; past
// that the forge reports it does not fit and the app asks for a shorter one.
// The mix ducks the music under the voice with a sidechain compressor.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENV_PY = path.join(ROOT, '.venv-tts', 'bin', 'python');
const SAY = path.join(ROOT, 'tts', 'say.py');
const KOKORO = path.join(ROOT, 'node_modules', 'kokoro-js');

export const VOICES = {
  chatterbox: { exaggeration: 0.55, cfg: 0.4 },
  kokoro: { voice: 'am_michael', speed: 1.08 },
};

export function voiceEngines() {
  const list = [];
  if (existsSync(VENV_PY) && existsSync(SAY)) list.push('chatterbox');
  if (existsSync(KOKORO)) list.push('kokoro');
  return list;
}

export function voiceEngine() {
  const want = process.env.STUDIO_TTS;
  const have = voiceEngines();
  if (want && have.includes(want)) return want;
  return have[0] ?? null;
}

export const voiceEnabled = () => Boolean(voiceEngine());

const run = (cmd, args, opts = {}) => new Promise((resolve, reject) => execFile(cmd, args, { maxBuffer: 1e7, ...opts }, (err, out, errOut) =>
  (err ? reject(new Error(`${path.basename(cmd)} failed: ${String(errOut || out || err.message).slice(-600)}`)) : resolve(String(out)))));

export async function audioSeconds(file) {
  const out = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Math.round(Number(out.trim()) * 100) / 100;
}

async function sayChatterbox(items, { exaggeration, cfg, refVoice = null, onLine }) {
  const batch = path.join(path.dirname(items[0].out), 'lines.json');
  await writeFile(batch, JSON.stringify(items));
  const args = [SAY, '--batch', batch, '--exaggeration', String(exaggeration), '--cfg', String(cfg)];
  if (refVoice) args.push('--voice', refVoice);
  return new Promise((resolve, reject) => {
    const child = spawn(VENV_PY, args, { cwd: ROOT, env: { ...process.env, PYTHONUNBUFFERED: '1', TOKENIZERS_PARALLELISM: 'false' } });
    const info = {};
    let tail = '';
    const take = (buf) => {
      const s = buf.toString();
      tail = (tail + s).slice(-2000);
      for (const line of s.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('{')) continue;
        try { const j = JSON.parse(t); if (j.id) info[j.id] = j; onLine?.(j); } catch { /* progress noise */ }
      }
    };
    child.stdout.on('data', take);
    child.stderr.on('data', take);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(info) : reject(new Error(`chatterbox exited ${code}: ${tail.slice(-400)}`))));
  });
}

let kokoroModel = null;
async function sayKokoro(items, { voice, speed, onLine }) {
  const { KokoroTTS } = await import('kokoro-js');
  kokoroModel ??= await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32' });
  const info = {};
  for (const it of items) {
    const t0 = Date.now();
    const audio = await kokoroModel.generate(it.text, { voice, speed });
    await audio.save(it.out);
    info[it.id] = { id: it.id, gen: Math.round((Date.now() - t0) / 100) / 10, device: 'cpu' };
    onLine?.(info[it.id]);
  }
  return info;
}

/**
 * Mix spoken lines onto a bed (the film's music, or the rendered film itself
 * when `video` is set), the music ducked under the voice, the result levelled
 * to -14 LUFS. With no bed the lines sit on silence.
 */
export async function mixVoice({ base, segments, out, duration, video = false }) {
  const inputs = base ? ['-i', base] : ['-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=r=48000:cl=stereo'];
  const parts = [];
  segments.forEach((s, i) => {
    inputs.push('-i', s.file_path);
    const ms = Math.max(0, Math.round(s.at * 1000));
    parts.push(`[${i + 1}:a]adelay=${ms}|${ms}[s${i}]`);
  });
  const voMix = segments.length === 1
    ? '[s0]anull[vo]'
    : `${segments.map((_, i) => `[s${i}]`).join('')}amix=inputs=${segments.length}:normalize=0:dropout_transition=0[vo]`;
  const graph = [
    ...parts, voMix,
    `[vo]apad=whole_dur=${duration},atrim=0:${duration},asplit=2[voA][voB]`,
    '[0:a]aformat=channel_layouts=stereo,aresample=48000[bed]',
    '[bed][voA]sidechaincompress=threshold=0.02:ratio=10:attack=12:release=420:makeup=1:level_sc=1.2[duck]',
    '[duck][voB]amix=inputs=2:normalize=0:dropout_transition=0[mix]',
    '[mix]loudnorm=I=-14:TP=-1:LRA=11[aout]',
  ].join(';');
  const args = ['-y', '-v', 'error', ...inputs, '-filter_complex', graph, '-map', '[aout]'];
  if (video) args.push('-map', '0:v', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest');
  else args.push('-t', String(duration), '-c:a', 'libmp3lame', '-q:a', '3');
  args.push(out);
  await run('ffmpeg', args);
}

/**
 * Speak every segment, fit each to its window, and build a preview of the
 * lines on the film's timeline over the music.
 * segments: [{ id, text, at, until }]
 */
export async function generateVoice({ segments, outDir, fileUrl, engine = voiceEngine(), music = null, duration = 24, refVoice = null, onStep }) {
  if (!engine) throw new Error('voice is off on this forge: install Chatterbox (see services/studio-forge/README.md) and restart it');
  await mkdir(outDir, { recursive: true });
  const t0 = Date.now();
  const items = segments.map((s) => ({ id: s.id, text: s.text, out: path.join(outDir, `raw-${s.id}.wav`) }));
  onStep?.(`speaking ${segments.length} line${segments.length === 1 ? '' : 's'} with ${engine}`);
  const onLine = (j) => {
    if (j.loaded) onStep?.(`voice model loaded on ${j.loaded}`);
    else if (j.id && j.error) onStep?.(`"${j.id}" failed: ${j.error}`);
    else if (j.id) onStep?.(`spoke "${j.id}"${j.seconds ? ` (${j.seconds} s)` : ''}`);
  };
  const info = engine === 'chatterbox'
    ? await sayChatterbox(items, { ...VOICES.chatterbox, refVoice, onLine })
    : await sayKokoro(items, { ...VOICES.kokoro, onLine });

  const out = [];
  for (const s of segments) {
    const raw = path.join(outDir, `raw-${s.id}.wav`);
    if (!existsSync(raw)) throw new Error(`no audio came back for "${s.id}"${info[s.id]?.error ? `: ${info[s.id].error}` : ''}`);
    const rawSeconds = await audioSeconds(raw);
    const window = Math.max(0.5, s.until - s.at - 0.1);
    // trim silence at both ends (the reverse trick trims the tail), then fit: up to 15% faster before we give up
    const trimmed = path.join(outDir, `trim-${s.id}.wav`);
    await run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af',
      'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse', trimmed]);
    const trimmedSeconds = await audioSeconds(trimmed);
    const tempo = trimmedSeconds > window ? Math.min(1.15, trimmedSeconds / window) : 1;
    const file = `vo-${s.id}.wav`;
    const filters = [];
    if (tempo > 1.001) filters.push(`atempo=${tempo.toFixed(3)}`);
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=9', 'aresample=48000', 'aformat=channel_layouts=stereo');
    await run('ffmpeg', ['-y', '-v', 'error', '-i', trimmed, '-af', filters.join(','), path.join(outDir, file)]);
    const seconds = await audioSeconds(path.join(outDir, file));
    out.push({
      id: s.id, text: s.text, at: s.at, until: s.until, window: Math.round(window * 100) / 100, seconds, raw_seconds: rawSeconds,
      tempo: Math.round(tempo * 1000) / 1000, fits: seconds <= window + 0.05, words: s.text.split(/\s+/).filter(Boolean).length,
      file, file_path: path.join(outDir, file), url: `${fileUrl}/${file}`, engine, gen_seconds: info[s.id]?.gen ?? null, device: info[s.id]?.device ?? null,
    });
  }
  onStep?.('mixing the preview over the music');
  await mixVoice({ base: music, segments: out, out: path.join(outDir, 'voice-preview.mp3'), duration });
  return {
    engine, segments: out, preview_url: `${fileUrl}/voice-preview.mp3`, all_fit: out.every((x) => x.fits),
    words: out.reduce((n, x) => n + x.words, 0), seconds: Math.round((Date.now() - t0) / 100) / 10,
  };
}
