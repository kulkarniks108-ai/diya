from pathlib import Path
p=Path('d:/IMP-projects/2ndEye/hardware/smart-goggles/simulator/capture_diag.bin')
b=p.read_bytes()
print('len',len(b))
try:
    print('utf-16:\n', b.decode('utf-16'))
except Exception as e:
    print('utf-16 decode failed:', e)
print('utf-8 (with replacement):\n', b.decode('utf-8',errors='replace'))
