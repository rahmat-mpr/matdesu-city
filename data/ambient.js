// Ambient life data for MatDesu City (data only; logic lives in src/ambient.js).
// Coordinates are island-local (x east, z south, y up), same as data/islands.js, unless a route says otherwise.

// Kenney Mini Characters used (files in assets/models/mini/character-<skin>.glb).
export const SKINS = ['male-a', 'male-c', 'male-e', 'female-b', 'female-d'];

// Walking people. Route types:
//   circle: { type, island, r, n, dir }   closed loop of n points on a circle of radius r around the island centre
//   bridge: { type, to, lane }            hub <-> island along the wooden bridge, lane = sideways offset in world units
//   line:   { type, island, points }      ping-pong between local points
// `start` (0..1) is how far along the route the person begins, so they are spread out.
export const walkers = [
  // Town Square: loops around the obelisk, inside the flower ring
  { skin: 'male-a', route: { type: 'circle', island: 'town-square', r: 2.9, n: 14, dir: 1 }, start: 0.0 },
  { skin: 'female-b', route: { type: 'circle', island: 'town-square', r: 2.9, n: 14, dir: 1 }, start: 0.5 },
  { skin: 'male-e', route: { type: 'circle', island: 'town-square', r: 2.4, n: 12, dir: -1 }, start: 0.25 },
  // one person per bridge, walking hub -> island and back
  { skin: 'female-d', route: { type: 'bridge', to: 'yes2games-circuit', lane: 0.3 }, start: 0.2 },
  { skin: 'male-c', route: { type: 'bridge', to: 'steam-arcade', lane: -0.3 }, start: 0.7 },
  { skin: 'female-b', route: { type: 'bridge', to: 'animation-studio', lane: 0.3 }, start: 0.4 },
  { skin: 'male-a', route: { type: 'bridge', to: 'post-office', lane: -0.3 }, start: 0.1 },
  { skin: 'female-d', route: { type: 'bridge', to: 'dfactory-plaza', lane: 0.3 }, start: 0.6 },
  { skin: 'male-e', route: { type: 'bridge', to: 'ar-vr-lab', lane: -0.3 }, start: 0.3 },
  { skin: 'female-b', route: { type: 'bridge', to: 'indie-street', lane: 0.3 }, start: 0.8 },
  { skin: 'male-c', route: { type: 'bridge', to: 'pens-campus', lane: -0.3 }, start: 0.5 },
  // Indie Street: strolls along the front lane
  { skin: 'female-d', route: { type: 'line', island: 'indie-street', points: [[-3.2, 3.2], [3.2, 3.2]] }, start: 0.3 },
];

// People standing around. face = [x, z] island-local point to look at. anim: 'idle' | 'emote-yes'
export const loiterers = [
  { skin: 'female-b', island: 'town-square', at: [1.7, 0.9], face: [0, 0], anim: 'emote-yes' },
  { skin: 'male-c', island: 'town-square', at: [-1.6, -1.1], face: [0, 0], anim: 'idle' },
  { skin: 'male-a', island: 'post-office', at: [-0.55, 1.9], face: [0.55, 1.9], anim: 'emote-yes' },
  { skin: 'female-d', island: 'post-office', at: [0.55, 1.9], face: [-0.55, 1.9], anim: 'idle' },
];

// Birds: flocks circle a centre (world x, z) at a height; solo birds soar on wide loops.
// speed is angular (rad/s, negative = other way round).
export const flocks = [
  { n: 5, center: [0, -2], radius: 15, height: 12.5, speed: 0.16 },
  { n: 4, center: [-8, -14], radius: 20, height: 14, speed: -0.12 },
  { n: 3, center: [12, 14], radius: 13, height: 12, speed: 0.19 },
];
export const soarers = [
  { center: [0, 0], radius: 34, height: 16, speed: 0.07 },
  { center: [4, 6], radius: 27, height: 15, speed: -0.085 },
];

// Dolphins jump in open water; they are never started closer than (island radius + margin) to an island centre,
// or closer than bridgeMargin to a bridge.
export const dolphinZone = { half: 46, islandMargin: 5.5, bridgeMargin: 3.2 };

// Race cars on the Yes2Games island lap the closed circuit continuously (island.circuit.path is the track centre line).
// One entry per race car model on the island, in placement order. speed in world units per second, lane = sideways
// offset from the centre line (negative = left of the driving direction), start = how far round the lap they begin (0..1).
export const racing = {
  island: 'yes2games-circuit',
  cars: [
    { speed: 5.9, lane: -0.5, start: 0.0, accel: 0.9 },
    { speed: 5.5, lane: 0.5, start: 0.94, accel: 0.8 },
    { speed: 5.1, lane: -0.5, start: 0.88, accel: 0.7 },
  ],
  laneWidth: 0.55, // lane offsets used when overtaking (centre line +/- this), keeps cars on the 2 unit wide road
  passGap: 4.5, // two cars closer than this (along the track) take opposite lanes until they have separated
};

// Rocket and plane flights on the AR/VR Lab island (see src/flights.js). Times in seconds, distances in world units.
//   rocket: countdown -> ascend (accel in units/s^2) until `ceiling` -> out of view for `away` -> descend (retro burn) -> settle -> idle
//   plane:  idle -> one banked loop on an ellipse around the map at `altitude` (centre/rx/rz in world x, z) -> lands on its pad
export const flights = {
  island: 'ar-vr-lab',
  rocket: { first: 9, idle: [22, 38], countdown: 3.4, accel: 6.5, ceiling: 110, away: [5, 9], descend: 8 },
  plane: { first: 20, idle: [35, 70], speed: 15, altitude: [11, 16], center: [0, -6], rx: 48, rz: 36 },
};
