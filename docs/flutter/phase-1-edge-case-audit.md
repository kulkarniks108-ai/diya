# Phase 1 Edge-Case Audit

This audit keeps Phase 1 from overfitting to the first happy path. Each item should remain open until real implementation and device testing prove a tighter rule is safe.

## Audit Principles

- Prefer explicit fallback over hidden assumptions.
- Preserve the ability to change provider, device, or transport decisions later.
- Treat background and recovery behavior as provisional until tested on target devices.

## Edge Cases To Preserve

### 1. Simultaneous Accessory Events

- Cane and goggle trigger the same user intent within a small time window.
- The system should remain deterministic but allow arbitration tuning later.

### 2. Offline Queue Survives Restart

- The app restarts with pending writes, queued safety actions, or partially completed retries.
- Queue ordering, deduplication, and replay must remain observable.

### 3. Auth Refresh Failure in Background

- Token refresh fails while the app is not foregrounded.
- The app should not silently lose the user session state or safety context.

### 4. Permission Revocation Mid-Session

- Camera, Bluetooth, microphone, location, or notifications are revoked during use.
- The app should degrade safely and prompt only when needed.

### 5. Camera Source Conflict

- Phone camera and goggle camera both appear available or one becomes stale.
- The app should keep source switching reversible.

### 6. Provider or Transport Swap Later

- Push delivery, AI model, or accessory transport changes after launch.
- Phase 1 must avoid hardwiring a provider-specific structure.

### 7. Backend Contract Drift

- The backend adds or changes fields while the client is not yet updated.
- The client should ignore unknowns safely and preserve user intent.

### 8. Recovery After Local Reconciliation

- The client recovers locally before the backend confirms the same event.
- The system should not double-apply actions or duplicate alerts.

### 9. App Kill During Safety Action

- The OS kills the app while a safety request is in flight.
- The app should recover enough state to continue or clearly re-enter the action.

### 10. New Device Class After Release

- A future device must plug into the same architecture without changing the current core.

## Audit Outcome Needed

For each edge case, the team should decide:

- what is guaranteed now
- what remains provisional
- what must be tested before coding deeper features
