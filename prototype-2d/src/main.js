// MatDesu City - stage 1: walkable town map only.

// ---------------------------------------------------------------------------
// Map data (stage 2 will attach interactions to these)
// Tile coordinates, 16px tiles. Each building: roof 3 rows + facade 3 rows (h = 6).
// door = tile of the door (solid); the player interacts from the tile below it.
// ---------------------------------------------------------------------------
const TILE = 16;
const MAP = {
  w: 60,
  h: 45,
  spawn: { x: 29, y: 28 },     // town square
  npcSpot: { x: 33, y: 28 },   // reserved for a future NPC
  buildings: [
    { id: 'garage',   name: 'Yes2Games Garage',  tile: { x: 1,  y: 5,  w: 7, h: 6 }, door: { x: 4,  y: 10 }, facade: 'red',    roof: 'tan'  },
    { id: 'mall',     name: 'DFactory Mall',     tile: { x: 10, y: 5,  w: 7, h: 6 }, door: { x: 13, y: 10 }, facade: 'orange', roof: 'gray' },
    { id: 'arcade',   name: 'Arcade',            tile: { x: 23, y: 5,  w: 6, h: 6 }, door: { x: 26, y: 10 }, facade: 'orange', roof: 'tan'  },
    { id: 'arvr',     name: 'AR/VR Lab (TicTech)', tile: { x: 31, y: 5, w: 6, h: 6 }, door: { x: 34, y: 10 }, facade: 'red',    roof: 'gray' },
    { id: 'studio',   name: 'Old Studio',        tile: { x: 43, y: 5,  w: 7, h: 6 }, door: { x: 46, y: 10 }, facade: 'orange', roof: 'tan'  },
    { id: 'pens',     name: 'PENS Campus',       tile: { x: 52, y: 5,  w: 7, h: 6 }, door: { x: 55, y: 10 }, facade: 'red',    roof: 'gray' },
    { id: 'post',     name: 'Post Office',       tile: { x: 6,  y: 24, w: 7, h: 6 }, door: { x: 9,  y: 29 }, facade: 'red',    roof: 'tan'  },
  ],
};

// Tile frame indices (frame = row * 27 + col) in tilemap_packed.png
const T = {
  grass: 28,
  sidewalk: 109,       // tan paving fill
  plazaFill: 117,      // gray paving fill (inside 9-slice 89)
  plazaNine: 89,       // gray with tan border, top-left of 3x3
  road: 406,
  roadDashH: 433,
  roadDashV: 462,
  waterNine: 170,      // water pool 3x3 top-left
  roofNine: { tan: 81, gray: 89 },
  // facade rows (left, mid, right = base, base+1, base+2): cornice, wall, door row
  facade: { red: [44, 71, 98], orange: [152, 179, 206] },
  window: 364,
  door: 283,
  treeTeal: [233, 260],     // [top, bottom]
  treeOrange: [314, 341],
  bush: 287,
  lamp: [169, 196],         // [top, bottom]
  bench: 250,
  trash: 253,
  mailbox: 305,
};

const WALK_SPEED = 80;
const VISIBLE_TILES_X = 22;
// character 0: [idle, walk1, walk2] per facing
const PLAYER_FRAMES = {
  down:  [24, 51, 78],
  left:  [23, 50, 77],
  up:    [25, 52, 79],
  right: [26, 53, 80],
};
const DIR_VEC = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

class TownScene extends Phaser.Scene {
  constructor() { super('town'); }

  preload() {
    this.load.image('tiles', 'assets/kenney-rpg-urban/tilemap_packed.png');
    this.load.spritesheet('urban', 'assets/kenney-rpg-urban/tilemap_packed.png', { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
    this.buildMap();
    this.createPlayer();
    this.createInput();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP.w * TILE, MAP.h * TILE);
    cam.startFollow(this.player, true);
    cam.setRoundPixels(true);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
  }

  // ----- map -------------------------------------------------------------
  buildMap() {
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MAP.w, height: MAP.h });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    const mk = (name, depth) => map.createBlankLayer(name, tileset, 0, 0, MAP.w, MAP.h).setDepth(depth);
    this.layers = {
      ground: mk('ground', 0),
      overlay: mk('overlay', 0.5),               // rounded 9-slices; transparent corners show ground below
      objects: mk('objects', 1),
      deco: mk('deco', 2),
      solid: mk('solid', 0).setVisible(false),   // collision only
      above: mk('above', 10),                    // drawn over the player
    };
    this.labels = [];

    const { ground } = this.layers;
    const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP.w && y < MAP.h;
    const put = (layer, idx, x, y) => { if (inBounds(x, y)) this.layers[layer].putTileAt(idx, x, y); };
    const block = (x, y) => put('solid', 0, x, y);
    // 3x3 style box: base = top-left frame; w,h >= 2
    const nine = (layer, base, x, y, w, h, solid) => {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const c = i === 0 ? 0 : i === w - 1 ? 2 : 1;
          const r = j === 0 ? 0 : j === h - 1 ? 2 : 1;
          put(layer, base + r * 27 + c, x + i, y + j);
          if (solid) block(x + i, y + j);
        }
      }
    };
    const rect = (layer, idx, x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(layer, idx, x, y);
    };

    // grass, sidewalks, front aprons
    rect('ground', T.grass, 0, 0, MAP.w - 1, MAP.h - 1);
    for (const x of [18, 22, 37, 41]) rect('ground', T.sidewalk, x, 0, x, MAP.h - 1);
    for (const y of [13, 17]) rect('ground', T.sidewalk, 0, y, MAP.w - 1, y);
    rect('ground', T.sidewalk, 0, 11, MAP.w - 1, 12);   // front yards of top buildings
    rect('ground', T.sidewalk, 3, 30, 17, 31);          // post office front yard

    // roads (over sidewalks, so crossings are asphalt)
    rect('ground', T.road, 19, 0, 21, MAP.h - 1);
    rect('ground', T.road, 38, 0, 40, MAP.h - 1);
    rect('ground', T.road, 0, 14, MAP.w - 1, 16);
    const vRoad = (x) => (x >= 19 && x <= 21) || (x >= 38 && x <= 40);
    for (let x = 0; x < MAP.w; x += 2) if (!vRoad(x)) put('ground', T.roadDashH, x, 15);
    for (let y = 0; y < MAP.h; y += 2) {
      if (y >= 14 && y <= 16) continue;
      put('ground', T.roadDashV, 20, y);
      put('ground', T.roadDashV, 39, y);
    }

    // town square with pool
    nine('overlay', T.plazaNine, 23, 18, 14, 15);
    rect('ground', T.plazaFill, 28, 22, 31, 24);   // under the pool's rounded corners
    nine('overlay', T.waterNine, 28, 22, 4, 3, true);

    // park paths (bottom right)
    rect('ground', T.sidewalk, 42, 30, 59, 30);
    rect('ground', T.sidewalk, 50, 18, 50, MAP.h - 1);

    // buildings
    for (const b of MAP.buildings) this.buildBuilding(b, put, nine, block);

    // props
    const tree = (x, y, parity) => {
      const t = parity ? T.treeOrange : T.treeTeal;
      put('above', t[0], x, y - 1);
      put('objects', t[1], x, y);
      block(x, y);
    };
    const lamp = (x, y) => { put('above', T.lamp[0], x, y - 1); put('objects', T.lamp[1], x, y); block(x, y); };
    const solidProp = (idx, x, y) => { put('objects', idx, x, y); block(x, y); };

    // tree rows north and south of the town, clusters elsewhere
    const northXs = [1, 4, 7, 10, 13, 16, 24, 27, 30, 33, 36, 43, 46, 49, 52, 55, 58];
    northXs.forEach((x, i) => tree(x, 2, i % 2));
    [1, 4, 7, 10, 13, 16, 24, 28, 32, 36, 44, 47, 53, 56].forEach((x, i) => tree(x, 43, i % 2));
    [2, 5, 14, 16].forEach((x, i) => tree(x, 21, i % 2));
    [2, 5, 8, 11, 14].forEach((x, i) => { tree(x, 36, i % 2); tree(x, 40, (i + 1) % 2); });
    [24, 28, 32, 36].forEach((x, i) => tree(x, 38, i % 2));
    [44, 47, 53, 56].forEach((x, i) => [21, 25, 35, 39].forEach((y, j) => tree(x, y, (i + j) % 2)));

    // street furniture
    [[9, 12], [29, 12], [49, 12]].forEach(([x, y]) => lamp(x, y));
    [[7, 12], [16, 12], [24, 12], [57, 12]].forEach(([x, y]) => solidProp(T.bench, x, y));
    solidProp(T.trash, 36, 12);
    // town square
    [[24, 20], [35, 20], [24, 31], [35, 31]].forEach(([x, y]) => lamp(x, y));
    [[28, 26], [31, 26], [26, 23], [33, 23]].forEach(([x, y]) => solidProp(T.bench, x, y));
    solidProp(T.trash, 35, 26);
    // post office
    solidProp(T.mailbox, 14, 29);
    // park
    [[49, 24], [51, 24], [49, 36], [51, 36]].forEach(([x, y]) => solidProp(T.bench, x, y));
    [[49, 29], [51, 29], [49, 31], [51, 31]].forEach(([x, y]) => lamp(x, y));
    solidProp(T.bush, 46, 30 - 2);

    this.layers.solid.setCollisionByExclusion([-1]);   // every placed marker tile collides
    this.physics.world.setBounds(0, 0, MAP.w * TILE, MAP.h * TILE);
  }

  buildBuilding(b, put, nine, block) {
    const { x, y, w, h } = b.tile;
    // roof (above layer), facade (objects), windows/door (deco)
    nine('above', T.roofNine[b.roof], x, y, w, 3, false);
    const rows = T.facade[b.facade];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < w; i++) {
        const c = i === 0 ? 0 : i === w - 1 ? 2 : 1;
        put('objects', rows[r] + c, x + i, y + 3 + r);
      }
    }
    for (let i = 1; i < w - 1; i += 2) {
      if (x + i !== b.door.x) put('deco', T.window, x + i, y + 4);
    }
    put('deco', T.door, b.door.x, b.door.y);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) block(x + i, y + j);

    const label = this.add.text((x + w / 2) * TILE, y * TILE - 3, b.name, {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', stroke: '#101018', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(20);
    this.labels.push(label);
  }

  // ----- player ----------------------------------------------------------
  createPlayer() {
    for (const dir of Object.keys(PLAYER_FRAMES)) {
      const [idle, w1, w2] = PLAYER_FRAMES[dir];
      this.anims.create({
        key: 'walk-' + dir,
        frames: [idle, w1, idle, w2].map((frame) => ({ key: 'urban', frame })),
        frameRate: 8,
        repeat: -1,
      });
    }
    this.facing = 'down';
    this.player = this.physics.add.sprite(MAP.spawn.x * TILE + 8, MAP.spawn.y * TILE + 8, 'urban', PLAYER_FRAMES.down[0]);
    this.player.setDepth(5);
    this.player.body.setSize(8, 6).setOffset(4, 10);   // feet area only
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.layers.solid);
  }

  // ----- input -----------------------------------------------------------
  createInput() {
    const k = this.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D',
    });
    this.dirKeys = { up: [k.up, k.w], down: [k.down, k.s], left: [k.left, k.a], right: [k.right, k.d] };
    this.lastDir = null;
    this.tap = null;

    this.input.on('pointerdown', (p) => {
      const pt = this.cameras.main.getWorldPoint(p.x, p.y);
      const dx = pt.x - this.player.x;
      const dy = pt.y - this.player.y;
      this.tap = {
        x: pt.x, y: pt.y,
        axes: Math.abs(dx) >= Math.abs(dy) ? ['x', 'y'] : ['y', 'x'],
        step: 0, timer: 0, lastX: this.player.x, lastY: this.player.y,
      };
    });
  }

  keyboardDir() {
    const names = Object.keys(this.dirKeys);
    for (const n of names) {
      if (this.dirKeys[n].some((key) => Phaser.Input.Keyboard.JustDown(key))) this.lastDir = n;
    }
    const held = names.filter((n) => this.dirKeys[n].some((key) => key.isDown));
    if (!held.length) return null;
    return held.includes(this.lastDir) ? this.lastDir : (held.find((n) => n === 'left' || n === 'right') || held[0]);
  }

  tapDir(delta) {
    const t = this.tap;
    const p = this.player;
    // stuck check every 0.3s: blocked on first axis -> try second axis; blocked on second -> stop
    t.timer += delta;
    if (t.timer >= 300) {
      const moved = Phaser.Math.Distance.Between(p.x, p.y, t.lastX, t.lastY);
      t.timer = 0; t.lastX = p.x; t.lastY = p.y;
      if (moved < 3) {
        t.step++;
        if (t.step >= 2) { this.tap = null; return null; }
      }
    }
    while (t.step < 2) {
      const axis = t.axes[t.step];
      const rem = axis === 'x' ? t.x - p.x : t.y - p.y;
      if (Math.abs(rem) > 2) {
        return axis === 'x' ? (rem < 0 ? 'left' : 'right') : (rem < 0 ? 'up' : 'down');
      }
      t.step++;
    }
    this.tap = null;
    return null;
  }

  update(time, delta) {
    let dir = this.keyboardDir();
    if (dir) this.tap = null;
    else if (this.tap) dir = this.tapDir(delta);

    if (dir) {
      this.facing = dir;
      this.player.setVelocity(DIR_VEC[dir][0] * WALK_SPEED, DIR_VEC[dir][1] * WALK_SPEED);
      this.player.anims.play('walk-' + dir, true);
    } else {
      this.player.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setFrame(PLAYER_FRAMES[this.facing][0]);
    }
  }

  // ----- camera ----------------------------------------------------------
  applyZoom() {
    const zoom = Math.max(2, Math.round(this.scale.width / (VISIBLE_TILES_X * TILE)));
    this.cameras.main.setZoom(zoom);
    this.labels.forEach((l) => l.setResolution(zoom));
  }
}

window.game = new Phaser.Game({   // global handle for console debugging
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#14161c',
  pixelArt: true,
  roundPixels: true,
  render: { pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: TownScene,
});
