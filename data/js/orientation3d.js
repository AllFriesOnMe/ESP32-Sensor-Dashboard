import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene;
let camera;
let renderer;
let board;
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

board = new THREE.Group();
scene.add(board);
const loader = new GLTFLoader();

loader.load(
    "models/MPU6050 v2.glb",

    function (gltf) {
        const model = gltf.scene;

        // Measure the model
        const box = new THREE.Box3().setFromObject(model);

        const size = box.getSize(
            new THREE.Vector3()
        );

        const center = box.getCenter(
            new THREE.Vector3()
        );

        // Scale it to a useful size
        const maxDimension = Math.max(
            size.x,
            size.y,
            size.z
        );

        const scale = 3 / maxDimension;

        model.scale.setScalar(scale);

        // Recalculate bounding box AFTER scaling
        box.setFromObject(model);

        box.getCenter(center);


        // Move model so its CENTER is at 0,0,0
        model.position.sub(center);


        // Put centered model inside the rotating board group
        board.add(model);

        camera.lookAt(0, 0, 0);

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

    const targetEuler = new THREE.Euler(
        THREE.MathUtils.degToRad(pitch),
        THREE.MathUtils.degToRad(yaw),
        THREE.MathUtils.degToRad(roll),
        "XYZ"
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

    renderer.render(scene, camera);
}

window.setup3DScene = setup3DScene;
window.update3DOrientation = update3DOrientation;

window.dispatchEvent(
    new Event("orientation3d-ready")
);
