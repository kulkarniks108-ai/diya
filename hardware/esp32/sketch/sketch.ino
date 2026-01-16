#include <Wire.h> 
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

const int moisturePin = A0;
const int relayPin = 2;

void setup() {
  Serial.begin(115200); 
  
  lcd.init();        
  lcd.backlight();
  lcd.clear();

  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // Relay OFF (Active Low)

  lcd.setCursor(0, 0);
  lcd.print(" SYSTEM SYNCED "); 
  delay(1000);
}

void loop() {
  int value = analogRead(moisturePin);
  
  // Send data to Streamlit
  Serial.println(value);

  // Check for command from Python
  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '1') {
      digitalWrite(relayPin, LOW);  // Pump ON
      lcd.setCursor(0, 0);
      lcd.print("Pump: ON        ");
    } 
    else if (command == '0') {
      digitalWrite(relayPin, HIGH); // Pump OFF
      lcd.setCursor(0, 0);
      lcd.print("Pump: OFF       ");
    }
    // Clear any extra characters in serial buffer
    while(Serial.available() > 0) Serial.read(); 
  }

  lcd.setCursor(0, 1);
  if (value < 300)      lcd.print("Moisture: HIGH  ");
  else if (value <= 950) lcd.print("Moisture: MID   ");
  else                   lcd.print("Moisture: LOW   ");
  
  delay(50); // Faster sampling for better responsiveness
}