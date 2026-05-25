from pathlib import Path
p=Path('d:/IMP-projects/2ndEye/hardware/smart-goggles/simulator/capture_diag_recent.bin')
b=p.read_bytes()
print('len',len(b))
print('hex prefix', b[:64].hex())
print('contains ff d8?', b'\xff\xd8' in b)
print('first ff d8 pos', b.find(b'\xff\xd8'))
print('contains PNG?', b'\x89PNG' in b)
print('first PNG pos', b.find(b'\x89PNG'))
# print readable ascii tail
try:
    print('tail (utf-8):', b[-200:].decode('utf-8',errors='replace'))
except Exception:
    pass
