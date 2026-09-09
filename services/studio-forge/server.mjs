#!/usr/bin/env node
// Studio forge: the local half of Launch Kit's Assets stage. It reads a site,
// renders launch cards, and renders the reel, because those need a browser
// and ffmpeg, which the RocketRide pipeline runtime does not have.
//
//   npm start                      # 127.0.0.1:3500
//   STUDIO_PORT=3600 npm start
//   STUDIO_HOST=0.0.0.0 npm start  # reachable from another machine
//
// Routes: GET /health, GET /concepts, POST /probe, POST /kit, POST /reel,
// GET /jobs/:id, GET /jobs, GET /files/<project>/<job>/<file>.
import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeSite } from './lib/probe.mjs';
import { renderCards } from './lib/cards.mjs';
import { renderReel, listConcepts, loadConcept, HYPERFRAMES } from './lib/reel.mjs';
import * as jobs from './lib/jobs.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(process.env.STUDIO_OUT ?? path.join(ROOT, 'out'));
const PORT = Number(process.env.STUDIO_PORT ?? 3500);
const HOST = process.env.STUDIO_HOST ?? '127.0.0.1';
const VERSION = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')).version;

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.txt': 'text/plain' };

const safeSeg = (s) => /^[A-Za-z0-9._-]{1,80}$/.test(s) && !s.startsWith('.');
const publicBase = (req) => `http://${req.headers.host ?? `${HOST}:${PORT}`}`;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '600');
}
const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > 2_000_000) { reject(new Error('body too large')); req.destroy(); } else data += c; });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('body is not JSON')); } });
    req.on('error', reject);
  });
}

const which = (cmd, args = ['-version']) => new Promise((resolve) => execFile(cmd, args, { timeout: 8000 }, (err, out) => resolve(err ? null : String(out).split('\n')[0].slice(0, 80))));

async function health() {
  const [ffmpeg, node] = await Promise.all([which('ffmpeg'), which('node', ['--version'])]);
  let chromium = null;
  try {
    const pw = await import('playwright');
    const exe = pw.chromium.executablePath();
    chromium = existsSync(exe) ? (exe.split(path.sep).find((s) => /^chromium/.test(s)) ?? 'installed') : null;
  } catch { chromium = null; }
  const npxCache = path.join(process.env.HOME ?? '', '.npm', '_npx');
  return {
    ok: Boolean(ffmpeg && chromium), version: VERSION, service: 'studio-forge', out: OUT,
    ffmpeg: ffmpeg ?? null, node, chromium, hyperframes: HYPERFRAMES, hyperframes_cached: existsSync(npxCache),
    concepts: await listConcepts(),
  };
}

function requireUrl(v) {
  const s = String(v ?? '').trim();
  if (!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(s)) throw new Error('site_url must be an http(s) URL');
  return s;
}

const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return String(u); } };

async function serveFile(req, res, rel) {
  const parts = rel.split('/').filter(Boolean);
  if (parts.length !== 3 || !parts.every(safeSeg)) return send(res, 404, { error: 'not found' });
  const p = path.join(OUT, ...parts);
  try {
    const s = await stat(p);
    if (!s.isFile()) throw new Error('not a file');
    const ext = path.extname(p).toLowerCase();
    const headers = { 'content-type': MIME[ext] ?? 'application/octet-stream', 'content-length': s.size, 'cache-control': 'no-cache', 'accept-ranges': 'bytes' };
    const range = req.headers.range;
    if (range && ext === '.mp4') {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m && m[1] ? Number(m[1]) : 0;
      const end = m && m[2] ? Math.min(Number(m[2]), s.size - 1) : s.size - 1;
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${s.size}`, 'content-length': end - start + 1 });
      return createReadStream(p, { start, end }).pipe(res);
    }
    res.writeHead(200, headers);
    createReadStream(p).pipe(res);
  } catch {
    send(res, 404, { error: 'not found' });
  }
}

async function handle(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url ?? '/', 'http://x');
  const p = url.pathname;
  try {
    if (req.method === 'GET' && p === '/health') return send(res, 200, await health());
    if (req.method === 'GET' && p === '/concepts') return send(res, 200, { concepts: await listConcepts() });
    if (req.method === 'GET' && p.startsWith('/concepts/')) { const { spec } = await loadConcept(p.slice('/concepts/'.length)); return send(res, 200, spec); }
    if (req.method === 'GET' && p === '/jobs') return send(res, 200, { jobs: jobs.list() });
    if (req.method === 'GET' && p.startsWith('/jobs/')) { const j = jobs.get(p.slice('/jobs/'.length)); return j ? send(res, 200, j) : send(res, 404, { error: 'job not found' }); }
    if (req.method === 'GET' && p.startsWith('/files/')) return serveFile(req, res, p.slice('/files/'.length));

    if (req.method === 'POST' && (p === '/probe' || p === '/kit' || p === '/reel')) {
      const body = await readJson(req);
      const project = String(body.project_id ?? 'default');
      if (!safeSeg(project)) throw new Error('project_id must be a short id');
      const kind = p.slice(1);
      const jobId = jobs.newId();
      const jobDir = path.join(OUT, project, `${kind}-${jobId}`);
      const fileUrl = `${publicBase(req)}/files/${project}/${kind}-${jobId}`;
      await mkdir(jobDir, { recursive: true });
      let work;
      if (kind === 'probe') {
        const siteUrl = requireUrl(body.site_url);
        work = (onStep) => probeSite({ siteUrl, outDir: jobDir, fileUrl, onStep }).then(async (r) => {
          for (const l of r.logos) l.file_path = path.join(jobDir, l.file);
          r.screenshot_path = path.join(jobDir, 'site.png');
          await writeFile(path.join(jobDir, 'probe.json'), JSON.stringify(r, null, 2));
          return r;
        });
      } else if (kind === 'kit') {
        if (!body.palette?.roles) throw new Error('kit needs palette.roles (run probe first)');
        const kit = {
          name: String(body.name ?? '').trim() || 'Untitled', tagline: String(body.tagline ?? '').trim(), one_liner: String(body.one_liner ?? '').trim(),
          description: String(body.description ?? '').trim(), host: host(body.site_url ?? ''), status: String(body.status ?? 'Now live'),
          palette: body.palette, logos: Array.isArray(body.logos) ? body.logos : [], fonts: body.fonts ?? {},
        };
        work = (onStep) => renderCards({ kit, outDir: jobDir, fileUrl, onStep }).then(async (r) => {
          const out = { ...r, name: kit.name, tagline: kit.tagline, host: kit.host, fonts: kit.fonts, palette: kit.palette, logo: kit.logos.find((l) => l.picked) ?? null };
          await writeFile(path.join(jobDir, 'kit.json'), JSON.stringify(out, null, 2));
          return out;
        });
      } else {
        if (!body.palette?.roles) throw new Error('reel needs palette.roles (run probe first)');
        const concept = String(body.concept ?? 'verdict');
        await loadConcept(concept);
        const compositionId = `${project}-${concept}-${jobId}`.toLowerCase();
        // the site screenshot the product scene shows: only a file under our own out dir
        const shotPath = typeof body.screenshot_path === 'string' && path.resolve(body.screenshot_path).startsWith(OUT + path.sep) ? path.resolve(body.screenshot_path) : null;
        work = (onStep) => renderReel({
          concept, slots: body.slots ?? {}, palette: body.palette, logo: body.logo ?? null, screenshot: shotPath, jobDir, fileUrl, compositionId,
          resolution: body.resolution === 'portrait-4k' ? 'portrait-4k' : undefined, onStep,
        }).then(async (r) => { await writeFile(path.join(jobDir, 'reel.json'), JSON.stringify(r, null, 2)); return r; });
      }
      const job = jobs.create(kind, project, work, jobId);
      job.dir = jobDir;
      return send(res, 202, { job_id: job.id, kind, status: job.status, files: fileUrl });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 400, { error: String(e?.message ?? e) });
  }
}

await mkdir(OUT, { recursive: true });
const server = http.createServer((req, res) => { handle(req, res).catch((e) => { try { send(res, 500, { error: String(e?.message ?? e) }); } catch { /* closed */ } }); });
server.listen(PORT, HOST, async () => {
  const h = await health();
  console.log(`studio-forge ${VERSION} listening on http://${HOST}:${PORT}  out=${OUT}`);
  console.log(`  ffmpeg: ${h.ffmpeg ?? 'MISSING'}  chromium: ${h.chromium ?? 'MISSING (npx playwright install chromium)'}  concepts: ${h.concepts.map((c) => c.id).join(', ')}`);
});
