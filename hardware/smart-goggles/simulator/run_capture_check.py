from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
resp = client.post('/capture')
print('status:', resp.status_code)
print('content-type:', resp.headers.get('content-type'))
data = resp.content
print('length:', len(data))
print('first bytes:', data[:8].hex())
print('jpeg_magic:', data[0]==0xFF and data[1]==0xD8)
