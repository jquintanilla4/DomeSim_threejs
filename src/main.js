import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Get references to the dynamic control elements
const videoUrlInput = document.getElementById('videoUrlInput');
const scaleInput = document.getElementById('scaleInput');
const updateSettingsButton = document.getElementById('updateSettingsButton');
let currentScale = 1.0; // Default scale, will be updated from input
let initialUvsSet = false; // Flag to ensure UVs are set at least once

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
miniRenderer.setClearColor(0x000000, 1); // Set alpha to 1 for opaque black background
miniRenderer.domElement.style.position = 'absolute';
miniRenderer.domElement.style.bottom = '10px';
miniRenderer.domElement.style.right = '10px';
miniRenderer.domElement.style.zIndex = '10';
miniRenderer.domElement.style.border = '2px solid darkgrey';
miniRenderer.domElement.style.backgroundColor = 'rgba(255,255,255,0.1)';
document.body.appendChild(miniRenderer.domElement);

const miniScene = new THREE.Scene();
const miniCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
miniScene.add(miniCamera);

// Create a video element
const video = document.createElement('video');
video.loop = true;
video.muted = true; // Important for autoplay policies

// Create a video texture
const texture = new THREE.VideoTexture(video);
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.format = THREE.RGBFormat;

// Create a sphere geometry for the dome
const geometry = new THREE.SphereGeometry(100, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);

// Function to update UV scaling
function updateUVScaling(newScaleValue) {
  currentScale = newScaleValue;
  const positions = geometry.attributes.position.array;
  const uvs = geometry.attributes.uv.array;
  const radius = 100;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const phi = Math.acos(y / radius);
    const theta = Math.atan2(z, x);
    const r = (phi / (Math.PI / 2)) * currentScale * 0.5;
    const u = 0.5 + r * Math.cos(theta);
    const v = 0.5 + r * Math.sin(theta);
    uvs[(i / 3) * 2] = u;
    uvs[(i / 3) * 2 + 1] = v;
  }
  geometry.attributes.uv.needsUpdate = true;
  initialUvsSet = true;
  console.log('UVs updated with scale:', currentScale);
}

// Function to update video source and scale from input fields
function updateVideoAndScale() {
  let scaleToApply = currentScale;

  if (scaleInput) {
    if (scaleInput.value.trim() !== "") {
      const parsedScale = parseFloat(scaleInput.value);
      if (!isNaN(parsedScale) && parsedScale > 0) {
        scaleToApply = parsedScale;
      } else {
        console.warn(`Invalid scale value: "${scaleInput.value}". Using previous/default scale: ${currentScale}.`);
        scaleInput.value = currentScale;
        scaleToApply = currentScale;
      }
    } else {
      console.warn(`Scale input is empty. Using previous/default scale: ${currentScale}.`);
      scaleInput.value = currentScale;
    }
  } else {
    console.warn("Scale input element not found. Using default scale:", currentScale);
  }

  if (currentScale !== scaleToApply || !initialUvsSet) {
    updateUVScaling(scaleToApply);
  }

  if (videoUrlInput) {
    const newVideoUrl = videoUrlInput.value.trim();
    if (newVideoUrl) {
      const absoluteNewVideoUrl = new URL(newVideoUrl, document.baseURI).href;
      if (video.currentSrc !== absoluteNewVideoUrl) {
        console.log('Attempting to update video source to:', newVideoUrl);
        video.src = newVideoUrl;
        video.load();
        video.play().catch(err => console.warn('Video autoplay prevented for new source:', err));
      }
    } else if (video.src && video.currentSrc !== "") {
      console.log("Video URL input cleared. Current video source remains:", video.src);
    }
  } else {
    console.warn("Video URL input element not found.");
  }
}

// Add event listener for the update button
if (updateSettingsButton) {
  updateSettingsButton.addEventListener('click', updateVideoAndScale);
} else {
  console.error("Update settings button not found.");
}

// Initial call to set video source, scale, and calculate UVs
updateVideoAndScale();

// If after the first attempt, the video source is still not set (e.g., input was empty)
// default video will be played from placeholder
if (!video.currentSrc && videoUrlInput && videoUrlInput.placeholder && videoUrlInput.placeholder.trim() !== "") {
  console.log('No video URL provided, attempting to load from placeholder:', videoUrlInput.placeholder);
  videoUrlInput.value = videoUrlInput.placeholder;
  updateVideoAndScale();
} else if (!video.currentSrc) {
  console.log('No video URL provided and no placeholder found.');
}

// Create miniDome for the minimap, add to miniScene
const miniDomeMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  side: THREE.BackSide, // For inside view
});
const miniDome = new THREE.Mesh(geometry, miniDomeMaterial); // Use the same geometry
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

// Initial camera setup (defaults to inside view)
controls.target.set(0, 0, -1);      // Target along -Z to look "forward"
controls.minPolarAngle = 0;           // Allow looking fully up (target.y can be positive)
controls.maxPolarAngle = Math.PI;     // Allow looking fully down (target.y can be negative)
controls.update(); // Ensure one update if not already present from other initializations

// If starting in inside view, rotate dome to bring zenith to front
let isOutsideView = false;
if (!isOutsideView) {
  dome.rotation.x = -Math.PI / 2; // Rotate dome -90 deg around X-axis
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  // render minimap when main view is inside
  if (!isOutsideView) {
    miniDome.rotation.x = dome.rotation.x; // Sync miniDome rotation

    // Get main camera's orientation for the minimap
    const mainCamDir = new THREE.Vector3();
    camera.getWorldDirection(mainCamDir); // Direction main camera is looking

    const mainCamUp = new THREE.Vector3(0, 1, 0); // Standard Y up for camera space
    mainCamUp.applyQuaternion(camera.quaternion); // Transform to main camera's current world up

    // Position miniCamera outside the miniDome, looking at its center.
    // The position is opposite to where the main camera is looking, creating an orbital view.
    const miniCamDistance = 150; // Distance from center. miniDome radius is 100.
    miniCamera.position.copy(mainCamDir).multiplyScalar(-miniCamDistance);

    // Set miniCamera's up vector to match main camera's up before calling lookAt
    miniCamera.up.copy(mainCamUp);

    // Make miniCamera look at the center of the miniDome (which is at 0,0,0)
    miniCamera.lookAt(miniDome.position);

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
    const distance = 200; // distance from center
    const angleUp = 90 * Math.PI / 180; // 90 degrees in radians
    camera.position.set(0, distance * Math.sin(angleUp), -distance * Math.cos(angleUp)); // 90 degrees up, 180 degree cw
    material.side = THREE.FrontSide;
    texture.wrapS = THREE.RepeatWrapping; // Add this for horizontal flip
    texture.repeat.x = -1;             // Add this to flip texture horizontally
    viewToggleButton.textContent = 'Inside View';
    controls.target.set(0, 0, 0); // Target origin for outside view
    controls.minPolarAngle = 0;         // Nadir (consistent with user's 'perfect' outside view)
    controls.maxPolarAngle = Math.PI;   // Zenith (consistent with user's 'perfect' outside view)
    dome.rotation.x = 0; // Reset dome rotation
    isOutsideView = true;
    // Hide rotation buttons
    leftButton.style.display = 'none';
    rightButton.style.display = 'none';
    upButton.style.display = 'none';
    downButton.style.display = 'none';
  } else {
    // switch to inside
    camera.position.set(0, 0, 0);
    material.side = THREE.BackSide;
    texture.wrapS = THREE.ClampToEdgeWrapping; // Reset to default
    texture.repeat.x = 1;                      // Reset to normal
    viewToggleButton.textContent = 'Outside View';
    controls.target.set(0, 0, -1);      // Target along -Z to look "forward"
    controls.minPolarAngle = 0;           // Allow looking fully up
    controls.maxPolarAngle = Math.PI;     // Allow looking fully down
    dome.rotation.x = -Math.PI / 2; // Rotate dome -90 deg around X-axis
    isOutsideView = false;
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
