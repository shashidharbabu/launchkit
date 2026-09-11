#!/usr/bin/env python3
"""For every docs/eval-10/<slug>: a plates.jpg (the four launch photographs
with their judge scores) and poster.jpg (the reel's last frame), read from the
Studio service's out dir through the file paths in the store dump."""
import json, os, shutil
from PIL import Image, ImageDraw

ROOT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/eval-10'
for slug in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, slug)
    p = os.path.join(d, 'appstate.json')
    if not os.path.isdir(d) or not os.path.exists(p):
        continue
    t = json.load(open(p)).get('launchkit', {})
    studio = t.get('studio', [])
    latest = lambda kind: sorted([r for r in studio if r.get('kind') == kind], key=lambda r: r.get('version') or 0)[-1]['data'] if any(r.get('kind') == kind for r in studio) else {}
    im = latest('images')
    tiles = []
    for i in im.get('images', []):
        fp = i.get('file_path')
        if fp and os.path.exists(fp):
            img = Image.open(fp).convert('RGB'); H = 480; img = img.resize((int(img.width * H / img.height), H))
            best = max([tk.get('score') or 0 for tk in i.get('takes', [])] or [0])
            tiles.append((f"{i['id']}  judge {best}/10", img))
    if tiles:
        w = sum(x.width for _, x in tiles) + 16 * (len(tiles) + 1)
        sheet = Image.new('RGB', (w, 480 + 60), (20, 20, 22)); dr = ImageDraw.Draw(sheet); x = 16
        for n, x_img in tiles:
            dr.text((x, 12), n, fill=(230, 230, 230)); sheet.paste(x_img, (x, 48)); x += x_img.width + 16
        sheet.save(os.path.join(d, 'plates.jpg'), quality=82)
    reel = latest('reel')
    poster = reel.get('poster_url', '')
    # poster_url is http://localhost:3500/files/<project>/<job>/poster.jpg; the file lives under the forge's out dir
    if poster:
        rel = poster.split('/files/')[-1]
        src = os.path.join('/Users/shashidharbabu/rocketride-apps-gtm/services/studio-forge/out', rel)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(d, 'poster.jpg'))
    print(slug, 'plates', len(tiles), 'poster', bool(poster))
