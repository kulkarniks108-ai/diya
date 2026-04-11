# Users and Real-World Scenarios

## Primary User Groups

## 1) Blind and Visually Impaired Users

What they need:
- Fast understanding of nearby surroundings
- Reliable safety support during movement
- Interaction without dependence on visual screens
- Confidence that the system will continue working through disruptions

Operational expectations:
- Minimal manual actions during daily use
- Clear voice guidance and haptic confirmation
- Safe fallback behavior when connectivity or accessory state changes

## 2) Family Members and Caregivers

What they need:
- Confidence that their loved one can request help quickly
- Visibility into safety state during critical moments
- Reliable alerts and actionable updates during emergencies

Operational expectations:
- Timely SOS notifications
- Clear live-status visibility
- Low false alarms and low missed-critical-alert risk

## Usage Contexts

Most frequent high-importance contexts:
- Outdoor navigation in roads and public spaces
- Unfamiliar indoor or mixed environments
- Campuses and workplaces where frequent movement is required
- Social situations that require context awareness and person recognition support
- Low or unstable connectivity regions where offline capability matters

## Scenario Catalogue

## Scenario A: Daily Independent Navigation

- User starts day with phone-only or hybrid setup
- System provides contextual surroundings awareness
- Guidance is delivered via audio and optional haptics
- User continues movement without needing constant manual UI interaction

Success criteria:
- Timely assist responses
- Low-friction user interaction
- Stable session continuity

## Scenario B: Rapid Safety Escalation

- User triggers SOS through device button pattern or app action
- Safety state propagates to backend and trusted contacts
- Caregiver receives actionable alert and latest location state

Success criteria:
- Fast alert propagation
- Minimal false negatives
- Reliable acknowledgment path

## Scenario C: Accessory Disconnection Mid-Use

- One accessory disconnects during active usage
- Orchestration layer detects state change and attempts automatic reconnect
- User continues with remaining available channels when possible

Success criteria:
- No full workflow collapse from single-device failure
- Clear user feedback when degraded mode is active
- Successful autonomous recovery when possible

## Scenario D: Low-Connectivity Operation

- Network quality drops or becomes unavailable
- On-device capabilities continue where possible
- Cloud-dependent flows queue, retry, or degrade safely

Success criteria:
- Core assistive continuity preserved
- Safety data not silently lost
- State consistency restored after reconnection

## Scenario E: Multi-Accessory Concurrent Use

- User has smart cane, smart goggle, and wearable accessory active
- Events from multiple channels are coordinated without conflict
- Priority rules determine which signal triggers which action

Success criteria:
- Deterministic event handling
- No duplicate/competing commands
- Stable foreground and background behavior

## Accessibility and Interaction Considerations

Baseline requirements:
- Voice-first interaction model
- Screen-reader compatibility
- High-clarity language for safety prompts
- Haptic reinforcement for critical transitions

Design principle:
- The user should not need to manage technical complexity to remain safe.
