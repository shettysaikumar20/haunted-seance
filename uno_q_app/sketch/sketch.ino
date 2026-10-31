#include "Arduino_RouterBridge.h"
#include <Arduino_LED_Matrix.h>

Arduino_LED_Matrix matrix;
volatile bool lanternShowing = false;
unsigned long lanternOffAt = 0;
const uint8_t marigold[104] = {
  0,0,0,0,0,0,4,0,0,0,0,0,0,
  0,0,0,0,3,5,6,5,3,0,0,0,0,
  0,0,0,4,5,6,7,6,5,4,0,0,0,
  0,0,4,5,6,6,7,6,6,5,4,0,0,
  0,0,0,4,5,6,7,6,5,4,0,0,0,
  0,0,0,0,3,5,6,5,3,0,0,0,0,
  0,0,0,0,0,0,2,0,0,0,0,0,0,
  0,0,0,0,0,0,2,0,0,0,0,0,0
};
const uint8_t blank[104] = {0};

void memory_gathered();

void setup() {
  matrix.begin();
  matrix.setGrayscaleBits(3);
  matrix.draw(blank);
  Bridge.begin();
  Bridge.provide_safe("memory_gathered", memory_gathered);
}

void loop() {
  if (lanternShowing && static_cast<long>(millis() - lanternOffAt) >= 0) {
    matrix.draw(blank);
    lanternShowing = false;
  }
}

void memory_gathered() {
  matrix.draw(marigold);
  lanternOffAt = millis() + 2600;
  lanternShowing = true;
}
