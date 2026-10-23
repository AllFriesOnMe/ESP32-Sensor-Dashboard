#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <uri/UriGlob.h>
#include <VL53L0X.h>
#include <MPU6050_light.h>
#include <LittleFS.h>
#include <Preferences.h>
#if !defined(PUBLIC_USB_FIRMWARE) && __has_include("secrets.h")
#include "secrets.h"
#endif
#ifndef WIFI_SSID
#define WIFI_SSID ""
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif

// Override these build flags for ESP32 boards with different I2C wiring.
#ifndef SENSOR_SDA
#define SENSOR_SDA 21
#endif
#ifndef SENSOR_SCL
#define SENSOR_SCL 22
#endif

MPU6050 mpu(Wire);

// Wi-Fi

WebServer server(80);

// VL53L0X

VL53L0X tof;

int distanceMM = 0;

unsigned long lastDistanceRead = 0;
unsigned long lastSerialWrite = 0;
unsigned long lastValidDistance = 0;
bool distanceReady = false;
bool filesystemReady = false;
bool webServerStarted = false;
bool sensorsReady = false;
int activeSda = SENSOR_SDA;
int activeScl = SENSOR_SCL;
String scanAddresses = "[]";
const char* sensorMessage = "Not configured";

bool validSensorPin(int pin) {
  // Classic ESP32 output GPIOs, excluding flash and the USB UART.
  return pin == 0 || pin == 2 || pin == 4 || pin == 5 ||
    (pin >= 12 && pin <= 19) || (pin >= 21 && pin <= 23) ||
    (pin >= 25 && pin <= 27) || pin == 32 || pin == 33;
}

void reportI2cStatus() {
  Serial.printf("{\"type\":\"i2c_status\",\"sda\":%d,\"scl\":%d,\"ready\":%s,\"addresses\":%s,\"message\":\"%s\"}\n",
    activeSda, activeScl, sensorsReady ? "true" : "false", scanAddresses.c_str(), sensorMessage);
}

void configureSensors(int sda, int scl, bool savePins) {
  sensorsReady = false;
  distanceReady = false;
  activeSda = sda;
  activeScl = scl;
  scanAddresses = "[";
  Wire.end();
  if (!Wire.begin(sda, scl, 100000)) {
    scanAddresses = "[]";
    sensorMessage = "Could not start I2C on these pins";
    reportI2cStatus();
    return;
  }
  Wire.setTimeOut(20);
  bool foundMpu = false;
  bool foundTof = false;
  for (uint8_t address = 8; address < 120; ++address) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      if (scanAddresses.length() > 1) scanAddresses += ",";
      scanAddresses += address;
      if (address == 0x68) foundMpu = true;
      if (address == 0x29) foundTof = true;
    }
    delay(1);
  }
  scanAddresses += "]";
  if (!foundMpu || !foundTof) {
    sensorMessage = !foundMpu && !foundTof ? "Expected sensors not found; check pins, power and wiring" :
      !foundMpu ? "MPU6050 missing at 0x68; check AD0 is low" : "VL53L0X missing at 0x29";
    reportI2cStatus();
    return;
  }
  if (mpu.begin() != 0) {
    sensorMessage = "MPU6050 initialization failed";
    reportI2cStatus();
    return;
  }
  tof.setBus(&Wire);
  tof.setTimeout(500);
  if (!tof.init()) {
    sensorMessage = "VL53L0X initialization failed";
    reportI2cStatus();
    return;
  }
  Serial.println("{\"type\":\"i2c_progress\",\"message\":\"Sensors found; keep the board still for calibration\"}");
  delay(1000);
  mpu.calcOffsets();
  tof.startContinuous(100);
  sensorsReady = true;
  bool saved = false;
  if (savePins) {
    Preferences preferences;
    if (preferences.begin("sensor-pins", false)) {
      // Store the pair atomically in a single value.
      saved = preferences.putUInt("pins", (sda << 8) | scl) == sizeof(uint32_t);
      preferences.end();
    }
  }
  sensorMessage = savePins ? (saved ? "Sensors ready; pins saved. Waiting for a valid distance reading" :
    "Sensors ready; pins could not be saved") : "Sensors ready; waiting for a valid distance reading";
  reportI2cStatus();
}

void handleSerialCommands() {
  static String command;
  static bool discard = false;
  // Limit work per loop so a noisy sender cannot starve sensor sampling.
  for (int count = 0; count < 128 && Serial.available(); ++count) {
    char character = Serial.read();
    if (character == '\n') {
      command.trim();
      if (!discard && command == "STATUS") reportI2cStatus();
      else if (!discard && command.startsWith("SCAN ")) {
        int sda, scl, consumed = 0;
        if (sscanf(command.c_str(), "SCAN %d %d%n", &sda, &scl, &consumed) == 2 &&
            consumed == (int)command.length() && validSensorPin(sda) && validSensorPin(scl) && sda != scl) {
          configureSensors(sda, scl, true);
        }
        else Serial.println("{\"type\":\"i2c_error\",\"message\":\"Choose two different supported GPIO pins\"}");
      }
      command = "";
      discard = false;
    }
    else if (!discard) {
      if (command.length() < 64) command += character;
      else { command = ""; discard = true; }
    }
  }
}

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

String sensorJson() {
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

  return json;
}

void handleData() {
  server.sendHeader("Cache-Control", "no-store");
  if (!distanceReady) {
    server.send(503, "text/plain", "Waiting for sensor data");
    return;
  }

  server.send(
    200,
    "application/json",
    sensorJson()
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

  filesystemReady = LittleFS.begin(false);
  if (!filesystemReady) Serial.println("LittleFS unavailable; USB telemetry still enabled");
  
  if (filesystemReady) listLittleFS();

  if(filesystemReady && LittleFS.exists("/index.html")) {
    Serial.println("index.html found!");
  }
  else {
    Serial.println("index.html NOT found!");
  }
  // Sensor failures leave serial commands available so users can fix pin settings.
  Preferences preferences;
  if (preferences.begin("sensor-pins", true)) {
    uint32_t pins = preferences.getUInt("pins", (SENSOR_SDA << 8) | SENSOR_SCL);
    preferences.end();
    int sda = (pins >> 8) & 0xff;
    int scl = pins & 0xff;
    if (validSensorPin(sda) && validSensorPin(scl) && sda != scl) {
      activeSda = sda;
      activeScl = scl;
    }
  }
  configureSensors(activeSda, activeScl, false);

  // ----------------------
  // Connect to Wi-Fi
  // ----------------------

  // USB must work without Wi-Fi credentials or an available access point.
  if (strlen(WIFI_SSID) > 0) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setSleep(false);
  }

  // Website routes

  server.on("/data", HTTP_GET, handleData);
  server.on("/", HTTP_GET, handleHome);

  // Register file requests as a real route. onNotFound logs an error
  // before invoking its callback, even when that callback serves a file.
  server.on(UriGlob("/*"), HTTP_GET, handleStaticFile);
  server.onNotFound([]() {
    server.send(404, "text/plain", "Not found");
  });

  Serial.println("USB telemetry ready; Wi-Fi server starts when connected");
}

// Main loop

void loop() {

  handleSerialCommands();
  if (sensorsReady) mpu.update();

  // Continuous ranging runs on the sensor. Only read a completed sample
  // so a measurement never holds up HTTP handling for up to 500 ms.
  if (sensorsReady && millis() - lastDistanceRead >= 100) {

    lastDistanceRead = millis();

    if ((tof.readReg(VL53L0X::RESULT_INTERRUPT_STATUS) & 0x07) != 0) {
      uint16_t reading = tof.readRangeContinuousMillimeters();

      if (!tof.timeoutOccurred()) {
        // VL53L0X uses large sentinel values for invalid/out-of-range results.
        distanceReady = reading < 8190;
        if (distanceReady) {
          distanceMM = reading;
          lastValidDistance = millis();
        }
      }
      else distanceReady = false;
    }

  }

  // Newline-delimited JSON is shared by USB and the HTTP endpoint.
  if (millis() - lastValidDistance > 1000) distanceReady = false;
  if (distanceReady && millis() - lastSerialWrite >= 100) {
    lastSerialWrite = millis();
    Serial.println(sensorJson());
  }

  if (!webServerStarted && WiFi.status() == WL_CONNECTED) {
    server.begin();
    webServerStarted = true;
    Serial.println("Web server started");
    Serial.print("Go to: http://");
    Serial.println(WiFi.localIP());
  }

  // Listen for browser requests
  if (webServerStarted) server.handleClient();
}
