let mockMode = false;

let currentScaleMax = 50;

let startTime = Date.now();

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
                },
            }
        },

        plugins: {
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
        // Mostly move downward
        mockData.distance += Math.random() * 15 - 12;
    }
    else if (mockData.distance < 250) {
        // Mostly move upward
        mockData.distance += Math.random() * 15 - 3;
    }
    else {
        // Normal random movement
        mockData.distance += Math.random() * 20 - 10;
    }

    if (mockData.accelX > 0.15) {
        mockData.accelX += Math.random() * 0.035 - 0.03;
    }
    else if (mockData.accelX < -0.15) {
        mockData.accelX += Math.random() * 0.035 - 0.005;
    }
    else {
        mockData.accelX += Math.random() * 0.04 - 0.02;
    }

    if (mockData.accelY > 0.15) {
        mockData.accelY += Math.random() * 0.035 - 0.03;
    }
    else if (mockData.accelY < -0.15) {
        mockData.accelY += Math.random() * 0.035 - 0.005;
    }
    else {
        mockData.accelY += Math.random() * 0.04 - 0.02;
    }

    if (mockData.accelZ > 1.05) {
        mockData.accelZ += Math.random() * 0.02 - 0.018;
    }
    else if (mockData.accelZ < 0.95) {
        mockData.accelZ += Math.random() * 0.02 - 0.002;
    }
    else {
        mockData.accelZ += Math.random() * 0.02 - 0.01;
    }

    if (mockData.gyroX > 3) {
        mockData.gyroX += Math.random() * 0.6 - 0.5;
    }
    else if (mockData.gyroX < -3) {
        mockData.gyroX += Math.random() * 0.6 - 0.1;
    }
    else {
        mockData.gyroX += Math.random() * 0.5 - 0.25;
    }

    if (mockData.gyroY > 3) {
        mockData.gyroY += Math.random() * 0.6 - 0.5;
    }
    else if (mockData.gyroY < -3) {
        mockData.gyroY += Math.random() * 0.6 - 0.1;
    }
    else {
        mockData.gyroY += Math.random() * 0.5 - 0.25;
    }

    if (mockData.gyroZ > 3) {
        mockData.gyroZ += Math.random() * 0.6 - 0.5;
    }
    else if (mockData.gyroZ < -3) {
        mockData.gyroZ += Math.random() * 0.6 - 0.1;
    }
    else {
        mockData.gyroZ += Math.random() * 0.5 - 0.25;
    }


    return mockData;
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
    accelChart.data.datasets[0].data.push(data.accelX);
    accelChart.data.datasets[1].data.push(data.accelY);
    accelChart.data.datasets[2].data.push(data.accelZ);

    if (accelChart.data.labels.length > 40) {
        accelChart.data.labels.shift();
        accelChart.data.datasets[0].data.shift();
        accelChart.data.datasets[1].data.shift();
        accelChart.data.datasets[2].data.shift();
    }

    accelChart.update();
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

    await detectESP32();

    updateData();

    setInterval(updateData, 250);
}

startDashboard();