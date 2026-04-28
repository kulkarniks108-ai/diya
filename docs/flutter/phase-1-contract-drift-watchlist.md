# Phase 1 Contract Drift Watchlist

This watchlist tracks areas that are likely to change as implementation and real device testing start.

## Watch Areas

### 1. API Shape

- new fields added by the backend
- renamed or deprecated response fields
- pagination and cursor behavior

### 2. Auth and Session

- token refresh lifetime
- refresh reuse behavior
- revocation timing

### 3. Device and Arbitration

- event ordering under simultaneous accessory input
- trust scoring and arbitration tuning
- future accessory class integration

### 4. Transport and Delivery

- push provider implementation details
- AI provider switching strategy
- background execution behavior by platform

### 5. Recovery and Offline Sync

- queue replay ordering
- deduplication window changes
- recovery behavior after app kill or restart

## Drift Policy

- If a contract area drifts, update the docs before changing the implementation.
- Keep the baseline behavior stable for the current release unless a higher-priority safety issue demands otherwise.
- Avoid rewriting the app shell for contract drift unless the shell itself is the problem.

## Review Cadence

- Re-check after each major endpoint change.
- Re-check after first hardware integration.
- Re-check after the first real device beta.

## When To Escalate

- A drift affects safety behavior.
- A drift affects auth/session recovery.
- A drift affects event deduplication or replay.
- A drift forces a different app shell or provider boundary.
