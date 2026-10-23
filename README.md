# ESP-32 Sensor Dashboard

An interactive web dashboard for visualizing real-time sensor data from an ESP32, MPU6050 accelerometer/gyroscope, and VL53L0X time-of-flight sensor.

Features include:
* Real-time acceleration, angular velocity and distance measurements
* Graphs and and a 3D visualization of the MPU 6050's orientation
* Mock mode for exploring the dashboard without hardware
* USB connectivity through the browser
* Configurable I2C pin detection

[Launch Interactive Dashboard](esp32-sensor-dashboard.anderson-wang368.workers.dev)

### Getting Started
**Requirements:** ESP32 DevKit/WROOM-32 (4MB flash), MPU6050, VL53L0X, and a USB data cable.
1. Connect both sensors to the ESP32
2. Open the dashboard using desktop Chrome or Edge
3. Click **First time? Install firmware** below the **Connect ESP32** button, then follow given instructions
4. Return to dashboard and click **Connect ESP32** to start viewing live sensor data. You will be asked to input your pin configuration.

No Arduino IDE or PlatformIO installation required.

### Notes
* Installing firmware replaces the existing program on your ESP32.
* Requires firmware v1.1.0 or later.

### Demo Mode
If you do not have the hardware, the dashboard automatically runs in Mock Mode, generating simulated sensor readings.