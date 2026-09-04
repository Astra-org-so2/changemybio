import sys, os
from PIL import Image
src, cid = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); px = im.load(); w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if r > 238 and g > 238 and b > 238: px[x, y] = (r, g, b, 0)
im = im.crop(im.getbbox()); im.thumbnail((256, 256))
can = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); can.paste(im, ((256 - im.width) // 2, (256 - im.height) // 2))
os.makedirs('assets/characters', exist_ok=True); out = f'assets/characters/{cid}.webp'; can.save(out, 'WEBP', quality=85)
print(out, os.path.getsize(out), 'bytes')
