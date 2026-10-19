Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 10;
Chart.defaults.elements.point.radius = 0;
Chart.defaults.elements.line.borderWidth = 2;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 6;
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
                    borderColor: "#ffab83"
                },
                {
                    label: "Accel Y",
                    data: [],
                    borderColor: "#61dfc3"
                },
                {
                    label: "Accel Z",
                    data: [],
                    borderColor: "#90acff"
                }
            ]
        },

        options: {
            animation: false,
            maintainAspectRatio: false,
            color: "#91a3b9",

            scales: {
                x: {
                    ticks: {
                        color: "#91a3b9"
                    },

                    grid: {
                        color: "#263344"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "#91a3b9",

                        font: {
                            size: 11
                        }
                    }
                },

                y: {
                    ticks: {
                        color: "#91a3b9"
                    },

                    grid: {
                        color: "#263344"
                    },

                    title: {
                        display: true,
                        text: "Acceleration (g)",
                        color: "#91a3b9",

                        font: {
                            size: 11
                        }
                    }
                }
            },

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#91a3b9"
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
                    borderColor: "#ffab83"
                },
                {
                    label: "Gyro Y",
                    data: [],
                    borderColor: "#61dfc3"
                },
                {
                    label: "Gyro Z",
                    data: [],
                    borderColor: "#90acff"
                }
            ]
        },

        options: {
            animation: false,
            maintainAspectRatio: false,
            color: "#91a3b9",

            scales: {
                x: {
                    ticks: {
                        color: "#91a3b9"
                    },

                    grid: {
                        color: "#263344"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "#91a3b9"
                    }
                },

                y: {
                    ticks: {
                        color: "#91a3b9"
                    },

                    grid: {
                        color: "#263344"
                    },

                    title: {
                        display: true,
                        text: "Angular Velocity (deg/s)",
                        color: "#91a3b9"
                    }
                }
            },

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#91a3b9"
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
