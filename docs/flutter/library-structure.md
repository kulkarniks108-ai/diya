# Library Structure

This document describes the recommended library and folder structure for the Flutter app, balancing modularity, testability, and feature scalability.

## Hybrid Feature/Core Structure
- **Feature Folders:** Each major feature (e.g., auth, vision, family, BLE) gets its own folder with presentation, domain, and data subfolders.
- **Core Folder:** Shared utilities, base classes, and cross-cutting concerns (e.g., theme, error handling, DI, analytics).
- **Separation of Concerns:** UI, business logic, and data access are clearly separated.

## Example Structure
```
lib/
  core/
    theme/
    error_handling/
    di/
    analytics/
    ...
  features/
    auth/
      presentation/
      domain/
      data/
    vision/
      ...
    family/
      ...
    ble/
      ...
  main.dart
```

## Modularity & Testability
- **Independent Features:** Features can be developed and tested in isolation.
- **Reusable Core:** Core utilities are decoupled from features.
- **Scalable:** New features can be added with minimal friction.

---

**Next:** See [runtime-reliability.md](runtime-reliability.md) for reliability and background/foreground strategies.