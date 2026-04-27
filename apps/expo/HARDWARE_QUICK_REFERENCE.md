# Hardware Layer - Quick Reference Guide

## 🎯 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MainScreen   │  │ SetupScreen  │  │ DebugScreen  │         │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘         │
└─────────┼────────────────────────────────────┼─────────────────┘
          │                                     │
┌─────────┼─────────────────────────────────────┼─────────────────┐
│         │         APPLICATION STORES          │                 │
│  ┌──────▼────────┐  ┌──────────────┐  ┌──────▼─────────┐      │
│  │ hardwareStore │  │  bleStore    │  │  authStore     │      │
│  └───────────────┘  └──────┬───────┘  └────────────────┘      │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│         BUSINESS LOGIC       │                                   │
│  ┌──────────────────────┐    │                                  │
│  │ hardwareTriggers.ts  │◄───┘                                  │
│  │  - Button handlers   │                                       │
│  │  - Debouncing        │                                       │
│  │  - Action routing    │                                       │
│  └──────────┬───────────┘                                       │
└─────────────┼─────────────────────────────────────────────────┘
              │
┌─────────────▼─────────────────────────────────────────────────┐
│         BLE PROTOCOL LAYER                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  esp32Adapter.ts                                        │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │ State Machine:                                    │ │  │
│  │  │  idle → scanning → connecting → connected         │ │  │
│  │  │    ↑                               ↓              │ │  │
│  │  │    └──────── error ←───────────────┘              │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  Methods:                                               │  │
│  │  • autoConnect()         - Find & connect to device    │  │
│  │  • connectToDeviceId()   - Connect to specific device  │  │
│  │  • disconnect()          - Clean disconnect            │  │
│  │  • onEvent(listener)     - Subscribe to sensor events  │  │
│  │  • onState(listener)     - Subscribe to conn state     │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────────────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────────────┐
│         LOW-LEVEL BLE MANAGER                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  bleManager.ts (Wrapper for react-native-ble-plx)      │  │
│  │  • startScan()          - Discover BLE devices          │  │
│  │  • connect()            - Connect to device              │  │
│  │  • monitorCharacteristic() - Listen for notifications   │  │
│  │  • disconnect()         - Close connection               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────────────────────────────────┘
              │
              │ Bluetooth Communication
              ▼
┌───────────────────────────────────────────────────────────────┐
│                      ESP32 DEVICE                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ BLE Service: 2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10       ││
│  │   └─ Characteristic: 2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11││
│  │                                                           ││
│  │ Hardware:                                                 ││
│  │  • Button (Short/Long/Double press detection)            ││
│  │  • [Future: Sensors]                                     ││
│  └──────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Examples

### Example 1: Button Press Flow

```
1. Hardware
   └─> User presses button on ESP32
   
2. ESP32 Firmware
   └─> Detects short press
   └─> Encodes: [0x01, 0x01, 0x2A]  // type=1, value=1, seq=42
   └─> Sends BLE notification
   
3. bleManager.ts
   └─> Receives: Base64 "AQEK"
   └─> Calls onValue callback
   
4. esp32Adapter.ts
   └─> Decodes Base64 → [1, 1, 42]
   └─> Parses → { type: "BUTTON_SHORT", seq: 42 }
   └─> Notifies all event listeners
   
5. hardwareTriggers.ts
   └─> Listener receives event
   └─> Checks: User is blind? ✓
   └─> Checks: Not debounced? ✓
   └─> Gets captureFn from hardwareStore
   └─> Calls assist() with DescribeInShortFocus prompt
   
6. MainScreen.tsx
   └─> captureFn() takes photo
   └─> Sends to vision API
   └─> Gets description
   └─> speak() reads description to user
```

### Example 2: Connection Flow

```
App Launch (blind user) →
  ├─> _layout.tsx: useEffect(() => esp32Adapter.autoConnect())
  │
  ├─> esp32Adapter.autoConnect()
  │   ├─> ensureReady() - Check permissions & Bluetooth
  │   ├─> getPreferredDeviceId() - Check AsyncStorage
  │   │   ├─> If ID exists → connectToDeviceId(id)
  │   │   └─> If no ID → scanAndConnectByName("2ndEye-01")
  │   │
  │   └─> connectToDeviceId(deviceId)
  │       ├─> setState({ state: "connecting" })
  │       ├─> bleManager.connect(deviceId)
  │       ├─> device.discoverAllServicesAndCharacteristics()
  │       ├─> setPreferredDeviceId(deviceId) - Save for next time
  │       ├─> subscribeToEvents() - Start listening
  │       └─> setState({ state: "connected", device: {...} })
  │
  └─> bleStore updates → UI shows "Connected"
```

### Example 3: Disconnect & Recovery

```
Unexpected Disconnect (user walks away) →
  │
  ├─> device.onDisconnected(error) callback fires
  │   ├─> Cleanup: notifySub.remove()
  │   ├─> device = null
  │   └─> setState({ state: "error", message: "..." })
  │
  ├─> bleStore detects state change
  │   └─> If autoReconnectEnabled:
  │       ├─> Wait 5 seconds
  │       └─> esp32Adapter.autoConnect()
  │           ├─> Try preferred device ID
  │           └─> If fails, scan for device
  │
  └─> Connection restored → Normal operation resumes
```

---

## 🔑 Key Files & Responsibilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| **[types/esp32.ts](types/esp32.ts)** | Protocol definitions | `Esp32Event`, `parseEsp32Event()`, UUIDs |
| **[types/ble.ts](types/ble.ts)** | BLE type definitions | `BleDeviceInfo`, connection states |
| **[services/ble/bleManager.ts](services/ble/bleManager.ts)** | Low-level BLE wrapper | `GenericBleManager` class |
| **[services/ble/esp32Adapter.ts](services/ble/esp32Adapter.ts)** | ESP32-specific logic | `Esp32Adapter` class, singleton |
| **[store/ble.ts](store/ble.ts)** | Connection state management | `useBleStore` hook |
| **[store/hardware.ts](store/hardware.ts)** | Hardware action coordination | `useHardwareStore` hook |
| **[core/hardwareTriggers.ts](core/hardwareTriggers.ts)** | Event → action mapping | `initHardwareTriggers()` |

---

## 🛠️ Common Operations

### Check Connection Status

```typescript
import { useBleStore } from "@/store/ble";

const connection = useBleStore(s => s.connection);

if (connection.state === "connected") {
  console.log("Connected to:", connection.device.name);
} else if (connection.state === "error") {
  console.log("Connection error:", connection.message);
}
```

### Manually Connect to Device

```typescript
const { devices, startScan, connect } = useBleStore();

await startScan(); // Scan for 10 seconds

// User selects a device
await connect(devices[0].id);
```

### Listen to Raw Events (Debug)

```typescript
import { esp32Adapter } from "@/services/ble/esp32Adapter";

const unsubscribe = esp32Adapter.onEvent((event, rawBytes) => {
  console.log("Event:", event);
  console.log("Raw hex:", bytesToHex(rawBytes));
});

// Later: unsubscribe();
```

### Register Custom Action

```typescript
import { useHardwareStore } from "@/store/hardware";

// In your component
const { captureFn, setCaptureFn } = useHardwareStore();

useEffect(() => {
  // Provide a function hardware can call
  setCaptureFn(async () => {
    const photo = await camera.takePicture();
    return photo.uri;
  });

  return () => setCaptureFn(null);
}, []);
```

---

## 🐛 Troubleshooting Guide

### Issue: "Bluetooth is not enabled"

**Cause:** Phone Bluetooth is off  
**Solution:**
```typescript
// Check state
const btState = await bleManagerSingleton.getBluetoothState();
console.log("Bluetooth state:", btState);

// Ask user to enable
if (btState !== "PoweredOn") {
  Alert.alert("Enable Bluetooth", "Please turn on Bluetooth in your phone settings");
}
```

---

### Issue: "Missing permissions: BLUETOOTH_CONNECT, BLUETOOTH_SCAN"

**Cause:** Android 12+ requires explicit BLE permissions  
**Solution:** Check [blePermissions.android.ts](services/ble/blePermissions.android.ts)

```typescript
import { ensureBlePermissionsAndroid } from "@/services/ble/blePermissions.android";

const { granted, missing } = await ensureBlePermissionsAndroid();
if (!granted) {
  console.error("Missing:", missing);
  // Show permission dialog or navigate to settings
}
```

---

### Issue: App crashes on disconnect

**Status:** ✅ **FIXED** in latest code  
**Root Cause:** Notification subscription not cleaned up properly  
**Fix Applied:** Wrapped `notifySub.remove()` in try-catch

```typescript
// NEW CODE (safe):
if (this.notifySub) {
  try {
    this.notifySub.remove();
  } catch (error) {
    console.warn("Failed to remove subscription:", error);
  }
}
```

---

### Issue: "ESP32 service not found"

**Cause:** UUIDs mismatch between app and ESP32 firmware  
**Solution:**

1. Verify UUIDs in your ESP32 code match exactly:
   ```cpp
   // ESP32 Arduino
   #define SERVICE_UUID        "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10"
   #define CHARACTERISTIC_UUID "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11"
   ```

2. Check in app:
   ```typescript
   // types/esp32.ts
   export const ESP32_SERVICE_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10";
   export const ESP32_EVENT_CHAR_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11";
   ```

3. Use a BLE scanner app (nRF Connect) to verify ESP32 is advertising correctly

---

### Issue: Button presses trigger multiple times

**Cause:** No debouncing  
**Status:** ✅ **ALREADY IMPLEMENTED**

```typescript
// hardwareTriggers.ts
const DEBOUNCE_TIME_MS = 3000; // 3 seconds

if (now - lastTime < DEBOUNCE_TIME_MS) {
  console.log("Debounced");
  return;
}
```

**To adjust:** Change `DEBOUNCE_TIME_MS` value (in milliseconds)

---

### Issue: Connection drops randomly

**Possible Causes:**
1. **Out of range** - BLE has ~10m range
2. **Low battery** on ESP32
3. **Phone Bluetooth stack issue**

**Solutions:**
```typescript
// 1. Add auto-reconnect (see HARDWARE_IMPROVEMENTS.md)

// 2. Monitor connection health
esp32Adapter.onState((state) => {
  if (state.state === "error") {
    console.error("Connection error:", state.message);
    // Trigger auto-reconnect
  }
});

// 3. Use autoConnect instead of manual connect
await esp32Adapter.autoConnect(); // Finds device by name
```

---

### Issue: Events not firing

**Debug Steps:**

1. **Check connection state:**
   ```typescript
   const state = esp32Adapter.getState();
   console.log("Connection state:", state);
   ```

2. **Listen to raw events:**
   ```typescript
   esp32Adapter.onEvent((event, rawBytes) => {
     console.log("RAW EVENT:", event, bytesToHex(rawBytes));
   });
   ```

3. **Check user role:**
   ```typescript
   // hardwareTriggers.ts only responds to blind users
   const user = useAuthStore.getState().user;
   console.log("User role:", user?.role);
   ```

4. **Verify ESP32 is sending notifications:**
   - Use nRF Connect app to connect to ESP32
   - Enable notifications on characteristic
   - Press button and verify data appears

---

## 📊 State Machine Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  ESP32 Connection States                  │
└──────────────────────────────────────────────────────────┘

    [Initial]
       │
       ▼
   ┌───────┐
   │ IDLE  │◄──────────────────┐
   └───┬───┘                   │
       │ startScan()           │ disconnect()
       │ autoConnect()         │
       ▼                       │
  ┌──────────┐                │
  │ SCANNING │────────────────┤
  └─────┬────┘  Timeout/Error │
        │                     │
        │ Device found        │
        ▼                     │
  ┌────────────┐              │
  │ CONNECTING │──────────────┤
  └──────┬─────┘   Error      │
         │                    │
         │ Success            │
         ▼                    │
   ┌───────────┐              │
   │ CONNECTED │──────────────┘
   └─────┬─────┘
         │
         │ Unexpected disconnect
         ▼
     ┌───────┐
     │ ERROR │──────────┐
     └───────┘          │
         │              │
         │ Retry        │ Give up
         └──────────────┘
```

---

## 🎓 Learning Path

### Beginner (Week 1-2)
- ✅ Understand BLE basics (Central, Peripheral, Services, Characteristics)
- ✅ Read through [types/esp32.ts](types/esp32.ts) to understand protocol
- ✅ Trace a button press through the entire stack
- ✅ Test connection/disconnection manually

### Intermediate (Week 3-4)
- ✅ Add a new event type (e.g., double-press for different action)
- ✅ Implement custom debouncing logic
- ✅ Add connection status indicator in UI
- ✅ Test with multiple devices (scan & select)

### Advanced (Month 2+)
- ✅ Add new sensors (temperature, proximity)
- ✅ Implement multi-device support
- ✅ Create custom action handlers
- ✅ Build sensor fusion logic (combine multiple inputs)

---

## 🚀 Quick Start Commands

### Test BLE connection in Debug Screen

```typescript
// In ble-debug.tsx or create a test function

import { esp32Adapter } from "@/services/ble/esp32Adapter";
import { bleManagerSingleton } from "@/services/ble/bleManager";

// 1. Check Bluetooth is on
const btState = await bleManagerSingleton.getBluetoothState();
console.log("BT State:", btState);

// 2. Check permissions
const perms = await bleManagerSingleton.ensurePermissions();
console.log("Permissions:", perms);

// 3. Try auto-connect
await esp32Adapter.autoConnect();

// 4. Check state
const state = esp32Adapter.getState();
console.log("Connection:", state);

// 5. Listen to events
esp32Adapter.onEvent((event) => {
  console.log("EVENT:", event);
});
```

---

## 📚 Next Steps

1. **Test the disconnect fix** - Try disconnecting ESP32 and verify no crash
2. **Add a new sensor** - Follow Option 1 in HARDWARE_IMPROVEMENTS.md
3. **Implement auto-reconnect** - Copy code from improvements doc
4. **Build UI for sensor data** - Show temperature, proximity in real-time

---

## 💡 Pro Tips

1. **Always test disconnect scenarios** - Pull battery, walk out of range
2. **Use nRF Connect app** - Essential for debugging ESP32 firmware
3. **Log everything during development** - Easy to remove later
4. **Keep debounce times conservative** - Better to miss events than duplicate
5. **Design for battery life** - Frequent notifications drain battery

---

## ✅ Checklist: Adding a New Sensor

- [ ] Update `Esp32Event` type in [types/esp32.ts](types/esp32.ts)
- [ ] Implement parser in `parseEsp32Event()`
- [ ] Add handler in [core/hardwareTriggers.ts](core/hardwareTriggers.ts)
- [ ] Update ESP32 firmware to send new event type
- [ ] Test event flow with debug logging
- [ ] Add UI indicator (optional)
- [ ] Document new sensor in HARDWARE_IMPROVEMENTS.md

---

Need help with any of these steps? Just ask! 🎯
