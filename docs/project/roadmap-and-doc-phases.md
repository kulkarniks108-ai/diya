# Roadmap and Documentation Phases

## Purpose

This document defines documentation sequencing and project-level execution intent.
It clarifies what is done now and what is intentionally deferred.

## Documentation Phase Plan

## Phase 1 (Current): docs/project

Status:
- In progress and now implemented as the first priority

Goal:
- Provide a complete project-level source of truth covering problem, solution, architecture, hardware, reliability, and MVP transparency

Outputs:
- Project narrative and strategic technical direction
- Honest current-state baseline from Expo MVP
- Enterprise readiness requirements at project level

## Phase 2 (Future): docs/expo

Goal:
- Capture Expo implementation details deeply as reference contracts

Planned focus:
- Route-level behavior
- Store and state transitions
- BLE and hardware event implementation details
- Current failure modes and empirical constraints

## Phase 3 (Future): docs/flutter

Goal:
- Define production implementation architecture and delivery plan for Flutter

Planned focus:
- Feature-by-feature mapping from Expo baseline
- Runtime reliability and background execution strategy
- Multi-accessory orchestration and reconnection engine design
- Enterprise hardening controls and rollout planning

## Delivery Sequencing Intent

1. Project understanding first
- Shared language and vision alignment across engineering and business

2. Baseline implementation clarity second
- Accurate understanding of what exists today

3. Production implementation planning third
- Reliable and scalable Flutter design using validated product logic

## Milestone View

M1: Project docs complete
- Reader can understand full platform intent from docs/project alone

M2: Expo behavior contract docs complete
- Reader can trace current implementation behavior and limitations

M3: Flutter production docs complete
- Reader can execute implementation with clear priorities and constraints

## Non-Negotiables Across Phases

- No event-specific framing
- Transparency about current gaps
- Reliability-first language for safety workflows
- Modular and extensible architecture guidance

## Immediate Next Actions After Phase 1

1. Review and tighten docs/project language for stakeholder alignment
2. Start docs/expo extraction from source and behavior traces
3. Start docs/flutter production mapping after Expo reference docs stabilize
