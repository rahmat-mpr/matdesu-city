// Builds the terrain mesh of one island (single mesh, vertex colours) from its shape (src/shapes.js) and biome (data/biomes.js):
//   - sand slab + earth underside tapering below the waterline,
//   - grass slab (the island top is y = 0),
//   - terraces (raised grass ellipses with rock cliff walls), paved plaza,
//   - small rock / sand islets.
// Every slab is a polar "loft": rings of radii around a centre, walls between rings, a fan cap on top.
import * as THREE from 'three';
import { SAND_TOP, WATER_INSET, ISLET_INSET, ROCK_TOP } from './shapes.js';
import { BIOMES } from '../data/biomes.js';

const TAU = Math.PI * 2;
const col = (c) => new THREE.Color(c);
const mix = (a, b, t) => a.clone().lerp(b, t);
const shade = (c, l, s = 0) => c.clone().offsetHSL(0, s, l);


class Builder {
  constructor() {
    this.pos = [];
    this.col = [];
    this.idx = [];
  }
  vert(x, y, z, c) {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    return this.pos.length / 3 - 1;
  }
  // fan cap, normal up
  cap(cx, cz, radii, y, colorAt) {
    const n = radii.length;
    const c0 = this.vert(cx, y, cz, colorAt(0, true));
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      ring.push(this.vert(cx + Math.cos(a) * radii[i], y, cz + Math.sin(a) * radii[i], colorAt(a, false)));
    }
    for (let i = 0; i < n; i++) this.idx.push(c0, ring[(i + 1) % n], ring[i]);
  }
  // wall between an upper ring and a lower ring, outward facing
  wall(cx, cz, rA, yA, colA, rB, yB, colB) {
    const n = rA.length;
    const a = [];
    const b = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      a.push(this.vert(cx + ca * rA[i], yA, cz + sa * rA[i], colA(ang)));
      b.push(this.vert(cx + ca * rB[i], yB, cz + sa * rB[i], colB(ang)));
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.idx.push(a[i], a[j], b[i], a[j], b[j], b[i]);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

// Island body. Returns the merged geometry.
export function buildIslandGeometry(isl, shape) {
  const b = new Builder();
  const bio = BIOMES[isl.biome] ?? BIOMES.meadow;
  const grass = col(bio.ground);
  const sand = col(bio.sand);
  const ROCK = col(bio.rock);
  const ROCK_DARK = col(bio.rockDark);
  const ROCK_LIGHT = col(bio.rockLight);
  const EARTH = col(bio.earth);
  const EARTH_DARK = col(bio.earthDark);
  const N = isl.shape?.kind === 'circuit' ? 160 : 96;
  const rockyAt = shape.rockyAt;
  const rockSand = mix(sand, ROCK_LIGHT, 0.6);

  // --- sand slab + underside (contours of the sand outline, inset towards the bottom) ---
  const sand0 = shape.contour(shape.sand, 0, N);
  const sandW = shape.contour(shape.sand, -WATER_INSET, N);
  const bottomLevel = Math.max(-3.0, shape.sand(0, 0) * 0.55);
  const sandB = shape.contour(shape.sand, bottomLevel, N);
  // per-vertex colour helpers (callback gets the angle)
  const sandCol = (a) => mix(sand, rockSand, rockyAt(a));
  const earthCol = (a) => mix(EARTH, ROCK_DARK, rockyAt(a));
  const earthDeep = (a) => mix(EARTH_DARK, ROCK_DARK, rockyAt(a) * 0.8);
  b.cap(0, 0, sand0, SAND_TOP, (a) => sandCol(a));
  b.wall(0, 0, sand0, SAND_TOP, (a) => shade(sandCol(a), -0.04), sand0, -0.7, (a) => shade(sandCol(a), -0.1));
  b.wall(0, 0, sand0, -0.7, earthCol, sandW, -1.8, earthCol);
  b.wall(0, 0, sandW, -1.8, earthCol, sandB, -3.3, earthDeep);

  // --- grass slab (top at y = 0) ---
  const body0 = shape.contour(shape.body, 0, N);
  const grassWall = shade(grass, -0.13, 0.04);
  b.cap(0, 0, body0, 0, () => grass);
  b.wall(0, 0, body0, 0, (a) => mix(grassWall, ROCK_LIGHT, rockyAt(a)), body0, -0.5, (a) => mix(shade(grassWall, -0.05), ROCK, rockyAt(a)));

  // --- paved plaza ---
  if (shape.paved) {
    const r = shape.contour(shape.body, -shape.paved.inset, N);
    const pc = col(shape.paved.color);
    b.cap(0, 0, r, 0.045, () => pc);
    b.wall(0, 0, r, 0.045, () => shade(pc, -0.05), r, 0, () => shade(pc, -0.12));
  }

  // --- terraces ---
  for (const t of shape.terraces) {
    const r = shape.contour(t.sdf, 0, N, t.x, t.z);
    const cap = t.cap ? col(t.cap) : shade(grass, 0.04);
    // wall colour: rock, banded lighter at the top
    b.cap(t.x, t.z, r, t.y, () => cap);
    b.wall(t.x, t.z, r, t.y, () => ROCK_LIGHT, r, t.y * 0.45, () => ROCK);
    b.wall(t.x, t.z, r, t.y * 0.45, () => ROCK, r, 0, () => ROCK_DARK);
  }

  // --- islets ---
  for (const it of shape.islets) {
    const n = 40;
    const rim = shape.contour(it.sdf, 0, n, it.x, it.z);
    const mid = shape.contour(it.sdf, -ISLET_INSET, n, it.x, it.z);
    const low = shape.contour(it.sdf, -it.r * 0.8, n, it.x, it.z);
    if (it.kind === 'rock') {
      b.cap(it.x, it.z, rim, ROCK_TOP, () => ROCK_LIGHT);
      b.wall(it.x, it.z, rim, ROCK_TOP, () => ROCK_LIGHT, rim, -0.7, () => ROCK);
    } else {
      b.cap(it.x, it.z, rim, SAND_TOP, () => sand);
      b.wall(it.x, it.z, rim, SAND_TOP, () => shade(sand, -0.04), rim, -0.7, () => shade(sand, -0.1));
    }
    b.wall(it.x, it.z, rim, -0.7, () => (it.kind === 'rock' ? ROCK : EARTH), mid, -1.8, () => (it.kind === 'rock' ? ROCK_DARK : EARTH));
    b.wall(it.x, it.z, mid, -1.8, () => ROCK_DARK, low, -3.0, () => EARTH_DARK);
  }
  return b.geometry();
}

// Futuristic biomes: a glowing grid on the ground plus a rim line along the grass edge (unlit lines, island-local).
// Returns null for biomes without `grid`. Grid lines stop short of the edge and skip terraces; they sit on top of a paved plaza.
export function buildIslandGrid(isl, shape) {
  const grid = BIOMES[isl.biome]?.grid;
  if (!grid) return null;
  const pts = [];
  const Y = shape.paved ? 0.07 : 0.03;
  const inside = (x, z) => shape.body(x, z) < -0.35 && !shape.terraces.some((t) => t.sdf(x, z) < 0.05);
  const ext = shape.core + 1;
  const seg = 0.25;
  for (const axis of [0, 1]) {
    for (let u = -ext; u <= ext; u += grid.step) {
      for (let v = -ext; v < ext; v += seg) {
        const [x0, z0, x1, z1] = axis ? [u, v, u, v + seg] : [v, u, v + seg, u];
        if (inside(x0, z0) && inside(x1, z1)) pts.push(x0, Y, z0, x1, Y, z1);
      }
    }
  }
  const N = 96;
  const rim = shape.contour(shape.body, -0.12, N);
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * TAU;
    const a1 = ((i + 1) / N) * TAU;
    const r1 = rim[(i + 1) % N];
    pts.push(Math.cos(a0) * rim[i], Y, Math.sin(a0) * rim[i], Math.cos(a1) * r1, Y, Math.sin(a1) * r1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: grid.color, transparent: true, opacity: 0.85 }));
}
