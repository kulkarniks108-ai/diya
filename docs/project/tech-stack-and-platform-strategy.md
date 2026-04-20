# Tech Stack and Platform Strategy

## Strategy Summary

The platform uses a hybrid architecture that combines on-device intelligence, cloud-scale services, and optional accessory hardware.

The technical direction is chosen to maximize:
- Accessibility
- Reliability
- Affordability
- Expandability

## Mobile Application Layer

Direction:
- Cross-platform mobile app tightly aligned with the Google ecosystem and accessibility-first design patterns

Current baseline:
- Expo + React Native MVP for rapid validation

Production target:
- Flutter implementation with stronger control over runtime behavior, background services, and long-term maintainability

Why this direction:
- Better enterprise governance for large-scale feature growth
- Strong modular architecture opportunities
- Better control over production-grade orchestration patterns

## AI and Machine Learning Layer

Direction:
- Hybrid inference pipeline

Components:
1. On-device inference
- TensorFlow Lite path for offline or degraded-connectivity scenarios
- Used for fast and privacy-sensitive baseline assistance

2. Cloud inference
- Google Cloud AI and Vision services for advanced scene understanding
- Higher capability mode when network quality allows

Design goal:
- Graceful fallback between cloud-enhanced and on-device modes without user disruption

## Backend and Cloud Services Layer

Direction:
- Firebase plus Google Cloud services

Core backend responsibilities:
- Authentication and role management
- Real-time safety state updates
- Push notification orchestration for SOS and related events
- Scalable API and data processing support

Architecture intent:
- Keep safety-critical paths clear and observable
- Support long-term multi-device and multi-role expansion

## IoT and Edge Layer

Direction:
- ESP32-based and accessory-agnostic ecosystem

Examples:
- ESP32-CAM based smart goggles
- Smart cane with BLE sensor and control stream
- Additional wearables such as bracelet, neckband, ring, and smart case

Design goal:
- Smartphone remains intelligence and orchestration center
- Accessories act as composable capability modules
- Multiple Accessories with multiple connection modes can be connected to the app at once

## Integration and Extensibility Model

Principles:
- API-based integration boundaries
- Transport-agnostic event model across BLE/Wi-Fi/USB
- Versioned contracts for backward-compatible evolution

Why this matters:
- Enables third-party or custom integrations
- Reduces lock-in to a single accessory implementation
- Supports long-term enterprise ecosystem growth

## Technical Decision Priorities

1. Reliability over feature velocity for safety-critical flows
2. Background and foreground continuity for daily usability
3. Modular architecture to reduce migration risk when adding new hardware classes
4. Security and privacy controls aligned to real-world deployment needs

## Relationship to Current MVP

Current Expo implementation validates core behaviors and user workflows.
Future Flutter implementation is intended to preserve the validated product logic while improving runtime robustness, scalability, and enterprise operations.

See:
- [current-mvp-baseline-expo.md](current-mvp-baseline-expo.md)
- [reliability-enterprise-requirements.md](reliability-enterprise-requirements.md)
