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

    document.body.addEventListener('click', onTouchStart); // Listen for click event
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

function onTouchStart() {
    if (!sessionInitiated) {
        sessionInitiated = true;
        initXR();
    }
}

function buildARButton() {
    const button = document.createElement('button');
    button.textContent = 'Enter AR';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.zIndex = '100';
    button.addEventListener('click', onTouchStart); // Trigger AR when the button is clicked

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
        const xrHitTestSource = await xrSession.requestHitTestSource({ space: xrReferenceSpace });

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

        // Update cube position based on hit test
        const hitTestResults = xrFrame.getHitTestResults(xrHitTestSource);
        if (hitTestResults.length > 0) {
            const hitPose = hitTestResults[0].getPose(xrReferenceSpace);
            cube.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
        }

        xrSession.requestAnimationFrame(onXRFrame);
    }
}
