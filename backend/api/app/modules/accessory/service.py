from __future__ import annotations

from app.schemas import ArbitrationOutcome, ArbitrationRequest


class AccessoryEventArbitrator:
    priority_map = {"safety": 0, "assist": 1, "command": 2, "telemetry": 3}

    def resolve(self, request: ArbitrationRequest) -> ArbitrationOutcome:
        if not request.events:
            return ArbitrationOutcome(reason="no-events")

        sorted_events = sorted(
            request.events,
            key=lambda event: (
                self.priority_map.get(event.event_type, 99),
                0 if event.trusted else 1,
                event.received_at,
                event.priority,
                event.event_id,
            ),
        )
        winner = sorted_events[0]
        suppressed = [event.event_id for event in sorted_events[1:]]
        reason = "priority" if winner.event_type == "safety" else "trusted-source" if winner.trusted else "received-first"

        return ArbitrationOutcome(
            winner_event_id=winner.event_id,
            winner_source_device_id=winner.source_device_id,
            reason=reason,
            suppressed_event_ids=suppressed,
        )


accessory_event_arbitrator = AccessoryEventArbitrator()
