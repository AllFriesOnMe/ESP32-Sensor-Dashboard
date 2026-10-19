let mockMode = false;

let currentScaleMax = 50;

let startTime = Date.now();

let gyroRoll = 0;
let gyroPitch = 0;
let gyroYaw = 0;

let fusedRoll = 0;
let fusedPitch = 0;

let lastFusionTime = Date.now();

let lastGyroTime = Date.now();

let mockRoll = 0;
let mockPitch = 0;
let mockYaw = 0;

let previousMockRoll = 0;
let previousMockPitch = 0;
let previousMockYaw = 0;

let lastMockTime = Date.now();

let mockData = {
    distance: 350,
    accelX: 0.12,
    accelY: -0.05,
    accelZ: 0.98,
    gyroX: 1.2,
    gyroY: -0.7,
    gyroZ: 2.4
};

const accelChart = new Chart(
    document.getElementById("accel-chart"),
    {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: "Accel X",
                    data: [],
                    borderColor: "red"
                },
                {
                    label: "Accel Y",
                    data: [],
                    borderColor: "lime"
                },
                {
                    label: "Accel Z",
                    data: [],
                    borderColor: "cyan"
                }
            ]
        },

        options: {
            animation: false,
            color: "white",

            scales: {
                x: {
                    ticks: {
                        color: "white"
                    },

                    grid: {
                        color: "white"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "white",

                        font: {
                            size: 16
                        }
                    }
                },

                y: {
                    ticks: {
                        color: "white"
                    },

                    grid: {
                        color: "white"
                    },

                    title: {
                        display: true,
                        text: "Acceleration (g)",
                        color: "white",

                        font: {
                            size: 16
                        }
                    }
                }
            },

            plugins: {
                legend: {
                    position: "right",

                    labels: {
                        color: "white"
                    }
                }
            }
        }
    }
);

const gyroChart = new Chart(
    document.getElementById("gyro-chart"),
    {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: "Gyro X",
                    data: [],
                    borderColor: "red"
                },
                {
                    label: "Gyro Y",
                    data: [],
                    borderColor: "lime"
                },
                {
                    label: "Gyro Z",
                    data: [],
                    borderColor: "cyan"
                }
            ]
        },

        options: {
            animation: false,
            color: "white",

            scales: {
                x: {
                    ticks: {
                        color: "white"
                    },

                    grid: {
                        color: "white"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "white"
                    }
                },

                y: {
                    ticks: {
                        color: "white"
                    },

                    grid: {
                        color: "white"
                    },

                    title: {
                        display: true,
                        text: "Angular Velocity (deg/s)",
                        color: "white"
                    }
                }
            },

            plugins: {
                legend: {
                    position: "right",

                    labels: {
                        color: "white"
                    }
                }
            }
        }
    }
);

function updateDistanceScale(distance) {
    const step = 50;

    let desiredScaleMax =
        Math.max(step, Math.ceil(distance / step) * step);

    if (desiredScaleMax > currentScaleMax) {
        currentScaleMax = desiredScaleMax;
    }

    else if (
        desiredScaleMax < currentScaleMax &&
        distance < desiredScaleMax - 20
    ) {
        currentScaleMax = desiredScaleMax;
    }

    let scaleMax = currentScaleMax;

    const labels =
        document.getElementById("scale-labels");

    labels.innerHTML = "";

    for (let value = 0; value <= scaleMax; value += step) {

        const label = document.createElement("span");

        label.innerHTML = value;

        let labelPercent = value / scaleMax * 100;

        label.style.left = labelPercent + "%";

        labels.appendChild(label);
    }

    let markerPercent =
        distance / scaleMax * 100;

    markerPercent =
        Math.max(0, Math.min(100, markerPercent));

    document.getElementById("distance-marker").style.left =
        markerPercent + "%";
}

function getMockData() {

    if (mockData.distance > 450) {
        mockData.distance += Math.random() * 15 - 12;
    }
    else if (mockData.distance < 250) {
        mockData.distance += Math.random() * 15 - 3;
    }
    else {
        mockData.distance += Math.random() * 20 - 10;
    }

    updateMockOrientation();

    const currentTime = Date.now();

    const dt =
        (currentTime - lastMockTime) / 1000;

    lastMockTime = currentTime;

    if (dt > 0) {

        mockData.gyroX =
            (mockRoll - previousMockRoll) / dt;

        mockData.gyroY =
            (mockPitch - previousMockPitch) / dt;

        mockData.gyroZ =
            (mockYaw - previousMockYaw) / dt;
    }

    const rollRad =
        mockRoll * Math.PI / 180;

    const pitchRad =
        mockPitch * Math.PI / 180;

    mockData.accelX =
        -Math.sin(pitchRad);

    mockData.accelY =
        Math.sin(rollRad) * Math.cos(pitchRad);

    mockData.accelZ =
        Math.cos(rollRad) * Math.cos(pitchRad);


    return mockData;
}

function updateMockOrientation() {

    const time = (Date.now() - startTime) / 1000;

    previousMockRoll = mockRoll;
    previousMockPitch = mockPitch;
    previousMockYaw = mockYaw;

    mockRoll =
        20 * Math.sin(time * 0.7);

    mockPitch =
        12 * Math.sin(time * 0.4);

    mockYaw =
        30 * Math.sin(time * 0.2);
}

function calculateAccelerationMagnitude(data) {
    let magnitude = Math.sqrt(
        data.accelX ** 2 + data.accelY ** 2 + data.accelZ ** 2
    );

    return magnitude;
}

function calculateRoll(data) {
    let roll = Math.atan2(
        data.accelY,
        data.accelZ
    );

    return roll * 180 / Math.PI;
}

function calculatePitch(data) {
    let pitch = Math.atan2(-data.accelX, Math.sqrt(
        data.accelY ** 2 + data.accelZ ** 2
    ));

    return pitch * 180 / Math.PI;
}

function updateGyroAngles(data) {
    let currentTime = Date.now();

    let dt = (currentTime - lastGyroTime) / 1000;

    lastGyroTime = currentTime;

    gyroRoll += data.gyroX * dt;
    gyroPitch += data.gyroY * dt;
    gyroYaw += data.gyroZ * dt;
}

function updateFusedAngles(data) {

    const currentTime = Date.now();

    const dt =
        (currentTime - lastFusionTime) / 1000;

    lastFusionTime = currentTime;

    const accelRoll = calculateRoll(data);
    const accelPitch = calculatePitch(data);

    fusedRoll =
        0.98 * (fusedRoll + data.gyroX * dt)
        + 0.02 * accelRoll;

    fusedPitch =
        0.98 * (fusedPitch + data.gyroY * dt)
        + 0.02 * accelPitch;
}

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

    accelChart.data.labels.push(elapsedTime.toFixed(1));
    gyroChart.data.labels.push(elapsedTime.toFixed(1));

    gyroChart.data.datasets[0].data.push(data.gyroX);
    gyroChart.data.datasets[1].data.push(data.gyroY);
    gyroChart.data.datasets[2].data.push(data.gyroZ);

    accelChart.data.datasets[0].data.push(data.accelX);
    accelChart.data.datasets[1].data.push(data.accelY);
    accelChart.data.datasets[2].data.push(data.accelZ);

    if (accelChart.data.labels.length > 20) {
        accelChart.data.labels.shift();
        accelChart.data.datasets[0].data.shift();
        accelChart.data.datasets[1].data.shift();
        accelChart.data.datasets[2].data.shift();
        
        gyroChart.data.labels.shift();
        gyroChart.data.datasets[0].data.shift();
        gyroChart.data.datasets[1].data.shift();
        gyroChart.data.datasets[2].data.shift();
    }

    accelChart.update();
    gyroChart.update();

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

    update3DOrientation(
        fusedRoll,
        fusedPitch,
        gyroYaw
    );
}

async function updateData() {

    let data;

    if (mockMode) {
        data = getMockData();
    }

    else {
        const response = await fetch("/data");
        data = await response.json();
    }

    displayData(data);
}

async function startDashboard() {

    setup3DScene();

    await detectESP32();

    updateData();

    setInterval(updateData, 250);
}

startDashboard();