#include "TFT_eSPI.h"
#include <Adafruit_PN532.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <arduino_secrets.h>
#include <ArduinoJson.h>
#include <Arduino.h>
#include <esp_now.h> 

#include "logo.h"
#include "Rockwell20.h"
#include "Rockwell30.h"

// audio data structure
typedef struct audio_message {
  int sound_type;
} audio_message;

esp_now_peer_info_t peerInfo;

TFT_eSPI tft = TFT_eSPI(); 

// Device Name (for use in API calls)
#define DEVICE_ID "Ego Fitness Check-in"

// Screen Backlight pin
#define TFT_BL_PIN 7 

// --- RADAR PINS & SERIAL ---
#define RADAR_RX_PIN 9 
#define RADAR_TX_PIN 8 
HardwareSerial RadarSerial(0); 

#define SDA_PIN 4
#define SCL_PIN 5
#define PN532_RSTPDN_PIN 3
#define PN532_IRQ   2
Adafruit_PN532 nfc(PN532_IRQ, PN532_RSTPDN_PIN);

// --- BUZZER PIN ---
#define BUZZER_PIN 10 // Replaced the MP3 UART with a simple buzzer pin

const uint16_t EF_PURPLE = 0x480E;
const uint16_t EF_GREEN  = 0x07E0; 
const uint16_t EF_RED    = 0xF800; 

bool isScreenOn = false; 

// --- STATE MANAGEMENT VARIABLES ---
bool isShowingMessage = false;
unsigned long messageStartTime = 0;
const unsigned long DISPLAY_DURATION = 2500; 
unsigned long lastScanAttempt = 0;
const unsigned long SCAN_INTERVAL = 150; 

// --- TRACKING VARIABLES ---
unsigned long lastRadarDetection = 0;
const unsigned long RADAR_TIMEOUT = 5000; 
bool personDetected = false;
int currentPeopleCount = 0; 
int authorizedUsers = 0;    

String lastUidStr = "";

// --- DELIVERY RECEIPT CALLBACK ---
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  Serial.print("Wireless Delivery Status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "SUCCESS (Receiver got it!)" : "FAILED (Receiver is offline)");
}

// --- NON-BLOCKING RADAR PARSER ---
void updateRadar() {
  static uint8_t buf[30];
  static int idx = 0;
  
  while (RadarSerial.available()) {
    uint8_t c = RadarSerial.read();
    
    if (idx == 0 && c != 0xAA) continue;
    if (idx == 1 && c != 0xFF) { idx = 0; continue; }
    if (idx == 2 && c != 0x03) { idx = 0; continue; }
    if (idx == 3 && c != 0x00) { idx = 0; continue; }
    
    buf[idx] = c;
    idx++;
    
    if (idx == 30) {
      if (buf[28] == 0x55 && buf[29] == 0xCC) {
        bool t1Active = (buf[6] != 0 || buf[7] != 0);
        bool t2Active = (buf[14] != 0 || buf[15] != 0);
        bool t3Active = (buf[22] != 0 || buf[23] != 0);
        
        int count = 0;
        if (t1Active) count++;
        if (t2Active) count++;
        if (t3Active) count++;
        
        currentPeopleCount = count;

        if (currentPeopleCount > 0) {
          lastRadarDetection = millis(); 
        }
      }
      idx = 0; 
    }
  }

  if (millis() - lastRadarDetection < RADAR_TIMEOUT) {
    personDetected = true;
  } else {
    personDetected = false;
    currentPeopleCount = 0; 
  }
}

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

void playSound(int type) {
  audio_message msg;
  msg.sound_type = type;
  
  // Broadcast the integer to the receiver ESP32
  esp_err_t result = esp_now_send(FITNESS_ALARM_MAC, (uint8_t *) &msg, sizeof(msg));
  
  if (result == ESP_OK) {
    Serial.println("Sent sound command: " + String(type));
  } else {
    Serial.println("Error sending sound command");
  }
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Initialize Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  RadarSerial.begin(256000, SERIAL_8N1, RADAR_RX_PIN, RADAR_TX_PIN);
  delay(100); 

  pinMode(TFT_BL_PIN, OUTPUT);
  digitalWrite(TFT_BL_PIN, LOW); 

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_send_cb(OnDataSent);

  // Register the Receiver as a peer
  memcpy(peerInfo.peer_addr, FITNESS_ALARM_MAC, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Failed to add peer");
    return;
  }

  tft.init();
  tft.setRotation(0); 

  renderDisplay("Ego Fitness", "TAP TO SIGN IN", 0);

  Wire.begin(SDA_PIN, SCL_PIN);
  pinMode(PN532_RSTPDN_PIN, OUTPUT);
  digitalWrite(PN532_RSTPDN_PIN, HIGH);
  nfc.begin();
}

void loop() {
  updateRadar();

  // --- SCREEN & AUTO-CHECKOUT LOGIC ---
  if (personDetected && !isScreenOn) {
    digitalWrite(TFT_BL_PIN, HIGH);

    // 1. Wake up the NFC reader
    digitalWrite(PN532_RSTPDN_PIN, HIGH);
    delay(50);   // Brief pause to let the PN532 chip boot up
    nfc.begin(); // Re-initialize the I2C connection and settings

    isScreenOn = true;
  } 
  else if (!personDetected && isScreenOn) {
    digitalWrite(TFT_BL_PIN, LOW);
    // 2. Put the NFC reader into deep sleep
    digitalWrite(PN532_RSTPDN_PIN, LOW);
    isScreenOn = false;
    
    // THE RESET & AUTO-CHECKOUT
    if (authorizedUsers > 0) {
      String jsonPayload = "{\"device_id\":\"" + String(DEVICE_ID) + "\", \"action\":\"checkout_all\"}";
      sendApiRequest("/api/checkout", jsonPayload);
      
      authorizedUsers = 0; 
    }
  }

  // --- THE TAILGATING ALARM ---
  if (personDetected && authorizedUsers > 0 && currentPeopleCount > authorizedUsers) {
    static unsigned long lastAlarmTime = 0;
    
    if (millis() - lastAlarmTime > 2000) { 
      Serial.println("TAILGATING DETECTED: More bodies than taps!");
      playSound(2); // Play siren tone
      lastAlarmTime = millis();
    }
  }

  // --- NFC SCAN & DYNAMIC SCREEN LOGIC ---
  if (isScreenOn) {
    if (isShowingMessage && (millis() - messageStartTime >= DISPLAY_DURATION)) {
      renderDisplay("Ego Fitness", "TAP TO SIGN IN", 0);
      isShowingMessage = false;
      lastUidStr = ""; 
    }

    if (millis() - lastScanAttempt >= SCAN_INTERVAL) {
      lastScanAttempt = millis();
      
      uint8_t success;
      uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  
      uint8_t uidLength;                        

      success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

      if (success) {
        String nfcUidStr = "";
        for (uint8_t i = 0; i < uidLength; i++) {
          if (uid[i] < 0x10) nfcUidStr += "0";
          nfcUidStr += String(uid[i], HEX);
        }
        nfcUidStr.toUpperCase();

        if (nfcUidStr == lastUidStr) return; 

        lastUidStr = nfcUidStr;

        String jsonPayload = "{\"nfc_uid\":\"" + nfcUidStr + "\", \"device_id\":\"" + String(DEVICE_ID) + "\"}";
        JsonDocument doc = sendApiRequest("/api/scan", jsonPayload);

        bool isAuthorized = false;
        String userName = "";
        String denyReason = "";

        if (doc["status"] == "error") {
          denyReason = "Network Offline";
        } else {
          isAuthorized = doc["authorized"] | false; 
          
          if (isAuthorized) {
            userName = doc["name"].as<String>();
          } else {
            denyReason = doc["reason"].as<String>();
          }
        }

        if (isAuthorized) {
          // Instead of authorizedUsers++, we read the exact count from the server
          authorizedUsers = doc["active_count"] | (authorizedUsers + 1); 
          
          Serial.println("Authorized! Current allowed users: " + String(authorizedUsers));
          playSound(3); // Happy beep!
          renderDisplay("WELCOME!", userName, 1);
        } else {
          playSound(1); // Angry buzz
          renderDisplay("DENIED", denyReason, 2);
        }

        messageStartTime = millis();
        isShowingMessage = true;
      }
    }
  }
}