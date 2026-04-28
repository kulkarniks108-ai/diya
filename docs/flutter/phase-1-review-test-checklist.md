# Phase 1 Review and Test Checklist

This checklist is the review gate before implementation moves from planning into code.

## Review Checks

### Architecture

- The app shell can evolve without rewriting feature modules.
- Riverpod provider layers do not leak feature logic into UI widgets.
- Repositories and data sources are clearly separated from screens.
- Future devices can be added through adapters.

### State and Recovery

- Session state is recoverable after restart.
- Queued actions are replayable and dedupable.
- The app knows what to do when network or permissions disappear mid-flow.

### Networking and Contracts

- Token refresh behavior is deterministic.
- Unknown backend fields do not break the client.
- Errors preserve trace IDs and useful support context.

### Safety and Assistive Flow

- Safety-related actions never fail silently.
- Assist flows have clear fallback behavior.
- The client avoids choosing a final provider or transport too early.

### Future Flexibility

- AI provider changes do not require a redesign.
- Push provider changes do not require a redesign.
- Background behavior is documented as capability-based, not hard-guaranteed.

## Paper Test Scenarios

1. App cold-starts with no session.
2. App cold-starts with a valid session and a stale queue.
3. Refresh token expires while the app is backgrounded.
4. Cane and goggle emit near-simultaneous events.
5. Permission is revoked mid-session.
6. App is killed during SOS or assist handling.
7. Backend returns an unknown error code or extra field.

## Expected Output For Each Test

- user-visible result
- local state result
- backend request/response result
- retry or replay behavior
- explicit escalation behavior
