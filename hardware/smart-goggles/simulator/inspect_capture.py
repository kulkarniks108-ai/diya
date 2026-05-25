import sys
from PIL import Image, UnidentifiedImageError

if len(sys.argv) != 2:
    print('Usage: python inspect_capture.py <path-to-binary>')
    sys.exit(2)

path = sys.argv[1]
print('file:', path)
with open(path, 'rb') as f:
    b = f.read()
print('len:', len(b))
print('first 32 bytes:', b[:32].hex())

try:
    im = Image.open(path)
    im.load()
    print('Pillow opened image: format=', im.format, 'size=', im.size, 'mode=', im.mode)
except UnidentifiedImageError as e:
    print('Pillow failed to open image:', e)
except Exception as e:
    print('Other Pillow error:', e)

# Attempt to re-encode if Pillow opened it
try:
    im = Image.open(path)
    im_rgb = im.convert('RGB')
    out = 'capture_reencoded.jpg'
    im_rgb.save(out, format='JPEG', quality=90, optimize=False, progressive=False)
    print('Re-encoded saved to', out)
except Exception as e:
    print('Re-encode failed:', e)
