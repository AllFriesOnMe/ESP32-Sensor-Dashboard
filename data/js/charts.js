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
                    borderColor: "#356c63"
                },
                {
                    label: "Accel Y",
                    data: [],
                    borderColor: "#98543d"
                },
                {
                    label: "Accel Z",
                    data: [],
                    borderColor: "#746091"
                }
            ]
        },

        options: {
            animation: false,
            maintainAspectRatio: false,
            color: "#686d63",

            scales: {
                x: {
                    ticks: {
                        color: "#686d63"
                    },

                    grid: {
                        color: "#343a3514"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "#686d63",

                        font: {
                            size: 11
                        }
                    }
                },

                y: {
                    ticks: {
                        color: "#686d63"
                    },

                    grid: {
                        color: "#343a3514"
                    },

                    title: {
                        display: true,
                        text: "Acceleration (g)",
                        color: "#686d63",

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
                        color: "#686d63"
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
                    borderColor: "#356c63"
                },
                {
                    label: "Gyro Y",
                    data: [],
                    borderColor: "#98543d"
                },
                {
                    label: "Gyro Z",
                    data: [],
                    borderColor: "#746091"
                }
            ]
        },

        options: {
            animation: false,
            maintainAspectRatio: false,
            color: "#686d63",

            scales: {
                x: {
                    ticks: {
                        color: "#686d63"
                    },

                    grid: {
                        color: "#343a3514"
                    },

                    title: {
                        display: true,
                        text: "Time (s)",
                        color: "#686d63"
                    }
                },

                y: {
                    ticks: {
                        color: "#686d63"
                    },

                    grid: {
                        color: "#343a3514"
                    },

                    title: {
                        display: true,
                        text: "Angular Velocity (deg/s)",
                        color: "#686d63"
                    }
                }
            },

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#686d63"
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
