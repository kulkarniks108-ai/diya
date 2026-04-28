# FastAPI Backend Roadmap — 2ndEye

This is the living implementation roadmap for the 2ndEye FastAPI backend.
It tracks what is done, what is in progress, and what is planned — phase by phase.
Update this file every time a phase completes or a decision changes.

---

## Ground Rules

- Never commit directly to `main`
- Every phase lives on its own branch, branched from the previous phase's merged state
- Commit often — 10 to 30 small commits per phase is normal and expected
- Commit format: `type(domain): short human message` — no AI-sounding descriptions
- Docs must be updated in the same commit or PR that changes the behavior they describe
- No silent errors — every failure must be logged with a `trace_id`
- No hardcoded secrets — ever

---

## Tech Decisions (locked)

| Concern | Choice |
|---|---|
| Language | Python 3.13 |
| Package manager | uv |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x async |
| DB driver | asyncpg |
| Database | PostgreSQL (local dev) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| RBAC | Casbin (pycasbin + sqlalchemy adapter) |
| Roles | `BLIND`, `FAMILY`, `ADMIN` |
| AI provider | Gemini 2.5 Flash via google-generativeai SDK |
| Push notifications | Firebase Cloud Messaging (deferred — no project yet) |
| Realtime | WebSockets (built into FastAPI/Starlette) |
| Cache | Redis — deferred until first module needs it |
| Logging | python-json-logger — pretty in dev, JSON in prod |
| Testing | pytest + httpx (async) |
| Observability | OpenTelemetry + Prometheus (wired in phase 3, used from phase 4+) |

---

## Phase Overview

```
Phase 0  — Foundation cleanup and hardening         ← current
Phase 1  — Database layer (async SQLAlchemy + Alembic)
Phase 2  — Shared contracts (response envelope, error catalog, idempotency)
Phase 3  — Auth module (register, login, refresh, logout, RBAC)
Phase 4  — Users module (profile, trusted contacts)
Phase 5  — Safety module (SOS trigger, escalate, resolve, state)
Phase 6  — Location module (live location update, timeline, family view)
Phase 7  — Devices module (register, health, telemetry)
Phase 8  — Realtime module (WebSocket sessions, event fanout)
Phase 9  — Notifications module (FCM push — deferred until Firebase ready)
Phase 10 — AI module (Gemini 2.5 Flash image analysis)
Phase 11 — Observability hardening (OTel tracing, Prometheus metrics)
Phase 12 — Testing layer (unit, integration, contract, e2e)
```

---

## Phase 0 — Foundation Cleanup and Hardening

**Branch:** `feat/fastapi-setup` (current)
**Status:** In progress

### What exists (already committed)

- uv project initialized, Python 3.13
- Basic folder skeleton: `app/config/`, `app/api/`, `app/db/`, `app/shared/`
- `settings.py` — minimal Pydantic settings (app_name, debug, secret_key)
- `logging.py` — JSON logging wired, single handler
- `security.py` — password hashing + basic JWT creation
- `app/main.py` — bare FastAPI app (has test `/token` endpoint — to be removed)
- `pyproject.toml` — core deps present, missing asyncpg, httpx, pytest

### What needs to be done in Phase 0

- [ ] Remove test `/token` endpoint from `app/main.py`
- [ ] Expand `settings.py` — add all required config groups: app, auth, db, observability, providers
- [ ] Expand `.env.example` — document every required variable with safe placeholder values
- [ ] Fix `logging.py` — add pretty mode for dev, JSON for prod, required fields (trace_id, module, operation, result_status)
- [ ] Fix `security.py` — full JWT claims (sub, role, session_id, token_version), refresh token support, token TTL from settings
- [ ] Wire `app/main.py` properly — lifespan handler, versioned router mount, CORS, global error handler registration
- [ ] Fill `app/api/router.py` — versioned prefix `/api/v1`, module router registration pattern
- [ ] Fill `app/api/deps.py` — base dependency stubs (get_db session, get_current_user placeholder)
- [ ] Fill `app/api/error_handlers.py` — global exception handlers for domain errors, validation errors, unhandled exceptions
- [ ] Add missing dependencies to `pyproject.toml`: asyncpg, httpx, pytest, pytest-asyncio, casbin
- [ ] Update `README.md` with how to run the project locally

### Acceptance criteria

- `uvicorn app.main:app --reload` starts with zero errors
- All config is loaded from `.env`, startup fails fast if required vars are missing
- Every log line in dev is human-readable, in prod is valid JSON
- No test endpoints in the app

---

## Phase 1 — Database Layer

**Branch:** `feat/db-layer` (branched from `feat/fastapi-setup` after merge)
**Status:** Not started

### Goals

- Async SQLAlchemy engine and session factory wired to Postgres
- `db/base.py` — declarative base with `id`, `created_at`, `updated_at` on every model
- `db/session.py` — async session dependency for FastAPI
- Alembic configured for async migrations
- First migration: empty baseline
- Connection tested at startup with a health check log

### Acceptance criteria

- App connects to local Postgres on startup
- `alembic upgrade head` runs cleanly
- Session dependency injectable in any route

---

## Phase 2 — Shared Contracts

**Branch:** `feat/shared-contracts` (branched from `feat/db-layer` after merge)
**Status:** Not started

### Goals

- `shared/contracts/response.py` — success and error envelope models
- `shared/contracts/errors.py` — full error code catalog (AUTH, SAFETY, DEVICE, LOCATION, SYSTEM, AUTHZ, REQUEST)
- `shared/contracts/idempotency.py` — idempotency key extraction and conflict handling
- All error codes aligned to the error catalog in `docs/backend/fastapi/error-catalog-and-handling.md`
- `trace_id` generated per request and attached to every response and log line

### Acceptance criteria

- Every success response uses the standard envelope
- Every error response uses the standard error envelope with a hierarchical code
- `trace_id` is present in every response header and log entry

---

## Phase 3 — Auth Module

**Branch:** `feat/auth-module` (branched from `feat/shared-contracts` after merge)
**Status:** Not started

### Goals

- User registration (email + password, role assignment: BLIND / FAMILY / ADMIN)
- Login — returns access token + refresh token
- Refresh — rotates refresh token, replay detection
- Logout — revokes session by session_id
- `get_current_user` dependency — validates JWT, checks revocation
- Casbin RBAC wired — policy model, role bindings, enforcement middleware
- Auth module follows: `api.py` → `service.py` → `repository.py` + `schemas.py` + `models.py` + `policies.py`
- Token claims: `sub`, `role`, `session_id`, `token_version`

### Acceptance criteria

- Register, login, refresh, logout all work end to end
- Expired or revoked tokens return `AUTH.TOKEN.EXPIRED` or `AUTH.SESSION.REVOKED`
- Role-protected endpoints reject wrong roles with `AUTHZ.PERMISSION.DENIED`
- All auth events logged with trace_id

---

## Phase 4 — Users Module

**Branch:** `feat/users-module`
**Status:** Not started

### Goals

- User profile fetch and update
- Trusted contact management (BLIND user links FAMILY users)
- Role-aware access: BLIND user manages their own contacts, FAMILY user reads their linked blind user's state

---

## Phase 5 — Safety Module

**Branch:** `feat/safety-module`
**Status:** Not started

### Goals

- SOS trigger, escalate, resolve endpoints
- Safety session state machine: CREATED → ACTIVE → ESCALATED → RESOLVED → CLOSED
- Idempotency keys on all write operations
- Safety events emitted for realtime fanout (Phase 8)
- All transitions logged with full audit trail

---

## Phase 6 — Location Module

**Branch:** `feat/location-module`
**Status:** Not started

### Goals

- Live location update from BLIND user
- Location timeline fetch
- Family view state (latest location + safety state combined)
- Location data partially masked in operational logs (full precision in audit only)

---

## Phase 7 — Devices Module

**Branch:** `feat/devices-module`
**Status:** Not started

### Goals

- Device registration (cane, goggle, wearables)
- Device health update and telemetry ingestion
- Connected device state fetch
- Device health events emitted for realtime fanout

---

## Phase 8 — Realtime Module

**Branch:** `feat/realtime-module`
**Status:** Not started

### Goals

- WebSocket endpoint for active sessions
- Event stream: location updates, SOS state, device health
- Resume cursor for reconnect recovery
- Push fallback when WebSocket is unavailable (hooks into Phase 9)

---

## Phase 9 — Notifications Module

**Branch:** `feat/notifications-module`
**Status:** Deferred — Firebase project not yet set up

### Goals

- FCM push provider integration
- SOS push dispatch to family users
- Push token registration and management
- Idempotent delivery with retry and dead-letter handling

---

## Phase 10 — AI Module

**Branch:** `feat/ai-module`
**Status:** Not started

### Goals

- Image analysis endpoint using Gemini 2.5 Flash (`google-generativeai` SDK)
- API key from Google AI Studio via environment variable
- AI job model: submit → poll status → fetch result
- Graceful degradation when provider is unavailable
- Result normalized into a unified guidance response format

---

## Phase 11 — Observability Hardening

**Branch:** `feat/observability`
**Status:** Not started

### Goals

- OpenTelemetry trace instrumentation across REST, WebSocket, repository, and provider calls
- Prometheus metrics: latency, throughput, error rate, retry volume
- Structured log fields aligned to ops-reliability.md requirements
- Health check endpoint (`/health`) with DB and provider status

---

## Phase 12 — Testing Layer

**Branch:** `feat/testing-layer`
**Status:** Not started

### Goals

- `tests/unit/` — service logic with mocked repositories
- `tests/integration/` — repository adapters against real Postgres test DB
- `tests/contract/` — API contract tests with httpx async client
- `tests/e2e/` — full flow tests (register → login → SOS → resolve)
- pytest + pytest-asyncio setup
- CI-ready test runner configuration

---

## Branching Convention

```
main                        ← stable, never commit directly
  └── feat/fastapi-setup    ← Phase 0 (current)
        └── feat/db-layer   ← Phase 1
              └── feat/shared-contracts  ← Phase 2
                    └── feat/auth-module ← Phase 3
                          └── ...
```

Each phase branch is created from the previous one after it is reviewed and merged.

---

## Docs Update Policy

- Every phase that changes behavior must update the relevant doc in `docs/backend/fastapi/`
- Roadmap status rows must be updated when a phase starts and when it completes
- `.env.example` must stay in sync with `settings.py` at all times
- No phase is considered done until its doc is updated and committed

---

*Last updated: Phase 0 in progress*
