let startTime = Date.now();

function displayData(data) {

    document.getElementById("distance").innerHTML =
        data.distance.toFixed(0);

    document.getElementById("accelX").innerHTML =
        data.accelX.toFixed(2);

    document.getElementById("accelY").innerHTML =
        data.accelY.toFixed(2);

    document.getElementById("accelZ").innerHTML =
        data.accelZ.toFixed(2);

    document.getElementById("gyroX").innerHTML =
        data.gyroX.toFixed(2);

    document.getElementById("gyroY").innerHTML =
        data.gyroY.toFixed(2);

    document.getElementById("gyroZ").innerHTML =
        data.gyroZ.toFixed(2);

    updateDistanceScale(data.distance);

    let elapsedTime = (Date.now() - startTime) / 1000;

    updateCharts(data, elapsedTime);

    let accelMagnitude = calculateAccelerationMagnitude(data);
    let accelPitch = calculatePitch(data);
    let accelRoll = calculateRoll(data);

    document.getElementById("accelMagnitude").innerHTML = accelMagnitude.toFixed(2);
    document.getElementById("accelPitch").innerHTML = accelPitch.toFixed(2);
    document.getElementById("accelRoll").innerHTML = accelRoll.toFixed(2);

    updateGyroAngles(data);

    document.getElementById("gyroRoll").textContent = (gyroRoll - angleZero.gyroRoll).toFixed(2);
    document.getElementById("gyroPitch").textContent = (gyroPitch - angleZero.gyroPitch).toFixed(2);
    document.getElementById("gyroYaw").textContent = (gyroYaw - angleZero.gyroYaw).toFixed(2);

    updateFusedAngles(data);

    document.getElementById("fusedRoll").textContent = (fusedRoll - angleZero.fusedRoll).toFixed(2);
    document.getElementById("fusedPitch").textContent = (fusedPitch - angleZero.fusedPitch).toFixed(2);

    if (orientationReady) {
        window.update3DOrientation(fusedRoll, fusedPitch, gyroYaw);
    }
}

async function updateLoop() {

    try {
        const data = await getSensorData();
        displayData(data);
    }
    catch (error) {
        console.error("Sensor update failed:", error);
    }
    finally {
        // Keep one request in flight and retry after transient failures.
        setTimeout(updateLoop, 250);
    }
}

let orientationReady = false;

function startOrientation() {
    if (orientationReady) return;
    try {
        window.setup3DScene();
        orientationReady = true;
    }
    catch (error) {
        console.error("3D viewer unavailable:", error);
    }
}

// Telemetry can start even if the external 3D modules load slowly or fail.
async function startDashboard() {
    await detectESP32();
    updateLoop();

    if (typeof window.setup3DScene === "function") {
        startOrientation();
    }
    else {
        window.addEventListener("orientation3d-ready", startOrientation, { once: true });
    }
}

startDashboard();
