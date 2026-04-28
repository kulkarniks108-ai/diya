# CI/CD and Release Gates

This document defines the recommended CI/CD workflow, gating rules, and release checks to ensure a reproducible and safe deployment path for the Flutter app and FastAPI backend.

## Goals
- Ensure builds are reproducible and traceable.
- Prevent regressions by enforcing automated checks before merges.
- Provide safe rollout and rollback procedures.

## Pipeline Stages (recommended)

1. Lint & Static Analysis
   - `flutter analyze` / `dart format` / `eslint` for web/frontend where applicable.
   - Python: `ruff`/`mypy` and OpenAPI validation for backend.

2. Unit Tests
   - Run unit tests with coverage threshold (e.g., 70% default).

3. Integration Tests (containerized)
   - Backend + DB + redis smoke tests.

4. Contract Tests
   - Verify client expectations vs server OpenAPI (contract tests) — run against a contract stub.

5. E2E (optional per PR) / Nightly
   - Device integration tests using hardware-in-the-loop or simulators.

6. Build Artifacts
   - Produce signed APK/AAB and iOS artifacts (CI stores but does not publish unless release gate passed).

7. Release Gates
   - Manual approval required for production release.
   - Metrics & SLO checks: no high-severity errors in staging for last 24 hours.
   - Accessibility checklist signed off.

8. Canary / Gradual Rollout
   - Deploy to a small percentage (e.g., 5%) then increase to 25% then 100% with monitoring windows.

## Release Gate Checklist (must pass)
- All pipeline stages green.
- Critical acceptance tests pass for safety flows.
- Observability configured: dashboards for SOS latency, error rate, reconnect rate.
- Security scan results acceptable (no critical findings).
- Release notes and rollback plan documented.

## Rollback Strategy
- Use artifact versioning and a rollback playbook.
- For backend: revert to previous container image and monitor.
- For mobile: publish quick-fix patch to beta track then to production after verification.

## Environment & Secrets
- Use a centralized secret store (e.g., HashiCorp Vault, Azure Key Vault, or GitHub Secrets) and restrict access.
- CI should only publish to staging/production after manual approval via protected environments.

## Minimal Implementation for Simplicity
- For initial deployments, use GitHub Actions with artifact storage, a staging environment, and manual approvals for production.

## Runbook Snippet
- If SOS latency regresses above SLO: rollback backend, notify on-call, open incident for investigation.
