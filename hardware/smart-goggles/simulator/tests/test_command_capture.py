import base64

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_command_capture_returns_data_url_jpeg():
    resp = client.post('/command', json={'command': 'capture'})
    assert resp.status_code == 200
    assert resp.headers.get('content-type', '').startswith('application/json')
    data = resp.json()
    assert data.get('status') == 'ok'
    image_data_url = data.get('image_data_url')
    assert isinstance(image_data_url, str) and image_data_url.startswith('data:image/jpeg;base64,')
    encoded = image_data_url.split(',', 1)[1]
    decoded = base64.b64decode(encoded)
    assert len(decoded) > 0
    assert decoded[0] == 0xFF and decoded[1] == 0xD8
