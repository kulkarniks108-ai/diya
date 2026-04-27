# Auth and Roles

This document defines the FastAPI identity and authorization model for 2ndEye.

## Goals

- Keep user access secure and simple
- Support blind user and family user roles
- Make token handling reliable for Flutter integration
- Allow refresh rotation and revocation

## Token Model

- Short lived access token
- Long lived refresh token with rotation
- Server side revocation support
- Stable claims for role and account state

## Roles

### Blind User
- Owns the device session
- Triggers assistive and safety actions
- Manages trusted contacts and connected devices

### Family User
- Receives safety notifications
- Views live location and safety state
- Monitors alerts through app or web

### Admin Ops
- Supports service monitoring and support workflows
- Does not access user data outside operational need

## Rules

- Auth should use signed JWTs
- Refresh flow must be idempotent and rotation safe
- Protected endpoints must verify role claims explicitly
- Access control should be enforced in the backend, not only in Flutter

## RBAC Model

The backend should use Casbin with endpoint-style actions.

### Action Pattern
- resource:action format
- Examples: user:create, user:read, safety:sos_trigger, safety:sos_resolve, device:register, location:update

### Subject Model
- Subjects represent role assignments and scoped identities
- Roles include blind_user, family_user, admin_ops
- Role bindings are resolved before endpoint and service execution

### Enforcement Points
- Route-level enforcement for coarse access control
- Service-level enforcement for domain-conditional authorization
- Repository layer should never perform RBAC checks

## JWT Claim Baseline

- sub for identity
- role for primary role
- permissions as optional explicit grants
- session_id for revocation and audit correlation
- token_version for forced invalidation workflows

## Token Lifecycle

- Access token short TTL
- Refresh token longer TTL with rotation
- Revocation list support by session_id and token identifier
- Refresh replay detection with immediate invalidation on violation

---

**Next:** See [realtime-and-notifications.md](realtime-and-notifications.md) for event delivery planning.
