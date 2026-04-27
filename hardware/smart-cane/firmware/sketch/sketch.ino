#include <NimBLEDevice.h>

// =======================
// Config & Constants
// =======================

static const char* DEVICE_NAME = "2ndEye-01";

// Must match your app exactly:
static const char* SERVICE_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e10";
static const char* EVENT_CHAR_UUID = "2d9b6a40-3f7a-4c2b-9a2e-2a6a2c2c2e11";

static const int BUTTON_PIN = 27;

// 🔧 Configurable built-in LED pin
static const int LED_PIN = 2;   // Change if needed

static const uint32_t DEBOUNCE_MS   = 30;
static const uint32_t LONG_PRESS_MS = 700;
static const uint32_t DOUBLE_GAP_MS = 350;

// =======================
// LED Indicator Module
// =======================

enum LedMode {
  LED_DISCONNECTED,
  LED_CONNECTED
};

static LedMode ledMode = LED_DISCONNECTED;

static uint32_t ledLastChangeAt = 0;
static uint8_t  ledPhase = 0;
static bool     ledState = false;

// Timing (easy to tune later)
static const uint32_t LED_BLINK_ON_MS  = 120;
static const uint32_t LED_BLINK_OFF_MS = 120;
static const uint32_t LED_REST_MS      = 1000;

static void ledInit() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
}

static void ledSetMode(LedMode mode) {
  if (ledMode == mode) return;

  ledMode = mode;
  ledPhase = 0;
  ledLastChangeAt = millis();

  if (ledMode == LED_CONNECTED) {
    digitalWrite(LED_PIN, HIGH); // solid ON
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}

static void ledUpdate(uint32_t now) {
  if (ledMode == LED_CONNECTED) return;

  switch (ledPhase) {
    case 0: // ON
      digitalWrite(LED_PIN, HIGH);
      if (now - ledLastChangeAt >= LED_BLINK_ON_MS) {
        ledPhase = 1;
        ledLastChangeAt = now;
      }
      break;

    case 1: // OFF
      digitalWrite(LED_PIN, LOW);
      if (now - ledLastChangeAt >= LED_BLINK_OFF_MS) {
        ledPhase = 2;
        ledLastChangeAt = now;
      }
      break;

    case 2: // ON
      digitalWrite(LED_PIN, HIGH);
      if (now - ledLastChangeAt >= LED_BLINK_ON_MS) {
        ledPhase = 3;
        ledLastChangeAt = now;
      }
      break;

    case 3: // REST
      digitalWrite(LED_PIN, LOW);
      if (now - ledLastChangeAt >= LED_REST_MS) {
        ledPhase = 0;
        ledLastChangeAt = now;
      }
      break;
  }
}

// =======================
// BLE Module
// =======================

static NimBLEServer* server = nullptr;
static NimBLECharacteristic* eventChar = nullptr;

static bool deviceConnected = false;
static uint8_t seqCounter = 0;

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*, NimBLEConnInfo&) override {
    deviceConnected = true;
    ledSetMode(LED_CONNECTED);
  }

  void onDisconnect(NimBLEServer*, NimBLEConnInfo&, int) override {
    deviceConnected = false;
    ledSetMode(LED_DISCONNECTED);
    NimBLEDevice::startAdvertising();
  }
};

static void emitEvent(uint8_t eventType) {
  if (!deviceConnected || eventChar == nullptr) return;

  uint8_t payload[3];
  payload[0] = eventType;   // 1=short, 2=long, 3=double
  payload[1] = 1;           // must be 1
  payload[2] = seqCounter++;

  eventChar->setValue(payload, sizeof(payload));
  eventChar->notify();
}

// =======================
// Arduino setup()
// =======================

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  ledInit();
  ledSetMode(LED_DISCONNECTED);

  NimBLEDevice::init(DEVICE_NAME);
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService* service = server->createService(SERVICE_UUID);

  eventChar = service->createCharacteristic(
    EVENT_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ
  );

  uint8_t initVal[3] = {0, 0, 0};
  eventChar->setValue(initVal, sizeof(initVal));

  service->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->setName(DEVICE_NAME);
  adv->addServiceUUID(SERVICE_UUID);
  adv->start();

  Serial.println("BLE started. Advertising as 2ndEye-01");
}

// =======================
// Button Module
// =======================

static int lastRaw = HIGH;
static int stableState = HIGH;
static uint32_t lastChangeAt = 0;

static uint32_t pressStartAt = 0;
static bool pressed = false;

static uint8_t clickCount = 0;
static uint32_t firstClickAt = 0;

// =======================
// Arduino loop()
// =======================

void loop() {
  const uint32_t now = millis();

  // --- LED update ---
  ledUpdate(now);

  // --- Button logic ---
  const int raw = digitalRead(BUTTON_PIN);

  if (raw != lastRaw) {
    lastRaw = raw;
    lastChangeAt = now;
  }

  if ((now - lastChangeAt) >= DEBOUNCE_MS && raw != stableState) {
    stableState = raw;

    if (stableState == LOW) {
      pressed = true;
      pressStartAt = now;
    } else {
      if (!pressed) return;
      pressed = false;

      const uint32_t heldMs = now - pressStartAt;

      if (heldMs >= LONG_PRESS_MS) {
        clickCount = 0;
        firstClickAt = 0;
        emitEvent(2);
      } else {
        clickCount++;
        if (clickCount == 1) {
          firstClickAt = now;
        } else if (clickCount == 2 && (now - firstClickAt) <= DOUBLE_GAP_MS) {
          clickCount = 0;
          firstClickAt = 0;
          emitEvent(3);
        } else {
          clickCount = 1;
          firstClickAt = now;
        }
      }
    }
  }

  if (clickCount == 1 && firstClickAt != 0 && (now - firstClickAt) > DOUBLE_GAP_MS) {
    clickCount = 0;
    firstClickAt = 0;
    emitEvent(1);
  }

  delay(5);
}