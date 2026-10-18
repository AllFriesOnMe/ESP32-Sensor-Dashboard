#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <VL53L0X.h>
#include <MPU6050_light.h>
#include <LittleFS.h>

MPU6050 mpu(Wire);

// ----------------------
// Wi-Fi
// ----------------------

const char* ssid = "BELL668";
const char* password = "1977C4362113";

WebServer server(80);


// ----------------------
// VL53L0X
// ----------------------

VL53L0X tof;

int distanceMM = 0;

unsigned long lastDistanceRead = 0;

// website stuff

void handleHome() {

  File file = LittleFS.open("/index.html", "r");

  if (!file) {
    server.send(
      500,
      "text/plain",
      "index.html could not be opened"
    );

    return;
  }

  server.streamFile(
    file,
    "text/html"
  );

  file.close();
}


void handleDistance() {

  server.send(
    200,
    "text/plain",
    String(distanceMM)
  );

}

void handleData() {

  String json = "{";

  json += "\"distance\":";
  json += distanceMM;

  json += ",\"accelX\":";
  json += mpu.getAccX();

  json += ",\"accelY\":";
  json += mpu.getAccY();

  json += ",\"accelZ\":";
  json += mpu.getAccZ();

  json += ",\"gyroX\":";
  json += mpu.getGyroX();

  json += ",\"gyroY\":";
  json += mpu.getGyroY();

  json += ",\"gyroZ\":";
  json += mpu.getGyroZ();

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );
}

// ----------------------
// Setup
// ----------------------

void setup() {
  Serial.begin(115200);
  delay(1000);

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS failed");
    while (true) {
      delay(100);
    }
  }
  
  Serial.println("LittleFS started");

  if(LittleFS.exists("/index.html")) {
    Serial.println("index.html found!");
  }
  else {
    Serial.println("index.html NOT found!");
  }

  // Start I2C
  Wire.begin(21, 22);

  // Start MPU
  byte status = mpu.begin();

  if(status != 0) {
    Serial.println("MPU failed");
    while(true) {
      delay(100);
    }
  }

  Serial.println("Keep MPU still...");
  delay(1000);

  mpu.calcOffsets();

  Serial.println("MPU Ready");

  // Start ToF sensor
  tof.setBus(&Wire);
  tof.setTimeout(500);

  if (!tof.init()) {

    Serial.println("VL53L0X failed");

    while (true) {
      delay(100);
    }

  }

  Serial.println("VL53L0X ready");


  // ----------------------
  // Connect to Wi-Fi
  // ----------------------

  WiFi.begin(ssid, password);

  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {

    Serial.print(".");
    delay(500);

  }

  Serial.println();
  Serial.println("Connected!");

  Serial.print("Go to: http://");
  Serial.println(WiFi.localIP());


  // ----------------------
  // Website routes
  // ----------------------

  server.on("/", handleHome);
  server.on("/data", handleData);

  server.serveStatic("/style.css", LittleFS, "/style.css");

  server.begin();

  Serial.println("Web server started");
}

// Main loop

void loop() {

  mpu.update();

  // Update distance every 100 ms
  if (millis() - lastDistanceRead >= 100) {

    lastDistanceRead = millis();

    uint16_t reading =
      tof.readRangeSingleMillimeters();

    if (!tof.timeoutOccurred()) {

      distanceMM = reading;

    }

  }

  // Listen for browser requests
  server.handleClient();
}