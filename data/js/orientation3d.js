let scene;
let camera;
let renderer;
let board;


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
        antialias: true
    });

    renderer.setSize(
        orientationContainer.clientWidth,
        orientationContainer.clientHeight
    );

    orientationContainer.appendChild(
        renderer.domElement
    );

    const boardGeometry =
        new THREE.BoxGeometry(3, 0.25, 2);

    const boardMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x1565c0
        });

    board = new THREE.Mesh(
        boardGeometry,
        boardMaterial
    );

    scene.add(board);

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
        resize3DScene()
    );
}

function update3DOrientation() {
    board.rotation.x = THREE.MathUtils.degToRad(fusedPitch);

    board.rotation.z = THREE.MathUtils.degToRad(fusedRoll);

    board.rotation.y = THREE.MathUtils.degToRad(gyroYaw);

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
