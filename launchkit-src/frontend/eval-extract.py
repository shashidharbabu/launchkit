#!/usr/bin/env python3
"""Turn each docs/eval-10/<slug>/appstate.json (the preview store dump) into a
compact extract.json the evaluators read: profile, DNA, angles, pricing,
listing, every post with its warnings, the studio rows (briefs, judge scores,
voice fits, reel), targets, signals, and the decisions. Also writes
docs/eval-10/matrix.json with one row per app of the mechanical facts."""
import json, os, re, sys

ROOT = '/Users/shashidharbabu/rocketride-apps-gtm/docs/eval-10'
DASH = re.compile('[—–]')
BANNED = re.compile(r'\b(ship|ships|shipped|shipping|game.?chang\w*|revolutionar\w*|groundbreaking|seamless\w*|unleash\w*|supercharge\w*|leverage|delve|elevate)\b', re.I)


def latest(rows, key='version'):
    return sorted(rows, key=lambda r: (r.get(key) or 0, r.get('created_at') or ''))[-1] if rows else None


def texty(d):
    out = []
    def walk(v):
        if isinstance(v, str): out.append(v)
        elif isinstance(v, list): [walk(x) for x in v]
        elif isinstance(v, dict): [walk(x) for k, x in v.items() if k != 'warnings']
    walk(d)
    return '\n'.join(out)


def extract(slug):
    d = os.path.join(ROOT, slug)
    p = os.path.join(d, 'appstate.json')
    if not os.path.exists(p):
        return None
    raw = json.load(open(p))
    t = raw.get('launchkit', raw)
    summ = json.load(open(os.path.join(d, 'summary.json'))) if os.path.exists(os.path.join(d, 'summary.json')) else {}
    proj = (t.get('projects') or [{}])[0]
    prof = latest(t.get('profiles') or [])
    cr = t.get('commercial_results') or []
    by = lambda k: [r for r in cr if r.get('kind') == k]
    dna = (latest(by('brand_dna'), 'created_at') or {}).get('data') or {}
    camps = ((latest(by('brand_campaigns'), 'created_at') or {}).get('data') or {}).get('campaigns') or []
    pricing_row = latest(by('pricing'), 'created_at') or {}
    pricing = pricing_row.get('data') or {}
    listing_row = latest(by('listing'), 'created_at') or {}
    listing = listing_row.get('data') or {}
    assets = {}
    for a in t.get('assets') or []:
        k = a.get('asset_type')
        cur = assets.get(k)
        if not cur or (a.get('version') or 0) > (cur.get('version') or 0):
            assets[k] = a
    posts = {}
    for k, a in assets.items():
        data = a.get('data') or {}
        txt = texty(data)
        posts[k] = {
            'version': a.get('version'), 'status': a.get('status'), 'data': data,
            'warnings': data.get('warnings') or [],
            'chars': len(txt), 'words': len(txt.split()),
            'dashes': len(DASH.findall(txt)), 'banned_words': sorted(set(m.lower() for m in BANNED.findall(txt))),
            'exclamations': txt.count('!'), 'hashtags': len(re.findall(r'#\w+', txt)),
            'has_app_url': '{APP_URL}' in txt,
        }
    studio = {}
    for r in t.get('studio') or []:
        k = r.get('kind')
        cur = studio.get(k)
        if not cur or (r.get('version') or 0) > (cur.get('version') or 0):
            studio[k] = r
    images = (studio.get('images') or {}).get('data') or {}
    voice = (studio.get('voice') or {}).get('data') or {}
    reel = (studio.get('reel') or {}).get('data') or {}
    script = (studio.get('script') or {}).get('data') or {}
    kit = (studio.get('kit') or {}).get('data') or {}
    targets = sorted(t.get('targets') or [], key=lambda r: r.get('rank') or 0)
    signals = t.get('signals') or []
    out = {
        'slug': slug, 'name': proj.get('name'), 'site': proj.get('site_url'), 'repo': proj.get('repo_url'),
        'stages': {k: ({'ok': v.get('ok'), 'secs': v.get('secs'), 'error': v.get('error')} if isinstance(v, dict) else v) for k, v in (summ.get('stages') or {}).items()},
        'profile': {'status': prof.get('status') if prof else None, 'data': (prof or {}).get('data')},
        'brand': {'dna': dna, 'angles': [{'name': c.get('name'), 'objective': c.get('objective'), 'big_idea': c.get('big_idea'), 'hook': c.get('hook'), 'channels': c.get('channels'), 'effort': c.get('effort'), 'success_metric': c.get('success_metric')} for c in camps], 'chosen': proj.get('selected_campaigns') or []},
        'commercial': {
            'competitors': [{'name': c.get('name'), 'notability': c.get('notability'), 'mentions': c.get('mentions'), 'tiers': c.get('tiers')} for c in (pricing.get('competitors') or [])],
            'rejected': pricing.get('rejected'), 'recommendation': pricing.get('recommendation'), 'options': pricing.get('options'), 'models_considered': pricing.get('models_considered'), 'market_rate': pricing.get('market_rate'), 'confidence': pricing.get('confidence'),
            'selected_pricing': proj.get('selected_pricing'), 'listing': listing, 'listing_status': listing_row.get('status'),
        },
        'posts': posts,
        'assets': {
            'images': {'domain': images.get('domain'), 'subject': images.get('subject'), 'model': images.get('model'), 'plates': [{'id': i.get('id'), 'brief': i.get('brief'), 'url': i.get('url'), 'judge': i.get('judge'), 'takes': [{'score': tk.get('score'), 'chosen': tk.get('chosen'), 'why': tk.get('why')} for tk in (i.get('takes') or [])]} for i in (images.get('images') or [])]},
            'script': {'slots': script.get('slots'), 'clamped': script.get('clamped'), 'repaired': script.get('repaired'), 'tagline': script.get('tagline'), 'claims_used': script.get('claims_used')},
            'voice': {'engine': voice.get('engine'), 'tone': voice.get('tone'), 'all_fit': voice.get('all_fit'), 'segments': [{'id': s.get('id'), 'text': s.get('text'), 'seconds': s.get('seconds'), 'window': s.get('window'), 'fits': s.get('fits'), 'tempo': s.get('tempo')} for s in (voice.get('segments') or [])]},
            'reel': {'video_url': reel.get('video_url'), 'poster_url': reel.get('poster_url'), 'plates_used': reel.get('plates_used'), 'voice_used': reel.get('voice_used'), 'status': (studio.get('reel') or {}).get('status')},
            'cards': {'count': len(kit.get('cards') or []), 'images': len(kit.get('images') or []), 'zip': bool(kit.get('zip_url'))},
        },
        'targets': [{'rank': r.get('rank'), 'selected': r.get('selected'), 'name': (r.get('data') or {}).get('name'), 'kind': (r.get('data') or {}).get('kind'), 'why_fit': (r.get('data') or {}).get('why_fit'), 'url': (r.get('data') or {}).get('url')} for r in targets[:15]],
        'signals': [{'status': s.get('status'), 'url': (s.get('data') or {}).get('url'), 'title': (s.get('data') or {}).get('title'), 'why': (s.get('data') or {}).get('why_relevant') or (s.get('data') or {}).get('why'), 'reply': ((s.get('data') or {}).get('draft_reply') or (s.get('data') or {}).get('reply') or '')[:400]} for s in signals[:12]],
    }
    json.dump(out, open(os.path.join(d, 'extract.json'), 'w'), indent=1, ensure_ascii=False)
    row = {
        'slug': slug, 'name': out['name'],
        'stages_ok': [k for k, v in out['stages'].items() if isinstance(v, dict) and v.get('ok')],
        'stages_failed': [k for k, v in out['stages'].items() if isinstance(v, dict) and v.get('ok') is False],
        'profile_confidence': ((prof or {}).get('data') or {}).get('confidence'),
        'dna_tone_words': len(((dna.get('voice') or {}).get('tone_words')) or []),
        'angles': len(camps), 'angle_chosen': bool(proj.get('selected_campaigns')),
        'competitors': len(pricing.get('competitors') or []), 'established': len([c for c in (pricing.get('competitors') or []) if c.get('notability') == 'established']),
        'pricing_options': len(pricing.get('options') or []), 'pricing_chosen': bool(proj.get('selected_pricing')), 'listing_approved': listing_row.get('status') == 'approved',
        'posts': {k: {'status': v['status'], 'warnings': len(v['warnings']), 'dashes': v['dashes'], 'banned': v['banned_words'], 'excl': v['exclamations']} for k, v in posts.items()},
        'plates': len(images.get('images') or []), 'judge_scores': [max([tk.get('score') or 0 for tk in (i.get('takes') or [])] or [None]) for i in (images.get('images') or [])],
        'voice_all_fit': voice.get('all_fit'), 'reel': bool(reel.get('video_url')), 'reel_status': (studio.get('reel') or {}).get('status'),
        'targets': len(targets), 'signals': len(signals), 'signals_new': len([s for s in signals if s.get('status') == 'new']),
    }
    return row


slugs = sorted(x for x in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, x)))
rows = [r for r in (extract(s) for s in slugs) if r]
json.dump({'apps': rows}, open(os.path.join(ROOT, 'matrix.json'), 'w'), indent=1)
for r in rows:
    print(r['slug'], 'ok:', ','.join(r['stages_ok']), 'failed:', ','.join(r['stages_failed']) or '-', 'posts:', len(r['posts']), 'plates:', r['plates'], 'targets:', r['targets'], 'signals:', r['signals'])
