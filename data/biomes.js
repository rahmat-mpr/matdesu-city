// Biome presets for MatDesu City (data only). An island picks one with `biome: '<key>'` in data/islands.js.
//
//   ground / sand          grass top and beach colours of the island mesh (src/islandMesh.js)
//   rock, rockDark, rockLight, earth, earthDark   cliff, islet and underside colours
//   grid                   optional neon grid + rim line drawn on the ground (futuristic islands)
//   recolor                material name -> colour, applied to tree models on the island (e.g. pink blossom)
//   particle               key of PARTICLES: what drifts over the island (src/ambient.js)
//
// PARTICLES: falling / drifting / rising bits, one instanced mesh per kind.
//   from        'trees' = spawn under tree crowns on islands of that biome, 'island' = anywhere over the island
//   n           count (halved on phones)
//   palette     instance colours; glow = unlit (MeshBasic) so they read as light
//   size        [w, h] of the quad; fall = vertical speed range (negative = rises); y = spawn height range
//   drift       sideways wobble; windK = how much the wind carries them; spin = tumble speed range

export const BIOMES = {
  meadow: {
    ground: '#86dc5c', sand: '#f6e3b0',
    rock: '#a89983', rockDark: '#85776a', rockLight: '#c2b39a', earth: '#8a5a3c', earthDark: '#65412c',
    particle: 'leaves',
  },
  summer: {
    ground: '#5fd94a', sand: '#fff1cc',
    rock: '#b3a284', rockDark: '#8c7c64', rockLight: '#d0c09f', earth: '#93603c', earthDark: '#6a432b',
    particle: 'petals',
  },
  spring: {
    ground: '#a6e8a0', sand: '#fbe7c6',
    rock: '#b4a596', rockDark: '#8f8174', rockLight: '#cfc2b2', earth: '#8f6247', earthDark: '#674632',
    recolor: { leafsGreen: '#f7a8c8' },
    particle: 'blossom',
  },
  autumn: {
    ground: '#b9a347', sand: '#f0e2bf',
    rock: '#9d8f7f', rockDark: '#7a6d60', rockLight: '#b9aa96', earth: '#7d4a2c', earthDark: '#5a341f',
    recolor: { leafsFall: '#e8682a' },
    particle: 'autumnLeaves',
  },
  desert: {
    ground: '#e8bf72', sand: '#f6dca4',
    rock: '#c4794a', rockDark: '#9a5734', rockLight: '#dc9a66', earth: '#a8623a', earthDark: '#7c4426',
    particle: 'dust',
  },
  snow: {
    ground: '#eef5fa', sand: '#d3dde4',
    rock: '#8e99a5', rockDark: '#6b7682', rockLight: '#b4bec8', earth: '#5f6873', earthDark: '#454d57',
    particle: 'snow',
  },
  future: {
    ground: '#39445a', sand: '#9aa8ba',
    rock: '#55607a', rockDark: '#3a4358', rockLight: '#76829c', earth: '#2c3344', earthDark: '#1f2533',
    grid: { color: '#3ff2ff', step: 1.6 },
    particle: 'motes',
  },
  neon: {
    ground: '#3c3a58', sand: '#a7a3c2',
    rock: '#5c5878', rockDark: '#3f3c58', rockLight: '#7c789a', earth: '#2e2c44', earthDark: '#211f33',
    grid: { color: '#ff5ad8', step: 1.4 },
    particle: 'motes',
  },
};

export const PARTICLES = {
  leaves: {
    from: 'trees', n: 70, palette: ['#6cc24a', '#8fd14f', '#f4d03f'],
    size: [0.3, 0.22], fall: [0.45, 0.8], y: [2.2, 4.6], drift: 0.4, windK: 0.9, spin: [1.5, 4],
  },
  petals: {
    from: 'trees', n: 30, palette: ['#ff8fb1', '#ffd35c', '#ffffff'],
    size: [0.2, 0.16], fall: [0.35, 0.6], y: [2, 4], drift: 0.5, windK: 0.9, spin: [1.5, 4],
  },
  blossom: {
    from: 'trees', n: 70, palette: ['#ffc2d9', '#f7a8c8', '#ffe3ee'],
    size: [0.22, 0.18], fall: [0.3, 0.55], y: [2.2, 4.4], drift: 0.6, windK: 1.0, spin: [1.5, 4],
  },
  autumnLeaves: {
    from: 'trees', n: 110, palette: ['#e8742c', '#f2a93b', '#c94a23', '#f4d03f', '#a8521f'],
    size: [0.32, 0.24], fall: [0.45, 0.8], y: [2.2, 4.6], drift: 0.45, windK: 1.0, spin: [1.5, 4],
  },
  dust: {
    from: 'island', n: 70, palette: ['#f3d49a', '#e8bf72', '#fbe6bd'],
    size: [0.14, 0.14], fall: [0.02, 0.1], y: [0.15, 1.6], drift: 0.25, windK: 3.2, spin: [0.5, 1.5],
  },
  snow: {
    from: 'island', n: 120, palette: ['#ffffff', '#eef6ff'], glow: true,
    size: [0.12, 0.12], fall: [0.35, 0.6], y: [3, 7], drift: 0.35, windK: 0.5, spin: [0.3, 1],
  },
  motes: {
    from: 'island', n: 60, palette: ['#3ff2ff', '#9ffcff', '#ff5ad8'], glow: true,
    size: [0.1, 0.1], fall: [-0.6, -0.3], y: [0, 1.2], drift: 0.15, windK: 0.1, spin: [0.2, 0.6], top: 4.5,
  },
};
