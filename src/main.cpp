#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <uri/UriGlob.h>
#include <VL53L0X.h>
#include <MPU6050_light.h>
#include <LittleFS.h>
#include "secrets.h"

MPU6050 mpu(Wire);

// Wi-Fi

WebServer server(80);

// VL53L0X

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

  server.sendHeader("Cache-Control", "no-cache");
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

  server.sendHeader("Cache-Control", "no-store");

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

void listLittleFS() {

  File root = LittleFS.open("/");

  File file = root.openNextFile();

  while (file) {

    Serial.print("FILE: ");
    Serial.print(file.name());

    Serial.print(" | SIZE: ");
    Serial.println(file.size());

    file = root.openNextFile();
  }
}

String getContentType(String path) {

  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".glb")) return "model/gltf-binary";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg")) return "image/jpeg";

  return "text/plain";
}

void handleStaticFile() {

  String path = server.uri();

  if (path == "/") {
    path = "/index.html";
  }

  if (!LittleFS.exists(path)) {

    Serial.print("NOT FOUND IN LITTLEFS: ");
    Serial.println(path);

    server.send(
      404,
      "text/plain",
      "File not found"
    );

    return;
  }

  File file =
    LittleFS.open(path, "r");

  if (!file) {

    server.send(
      500,
      "text/plain",
      "Could not open file"
    );

    return;
  }

  String contentType =
    getContentType(path);

  // Reuse assets across reloads, especially the large 3D model.
  server.sendHeader("Cache-Control", "public, max-age=300");
  server.streamFile(
    file,
    contentType
  );

  file.close();
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
  listLittleFS();

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
  tof.startContinuous(100);


  // ----------------------
  // Connect to Wi-Fi
  // ----------------------

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setSleep(false);

  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {

    Serial.print(".");
    delay(500);

  }

  Serial.println();
  Serial.println("Connected!");

  Serial.print("Go to: http://");
  Serial.println(WiFi.localIP());

  // Website routes

  server.on("/data", HTTP_GET, handleData);
  server.on("/", HTTP_GET, handleHome);

  // Register file requests as a real route. onNotFound logs an error
  // before invoking its callback, even when that callback serves a file.
  server.on(UriGlob("/*"), HTTP_GET, handleStaticFile);
  server.onNotFound([]() {
    server.send(404, "text/plain", "Not found");
  });

  server.begin();

  Serial.println("Web server started");
}

// Main loop

void loop() {

  mpu.update();

  // Continuous ranging runs on the sensor. Only read a completed sample
  // so a measurement never holds up HTTP handling for up to 500 ms.
  if (millis() - lastDistanceRead >= 100) {

    lastDistanceRead = millis();

    if ((tof.readReg(VL53L0X::RESULT_INTERRUPT_STATUS) & 0x07) != 0) {
      uint16_t reading = tof.readRangeContinuousMillimeters();

      if (!tof.timeoutOccurred()) {
        distanceMM = reading;
      }
    }

  }

  // Listen for browser requests
  server.handleClient();
}
