#!/usr/bin/env python
"""Speak lines with Chatterbox (Resemble AI, MIT), one model load per batch.

  .venv-tts/bin/python tts/say.py --batch lines.json [--exaggeration 0.55] [--cfg 0.4] [--voice ref.wav]

lines.json: [{"id": "problem", "text": "...", "out": "/abs/path.wav"}, ...]
One JSON line per finished item on stdout: {"id", "seconds", "gen", "device"}.
"""
import argparse
import json
import sys
import time


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument('--batch', required=True)
    p.add_argument('--exaggeration', type=float, default=0.55)
    p.add_argument('--cfg', type=float, default=0.4)
    p.add_argument('--voice', default=None, help='a reference wav to clone; the model default voice otherwise')
    p.add_argument('--device', default=None, help='mps, cuda or cpu; auto when omitted')
    args = p.parse_args()

    import torch
    import torchaudio as ta
    import perth
    from chatterbox.tts import ChatterboxTTS

    # resemble-perth leaves its implicit watermarker as None when one of its
    # imports fails on this platform; fall back to the package's own no-op
    # watermarker so the model can still be built (the audio is unmarked then)
    if getattr(perth, 'PerthImplicitWatermarker', None) is None and getattr(perth, 'DummyWatermarker', None) is not None:
        perth.PerthImplicitWatermarker = perth.DummyWatermarker
        print(json.dumps({'note': 'perth implicit watermarker unavailable, using the dummy watermarker'}), flush=True)

    if args.device:
        devices = [args.device]
    else:
        devices = (['mps'] if torch.backends.mps.is_available() else []) + ['cpu']

    # torch.load inside the model assumes the weights' original device; map everything to ours
    original_load = torch.load

    def patched_load(*a, **kw):
        kw.setdefault('map_location', torch.device(devices[0]))
        return original_load(*a, **kw)

    torch.load = patched_load

    model = None
    used = None
    for dev in devices:
        try:
            t0 = time.time()
            model = ChatterboxTTS.from_pretrained(device=dev)
            used = dev
            print(json.dumps({'loaded': dev, 'seconds': round(time.time() - t0, 1)}), flush=True)
            break
        except Exception as e:  # noqa: BLE001
            print(json.dumps({'load_failed': dev, 'error': str(e)[:300]}), flush=True)
    if model is None:
        return 2

    with open(args.batch, encoding='utf8') as fh:
        items = json.load(fh)
    for it in items:
        t0 = time.time()
        try:
            wav = model.generate(it['text'], audio_prompt_path=args.voice, exaggeration=args.exaggeration, cfg_weight=args.cfg)
        except Exception as e:  # noqa: BLE001
            if used != 'cpu':
                # an op without an MPS kernel: finish this batch on the CPU
                model = ChatterboxTTS.from_pretrained(device='cpu')
                used = 'cpu'
                wav = model.generate(it['text'], audio_prompt_path=args.voice, exaggeration=args.exaggeration, cfg_weight=args.cfg)
            else:
                print(json.dumps({'id': it['id'], 'error': str(e)[:300]}), flush=True)
                continue
        ta.save(it['out'], wav, model.sr)
        print(json.dumps({'id': it['id'], 'seconds': round(wav.shape[-1] / model.sr, 2), 'gen': round(time.time() - t0, 1), 'device': used}), flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
