from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, List
from collections import deque


@dataclass
class SimulatorState:
    device_id: str = "GOGGLE-SIM-001"
    connected: bool = False
    battery_level: int = 92
    ultrasonic_cm: float = 120.0
    stream_fps: int = 8
    telemetry_hz: float = 2.0
    last_command: Dict[str, object] = field(default_factory=dict)
    started_at: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))


class LogBuffer:
    def __init__(self, max_items: int = 200) -> None:
        self._buffer: Deque[Dict[str, object]] = deque(maxlen=max_items)

    def add(self, item: Dict[str, object]) -> None:
        self._buffer.appendleft(item)

    def list(self) -> List[Dict[str, object]]:
        return list(self._buffer)
