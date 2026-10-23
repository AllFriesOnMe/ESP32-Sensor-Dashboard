const i2cForm = document.getElementById("i2c-form");
const scanButton = document.getElementById("scan-i2c");
const scanStatus = document.getElementById("i2c-status");
const sdaInput = document.getElementById("i2c-sda");
const sclInput = document.getElementById("i2c-scl");
const sensorSetupDialog = document.getElementById("sensor-setup-dialog");
const sensorSetupButton = document.getElementById("open-sensor-setup");
function openSensorSetup() {
    if (!sensorSetupDialog.open) sensorSetupDialog.showModal();
}
sensorSetupButton.addEventListener("click", openSensorSetup);
document.getElementById("close-sensor-setup").addEventListener("click", () => sensorSetupDialog.close());
sensorSetupDialog.addEventListener("close", () => sensorSetupButton.focus());
let scanTimer;
let sensorSummary = "";
let sensorsInitialized = false;
window.i2cScanPending = false;

function showSensorReadingsStatus() {
    if (!sensorsInitialized || !sensorSummary || window.i2cScanPending) return;
    const live = !mockMode && latestSample && performance.now() - lastSampleTime <= sampleTimeoutMs;
    scanStatus.textContent = sensorSummary + (live ? " Live sensor readings are streaming." :
        " Sensors initialized. Place a target in front of the distance sensor to start or resume live readings. Mock Mode continues until readings arrive.");
}

window.addEventListener("sensor-source-changed", showSensorReadingsStatus);

function validI2cPin(pin) {
    return Number.isInteger(pin) && ([0, 2, 4, 5, 21, 22, 23, 25, 26, 27, 32, 33].includes(pin) ||
        (pin >= 12 && pin <= 19));
}

function finishScan() {
    clearTimeout(scanTimer);
    window.i2cScanPending = false;
    scanButton.disabled = !serialSession || serialSession.stopped;
}

window.addEventListener("serial-port-state", () => {
    finishScan();
    sensorSummary = "";
    sensorsInitialized = false;
    if (serialSession && !serialSession.stopped) openSensorSetup();
    scanStatus.textContent = serialSession ? "Choose the wired GPIOs, then apply pins and scan." :
        "Connect an ESP32 to scan for sensors.";
});

window.addEventListener("i2c-message", event => {
    const data = event.detail;
    if (data.type === "i2c_progress") {
        scanStatus.textContent = String(data.message || "Calibrating sensors…");
        return;
    }
    if (data.type === "i2c_status") {
        if (!validI2cPin(data.sda) || !validI2cPin(data.scl) || data.sda === data.scl ||
            !Array.isArray(data.addresses) || typeof data.ready !== "boolean") return;
        const addresses = data.addresses.filter(address => Number.isInteger(address) && address >= 8 && address < 120)
            .map(address => "0x" + address.toString(16).padStart(2, "0").toUpperCase());
        sdaInput.value = data.sda;
        sclInput.value = data.scl;
        sensorSummary = `SDA ${data.sda} / SCL ${data.scl}: ${addresses.length ? "devices responding at " + addresses.join(", ") : "no devices found"}.`;
        sensorsInitialized = data.ready;
        scanStatus.textContent = sensorSummary + " " + String(data.message || "");
        const live = !mockMode && latestSample && performance.now() - lastSampleTime <= sampleTimeoutMs;
        usbStatus.textContent = data.ready ? (live ? "Receiving live sensor data" : "Sensors ready — place a target in range") : "Sensors not ready — Mock Mode";
        if (!data.ready) {
            latestSample = null;
            setMockMode(true);
        }
        finishScan();
        showSensorReadingsStatus();
    }
    else if (data.type === "i2c_error") {
        scanStatus.textContent = String(data.message || "Scan failed. Check pin settings.");
        finishScan();
    }
});

i2cForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (window.i2cScanPending) return;
    const sda = sdaInput.valueAsNumber;
    const scl = sclInput.valueAsNumber;
    if (!validI2cPin(sda) || !validI2cPin(scl) || sda === scl) {
        scanStatus.textContent = "Choose two different supported GPIO pins from the list below.";
        return;
    }
    if (!serialSession || serialSession.stopped) {
        scanStatus.textContent = "Connect an ESP32 first.";
        return;
    }
    window.i2cScanPending = true;
    scanButton.disabled = true;
    latestSample = null;
    setMockMode(true);
    usbStatus.textContent = "Scanning sensors — Mock Mode";
    scanStatus.textContent = "Scanning selected pins. Keep the board still for calibration…";
    scanTimer = setTimeout(() => {
        scanStatus.textContent = "No scan response. Install the latest firmware, reconnect and retry.";
        finishScan();
    }, 15000);
    try { await sendSerialCommand(`SCAN ${sda} ${scl}`); }
    catch (error) {
        scanStatus.textContent = "Could not send scan command. Reconnect the board and retry.";
        finishScan();
    }
});
