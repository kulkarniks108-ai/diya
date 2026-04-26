# Data Model and Events

This document defines the backend data shape and domain events for 2ndEye.

## Core Entities

### User
- id
- role
- display name
- auth state
- trusted contact links

### Device
- id
- owner id
- transport type
- model
- firmware version
- health state
- last seen timestamp

### Safety Session
- id
- user id
- state
- started at
- resolved at
- escalation level

### Location Snapshot
- id
- user id
- coordinates
- confidence
- timestamp

### AI Job
- id
- user id
- input type
- status
- result payload
- created at

## Domain Events

- auth session created
- device registered
- device health changed
- location updated
- sos triggered
- sos escalated
- sos resolved
- ai job requested
- ai job completed

## Event Rules

- Events should be versioned
- Events should be idempotent where needed
- Event payloads should be safe for mobile sync
- Domain events should support both realtime delivery and audit logging

---

**Next:** See [ops-reliability.md](ops-reliability.md) for observability and runtime operations.
