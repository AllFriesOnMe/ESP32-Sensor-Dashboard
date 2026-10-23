// Any serial device can be selected; live mode requires the telemetry contract.
const sensorFields = ["distance", "accelX", "accelY", "accelZ", "gyroX", "gyroY", "gyroZ"];
const sampleTimeoutMs = 2000;
let mockMode = true;
let serialSession = null;
let latestSample = null;
let lastSampleTime = 0;

function validSensorData(data) {
    return data !== null && typeof data === "object" &&
        sensorFields.every(field => typeof data[field] === "number" && Number.isFinite(data[field])) &&
        data.distance >= 0;
}

function setMockMode(enabled) {
    const changed = mockMode !== enabled;
    mockMode = enabled;
    const badge = document.getElementById("data-source");
    badge.textContent = enabled ? "MOCK DATA" : "ESP32 CONNECTED";
    badge.className = enabled ? "mock" : "connected";
    document.getElementById("distance-marker").className = badge.className;
    if (changed) window.dispatchEvent(new Event("sensor-source-changed"));
}

function getSensorData() {
    if (serialSession && latestSample && performance.now() - lastSampleTime > sampleTimeoutMs) {
        latestSample = null;
        setMockMode(true);
        document.getElementById("usb-status").textContent = "No recent sensor data — Mock Mode";
    }
    return mockMode ? getMockData() : latestSample;
}

function acceptSerialLine(line) {
    let data;
    try { data = JSON.parse(line); }
    catch { return; }
    if (data && ["i2c_status", "i2c_progress", "i2c_error"].includes(data.type)) {
        window.dispatchEvent(new CustomEvent("i2c-message", { detail: data }));
        return;
    }
    if (window.i2cScanPending || !validSensorData(data)) return;
    latestSample = data;
    lastSampleTime = performance.now();
    setMockMode(false);
    document.getElementById("usb-status").textContent = "Receiving live sensor data";
}

async function readSerial(session) {
    const decoder = new TextDecoder();
    let buffer = "";
    let discardLine = false;
    try {
        session.reader = session.port.readable.getReader();
        while (!session.stopped) {
            const { value, done } = await session.reader.read();
            if (done || session.stopped) break;
            buffer += decoder.decode(value, { stream: true });
            let newline;
            while ((newline = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (!discardLine && line.length <= 2048) acceptSerialLine(line);
                discardLine = false;
            }
            // Bound memory if a device sends garbage without newlines.
            if (buffer.length > 2048) {
                buffer = "";
                discardLine = true;
            }
        }
    }
    catch (error) {
        console.warn("USB serial reading stopped:", error);
    }
    finally {
        if (session.reader) session.reader.releaseLock();
        latestSample = null;
        setMockMode(true);
        document.getElementById("usb-status").textContent = "Device disconnected — Mock Mode";
        try { await session.port.close(); }
        catch { /* A removed device may already be closed. */ }
        if (serialSession === session) serialSession = null;
        window.dispatchEvent(new Event("serial-port-state"));
        connectButton.textContent = "Connect ESP32 (USB)";
        connectButton.disabled = false;
    }
}

const connectButton = document.getElementById("connect-esp32");
const usbStatus = document.getElementById("usb-status");
setMockMode(true);

if (!("serial" in navigator) || !window.isSecureContext) {
    connectButton.disabled = true;
    usbStatus.textContent = "USB requires desktop Chrome or Edge on HTTPS or localhost";
}
else {
    navigator.serial.addEventListener("disconnect", event => {
        if (!serialSession || event.target !== serialSession.port) return;
        serialSession.stopped = true;
        latestSample = null;
        setMockMode(true);
        usbStatus.textContent = "Device disconnected — Mock Mode";
        if (serialSession.reader) serialSession.reader.cancel().catch(() => {});
    });
}

connectButton.addEventListener("click", async () => {
    connectButton.disabled = true;
    try {
        // No vendor filters: ESP32 boards use many different USB bridges.
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        const session = { port, reader: null, stopped: false };
        serialSession = session;
        latestSample = null;
        setMockMode(true);
        connectButton.textContent = "ESP32 port open";
        usbStatus.textContent = "Waiting for sensor data — Mock Mode";
        void readSerial(session);
        window.dispatchEvent(new Event("serial-port-state"));
        void sendSerialCommand("STATUS").catch(() => {});
    }
    catch (error) {
        usbStatus.textContent = error.name === "NotFoundError" ? "No device selected" :
            "Cannot open USB port. Close other serial monitors and try again.";
        connectButton.disabled = false;
    }
});

async function sendSerialCommand(command) {
    const session = serialSession;
    if (!session || session.stopped || !session.port.writable) throw new Error("Connect an ESP32 first");
    const writer = session.port.writable.getWriter();
    try { await writer.write(new TextEncoder().encode(command + "\n")); }
    finally { writer.releaseLock(); }
}
