// Island data for MatDesu City. Data only: layout, theme, shape, model placements and which content each island shows.
// Content lives in data/projects.js: `projects` are project ids, `archive` are archive ids, `section` picks an extra block
// ('profile' = Town Square profile, 'contact' = Post Office, else a key of `sections` in projects.js).
//
// Coordinates: x = east, z = south (towards the default camera), y = up. The sea surface is below y = 0;
// each island top is at y = 0 (terraces / rock islets rise above it). Placements are in island-local coordinates.
//
// Shape: `shape: { kind, ... }` is turned into an outline by src/shapes.js (see the parameter list there): oval, box,
// kidney with a bay, lobes, circuit-hugging polygon, sand spits, terraces with cliff walls, rocky shores, islets.
// `radius` is the rough grass radius (camera framing); the true bounds are computed from the shape.
//
// Placement: { m: 'kit/model', x, z, r: rotationDegrees, s: extraScale, y: extraHeight }
//   - 'kit/model' maps to assets/models/<kit>/<model>.glb
//   - every model is centred on x/z and sat on y = 0 when loaded, then scaled by KIT_SCALE[kit] * s.
//   - the height of the terrain under (x, z) (terraces, beaches, islets) is added automatically; `y` is extra.

import { buildCircuit } from './circuit.js';

// Per-kit scale so Kenney kits look proportional next to each other (world units per model unit).
export const KIT_SCALE = {
  nature: 1.6,
  racing: 2.0,
  car: 1.5,
  commercial: 2.2,
  suburban: 2.2,
  space: 1.1,
};

// n copies of one model spaced around an ellipse (rx, ry; ry defaults to rx), small deterministic variation in rotation and size.
function ring(m, n, rx, start = 0, s = 1, ry = rx) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 / n) * i) * Math.PI) / 180;
    const k = Math.abs(Math.sin((i + 1) * 12.9898 + rx)); // 0..1, stable per index
    return {
      m,
      x: Math.cos(a) * rx,
      z: Math.sin(a) * ry,
      r: Math.round(k * 360),
      s: s * (0.85 + 0.3 * k),
    };
  });
}

// shift a list of placements
const at = (list, dx, dz) => list.map((p) => ({ ...p, x: p.x + dx, z: p.z + dz }));

// Yes2Games Circuit: closed loop of Kenney racing-kit road pieces (a stadium with a squared hairpin at the west end).
// Walked from the start line heading east: start gantry, straight, two big corners (east sweep), top straight,
// two corners around a short straight (west hairpin) and back to the start.
const nsr = buildCircuit({
  tile: KIT_SCALE.racing,
  start: [2, 0],
  heading: 1,
  steps: [
    { start: true },
    { s: 2 },
    { c: 'L', size: 'larger' },
    { c: 'L', size: 'larger' },
    { s: 4 },
    { c: 'L', size: 'large' },
    { s: 2 },
    { c: 'L', size: 'large' },
  ],
});
// trees and bushes on the grass strip just outside the track (skips the bridge landing at the south middle)
const nsrTrim = nsr.path
  .map(([x, z], i) => {
    const d = Math.hypot(x, z) || 1;
    return { m: i % 6 === 0 ? 'nature/plant_bush' : 'racing/treeSmall', x: x + (x / d) * 2.5, z: z + (z / d) * 2.5, s: i % 6 === 0 ? 1.5 : 1.2, i };
  })
  .filter((p) => p.i % 3 === 0 && !(p.z > 4 && Math.abs(p.x) < 3.2))
  .map(({ i, ...p }) => p);

export const islands = [
  {
    id: 'town-square',
    name: 'Town Square',
    description:
      'Welcome! I am Rahmat Maulana Putra Rianto, a Unity game programmer. This is the hub of my portfolio.',
    position: [0, 0],
    radius: 7.5,
    seed: 0.3,
    // the hub stays a round plaza island with a generous beach (every bridge starts here)
    shape: { kind: 'blob', r: 7.5, wobble: 0.06, beach: 1.2, beachBump: { angle: 90, extra: 1.3, span: 45 } },
    theme: { grass: '#86dc5c', sand: '#f6e3b0', emoji: '\u{1F3DB}️' },
    hotspot: [0, 5.5, 0],
    section: 'profile',
    projects: [],
    archive: [],
    models: [
      { m: 'nature/path_stoneCircle', x: 0, z: 0, s: 3.4 },
      { m: 'nature/statue_obelisk', x: 0, z: 0, s: 2.4 },
      ...ring('nature/flower_redA', 8, 3.5, 0, 1.8),
      ...ring('nature/flower_yellowA', 8, 3.9, 22, 1.8),
      ...ring('nature/plant_bush', 6, 4.9, 15, 1.5),
      ...ring('nature/tree_oak', 6, 6.0, 5, 1.3),
      ...ring('nature/tree_detailed', 5, 5.5, 40, 1.2),
      { m: 'nature/sign', x: -2.2, z: 4.2, r: 20, s: 2.2 },
      { m: 'nature/statue_column', x: -5.0, z: 0.5, s: 1.4 },
      { m: 'nature/statue_column', x: 5.0, z: 0.5, s: 1.4 },
      { m: 'nature/rock_smallA', x: 2.6, z: 4.4, s: 1.8 },
      { m: 'nature/rock_smallA', x: -3.9, z: -4.2, r: 80, s: 1.6 },
    ],
  },
  {
    id: 'yes2games-circuit',
    name: 'Yes2Games Circuit',
    description: 'Featured project: NSR – Nitro Street Racing, released on Google Play and Poki.',
    featured: true,
    position: [0, -26],
    radius: 12,
    seed: 1.7,
    // land hugs the race circuit (polygon of the track centre line pushed out by `margin`)
    shape: { kind: 'circuit', margin: 3.6, wobble: 0, beach: 1.0 },
    circuit: { path: nsr.path, start: nsr.startPoint, heading: nsr.startHeading },
    theme: { grass: '#8fd860', sand: '#f2dfae', emoji: '\u{1F3CE}️' },
    hotspot: [0, 4.5, 0],
    projects: ['nsr'],
    archive: [],
    models: [
      ...nsr.models,
      // race cars: ambient.js drives them round the circuit (these are only the start positions)
      { m: 'racing/raceCarRed', x: -7, z: 5, r: 90, s: 0.65 },
      { m: 'racing/raceCarOrange', x: -9, z: 5, r: 90, s: 0.65 },
      { m: 'racing/raceCarWhite', x: -11, z: 5, r: 90, s: 0.65 },
      // pit lane: garages in the infield facing the start straight
      { m: 'racing/pitsGarage', x: -4.0, z: 2.7 },
      { m: 'racing/pitsGarage', x: -2.0, z: 2.7 },
      { m: 'racing/pitsGarage', x: 0.0, z: 2.7 },
      { m: 'racing/pitsGarage', x: 2.0, z: 2.7 },
      // grandstands: infield (open side towards the start straight and the camera); outside, facing the start straight
      { m: 'racing/grandStand', x: -3.0, z: -2.6 },
      { m: 'racing/grandStand', x: -1.0, z: -2.6 },
      { m: 'racing/grandStand', x: 1.0, z: -2.6 },
      { m: 'racing/grandStand', x: 3.0, z: -2.6 },
      { m: 'racing/grandStand', x: -3.6, z: 7.5, r: 180 },
      { m: 'racing/grandStand', x: -5.6, z: 7.5, r: 180 },
      { m: 'racing/grandStand', x: 3.6, z: 7.5, r: 180 },
      { m: 'racing/grandStand', x: 5.6, z: 7.3, r: 180 },
      { m: 'racing/flagCheckers', x: -5.1, z: 6.3 },
      { m: 'racing/flagCheckers', x: -0.9, z: 6.3 },
      { m: 'racing/bannerTowerRed', x: 5.2, z: -1.3, s: 1.2 },
      { m: 'racing/bannerTowerRed', x: 5.2, z: 1.3, s: 1.2 },
      { m: 'racing/pylon', x: -6.0, z: -1.6, s: 2 },
      { m: 'racing/pylon', x: -6.0, z: 1.6, s: 2 },
      { m: 'racing/pylon', x: 6.4, z: -2.0, s: 2 },
      { m: 'racing/pylon', x: 6.4, z: 2.0, s: 2 },
      ...nsrTrim,
    ],
  },
  {
    id: 'dfactory-plaza',
    name: 'DFactory Plaza',
    description: 'Interactive LED and touchscreen installations built at DFactory Visual.',
    position: [20.5, -17],
    radius: 6.7,
    seed: 2.9,
    // city block: rounded square with a paved plaza and a narrow quay-like beach
    shape: { kind: 'box', a: 6.9, b: 5.5, corner: 2.6, rotation: 0, beach: 0.8, paved: { inset: 1.3, color: '#d9dcd9' } },
    theme: { grass: '#7fd96b', sand: '#f7e0b5', emoji: '\u{1F6CD}️' },
    hotspot: [0, 5.5, -1],
    projects: ['disney-piano', 'adelle-score-board'],
    archive: [],
    models: [
      { m: 'commercial/building-f', x: -3.0, z: -3.0 },
      { m: 'commercial/building-a', x: -1.0, z: -3.0 },
      { m: 'commercial/building-d', x: 1.0, z: -3.0 },
      { m: 'commercial/building-h', x: 3.0, z: -3.0 },
      { m: 'commercial/building-e', x: -2.4, z: 0.8 },
      { m: 'commercial/building-c', x: 1.6, z: 0.6 },
      { m: 'commercial/detail-parasol-a', x: 3.8, z: 2.2, s: 2 },
      { m: 'commercial/detail-parasol-b', x: 2.0, z: 3.4, s: 2 },
      { m: 'commercial/detail-parasol-a', x: -1.0, z: 3.4, s: 2 },
      { m: 'commercial/detail-parasol-b', x: -3.4, z: 3.2, s: 2 },
      ...ring('nature/plant_bush', 6, 5.6, 60, 1.4, 4.1),
      ...ring('nature/flower_purpleA', 5, 4.2, 20, 1.8, 3.4),
      { m: 'nature/tree_small', x: 5.2, z: 0.0, s: 1.2 },
      { m: 'nature/tree_small', x: -5.2, z: -0.5, s: 1.2 },
    ],
  },
  {
    id: 'steam-arcade',
    name: 'Steam Arcade',
    description: 'Two Steam games I worked on as a Unity programmer.',
    position: [26, 0],
    radius: 6.2,
    seed: 4.1,
    // kidney / crescent: a sandy cove on the south side with a tiny islet in it
    shape: {
      kind: 'kidney',
      a: 7.9,
      b: 5.9,
      bay: { angle: 90, dist: 5.7, r: 3.9 },
      beach: 1.3,
      islets: [{ x: 0.4, z: 6.4, r: 0.9, kind: 'sand' }],
    },
    theme: { grass: '#92dd5a', sand: '#f8dfa8', emoji: '\u{1F579}️' },
    hotspot: [0, 5, -1],
    projects: ['magica-planta-botanica', 'school-beat'],
    archive: [],
    models: [
      { m: 'commercial/building-j', x: -1.4, z: -2.8 },
      { m: 'commercial/building-g', x: 2.2, z: -3.0 },
      { m: 'commercial/building-i', x: -3.8, z: -0.6, r: 90 },
      { m: 'commercial/building-b', x: 4.0, z: -0.4, r: -90 },
      { m: 'car/kart-oopi', x: -2.6, z: 0.9, r: 30, s: 1.1 },
      { m: 'car/kart-oodi', x: 2.6, z: 1.0, r: -40, s: 1.1 },
      { m: 'car/cone', x: 0.0, z: 0.2, s: 0.5 },
      { m: 'car/cone', x: -0.8, z: 0.6, s: 0.5 },
      { m: 'car/cone', x: 3.8, z: 0.2, s: 0.5 },
      { m: 'car/box', x: 5.0, z: 1.4, r: 20, s: 0.8 },
      { m: 'car/box', x: -5.2, z: 1.2, r: -15, s: 0.8 },
      { m: 'commercial/detail-parasol-a', x: 0.2, z: -0.6, s: 2 },
      { m: 'commercial/detail-parasol-b', x: -2.8, z: -0.4, s: 2 },
      ...ring('nature/flower_redA', 12, 4.6, 190, 1.8, 3.6).filter((p) => p.z < 0.2),
      ...ring('nature/flower_yellowA', 12, 5.2, 200, 1.8, 4.1).filter((p) => p.z < 0.2),
      { m: 'nature/tree_fat', x: 6.2, z: 0.4, s: 1.1 },
      { m: 'nature/tree_fat', x: -6.2, z: 0.2, s: 1.1 },
      { m: 'nature/tree_palm', x: 0.4, z: 6.4, s: 1.1 },
    ],
  },
  {
    id: 'ar-vr-lab',
    name: 'AR/VR Lab',
    description: 'AR and VR projects for training, education and tours.',
    position: [-19.5, -17],
    radius: 6.6,
    seed: 5.3,
    // two-step plateau with cliff walls on the north-west, low launch pads on the south-east, crystal islets
    shape: {
      kind: 'oval',
      a: 7.4,
      b: 6.6,
      wobble: 0.04,
      beach: 1.0,
      beachBump: { angle: 40, extra: 1.2, span: 35 },
      terraces: [
        { x: -1.6, z: -1.8, a: 5.3, b: 4.4, rot: -15, y: 0.85, cap: '#79d99f' },
        { x: -2.4, z: -2.6, a: 3.0, b: 2.5, rot: -15, y: 1.7, cap: '#86e0b2' },
      ],
      islets: [
        { x: -8.6, z: -2.2, r: 1.0, kind: 'rock' },
        { x: -6.0, z: -8.6, r: 0.9, kind: 'rock' },
      ],
    },
    theme: { grass: '#7ee0a8', sand: '#dff2e8', emoji: '\u{1F97D}' },
    hotspot: [0, 6, -1.5],
    projects: ['ar-magazine', 'giz-solar-vr', 'petro-360'],
    archive: ['ar-name-card', 'senalapan', 'brodo-shoes', 'ar-foundation'],
    models: [
      { m: 'space/hangar_roundGlass', x: -2.4, z: -2.6, s: 0.9 },
      { m: 'space/satelliteDish_large', x: 0.4, z: -0.4, r: 30, s: 1.4 },
      { m: 'space/machine_wireless', x: 1.8, z: 2.6, r: -20, s: 1.6 },
      // launch pad + stacked rocket (flights.js launches / lands it)
      { m: 'space/platform_large', x: 4.6, z: -0.6, s: 1.0 },
      { m: 'space/rocket_baseA', x: 4.6, z: -0.6, s: 0.7, y: 0.12 },
      { m: 'space/rocket_fuelA', x: 4.6, z: -0.6, s: 0.7, y: 1.35 },
      { m: 'space/rocket_topA', x: 4.6, z: -0.6, s: 0.7, y: 1.74 },
      // speeder pad (flights.js flies it around the map)
      { m: 'space/platform_large', x: -2.4, z: 4.0, s: 1.0 },
      { m: 'space/craft_speederA', x: -2.4, z: 4.0, r: 25, s: 0.9, y: 0.12 },
      { m: 'space/rock_crystalsLargeA', x: 3.0, z: 3.6, s: 1.6 },
      { m: 'space/rock_crystals', x: 2.6, z: -3.6, r: 40, s: 1.4 },
      { m: 'space/rock_crystals', x: -4.9, z: -0.8, r: 100, s: 1.5 },
      { m: 'space/rock_crystalsLargeB', x: -3.6, z: -5.6, r: 20, s: 1.4 },
      { m: 'space/rock_crystalsLargeA', x: -8.6, z: -2.2, s: 1.3 },
      { m: 'space/rock_crystals', x: -6.0, z: -8.6, r: 60, s: 1.3 },
      { m: 'space/rocks_smallA', x: -0.4, z: 1.8, s: 1.4 },
      { m: 'space/barrels', x: 0.6, z: 4.6, s: 1.2 },
    ],
  },
  {
    id: 'indie-street',
    name: 'Indie Street',
    description: 'Action, brawler, space shooter and visual novel games.',
    position: [18.5, 18.5],
    radius: 6.6,
    seed: 6.2,
    // elongated oval along the street, wide sandy front
    shape: {
      kind: 'oval',
      a: 8.6,
      b: 5.3,
      rotation: 0,
      wobble: 0.035,
      beach: 1.0,
      beachBump: { angle: 100, extra: 1.5, span: 40 },
      islets: [{ x: 10.6, z: 4.2, r: 1.0, kind: 'sand' }],
    },
    theme: { grass: '#8ad65e', sand: '#f4deaa', emoji: '\u{1F3AE}' },
    hotspot: [0, 4, 0],
    projects: ['unrivaled-heroes', 'haremking', 'g-project', 'worker-brawler'],
    archive: ['the-lost-lamb', 'food-tycoon'],
    models: [
      { m: 'suburban/building-type-a', x: -2.2, z: -3.0 },
      { m: 'suburban/building-type-c', x: 2.4, z: -3.0 },
      { m: 'suburban/building-type-h', x: -3.8, z: 0.8, r: 90 },
      { m: 'suburban/building-type-f', x: 3.6, z: 0.6, r: -90 },
      { m: 'suburban/planter', x: -0.2, z: -1.4, s: 1.5 },
      { m: 'suburban/fence', x: -2.1, z: 3.8 },
      { m: 'suburban/fence', x: -1.05, z: 3.8 },
      { m: 'suburban/fence', x: 0.0, z: 3.8 },
      { m: 'suburban/fence', x: 1.05, z: 3.8 },
      { m: 'suburban/fence', x: 2.1, z: 3.8 },
      ...ring('nature/tree_default', 4, 7.0, 30, 1.1, 3.9),
      ...ring('nature/tree_oak', 3, 6.6, 200, 1.1, 3.6),
      { m: 'nature/stump_round', x: 0.8, z: 2.0, s: 1.5 },
      ...ring('nature/flower_yellowA', 5, 2.4, 0, 1.8),
      { m: 'nature/tree_palmBend', x: 10.6, z: 4.2, s: 1.1 },
    ],
  },
  {
    id: 'post-office',
    name: 'Post Office',
    description: 'Get in touch: contact details, LinkedIn and my classic portfolio.',
    position: [0, 25],
    radius: 5.4,
    seed: 7.4,
    // small round island with a long curved sand spit to the east, rock islets
    shape: {
      kind: 'blob',
      r: 5.0,
      wobble: 0.05,
      beach: 0.9,
      spits: [{ angle: 12, from: 3.2, length: 9.0, width: 2.4, bend: -28 }],
      islets: [
        { x: -4.8, z: 5.6, r: 1.0, kind: 'rock' },
        { x: 8.2, z: -4.0, r: 0.8, kind: 'rock' },
      ],
    },
    theme: { grass: '#a0e268', sand: '#f6e1b3', emoji: '✉️' },
    hotspot: [0, 4, 0],
    section: 'contact',
    projects: [],
    archive: [],
    models: [
      { m: 'suburban/building-type-m', x: 0, z: -1.2 },
      { m: 'nature/sign', x: -2.0, z: 2.4, r: 15, s: 2.2 },
      { m: 'car/box', x: 2.0, z: 2.4, r: -10, s: 0.5 },
      { m: 'suburban/planter', x: -1.2, z: 0.9, s: 1.5 },
      { m: 'suburban/planter', x: 1.2, z: 0.9, s: 1.5 },
      ...ring('nature/flower_redA', 5, 3.3, 20, 1.8),
      ...ring('nature/tree_oak', 4, 4.0, 30, 1.1),
      { m: 'nature/plant_bush', x: -3.4, z: 0.8, s: 1.5 },
      { m: 'nature/plant_bush', x: 3.4, z: 0.4, s: 1.5 },
      // spit: palms and a canoe
      { m: 'nature/tree_palm', x: 6.2, z: 1.2, s: 1.1 },
      { m: 'nature/tree_palmTall', x: 9.4, z: 1.4, s: 1.0 },
      { m: 'nature/canoe', x: 7.8, z: 2.1, r: 100, s: 1.0 },
      { m: 'nature/rock_largeA', x: -4.8, z: 5.6, s: 1.2 },
      { m: 'nature/rock_tallD', x: 8.2, z: -4.0, s: 1.1 },
    ],
  },
  {
    id: 'animation-studio',
    name: 'Animation Studio',
    description: 'Spine 2D character animation, plus early game work.',
    position: [-26, 0],
    radius: 6.6,
    seed: 9.8,
    // two lobes joined by a neck (the bridge lands in the waist on the east side)
    shape: {
      kind: 'lobes',
      lobes: [
        { x: -0.6, z: -4.35, r: 4.4 },
        { x: 0.6, z: 4.35, r: 4.2 },
      ],
      smooth: 2.0,
      wobble: 0.03,
      beach: 1.1,
    },
    theme: { grass: '#9be06a', sand: '#fbe3b8', emoji: '\u{1F3A8}' },
    hotspot: [0, 4, 0],
    projects: ['chef-story', 'virgo-sparkling'],
    archive: ['mojiken-vn', 'yumi'],
    models: [
      { m: 'racing/tentLong', x: -0.6, z: -6.2 },
      { m: 'racing/tent', x: -2.8, z: -4.1, r: 60 },
      { m: 'racing/tentClosed', x: 1.8, z: -4.1, r: -60 },
      { m: 'racing/tentClosed', x: -2.2, z: 4.5, r: 120 },
      { m: 'racing/tent', x: 2.8, z: 4.5, r: -120 },
      { m: 'racing/tentLong', x: 0.6, z: 6.5, r: 180 },
      { m: 'car/kart-ooli', x: 0.4, z: -2.4, r: 30, s: 1.2 },
      { m: 'racing/flagGreen', x: -1.8, z: -2.4, s: 1.4 },
      { m: 'racing/flagRed', x: 2.2, z: -2.4, s: 1.4 },
      { m: 'racing/bannerTowerGreen', x: -1.6, z: 2.6, s: 1.3 },
      { m: 'racing/bannerTowerGreen', x: 1.6, z: 2.8, s: 1.3 },
      ...at(ring('nature/flower_redA', 5, 1.5, 0, 1.8), -0.6, -4.35),
      ...at(ring('nature/flower_purpleA', 5, 1.5, 30, 1.8), 0.6, 4.35),
      { m: 'nature/tree_fat', x: -3.4, z: -6.4, s: 1.1 },
      { m: 'nature/tree_fat', x: 2.2, z: -6.6, s: 1.1 },
      { m: 'nature/tree_fat', x: -2.8, z: 6.4, s: 1.1 },
      { m: 'nature/tree_fat', x: 3.4, z: 6.0, s: 1.1 },
      { m: 'nature/sign', x: -0.4, z: 1.5, r: 10, s: 2.0 },
    ],
  },
  {
    id: 'pens-campus',
    name: 'PENS Campus',
    description: 'Where I studied game technology, and a Gameseed 2023 grand finalist.',
    position: [-18.5, 18.5],
    radius: 6.3,
    seed: 8.6,
    // rocky headland: a tall cliff ledge and rock shore on the west, campus on the lower east side
    shape: {
      kind: 'oval',
      a: 6.9,
      b: 6.0,
      rotation: 20,
      wobble: 0.05,
      beach: 0.9,
      rocky: [{ from: 135, to: 255 }],
      terraces: [{ x: -4.4, z: 0.6, a: 2.7, b: 4.4, rot: 0, y: 1.5, cap: '#8fcf7b' }],
      islets: [
        { x: -8.6, z: 2.4, r: 1.1, kind: 'rock' },
        { x: -7.4, z: -4.4, r: 0.8, kind: 'rock' },
      ],
    },
    theme: { grass: '#6fd070', sand: '#f3e0b0', emoji: '\u{1F393}' },
    hotspot: [0, 10.8, -1],
    section: 'pens',
    projects: ['distance'],
    archive: [],
    models: [
      { m: 'commercial/building-skyscraper-c', x: 0.8, z: -1.6 },
      { m: 'commercial/building-skyscraper-a', x: -0.4, z: -3.2 },
      { m: 'commercial/building-l', x: 3.6, z: -1.0 },
      { m: 'commercial/building-n', x: 1.0, z: 2.4, s: 0.7 },
      { m: 'nature/sign', x: -1.4, z: 3.6, r: 15, s: 2.0 },
      ...ring('nature/tree_oak', 5, 5.0, 50, 1.2, 4.4),
      ...ring('nature/flower_purpleA', 5, 3.5, 10, 1.8, 3.2),
      { m: 'nature/plant_bush', x: -1.6, z: 0.6, s: 1.5 },
      { m: 'nature/plant_bush', x: 4.4, z: 1.6, s: 1.5 },
      // cliff top and shore rocks
      { m: 'nature/rock_tallA', x: -5.2, z: -2.0, r: 30, s: 1.6 },
      { m: 'nature/rock_tallD', x: -4.4, z: 1.2, s: 1.7 },
      { m: 'nature/tree_pineDefaultA', x: -5.0, z: 3.0, s: 1.4 },
      { m: 'nature/rock_largeC', x: -2.0, z: 4.6, r: 80, s: 1.5 },
      { m: 'nature/rock_largeA', x: -2.4, z: -4.8, r: 10, s: 1.5 },
      { m: 'nature/rock_tallA', x: -8.6, z: 2.4, r: 100, s: 1.5 },
      { m: 'nature/rock_tallD', x: -7.4, z: -4.4, s: 1.4 },
    ],
  },
];
