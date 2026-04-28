from datetime import UTC, datetime

from app.schemas import AccessoryEventInput, ArbitrationRequest
from app.modules.accessory.service import AccessoryEventArbitrator


def test_safety_event_wins_over_assist_event() -> None:
    arbitrator = AccessoryEventArbitrator()
    now = datetime.now(tz=UTC)

    result = arbitrator.resolve(
        ArbitrationRequest(
            events=[
                AccessoryEventInput(
                    event_id='assist-1',
                    source_device_id='goggle-1',
                    accessory='goggle',
                    event_type='assist',
                    trusted=True,
                    received_at=now,
                ),
                AccessoryEventInput(
                    event_id='safety-1',
                    source_device_id='cane-1',
                    accessory='cane',
                    event_type='safety',
                    trusted=False,
                    received_at=now,
                ),
            ]
        )
    )

    assert result.winner_event_id == 'safety-1'
    assert result.reason == 'priority'
    assert result.suppressed_event_ids == ['assist-1']
