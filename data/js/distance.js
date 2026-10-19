let currentScaleMax = 50;

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