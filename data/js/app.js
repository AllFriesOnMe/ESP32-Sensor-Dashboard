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

    document.getElementById("gyroRoll").innerHTML = gyroRoll.toFixed(2);
    document.getElementById("gyroPitch").innerHTML = gyroPitch.toFixed(2);
    document.getElementById("gyroYaw").innerHTML = gyroYaw.toFixed(2);

    updateFusedAngles(data);

    document.getElementById("fusedRoll").innerHTML = fusedRoll.toFixed(2);
    document.getElementById("fusedPitch").innerHTML = fusedPitch.toFixed(2);

    window.update3DOrientation(
        fusedRoll,
        fusedPitch,
        gyroYaw
    );
}

async function updateData() {
    const data = await getSensorData();

    displayData(data);
}

async function startDashboard() {

    window.setup3DScene();

    await detectESP32();

    updateData();

    setInterval(updateData, 250);
}

if (typeof window.setup3DScene === "function") {

    startDashboard();

}
else {

    window.addEventListener(
        "orientation3d-ready",
        startDashboard,
        { once: true }
    );

}
