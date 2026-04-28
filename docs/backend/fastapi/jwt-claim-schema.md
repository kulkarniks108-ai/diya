# JWT Claim Schema & Refresh Policy

This document specifies the canonical JWT claim set used for access tokens, the refresh token lifecycle, and how the client should handle rotation and revocation.

## Access Token (JWT) — Claims

- `sub` (string, UUID): user id.
- `uid` (string): duplicate of `sub` for convenience.
- `roles` (array[string]): e.g., `["blind","family","admin"]`.
- `permissions` (array[string], optional): fine-grained permission strings (e.g., `safety:sos:create`). Use sparingly to avoid oversized tokens.
- `session_id` (string, UUID): identifies the user session; used to correlate refresh tokens and revocations.
- `token_version` (int): increments when server-side session invalidation happens.
- `jti` (string): JWT ID for single-token revocation and audit.
- `iat`, `nbf`, `exp`: standard time claims.

Token size guidance: avoid putting large role/permission lists into access token when possible. If many permissions required, prefer a short `permissions_hash` and a permissions lookup endpoint.

## Refresh Token

- Format: opaque random token stored server-side.
- Rotation: server rotates refresh token at each successful refresh (issue new refresh token and invalidate the previous one).
- Reuse detection: if an already-rotated refresh token is used, treat as possible theft and revoke session; return `401` with `AUTH.REFRESH.TOKEN.REUSE` and require re-login.

## Session Model

- `session_id` groups refresh tokens across a device or login session.
- Server maintains a per-session revocation flag and optional device metadata (device_id, ip, user_agent).

## Client Handling Rules

- Keep access token in memory for short-term use; store refresh token securely (Keychain/Keystore / secure storage).
- Implement single in-flight refresh: queue requests when refresh in progress to avoid refresh storms.
- On `AUTH.TOKEN.EXPIRED`, trigger refresh flow. If refresh fails, redirect to login.

## Revocation & Blacklisting

- Store `jti` for high-value tokens if immediate revocation is required. For scalability, use a revocation window and cache (Redis) with TTL equal to max token lifetime.

## Example payload

```json
{
  "sub":"user-uuid",
  "uid":"user-uuid",
  "roles":["blind"],
  "permissions":["safety:sos:create"],
  "session_id":"session-uuid",
  "token_version":1,
  "jti":"token-uuid",
  "iat":1650000000,
  "exp":1650001800
}
```

## Open Questions (to finalize)

- HS256 vs RS256: prefer RS256 for multi-service deployments; HS256 acceptable for initial simple deployments.
- Claim inclusion policy: which permission granularity will be embedded vs. looked-up.

---

Reference: `docs/backend/fastapi/api-contracts-freeze.md` for higher-level auth endpoints and rotation behavior.
