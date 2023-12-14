import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let camera, scene, renderer, cube, controller;

init();
animate();

function init() {
    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    camera.position.z = 1;

    // Scene
    scene = new THREE.Scene();

    // Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // XR Controller
    controller = renderer.xr.getController(0);
    scene.add(controller);

    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);

    document.body.appendChild(buildARButton());
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

function onSelectStart() {
    const cubeColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    cube.material.color.copy(cubeColor);
}

function onSelectEnd() {
    // Handle selection end if needed
}

function buildARButton() {
    const button = document.createElement('button');
    button.textContent = 'Enter AR';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.zIndex = '100';
    button.addEventListener('click', () => {
        if (sessionInitiated) return;
        sessionInitiated = true;
        initXR();
    });

    return button;
}

let sessionInitiated = false;
let xrSession;

async function initXR() {
    if ('xr' in navigator) {
        xrSession = await navigator.xr.requestSession('immersive-ar', {
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });

        xrSession.addEventListener('end', onXRSessionEnd);

        const xrReferenceSpace = await xrSession.requestReferenceSpace('local');

        const xrFrameOfRef = await xrSession.requestAnimationFrame(onXRFrame);

        const xrLayer = new XRWebGLLayer(xrSession, renderer);

        xrSession.updateRenderState({ baseLayer: xrLayer });
        xrSession.requestAnimationFrame(onXRFrame);

        document.body.removeChild(arButton); // Remove the button after entering AR
    }
}

function onXRSessionEnd() {
    sessionInitiated = false;
    // Handle session end if needed
}

function onXRFrame(time, xrFrame) {
    const pose = xrFrame.getViewerPose(xrReferenceSpace);

    if (pose) {
        const view = pose.views[0];
        const viewport = xrLayer.getViewport(view);
        renderer.setSize(viewport.width, viewport.height);
        xrSession.requestAnimationFrame(onXRFrame);
    }
}
