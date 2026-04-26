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

---

**Next:** See [realtime-and-notifications.md](realtime-and-notifications.md) for event delivery planning.
