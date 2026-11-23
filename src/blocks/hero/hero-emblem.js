// Hero 3D emblem: an opaque glossy logo rotating around the vertical axis on a transparent canvas.
// Separate ES module (projectConfig.json → "moduleJs"), built to build/js/hero-emblem.min.js
// and loaded by hero.js with import(). It is not a part of script.min.js.
// The color comes from the CSS token --hero-emblem, so the emblem follows the theme.

import {
  Box3,
  DirectionalLight,
  Group,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ROTATION_SPEED = 0.6; // radians per second
const FIT = 0.85; // share of the emblem box the front view of the model fills (as in the design)
const DEPTH_SCALE = 1.5; // thickness of the model: 1 = as modelled, 0.5 = half as thick
const MAX_PIXEL_RATIO = 2;

// Narrow lens from far away: little perspective, so the parts turning towards the camera
// do not grow out of the box (with a wide lens close up they were cut off)
const FOV = 15; // degrees
const CAMERA_DISTANCE = 12;

// Material: soft gloss, as the emblem in the design
const ROUGHNESS = 0.35; // 0 = mirror-like highlights, 1 = matte
const SPECULAR = 0.4; // strength of the reflections on the faces: higher washes the color out with grey
const CLEARCOAT = 0.2; // glossy lacquer layer on top: 0 = none
const ENV_INTENSITY = 0.6; // brightness of the soft surrounding light
const KEY_LIGHT_INTENSITY = 2.5; // brightness of the main light from the top left
const KEY_LIGHT_POSITION = [-4, 5, 6]; // x: left, y: up, z: towards the viewer

const COLOR_TOKEN = '--hero-emblem';
const THEME_DELAY = 350; // ms, the theme switch animates the tokens: keep in sync with $transition-time (+ margin)

const READY_CLASS = 'hero__emblem--ready';
const STATIC_CLASS = 'hero__emblem--static'; // keep in sync with hero.js

export async function initEmblem(container, modelUrl) {
  // Created before the model is fetched: if WebGL fails, nothing else is downloaded
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.toneMapping = NeutralToneMapping; // keeps the base color close to the token (ACES greys out white)

  const canvas = renderer.domElement;

  canvas.classList.add('hero__canvas');

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);

  camera.position.set(0, 0, CAMERA_DISTANCE);

  // Main light from the top left, as in the design. It stays put while the emblem turns
  const keyLight = new DirectionalLight(0xffffff, KEY_LIGHT_INTENSITY);

  keyLight.position.set(...KEY_LIGHT_POSITION);
  scene.add(keyLight);

  // Soft studio lighting (built-in environment, no files to download).
  // Set on the material, not on scene.environment: since r163 envMapIntensity works only with the material's own envMap
  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  pmrem.dispose();

  const material = new MeshPhysicalMaterial({
    metalness: 0,
    roughness: ROUGHNESS,
    specularIntensity: SPECULAR,
    clearcoat: CLEARCOAT,
    clearcoatRoughness: ROUGHNESS / 2,
    envMap: envTexture,
    envMapIntensity: ENV_INTENSITY,
  });

  // Reads the color token. The canvas normalizes any CSS color (rgb() with spaces too) to a form Three.js understands
  const probe = document.createElement('canvas').getContext('2d');

  const applyColor = () => {
    probe.fillStyle = '#fff';
    probe.fillStyle = getComputedStyle(container).getPropertyValue(COLOR_TOKEN).trim();
    material.color.setStyle(probe.fillStyle);
  };

  applyColor();

  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) child.material = material;
  });

  // Thinner than modelled: squeeze along Z (the depth axis of the model)
  model.scale.z = DEPTH_SCALE;

  // Center the model and scale it to fill FIT of the visible square.
  // Precise box (by vertices): the model is turned inside the file, and the default box of a turned
  // object is bigger than the logo itself, which made the logo small and off-center
  const box = new Box3().setFromObject(model, true);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const visibleSize = 2 * CAMERA_DISTANCE * Math.tan((FOV * Math.PI) / 360);

  model.position.sub(center);

  // The pivot rotates around Y; the model is centered inside it
  const pivot = new Group();

  pivot.scale.setScalar((visibleSize * FIT) / Math.max(size.x, size.y));
  pivot.add(model);
  scene.add(pivot);

  // ---------- Loop ----------

  let frameId = 0;
  let lastTime = 0;
  let isVisible = true;
  let isLost = false;

  const render = () => renderer.render(scene, camera);

  const tick = (time) => {
    pivot.rotation.y += ((time - lastTime) / 1000) * ROTATION_SPEED;
    lastTime = time;
    render();
    frameId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (frameId || isLost) return;

    lastTime = performance.now(); // the time spent on pause is skipped
    frameId = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const updateLoop = () => {
    if (isVisible && !document.hidden) {
      start();
    } else {
      stop();
    }
  };

  // Keep the canvas size in sync with the emblem box
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;

    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  render();
  container.append(canvas);

  // The first frame is in the canvas: fade it in
  requestAnimationFrame(() => container.classList.add(READY_CLASS));

  new ResizeObserver(() => {
    resize();
    render();
  }).observe(container);

  // Pause when the emblem is off screen or the tab is hidden
  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    updateLoop();
  }).observe(container);

  document.addEventListener('visibilitychange', updateLoop);

  // Theme switch: read the token every frame while the page animates its colors,
  // so the emblem changes together with the page (or at once, if the page switches without animation)
  let themeFrame = 0;

  const followTheme = () => {
    const until = performance.now() + THEME_DELAY;

    const step = (time) => {
      applyColor();

      if (!frameId) render(); // the loop is paused: draw the new color here

      themeFrame = time < until ? requestAnimationFrame(step) : 0;
    };

    cancelAnimationFrame(themeFrame);
    themeFrame = requestAnimationFrame(step);
  };

  new MutationObserver(followTheme)
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // GPU reset or too many contexts: stop and give the place back to the poster
  canvas.addEventListener('webglcontextlost', () => {
    isLost = true;
    stop();
    container.classList.remove(READY_CLASS);
    container.classList.add(STATIC_CLASS);
  });

  updateLoop();
}
