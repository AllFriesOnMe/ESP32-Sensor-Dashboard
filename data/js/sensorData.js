let mockMode = false;

async function detectESP32() {

    try {
        const response = await fetch("/data");

        if (!response.ok) {
            throw new Error("ESP32 not found");
        }

        const data = await response.json();

        if(typeof data.distance !== "number") {
            throw new Error("Not ESP32 sensor data");
        }

        mockMode = false;
        console.log("ESP32 detected - using real data");

        const badge = document.getElementById("data-source");

        badge.innerHTML = "ESP32 CONNECTED";
        badge.className = "connected";

        document.getElementById("distance-marker").className = "connected";
    }
    catch (error) {

        mockMode = true;
        console.log("ESP32 not detected - using mock data");

        const badge = document.getElementById("data-source");

        badge.innerHTML = "MOCK DATA";
        badge.className = "mock";
        document.getElementById("distance-marker").className = "mock";
    }
}

async function getSensorData() {

    if (mockMode) {
        return getMockData();
    }

    const response = await fetch("/data");

    return await response.json();
}
