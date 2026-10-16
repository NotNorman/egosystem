#include <esp_now.h>
#include <WiFi.h>
#include "arduino_secrets.h"

#define BUZZER_PIN 16

typedef struct audio_message {
  int sound_type;
} audio_message;

// --- STATE MACHINE VARIABLES ---
volatile int activeSound = 0;        // 0 = quiet, 1 = denied, 2 = siren, 3 = success, 4 = lunk
volatile int soundStep = 0;          // Tracks which part of the sound we are currently playing
volatile unsigned long lastActionTime = 0; // Tracks the millis() timestamp of the last note
volatile int currentFreq = 2000;     // Used for the dropping pitch of the Lunk Alarm

// This ONLY updates the queue. Extremely safe.
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  audio_message msg;
  memcpy(&msg, incomingData, sizeof(msg));
  
  // Don't let a normal tap interrupt an active Lunk Alarm
  if (activeSound == 4 && msg.sound_type != 4) return;

  Serial.print("New Sound Queued: ");
  Serial.println(msg.sound_type);

  // Set up the state machine, but DO NOT call tone() here!
  activeSound = msg.sound_type;
  soundStep = 0; 
}

void silenceBuzzer() {
  noTone(BUZZER_PIN);
  pinMode(BUZZER_PIN, OUTPUT);  // Force the pin to reset its state
  digitalWrite(BUZZER_PIN, LOW); // Pull it completely to ground
}

void setup() {
  Serial.begin(115200); 
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  if (esp_now_init() != ESP_OK) return;
  esp_now_register_recv_cb(OnDataRecv);
}

void loop() {
  // --- DENIED ---
  if (activeSound == 1) { // DENIED
    if (soundStep == 0) {
      tone(BUZZER_PIN, 150);
      lastActionTime = millis();
      soundStep = 1;
    } else if (soundStep == 1 && (millis() - lastActionTime > 400)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }
  
  // --- TAILGATING SIREN ---
  else if (activeSound == 2) { 
    if (soundStep == 0) {
      tone(BUZZER_PIN, 1200);
      lastActionTime = millis();
      soundStep = 1;
    } else if (soundStep == 1 && (millis() - lastActionTime > 200)) {
      tone(BUZZER_PIN, 800);
      lastActionTime = millis();
      soundStep = 2;
    } else if (soundStep == 2 && (millis() - lastActionTime > 200)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }

  // --- SUCCESS CHIRP ---
  else if (activeSound == 3) { 
    if (soundStep == 0) {
      tone(BUZZER_PIN, 1200);
      lastActionTime = millis();
      soundStep = 1;
    } else if (soundStep == 1 && (millis() - lastActionTime > 100)) {
      silenceBuzzer(); 
      lastActionTime = millis();
      soundStep = 2;
    } else if (soundStep == 2 && (millis() - lastActionTime > 20)) {
      tone(BUZZER_PIN, 1600);
      lastActionTime = millis();
      soundStep = 3;
    } else if (soundStep == 3 && (millis() - lastActionTime > 150)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }

  // --- LUNK ALARM ---
  else if (activeSound == 4) { 
    if (soundStep == 0) {
      currentFreq = 2000;
      tone(BUZZER_PIN, currentFreq);
      lastActionTime = millis();
      soundStep = 1;
    } else if (soundStep == 1 && (millis() - lastActionTime > 50)) {
      currentFreq -= 50;
      if (currentFreq <= 500) {
        silenceBuzzer(); 
        activeSound = 0;
      } else {
        tone(BUZZER_PIN, currentFreq);
        lastActionTime = millis();
      }
    }
  }
}