#include "TFT_eSPI.h"
#include <Adafruit_PN532.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <arduino_secrets.h>
#include <ArduinoJson.h>

#include "logo.h"
#include "Rockwell20.h"
#include "Rockwell30.h"

TFT_eSPI tft = TFT_eSPI(); 

#define TFT_BL_PIN 7 
#define RADAR_OUT_PIN 9

#define SDA_PIN 4
#define SCL_PIN 5
#define PN532_IRQ   2
#define PN532_RESET 3
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);


const uint16_t EF_PURPLE = 0x480E;
const uint16_t EF_GREEN  = 0x07E0; 
const uint16_t EF_RED    = 0xF800; 

bool isScreenOn = false; 

// --- STATE MANAGEMENT VARIABLES ---
bool isShowingMessage = false;
unsigned long messageStartTime = 0;
const unsigned long DISPLAY_DURATION = 2500; // 2.5 seconds
// Add a global tracking variable for rate-limiting
unsigned long lastScanAttempt = 0;
const unsigned long SCAN_INTERVAL = 150; // Wait 150ms between scans

// UID Tracking for debounce / hold prevention
String lastUidStr = "";

// --- REUSABLE SCREEN STATE FUNCTION ---
void renderDisplay(String topText, String bottomText, int mode) {
  tft.fillScreen(EF_PURPLE);
  
  tft.pushImage(35, 40, 170, 200, mylogo);

  if (mode == 1) {
    tft.fillCircle(120, 135, 55, EF_GREEN);
    tft.setTextColor(EF_PURPLE, EF_GREEN);
    tft.setFreeFont(&FreeSansBold9pt7b);
    tft.setTextDatum(MC_DATUM); 
    tft.drawString("OK", 120, 135); 
  } 
  else if (mode == 2) {
    tft.fillCircle(120, 135, 55, EF_RED);
    tft.setTextColor(TFT_WHITE, EF_RED);
    tft.setFreeFont(&FreeSansBold9pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("X", 120, 135);
  }

  tft.setTextDatum(TC_DATUM); 
  tft.setTextColor(TFT_WHITE, EF_PURPLE); 

  tft.loadFont(Rockwell30);
  tft.drawString(topText, 120, 10); 
  tft.unloadFont();
  
  tft.loadFont(Rockwell20);
  tft.drawString(bottomText, 120, 245);
  tft.unloadFont();
}

JsonDocument sendApiRequest(String endpoint, String jsonPayload) {
  HTTPClient http;
  http.begin(String(SECRET_API_SERVER_NODE) + endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");
  http.setTimeout(3000);

  int httpResponseCode = http.POST(jsonPayload);
  String response = "";
  JsonDocument doc;
  
  if (httpResponseCode > 0) {
    response = http.getString();
    deserializeJson(doc, response);
  } else {
    doc["status"] = "error";
  }
  
  http.end();
  return doc;
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  pinMode(TFT_BL_PIN, OUTPUT);
  pinMode(RADAR_OUT_PIN, INPUT);
  digitalWrite(TFT_BL_PIN, LOW); 

  tft.init();
  tft.setRotation(0); 

  renderDisplay("Ego Fitness", "TAP TO SIGN IN", 0);

  Wire.begin(SDA_PIN, SCL_PIN);
  nfc.begin();
  
}

void loop() {
  // --- 1. RADAR LOGIC ---
  bool personDetected = digitalRead(RADAR_OUT_PIN);

  if (personDetected && !isScreenOn) {
    digitalWrite(TFT_BL_PIN, HIGH);
    isScreenOn = true;
  } else if (!personDetected && isScreenOn) {
    digitalWrite(TFT_BL_PIN, LOW);
    isScreenOn = false;
  }

  // --- 3. NFC SCAN & DYNAMIC SCREEN LOGIC ---
  if (isScreenOn) {
    
    // Check if our 2.5-second message timer has expired
    if (isShowingMessage && (millis() - messageStartTime >= DISPLAY_DURATION)) {
      renderDisplay("Ego Fitness", "TAP TO SIGN IN", 0);
      isShowingMessage = false;
      lastUidStr = ""; // Clear memory so the same card can be scanned again later if needed
    }

    // RATE-LIMITED SCAN: Runs constantly when screen is on, 
    // even while showing a message, so the next person can tap immediately!
    if (millis() - lastScanAttempt >= SCAN_INTERVAL) {
      lastScanAttempt = millis();
      
      uint8_t success;
      uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  
      uint8_t uidLength;                        

      success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

      if (success) {
        // Convert raw bytes to a clean Hex String
        String nfcUidStr = "";
        for (uint8_t i = 0; i < uidLength; i++) {
          if (uid[i] < 0x10) nfcUidStr += "0";
          nfcUidStr += String(uid[i], HEX);
        }
        nfcUidStr.toUpperCase();

        // Check if this is the exact same card being held down continuously
        if (nfcUidStr == lastUidStr) {
          return; // Ignore this read, it's just a hold
        }

        // A NEW card has been tapped!
        lastUidStr = nfcUidStr;

        // construct the payload
        String jsonPayload = "{\"nfc_uid\":\"" + nfcUidStr + "\", \"device_id\":\"Ego Fitness Check-in\"}";
        
        // 2. Send the request using your helper
        JsonDocument doc = sendApiRequest("/api/scan", jsonPayload);

        // 3. Extract the variables
        bool isAuthorized = false;
        String userName = "";
        String denyReason = "";

        // Check for the error status you defined in the helper
        if (doc["status"] == "error") {
          denyReason = "Network Offline";
        } else {
          // The pipe | false acts as a fallback if "authorized" is missing
          isAuthorized = doc["authorized"] | false; 
          
          if (isAuthorized) {
            userName = doc["name"].as<String>();
          } else {
            denyReason = doc["reason"].as<String>();
          }
        }

        // 4. Update the screen
        if (isAuthorized) {
          renderDisplay("WELCOME!", userName, 1);
        } else {
          renderDisplay("DENIED", denyReason, 2);
        }

        // Refresh the message display window for the new user 
        // (this restarts the 2.5s countdown fresh for whoever just tapped)
        messageStartTime = millis();
        isShowingMessage = true;
      }
    }
  }
}