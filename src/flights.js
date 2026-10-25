// Rocket and plane flights on the AR/VR Lab island.
//   - the stacked rocket (rocket_baseA + fuelA + topA) counts down, lifts off with flame and smoke, climbs out of view,
//     later comes back down tail first with a retro-burn flame and lands on its pad, then idles and repeats;
//   - the speeder (craft_speederA) takes off, flies one banked loop around the map at bird height and lands again.
// Everything is driven by update(dt). Cheap: two flame cones, one instanced billboard particle batch (smoke / dust /
// contrail), one CatmullRom path built per plane flight. Timings live in data/ambient.js (`flights`).
// Reduced motion: flights are disabled (vehicles stay on their pads) and no particles are drawn.
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);
const smooth = (k) => {
  k = Math.min(1, Math.max(0, k));
  return k * k * (3 - 2 * k);
};
const clamp = THREE.MathUtils.clamp;

// ---------- particle batch (one draw call) ----------
function createParticles(scene, max) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.attributes.position);
  geo.setAttribute('uv', quad.attributes.uv);
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const aSize = new THREE.InstancedBufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos);
  geo.setAttribute('aSize', aSize);
  geo.setAttribute('aCol', aCol);
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aPos;
      attribute float aSize;
      attribute vec4 aCol;
      varying vec4 vCol;
      varying vec2 vUv;
      void main() {
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 p = aPos + (right * position.x + up * position.y) * aSize;
        vCol = aCol;
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vCol;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.55, 1.0, r)) * vCol.a;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vCol.rgb, a);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  scene.add(mesh);

  const p = {
    life: new Float32Array(max).fill(1),
    age: new Float32Array(max).fill(1),
    x: new Float32Array(max), y: new Float32Array(max), z: new Float32Array(max),
    vx: new Float32Array(max), vy: new Float32Array(max), vz: new Float32Array(max),
    s0: new Float32Array(max), s1: new Float32Array(max), a0: new Float32Array(max),
    c0: new Float32Array(max * 3), c1: new Float32Array(max * 3),
  };
  let next = 0;
  const ca = new THREE.Color();
  const cb = new THREE.Color();
  return {
    // colour fades from c0 to c1 over the particle life, alpha fades out, size grows s0 -> s1
    emit(x, y, z, vx, vy, vz, life, s0, s1, a0, c0, c1) {
      let i = next;
      for (let k = 0; k < max; k++) {
        const j = (next + k) % max;
        if (p.age[j] >= p.life[j]) {
          i = j;
          break;
        }
      }
      next = (i + 1) % max;
      p.age[i] = 0;
      p.life[i] = life;
      p.x[i] = x; p.y[i] = y; p.z[i] = z;
      p.vx[i] = vx; p.vy[i] = vy; p.vz[i] = vz;
      p.s0[i] = s0; p.s1[i] = s1; p.a0[i] = a0;
      ca.set(c0);
      cb.set(c1);
      p.c0.set([ca.r, ca.g, ca.b], i * 3);
      p.c1.set([cb.r, cb.g, cb.b], i * 3);
    },
    update(dt) {
      let n = 0;
      const ap = aPos.array;
      const as = aSize.array;
      const ac = aCol.array;
      for (let i = 0; i < max; i++) {
        if (p.age[i] >= p.life[i]) continue;
        p.age[i] += dt;
        const k = p.age[i] / p.life[i];
        if (k >= 1) continue;
        p.x[i] += p.vx[i] * dt;
        p.y[i] += p.vy[i] * dt;
        p.z[i] += p.vz[i] * dt;
        const drag = Math.exp(-1.2 * dt);
        p.vx[i] *= drag;
        p.vy[i] *= drag;
        p.vz[i] *= drag;
        ap[n * 3] = p.x[i]; ap[n * 3 + 1] = p.y[i]; ap[n * 3 + 2] = p.z[i];
        as[n] = p.s0[i] + (p.s1[i] - p.s0[i]) * Math.sqrt(k);
        ac[n * 4] = p.c0[i * 3] + (p.c1[i * 3] - p.c0[i * 3]) * k;
        ac[n * 4 + 1] = p.c0[i * 3 + 1] + (p.c1[i * 3 + 1] - p.c0[i * 3 + 1]) * k;
        ac[n * 4 + 2] = p.c0[i * 3 + 2] + (p.c1[i * 3 + 2] - p.c0[i * 3 + 2]) * k;
        ac[n * 4 + 3] = p.a0[i] * (1 - k) * Math.min(1, k * 8);
        n++;
      }
      geo.instanceCount = n;
      mesh.visible = n > 0;
      aPos.needsUpdate = aSize.needsUpdate = aCol.needsUpdate = true;
    },
    clear() {
      p.age.fill(1);
      geo.instanceCount = 0;
      mesh.visible = false;
    },
  };
}

// ---------- flame (two stacked cones, tip pointing down) ----------
function createFlame() {
  const g = new THREE.Group();
  const mk = (r, h, color, opacity) => {
    // cone apex is at +y by default: flip it so the apex points down, then hang it from y = 0
    const geo = new THREE.ConeGeometry(r, h, 10, 1, true).rotateX(Math.PI).translate(0, -h / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
    return m;
  };
  const outer = mk(0.5, 2.6, '#ff8a1f', 0.92);
  const inner = mk(0.28, 1.7, '#fff3a8', 0.95);
  g.add(outer, inner);
  g.visible = false;
  g.userData = { outer, inner };
  return g;
}

export function createFlights({ scene, camera, islands, islandRoots, cfg, reduceQuery }) {
  const parts = { rocket: [], craft: null };
  const rocket = { group: null, flame: null, state: 'idle', t: 0, wait: cfg.rocket.first, y: 0, vy: 0, baseY: 0, world: new THREE.Vector3(), emitAcc: 0 };
  const plane = { obj: null, root: null, state: 'idle', wait: cfg.plane.first, path: null, len: 0, s: 0, rest: null, yaw: 0, roll: 0, emitAcc: 0, dust: 0 };
  const particles = createParticles(scene, 90);
  let reduce = reduceQuery.matches;
  reduceQuery.addEventListener?.('change', (e) => {
    reduce = e.matches;
    if (reduce) resetAll();
  });

  const SMOKE = '#f4f6f8';
  const SMOKE_END = '#b9c4cc';
  const WARM = '#ffd08a';

  // ---- registration (called by ambient.addProp for every rocket_* / craft_* placement) ----
  function addPart(obj, placement, isl) {
    const name = placement.m.split('/')[1];
    const root = islandRoots.get(isl.id);
    if (/^rocket_/.test(name)) {
      if (!rocket.group) {
        rocket.group = new THREE.Group();
        rocket.group.position.set(obj.position.x, 0, obj.position.z);
        rocket.root = root;
        root.add(rocket.group);
        rocket.flame = createFlame();
        rocket.group.add(rocket.flame);
        rocket.baseY = obj.position.y; // the base piece is the first one placed: its y is the pad top
        rocket.flame.position.y = rocket.baseY + 0.08;
      }
      obj.position.set(0, obj.position.y, 0);
      rocket.group.add(obj);
      return true;
    }
    if (/^craft_/.test(name) && !plane.obj) {
      plane.obj = obj;
      plane.root = root;
      plane.rest = { pos: obj.position.clone(), yaw: obj.rotation.y };
      obj.rotation.order = 'YXZ';
      return true;
    }
    return false;
  }

  function resetAll() {
    particles.clear();
    if (rocket.group) {
      rocket.group.visible = true;
      rocket.group.position.y = 0;
      rocket.group.rotation.set(0, 0, 0);
      rocket.flame.visible = false;
    }
    rocket.state = 'idle';
    rocket.wait = rnd(...cfg.rocket.idle);
    if (plane.obj) {
      plane.obj.position.copy(plane.rest.pos);
      plane.obj.rotation.set(0, plane.rest.yaw, 0);
    }
    plane.state = 'idle';
    plane.wait = rnd(...cfg.plane.idle);
  }

  // ---- helpers ----
  const worldOf = (root, local, out) => out.set(root.position.x + local.x, root.position.y + local.y, root.position.z + local.z);
  const tmpV = new THREE.Vector3();
  const tmpL = new THREE.Vector3();

  function groundPuffs(wx, wy, wz, n, speed, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * rnd(0.5, 1);
      particles.emit(wx + Math.cos(a) * 0.3, wy + rnd(0.1, 0.4), wz + Math.sin(a) * 0.3, Math.cos(a) * sp, rnd(0.1, 0.5), Math.sin(a) * sp, rnd(1.2, 2.0), size * 0.5, size * rnd(1.2, 1.9), 0.8, WARM, SMOKE_END);
    }
  }

  // ---- rocket ----
  function setFlame(intensity, t) {
    const f = rocket.flame;
    if (intensity <= 0.01) {
      f.visible = false;
      return;
    }
    f.visible = true;
    const fl = 0.88 + 0.22 * Math.sin(t * 61) * Math.sin(t * 37 + 1.3);
    f.userData.outer.scale.set(0.7 + 0.5 * intensity, intensity * fl, 0.7 + 0.5 * intensity);
    f.userData.inner.scale.set(0.7 + 0.5 * intensity, intensity * (0.85 + 0.3 * Math.sin(t * 83)), 0.7 + 0.5 * intensity);
  }

  function updateRocket(dt, t) {
    const g = rocket.group;
    if (!g) return;
    const R = cfg.rocket;
    rocket.t += dt;
    const base = worldOf(rocket.root, tmpL.set(g.position.x, g.position.y + rocket.baseY, g.position.z), rocket.world);
    switch (rocket.state) {
      case 'idle':
        rocket.wait -= dt;
        if (rocket.wait <= 0) {
          rocket.state = 'countdown';
          rocket.t = 0;
        }
        break;
      case 'countdown': {
        const k = rocket.t / R.countdown;
        const shake = smooth((k - 0.2) / 0.8) * 0.014;
        g.rotation.z = Math.sin(t * 52) * shake;
        g.rotation.x = Math.sin(t * 47 + 1) * shake;
        const ign = smooth((k - 0.6) / 0.4);
        setFlame(ign * 0.55, t);
        rocket.emitAcc += dt * (k > 0.35 ? 22 : 0);
        while (rocket.emitAcc >= 1) {
          rocket.emitAcc -= 1;
          groundPuffs(base.x, base.y, base.z, 1, 1.6 + 2 * k, 0.9);
        }
        if (rocket.t >= R.countdown) {
          rocket.state = 'ascend';
          rocket.t = 0;
          rocket.vy = 0.3;
          g.rotation.set(0, 0, 0);
          groundPuffs(base.x, base.y, base.z, 14, 3.4, 1.4);
        }
        break;
      }
      case 'ascend': {
        rocket.vy += R.accel * dt;
        g.position.y += rocket.vy * dt;
        setFlame(1, t);
        g.rotation.z = Math.sin(t * 40) * 0.004;
        const h = g.position.y;
        if (h < 40) {
          rocket.emitAcc += dt * 26;
          while (rocket.emitAcc >= 1) {
            rocket.emitAcc -= 1;
            particles.emit(base.x + rnd(-0.2, 0.2), base.y - 0.3, base.z + rnd(-0.2, 0.2), rnd(-0.5, 0.5), -rnd(0.2, 1.2), rnd(-0.5, 0.5), rnd(1.6, 2.6), 0.7, rnd(1.6, 2.6), 0.7, '#ffd9a0', SMOKE_END);
          }
        }
        if (h < 3.5) {
          rocket.dust += dt;
          if (rocket.dust > 0.12) {
            rocket.dust = 0;
            groundPuffs(base.x, base.y - h, base.z, 3, 2.6, 1.3);
          }
        }
        if (h > R.ceiling) {
          g.visible = false;
          setFlame(0, t);
          rocket.state = 'away';
          rocket.wait = rnd(...R.away);
        }
        break;
      }
      case 'away':
        rocket.wait -= dt;
        if (rocket.wait <= 0) {
          rocket.state = 'descend';
          rocket.t = 0;
          g.visible = true;
          g.position.y = R.ceiling;
        }
        break;
      case 'descend': {
        const k = Math.min(rocket.t / R.descend, 1);
        // y = H (1 - k)^2.3: eases to zero speed exactly at touchdown (suicide burn)
        const h = R.ceiling * Math.pow(1 - k, 2.3);
        g.position.y = h;
        const burn = h < 75 ? 0.55 + 0.45 * Math.min(1, h / 30) : 0;
        setFlame(h < 0.05 ? 0 : burn, t);
        if (h < 60 && h > 1) {
          rocket.emitAcc += dt * 18;
          while (rocket.emitAcc >= 1) {
            rocket.emitAcc -= 1;
            particles.emit(base.x + rnd(-0.2, 0.2), base.y - 0.3, base.z + rnd(-0.2, 0.2), rnd(-0.4, 0.4), -rnd(0.5, 1.5), rnd(-0.4, 0.4), rnd(1.0, 1.8), 0.6, rnd(1.2, 2), 0.55, '#ffe2b0', SMOKE_END);
          }
        }
        if (h < 6) {
          rocket.dust += dt;
          if (rocket.dust > 0.07) {
            rocket.dust = 0;
            groundPuffs(base.x, base.y - h, base.z, 3, 3.2 * (1 - h / 8), 1.5);
          }
        }
        if (k >= 1) {
          g.position.y = 0;
          setFlame(0, t);
          groundPuffs(base.x, base.y, base.z, 10, 3.0, 1.4);
          rocket.state = 'settle';
          rocket.t = 0;
        }
        break;
      }
      case 'settle': {
        // small landing shudder, then rest
        const k = rocket.t / 1.6;
        g.rotation.z = Math.sin(rocket.t * 30) * 0.01 * (1 - k);
        if (k >= 1) {
          g.rotation.set(0, 0, 0);
          rocket.state = 'idle';
          rocket.wait = rnd(...R.idle);
        }
        break;
      }
    }
  }

  // ---- plane ----
  function buildPlanePath() {
    const P = cfg.plane;
    const rest = plane.rest;
    const rp = plane.root.position;
    const S = new THREE.Vector3(rp.x + rest.pos.x, rp.y + rest.pos.y, rp.z + rest.pos.z);
    const dir = new THREE.Vector3(Math.sin(rest.yaw), 0, Math.cos(rest.yaw));
    const up = new THREE.Vector3(0, 1, 0);
    const pts = [];
    const add = (v) => pts.push(v);
    add(S.clone());
    add(S.clone().addScaledVector(dir, 2.5).addScaledVector(up, 1.4));
    add(S.clone().addScaledVector(dir, 9).addScaledVector(up, 4.5));
    // ring around the map, direction and phase picked per flight
    const cw = Math.random() < 0.5 ? 1 : -1;
    const [cx, cz] = P.center;
    const start = Math.atan2((S.z + dir.z * 9 - cz) / P.rz, (S.x + dir.x * 9 - cx) / P.rx);
    const phase = rnd(0, Math.PI * 2);
    const steps = 12;
    const sweep = Math.PI * 2 * 0.93;
    for (let i = 1; i <= steps; i++) {
      const a = start + cw * (i / steps) * sweep;
      const hh = (P.altitude[0] + P.altitude[1]) / 2 + Math.sin(a * 2 + phase) * (P.altitude[1] - P.altitude[0]) * 0.5;
      add(new THREE.Vector3(cx + Math.cos(a) * P.rx, hh, cz + Math.sin(a) * P.rz));
    }
    // final approach along the pad heading, descending
    add(S.clone().addScaledVector(dir, -34).setY(S.y + 11));
    add(S.clone().addScaledVector(dir, -15).setY(S.y + 4.6));
    add(S.clone().addScaledVector(dir, -5).setY(S.y + 1.2));
    add(S.clone());
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    curve.arcLengthDivisions = 800;
    plane.path = curve;
    plane.len = curve.getLength();
    plane.s = 0;
    plane.roll = 0;
    plane.yaw = rest.yaw;
    plane.S = S;
  }

  const tan = new THREE.Vector3();
  const pos = new THREE.Vector3();
  function updatePlane(dt, t) {
    if (!plane.obj) return;
    const P = cfg.plane;
    if (plane.state === 'idle') {
      plane.wait -= dt;
      if (plane.wait <= 0) {
        buildPlanePath();
        plane.state = 'fly';
        plane.emitAcc = 0;
      }
      return;
    }
    const L = plane.len;
    const ramp = 16;
    const v = P.speed * Math.min(1, 0.2 + 0.8 * smooth(plane.s / ramp), 0.2 + 0.8 * smooth((L - plane.s) / ramp));
    plane.s = Math.min(L, plane.s + v * dt);
    const u = plane.s / L;
    plane.path.getPointAt(u, pos);
    plane.path.getTangentAt(Math.min(u, 0.999), tan);
    const yaw = Math.atan2(tan.x, tan.z);
    const dy = ((yaw - plane.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const rate = dy / Math.max(dt, 1e-4);
    plane.yaw += dy;
    const targetRoll = clamp(-rate * 1.4, -0.65, 0.65);
    plane.roll += (targetRoll - plane.roll) * (1 - Math.exp(-4 * dt));
    const o = plane.obj;
    o.position.set(pos.x - plane.root.position.x, pos.y - plane.root.position.y, pos.z - plane.root.position.z);
    o.rotation.set(-Math.asin(clamp(tan.y, -0.7, 0.7)), plane.yaw, plane.roll);
    // contrail / dust
    plane.emitAcc += dt * 9;
    while (plane.emitAcc >= 1) {
      plane.emitAcc -= 1;
      const low = pos.y - plane.S.y < 3;
      particles.emit(pos.x - tan.x * 0.9, pos.y - 0.05, pos.z - tan.z * 0.9, rnd(-0.1, 0.1), low ? rnd(0.1, 0.4) : 0.05, rnd(-0.1, 0.1), low ? rnd(0.9, 1.4) : rnd(1.6, 2.4), 0.3, low ? 1.1 : 0.8, low ? 0.6 : 0.4, low ? '#ffe9c8' : '#ffffff', low ? SMOKE_END : '#dce8f0');
    }
    if (plane.s >= L) {
      o.position.copy(plane.rest.pos);
      o.rotation.set(0, plane.rest.yaw, 0);
      groundPuffs(plane.S.x, plane.S.y, plane.S.z, 6, 1.8, 0.9);
      plane.state = 'idle';
      plane.wait = rnd(...P.idle);
    }
  }

  return {
    addPart,
    update(dt, t) {
      if (reduce) return;
      updateRocket(dt, t);
      updatePlane(dt, t);
      particles.update(dt);
    },
    // debug / QA: force a flight now, e.g. window.app.ambient.flights.trigger('rocket')
    trigger(what) {
      if (reduce) return false;
      if (what === 'rocket' && rocket.state === 'idle') rocket.wait = 0;
      else if (what === 'plane' && plane.state === 'idle') plane.wait = 0;
      return true;
    },
    state: () => ({ rocket: rocket.state, plane: plane.state }),
  };
}
