# UI / UX Design: Device Orchestration

## Overview
The UX for Phase 3 must bridge the gap between invisible background processes and necessary user awareness. Users need to know their safety devices are working, and developers/power-users need visibility into system state to diagnose issues.

## 1. Device Status UI
The main application interface will feature a discreet Device Status bar or icon suite.
- **Indicators:** Battery level, connection health (color-coded dots: Green=Ready, Yellow=Degraded/Reconnecting, Red=Failed).
- **Feedback:** Clear, non-technical error messaging when a device fails ("Smart Cane disconnected. Attempting to reconnect...").

## 2. Debug Screen
A dedicated Debug Screen is required for field testing and diagnostics.

**Requirements:**
- **Structured Logs ONLY:** Do not dump raw hex or byte streams. 
- **Log Format:** 
  - `[Timestamp]`
  - `[Event Type]` (e.g., ButtonPress, StateChange, Error)
  - `[Source Device]` (e.g., SmartCane_A2B4)
  - `[Details]` (e.g., "Transitioned to ready", "SOS Triggered")
- **Filtering:** Allow filtering by device or event type.

## 3. User Controls & Overrides
While the system handles arbitration and reconnection automatically, the user is ultimately in control.

**Allowed Manual Actions:**
- **Disconnect:** Forcefully drop a device connection (moves state to `disconnected`).
- **Retry:** Force an immediate reconnection attempt, bypassing the current exponential backoff wait time.
- **View Status:** Open the detailed status pane.

**Restricted Actions:**
- **NO Priority Overrides:** Users cannot reorder system priorities (e.g., cannot make Assist higher priority than SOS). This is hardcoded to ensure safety contracts are never violated.

## 4. Haptic & Audio Feedback
Visual UI is secondary in this assistive platform.
- **Immediate ACK:** When a button is pressed on the Cane, a local haptic pulse fires *before* the Flutter app processes the logic.
- **System Audio/Haptics:** The Flutter app will trigger global audio cues (e.g., "Cane Connected", "SOS Sending") via its standard notification pipeline to confirm state transitions to the user.
