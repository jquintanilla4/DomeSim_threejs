import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Create the scene
const scene = new THREE.Scene();

// Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Get the controls container
const controlsContainer = document.getElementById('controls');

// Create minimap overlay (bottom-right) for inside view
const miniRenderer = new THREE.WebGLRenderer({ alpha: true });
miniRenderer.setSize(150, 150);
miniRenderer.setClearColor(0x000000, 0);
miniRenderer.domElement.style.position = 'absolute';
miniRenderer.domElement.style.bottom = '10px';
miniRenderer.domElement.style.right = '10px';
miniRenderer.domElement.style.zIndex = '10';
miniRenderer.domElement.style.border = '2px solid red';
miniRenderer.domElement.style.backgroundColor = 'rgba(255,255,255,0.1)';
document.body.appendChild(miniRenderer.domElement);

const miniScene = new THREE.Scene();
const miniCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
miniScene.add(miniCamera);

// Create a video element
const video = document.createElement('video');
video.src = '/fisheye/shot03_04_v2_fish5.mp4'; // Replace with desired video's file path
video.loop = true;
video.muted = true;
video.play().catch(err => console.warn('Video autoplay prevented', err));

// Create a video texture
const texture = new THREE.VideoTexture(video);
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.format = THREE.RGBFormat;

// Create a sphere geometry for the dome
const geometry = new THREE.SphereGeometry(100, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);

// Adjust UVs for fisheye mapping with a scale factor
const scale = 1.0; // Adjust this value, e.g., 1.5, 2.0, etc., to stretch the texture
const positions = geometry.attributes.position.array;
const uvs = geometry.attributes.uv.array;
const radius = 100;
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i];
  const y = positions[i + 1];
  const z = positions[i + 2];
  const phi = Math.acos(y / radius);
  const theta = Math.atan2(z, x);
  const r = (phi / (Math.PI / 2)) * scale * 0.5; // scale the radius to stretch the texture
  const u = 0.5 + r * Math.cos(theta);
  const v = 0.5 + r * Math.sin(theta);
  uvs[(i / 3) * 2] = u;
  uvs[(i / 3) * 2 + 1] = v;
}

// Add textured dome for outside view in minimap
const miniDome = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide })
);
miniScene.add(miniDome);

// Create a material with the video texture
const material = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.BackSide,
});

// Create the mesh and add it to the scene
const dome = new THREE.Mesh(geometry, material);
scene.add(dome);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 2; // Horizontal
controls.maxPolarAngle = Math.PI;     // Zenith (straight up)

// Set initial target for OrbitControls for the inside view
controls.target.set(0, 0, -1); // Look horizontally initially

// Track current view state early so animate() can read it
let isOutsideView = false;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  // render outside-view minimap when inside
  if (!isOutsideView) {
    const dir = camera.getWorldDirection(new THREE.Vector3());
    miniCamera.position.copy(dir.multiplyScalar(200));
    miniCamera.lookAt(0, 0, 0);
    miniRenderer.domElement.style.display = '';
    miniRenderer.render(miniScene, miniCamera);
  } else {
    miniRenderer.domElement.style.display = 'none';
  }
}
animate();

// Add a play button
const playButton = document.createElement('button');
playButton.textContent = 'Play Video';
controlsContainer.appendChild(playButton);
playButton.addEventListener('click', () => {
  video.play();
});

// Add a pause button
const pauseButton = document.createElement('button');
pauseButton.textContent = 'Pause Video';
controlsContainer.appendChild(pauseButton);
pauseButton.addEventListener('click', () => {
  video.pause();
});

// Add a stop button
const stopButton = document.createElement('button');
stopButton.textContent = 'Stop Video';
controlsContainer.appendChild(stopButton);
stopButton.addEventListener('click', () => {
  video.pause();
  video.currentTime = 0;
});

// Toggle between inside/outside view
const viewToggleButton = document.createElement('button');
viewToggleButton.textContent = 'Outside View';
controlsContainer.appendChild(viewToggleButton);
viewToggleButton.addEventListener('click', () => {
  if (!isOutsideView) {
    // switch to outside
    camera.position.set(0, 0, 200);
    material.side = THREE.FrontSide;
    viewToggleButton.textContent = 'Inside View';
    controls.minPolarAngle = 0;         // Allow full sphere for outside view
    controls.maxPolarAngle = Math.PI;
    isOutsideView = true;
    controls.target.set(0, 0, 0); // Target origin for outside view
    // Hide rotation buttons
    leftButton.style.display = 'none';
    rightButton.style.display = 'none';
    upButton.style.display = 'none';
    downButton.style.display = 'none';
  } else {
    // switch to inside
    camera.position.set(0, 0, 0);
    material.side = THREE.BackSide;
    viewToggleButton.textContent = 'Outside View';
    controls.minPolarAngle = Math.PI / 2; // Horizontal
    controls.maxPolarAngle = Math.PI;     // Zenith
    isOutsideView = false;
    controls.target.set(0, 0, -1); // Target in front for inside view
    // Show rotation buttons
    leftButton.style.display = '';
    rightButton.style.display = '';
    upButton.style.display = '';
    downButton.style.display = '';
  }
  material.needsUpdate = true;
});

// Add rotation buttons for inside view
const leftButton = document.createElement('button');
leftButton.textContent = 'Rotate Left 45°';
controlsContainer.appendChild(leftButton);
leftButton.addEventListener('click', () => {
  if (!isOutsideView) {
    const yAxis = new THREE.Vector3(0, 1, 0);
    // Rotate target to the right around Y axis (view looks left)
    controls.target.applyAxisAngle(yAxis, -Math.PI / 4);
    controls.update();
  }
});

const rightButton = document.createElement('button');
rightButton.textContent = 'Rotate Right 45°';
controlsContainer.appendChild(rightButton);
rightButton.addEventListener('click', () => {
  if (!isOutsideView) {
    const yAxis = new THREE.Vector3(0, 1, 0);
    // Rotate target to the left around Y axis (view looks right)
    controls.target.applyAxisAngle(yAxis, Math.PI / 4);
    controls.update();
  }
});

const upButton = document.createElement('button');
upButton.textContent = 'Rotate Up 45°';
controlsContainer.appendChild(upButton);
upButton.addEventListener('click', () => {
  if (!isOutsideView) {
    const localX = new THREE.Vector3();
    // Get camera's local X (right) vector
    camera.matrixWorld.extractBasis(localX, new THREE.Vector3(), new THREE.Vector3());
    // Rotate target downwards around camera's X axis (view looks up)
    controls.target.applyAxisAngle(localX, -Math.PI / 4);
    controls.update();
  }
});

const downButton = document.createElement('button');
downButton.textContent = 'Rotate Down 45°';
controlsContainer.appendChild(downButton);
downButton.addEventListener('click', () => {
  if (!isOutsideView) {
    const localX = new THREE.Vector3();
    // Get camera's local X (right) vector
    camera.matrixWorld.extractBasis(localX, new THREE.Vector3(), new THREE.Vector3());
    // Rotate target upwards around camera's X axis (view looks down)
    controls.target.applyAxisAngle(localX, Math.PI / 4);
    controls.update();
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
