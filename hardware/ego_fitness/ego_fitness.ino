#include "TFT_eSPI.h"
#include "logo.h"
#include "Rockwell20.h"
#include "Rockwell30.h"

TFT_eSPI tft = TFT_eSPI(); 

#define TFT_BL_PIN 7 
#define RADAR_OUT_PIN 9 

const uint16_t EF_PURPLE = 0x480E;

bool isScreenOn = false; 

void setup() {
  pinMode(TFT_BL_PIN, OUTPUT);
  pinMode(RADAR_OUT_PIN, INPUT);
  
  digitalWrite(TFT_BL_PIN, LOW); // Start with screen off

  tft.init();
  
  // set screen rotation
  tft.setRotation(0); 
  
  // fill background to EF colour
  tft.fillScreen(EF_PURPLE);
  
  // 2. DRAW YOUR LOGO
  tft.pushImage(35, 40, 170, 200, mylogo);

  tft.setTextColor(TFT_WHITE, EF_PURPLE); 

  // 1. Tell the screen to center all text from now on (Top-Center)
  tft.setTextDatum(TC_DATUM); 

  // 2. TOP TEXT (Brand Name)
  tft.loadFont(Rockwell30);
  // Because we set TC_DATUM above, standard drawString automatically centers!
  tft.drawString("Ego Fitness", 120, 15); 
  tft.unloadFont();
  
  // 3. BOTTOM TEXT (Action)
  tft.setFreeFont(&FreeSansBold9pt7b);
  tft.drawString("TAP TO SIGN IN", 120, 252);
}

void loop() {
  bool personDetected = digitalRead(RADAR_OUT_PIN);

  if (personDetected && !isScreenOn) {
    digitalWrite(TFT_BL_PIN, HIGH);
    isScreenOn = true;
  } else if (!personDetected && isScreenOn) {
    digitalWrite(TFT_BL_PIN, LOW);
    isScreenOn = false;
  }
}