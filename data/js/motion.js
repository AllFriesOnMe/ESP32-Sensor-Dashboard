let gyroRoll = 0;
let gyroPitch = 0;
let gyroYaw = 0;

let fusedRoll = 0;
let fusedPitch = 0;

let lastFusionTime = Date.now();

let lastGyroTime = Date.now();

const angleZero = {
    gyroRoll: 0,
    gyroPitch: 0,
    gyroYaw: 0,
    fusedRoll: 0,
    fusedPitch: 0
};

window.addEventListener("reset-motion-values", () => {
    Object.assign(angleZero, {
        gyroRoll, gyroPitch, gyroYaw, fusedRoll, fusedPitch
    });

    for (const id of Object.keys(angleZero)) {
        document.getElementById(id).textContent = "0.00";
    }
});

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
