#include <TFT_eSPI.h>
#include <esp_now.h>
#include <WiFi.h>
#include <arduino_secrets.h>
#include <time.h>  // For the live clock

// --- DATA STRUCTURES ---
// 1. Incoming (From Sensor)
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
sensor_data incomingData;
volatile bool newDataArrived = false;

// 2. Outgoing (To Sensor)
typedef struct control_data {
  int resistanceLevel;
  bool resetSession;
  bool setGuestMode;
} control_data;
control_data outgoingCmd = { 4, false, false };

// --- SESSION & STATE VARIABLES ---
String currentUser = "Guest";
bool wasAuthenticating = false;
// Variables to track the 2-second error message
bool showingInvalidError = false;
unsigned long invalidErrorTime = 0;
unsigned long lastPacketTime = 0;
bool isConnected = false;
unsigned long lastTouchTime = 0;

enum WipeDirection { WIPE_L2R,
                     WIPE_R2L,
                     WIPE_T2B,
                     WIPE_B2T };

// --- ESP-NOW CALLBACKS ---
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingPacket, int len) {
  if (len != sizeof(incomingData)) return;
  memcpy(&incomingData, incomingPacket, sizeof(incomingData));
  newDataArrived = true;
}

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {}

void sendCommandToSensor() {
  esp_now_send(ROWING_SENSOR_MAC, (uint8_t *)&outgoingCmd, sizeof(outgoingCmd));
}

// --- SCREEN & UI SETUP ---
TFT_eSPI tft = TFT_eSPI();
const int SCREEN_WIDTH = 480;
const int SCREEN_HEIGHT = 320;

const int TIMER_WIDTH = 100;
const int TIMER_HEIGHT = 25;
TFT_eSprite timerSprite = TFT_eSprite(&tft);
TFT_eSprite temperatureSprite = TFT_eSprite(&tft);
TFT_eSprite statusSprite = TFT_eSprite(&tft);
TFT_eSprite leftGauge = TFT_eSprite(&tft);
TFT_eSprite rightGauge = TFT_eSprite(&tft);
// Dashboard Data Sprites
TFT_eSprite topGauge = TFT_eSprite(&tft);
TFT_eSprite speedSprite = TFT_eSprite(&tft);
TFT_eSprite distSprite = TFT_eSprite(&tft);
TFT_eSprite resSprite = TFT_eSprite(&tft);
TFT_eSprite clockSprite = TFT_eSprite(&tft);
TFT_eSprite subLeftSprite = TFT_eSprite(&tft);
TFT_eSprite subRightSprite = TFT_eSprite(&tft);

// chaser variable for animation
float displayHumidity = 0.0;
float displayTemp = 0.0;
float displayRpm = 0.0;
float displaySpeed = 0.0;
float displaySessionDistance = 0.0; 
unsigned long lastAnimationTime = 0;

uint16_t calData[5] = { 236, 3729, 167, 3691, 7 };
const int TOUCH_IRQ = 18;

const int SCREEN_LOGIN = 0;
const int SCREEN_SETTINGS = 1;
const int SCREEN_DASHBOARD = 2;
const int SCREEN_STATS = 3;

int currentScreen = SCREEN_LOGIN;
bool isTouching = false;
uint16_t startX = 0, endX = 0, startY = 0;
bool tapHandled = false;
const int SIDE_TAP_THRESHOLD = 75;

void transitionWipe(WipeDirection dir, int speedMs = 3) {
  int w = tft.width();
  int h = tft.height();
  int steps = 40;

  if (dir == WIPE_L2R) {
    int stepSize = w / steps;
    for (int i = 0; i <= w; i += stepSize) {
      tft.fillRect(i, 0, stepSize, h, TFT_BLACK);
      delay(speedMs);
    }
  } else if (dir == WIPE_R2L) {
    int stepSize = w / steps;
    for (int i = w; i >= 0; i -= stepSize) {
      tft.fillRect(i - stepSize, 0, stepSize, h, TFT_BLACK);
      delay(speedMs);
    }
  } else if (dir == WIPE_T2B) {
    int stepSize = h / steps;
    for (int i = 0; i <= h; i += stepSize) {
      tft.fillRect(0, i, w, stepSize, TFT_BLACK);
      delay(speedMs);
    }
  } else if (dir == WIPE_B2T) {
    int stepSize = h / steps;
    for (int i = h; i >= 0; i -= stepSize) {
      tft.fillRect(0, i - stepSize, w, stepSize, TFT_BLACK);
      delay(speedMs);
    }
  }
}

// --- FORMATTING HELPER ---
String getDisplayUsername() {
  if (currentUser.length() > 15) {
    return currentUser.substring(0, 15) + "...";
  }
  return currentUser;
}
// --- UI HELPER ---
void updateTopLeftStatus(String text, uint16_t color) {
  tft.fillRect(0, 0, 160, 30, TFT_BLACK);  // Clear the 160px box
  tft.setTextColor(color, TFT_BLACK);      // Set the requested color
  
  tft.drawString(text, 10, 2, 2); 
}

void setup() {
  Serial.begin(115200);

  tft.begin();
  tft.setRotation(1);
  tft.setTouch(calData);
  pinMode(TOUCH_IRQ, INPUT_PULLUP);

  tft.fillScreen(TFT_BLACK);

  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawCentreString("SYSTEM BOOTING...", 240, 110, 4);
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.drawCentreString("Connecting to Wi-Fi network", 240, 160, 4);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawCentreString("Wi-Fi Connected!", 240, 225, 2);
  delay(500);

  if (esp_now_init() != ESP_OK) return;

  esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));
  esp_now_register_send_cb(esp_now_send_cb_t(OnDataSent));

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, ROWING_SENSOR_MAC, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;
  esp_now_add_peer(&peerInfo);

  timerSprite.createSprite(TIMER_WIDTH, TIMER_HEIGHT);
  temperatureSprite.createSprite(180, 40);
  statusSprite.createSprite(80, 20);

  leftGauge.createSprite(85, 160);  
  rightGauge.createSprite(85, 160);

  topGauge.createSprite(360, 25);
  // Extend the width from 160 to 180
  speedSprite.createSprite(186, 100);

  distSprite.createSprite(120, 20);
  resSprite.createSprite(100, 20);

  clockSprite.createSprite(80, 20);
  subLeftSprite.createSprite(80, 50);  
  subRightSprite.createSprite(80, 50);  

  drawScreen(currentScreen);
}

void loop() {
  // 1. AUTO-RECOVERY, LOGIN SYNC & AUTO-START
  if (currentScreen == SCREEN_LOGIN) {
    if (strlen(incomingData.username) > 0) {
      currentUser = String(incomingData.username);
      transitionWipe(WIPE_T2B);
      currentScreen = SCREEN_DASHBOARD;
      drawScreen(currentScreen);
    }
    // If they just grab the handle and pull, auto-start as Guest!
    else if (incomingData.isRowing) {
      currentUser = "Guest";
      transitionWipe(WIPE_B2T);
      currentScreen = SCREEN_DASHBOARD;
      drawScreen(currentScreen);
    }
  }

  // 2. Handle Incoming ESP-NOW Data
  if (newDataArrived) {

    // If we were offline, instantly update the UI to ONLINE!
    if (!isConnected) {
      updateStatusDisplay(true);

      //Sync the local resistance level with the Sensor's memory!
      // (This prevents it from defaulting back to 4 on a reboot)
      outgoingCmd.resistanceLevel = incomingData.resistanceLevel;
    }

    newDataArrived = false;
    lastPacketTime = millis();
    isConnected = true;

    // Catch mid-workout logins on ANY screen
    if (strlen(incomingData.username) > 0 && currentUser == "Guest") {
      currentUser = String(incomingData.username);

      // Seamlessly update the name globally
      updateTopLeftStatus(getDisplayUsername(), TFT_YELLOW);
    }

    // Draw the Authenticating Animation
    if (incomingData.isAuthenticating && !wasAuthenticating) {
      wasAuthenticating = true;

      // Only draw the blue Authenticating text if we aren't currently showing a red error!
      // (It will still silently track the background checks without flickering the screen)
      if (!showingInvalidError) {
        if (currentScreen == SCREEN_LOGIN) {
          // Full screen wipe for the Login page
          tft.fillScreen(TFT_BLACK);
          tft.setTextColor(TFT_WHITE, TFT_BLACK);
          tft.drawCentreString("AUTHENTICATING...", 240, 130, 4);
          tft.setTextColor(TFT_CYAN, TFT_BLACK);
          tft.drawCentreString("Checking database...", 240, 180, 2);
        } else {
          // Sleek mini-indicator on ALL other screens
          updateTopLeftStatus("Authenticating...", TFT_CYAN);
        }
      }
    }
    // Clear the animation if the API call failed (unregistered card)
    else if (!incomingData.isAuthenticating && wasAuthenticating) {
      wasAuthenticating = false;

      if (currentScreen == SCREEN_LOGIN && strlen(incomingData.username) == 0) {

        // Only draw the graphics ONCE to completely eliminate flickering!
        if (!showingInvalidError) {
          tft.fillScreen(TFT_BLACK);
          tft.setTextColor(TFT_RED, TFT_BLACK);
          tft.drawCentreString("INVALID CARD", 240, 140, 4);
          tft.setTextColor(TFT_WHITE, TFT_BLACK);
          tft.drawCentreString("Not recognized in database", 240, 190, 2);
        }

        showingInvalidError = true;
        invalidErrorTime = millis();  // Keeps resetting the timer while card is held
      } else if (currentScreen != SCREEN_LOGIN && currentUser == "Guest") {

        // Only draw the overlay ONCE to prevent flickering!
        if (!showingInvalidError) {
          updateTopLeftStatus("Invalid Card!", TFT_RED);
        }

        showingInvalidError = true;
        invalidErrorTime = millis();  // Keeps resetting the timer while card is held
      }
    }

    if (currentScreen == SCREEN_DASHBOARD) {
      updateTimerDisplay();
      updateRightGauge();
      updateLeftGauge();
      updateTopGauge();
      updateDashboardMetrics();
      updateCenterGauge();
      updateClock();
      updateCenterGauge();  // test
    } else if (currentScreen == SCREEN_STATS) {
      updateStatsDisplay();
    }
  }
  // 3. Clear Invalid Card Error Message after 2 seconds
  if (showingInvalidError && (millis() - invalidErrorTime > 2000)) {
    showingInvalidError = false;

    if (currentScreen == SCREEN_LOGIN) {
      drawScreen(currentScreen);
    } else {
      // Restore the yellow "Guest" text on the dashboard globally
      updateTopLeftStatus(getDisplayUsername(), TFT_YELLOW);
    }
  }

  // Watchdog timer check
  if (isConnected && (millis() - lastPacketTime > 3000)) {
    isConnected = false;

    // Instantly show OFFLINE on any screen
    updateStatusDisplay(false);

    if (currentScreen == SCREEN_STATS) {
      updateStatsDisplay();
    }
  }

  // 3. Animation Engine
  if (currentScreen == SCREEN_DASHBOARD) {
    if (millis() - lastAnimationTime > 30) {
      lastAnimationTime = millis();

      // 1. Animate Temperature (Left Gauge)
      if (abs(displayTemp - incomingData.temperature) > 0.1) {
        displayTemp += (incomingData.temperature - displayTemp) * 0.15;
        updateLeftGauge();
      }

      // 2. Animate RPM (Top Gauge)
      if (abs(displayRpm - incomingData.rpm) > 0.1) {
        // The 0.2 multiplier dictates how "fast" the needle catches up to the real value
        displayRpm += (incomingData.rpm - displayRpm) * 0.2; 
        updateTopGauge(); 
      }

      // 3. Animate Session Distance
      if (incomingData.sessionDistance < displaySessionDistance) {
        // If the real distance drops to 0 (session reset), snap instantly!
        displaySessionDistance = incomingData.sessionDistance; 
      } else if (abs(displaySessionDistance - incomingData.sessionDistance) > 0.005) {
        // Otherwise, smoothly roll up to the new distance
        displaySessionDistance += (incomingData.sessionDistance - displaySessionDistance) * 0.2; 
      } else {
        // Hard snap when it gets microscopically close
        displaySessionDistance = incomingData.sessionDistance; 
      }

      // Animate Humidity (Right Gauge)
      if (abs(displayHumidity - incomingData.humidity) > 0.1) {
        displayHumidity += (incomingData.humidity - displayHumidity) * 0.15;
        updateRightGauge();
      }

      if (abs(displaySpeed - incomingData.speed) > 0.05) {
        // The chaser moves 15% closer to the target every frame (30fps)
        displaySpeed += (incomingData.speed - displaySpeed) * 0.15;
        updateCenterGauge();  // Redraws the sweeping arc smoothly!
      }
    }
  }

  // 4. Touch Screen logic
  if (digitalRead(TOUCH_IRQ) == LOW) {
    uint16_t x, y;
    bool pressed = tft.getTouch(&x, &y);

    if (pressed) lastTouchTime = millis();

    if (pressed && !isTouching) {
      isTouching = true;
      tapHandled = false;
      startX = x;
      startY = y;
      endX = x;
    } else if (pressed && isTouching) {
      endX = x;
    }
  } else {
    if (isTouching) {
      isTouching = false;

      // LOGIN SCREEN
      if (currentScreen == SCREEN_LOGIN && !tapHandled) {
        currentUser = "Guest";
        outgoingCmd.setGuestMode = true;
        sendCommandToSensor();
        outgoingCmd.setGuestMode = false;

        transitionWipe(WIPE_B2T);
        currentScreen = SCREEN_DASHBOARD;
        drawScreen(currentScreen);
        tapHandled = true;
      }

      // SETTINGS SCREEN
      else if (currentScreen == SCREEN_SETTINGS && !tapHandled) {
        if (startX > SCREEN_WIDTH - SIDE_TAP_THRESHOLD) {
          transitionWipe(WIPE_R2L);
          currentScreen = SCREEN_DASHBOARD;
          drawScreen(currentScreen);
          tapHandled = true;
        }
        // Log Out Button
        else if (startY > 220 && startX > 150 && startX < 330) {
          currentUser = "Guest";
          outgoingCmd.resetSession = true;
          sendCommandToSensor();
          outgoingCmd.resetSession = false;

          memset(incomingData.username, 0, sizeof(incomingData.username));

          transitionWipe(WIPE_T2B);
          currentScreen = SCREEN_LOGIN;
          drawScreen(currentScreen);
          tapHandled = true;
        }
        // Intensity Buttons
        else if (startY > 80 && startY < 210) {
          if (startX < 200 && outgoingCmd.resistanceLevel > 1) {
            outgoingCmd.resistanceLevel--;
            drawSettingsControls();
            sendCommandToSensor();
            tapHandled = true;
          } else if (startX > 280 && outgoingCmd.resistanceLevel < 8) {
            outgoingCmd.resistanceLevel++;
            drawSettingsControls();
            sendCommandToSensor();
            tapHandled = true;
          }
        }
      }

      // DASHBOARD SCREEN
      else if (currentScreen == SCREEN_DASHBOARD && !tapHandled) {
        if (startX < SIDE_TAP_THRESHOLD) {
          transitionWipe(WIPE_L2R);
          currentScreen = SCREEN_SETTINGS;
          drawScreen(currentScreen);
          tapHandled = true;
        } else if (startX > SCREEN_WIDTH - SIDE_TAP_THRESHOLD) {
          transitionWipe(WIPE_R2L);
          currentScreen = SCREEN_STATS;
          drawScreen(currentScreen);
          tapHandled = true;
        }
      }

      // STATS SCREEN
      else if (currentScreen == SCREEN_STATS && !tapHandled) {
        if (startX < SIDE_TAP_THRESHOLD) {
          transitionWipe(WIPE_L2R);
          currentScreen = SCREEN_DASHBOARD;
          drawScreen(currentScreen);
          tapHandled = true;
        }
      }
    }
  }

  // 5. Settings Auto-Timeout
  if (currentScreen == SCREEN_SETTINGS && !isTouching) {
    if (millis() - lastTouchTime > 5000) {
      transitionWipe(WIPE_R2L);
      currentScreen = SCREEN_DASHBOARD;
      drawScreen(currentScreen);
    }
  }
}

// Helper to draw Settings Controls
void drawSettingsControls() {
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.drawCentreString("Machine Intensity", 240, 80, 4);

  tft.setTextSize(2);
  tft.drawCentreString("-", 100, 130, 2);
  tft.drawCentreString("+", 380, 130, 2);
  tft.setTextSize(1);

  tft.drawCentreString(String(outgoingCmd.resistanceLevel), 240, 120, 8);

  tft.fillRoundRect(160, 230, 160, 50, 5, TFT_RED);
  tft.setTextColor(TFT_WHITE, TFT_RED);
  tft.drawCentreString("LOG OUT", 240, 245, 4);
}

// Helper to update Raw Stats
void updateStatsDisplay() {
  // A single, reusable 32-character bucket for formatting all text
  char statBuffer[32]; 

  // ==========================================
  // COLUMN 1: System & Environment
  // ==========================================
  tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
  tft.drawString("TOT T:", 20, 80, 4);
  tft.drawString("ACT T:", 20, 110, 4);
  tft.drawString("TEMP:", 20, 140, 4);
  tft.drawString("HUMID:", 20, 170, 4);
  tft.drawString("RESIST:", 20, 200, 4);
  tft.drawString("ROWING:", 20, 230, 4);
  tft.drawString("SENS:", 20, 260, 4);

  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  snprintf(statBuffer, sizeof(statBuffer), "%d s    ", incomingData.totalTimeSeconds);
  tft.drawString(statBuffer, 130, 80, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%d s    ", incomingData.activeTimeSeconds);
  tft.drawString(statBuffer, 130, 110, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%.2f C    ", incomingData.temperature);
  tft.drawString(statBuffer, 130, 140, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%.2f %%    ", incomingData.humidity);
  tft.drawString(statBuffer, 130, 170, 4);

  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  
  snprintf(statBuffer, sizeof(statBuffer), "%d    ", outgoingCmd.resistanceLevel);
  tft.drawString(statBuffer, 130, 200, 4);

  tft.drawString(incomingData.isRowing ? "TRUE  " : "FALSE ", 130, 230, 4);

  if (isConnected) {
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.drawString("ONLINE  ", 130, 260, 4);
  } else {
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.drawString("OFFLINE ", 130, 260, 4);
  }

  // ==========================================
  // COLUMN 2: Hardware Physics Data
  // ==========================================
  tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK);
  tft.drawString("SPEED:", 250, 80, 4);
  tft.drawString("RPM:", 250, 110, 4);
  tft.drawString("REVS:", 250, 140, 4);
  tft.drawString("TRIP:", 250, 170, 4);
  tft.drawString("ODO:", 250, 200, 4);
  tft.drawString("PULLS:", 250, 230, 4); 

  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  
  snprintf(statBuffer, sizeof(statBuffer), "%.2f m/s       ", incomingData.speed);
  tft.drawString(statBuffer, 350, 80, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%d RPM       ", incomingData.rpm);
  tft.drawString(statBuffer, 350, 110, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%d revs       ", incomingData.totalRevs);
  tft.drawString(statBuffer, 350, 140, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%.2f m       ", incomingData.sessionDistance);
  tft.drawString(statBuffer, 350, 170, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%.2f m       ", incomingData.totalDistance);
  tft.drawString(statBuffer, 350, 200, 4);

  snprintf(statBuffer, sizeof(statBuffer), "%d           ", incomingData.strokeCount);
  tft.drawString(statBuffer, 350, 230, 4); 
}

void drawScreen(int screenNumber) {
  tft.fillScreen(TFT_BLACK);

  if (screenNumber == SCREEN_LOGIN) {
    tft.setTextSize(3);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.drawCentreString("ROWING MACHINE", 240, 40, 2);

    tft.setTextColor(TFT_WHITE);
    tft.drawCentreString("ROWING MACHINE", 241, 40, 2);
    tft.drawCentreString("ROWING MACHINE", 240, 41, 2);
    tft.drawCentreString("ROWING MACHINE", 241, 41, 2);

    tft.setTextSize(1);

    tft.setTextColor(TFT_CYAN, TFT_BLACK);
    tft.drawCentreString("Tap NFC Card to Login", 240, 140, 4);

    tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
    tft.drawCentreString("- or tap screen for Guest -", 240, 190, 4);
  } else if (screenNumber == SCREEN_SETTINGS) {
    tft.setTextColor(TFT_BLUE, TFT_BLACK);
    tft.drawCentreString("SETTINGS", 240, 40, 4);
    drawSettingsControls();

    tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
    tft.drawCentreString("O o o", 240, 305, 2);
  } else if (screenNumber == SCREEN_DASHBOARD) {

    updateTimerDisplay();
    updateRightGauge();
    updateLeftGauge();
    updateTopGauge();
    updateDashboardMetrics();
    updateCenterGauge();

    tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
    tft.drawCentreString("o O o", 240, 305, 2);
  } else if (screenNumber == SCREEN_STATS) {
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.drawCentreString("STATS", 240, 30, 4);

    updateStatsDisplay();

    tft.setTextColor(TFT_DARKGREY, TFT_BLACK);
    tft.drawCentreString("o o O", 240, 305, 2);
  }
  // --- GLOBAL HEADER ---
  // 1. Only draw the username if we are NOT on the Login screen
  if (screenNumber != SCREEN_LOGIN) {
    updateTopLeftStatus(getDisplayUsername(), TFT_YELLOW);
  }

  // 2. Always draw the current radio status in the top right
  updateStatusDisplay(isConnected);
}

void updateTimerDisplay() {
  timerSprite.fillSprite(TFT_BLACK);
  timerSprite.setTextColor(TFT_YELLOW);

  int totalSeconds = incomingData.activeTimeSeconds;
  int hours = totalSeconds / 3600;
  int minutes = (totalSeconds / 60) % 60;
  int seconds = totalSeconds % 60;

  char timeBuffer[10];

  if (hours > 0) {
    snprintf(timeBuffer, sizeof(timeBuffer), "%d:%02d:%02d", hours, minutes, seconds);
  } else {
    snprintf(timeBuffer, sizeof(timeBuffer), "%d:%02d", minutes, seconds);
  }
  timerSprite.setTextDatum(MC_DATUM);
  timerSprite.drawString(timeBuffer, TIMER_WIDTH / 2, TIMER_HEIGHT / 2, 4);

  timerSprite.pushSprite((SCREEN_WIDTH - TIMER_WIDTH) / 2, 280);
}

void updateStatusDisplay(bool isOnline) {
  statusSprite.fillSprite(TFT_BLACK);

  if (!isOnline) {
    statusSprite.setTextColor(TFT_RED);
    statusSprite.drawString("OFFLINE", 25, 2, 2);
  }
  statusSprite.pushSprite(380, 10);
}

void updateTemperatureDisplay() {
  temperatureSprite.fillSprite(TFT_BLACK);
  temperatureSprite.setTextColor(TFT_CYAN);

  String tempString = "Temp: " + String(incomingData.temperature, 1) + " C";

  temperatureSprite.drawString(tempString, 0, 0, 4);

  temperatureSprite.pushSprite(40, 160);
}

void updateLeftGauge() {
  float currentValue = displayTemp;
  float minValue = 10.0;
  float maxValue = 40.0;

  uint16_t gaugeColor = TFT_CYAN;
  if (currentValue > 30.0) {
    gaugeColor = TFT_RED;
  }

  leftGauge.fillSprite(TFT_BLACK);

  int cx = 120; 
  int cy = 80;
  int outerRadius = 110;
  int innerRadius = 100;
  int startAngle = 45;
  int endAngle = 135;

  leftGauge.drawSmoothArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle, TFT_DARKGREY, TFT_BLACK, false);

  float percent = (currentValue - minValue) / (maxValue - minValue);
  if (percent < 0.0) percent = 0.0;
  if (percent > 1.0) percent = 1.0;

  float sweepAngle = percent * 90.0;
  int currentAngle = startAngle + sweepAngle;

  if (sweepAngle > 0) {
    leftGauge.drawSmoothArc(cx, cy, outerRadius, innerRadius, startAngle, currentAngle, gaugeColor, TFT_BLACK, false);
  }

  int startRadius = 90;
  int endRadius = 116;
  float rad = currentAngle * 0.0174532925;

  int startX = cx - startRadius * sin(rad);
  int startY = cy + startRadius * cos(rad);
  int endX = cx - endRadius * sin(rad);
  int endY = cy + endRadius * cos(rad);

  leftGauge.drawLine(startX, startY, endX, endY, TFT_RED);
  leftGauge.drawLine(startX, startY - 1, endX, endY - 1, TFT_RED);
  leftGauge.drawLine(startX, startY + 1, endX, endY + 1, TFT_RED);
  leftGauge.drawLine(startX, startY - 2, endX, endY - 2, TFT_RED);
  leftGauge.drawLine(startX, startY + 2, endX, endY + 2, TFT_RED);

  int iconX = 55; 
  int iconY = 75;

  leftGauge.drawRect(iconX - 2, iconY - 12, 5, 16, TFT_WHITE);
  leftGauge.fillCircle(iconX, iconY + 5, 5, TFT_WHITE);
  leftGauge.fillCircle(iconX, iconY + 5, 3, gaugeColor);
  int fluidHeight = percent * 12;
  leftGauge.fillRect(iconX - 1, (iconY + 3) - fluidHeight, 3, fluidHeight, gaugeColor);

  // Keep it physically pinned to the 5px margin
  leftGauge.pushSprite(5, 100);
}

void updateRightGauge() {
  float currentValue = displayHumidity;
  float minValue = 0.0;
  float maxValue = 100.0;
  uint16_t gaugeColor = TFT_ORANGE;
  float nearEmpty = 25.0;

  rightGauge.fillSprite(TFT_BLACK);

  int cx = -35; 
  int cy = 80;
  int outerRadius = 110;
  int innerRadius = 100;
  int startAngle = 225;
  int endAngle = 315;

  rightGauge.drawSmoothArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle, TFT_DARKGREY, TFT_BLACK, false);

  float percent = (currentValue - minValue) / (maxValue - minValue);
  if (percent < 0.0) percent = 0.0;
  if (percent > 1.0) percent = 1.0;

  float sweepAngle = percent * 90.0;
  int currentAngle = endAngle - sweepAngle;

  if (sweepAngle > 0) {
    rightGauge.drawSmoothArc(cx, cy, outerRadius, innerRadius, currentAngle, endAngle, gaugeColor, TFT_BLACK, false);
  }

  int startRadius = 90;
  int endRadius = 116;
  float rad = currentAngle * 0.0174532925;

  int startX = cx - startRadius * sin(rad);
  int startY = cy + startRadius * cos(rad);
  int endX = cx - endRadius * sin(rad);
  int endY = cy + endRadius * cos(rad);

  rightGauge.drawLine(startX, startY, endX, endY, TFT_RED);
  rightGauge.drawLine(startX, startY - 1, endX, endY - 1, TFT_RED);
  rightGauge.drawLine(startX, startY + 1, endX, endY + 1, TFT_RED);
  rightGauge.drawLine(startX, startY - 2, endX, endY - 2, TFT_RED);
  rightGauge.drawLine(startX, startY + 2, endX, endY + 2, TFT_RED);

  int iconX = 30; 
  int iconY = 75;

  rightGauge.drawRect(iconX - 5, iconY - 8, 10, 16, TFT_WHITE);
  if (currentValue <= nearEmpty) {
    rightGauge.fillRect(iconX - 3, iconY - 6, 6, 4, TFT_ORANGE);
  } else {
    rightGauge.fillRect(iconX - 3, iconY - 6, 6, 4, TFT_WHITE);
  }
  rightGauge.drawLine(iconX + 5, iconY - 4, iconX + 8, iconY - 4, TFT_WHITE);
  rightGauge.drawLine(iconX + 8, iconY - 4, iconX + 8, iconY + 4, TFT_WHITE);
  rightGauge.drawLine(iconX + 5, iconY + 4, iconX + 8, iconY + 4, TFT_WHITE);

  rightGauge.pushSprite(390, 100);
}

void updateTopGauge() {
  float minVal = 0.0;
  float maxVal = 1000.0;
  
  float val = displayRpm; 
  
  float percent = (val - minVal) / (maxVal - minVal);
  if (percent < 0.0) percent = 0.0;
  if (percent > 1.0) percent = 1.0;

  topGauge.fillSprite(TFT_BLACK);
  
  int gaugeWidth = 360;
  int trackY = 24; 
  
  // 1. Draw the horizontal base track (2 pixels thick)
  topGauge.fillRect(10, trackY - 1, gaugeWidth - 20, 2, TFT_DARKGREY);
  
  // 2. Draw taller dash mark ticks sitting ON the track
  int numTicks = 11; 
  for (int i = 0; i < numTicks; i++) {
    int tickX = 10 + (i * (gaugeWidth - 20) / (numTicks - 1));
    topGauge.drawLine(tickX, trackY - 14, tickX, trackY, TFT_DARKGREY);
  }

  int thumbX = 10 + (percent * (gaugeWidth - 20));
  
  // 3. Fill the track color from the left up to the slider (All White)
  topGauge.fillRect(10, trackY - 1, thumbX - 10, 2, TFT_WHITE);

  // 4. Draw the solid diamond needle
  // Top half (Now touches the absolute top edge of the sprite perfectly!)
  topGauge.fillTriangle(thumbX - 2, trackY - 11, 
                        thumbX + 2, trackY - 11, 
                        thumbX,     trackY - 22, 
                        TFT_WHITE); 
                        
  // Bottom half
  topGauge.fillTriangle(thumbX - 2, trackY - 11, 
                        thumbX + 2, trackY - 11, 
                        thumbX,     trackY, 
                        TFT_WHITE);

  // 5. Push the sprite to Y=20
  topGauge.pushSprite(60, 20);
}

void updateDashboardMetrics() {
  // --- Snap to zero to kill leftover smoothing decimals ---
  if (displaySpeed < 0.07) { 
    displaySpeed = 0.0;
  }
  // 1. SPEEDOMETER
  speedSprite.fillSprite(TFT_BLACK);
  speedSprite.setTextColor(TFT_WHITE);
  speedSprite.setTextDatum(MC_DATUM);

  char speedStr[10];
  dtostrf(displaySpeed * 100.0, 1, 0, speedStr);

  // Center of 186px is 93
  speedSprite.drawString(speedStr, 93, 40, 8); 
  
  speedSprite.setTextColor(TFT_DARKGREY);
  speedSprite.drawString("cm/s", 93, 95, 2);

  speedSprite.pushSprite(147, 110);

  // 2. SUB-METRIC LEFT (Total Pulls)
  subLeftSprite.fillSprite(TFT_BLACK);
  subLeftSprite.setTextDatum(MC_DATUM);
  subLeftSprite.setTextColor(TFT_WHITE);

  // Convert the integer into a string (using the new strokeCount variable)
  char pullStr[10];
  itoa(incomingData.strokeCount, pullStr, 10); 

  // Draw the numeric value
  subLeftSprite.drawString(pullStr, 40, 20, 4);
  
  // Draw the new label
  subLeftSprite.setTextColor(TFT_DARKGREY);
  subLeftSprite.drawString("PULLS", 40, 45, 1);

  subLeftSprite.pushSprite(160, 210);

  // 3. SUB-METRIC RIGHT (Session Distance in Meters)
  subRightSprite.fillSprite(TFT_BLACK);
  subRightSprite.setTextDatum(MC_DATUM);
  subRightSprite.setTextColor(TFT_WHITE);

  char tripStr[12];
  dtostrf((displaySessionDistance), 1, 2, tripStr);

  subRightSprite.drawString(tripStr, 40, 20, 4);
  subRightSprite.setTextColor(TFT_DARKGREY);
  subRightSprite.drawString("TRIP (m)", 40, 45, 1);

  subRightSprite.pushSprite(240, 210);

  // 4. DISTANCE (Bottom Right Odometer)
  distSprite.fillSprite(TFT_BLACK);
  distSprite.setTextColor(TFT_DARKGREY);
  distSprite.setTextDatum(MR_DATUM);
  // Reusable buffer for distance
  char distStr[20];
  snprintf(distStr, sizeof(distStr), "%.2f km", incomingData.totalDistance / 1000.0);
  distSprite.drawString(distStr, 120, 10, 2);
  distSprite.pushSprite(350, 300);

  // 5. RESISTANCE (Bottom Left Indicator)
  resSprite.fillSprite(TFT_BLACK);
  resSprite.setTextColor(TFT_DARKGREY);
  resSprite.setTextDatum(ML_DATUM);
  // Reusable buffer for resistance
  char resStr[16];
  snprintf(resStr, sizeof(resStr), "Level: %d", outgoingCmd.resistanceLevel);
  resSprite.drawString(resStr, 0, 10, 2);
  resSprite.pushSprite(10, 300);
}

void updateClock() {
  clockSprite.fillSprite(TFT_BLACK);
  clockSprite.setTextColor(TFT_WHITE);
  clockSprite.setTextDatum(MC_DATUM);

  clockSprite.drawString(incomingData.clockTime, 40, 10, 2);

  // Push perfectly centered at the very top of the screen
  clockSprite.pushSprite(200, 2);
}

// --- CENTER HUD GAUGE ---
void updateCenterGauge() {
  int cx = 240;
  int cy = 195;  
  
  int r1 = 145;  
  int r2 = 128;

  float maxSpeed = 3.0;

  float percent = displaySpeed / maxSpeed;
  
  if (percent < 0.01) percent = 0.0; 
  if (percent > 1.0) percent = 1.0;
  
  int totalSweep = 270;
  int activeEndAngle = 225 - (percent * totalSweep);

  static int lastActiveEndAngle = -999;
  if (activeEndAngle == lastActiveEndAngle) {
    return; // Exit if nothing moved
  }
  lastActiveEndAngle = activeEndAngle;

  // --- 1. HANDLE THE BALL FIRST (ZERO DELAY) ---
  float tipRad = activeEndAngle * 0.0174533;
  int tipX = cx + cos(tipRad) * (r2 - 10);
  int tipY = cy - sin(tipRad) * (r2 - 10);

  static int lastTipX = 0, lastTipY = 0;

  if (lastTipX != tipX || lastTipY != tipY) {
    if (lastTipX != 0) {
      tft.fillCircle(lastTipX, lastTipY, 5, TFT_BLACK); // Erase instantly
    }
    tft.fillCircle(tipX, tipY, 4, TFT_WHITE);           // Draw instantly!
    
    lastTipX = tipX;
    lastTipY = tipY;
  }

  // --- 2. THEN DRAW THE TRACK ---
  for (int a = 225; a >= -45; a -= 5) {
    float rad = a * 0.0174533;

    int x1 = cx + cos(rad) * r1;
    int y1 = cy - sin(rad) * r1;
    int x2 = cx + cos(rad) * r2;
    int y2 = cy - sin(rad) * r2;

    uint16_t color = TFT_DARKGREY;

    if (a > activeEndAngle) {
      color = TFT_RED;
    }

    tft.drawLine(x1, y1, x2, y2, color);
  }
}