# Beta Testing & Rollout Plan

Objective: run a controlled beta that validates device orchestration (cane + goggle), safety flows, and background reliability before public release.

1) Target Groups
- Internal alpha (team + trusted testers) — immediate functional validation.
- Closed beta (50–200 users) — real-world device mix and connectivity patterns.
- Gradual public beta (canary rollout) — expand to small percentages via Play/App Store.

2) Device Matrix
- Android phones: low-mid-high spec (3 examples each); ensure background restrictions tested across vendors.
- Smart Cane: BLE reference firmware v1.x
- Smart Goggle: Wi‑Fi reference firmware v1.x

3) Test Scenarios (must pass)
- SOS path under foreground/background and with one accessory failing.
- Assist flow using phone camera and goggle camera, with fallback behavior.
- Device reconnection after phone reboot.
- Token refresh behavior when app backgrounded for long periods.
- Background telemetry sync and queue flushing after reconnect.

4) Monitoring & Metrics During Beta
- SOS success rate, SOS delivery latency p50/p95, reconnect success rate, crash rate, ANR counts.
- Use the observability plan dashboards and alerts configured for beta thresholds.

5) Feedback Channels
- In-app feedback with `trace_id` capture.
- Dedicated Slack/Email for beta reports.

6) Acceptance Criteria
- No critical safety regressions in closed beta for 7 consecutive days.
- Crash rate below 1% for beta group.
- Device reconnection success > 95% for common scenarios.

7) Rollout Steps
- Publish to internal track; monitor 48–72 hours.
- Expand to closed beta; run minimum 14-day validation window.
- If stable, proceed to staged rollout (5% → 25% → 100%) with 24–48 hour monitoring windows.
