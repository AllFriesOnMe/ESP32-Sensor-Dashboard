import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene;
let camera;
let renderer;
let board;
let modelRadius = 1.5;
let cameraDistance = 5;
let cameraAzimuth = 0;
let cameraElevation = 0;
let targetQuaternion = new THREE.Quaternion();

function setup3DScene() {

    const orientationContainer = document.getElementById("orientation-container");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        45,
        orientationContainer.clientWidth /
            orientationContainer.clientHeight,
        0.1,
        100
    );

    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setSize(
        orientationContainer.clientWidth,
        orientationContainer.clientHeight
    );

    orientationContainer.appendChild(
        renderer.domElement
    );
    setupCameraDrag(renderer.domElement);

    board = new THREE.Group();
    scene.add(board);
    const loader = new GLTFLoader();

    loader.load(
        "models/MPU6050-v2.glb",
        function (gltf) {
            // Center a wrapper so the model's authored transforms stay intact.
            const centeredModel = new THREE.Group();
            centeredModel.add(gltf.scene);
            const box = new THREE.Box3().setFromObject(centeredModel);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.sub(center);

            const size = box.getSize(new THREE.Vector3());
            const scale = 3 / Math.max(size.x, size.y, size.z);
            centeredModel.scale.setScalar(scale);
            modelRadius = size.length() * scale / 2;
            board.add(centeredModel);
            fitCameraToModel();

            console.log("MPU6050 model loaded");
        },
        undefined,
        function (error) {
            console.error("Error loading MPU6050 model:", error);
        }
    );

    const ambientLight =
        new THREE.AmbientLight(0xffffff, 1.5);

    scene.add(ambientLight);

    const directionalLight =
        new THREE.DirectionalLight(0xffffff, 2);

    directionalLight.position.set(3, 4, 5);

    scene.add(directionalLight);

    renderer.render(scene, camera);

    window.addEventListener(
        "resize",
        resize3DScene
    );

    animate3D();
}

function update3DOrientation(roll, pitch, yaw) {

    // The model lies in X/Z, with Y normal to the PCB. Map sensor
    // X/Y/Z to model X/Z/-Y: roll about X, pitch about Z, yaw about -Y.
    // YZX preserves the sensor's yaw-pitch-roll composition order.
    const targetEuler = new THREE.Euler(
        THREE.MathUtils.degToRad(roll),
        THREE.MathUtils.degToRad(-yaw),
        THREE.MathUtils.degToRad(pitch),
        "YZX"
    );

    targetQuaternion.setFromEuler(targetEuler);
}

function animate3D() {

    requestAnimationFrame(animate3D);

    if (board) {
        board.quaternion.slerp(
            targetQuaternion,
            0.025
        );
    }

    renderer.render(scene, camera);
}

function resize3DScene() {

    const orientationContainer =
        document.getElementById("orientation-container");

    const width =
        orientationContainer.clientWidth;

    const height =
        orientationContainer.clientHeight;

    renderer.setSize(width, height);

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();
    fitCameraToModel();

    renderer.render(scene, camera);
}

function fitCameraToModel() {
    // Keep the whole rotating board framed even in a narrow viewport.
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    cameraDistance = modelRadius / Math.sin(limitingFov / 2) * 1.15;
    updateCameraPosition();
}

function updateCameraPosition() {
    const horizontalDistance = cameraDistance * Math.cos(cameraElevation);
    camera.position.set(
        horizontalDistance * Math.sin(cameraAzimuth),
        cameraDistance * Math.sin(cameraElevation),
        horizontalDistance * Math.cos(cameraAzimuth)
    );
    camera.lookAt(0, 0, 0);
}

function setupCameraDrag(canvas) {
    let activePointer = null;
    let lastX = 0;
    let lastY = 0;
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.title = "Hold and drag to rotate the view; drag up to raise the camera";

    canvas.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 || activePointer !== null) return;
        canvas.setPointerCapture(event.pointerId);
        activePointer = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.style.cursor = "grabbing";
        event.preventDefault();
    });

    canvas.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointer) return;
        const sensitivity = Math.PI / Math.max(canvas.clientHeight, 1);
        cameraAzimuth -= (event.clientX - lastX) * sensitivity;
        // Stop short of the poles so the camera never flips upside down.
        cameraElevation = THREE.MathUtils.clamp(
            cameraElevation - (event.clientY - lastY) * sensitivity,
            -Math.PI / 2 + 0.05,
            Math.PI / 2 - 0.05
        );
        lastX = event.clientX;
        lastY = event.clientY;
        updateCameraPosition();
    });

    function stopDragging(event) {
        if (event.pointerId !== activePointer) return;
        activePointer = null;
        canvas.style.cursor = "grab";
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    }

    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("lostpointercapture", stopDragging);
}

window.setup3DScene = setup3DScene;
window.update3DOrientation = update3DOrientation;

window.dispatchEvent(
    new Event("orientation3d-ready")
);
