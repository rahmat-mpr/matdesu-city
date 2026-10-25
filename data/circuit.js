// Closed-loop race circuit builder (Kenney Racing Kit road pieces). Data helper, no rendering code.
//
// The circuit is described as a list of steps walked by a "turtle" on a tile grid (1 tile = 1 model unit of the kit):
//   { s: n }                   straight of n tiles (made of roadStraightLong / roadStraight)
//   { start: true }            the start/finish gantry piece (roadStart, 2 tiles long)
//   { c: 'L' | 'R', size }     90 degree corner, size = 'small' | 'large' | 'larger' (centre-line radius 0.5 / 1.5 / 2.5 tiles)
//
// Piece geometry (measured from the GLB bounds, see CREDITS.md notes):
//   - every road piece is exactly its tile footprint (straight 1x1 or 1x2, corner (r+0.5) square), road is 1 tile wide;
//   - a corner model connects its south edge to its east edge (road centre 0.5 tile in from the outer edge);
//   - roadStart is 0.26 tile wider than its tile (gantry post), so its bounds centre is shifted by -0.13 tile in x.
//
// Output (island-local world units, x east, z south): model placements, the closed centre-line polygon, and a
// converter from circuit tile coordinates to island-local coordinates (used to place grandstands, pits ...).

const HEAD = [
  [0, -1], // N
  [1, 0], // E
  [0, 1], // S
  [-1, 0], // W
];
const RADIUS = { small: 0.5, large: 1.5, larger: 2.5 };
const CORNER = { small: 'racing/roadCornerSmall', large: 'racing/roadCornerLarge', larger: 'racing/roadCornerLarger' };

// rotation about y as three.js does it: (x, z) -> (x cos + z sin, -x sin + z cos)
const rot = ([x, z], deg) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  return [x * c + z * s, -x * s + z * c];
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

export function buildCircuit({ tile, start = [0, 0], heading = 1, steps }) {
  let p = [...start];
  let h = heading;
  const pieces = []; // { m, cx, cz, r } in tile coordinates (cx, cz = tile footprint centre)
  const line = []; // centre line in tile coordinates

  for (const st of steps) {
    const v = HEAD[h];
    if (st.s || st.start) {
      let n = st.s ?? 2;
      const yaw = h % 2 ? 90 : 0;
      let at = 0; // tiles already laid
      if (st.start) {
        pieces.push({ m: 'racing/roadStart', cx: p[0] + v[0], cz: p[1] + v[1], r: yaw, start: true });
        at = 2;
        n = 2;
      }
      while (at < n) {
        const len = n - at >= 2 ? 2 : 1;
        pieces.push({
          m: len === 2 ? 'racing/roadStraightLong' : 'racing/roadStraight',
          cx: p[0] + v[0] * (at + len / 2),
          cz: p[1] + v[1] * (at + len / 2),
          r: yaw,
        });
        at += len;
      }
      for (let k = 0; k < n; k++) line.push([p[0] + v[0] * k, p[1] + v[1] * k]);
      p = [p[0] + v[0] * n, p[1] + v[1] * n];
    } else {
      const dir = st.c === 'R' ? 1 : -1;
      const r = RADIUS[st.size];
      const rv = HEAD[(h + 1) % 4];
      const nh = (h + dir + 4) % 4;
      const cen = [p[0] + rv[0] * dir * r, p[1] + rv[1] * dir * r];
      const box = [
        p[0] + (v[0] * (r + 0.5)) / 2 + (rv[0] * dir * (r - 0.5)) / 2,
        p[1] + (v[1] * (r + 0.5)) / 2 + (rv[1] * dir * (r - 0.5)) / 2,
      ];
      // pick the 90 degree step that maps the model's {south, east} edges onto our {back, new heading} edges
      const want = [[-v[0], -v[1]], HEAD[nh]];
      let yaw = 0;
      for (const d of [0, 90, 180, 270]) {
        const a = rot([0, 1], d);
        const b = rot([1, 0], d);
        if ((same(a, want[0]) && same(b, want[1])) || (same(a, want[1]) && same(b, want[0]))) {
          yaw = d;
          break;
        }
      }
      pieces.push({ m: CORNER[st.size], cx: box[0], cz: box[1], r: yaw });
      // arc samples (start point included, end point is the next piece's start)
      const a0 = Math.atan2(p[1] - cen[1], p[0] - cen[0]);
      const samples = st.size === 'small' ? 3 : st.size === 'large' ? 5 : 7;
      // direction of rotation in (x, z): sign from cross(back vector, forward vector)
      const e0 = [p[0] - cen[0], p[1] - cen[1]];
      const e1 = [p[0] + v[0] * r + rv[0] * dir * r - cen[0], p[1] + v[1] * r + rv[1] * dir * r - cen[1]];
      const sgn = Math.sign(e0[0] * e1[1] - e0[1] * e1[0]);
      for (let k = 0; k < samples; k++) {
        const a = a0 + sgn * (Math.PI / 2) * (k / samples);
        line.push([cen[0] + Math.cos(a) * r, cen[1] + Math.sin(a) * r]);
      }
      p = [p[0] + v[0] * r + rv[0] * dir * r, p[1] + v[1] * r + rv[1] * dir * r];
      h = nh;
    }
  }

  const closed = Math.hypot(p[0] - start[0], p[1] - start[1]) < 1e-6 && h === heading;
  if (!closed) throw new Error(`circuit does not close: ended at ${p} heading ${h}`);

  const xs = line.map((q) => q[0]);
  const zs = line.map((q) => q[1]);
  const ox = (Math.min(...xs) + Math.max(...xs)) / 2;
  const oz = (Math.min(...zs) + Math.max(...zs)) / 2;
  const tileToLocal = (tx, tz) => [(tx - ox) * tile, (tz - oz) * tile];

  // roadStart bounds are 0.26 tile wider than its tile: model-space offset of the tile centre from the bounds centre
  const models = pieces.map((pc) => {
    let [x, z] = tileToLocal(pc.cx, pc.cz);
    if (pc.start) {
      const [dx, dz] = rot([-0.13 * tile, 0], pc.r);
      x -= dx;
      z -= dz;
    }
    return { m: pc.m, x: +x.toFixed(3), z: +z.toFixed(3), r: pc.r };
  });
  const path = line.map(([tx, tz]) => tileToLocal(tx, tz).map((n) => +n.toFixed(3)));
  const startPoint = tileToLocal(start[0], start[1]);
  return { models, path, tileToLocal, startPoint, startHeading: heading };
}
