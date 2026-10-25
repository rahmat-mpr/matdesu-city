import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { islands, KIT_SCALE } from '../data/islands.js';
import { createAmbient } from './ambient.js';
import { createQuest, createPlayOverlay, createCardUI } from './ui.js';

// ---------- constants ----------
const SEA_Y = -1.8;
const TILT = THREE.MathUtils.degToRad(40); // polar angle from straight down (camera looks down ~50 degrees)
const HOME_DIST = 52; // resting zoom distance over the hub
const MAP_LIMIT = { x: 38, z: 38 }; // pan clamp for the controls target
const FOCUS_DIST = 24; // zoom distance when framing an island
const HORIZON = '#cdefff';
const HOME_TARGET = new THREE.Vector3(0, 0, -4); // rest view, nudged north so the featured island is in frame

const $ = (id) => document.getElementById(id);
const hotspotLayer = $('hotspots');
const card = $('card');

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
$('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = makeSkyTexture();
scene.fog = new THREE.Fog(HORIZON, 110, 260);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 600);
const viewDir = new THREE.Vector3(0, Math.cos(TILT), Math.sin(TILT)); // from target towards camera
camera.position.copy(viewDir).multiplyScalar(HOME_DIST * Math.max(1, 0.9 / camera.aspect) * 1.6).add(HOME_TARGET);

const controls = new MapControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableRotate = false;
controls.minPolarAngle = controls.maxPolarAngle = TILT;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 14;
// portrait screens see less map horizontally, so pull the camera back
const portraitFit = () => Math.max(1, 0.9 / camera.aspect);
const applyFit = () => {
  const f = portraitFit();
  controls.maxDistance = 75 * f;
  scene.fog.near = 110 * f;
  scene.fog.far = 260 * f;
};
applyFit();
controls.zoomToCursor = true;
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();

// global handle for console debugging
window.app = { scene, camera, controls, renderer };

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0x8fc5d6, 2.2));
const sun = new THREE.DirectionalLight(0xfff4dd, 2.4);
sun.position.set(-30, 50, 25);
scene.add(sun);

// ---------- sea ----------
const seaMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uCam: { value: camera.position },
    uDeep: { value: new THREE.Color('#2fc4d4') },
    uShallow: { value: new THREE.Color('#58dbe0') },
    uFog: { value: new THREE.Color(HORIZON) },
  },
  vertexShader: `
    varying vec3 vW;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: `
    varying vec3 vW;
    uniform float uTime;
    uniform vec3 uCam, uDeep, uShallow, uFog;
    void main() {
      vec2 p = vW.xz;
      float w = sin(p.x * 0.35 + uTime * 0.6) + sin(p.y * 0.45 - uTime * 0.5) + sin((p.x + p.y) * 0.22 + uTime * 0.4);
      float l = sin(p.x * 0.9 + sin(p.y * 0.7 + uTime) * 1.5 + uTime * 0.8) * sin(p.y * 0.8 + sin(p.x * 0.6 - uTime * 0.7) * 1.5);
      vec3 c = mix(uDeep, uShallow, 0.5 + w * 0.12);
      c += smoothstep(0.8, 1.0, l) * 0.12;
      float f = smoothstep(90.0, 260.0, distance(vW, uCam));
      gl_FragColor = vec4(mix(c, uFog, f), 1.0);
      #include <colorspace_fragment>
    }`,
});
const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), seaMaterial);
sea.rotation.x = -Math.PI / 2;
sea.position.y = SEA_Y;
scene.add(sea);

// ---------- clouds ----------
const clouds = new THREE.Group();
{
  const geo = new THREE.SphereGeometry(1, 10, 8);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9ab8c8 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + (i % 3) * 0.2;
    const r = 58 + (i % 4) * 7;
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(geo, mat);
      const s = 3 + ((i * 7 + j * 5) % 4) * 0.8;
      puff.scale.set(s * 1.3, s * 0.8, s);
      puff.position.set((j - 1.5) * 3.4, (j % 2) * 0.8, ((j * 3 + i) % 3) - 1);
      cloud.add(puff);
    }
    cloud.position.set(Math.cos(a) * r, 7 + (i % 3) * 2.5, Math.sin(a) * r);
    cloud.rotation.y = -a;
    clouds.add(cloud);
  }
}
scene.add(clouds);

// ---------- islands ----------
const pickMeshes = [];
const islandRoots = new Map(); // id -> THREE.Group (island-local coordinate space)

function blob(a, seed) {
  return 1 + 0.06 * Math.sin(2 * a + seed) + 0.04 * Math.sin(3 * a + seed * 2) + 0.03 * Math.sin(5 * a + seed * 3);
}

// Cylinder (unit radius) whose outline is warped into an irregular blob of the given radius.
function blobCylinder(height, radius, seed, bottomScale = 1) {
  const g = new THREE.CylinderGeometry(1, bottomScale, height, 48, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const f = blob(Math.atan2(z, x), seed) * radius;
    p.setX(i, x * f);
    p.setZ(i, z * f);
  }
  g.computeVertexNormals();
  return g;
}

function buildIsland(isl) {
  const [px, pz] = isl.position;
  const R = isl.radius;
  const root = new THREE.Group();
  root.position.set(px, 0, pz);

  const parts = [
    // grass top (surface at y = 0)
    [blobCylinder(0.5, R, isl.seed), isl.theme.grass, -0.25],
    // sand ring
    [blobCylinder(0.57, R + 1.1, isl.seed), isl.theme.sand, -0.415],
    // earth underside
    [blobCylinder(2.6, R + 1.1, isl.seed, 0.35), '#8a5a3c', -2.0],
  ];
  for (const [geo, color, y] of parts) {
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
    mesh.position.y = y;
    mesh.userData.islandId = isl.id;
    root.add(mesh);
    pickMeshes.push(mesh);
  }
  // shallow water halo around the island
  const halo = new THREE.Mesh(
    blobCylinder(0.02, R + 3.4, isl.seed),
    new THREE.MeshBasicMaterial({ color: '#9af2f0', transparent: true, opacity: 0.5, depthWrite: false })
  );
  halo.position.y = SEA_Y + 0.05;
  halo.name = 'halo'; // pulsed by ambient.js
  root.add(halo);

  scene.add(root);
  islandRoots.set(isl.id, root);
}

// simple wooden bridges from the hub (first island) to every other island
function buildBridges() {
  const hub = islands[0];
  const deckMat = new THREE.MeshLambertMaterial({ color: '#c28d55' });
  const railMat = new THREE.MeshLambertMaterial({ color: '#8f5f35' });
  for (const isl of islands.slice(1)) {
    const [x, z] = isl.position;
    const dist = Math.hypot(x, z);
    const start = hub.radius - 0.3;
    const end = dist - isl.radius + 0.3;
    const len = end - start;
    const bridge = new THREE.Group();
    bridge.position.set((x / dist) * (start + len / 2), 0.05, (z / dist) * (start + len / 2));
    bridge.rotation.y = Math.atan2(x, z);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, len), deckMat);
    bridge.add(deck);
    for (const side of [-0.85, 0.85]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, len), railMat);
      rail.position.set(side, 0.24, 0);
      bridge.add(rail);
    }
    scene.add(bridge);
  }
}

islands.forEach(buildIsland);
buildBridges();

// ---------- models ----------
const loader = new GLTFLoader();
const ambient = createAmbient({ scene, camera, islands, islandRoots, loader, seaY: SEA_Y }); // wind, leaves, people, dolphins, birds
const templates = new Map(); // 'kit/name' -> scaled, centred, grounded template
const lambertCache = new Map();

function toLambert(src) {
  let m = lambertCache.get(src.uuid);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color: src.color,
      map: src.map,
      transparent: src.transparent,
      opacity: src.opacity,
      side: src.side,
    });
    lambertCache.set(src.uuid, m);
  }
  return m;
}

function loadModel(key) {
  return new Promise((resolve) => {
    loader.load(
      `assets/models/${key}.glb`,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((o) => {
          if (o.isMesh) o.material = toLambert(o.material);
        });
        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3());
        model.position.set(-c.x, -box.min.y, -c.z); // centre on x/z, sit on y = 0
        const wrap = new THREE.Group();
        wrap.add(model);
        templates.set(key, wrap);
        resolve();
      },
      undefined,
      (err) => {
        console.warn('Could not load model', key, err);
        resolve();
      }
    );
  });
}

function placeModels() {
  for (const isl of islands) {
    const root = islandRoots.get(isl.id);
    for (const p of isl.models) {
      const tpl = templates.get(p.m);
      if (!tpl) continue;
      const obj = tpl.clone();
      obj.scale.setScalar(KIT_SCALE[p.m.split('/')[0]] * (p.s ?? 1));
      obj.position.set(p.x, p.y ?? 0, p.z);
      obj.rotation.y = THREE.MathUtils.degToRad(p.r ?? 0);
      root.add(obj);
      ambient.addProp(obj, p, isl);
    }
  }
}

{
  const keys = [...new Set(islands.flatMap((i) => i.models.map((p) => p.m)))];
  let done = 0;
  const loadingEl = $('loading');
  Promise.all(
    keys.map((k) =>
      loadModel(k).then(() => {
        loadingEl.textContent = `Loading models… ${Math.round((++done / keys.length) * 100)}%`;
      })
    )
  ).then(() => {
    placeModels();
    loadingEl.classList.add('done');
    setTimeout(() => loadingEl.remove(), 600);
  });
}

// ---------- quest, card UI, play overlay ----------
const quest = createQuest(islands.map((i) => i.id));
const questCount = $('quest-count');
const toast = $('toast');
let toastTimer = 0;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
const updateQuestHud = () => {
  questCount.textContent = `${quest.count()}/${quest.total}`;
  $('quest-pill').title = `${quest.count()} of ${quest.total} islands visited`;
};
updateQuestHud();
$('quest-pill').addEventListener('click', () => {
  const left = islands.filter((i) => !quest.has(i.id)).map((i) => i.name);
  showToast(
    left.length
      ? `${quest.count()}/${quest.total} islands visited. Still to visit: ${left.join(', ')}.`
      : 'All badges collected! Visit the Post Office for a surprise.'
  );
});

const play = createPlayOverlay({
  onOpen: () => {
    controls.enabled = false;
    ambient.setPaused(true);
  },
  onClose: () => {
    controls.enabled = !fly && !selected;
    ambient.setPaused(false);
  },
});
const cardUI = createCardUI({
  islands,
  quest,
  play,
  els: { title: $('card-title'), desc: $('card-desc'), content: $('card-content'), scroll: $('card-scroll') },
});

// ---------- hotspots (HTML buttons following 3D anchors) ----------
const hotspots = islands.map((isl) => {
  const el = document.createElement('button');
  el.className = 'hotspot';
  el.type = 'button';
  el.setAttribute('aria-label', isl.name);
  el.innerHTML = `<span class="bob"><span class="icon">${isl.theme.emoji}</span><span class="check" aria-hidden="true">&#x2713;</span></span><span class="label"></span>`;
  el.classList.toggle('visited', quest.has(isl.id));
  el.querySelector('.label').textContent = isl.name;
  el.addEventListener('click', () => openIsland(isl));
  hotspotLayer.appendChild(el);
  const anchor = new THREE.Vector3(isl.position[0] + isl.hotspot[0], isl.hotspot[1], isl.position[1] + isl.hotspot[2]);
  return { el, anchor, visible: false, id: isl.id };
});

const tmp = new THREE.Vector3();
function updateHotspots() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.updateMatrixWorld();
  for (const hs of hotspots) {
    tmp.copy(hs.anchor).project(camera);
    const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
    if (vis !== hs.visible) {
      hs.el.style.display = vis ? 'block' : 'none';
      hs.visible = vis;
    }
    if (!vis) continue;
    const scale = THREE.MathUtils.clamp(42 / camera.position.distanceTo(hs.anchor), 0.7, 1.15);
    const sx = (tmp.x * 0.5 + 0.5) * w;
    const sy = (-tmp.y * 0.5 + 0.5) * h;
    hs.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
  }
}

// ---------- camera fly-to ----------
let fly = null; // { t0, dur, fromT, toT, fromP, toP, done }
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function flyTo(toT, toP, dur, done) {
  fly = { t0: performance.now(), dur: dur * 1000, fromT: controls.target.clone(), toT, fromP: camera.position.clone(), toP, done };
  controls.enabled = false;
}

function stepFly(now) {
  if (!fly) return;
  const k = Math.min((now - fly.t0) / fly.dur, 1);
  const e = easeInOut(k);
  controls.target.lerpVectors(fly.fromT, fly.toT, e);
  camera.position.lerpVectors(fly.fromP, fly.toP, e);
  if (k >= 1) {
    const done = fly.done;
    fly = null;
    done?.();
  }
}

// ---------- info card ----------
let selected = null;
let saved = null; // camera state to return to

function openIsland(isl) {
  if (selected || fly) return;
  selected = isl;
  saved = { target: controls.target.clone(), pos: camera.position.clone() };
  document.body.classList.add('card-open');

  const dir = camera.position.clone().sub(controls.target).normalize();
  const dist = (camera.aspect < 1 ? FOCUS_DIST * 1.35 : FOCUS_DIST) * Math.max(1, isl.radius / 7);
  const fwd = new THREE.Vector3(-dir.x, 0, -dir.z).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
  const target = new THREE.Vector3(isl.position[0], 1, isl.position[1]);
  // keep the island clear of the card: left of centre on wide screens, above centre on narrow ones
  if (window.innerWidth >= 700) target.addScaledVector(right, dist * 0.26);
  else target.addScaledVector(fwd, -dist * 0.3);
  flyTo(target, target.clone().addScaledVector(dir, dist), 1.1, () => {
    if (selected !== isl) return;
    quest.visit(isl.id); // opening a card counts as visiting
    cardUI.show(isl);
    card.classList.add('open');
  });
}

function closeIsland() {
  if (!selected) return;
  selected = null;
  cardUI.reset();
  card.classList.remove('open');
  document.body.classList.remove('card-open');
  flyTo(saved.target, saved.pos, 0.9, () => {
    controls.enabled = true;
  });
}

$('card-close').addEventListener('click', closeIsland);

quest.onChange((id) => {
  updateQuestHud();
  hotspots.find((hs) => hs.id === id)?.el.classList.add('visited');
  if (quest.count() === quest.total && selected?.id !== 'post-office') showToast('All badges collected! Visit the Post Office for a surprise.');
});
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!cardUI.back()) closeIsland();
});

// ---------- click on island mesh (ignores drags) ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || selected || fly) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(pickMeshes, false)[0];
  if (hit) openIsland(islands.find((i) => i.id === hit.object.userData.islandId));
});

// ---------- resize ----------
window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyFit();
});

// ---------- intro + loop ----------
flyTo(HOME_TARGET.clone(), viewDir.clone().multiplyScalar(HOME_DIST * portraitFit()).add(HOME_TARGET), 2.2, () => {
  controls.enabled = true;
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  seaMaterial.uniforms.uTime.value += dt;
  clouds.rotation.y += dt * 0.008;
  ambient.update(dt, seaMaterial.uniforms.uTime.value);

  stepFly(performance.now());
  controls.update();

  // keep the view inside the map: clamp target, move camera by the same amount
  const t = controls.target;
  const cx = THREE.MathUtils.clamp(t.x, -MAP_LIMIT.x, MAP_LIMIT.x);
  const cz = THREE.MathUtils.clamp(t.z, -MAP_LIMIT.z, MAP_LIMIT.z);
  if (cx !== t.x || cz !== t.z) {
    camera.position.x += cx - t.x;
    camera.position.z += cz - t.z;
    t.x = cx;
    t.z = cz;
  }

  updateHotspots();
  renderer.render(scene, camera);
});

// ---------- helpers ----------
function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6ccbff');
  g.addColorStop(0.55, '#a9e3ff');
  g.addColorStop(1, HORIZON);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
