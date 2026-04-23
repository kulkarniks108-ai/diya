# Migration Mapping: Expo to Flutter

This document maps the current Expo MVP features to their planned Flutter equivalents, highlighting migration priorities and known gaps.

## Expo MVP Features
- **BLE Integration:** react-native-ble-plx, custom BLE flows
- **AI Analysis:** Gemini/OpenAI API integration
- **State Management:** Zustand
- **Navigation:** Expo Router
- **Notifications:** Expo Notifications
- **Hardware Triggers:** Modular, multi-accessory support
- **Voice & Accessibility:** Speech, vibration, voice-first flows

## Flutter Migration Plan
- **BLE:** Use flutter_blue_plus or similar, with background/foreground reliability
- **AI:** Integrate OpenAI/Gemini via Dio, abstracted via repository pattern
- **State Management:** Riverpod (global and feature-scoped)
- **Navigation:** go_router (declarative, deep linking)
- **Notifications:** firebase_messaging/local_notifications, background-safe
- **Hardware Triggers:** Platform channels for accessory support, modular adapters
- **Voice & Accessibility:** Use TTS/STT plugins, accessibility APIs, haptic feedback

## Migration Priorities
1. BLE and hardware reliability (background/foreground)
2. State management and navigation
3. AI and backend abstraction
4. Notifications and observability
5. Accessibility and user flows

## Known Gaps & Considerations
- **BLE background support:** More complex in Flutter; requires platform-specific code
- **AI SDKs:** May need custom wrappers for Gemini/OpenAI
- **Multi-accessory:** Modular adapter pattern needed
- **Testing:** More robust unit/integration tests planned

---

**Next:** See [README.md](README.md) for Flutter docs overview and navigation.