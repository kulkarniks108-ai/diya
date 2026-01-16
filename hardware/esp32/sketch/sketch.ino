


#include <NimBLEDevice.h>

static const char* DEVICE_NAME = "2ndEye-01";

// Must match your app exactly:
static const char* SERVICE_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10";
static const char* EVENT_CHAR_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11";

static const int BUTTON_PIN = 27;          // Change if needed
static const uint32_t DEBOUNCE_MS = 30;
static const uint32_t LONG_PRESS_MS = 700; // >= this => long press
static const uint32_t DOUBLE_GAP_MS = 350; // <= this gap => double press

static NimBLEServer* server = nullptr;
static NimBLECharacteristic* eventChar = nullptr;

static bool deviceConnected = false;
static uint8_t seqCounter = 0;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, NimBLEConnInfo& connInfo) override {
    deviceConnected = true;
  }

  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& connInfo, int reason) override {
    deviceConnected = false;
    NimBLEDevice::startAdvertising();
  }
};

static void emitEvent(uint8_t eventType) {
  if (!deviceConnected || eventChar == nullptr) return;

  uint8_t payload[3];
  payload[0] = eventType;   // 1=short, 2=long, 3=double
  payload[1] = 1;           // must be 1 (app ignores otherwise)
  payload[2] = seqCounter;  // 0..255
  seqCounter++;

  eventChar->setValue(payload, sizeof(payload));
  eventChar->notify();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  NimBLEDevice::init(DEVICE_NAME);
  NimBLEDevice::setPower(ESP_PWR_LVL_P9); // max-ish TX power

  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService* service = server->createService(SERVICE_UUID);

  eventChar = service->createCharacteristic(
    EVENT_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ
  );

  // Optional: initial value
  uint8_t initVal[3] = {0, 0, 0};
  eventChar->setValue(initVal, sizeof(initVal));

  service->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->setName(DEVICE_NAME);
  adv->addServiceUUID(SERVICE_UUID);
  // adv->setScanResponse(true);
  adv->start();

  Serial.println("BLE started. Advertising as 2ndEye-01");
}

// Button state machine
static int lastRaw = HIGH;
static int stableState = HIGH;
static uint32_t lastChangeAt = 0;

static uint32_t pressStartAt = 0;
static bool pressed = false;

static uint8_t clickCount = 0;
static uint32_t firstClickAt = 0;

void loop() {
  const uint32_t now = millis();
  const int raw = digitalRead(BUTTON_PIN);

  // Debounce
  if (raw != lastRaw) {
    lastRaw = raw;
    lastChangeAt = now;
  }

  if ((now - lastChangeAt) >= DEBOUNCE_MS && raw != stableState) {
    stableState = raw;

    // Pressed (active low)
    if (stableState == LOW) {
      pressed = true;
      pressStartAt = now;
    } else {
      // Released
      if (!pressed) return;
      pressed = false;

      const uint32_t heldMs = now - pressStartAt;

      if (heldMs >= LONG_PRESS_MS) {
        // Long press: send immediately, reset click logic
        clickCount = 0;
        firstClickAt = 0;
        emitEvent(2); // long
      } else {
        // Short click: maybe a double
        clickCount++;
        if (clickCount == 1) {
          firstClickAt = now;
        } else if (clickCount == 2 && (now - firstClickAt) <= DOUBLE_GAP_MS) {
          clickCount = 0;
          firstClickAt = 0;
          emitEvent(3); // double
        } else {
          // Too slow: treat as a new first click
          clickCount = 1;
          firstClickAt = now;
        }
      }
    }
  }

  // If we had 1 click and the double window expires, commit as SHORT
  if (clickCount == 1 && firstClickAt != 0 && (now - firstClickAt) > DOUBLE_GAP_MS) {
    clickCount = 0;
    firstClickAt = 0;
    emitEvent(1); // short
  }

  delay(5);
}