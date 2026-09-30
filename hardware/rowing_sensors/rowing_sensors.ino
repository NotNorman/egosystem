#include <esp_now.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHTesp.h"
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <arduino_secrets.h>
#include <esp_system.h>

// --- PIN DEFINITIONS (FOR S2 MINI) ---
#define DHTPIN 4
DHTesp dht;

// S2 Mini default I2C pins
#define SDA_PIN 8  
#define SCL_PIN 9  
Adafruit_PN532 nfc(2, 3); // IRQ = 2, RESET = 3 (These are fine on S2)

#define IRPin 5

// --- DATA STRUCTURES ---
typedef struct sensor_data {
  int totalTimeSeconds;
  int activeTimeSeconds;
  float temperature;
  float humidity;
  int resistanceLevel;  
  bool isRowing;    
  bool isAuthenticating;
  float speed;
  int rpm;
  int totalRevs;
  float sessionDistance; 
  float totalDistance;
  int strokeCount;
  char clockTime[12];
  char nfcUid[32]; 
  char username[32]; 
} sensor_data;
sensor_data outgoingData;

typedef struct control_data {
  int resistanceLevel;
  bool resetSession;     
  bool setGuestMode;    
} control_data;
control_data incomingCmd = {4, false, false};

const float METERS_PER_REV = 0.09; 
const int TELEMETRY_INTERVAL_SECONDS = 2; 

float windowMaxSpeed = 0.0;
float windowMinSpeed = 999.0; 

volatile unsigned long pulseCount = 0; 
const unsigned long debounceDelay = 5; 
volatile unsigned long pulseInterval = 0;
volatile unsigned long lastPulseTime = 0;
unsigned long sessionPulseOffset = 0;

volatile unsigned long lastRevTime = 0;
volatile unsigned long timePerRev = 0;

// --- WORKOUT STATE & DATABASE TRACKING ---
int totalSecondsElapsed = 0;
int activeSecondsElapsed = 0;
unsigned long lastTimeUpdate = 0;
unsigned long lastSecondTick = 0; 

int currentExerciseId = 0;               
unsigned long lastDbPushTime = 0;        
unsigned long pulseCountAtLastPush = 0;  
bool forceTelemetryPush = false;
float globalOdometerOffset = 0.0; 

float lastSpeedForStroke = 0.0;
bool isDriving = false;     
int sessionStrokeCount = 0; 
unsigned long lastStrokeTime = 0; 

unsigned long lastWifiCheckTime = 0;
esp_now_peer_info_t peerInfo;

void IRAM_ATTR countPulse() {
  unsigned long currentTime = millis();
  if (currentTime - lastPulseTime > debounceDelay) {
    pulseInterval = currentTime - lastPulseTime; 
    pulseCount++;
    lastPulseTime = currentTime;

    if (pulseCount % 8 == 0) {
      timePerRev = currentTime - lastRevTime;
      lastRevTime = currentTime;
    }
  }
}

JsonDocument sendApiRequest(String endpoint, String jsonPayload) {
  HTTPClient http;
  http.begin(String(SECRET_API_SERVER) + endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");
  // Force the ESP32 to give up after 3 seconds instead of freezing
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

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {}

void OnDataRecv(const uint8_t * mac, const uint8_t *incomingPacket, int len) {
  if (len != sizeof(incomingCmd)) return; 
  memcpy(&incomingCmd, incomingPacket, sizeof(incomingCmd));
  
  if (incomingCmd.resetSession) {
    currentExerciseId = 0; 
    memset(outgoingData.nfcUid, 0, sizeof(outgoingData.nfcUid));
    memset(outgoingData.username, 0, sizeof(outgoingData.username));
    totalSecondsElapsed = 0;
    activeSecondsElapsed = 0;
    sessionPulseOffset = pulseCount;
    sessionStrokeCount = 0; // Fixed logout reset
  }
}

// debug
void printCrashReason() {
  esp_reset_reason_t reason = esp_reset_reason();
  String reasonStr = "";
  
  switch (reason) {
    case ESP_RST_POWERON:  reasonStr = "Normal Power On"; break;
    case ESP_RST_BROWNOUT: reasonStr = "BROWNOUT - Voltage dropped too low!"; break;
    case ESP_RST_PANIC:    reasonStr = "SOFTWARE PANIC - Exception/Crash in code"; break;
    case ESP_RST_INT_WDT:  reasonStr = "INTERRUPT WATCHDOG - CPU stuck"; break;
    case ESP_RST_TASK_WDT: reasonStr = "TASK WATCHDOG - Loop froze"; break;
    case ESP_RST_WDT:      reasonStr = "OTHER WATCHDOG TIMEOUT"; break;
    case ESP_RST_SW:       reasonStr = "SOFTWARE RESTART"; break;
    default:               reasonStr = "Unknown Reason"; break;
  }

  Serial.println("--- SENSOR REBOOT REASON: " + reasonStr);

  // Wait a few seconds for WiFi to connect on boot
  unsigned long bootTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - bootTime < 10000) {
    delay(500);
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    JsonDocument debugPayload;
    debugPayload["error_log"] = "BOOT LOG: " + reasonStr;
    String debugStr;
    serializeJson(debugPayload, debugStr);
    
    // Send it to a quick debug endpoint
    sendApiRequest("/api/row/debug", debugStr);
  }
}
 
void setup() {
  Serial.begin(115200);
 
  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  printCrashReason(); // debug

  HTTPClient http;
  http.begin(String(SECRET_API_SERVER) + "/api/row/init");
  int httpCode = http.GET();
  if (httpCode > 0) {
    String response = http.getString();
    JsonDocument doc;
    deserializeJson(doc, response);
    
    incomingCmd.resistanceLevel = doc["latest_resistance"] | 4;
    globalOdometerOffset = doc["total_distance"] | 0.0;
  }
  http.end();
  
  configTime(0, 0, "pool.ntp.org");
  setenv("TZ", "EST5EDT,M3.2.0,M11.1.0", 1);
  tzset();

  dht.setup(DHTPIN, DHTesp::DHT22);
  Wire.begin(SDA_PIN, SCL_PIN);
  nfc.begin();
  nfc.SAMConfig();

  pinMode(IRPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(IRPin), countPulse, RISING);
  
  memset(outgoingData.nfcUid, 0, sizeof(outgoingData.nfcUid));
  memset(outgoingData.username, 0, sizeof(outgoingData.username));

  if (esp_now_init() != ESP_OK) return;
  esp_now_register_send_cb(esp_now_send_cb_t(OnDataSent));
  esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));
  
  // --- S2 Mini requires the WiFi interface to be specified ---
  memcpy(peerInfo.peer_addr, ROWING_SCREEN_MAC, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;       
  peerInfo.ifidx = WIFI_IF_STA; // <--- CRITICAL FOR ESP32-S2
  esp_now_add_peer(&peerInfo);
}
 
void loop() {
// Safely check WiFi status every 10 seconds without locking ESP-NOW
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiCheckTime > 10000) { 
      WiFi.disconnect(); // Clear the jammed radio state
      WiFi.begin(SECRET_SSID, SECRET_PASS); // Gently start a new connection
      lastWifiCheckTime = millis();
    }
  }

  // 1. SCAN FOR NFC CARD
  if (strlen(outgoingData.username) == 0) {
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
    uint8_t uidLength;
    
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
      String nfcUidStr = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) nfcUidStr += "0";
        nfcUidStr += String(uid[i], HEX);
      }
      nfcUidStr.toUpperCase();
      
      outgoingData.isAuthenticating = true;
      esp_now_send(ROWING_SCREEN_MAC, (uint8_t *) &outgoingData, sizeof(outgoingData));
      
      JsonDocument authPayload;
      authPayload["nfc_uid"] = nfcUidStr;
      authPayload["device_id"] = "Rowing Machine";
      if (currentExerciseId != 0) {
        authPayload["exercise_id"] = currentExerciseId;
      }
      
      String payloadStr;
      serializeJson(authPayload, payloadStr);
      JsonDocument authCheck = sendApiRequest("/api/auth/card_tap", payloadStr);
      
      if (authCheck["status"] == "success") {
        String uname = authCheck["username"].as<String>();
        nfcUidStr.toCharArray(outgoingData.nfcUid, 32);
        uname.toCharArray(outgoingData.username, 32);
      }
      
      outgoingData.isAuthenticating = false;
      esp_now_send(ROWING_SCREEN_MAC, (uint8_t *) &outgoingData, sizeof(outgoingData));
    }
  }

  // 2A. FAST TELEMETRY LOOP
  if (millis() - lastTimeUpdate > 200) {
    lastTimeUpdate = millis();

    unsigned long timeSinceLastPulse = millis() - lastPulseTime;
        
    if (timeSinceLastPulse > 1500) {
      if (outgoingData.isRowing) {
        outgoingData.isRowing = false;
        forceTelemetryPush = true; 
      }
    } else {
      if (!outgoingData.isRowing) {
        outgoingData.isRowing = true;
        
        if (currentExerciseId == 0) {
          JsonDocument startPayload;
          startPayload["nfc_uid"] = strlen(outgoingData.nfcUid) > 0 ? String(outgoingData.nfcUid) : "";
          String startStr;
          serializeJson(startPayload, startStr);
          
          JsonDocument startRes = sendApiRequest("/api/row/start_workout", startStr);
          if (startRes["exercise_id"]) {
            currentExerciseId = startRes["exercise_id"].as<int>();
            lastDbPushTime = millis();
            pulseCountAtLastPush = pulseCount; 
          }
        } else {
          forceTelemetryPush = true;
          pulseCountAtLastPush = pulseCount; 
        }
      }
    }

    if (timeSinceLastPulse > 500) {
      outgoingData.rpm = 0;
      outgoingData.speed = 0;
    } else if (timePerRev > 0) {
      float revsPerSecond = 1000.0 / timePerRev;
      outgoingData.rpm = round(revsPerSecond * 60.0);
      outgoingData.speed = revsPerSecond * METERS_PER_REV;
    }

    // Update max and min for this specific telemetry window
    if (outgoingData.speed > windowMaxSpeed) {
      windowMaxSpeed = outgoingData.speed;
    }
    // Only track minimum speed if the wheel is actually moving
    if (outgoingData.speed > 0 && outgoingData.speed < windowMinSpeed) {
      windowMinSpeed = outgoingData.speed;
    }

    // --- STROKE (PULL) DETECTION WITH  COOLDOWN ---
    // Lowered threshold to 0.02 to catch tiny accelerations on Resistance 1
    if (outgoingData.speed > lastSpeedForStroke + 0.02) { 
      if (!isDriving && (millis() - lastStrokeTime > 1250)) { 
        isDriving = true;
        sessionStrokeCount++; 
        lastStrokeTime = millis(); 
      }
    } 
    // Lowered recovery unlock to 0.02 to register low-friction coasting
    else if (outgoingData.speed < lastSpeedForStroke - 0.02) { 
      isDriving = false;
    }
    
    lastSpeedForStroke = outgoingData.speed;
    outgoingData.strokeCount = sessionStrokeCount;

    float totalRevs = pulseCount / 8.0;
    float sessionRevs = (pulseCount - sessionPulseOffset) / 8.0;
    outgoingData.totalDistance = globalOdometerOffset + (totalRevs * METERS_PER_REV);
    outgoingData.sessionDistance = sessionRevs * METERS_PER_REV;
    outgoingData.totalRevs = (int)sessionRevs;

    outgoingData.resistanceLevel = incomingCmd.resistanceLevel;
    esp_now_send(ROWING_SCREEN_MAC, (uint8_t *) &outgoingData, sizeof(outgoingData));
  }

  // 2B. SLOW CLOCK & DATABASE PUSH LOOP
  if (millis() - lastSecondTick > 1000) {
    lastSecondTick = millis();

    if (outgoingData.isRowing) {
      activeSecondsElapsed++;
      totalSecondsElapsed++; 
    } else if (activeSecondsElapsed > 0) {
      totalSecondsElapsed++; 
    }

    outgoingData.totalTimeSeconds = totalSecondsElapsed; 
    outgoingData.activeTimeSeconds = activeSecondsElapsed; 

    TempAndHumidity climate = dht.getTempAndHumidity();

    // Check if the read was successful before updating your payload
    if (dht.getStatus() == DHTesp::ERROR_NONE) {
      outgoingData.temperature = climate.temperature;
      outgoingData.humidity = climate.humidity;
    }

    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 0)) { 
      strftime(outgoingData.clockTime, sizeof(outgoingData.clockTime), "%I:%M %p", &timeinfo);
    } else {
      strcpy(outgoingData.clockTime, "--:--"); 
    }

    bool timeForRegularPush = (outgoingData.isRowing && (millis() - lastDbPushTime >= (TELEMETRY_INTERVAL_SECONDS * 1000UL)));

    if (currentExerciseId != 0 && (timeForRegularPush || forceTelemetryPush)) {
      forceTelemetryPush = false; 
      
      float windowSeconds = (millis() - lastDbPushTime) / 1000.0;
      lastDbPushTime = millis();

      unsigned long pulsesInWindow = pulseCount - pulseCountAtLastPush;
      pulseCountAtLastPush = pulseCount;
      
      float revsInWindow = pulsesInWindow / 8.0;
      
      int avgRpm = 0;
      float avgSpeed = 0.0;

      if (timeForRegularPush && pulsesInWindow > 0 && windowSeconds > 0) {
        avgRpm = round((revsInWindow / windowSeconds) * 60.0); 
        avgSpeed = (revsInWindow * METERS_PER_REV) / windowSeconds; 
      }

      JsonDocument telemetryPayload;
      telemetryPayload["exercise_id"] = currentExerciseId;
      telemetryPayload["avg_speed"] = avgSpeed;
      telemetryPayload["avg_rpm"] = avgRpm;
      telemetryPayload["distance"] = outgoingData.sessionDistance;
      telemetryPayload["revs"] = outgoingData.totalRevs;
      telemetryPayload["stroke_count"] = outgoingData.strokeCount; 
      telemetryPayload["humidity"] = outgoingData.humidity;
      telemetryPayload["temperature"] = outgoingData.temperature;
      telemetryPayload["resistance"] = outgoingData.resistanceLevel;
      telemetryPayload["total_time"] = outgoingData.totalTimeSeconds;
      telemetryPayload["active_time"] = outgoingData.activeTimeSeconds;
      telemetryPayload["active_status"] = outgoingData.isRowing;

      // Add peak and valley speeds to the JSON
      telemetryPayload["max_speed"] = windowMaxSpeed;
      telemetryPayload["min_speed"] = (windowMinSpeed == 999.0) ? 0.0 : windowMinSpeed;

      String telemetryStr;
      serializeJson(telemetryPayload, telemetryStr);
      sendApiRequest("/api/row/telemetry", telemetryStr); 

      // Let the WiFi driver finish closing the socket before moving on
      delay(50);

      // Reset the tracking variables for the next 2-second window
      windowMaxSpeed = 0.0;
      windowMinSpeed = 999.0;
    }
  }
}