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
