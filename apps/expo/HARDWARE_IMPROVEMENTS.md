# Hardware Layer Improvements & Multi-Sensor Guide

## 🎯 Current Architecture Summary

Your app uses a **single-device, single-adapter** pattern:
- One ESP32Adapter instance managing one connection
- Button events from one device
- Simple, reliable, but limited to one device

---

## 🚀 Suggestions for Multiple Sensors & Devices

### **Option 1: Multiple Sensors on Same ESP32** (EASIEST)
**When to use:** Add temperature, gyro, proximity sensors to your existing ESP32

#### Implementation Steps:

1. **Extend the Protocol** (Add new event types)

```typescript
// types/esp32.ts
export type Esp32Event =
  // Existing button events
  | { type: "BUTTON_SHORT"; seq: number }
  | { type: "BUTTON_LONG"; seq: number }
  | { type: "BUTTON_DOUBLE"; seq: number }
  
  // NEW: Sensor events
  | { type: "TEMPERATURE"; value: number; seq: number }
  | { type: "PROXIMITY"; distance: number; seq: number }
  | { type: "MOTION"; x: number; y: number; z: number; seq: number }
  | { type: "LIGHT"; brightness: number; seq: number };

/**
 * NEW Notification payload formats:
 * 
 * Temperature (4 bytes):
 * - Byte0: eventType (4=temperature)
 * - Byte1-2: temperature in 0.1°C (e.g., 235 = 23.5°C)
 * - Byte3: seq
 * 
 * Proximity (4 bytes):
 * - Byte0: eventType (5=proximity)
 * - Byte1-2: distance in cm (0-400)
 * - Byte3: seq
 * 
 * Motion (6 bytes):
 * - Byte0: eventType (6=motion)
 * - Byte1-2: X axis (-32768 to 32767)
 * - Byte3-4: Y axis
 * - Byte5: seq
 */

export function parseEsp32Event(bytes: readonly number[]): Esp32Event | null {
  if (bytes.length < 3) return null;

  const eventType = bytes[0];

  // Button events (existing)
  if (eventType >= 1 && eventType <= 3) {
    const value = bytes[1];
    const seq = bytes[2];
    if (value !== 1) return null;

    switch (eventType) {
      case 1: return { type: "BUTTON_SHORT", seq };
      case 2: return { type: "BUTTON_LONG", seq };
      case 3: return { type: "BUTTON_DOUBLE", seq };
    }
  }

  // Temperature sensor
  if (eventType === 4 && bytes.length >= 4) {
    const tempRaw = (bytes[1] << 8) | bytes[2];
    const value = tempRaw / 10; // Convert to decimal
    const seq = bytes[3];
    return { type: "TEMPERATURE", value, seq };
  }

  // Proximity sensor
  if (eventType === 5 && bytes.length >= 4) {
    const distance = (bytes[1] << 8) | bytes[2];
    const seq = bytes[3];
    return { type: "PROXIMITY", distance, seq };
  }

  // Motion sensor (accelerometer)
  if (eventType === 6 && bytes.length >= 6) {
    const x = (bytes[1] << 8) | bytes[2];
    const y = (bytes[3] << 8) | bytes[4];
    const seq = bytes[5];
    // You could extend to include Z axis
    return { type: "MOTION", x, y, z: 0, seq };
  }

  return null;
}
```

2. **Add Sensor Handlers** (Similar to button triggers)

```typescript
// core/hardwareTriggers.ts

export function initHardwareTriggers(): void {
  if (initialized) return;
  initialized = true;

  esp32Adapter.onEvent(async (event) => {
    const authUser = useAuthStore.getState().user;
    if (!authUser || authUser.role !== "blind") return;

    // --- EXISTING BUTTON HANDLERS ---
    if (event.type === "BUTTON_SHORT") {
      // ... your existing code
    }

    // --- NEW SENSOR HANDLERS ---
    
    // Proximity warning
    if (event.type === "PROXIMITY") {
      if (event.distance < 30) { // Less than 30cm
        speak("Obstacle ahead!");
        vibrate("warning"); // Short vibration pattern
      }
    }

    // Temperature alert
    if (event.type === "TEMPERATURE") {
      if (event.value > 35) { // Hot environment
        speak(`Warning: High temperature detected. ${Math.round(event.value)} degrees`);
      } else if (event.value < 0) { // Freezing
        speak(`Warning: Freezing temperature. ${Math.round(event.value)} degrees`);
      }
    }

    // Motion detection (fall detection)
    if (event.type === "MOTION") {
      const acceleration = Math.sqrt(event.x ** 2 + event.y ** 2 + event.z ** 2);
      if (acceleration > 2000) { // Threshold for fall
        speak("Fall detected!");
        await useLiveStore.getState().triggerSOS();
      }
    }
  });
}
```

**ESP32 Arduino Code Example:**
```cpp
// On your ESP32
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

// Sensor readings
float temperature = 0;
int proximity = 0;

void sendTemperatureEvent(int seq) {
  uint8_t data[4];
  data[0] = 4; // Temperature event type
  int16_t temp = (int16_t)(temperature * 10); // Convert to 0.1°C
  data[1] = (temp >> 8) & 0xFF;
  data[2] = temp & 0xFF;
  data[3] = seq;
  
  pCharacteristic->setValue(data, 4);
  pCharacteristic->notify();
}

void sendProximityEvent(int seq) {
  uint8_t data[4];
  data[0] = 5; // Proximity event type
  data[1] = (proximity >> 8) & 0xFF;
  data[2] = proximity & 0xFF;
  data[3] = seq;
  
  pCharacteristic->setValue(data, 4);
  pCharacteristic->notify();
}
```

---

### **Option 2: Multiple ESP32 Devices** (MODERATE COMPLEXITY)
**When to use:** Want different devices on different body parts (wrist sensor, shoe sensor, glasses, etc.)

#### Implementation:

1. **Create Multi-Device Manager**

```typescript
// services/ble/multiDeviceManager.ts
import { bleManagerSingleton } from "./bleManager";
import { Esp32Adapter } from "./esp32Adapter";

export interface DeviceConfig {
  id: string;
  name: string;
  serviceUUID: string;
  eventCharUUID: string;
  priority: number; // For conflict resolution
}

export class MultiDeviceManager {
  private adapters: Map<string, Esp32Adapter> = new Map();
  private configs: DeviceConfig[] = [];

  constructor(configs: DeviceConfig[]) {
    this.configs = configs;
    
    // Create an adapter for each device
    for (const config of configs) {
      const adapter = new Esp32Adapter(config.serviceUUID, config.eventCharUUID);
      this.adapters.set(config.id, adapter);
      
      // Subscribe to events from this device
      adapter.onEvent((event, rawBytes) => {
        this.handleEvent(config.id, event, rawBytes);
      });
    }
  }

  private handleEvent(deviceId: string, event: Esp32Event, rawBytes: readonly number[]) {
    const config = this.configs.find(c => c.id === deviceId);
    console.log(`Event from ${config?.name}:`, event);
    
    // Route to appropriate handler based on device
    switch (deviceId) {
      case "wrist":
        this.handleWristEvent(event);
        break;
      case "shoe":
        this.handleShoeEvent(event);
        break;
      case "glasses":
        this.handleGlassesEvent(event);
        break;
    }
  }

  async connectAll(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map(adapter =>
      adapter.autoConnect().catch(err => {
        console.warn("Failed to connect device:", err);
        return null; // Don't fail entire connection
      })
    );
    
    await Promise.allSettled(promises);
  }

  async disconnectAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect();
    }
  }

  getAdapter(deviceId: string): Esp32Adapter | undefined {
    return this.adapters.get(deviceId);
  }
}

// Usage:
export const multiDeviceManager = new MultiDeviceManager([
  {
    id: "wrist",
    name: "2ndEye-Wrist",
    serviceUUID: "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10",
    eventCharUUID: "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11",
    priority: 1
  },
  {
    id: "shoe",
    name: "2ndEye-Shoe",
    serviceUUID: "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e12", // Different UUID
    eventCharUUID: "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e13",
    priority: 2
  }
]);
```

2. **Update Store for Multi-Device**

```typescript
// store/ble.ts
interface BleState {
  devices: Map<string, Esp32ConnectionState>; // Multiple connection states
  activeDeviceId: string | null;
  
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  setActiveDevice: (deviceId: string) => void;
}
```

---

### **Option 3: Generic Sensor Framework** (ADVANCED)
**When to use:** Want maximum flexibility for unknown future sensors

```typescript
// types/sensors.ts
export interface Sensor {
  id: string;
  type: "button" | "temperature" | "proximity" | "motion" | "custom";
  deviceId: string;
  
  // Generic data payload
  data: Record<string, any>;
  
  timestamp: number;
  seq: number;
}

export interface SensorHandler {
  canHandle(sensor: Sensor): boolean;
  handle(sensor: Sensor): Promise<void>;
}

// services/sensors/sensorRegistry.ts
export class SensorRegistry {
  private handlers: SensorHandler[] = [];

  register(handler: SensorHandler): void {
    this.handlers.push(handler);
  }

  async dispatch(sensor: Sensor): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.canHandle(sensor)) {
        await handler.handle(sensor);
      }
    }
  }
}

// Example handlers:
class ProximitySensorHandler implements SensorHandler {
  canHandle(sensor: Sensor): boolean {
    return sensor.type === "proximity";
  }

  async handle(sensor: Sensor): Promise<void> {
    const distance = sensor.data.distance;
    if (distance < 30) {
      speak("Obstacle ahead!");
    }
  }
}

class FallDetectionHandler implements SensorHandler {
  canHandle(sensor: Sensor): boolean {
    return sensor.type === "motion";
  }

  async handle(sensor: Sensor): Promise<void> {
    const { x, y, z } = sensor.data;
    const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    
    if (magnitude > 2000) {
      speak("Fall detected!");
      await useLiveStore.getState().triggerSOS();
    }
  }
}
```

---

## 🔧 Recommended Approach for You

Based on your current setup, I recommend **Option 1** (Multiple Sensors on Same ESP32) because:

✅ **Easiest to implement** - Small changes to existing code  
✅ **No hardware complexity** - Just add sensors to current ESP32  
✅ **Proven stability** - Uses your existing connection logic  
✅ **Low cost** - Reuse existing device  

**Then later migrate to Option 2** if you need:
- Wearable devices on different body parts
- Redundancy (if one device fails, others still work)
- Specialized sensors that can't fit on one device

---

## 🐛 Additional Bug Fixes & Best Practices

### 1. **Add Connection Retry Logic**

```typescript
// services/ble/esp32Adapter.ts (add this method)
async connectWithRetry(deviceId: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.connectToDeviceId(deviceId);
      return; // Success!
    } catch (error) {
      console.warn(`Connection attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error; // Give up
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### 2. **Add Auto-Reconnect on Disconnect**

```typescript
// store/ble.ts
export const useBleStore = create<BleState>((set, get) => {
  esp32Adapter.onState((state) => {
    set({ connection: state });
    
    // Auto-reconnect on unexpected disconnect
    if (state.state === "error" || state.state === "idle") {
      const shouldReconnect = get().autoReconnectEnabled;
      if (shouldReconnect) {
        console.log("Auto-reconnecting...");
        setTimeout(async () => {
          try {
            await esp32Adapter.autoConnect();
          } catch (err) {
            console.warn("Auto-reconnect failed:", err);
          }
        }, 5000); // Wait 5 seconds before retry
      }
    }
  });

  return {
    // ... existing state
    autoReconnectEnabled: true,
    
    toggleAutoReconnect: (enabled: boolean) => {
      set({ autoReconnectEnabled: enabled });
    }
  };
});
```

### 3. **Add Device Health Monitoring**

```typescript
// services/ble/deviceHealth.ts
export class DeviceHealthMonitor {
  private lastEventTime: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  startMonitoring(esp32Adapter: Esp32Adapter): void {
    // Update on any event
    esp32Adapter.onEvent(() => {
      this.lastEventTime = Date.now();
    });
    
    // Check health every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTime;
      
      if (timeSinceLastEvent > 60000) { // 1 minute silence
        console.warn("Device may be unresponsive");
        speak("Device connection may be lost");
      }
    }, 30000);
  }
  
  stopMonitoring(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
```

### 4. **Add Battery Level Monitoring**

```typescript
// Add to types/esp32.ts
export type Esp32Event =
  | { type: "BUTTON_SHORT"; seq: number }
  | { type: "BUTTON_LONG"; seq: number }
  | { type: "BUTTON_DOUBLE"; seq: number }
  | { type: "BATTERY_LEVEL"; percentage: number; seq: number }; // NEW

// Add characteristic for battery
export const ESP32_BATTERY_CHAR_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e12";

// In esp32Adapter, periodically read battery
async readBatteryLevel(): Promise<number> {
  if (!this.device) throw new Error("Not connected");
  
  const characteristic = await this.device.readCharacteristicForService(
    ESP32_SERVICE_UUID,
    ESP32_BATTERY_CHAR_UUID
  );
  
  if (!characteristic.value) return 0;
  
  const bytes = base64ToBytes(characteristic.value);
  return bytes[0]; // Battery percentage 0-100
}
```

---

## 📝 Summary & Next Steps

### What You Have Now:
- ✅ Single ESP32 device with button events
- ✅ Basic BLE connection management
- ✅ Event-driven architecture
- ✅ **FIXED:** Crash on disconnect

### Recommended Next Steps:

1. **Immediate (This Week):**
   - Test the disconnect fix I applied
   - Add auto-reconnect logic
   - Add connection health monitoring

2. **Short Term (Next 2 Weeks):**
   - Add 1-2 sensors to existing ESP32 (proximity, temperature)
   - Implement sensor event handlers
   - Test with new sensor events

3. **Long Term (1-2 Months):**
   - Consider multi-device support if needed
   - Add battery monitoring
   - Implement sensor fusion (combine multiple sensor inputs)

### Questions to Answer:
- What sensors do you want to add? (proximity, temperature, gyro, etc.)
- Do you need multiple physical devices, or can sensors fit on one ESP32?
- What's your expected use case for multiple sensors?

---

## 🎓 Learning Resources

- [BLE Basics](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/)
- [React Native BLE PLX Docs](https://github.com/dotintent/react-native-ble-plx)
- [ESP32 BLE Arduino](https://randomnerdtutorials.com/esp32-bluetooth-low-energy-ble-arduino-ide/)

Let me know which approach you want to pursue, and I can help implement it! 🚀
