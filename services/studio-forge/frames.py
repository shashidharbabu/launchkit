#!/usr/bin/env python3
"""Contact sheet of one frame after every cut: python3 frames.py reel.mp4 out.jpg [t1,t2,...]

Without a time list, it takes 25 frames evenly. With one, it grabs each time
(a frame a few hundred ms after each seam is the honest read of an edit)."""
import subprocess, sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
if len(sys.argv) > 3:
    times = [float(t) for t in sys.argv[3].split(',')]
else:
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).decode())
    times = [round(dur * (i + 0.5) / 25, 2) for i in range(25)]
W, H = 270, 480
frames = []
for i, t in enumerate(times):
    p = f"{out}.f{i:02d}.jpg"
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1', '-q:v', '3', '-vf', f'scale={W}:{H}', p], check=True)
    frames.append((t, Image.open(p)))
cols = 5
rows = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 6) + 6, rows * (H + 30) + 6), 'black')
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 20)
except Exception:
    font = ImageFont.load_default()
for i, (t, im) in enumerate(frames):
    x = 6 + (i % cols) * (W + 6)
    y = 6 + (i // cols) * (H + 30)
    sheet.paste(im, (x, y + 24))
    d.text((x + 4, y + 2), f"{t:.2f}s", fill='white', font=font)
sheet.save(out, quality=88)
print(out, sheet.size, len(frames), 'frames')
