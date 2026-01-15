#include <Wire.h> 
#include <LiquidCrystal_I2C.h>

// Initialize the LCD with I2C address 0x27, 16 columns, and 2 rows
// NOTE: If this doesn't work, try changing 0x27 to 0x3F
LiquidCrystal_I2C lcd(0x27, 16, 2);

const int moisturePin = A0=;
const int relayPin = 2;

void setup() {
  Serial.begin(9600);
  
  // Initialize the LCD
  lcd.init();       // In some libraries, this might need to be lcd.begin();
  lcd.backlight();  // Turn on the backlight
  lcd.clear();

  // Setup Relay Pin
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Assuming Active LOW relay (HIGH = OFF)

  // Intro Screen
  lcd.setCursor(0, 0);
  lcd.print("   IRRIGATION   "); // Centered text
  lcd.setCursor(0, 1);
  lcd.print("  SYSTEM IS ON  ");
  delay(3000);
  lcd.clear();
}

void loop() {
  int value = analogRead(moisturePin);
  Serial.println(value);

  // --- Pump Control Logic ---
  // If soil is dry (value high), turn pump ON
  if (value > 950) {
    digitalWrite(relayPin, LOW); // LOW usually turns Relay ON
    lcd.setCursor(0, 0);
    lcd.print("Pump: ON        "); // Added spaces to clear previous text
  } else {
    digitalWrite(relayPin, HIGH); // HIGH usually turns Relay OFF
    lcd.setCursor(0, 0);
    lcd.print("Pump: OFF       ");
  }

  // --- Display Moisture Status ---
  lcd.setCursor(0, 1);
  
  if (value < 300) {
    lcd.print("Moisture: HIGH  ");
  } 
  else if (value >= 300 && value <= 950) {
    lcd.print("Moisture: MID   ");
  } 
  else if (value > 950) {
    lcd.print("Moisture: LOW   ");
  }
  
  delay(500); // Small delay to stop screen flickering
}