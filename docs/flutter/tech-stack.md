# Tech Stack and Runtime Choices

This document details the core technology stack and runtime strategies for the Flutter migration, emphasizing flexibility, reliability, and future-proofing.

## Core Libraries
- **Dio:** Advanced HTTP client for robust networking, interceptors, and error handling.
- **Drift:** Local persistence with reactive SQLite, supporting offline-first and complex queries.
- **Riverpod:** State management (see architecture-approach.md).
- **go_router:** Navigation (see architecture-approach.md).

## Runtime & Reliability
- **Hybrid Background/Foreground:** Uses platform channels and isolates for reliable background tasks (BLE, notifications, telemetry, limited AI, etc.).
- **Observability:** Integrated logging, error reporting, and analytics for production monitoring.
- **Resilience:** Automatic reconnection, retry logic, and state restoration for critical flows.
- **Background-First Design:** The stack should support one-time setup followed by mostly autonomous runtime behavior.
- **Backend Contract Handling:** Dio interceptors should attach access tokens, refresh on expiry, and map backend errors into a shared domain failure shape.

## Backend Integration
- **FastAPI Repositories:** The app talks to FastAPI through repository implementations instead of a generic backend swapper.
- **Optional Service Clients:** Narrow clients can be used for push delivery or monitoring helpers when needed.
- **Dependency Injection:** Ensures testability and modularity.
- **Sync Behavior:** Safety-critical writes should use idempotency keys and local retry queues.

## Why This Stack?
- **Performance:** Optimized for mobile, with proven reliability in production apps.
- **Flexibility:** Backend and platform-agnostic, supporting future integrations.
- **Maintainability:** Modular, testable, and easy to onboard new developers.

---

**Next:** See [library-structure.md](library-structure.md) for project organization.