// Stylized toon sea (GLSL ShaderMaterial, one draw call):
//   - a small "shore distance" texture is baked once at startup from the island shapes (and bridges): every texel holds
//     the distance from the sea-level waterline, so the shader knows where the shallows are,
//   - depth gradient: light turquoise shallows -> blue deeper water, plus colour patches,
//   - animated foam: solid shoreline band + broken bands that drift outwards, with a wobbling waterline,
//   - cheap vertex waves (three sines) with analytic normals, soft toon light, sun glints,
//   - noise-line caustics in the shallows, fade to the horizon colour at distance.
// Noise comes from one small tiling smooth-noise texture (no hash/sin noise, so it is safe at mediump).
import * as THREE from 'three';
import { shapeOf, bridgeSpan } from './shapes.js';

const EXTENT = 64; // shore texture covers x, z in [-EXTENT, EXTENT]
const TEX = 384; // texels per side (1/3 world unit each)
const MAX_D = 14; // distances are stored up to this value (world units)

// ---- shore distance texture -------------------------------------------------------------------
function sdSeg(x, z, ax, az, bx, bz) {
  const px = x - ax;
  const pz = z - az;
  const dx = bx - ax;
  const dz = bz - az;
  const h = Math.min(1, Math.max(0, (px * dx + pz * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - dx * h, pz - dz * h);
}

export function bakeShoreTexture(islands) {
  const shapes = islands.map((isl) => ({ isl, shape: shapeOf(isl), px: isl.position[0], pz: isl.position[1] }));
  const hub = islands[0];
  const bridges = islands.slice(1).map((isl) => {
    const b = bridgeSpan(hub, isl);
    return { ax: b.dx * b.d0, az: b.dz * b.d0, bx: b.dx * b.d1, bz: b.dz * b.d1 };
  });
  const data = new Uint8Array(TEX * TEX);
  const cell = (2 * EXTENT) / TEX;
  for (let j = 0; j < TEX; j++) {
    const z = -EXTENT + (j + 0.5) * cell;
    for (let i = 0; i < TEX; i++) {
      const x = -EXTENT + (i + 0.5) * cell;
      let d = MAX_D;
      for (const s of shapes) {
        const dx = x - s.px;
        const dz = z - s.pz;
        if (Math.hypot(dx, dz) - s.shape.bound > MAX_D) continue;
        d = Math.min(d, s.shape.water(dx, dz));
      }
      for (const b of bridges) d = Math.min(d, sdSeg(x, z, b.ax, b.az, b.bx, b.bz) - 0.8);
      data[j * TEX + i] = Math.round((Math.min(Math.max(d, 0), MAX_D) / MAX_D) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, TEX, TEX, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

// ---- tiling smooth noise texture --------------------------------------------------------------
function makeNoiseTexture() {
  const S = 256;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const out = new Float32Array(S * S);
  const octaves = [
    [4, 0.5],
    [8, 0.28],
    [16, 0.14],
    [32, 0.08],
  ];
  for (const [cells, w] of octaves) {
    const lat = new Float32Array(cells * cells).map(() => rand());
    const step = S / cells;
    for (let y = 0; y < S; y++) {
      const fy = y / step;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < S; x++) {
        const fx = x / step;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const a = lat[(y0 % cells) * cells + (x0 % cells)];
        const b = lat[(y0 % cells) * cells + ((x0 + 1) % cells)];
        const c = lat[((y0 + 1) % cells) * cells + (x0 % cells)];
        const d = lat[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
        out[y * S + x] += w * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
    }
  }
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of out) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  const data = new Uint8Array(S * S);
  for (let i = 0; i < out.length; i++) data[i] = Math.round(((out[i] - lo) / (hi - lo)) * 255);
  const tex = new THREE.DataTexture(data, S, S, THREE.RedFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

// ---- geometry: dense grid over the map, a few coarse rings out to the horizon -----------------
function makeSeaGeometry() {
  const xs = [];
  const inner = 50; // cells per side over [-EXTENT, EXTENT]
  for (let k = -inner; k <= inner; k++) xs.push((k / inner) * EXTENT);
  const outer = 30;
  const far = 600;
  const grow = Math.pow(far / EXTENT, 1 / outer);
  const pos = [];
  for (let j = 1; j <= outer; j++) pos.push(EXTENT * Math.pow(grow, j));
  const all = [...pos.slice().reverse().map((v) => -v), ...xs, ...pos];
  const n = all.length;
  const verts = new Float32Array(n * n * 3);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const o = (j * n + i) * 3;
      verts[o] = all[i];
      verts[o + 1] = 0;
      verts[o + 2] = all[j];
    }
  }
  const idx = new Uint16Array((n - 1) * (n - 1) * 6);
  let t = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      idx[t++] = a;
      idx[t++] = c;
      idx[t++] = b;
      idx[t++] = b;
      idx[t++] = c;
      idx[t++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vW;
  varying vec3 vN;
  void main() {
    vec3 p = position;
    float fade = 1.0 - smoothstep(70.0, 150.0, length(p.xz));
    float a1 = 0.075 * uAmp * fade;
    float a2 = 0.045 * uAmp * fade;
    float a3 = 0.022 * uAmp * fade;
    const vec2 d1 = vec2(0.80, 0.60);
    const vec2 d2 = vec2(-0.55, 0.83);
    const vec2 d3 = vec2(0.20, -0.98);
    float p1 = dot(d1, p.xz) * 0.55 + uTime * 0.9;
    float p2 = dot(d2, p.xz) * 0.83 + uTime * 1.15;
    float p3 = dot(d3, p.xz) * 1.25 + uTime * 1.5;
    float h = a1 * sin(p1) + a2 * sin(p2) + a3 * sin(p3);
    float c1 = a1 * 0.55 * cos(p1);
    float c2 = a2 * 0.83 * cos(p2);
    float c3 = a3 * 1.25 * cos(p3);
    vN = normalize(vec3(-(c1 * d1.x + c2 * d2.x + c3 * d3.x), 1.0, -(c1 * d1.y + c2 * d2.y + c3 * d3.y)));
    vec4 w = modelMatrix * vec4(p.x, p.y + h, p.z, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uShore;
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uMotion;
  uniform float uExtent;
  uniform float uMaxD;
  uniform vec3 uCam;
  uniform vec3 uSun;
  uniform vec3 uShallow;
  uniform vec3 uMid;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  uniform vec3 uFog;
  uniform vec2 uFogRange;
  varying vec3 vW;
  varying vec3 vN;

  float nz(vec2 p) { return texture2D(uNoise, p).r; }

  void main() {
    vec2 xz = vW.xz;
    float t = uTime;

    // distance from the waterline (0 at the shore, uMaxD in open water)
    vec2 uv = xz / (2.0 * uExtent) + 0.5;
    float d = texture2D(uShore, uv).r * uMaxD;
    vec2 edge = step(vec2(0.0), uv) * step(uv, vec2(1.0));
    d = mix(uMaxD, d, edge.x * edge.y);

    // slow wobble of the waterline so the bands are never straight
    float wob = (nz(xz * 0.045 + vec2(t * 0.006, 0.0)) - 0.5) * 1.3 + (nz(xz * 0.13 - vec2(0.0, t * 0.012)) - 0.5) * 0.5;
    float dw = d + wob * smoothstep(0.0, 2.5, d) * 0.6 * mix(0.6, 1.0, uMotion);

    // depth colour gradient + broad colour patches
    vec3 col = mix(uShallow, uMid, smoothstep(0.2, 2.6, dw));
    col = mix(col, uDeep, smoothstep(2.0, 8.0, dw));
    col += (nz(xz * 0.03 + vec2(t * 0.004, 0.0)) - 0.5) * 0.07;

    // caustic lines in the shallows (where two drifting noise fields cross)
    float c1 = nz(xz * 0.075 + vec2(t * 0.020, t * 0.012) * uMotion);
    float c2 = nz(xz * 0.062 - vec2(t * 0.016, -t * 0.021) * uMotion + 0.37);
    float caus = pow(clamp(1.0 - abs(c1 - c2) * 16.0, 0.0, 1.0), 2.0);
    col += vec3(0.55, 0.9, 0.85) * caus * (1.0 - smoothstep(0.8, 6.0, dw)) * 0.09;

    // foam: solid band at the shore + broken bands drifting outwards
    float foamLine = 1.0 - smoothstep(0.32, 0.5, dw + 0.12 * sin(t * 1.3 * uMotion + xz.x * 0.55 + xz.y * 0.4));
    float ph = dw * 0.5 - t * 0.09 * uMotion;
    float bandIdx = floor(ph);
    float f = fract(ph);
    float band = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.10, 0.19, f));
    float broken = smoothstep(0.42, 0.58, nz(xz * 0.11 + vec2(bandIdx * 0.37, t * 0.01 * uMotion)));
    band *= broken * (1.0 - smoothstep(0.8, 3.2, dw)) * step(0.7, dw);
    float foam = clamp(foamLine * 0.95 + band * 0.45, 0.0, 1.0);

    // light: soft toon shading from the wave normal + ripple detail
    vec3 N = normalize(vN + vec3(nz(xz * 0.35 + t * 0.02) - 0.5, 0.0, nz(xz * 0.31 - t * 0.017 + 0.5) - 0.5) * 0.10);
    vec3 V = normalize(uCam - vW);
    vec3 L = normalize(uSun);
    col *= 0.92 + 0.10 * dot(N, L);

    // sun glints: facets of a noise normal that line up with the sun half vector
    vec3 H = normalize(L + V);
    vec2 fq = xz * 0.5;
    vec2 fn = vec2(nz(fq + vec2(t * 0.05, 0.0) * uMotion), nz(fq * 1.13 + 0.5 - vec2(0.0, t * 0.04) * uMotion)) - 0.5;
    vec3 Nf = normalize(N + vec3(fn.x, 0.0, fn.y) * 1.9);
    float glint = smoothstep(0.9965, 0.9995, dot(Nf, H)) * (1.0 - foam);
    col += vec3(1.0, 0.98, 0.88) * glint * 0.35;
    col += vec3(1.0, 0.96, 0.8) * pow(max(dot(N, H), 0.0), 6.0) * 0.04;

    col = mix(col, uFoam, foam);

    // haze towards the horizon colour
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
    col = mix(col, uFog, fres * 0.3);
    float fog = smoothstep(uFogRange.x, uFogRange.y, distance(vW, uCam));
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
    #include <colorspace_fragment>
  }`;

export function createSea({ scene, camera, islands, seaY, horizon, sunPosition, reduceQuery }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uAmp: { value: 1 },
      uExtent: { value: EXTENT },
      uMaxD: { value: MAX_D },
      uShore: { value: bakeShoreTexture(islands) },
      uNoise: { value: makeNoiseTexture() },
      uCam: { value: camera.position },
      uSun: { value: sunPosition.clone().normalize() },
      uShallow: { value: new THREE.Color('#95f4e6') },
      uMid: { value: new THREE.Color('#3fd0e8') },
      uDeep: { value: new THREE.Color('#2190e8') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uFog: { value: new THREE.Color(horizon) },
      uFogRange: { value: new THREE.Vector2(90, 260) },
    },
    vertexShader,
    fragmentShader,
  });
  const mesh = new THREE.Mesh(makeSeaGeometry(), material);
  mesh.position.y = seaY;
  mesh.frustumCulled = false;
  scene.add(mesh);

  let time = 0;
  const applyMotion = () => {
    const reduce = reduceQuery.matches;
    material.uniforms.uMotion.value = reduce ? 0.15 : 1;
    material.uniforms.uAmp.value = reduce ? 0.3 : 1;
  };
  applyMotion();
  reduceQuery.addEventListener?.('change', applyMotion);

  return {
    mesh,
    material,
    get time() {
      return time;
    },
    update(dt) {
      time += dt * (reduceQuery.matches ? 0.25 : 1);
      material.uniforms.uTime.value = time;
    },
    setFog(near, far) {
      material.uniforms.uFogRange.value.set(near * 0.82, far);
    },
  };
}
