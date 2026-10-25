// Ambient life for MatDesu City: walking people, wind sway, falling leaves, jumping dolphins, birds,
// race cars lapping the circuit, rocket / plane flights (src/flights.js). Everything is driven by one `update(dt, t)`
// call from the main loop. Layout/route data lives in data/ambient.js. (Shore foam is part of the sea shader, src/sea.js.)
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SKINS, walkers, loiterers, flocks, soarers, dolphinZone, racing, flights as flightCfg } from '../data/ambient.js';
import { shapeOf, bridgeSpan } from './shapes.js';
import { createFlights } from './flights.js';

// ---------- config (counts / speeds) ----------
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)').matches; // phones/tablets get lighter counts
const CONFIG = {
  charScale: 1.5, // Kenney mini characters are ~0.72 tall; x1.5 = ~1.1 world units (a bit over a doorway-ish scale)
  walkSpeed: 1.0, // world units per second
  walkAnimRef: 1.0, // walk speed at which the clip plays at timeScale 1
  mixerFarHeight: 46, // camera height (zoomed out) above which mixers tick every other frame
  leaves: coarse ? 70 : 150,
  leafFall: [0.45, 0.8], // m/s
  windDir: new THREE.Vector3(1, 0, 0.35).normalize(),
  windStreaks: coarse ? 5 : 9,
  dolphins: coarse ? 3 : 4,
  dolphinJump: { height: 2.3, length: 7, duration: 1.7, gap: [3.5, 8], pairChance: 0.3 },
  dropletsPerSplash: 7,
  flapSpeed: 9, // wing beats rad/s for flocks
  birdScale: 1.3,
  carReduceSpeed: 0.45, // race car speed factor under reduced motion
};

const HALF_PI = Math.PI / 2;
const wind = CONFIG.windDir;
const rnd = (a, b) => a + Math.random() * (b - a);
const hash = (x, z) => Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
const smooth = (k) => k * k * (3 - 2 * k);
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function createAmbient({ scene, camera, islands, islandRoots, loader, seaY }) {
  let reduce = reduceQuery.matches;
  let paused = false;
  let frame = 0;
  const islandById = new Map(islands.map((i) => [i.id, i]));
  const hub = islands[0];
  const BRIDGE_Y = 0.12; // top of the bridge deck

  const gust = (t) => 0.75 + 0.25 * Math.sin(t * 0.31) + 0.12 * Math.sin(t * 0.83 + 1.3);

  // ---------- props: wind sway, tree sources for leaves, race cars ----------
  const sway = []; // { obj, amp, freq, phase, flag, baseY }
  const treeSpots = []; // world positions of tree crowns (leaf spawn)
  const cars = [];
  const flights = createFlights({ scene, camera, islands, islandRoots, cfg: flightCfg, reduceQuery });

  function addProp(obj, placement, isl) {
    const name = placement.m.split('/')[1] || '';
    if (isl.id === flightCfg.island && /^(rocket_|craft_)/.test(name) && flights.addPart(obj, placement, isl)) return; // flown, never swayed
    let amp = 0;
    let freq = 1;
    let flag = false;
    if (/^tree/.test(name)) {
      amp = 0.028;
      freq = 1.0;
      treeSpots.push({ x: isl.position[0] + placement.x, z: isl.position[1] + placement.z });
    } else if (/^plant|^bush/.test(name)) {
      amp = 0.035;
      freq = 1.5;
    } else if (/^flower/.test(name)) {
      amp = 0.1;
      freq = 1.9;
    } else if (/^flag|^banner/.test(name)) {
      amp = 0.2;
      freq = 3.2;
      flag = true;
    }
    if (amp) {
      obj.rotation.order = 'ZXY'; // tilt about world axes after the placement yaw
      sway.push({ obj, amp, freq, flag, phase: hash(placement.x, placement.z) * 6.28 + isl.seed, baseY: obj.rotation.y });
    }
    if (isl.id === racing.island && /^raceCar/.test(name) && isl.circuit) addCar(obj, isl);
  }

  function updateSway(t) {
    const g = reduce ? 0 : gust(t);
    for (const s of sway) {
      const o = s.obj;
      if (reduce) {
        o.rotation.x = o.rotation.z = 0;
        continue;
      }
      const w = Math.sin(t * s.freq + s.phase) * 0.6 + Math.sin(t * s.freq * 2.3 + s.phase * 1.7) * 0.25 + 0.5;
      const a = s.amp * g * w;
      if (s.flag) {
        o.rotation.y = s.baseY + a * 1.2;
      } else {
        o.rotation.z = -wind.x * a;
        o.rotation.x = wind.z * a;
      }
    }
  }

  // ---------- wind streaks ----------
  const streaks = [];
  {
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-HALF_PI);
    for (let i = 0; i < CONFIG.windStreaks; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.y = -Math.atan2(wind.z, wind.x);
      m.frustumCulled = false;
      m.visible = false;
      scene.add(m);
      streaks.push({ m, life: 1 + Math.random(), dur: 1, speed: 1, len: 1 });
    }
  }
  function updateStreaks(dt) {
    for (const s of streaks) {
      s.life += dt;
      if (s.life >= s.dur) {
        s.life = 0;
        s.dur = rnd(3, 5.5);
        s.speed = rnd(5, 9);
        s.len = rnd(4, 8);
        s.m.scale.set(s.len, 1, rnd(0.05, 0.09));
        s.m.position.set(rnd(-42, 20) - 8, rnd(1.5, 7), rnd(-42, 42));
      }
      const k = s.life / s.dur;
      s.m.position.x += wind.x * s.speed * dt;
      s.m.position.z += wind.z * s.speed * dt;
      s.m.material.opacity = 0.32 * Math.sin(Math.PI * k) ** 2;
      s.m.visible = true;
    }
  }

  // ---------- falling leaves ----------
  const leaves = {
    mesh: null,
    n: CONFIG.leaves,
    px: null, py: null, pz: null, vy: null, ph: null, spin: null, age: null, life: null, size: null,
    ready: false,
  };
  const dummy = new THREE.Object3D();
  {
    const geo = new THREE.PlaneGeometry(0.3, 0.22);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geo, mat, leaves.n);
    const palette = [0x6cc24a, 0x8fd14f, 0xf2a93b, 0xe8742c, 0xf4d03f].map((c) => new THREE.Color(c));
    for (let i = 0; i < leaves.n; i++) mesh.setColorAt(i, palette[i % palette.length]);
    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.count = 0;
    scene.add(mesh);
    leaves.mesh = mesh;
    for (const k of ['px', 'py', 'pz', 'vy', 'ph', 'spin', 'age', 'life', 'size']) leaves[k] = new Float32Array(leaves.n);
  }
  function respawnLeaf(i, scatter) {
    const src = treeSpots[(Math.random() * treeSpots.length) | 0];
    leaves.px[i] = src.x + rnd(-1, 1);
    leaves.pz[i] = src.z + rnd(-1, 1);
    leaves.py[i] = rnd(2.2, 4.6);
    leaves.vy[i] = rnd(...CONFIG.leafFall);
    leaves.ph[i] = Math.random() * 6.28;
    leaves.spin[i] = rnd(1.5, 4) * (Math.random() < 0.5 ? -1 : 1);
    leaves.size[i] = rnd(0.7, 1.2);
    leaves.life[i] = 0; // 0 = falling, >0 = shrinking on the ground
    leaves.age[i] = 0;
    if (scatter) leaves.py[i] = rnd(0.1, 4.2);
  }
  function onIsland(x, z) {
    for (const isl of islands) {
      const dx = x - isl.position[0];
      const dz = z - isl.position[1];
      if (Math.hypot(dx, dz) < (isl.bound ?? isl.radius) + 1 && shapeOf(isl).land(dx, dz) < 0.3) return true;
    }
    return false;
  }
  function updateLeaves(dt, t) {
    const mesh = leaves.mesh;
    if (reduce || !treeSpots.length) {
      mesh.count = 0;
      leaves.ready = false;
      return;
    }
    if (!leaves.ready) {
      for (let i = 0; i < leaves.n; i++) respawnLeaf(i, true);
      leaves.ready = true;
      mesh.count = leaves.n;
    }
    const g = gust(t);
    for (let i = 0; i < leaves.n; i++) {
      leaves.age[i] += dt;
      const a = leaves.age[i];
      let fade = Math.min(a / 0.4, 1);
      if (leaves.life[i] > 0) {
        leaves.life[i] += dt;
        fade = Math.max(0, 1 - leaves.life[i] / 0.4);
        if (fade <= 0) respawnLeaf(i, false);
      } else {
        const ph = leaves.ph[i];
        leaves.px[i] += (wind.x * 0.9 * g + Math.sin(t * 1.3 + ph) * 0.4) * dt;
        leaves.pz[i] += (wind.z * 0.9 * g + Math.cos(t * 1.1 + ph) * 0.3) * dt;
        leaves.py[i] -= leaves.vy[i] * dt * (0.8 + 0.4 * Math.sin(t * 2 + ph));
        const y = leaves.py[i];
        if (y <= 0 && (onIsland(leaves.px[i], leaves.pz[i]) || y <= seaY)) {
          leaves.py[i] = Math.max(y, seaY);
          leaves.life[i] = 0.001;
        }
      }
      const ph = leaves.ph[i];
      dummy.position.set(leaves.px[i], leaves.py[i], leaves.pz[i]);
      dummy.rotation.set(t * leaves.spin[i] + ph, t * leaves.spin[i] * 0.6, Math.sin(t * 2 + ph) * 0.8);
      dummy.scale.setScalar(Math.max(fade, 0.0001) * leaves.size[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- people ----------
  const people = []; // { root, mixer, actions, state, ... }
  const frustum = new THREE.Frustum();
  const projView = new THREE.Matrix4();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1.6);

  function routePoints(route) {
    const pts = [];
    if (route.type === 'circle') {
      const isl = islandById.get(route.island);
      for (let i = 0; i < route.n; i++) {
        const a = (i / route.n) * Math.PI * 2 * (route.dir ?? 1);
        pts.push(new THREE.Vector3(isl.position[0] + Math.cos(a) * route.r, 0, isl.position[1] + Math.sin(a) * route.r));
      }
      return { pts, mode: 'loop' };
    }
    if (route.type === 'bridge') {
      const isl = islandById.get(route.to);
      const span = bridgeSpan(hub, isl); // hub edge -> island edge along the bridge, from the real shapes
      const { dx, dz } = span;
      const d0 = span.d0 - 0.2;
      const d1 = span.d1 + 0.2;
      const lane = route.lane ?? 0;
      for (const d of [d0, d1]) pts.push(new THREE.Vector3(dx * d - dz * lane, BRIDGE_Y, dz * d + dx * lane));
      return { pts, mode: 'pingpong' };
    }
    const isl = islandById.get(route.island);
    for (const [x, z] of route.points) pts.push(new THREE.Vector3(isl.position[0] + x, 0, isl.position[1] + z));
    return { pts, mode: 'pingpong' };
  }

  function crossfade(p, name, dur = 0.3) {
    const next = p.actions[name];
    if (!next || p.current === next) return;
    next.reset().setEffectiveWeight(1).play();
    if (p.current) p.current.crossFadeTo(next, dur, false);
    p.current = next;
    if (name === 'walk') next.timeScale = CONFIG.walkSpeed / CONFIG.walkAnimRef;
  }

  function loadPeople() {
    const kits = new Map();
    const needed = [...new Set([...walkers, ...loiterers].map((w) => w.skin))].filter((s) => SKINS.includes(s));
    Promise.all(
      needed.map(
        (skin) =>
          new Promise((resolve) => {
            loader.load(
              `assets/models/mini/character-${skin}.glb`,
              (gltf) => {
                const mats = new Map();
                gltf.scene.traverse((o) => {
                  if (!o.isMesh) return;
                  const src = o.material;
                  if (!mats.has(src.uuid)) mats.set(src.uuid, new THREE.MeshLambertMaterial({ map: src.map, color: src.color, side: THREE.DoubleSide }));
                  o.material = mats.get(src.uuid);
                });
                kits.set(skin, gltf);
                resolve();
              },
              undefined,
              (err) => {
                console.warn('Could not load character', skin, err);
                resolve();
              }
            );
          })
      )
    ).then(() => {
      const make = (def) => {
        const gltf = kits.get(def.skin);
        if (!gltf) return null;
        const model = cloneSkinned(gltf.scene);
        model.scale.setScalar(CONFIG.charScale);
        const root = new THREE.Group();
        root.add(model);
        scene.add(root);
        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        for (const name of ['idle', 'walk', 'emote-yes']) {
          const clip = gltf.animations.find((c) => c.name === name);
          if (clip) actions[name] = mixer.clipAction(clip);
        }
        return { root, mixer, actions, current: null, acc: 0, yaw: 0, targetYaw: 0 };
      };

      for (const def of walkers) {
        const p = make(def);
        if (!p) continue;
        const { pts, mode } = routePoints(def.route);
        const n = pts.length;
        p.pts = pts;
        p.mode = mode;
        p.idx = Math.min(n - 1, Math.floor((def.start ?? 0) * n));
        p.dir = mode === 'pingpong' && p.idx >= n - 1 ? -1 : 1;
        p.state = 'walk';
        p.timer = 0;
        p.root.position.copy(pts[p.idx]);
        p.next = nextIndex(p);
        p.walker = true;
        const to = pts[p.next];
        p.yaw = p.targetYaw = Math.atan2(to.x - pts[p.idx].x, to.z - pts[p.idx].z);
        p.root.rotation.y = p.yaw;
        crossfade(p, 'walk', 0);
        if (p.current) p.current.time = Math.random() * p.current.getClip().duration;
        people.push(p);
      }

      for (const def of loiterers) {
        const p = make(def);
        if (!p) continue;
        const isl = islandById.get(def.island);
        p.root.position.set(isl.position[0] + def.at[0], 0, isl.position[1] + def.at[1]);
        p.yaw = p.targetYaw = Math.atan2(def.face[0] - def.at[0], def.face[1] - def.at[1]);
        p.root.rotation.y = p.yaw;
        p.state = 'stand';
        p.walker = false;
        crossfade(p, def.anim in p.actions ? def.anim : 'idle', 0);
        if (p.current) p.current.time = Math.random() * p.current.getClip().duration;
        people.push(p);
      }
    });
  }

  function nextIndex(p) {
    const n = p.pts.length;
    if (p.mode === 'loop') return (p.idx + 1) % n;
    if (p.idx + p.dir < 0 || p.idx + p.dir >= n) p.dir = -p.dir;
    return p.idx + p.dir;
  }

  function updatePeople(dt) {
    camera.updateMatrixWorld();
    projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projView);
    const far = camera.position.y > CONFIG.mixerFarHeight;

    for (const p of people) {
      if (p.walker) {
        if (p.state === 'walk') {
          const to = p.pts[p.next];
          const pos = p.root.position;
          const dx = to.x - pos.x;
          const dz = to.z - pos.z;
          const d = Math.hypot(dx, dz);
          const step = CONFIG.walkSpeed * dt;
          if (d <= step) {
            pos.copy(to);
            p.idx = p.next;
            p.next = nextIndex(p);
            const end = p.mode === 'pingpong' && (p.idx === 0 || p.idx === p.pts.length - 1);
            if (end || (p.mode === 'loop' && Math.random() < 0.1)) {
              p.state = 'pause';
              p.timer = rnd(1.5, 4);
              crossfade(p, 'idle');
            }
          } else {
            pos.x += (dx / d) * step;
            pos.z += (dz / d) * step;
            p.targetYaw = Math.atan2(dx, dz);
          }
        } else if (p.state === 'pause') {
          p.timer -= dt;
          if (p.timer <= 0) {
            p.state = 'walk';
            const to = p.pts[p.next];
            p.targetYaw = Math.atan2(to.x - p.root.position.x, to.z - p.root.position.z);
            crossfade(p, 'walk');
          }
        }
        p.yaw += angleDelta(p.yaw, p.targetYaw) * (1 - Math.exp(-8 * dt));
        p.root.rotation.y = p.yaw;
      }

      // animation: skip off-screen characters, halve the rate when zoomed far out
      sphere.center.copy(p.root.position);
      sphere.center.y += 0.6;
      p.acc += dt;
      if (!frustum.intersectsSphere(sphere)) {
        p.acc = 0;
        continue;
      }
      if (far && (frame & 1)) continue;
      p.mixer.update(p.acc);
      p.acc = 0;
    }
  }

  // ---------- dolphins ----------
  function makeDolphinGeometry() {
    const back = new THREE.Color('#5f86a6');
    const belly = new THREE.Color('#e4eef4');
    const c = new THREE.Color();
    const finish = (geo, paintByNormal = true) => {
      geo = geo.index ? geo.toNonIndexed() : geo;
      geo.deleteAttribute('uv');
      if (!geo.attributes.normal) geo.computeVertexNormals();
      const n = geo.attributes.normal;
      const col = new Float32Array(n.count * 3);
      for (let i = 0; i < n.count; i++) {
        const t = paintByNormal ? THREE.MathUtils.clamp((-n.getY(i) - 0.05) / 0.45, 0, 1) : 0;
        c.copy(back).lerp(belly, t);
        col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return geo;
    };
    const flat = (verts) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      g.computeVertexNormals();
      return g;
    };
    const parts = [];
    parts.push(finish(new THREE.SphereGeometry(1, 12, 9).scale(0.34, 0.32, 1.1)));
    parts.push(finish(new THREE.CylinderGeometry(0.06, 0.15, 0.55, 8).rotateX(HALF_PI).translate(0, -0.03, 1.28)));
    parts.push(finish(new THREE.ConeGeometry(0.26, 1.1, 8).rotateX(-HALF_PI).scale(0.85, 0.95, 1).translate(0, 0, -1.5)));
    // flukes, dorsal fin, pectoral fins (thin double-sided triangles)
    parts.push(finish(flat([0, 0, -1.9, 0.6, 0, -2.3, 0, 0, -2.1, 0, 0, -1.9, 0, 0, -2.1, -0.6, 0, -2.3]), false));
    parts.push(finish(flat([0, 0.28, 0.25, 0, 0.3, -0.35, 0, 0.72, -0.5]), false));
    parts.push(finish(flat([0.25, -0.12, 0.45, 0.27, -0.12, 0.12, 0.7, -0.45, 0.1]), false));
    parts.push(finish(flat([-0.25, -0.12, 0.45, -0.7, -0.45, 0.1, -0.27, -0.12, 0.12]), false));
    return mergeGeometries(parts);
  }

  const dolphinMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const dolphinGeo = makeDolphinGeometry();
  const dolphins = [];
  for (let i = 0; i < CONFIG.dolphins; i++) {
    const mesh = new THREE.Mesh(dolphinGeo, dolphinMat);
    mesh.rotation.order = 'YXZ';
    mesh.visible = false;
    const s = rnd(0.55, 0.7);
    mesh.scale.setScalar(s);
    scene.add(mesh);
    dolphins.push({ mesh, state: 'wait', timer: rnd(1, 6) + i * 1.5, k: 0, sx: 0, sz: 0, dx: 0, dz: 1, delay: 0, entered: false, exited: false });
  }

  // pooled splash rings and droplets
  const rings = [];
  const ringGeo = new THREE.RingGeometry(0.55, 0.72, 28).rotateX(-HALF_PI);
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false;
    scene.add(m);
    rings.push({ m, age: 1, dur: 1.2 });
  }
  let ringNext = 0;
  const DROPS = 48;
  const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), DROPS);
  drops.frustumCulled = false;
  drops.count = 0;
  scene.add(drops);
  const drop = { x: new Float32Array(DROPS), y: new Float32Array(DROPS), z: new Float32Array(DROPS), vx: new Float32Array(DROPS), vy: new Float32Array(DROPS), vz: new Float32Array(DROPS), alive: new Uint8Array(DROPS) };
  let dropNext = 0;
  let dropsInit = false;

  function splash(x, z) {
    if (reduce) return;
    const r = rings[ringNext++ % rings.length];
    r.age = 0;
    r.m.position.set(x, seaY + 0.16, z); // above the highest wave crest
    r.m.visible = true;
    if (!dropsInit) {
      dropsInit = true;
      drops.count = DROPS;
      dummy.scale.setScalar(0.0001);
      dummy.position.set(0, -50, 0);
      dummy.updateMatrix();
      for (let i = 0; i < DROPS; i++) drops.setMatrixAt(i, dummy.matrix);
    }
    for (let k = 0; k < CONFIG.dropletsPerSplash; k++) {
      const i = dropNext++ % DROPS;
      const a = Math.random() * 6.28;
      const sp = rnd(0.4, 1.2);
      drop.x[i] = x + Math.cos(a) * 0.3;
      drop.z[i] = z + Math.sin(a) * 0.3;
      drop.y[i] = seaY + 0.1;
      drop.vx[i] = Math.cos(a) * sp;
      drop.vz[i] = Math.sin(a) * sp;
      drop.vy[i] = rnd(2.2, 4);
      drop.alive[i] = 1;
    }
  }

  function updateSplashes(dt) {
    for (const r of rings) {
      if (!r.m.visible) continue;
      r.age += dt;
      const k = r.age / r.dur;
      if (k >= 1) {
        r.m.visible = false;
        continue;
      }
      r.m.scale.setScalar(0.6 + k * 3.2);
      r.m.material.opacity = 0.65 * (1 - k) ** 1.5;
    }
    if (!dropsInit) return;
    let any = false;
    for (let i = 0; i < DROPS; i++) {
      if (!drop.alive[i]) continue;
      drop.vy[i] -= 9 * dt;
      drop.x[i] += drop.vx[i] * dt;
      drop.y[i] += drop.vy[i] * dt;
      drop.z[i] += drop.vz[i] * dt;
      if (drop.y[i] < seaY) {
        drop.alive[i] = 0;
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        dummy.position.set(drop.x[i], drop.y[i], drop.z[i]);
        dummy.scale.setScalar(1);
      }
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
      any = true;
    }
    if (any) drops.instanceMatrix.needsUpdate = true;
  }

  // open-water test: away from every island and every hub bridge
  function waterClear(x, z) {
    for (const isl of islands) {
      if (Math.hypot(x - isl.position[0], z - isl.position[1]) < (isl.bound ?? isl.radius) + dolphinZone.islandMargin) return false;
    }
    for (const isl of islands.slice(1)) {
      const [bx, bz] = isl.position;
      const len2 = bx * bx + bz * bz;
      const k = THREE.MathUtils.clamp((x * bx + z * bz) / len2, 0, 1);
      if (Math.hypot(x - bx * k, z - bz * k) < dolphinZone.bridgeMargin) return false;
    }
    return true;
  }
  function pickJump() {
    const { length } = CONFIG.dolphinJump;
    for (let tries = 0; tries < 40; tries++) {
      const sx = rnd(-dolphinZone.half, dolphinZone.half);
      const sz = rnd(-dolphinZone.half, dolphinZone.half);
      const a = Math.random() * 6.28;
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      let ok = true;
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        if (!waterClear(sx + dx * length * f, sz + dz * length * f)) {
          ok = false;
          break;
        }
      }
      if (ok) return { sx, sz, dx, dz };
    }
    return null;
  }
  function startJump(d, j, delay) {
    d.state = 'jump';
    d.k = 0;
    d.delay = delay;
    d.sx = j.sx;
    d.sz = j.sz;
    d.dx = j.dx;
    d.dz = j.dz;
    d.entered = false;
    d.exited = false;
    d.mesh.visible = false;
  }
  function updateDolphins(dt) {
    const { height, length, duration, gap, pairChance } = CONFIG.dolphinJump;
    for (const d of dolphins) {
      if (d.state === 'wait') {
        d.timer -= dt;
        if (d.timer > 0) continue;
        const j = pickJump();
        if (!j) {
          d.timer = 2;
          continue;
        }
        startJump(d, j, 0);
        if (Math.random() < pairChance) {
          const buddy = dolphins.find((o) => o !== d && o.state === 'wait');
          if (buddy) startJump(buddy, { sx: j.sx - j.dz * 1.6, sz: j.sz + j.dx * 1.6, dx: j.dx, dz: j.dz }, 0.3);
        }
        continue;
      }
      // jumping
      if (d.delay > 0) {
        d.delay -= dt;
        continue;
      }
      d.k += dt / duration;
      const u = THREE.MathUtils.lerp(-0.1, 1.1, d.k); // a little before/after so it starts and ends underwater
      if (d.k >= 1) {
        d.state = 'wait';
        d.timer = rnd(...gap);
        d.mesh.visible = false;
        continue;
      }
      const y = seaY + height * (1 - (2 * u - 1) ** 2);
      const slope = (-4 * height * (2 * u - 1)) / length; // dy/ds, s = u * length
      const m = d.mesh;
      m.visible = true;
      m.position.set(d.sx + d.dx * length * u, y, d.sz + d.dz * length * u);
      m.rotation.y = Math.atan2(d.dx, d.dz);
      m.rotation.x = -Math.atan(slope);
      if (!d.entered && u >= 0.0) {
        d.entered = true;
        splash(d.sx, d.sz);
      }
      if (!d.exited && u >= 1.0) {
        d.exited = true;
        splash(d.sx + d.dx * length, d.sz + d.dz * length);
      }
    }
  }

  // ---------- birds ----------
  const birds = []; // { root, wl, wr, c, r, h, w, th, off:[x,z], phase, flap, bob }
  {
    const bodyGeo = (() => {
      const body = new THREE.SphereGeometry(1, 8, 6).scale(0.14, 0.13, 0.42);
      const tail = new THREE.ConeGeometry(0.1, 0.3, 4).rotateX(-HALF_PI).scale(1.3, 0.3, 1).translate(0, 0, -0.5);
      const toIdx = (g) => {
        g = g.index ? g.toNonIndexed() : g;
        g.deleteAttribute('uv');
        return g;
      };
      return mergeGeometries([toIdx(body), toIdx(tail)]);
    })();
    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.22, 0, 0, -0.2, 0.95, 0, -0.38, 0, 0, 0.22, 0.95, 0, -0.38, 0.8, 0, -0.5], 3));
    wingGeo.computeVertexNormals();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf5f7f9 });
    const wingMat = new THREE.MeshLambertMaterial({ color: 0xdfe5ea, side: THREE.DoubleSide });
    const build = (def, off, i, flapAmp) => {
      const root = new THREE.Group();
      root.rotation.order = 'YXZ';
      root.scale.setScalar(CONFIG.birdScale * rnd(0.9, 1.1));
      root.add(new THREE.Mesh(bodyGeo, bodyMat));
      const wl = new THREE.Group();
      const wr = new THREE.Group();
      wl.position.set(0.1, 0.04, 0.03);
      wr.position.set(-0.1, 0.04, 0.03);
      wr.scale.x = -1;
      wl.add(new THREE.Mesh(wingGeo, wingMat));
      wr.add(new THREE.Mesh(wingGeo, wingMat));
      root.add(wl, wr);
      scene.add(root);
      birds.push({
        root, wl, wr, c: def.center, r: def.radius, h: def.height, w: def.speed,
        th: Math.random() * 6.28, off, phase: Math.random() * 6.28, flap: flapAmp, bob: rnd(0.2, 0.5), i,
      });
    };
    for (const f of flocks) {
      const th0 = Math.random() * 6.28;
      for (let i = 0; i < f.n; i++) {
        // loose V formation behind the leader
        const side = i % 2 ? 1 : -1;
        const row = Math.ceil(i / 2);
        build(f, [side * row * 1.3, -row * 1.1], i, 0);
        birds[birds.length - 1].th = th0;
      }
    }
    for (const s of soarers) build(s, [0, 0], 0, 1);
  }
  function updateBirds(dt, t) {
    for (const b of birds) {
      b.th += b.w * dt;
      const th = b.th;
      const sign = Math.sign(b.w);
      const fwdX = -Math.sin(th) * sign;
      const fwdZ = Math.cos(th) * sign;
      const yaw = Math.atan2(fwdX, fwdZ);
      // formation offset in the bird's own frame (x = right-ish, z = forward)
      const ox = b.off[0] * Math.cos(yaw) + b.off[1] * Math.sin(yaw);
      const oz = -b.off[0] * Math.sin(yaw) + b.off[1] * Math.cos(yaw);
      const r = b.r;
      b.root.position.set(
        b.c[0] + Math.cos(th) * r + ox,
        b.h + Math.sin(t * 0.8 + b.phase) * b.bob,
        b.c[1] + Math.sin(th) * r + oz
      );
      b.root.rotation.y = yaw;
      b.root.rotation.z = 0.28 * sign;
      // soarers mostly glide with an occasional beat; flock birds flap with short glides in between
      const glide = b.flap ? 0.5 + 0.5 * Math.sin(t * 0.35 + b.phase) : Math.sin(t * 0.5 + b.phase * 2) > 0.6 ? 0.2 : 1;
      const amp = (b.flap ? 0.12 + 0.4 * Math.max(0, Math.sin(t * 0.35 + b.phase) - 0.5) : 0.6) * glide;
      const a = Math.sin(t * CONFIG.flapSpeed * (b.flap ? 0.6 : 1) + b.phase) * amp;
      b.wl.rotation.z = a;
      b.wr.rotation.z = -a; // mirrored pivot (scale.x = -1) so negative angle flaps in sync
    }
  }

  // ---------- race cars ----------
  // Cars lap the closed circuit (island.circuit.path = track centre line, island-local) on a CatmullRom curve, each with
  // its own base speed that drifts a little over time, so they catch each other up and overtake: a car that closes in on
  // another swings into the opposite lane while the one being passed moves over. Heading follows the path, the body leans
  // into corners, wheels spin. The Kenney race car faces +z (front wheels at +z, rear wing at -z).
  const track = { curve: null, len: 0 };
  const ROAD_Y = 0.045; // top of the road pieces (0.02 model units x racing kit scale)
  function addCar(obj, isl) {
    if (!track.curve) {
      const pts = isl.circuit.path.map(([x, z]) => new THREE.Vector3(x, 0, z));
      track.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      track.curve.arcLengthDivisions = 800;
      track.len = track.curve.getLength();
    }
    const cfg = racing.cars[cars.length % racing.cars.length];
    obj.rotation.order = 'YXZ';
    const wheels = ['wheelFrontLeft', 'wheelFrontRight', 'wheelBackLeft', 'wheelBackRight'].map((n) => obj.getObjectByName(n)).filter(Boolean);
    cars.push({
      obj,
      wheels,
      cfg,
      s: (((cfg.start % 1) + 1) % 1) * track.len,
      lane: cfg.lane * 0.3,
      target: cfg.lane * 0.3,
      pref: cfg.lane * 0.3,
      phase: Math.random() * 6.28,
      yaw: 0,
      rate: 0,
      speed: cfg.speed,
      side: 0,
    });
    const c = cars[cars.length - 1];
    carPoint(c.s, c.lane, carA);
    carPoint(c.s + 0.7, c.lane, carB);
    c.yaw = Math.atan2(carB.x - carA.x, carB.z - carA.z);
    obj.position.set(carA.x, ROAD_Y, carA.z);
    obj.rotation.y = c.yaw;
  }

  const carA = new THREE.Vector3();
  const carB = new THREE.Vector3();
  const carT = new THREE.Vector3();
  function carPoint(s, lane, out) {
    const u = (((s % track.len) + track.len) % track.len) / track.len;
    track.curve.getPointAt(u, out);
    track.curve.getTangentAt(u, carT);
    out.x += -carT.z * lane; // lane > 0 = right of the driving direction
    out.z += carT.x * lane;
    return out;
  }

  function updateCars(dt, t) {
    if (!track.curve || !cars.length) return;
    const L = track.len;
    const w = racing.laneWidth;
    // signed distance from a to b along the track, in (-L/2, L/2]; positive = b is ahead of a
    const sgap = (a, b) => {
      const g = (((b.s - a.s) % L) + L) % L;
      return g > L / 2 ? g - L : g;
    };
    // overtaking: a car with another one close by (ahead or behind) takes a lane opposite to it and keeps it until the
    // pair has separated again; unpaired cars drift back to their preferred lane
    for (const c of cars) {
      let near = null;
      let best = racing.passGap;
      for (const o of cars) {
        if (o === c) continue;
        const g = Math.abs(sgap(c, o));
        if (g < best) {
          best = g;
          near = o;
        }
      }
      if (!near) c.side = 0;
      else if (!c.side) c.side = near.side ? -near.side : cars.indexOf(c) < cars.indexOf(near) ? 1 : -1;
      c.target = c.side ? c.side * w : c.pref;
    }

    const slow = reduce ? CONFIG.carReduceSpeed : 1;
    for (const c of cars) {
      // base speed wanders +-9% with a slow wave, a little slower while turning hard
      const wander = 1 + 0.09 * Math.sin(t * 0.33 + c.phase) + 0.03 * Math.sin(t * 0.91 + c.phase * 2);
      const corner = 1 - 0.14 * smooth(Math.min(1, Math.abs(c.rate) / 1.1));
      let want = c.cfg.speed * wander * corner;
      // never drive into the back of a car in the same lane
      for (const o of cars) {
        if (o === c) continue;
        const g = sgap(c, o);
        if (g > 0 && g < 2.6 && Math.abs(o.lane - c.lane) < 0.8) want = Math.min(want, o.speed * (0.9 + 0.1 * Math.max(0, g - 1.9)));
      }
      c.speed += (want - c.speed) * (1 - Math.exp(-(c.cfg.accel ?? 1) * 2 * dt));
      c.s = (c.s + c.speed * slow * dt) % L;
      c.lane += (c.target - c.lane) * (1 - Math.exp(-3 * dt));
      carPoint(c.s, c.lane, carA);
      carPoint(c.s + 0.7, c.lane, carB);
      const yaw = Math.atan2(carB.x - carA.x, carB.z - carA.z);
      const dy = angleDelta(c.yaw, yaw);
      c.rate += (dy / Math.max(dt, 1e-4) - c.rate) * (1 - Math.exp(-8 * dt));
      c.yaw += dy;
      const o = c.obj;
      o.position.set(carA.x, ROAD_Y, carA.z);
      o.rotation.y = c.yaw;
      o.rotation.z = THREE.MathUtils.clamp(c.rate * 0.045, -0.09, 0.09); // lean to the outside of the corner
      const spin = (c.speed * slow * dt) / 0.2;
      for (const wh of c.wheels) wh.rotation.x += spin;
    }
  }

  // ---------- init ----------
  loadPeople();
  reduceQuery.addEventListener?.('change', (e) => {
    reduce = e.matches;
    streaks.forEach((s) => (s.m.visible = false));
    if (reduce) {
      rings.forEach((r) => (r.m.visible = false));
      drop.alive.fill(0);
    }
  });

  return {
    addProp,
    setPaused(v) {
      paused = v;
    },
    update(dt, t) {
      if (paused) return;
      dt = Math.min(dt, 0.1);
      frame++;
      updateSway(t);
      if (!reduce) updateStreaks(dt);
      updateLeaves(dt, t);
      updatePeople(dt);
      updateDolphins(dt);
      updateSplashes(dt);
      updateBirds(dt, t);
      updateCars(dt, t);
      flights.update(dt, t);
    },
    flights,
  };
}
