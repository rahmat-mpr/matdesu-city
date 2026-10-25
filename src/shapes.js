// Island shapes for MatDesu City: signed distance functions built from `isl.shape` (data/islands.js).
// Pure math (no three.js) so the same functions drive the island meshes, the sea shore texture, bridge ends,
// prop placement checks and the dolphin / leaf land tests.
//
// All coordinates are island-local (x east, z south). Negative distance = inside.
//
// isl.shape = {
//   kind: 'blob' | 'oval' | 'box' | 'kidney' | 'lobes' | 'circuit',
//   r | a, b, corner          size parameters of the kind (blob: r, oval: a/b, box: a/b/corner)
//   bay: { angle, dist, r }   kidney: carved cove (angle in degrees, 0 = east, 90 = south)
//   lobes: [{ x, z, r }]      lobes: circles joined by a smooth union (smooth = blend width)
//   margin                    circuit: how far the land extends beyond the track centre line
//   rotation                  degrees, rotates the whole shape
//   wobble                    outline irregularity (fraction of size)
//   beach, beachBump          sand width and an optional wider stretch { angle, extra, span } (degrees)
//   spits: [{ angle, from, length, width, bend }]   sand spits (sand only, no grass)
//   terraces: [{ x, z, a, b, rot, y, cap }]          raised ellipses clipped to the island, rock walls
//   paved: { inset, color }   thin paved plaza on top of the grass
//   rocky: [{ from, to }]     angle ranges (degrees) where the shore is rock instead of sand
//   islets: [{ x, z, r, kind }]   small rock / sand islets (kind 'rock' | 'sand')
// }

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
export const SAND_TOP = -0.13; // top of the sand slab (grass top is y = 0)
export const WATER_INSET = 0.9; // hull taper: how far inside the sand edge the island body is at sea level
export const ISLET_INSET = 0.45;
export const ROCK_TOP = 0.3;

const L = Math.hypot;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function sdEllipse(x, z, a, b) {
  const k0 = L(x / a, z / b);
  if (k0 < 1e-6) return -Math.min(a, b);
  const k1 = L(x / (a * a), z / (b * b));
  return (k0 * (k0 - 1)) / k1;
}
function sdBox(x, z, a, b, r) {
  const qx = Math.abs(x) - (a - r);
  const qz = Math.abs(z) - (b - r);
  return L(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
function sdSeg(x, z, ax, az, bx, bz) {
  const px = x - ax;
  const pz = z - az;
  const dx = bx - ax;
  const dz = bz - az;
  const h = clamp01((px * dx + pz * dz) / (dx * dx + dz * dz || 1));
  return L(px - dx * h, pz - dz * h);
}
function sdPoly(x, z, pts) {
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, az] = pts[j];
    const [bx, bz] = pts[i];
    d = Math.min(d, sdSeg(x, z, ax, az, bx, bz));
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside ? -d : d;
}
const smin = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a, b, k) => -smin(-a, -b, k);
const bump = (a, centreDeg, spanDeg) => {
  let d = Math.abs(((a / D2R - centreDeg + 540) % 360) - 180);
  d /= spanDeg;
  return Math.exp(-d * d);
};

const cache = new Map();

export function shapeOf(isl) {
  let s = cache.get(isl.id);
  if (!s) {
    s = makeShape(isl);
    cache.set(isl.id, s);
  }
  return s;
}

function makeShape(isl) {
  const sp = isl.shape ?? { kind: 'blob' };
  const kind = sp.kind ?? 'blob';
  const rot = (sp.rotation ?? 0) * D2R;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const seed = isl.seed ?? 0;
  const R = sp.r ?? isl.radius;
  const wob = sp.wobble ?? (kind === 'blob' ? 0.06 : kind === 'circuit' || kind === 'box' ? 0 : 0.03);
  const wobbleAt = (a) => wob * (0.5 * Math.sin(2 * a + seed) + 0.36 * Math.sin(3 * a + seed * 2) + 0.26 * Math.sin(5 * a + seed * 3));
  const ref = kind === 'oval' || kind === 'box' || kind === 'kidney' ? Math.min(sp.a, sp.b) : R;

  const bay = sp.bay && {
    x: Math.cos(sp.bay.angle * D2R) * sp.bay.dist,
    z: Math.sin(sp.bay.angle * D2R) * sp.bay.dist,
    r: sp.bay.r,
  };
  const path = isl.circuit?.path;

  // grass body
  const body = (x, z) => {
    const xr = x * cr + z * sr;
    const zr = -x * sr + z * cr;
    let d;
    switch (kind) {
      case 'oval':
        d = sdEllipse(xr, zr, sp.a, sp.b);
        break;
      case 'box':
        d = sdBox(xr, zr, sp.a, sp.b, sp.corner ?? 2);
        break;
      case 'kidney':
        d = sdEllipse(xr, zr, sp.a, sp.b);
        if (bay) d = smax(d, -(L(xr - bay.x, zr - bay.z) - bay.r), 1.6);
        break;
      case 'lobes': {
        d = Infinity;
        for (const l of sp.lobes) d = smin(d, L(xr - l.x, zr - l.z) - l.r, sp.smooth ?? 2.5);
        break;
      }
      case 'circuit':
        d = sdPoly(x, z, path) - (sp.margin ?? 3);
        break;
      default:
        d = L(xr, zr) - R;
    }
    return wob ? d - ref * wobbleAt(Math.atan2(zr, xr)) : d;
  };

  // beach width (bump = wider stretch of beach in one direction)
  const beach0 = sp.beach ?? 1.1;
  const bb = sp.beachBump;
  const beachAt = (x, z) => (bb ? beach0 + bb.extra * bump(Math.atan2(z, x), bb.angle, bb.span) : beach0);

  // sand spits (sand only)
  const spits = (sp.spits ?? []).map((s) => {
    const a = s.angle * D2R;
    const bend = (s.bend ?? 0) * D2R;
    const ax = Math.cos(a) * s.from;
    const az = Math.sin(a) * s.from;
    const mx = ax + Math.cos(a) * s.length * 0.5;
    const mz = az + Math.sin(a) * s.length * 0.5;
    const bx = mx + Math.cos(a + bend) * s.length * 0.5;
    const bz = mz + Math.sin(a + bend) * s.length * 0.5;
    return { ax, az, mx, mz, bx, bz, w: s.width / 2 };
  });
  const sand = (x, z) => {
    let d = body(x, z) - beachAt(x, z);
    for (const s of spits) {
      const d1 = sdSeg(x, z, s.ax, s.az, s.mx, s.mz) - s.w;
      const d2 = sdSeg(x, z, s.mx, s.mz, s.bx, s.bz) - s.w * 0.65;
      d = smin(d, Math.min(d1, d2), 0.9);
    }
    return d;
  };

  const terraces = (sp.terraces ?? []).map((t) => {
    const tr = (t.rot ?? 0) * D2R;
    const c = Math.cos(tr);
    const s = Math.sin(tr);
    return {
      ...t,
      sdf: (x, z) => {
        const px = x - t.x;
        const pz = z - t.z;
        return Math.max(body(x, z), sdEllipse(px * c + pz * s, -px * s + pz * c, t.a, t.b));
      },
    };
  });

  const islets = (sp.islets ?? []).map((it, i) => {
    const ph = seed + i * 1.7;
    const sdf = (x, z) => {
      const px = x - it.x;
      const pz = z - it.z;
      return L(px, pz) - it.r * (1 + 0.14 * Math.sin(3 * Math.atan2(pz, px) + ph));
    };
    return { ...it, kind: it.kind ?? 'rock', sdf };
  });

  const rocky = (sp.rocky ?? []).map((r) => ({ from: r.from, to: r.to }));
  const rockyAt = (a) => {
    let v = 0;
    const deg = ((a / D2R) % 360 + 360) % 360;
    for (const r of rocky) {
      const mid = (r.from + r.to) / 2;
      const half = Math.abs(r.to - r.from) / 2;
      const dd = Math.abs(((deg - mid + 540) % 360) - 180);
      v = Math.max(v, 1 - clamp01((dd - half + 12) / 24));
    }
    return v;
  };

  // distance from (cx, cz) along each of n rays to the first crossing of fn = level
  function contour(fn, level, n, cx = 0, cz = 0) {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const dx = Math.cos(a);
      const dz = Math.sin(a);
      let lo = 0;
      let hi = 0.3;
      const step = 0.3;
      let found = false;
      for (let k = 0; k < 400; k++) {
        hi = (k + 1) * step;
        if (fn(cx + dx * hi, cz + dz * hi) > level) {
          lo = k * step;
          found = true;
          break;
        }
      }
      if (!found) {
        out[i] = hi;
        continue;
      }
      for (let k = 0; k < 14; k++) {
        const mid = (lo + hi) / 2;
        if (fn(cx + dx * mid, cz + dz * mid) > level) hi = mid;
        else lo = mid;
      }
      out[i] = (lo + hi) / 2;
    }
    return out;
  }

  const edge = (angle, level = 0) => {
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    let lo = 0;
    let hi = 0.25;
    while (hi < 100 && body(dx * hi, dz * hi) <= level) {
      lo = hi;
      hi += 0.25;
    }
    for (let k = 0; k < 16; k++) {
      const mid = (lo + hi) / 2;
      if (body(dx * mid, dz * mid) > level) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  };

  const land = (x, z) => {
    let d = sand(x, z);
    for (const it of islets) d = Math.min(d, it.sdf(x, z));
    return d;
  };
  // distance from the visible shore (sand / rock edge): what the sea shader's shore texture is baked from
  const water = (x, z) => land(x, z);
  const height = (x, z) => {
    let h = 0;
    if (body(x, z) > 0) {
      for (const it of islets) if (it.sdf(x, z) < 0) return it.kind === 'rock' ? ROCK_TOP : SAND_TOP;
      return sand(x, z) < 0 ? SAND_TOP : 0;
    }
    for (const t of terraces) if (t.sdf(x, z) < -0.05) h = Math.max(h, t.y);
    return h;
  };

  // bounding values: core = grass extent (camera framing), bound = everything (dolphins, leaves)
  const probe = 120;
  const sandR = contour(sand, 0, probe);
  const bodyR = contour(body, 0, probe);
  let core = 0;
  let bound = 0;
  for (let i = 0; i < probe; i++) {
    core = Math.max(core, bodyR[i]);
    bound = Math.max(bound, sandR[i]);
  }
  for (const it of islets) bound = Math.max(bound, L(it.x, it.z) + it.r * 1.15);

  return { isl, kind, body, sand, water, land, height, contour, edge, terraces, islets, rockyAt, spits, paved: sp.paved, core, bound, beachAt };
}

// Where a bridge from the hub (island 0) to `isl` starts and ends along the straight line between the centres.
// Returns the unit direction and the distances from the hub centre (world units) where grass begins/ends.
export function bridgeSpan(hub, isl) {
  const [x, z] = isl.position;
  const dist = Math.hypot(x, z);
  const dx = x / dist;
  const dz = z / dist;
  const hubEdge = shapeOf(hub).edge(Math.atan2(dz, dx));
  const islEdge = shapeOf(isl).edge(Math.atan2(-dz, -dx));
  return { dx, dz, dist, d0: hubEdge, d1: dist - islEdge };
}
