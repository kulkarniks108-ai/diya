# Solution Overview

## High-Level Solution

2ndEye is a modular assistive platform centered on a smartphone app that acts as an intelligent companion for visually impaired users.

The platform provides:
- Real-time environmental awareness
- Safety workflows including live tracking and SOS
- Voice-first interaction that reduces dependence on visual UI
- Optional hardware expansion for stronger sensing and controls

## Product Model

The platform is designed to work across three operating modes:

1. Phone-only mode
- Uses mobile camera, speech, and basic audio devices
- Enables low-cost entry and immediate usability

2. Hybrid mode
- Phone remains the control and orchestration center
- Optional accessories add specialized sensing and interaction

3. Expanded multi-device mode
- Multiple accessories connected simultaneously
- Auto-managed reconnection and coordinated event handling

## Experience Principles

1. Voice-first interaction
- Core workflows should be executable through voice and audio feedback
- Screen-reader compatibility is a baseline requirement

2. Low-friction operation
- Daily operation should require minimal manual intervention after setup
- System should recover from failures automatically whenever possible

3. Modular upgrade path
- Users should be able to start small and add capability over time
- Existing workflows should continue to work as hardware is added

4. Reliability-first assistive behavior
- Safety functions must remain dependable in both background and foreground operation
- Connection loss should trigger automated recovery strategies

## Technical Direction

- Mobile app: cross-platform implementation with production target on Flutter
- AI pipeline: hybrid on-device and cloud-supported inference
- Backend: Firebase and Google Cloud aligned architecture for identity, messaging, and real-time updates
- Edge and accessories: ESP32-based and accessory-agnostic integration model

## Core Capability Areas

- Surroundings understanding and obstacle-aware guidance
- Text and contextual interpretation support
- Live location sharing for trusted contacts
- SOS alerting and safety state propagation
- Device orchestration across BLE and Wi-Fi accessory classes

## Design Goal

A truly assistive system should adapt to what the user has, run reliably in real-world conditions, and provide meaningful value without demanding privilege, high technical effort, or continuous attention.
