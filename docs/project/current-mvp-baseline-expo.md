# Current MVP Baseline (Expo)

## Purpose

This document records what is currently implemented in the Expo MVP and where it falls short of the long-term production target.

This is intentionally transparent so planning and execution can be grounded in reality.

## What Exists Today

## User Roles and Navigation

Implemented:
- Blind and family role model
- Role-based routing and auth-gated navigation

Evidence:
- [expoApp/app/_layout.tsx](../../expoApp/app/_layout.tsx)
- [expoApp/store/auth.ts](../../expoApp/store/auth.ts)

## Assistive Core

Implemented:
- Camera capture workflow
- AI-based surroundings description pipeline
- Speech output for guidance
- Prompt variants for short and detailed responses

Evidence:
- [expoApp/core/assist.ts](../../expoApp/core/assist.ts)
- [expoApp/services/analyze.ts](../../expoApp/services/analyze.ts)
- [expoApp/services/visionService.ts](../../expoApp/services/visionService.ts)
- [expoApp/services/speech.ts](../../expoApp/services/speech.ts)
- [expoApp/constants/prompt.ts](../../expoApp/constants/prompt.ts)

## Safety Core

Implemented:
- Live location start/stop flow
- SOS trigger and clear flow
- Family-side live status subscription and display

Evidence:
- [expoApp/store/live.ts](../../expoApp/store/live.ts)
- [expoApp/store/familyStore.ts](../../expoApp/store/familyStore.ts)
- [expoApp/app/(family)/(tabs)/index.tsx](../../expoApp/app/(family)/(tabs)/index.tsx)

## Notifications

Implemented:
- Push token registration for family role
- SOS push dispatch through Expo push endpoint
- Notification response routing

Evidence:
- [expoApp/services/notification/notifications.ts](../../expoApp/services/notification/notifications.ts)
- [expoApp/services/notification/saveToken.ts](../../expoApp/services/notification/saveToken.ts)
- [expoApp/utils/notifications/sendPush.ts](../../expoApp/utils/notifications/sendPush.ts)

## Device Integration Baseline

Implemented:
- BLE scanning and connection lifecycle for ESP32-like device
- Button-event parsing and action mapping
- Auto-connect using stored preferred device ID
- Debug screens for BLE state and events

Evidence:
- [expoApp/services/ble/bleManager.ts](../../expoApp/services/ble/bleManager.ts)
- [expoApp/services/ble/esp32Adapter.ts](../../expoApp/services/ble/esp32Adapter.ts)
- [expoApp/types/esp32.ts](../../expoApp/types/esp32.ts)
- [expoApp/core/hardwareTriggers.ts](../../expoApp/core/hardwareTriggers.ts)
- [expoApp/app/(blind)/ble-debug.tsx](../../expoApp/app/(blind)/ble-debug.tsx)

## Backend and Data Baseline

Implemented:
- Firebase Auth and Firestore integration
- Users, access, liveStatus, and pushTokens collection usage

Evidence:
- [expoApp/config/firebase.ts](../../expoApp/config/firebase.ts)
- [expoApp/store/auth.ts](../../expoApp/store/auth.ts)
- [expoApp/store/live.ts](../../expoApp/store/live.ts)

## Known MVP Constraints

## Runtime and Reliability Constraints

- Background execution for safety workflows is limited
- Live tracking continuity is not guaranteed under all OS power-management states
- Full multi-accessory orchestration is not implemented
- BLE implementation is currently oriented around single-device baseline behavior

## Device Ecosystem Constraints

- Smart cane, smart goggle, smart ring, bracelet, and neckband full orchestration model is not yet implemented
- Wi-Fi and USB accessory paths are not yet represented as first-class production modules

## Enterprise Control Constraints

- Observability and production diagnostics are limited
- Retry and escalation policies are not yet fully formalized end-to-end
- Security/privacy hardening and operational governance require expansion for enterprise deployment

## Why the MVP Is Still Valuable

The Expo MVP successfully validates core product assumptions:
- Role-based assistive and caregiver model is workable
- AI-assisted guidance provides immediate utility
- Safety workflows are functional at baseline
- Hardware-triggered interaction model is viable

This baseline is strong enough to guide a production-focused architecture transition.

## Immediate Implication for Next Phases

- docs/project is now the strategic source of truth
- docs/expo should later document implementation details and behavior contracts in depth
- docs/flutter should later define production architecture and delivery plan using this baseline
