import base64
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_capture_returns_jpeg():
    resp = client.post('/capture')
    assert resp.status_code == 200
    assert resp.headers.get('content-type', '').startswith('image/jpeg')
    data = resp.content
    # JPEG files start with 0xFF 0xD8 and end with 0xFF 0xD9 (at least start check here)
    assert len(data) > 0
    assert data[0] == 0xFF and data[1] == 0xD8
