#define DEBUG_MODE 1

#if DEBUG_MODE
  #define DEBUG_PRINT(x) Serial.println(x)
#else
  #define DEBUG_PRINT(x)
#endif

#define FASTLED_ALLOW_INTERRUPTS 1
#include <FastLED.h>
#include <esp_now.h>
#include <WiFi.h>
#include "arduino_secrets.h"

// --- HARDWARE PINS ---
#define BUZZER_PIN 16
#define LED_PIN 17    
#define NUM_LEDS 35
CRGB leds[NUM_LEDS];

typedef struct audio_message {
  int sound_type;
} audio_message;

// --- STATE MACHINE VARIABLES ---
volatile int activeSound = 0;        
volatile int soundStep = 0;          
volatile unsigned long lastActionTime = 0; 

// --- NEW: THREAD-SAFE COMMUNICATION FLAGS ---
volatile bool newSoundReceived = false;
volatile int pendingSoundType = 0;

// --- ALARM TRACKING VARIABLES ---
int currentFreq = 200;
int previousFreq = 0;
unsigned long lastBuzzerUpdate = 0;
unsigned long lastLedUpdate = 0;

// This ONLY updates a flag and instantly exits
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  audio_message msg;
  memcpy(&msg, incomingData, sizeof(msg));
  
  // Don't let a normal tap interrupt an active Lunk Alarm
  if (activeSound == 4 && msg.sound_type != 4) return;

  pendingSoundType = msg.sound_type;
  newSoundReceived = true;
}

void silenceBuzzer() {
  noTone(BUZZER_PIN);
  pinMode(BUZZER_PIN, OUTPUT);  
  digitalWrite(BUZZER_PIN, LOW); 
}

void setup() {
  Serial.begin(115200); 
  
  // Initialize FastLED
  FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(100); 
  FastLED.clear();
  FastLED.show();

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
  unsigned long currentMillis = millis();

  // --- SAFELY PROCESS INCOMING Wi-Fi DATA ---
  if (newSoundReceived) {
    newSoundReceived = false; // Lower the flag
    
    // --- BRAND NEW: THE UNIVERSAL HARDWARE RESET ---
    // Instantly kill any stuck buzzers or frozen LEDs from the previous state
    silenceBuzzer();
    FastLED.clear();
    FastLED.show();
    
    // Now we can safely print and change states!
    DEBUG_PRINT("New Sound Queued: ");
    DEBUG_PRINT(pendingSoundType);
    
    activeSound = pendingSoundType;
    soundStep = 0; 
  }

  // --- DENIED ---
  if (activeSound == 1) { 
    if (soundStep == 0) {
      tone(BUZZER_PIN, 150);
      lastActionTime = currentMillis;
      soundStep = 1;
    } else if (soundStep == 1 && (currentMillis - lastActionTime > 400)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }
  
  // --- TAILGATING SIREN ---
  else if (activeSound == 2) { 
    if (soundStep == 0) {
      tone(BUZZER_PIN, 1200);
      lastActionTime = currentMillis;
      soundStep = 1;
    } else if (soundStep == 1 && (currentMillis - lastActionTime > 200)) {
      tone(BUZZER_PIN, 800);
      lastActionTime = currentMillis;
      soundStep = 2;
    } else if (soundStep == 2 && (currentMillis - lastActionTime > 200)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }

  // --- SUCCESS CHIRP ---
  else if (activeSound == 3) { 
    if (soundStep == 0) {
      tone(BUZZER_PIN, 1200);
      lastActionTime = currentMillis;
      soundStep = 1;
    } else if (soundStep == 1 && (currentMillis - lastActionTime > 100)) {
      silenceBuzzer(); 
      lastActionTime = currentMillis;
      soundStep = 2;
    } else if (soundStep == 2 && (currentMillis - lastActionTime > 20)) {
      tone(BUZZER_PIN, 1600);
      lastActionTime = currentMillis;
      soundStep = 3;
    } else if (soundStep == 3 && (currentMillis - lastActionTime > 150)) {
      silenceBuzzer(); 
      activeSound = 0;
    }
  }

  // --- THE LUNK ALARM (Merged Animation & Audio) ---
  else if (activeSound == 4) { 
    if (soundStep == 0) {
      // 1. Initialize the 3-second alarm variables
      lastActionTime = currentMillis; // 3-second clock starts now
      lastBuzzerUpdate = currentMillis;
      lastLedUpdate = currentMillis;
      currentFreq = 200;
      previousFreq = 0;
      soundStep = 1; // Move to Winding Up state
    } 
    
    // 2. ALARM ACTIVE (Winding Up + LED Wave)
    else if (soundStep == 1) {
      
      // --- LED Wave Update (Every 50ms) ---
      if (currentMillis - lastLedUpdate >= 50) {
        lastLedUpdate = currentMillis;
        fill_solid(leds, NUM_LEDS, CRGB(0, 0, 0)); 
        int waveHead = (currentMillis / 10) % NUM_LEDS; 
        int waveTrail = 10; 
        for (int i = 0; i < waveTrail; i++) {
          int index = (waveHead - i + NUM_LEDS) % NUM_LEDS; 
          uint8_t brightness = map(i, 0, waveTrail - 1, 255, 30);
          leds[index] = CRGB(brightness, 0, 0); 
        }
        FastLED.show();
      }

      // --- Audio Wind-Up Update ---
      unsigned long timePassed = currentMillis - lastBuzzerUpdate;
      if (timePassed >= 3) { 
        currentFreq += (timePassed * 2) / 3; 
        if (currentFreq > 800) currentFreq = 800; 
        
        if (currentFreq != previousFreq) {
          tone(BUZZER_PIN, currentFreq);
          previousFreq = currentFreq;
        }
        lastBuzzerUpdate = currentMillis;
      }

      // --- Check if 3 seconds have passed ---
      if (currentMillis - lastActionTime >= 3000) {
        FastLED.clear(); 
        FastLED.show();
        soundStep = 2; // Move to Wind-Down phase
      }
    }

    // 3. ALARM ENDING (Winding Down)
    else if (soundStep == 2) {
      unsigned long timePassed = currentMillis - lastBuzzerUpdate;
      if (timePassed >= 1) {
        currentFreq -= timePassed; 
        
        if (currentFreq <= 200) {
          silenceBuzzer();
          activeSound = 0; // Alarm completely finished!
        } else {
          if (currentFreq != previousFreq) {
            tone(BUZZER_PIN, currentFreq);
            previousFreq = currentFreq;
          }
        }
        lastBuzzerUpdate = currentMillis;
      }
    }
  }
  // --- THE INTRUDER ALARM ---
  else if (activeSound == 5) { 
    if (soundStep == 0) {
      lastActionTime = currentMillis;   
      lastBuzzerUpdate = currentMillis; 
      
      // High Pitch + FULL RED LEDs
      tone(BUZZER_PIN, 2500);           
      fill_solid(leds, NUM_LEDS, CRGB(255, 0, 0)); 
      FastLED.show();
      
      soundStep = 1;                    
    } 
    
    // 1. Check if the full 3 seconds are up
    else if (currentMillis - lastActionTime >= 3000) {
      silenceBuzzer(); 
      FastLED.clear(); 
      FastLED.show();
      activeSound = 0; 
    } 
    
    // 2. Alternate rapidly every 150 milliseconds
    else {
      if (currentMillis - lastBuzzerUpdate >= 150) {
        lastBuzzerUpdate = currentMillis;
        
        if (soundStep == 1) {
          // Drop pitch + Turn LEDs COMPLETELY OFF for maximum contrast
          tone(BUZZER_PIN, 2000);
          FastLED.clear(); 
          FastLED.show();
          soundStep = 2; 
        } else {
          // High pitch + FULL RED LEDs again
          tone(BUZZER_PIN, 2500);
          fill_solid(leds, NUM_LEDS, CRGB(255, 0, 0)); 
          FastLED.show();
          soundStep = 1; 
        }
      }
    }
  }
}