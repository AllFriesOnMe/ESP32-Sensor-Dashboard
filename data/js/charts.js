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

function updateCharts(data, elapsedTime) {

    accelChart.data.labels.push(elapsedTime.toFixed(1));
    gyroChart.data.labels.push(elapsedTime.toFixed(1));

    accelChart.data.datasets[0].data.push(data.accelX);
    accelChart.data.datasets[1].data.push(data.accelY);
    accelChart.data.datasets[2].data.push(data.accelZ);

    gyroChart.data.datasets[0].data.push(data.gyroX);
    gyroChart.data.datasets[1].data.push(data.gyroY);
    gyroChart.data.datasets[2].data.push(data.gyroZ);

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
}
