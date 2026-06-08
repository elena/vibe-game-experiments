// ============================================================
//  DRAGON DASH  –  8-bit side-scrolling jump/dodge game
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND = H - 60;

// ── Pixel-art sprite data  (16×16 pixels, palette index array) ──────────────
// Each avatar has frames: [idle0, idle1, jump, duck0, duck1]
// Palette per avatar defined separately

const AVATARS = [
  {
    name: 'RED FLAME',
    palette: ['#00000000','#cc2200','#ff4400','#ff8800','#ffcc00','#fff8e0','#220000','#ff2244'],
    // frames: idle-A, idle-B, jump, duck-A, duck-B
    frames: [
      // idle A  (wings down)
      [
        0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,
        0,0,0,0,2,3,3,2,0,0,0,0,0,0,0,0,
        0,0,0,2,3,4,3,3,2,0,0,0,0,0,0,0,
        0,0,2,3,3,4,4,3,3,2,0,0,0,0,0,0,
        0,2,3,3,4,5,5,4,3,3,2,0,0,0,0,0,
        2,3,3,4,5,5,5,5,4,3,3,2,0,0,0,0,
        0,2,3,4,5,7,5,5,4,3,2,0,0,0,0,0,
        0,0,2,3,4,5,4,4,3,2,0,0,0,0,0,0,
        0,0,2,3,3,4,3,3,2,0,0,0,0,0,0,0,
        0,2,2,3,2,3,2,2,0,0,0,0,0,0,0,0,
        0,2,3,2,0,2,3,2,0,0,0,0,0,0,0,0,
        0,2,2,0,0,0,2,2,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      ],
      // idle B  (wings up)
      [
        0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,
        0,0,2,3,3,3,3,2,0,0,0,0,0,0,0,0,
        0,2,3,4,3,3,4,3,2,0,0,0,0,0,0,0,
        2,3,3,4,4,4,4,3,3,2,0,0,0,0,0,0,
        0,2,3,4,5,5,4,4,3,2,0,0,0,0,0,0,
        0,0,2,3,5,7,5,3,2,0,0,0,0,0,0,0,
        0,0,2,3,4,5,4,3,2,0,0,0,0,0,0,0,
        0,0,0,2,3,4,3,2,0,0,0,0,0,0,0,0,
        0,0,2,2,3,3,2,2,0,0,0,0,0,0,0,0,
        0,0,2,3,2,2,3,2,0,0,0,0,0,0,0,0,
        0,0,2,2,0,0,2,2,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      ],
      // jump  (wings back)
      [
        0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0,
        0,0,0,2,3,3,3,3,3,2,0,0,0,0,0,0,
        0,0,2,3,4,4,4,4,3,3,2,0,0,0,0,0,
        0,2,3,4,5,5,5,4,3,2,0,0,0,0,0,0,
        0,2,3,4,5,7,5,4,3,2,0,0,0,0,0,0,
        0,2,3,4,5,5,4,3,2,0,0,0,0,0,0,0,
        0,0,2,3,4,4,3,2,0,0,0,0,0,0,0,0,
        0,0,0,2,3,3,2,0,0,0,0,0,0,0,0,0,
        0,0,0,2,3,2,3,2,0,0,0,0,0,0,0,0,
        0,0,0,2,2,0,2,2,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      ],
      // duck A
      [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,2,2,0,0,0,0,2,2,0,0,0,0,0,0,0,
        0,2,3,2,2,2,2,3,2,0,0,0,0,0,0,0,
        2,3,4,3,3,3,3,4,3,2,0,0,0,0,0,0,
        2,3,4,5,5,5,5,4,3,2,0,0,0,0,0,0,
        2,3,4,5,7,5,5,4,3,2,0,0,0,0,0,0,
        0,2,3,4,5,4,3,3,2,0,0,0,0,0,0,0,
        0,0,2,3,4,3,2,0,0,0,0,0,0,0,0,0,
        0,0,2,2,3,2,2,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      ],
      // duck B
      [
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,
        0,2,2,2,3,3,2,2,2,0,0,0,0,0,0,0,
        2,3,4,3,5,5,3,4,3,2,0,0,0,0,0,0,
        2,3,4,5,5,7,5,4,3,2,0,0,0,0,0,0,
        2,3,4,5,4,5,4,3,2,0,0,0,0,0,0,0,
        0,2,3,4,3,4,3,2,0,0,0,0,0,0,0,0,
        0,0,2,3,2,3,2,0,0,0,0,0,0,0,0,0,
        0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      ],
    ],
  },
  {
    name: 'BLUE ICE',
    palette: ['#00000000','#003399','#0055cc','#0099ff','#66ccff','#e0f4ff','#001133','#ffffff'],
    frames: null, // generated below
  },
  {
    name: 'GREEN VENOM',
    palette: ['#00000000','#1a4400','#227700','#33aa00','#88dd00','#ddffd0','#001100','#ffff00'],
    frames: null,
  },
  {
    name: 'GOLD ANCIENT',
    palette: ['#00000000','#7a4800','#cc8800','#ffaa00','#ffdd44','#fffbe0','#3a1a00','#ff4400'],
    frames: null,
  },
  {
    name: 'SHADOW',
    palette: ['#00000000','#111111','#333333','#555555','#888888','#cccccc','#000000','#aa00ff'],
    frames: null,
  },
];

// Clone red dragon frames for other avatars (same shape, different palette)
for (let i = 1; i < AVATARS.length; i++) {
  AVATARS[i].frames = AVATARS[0].frames;
}

// ── Pre-render sprites to off-screen canvases ────────────────────────────────
const SCALE = 3; // sprite display scale
const SPRITE_W = 16 * SCALE;
const SPRITE_H = 16 * SCALE;

function renderSprite(frameData, palette) {
  const oc = document.createElement('canvas');
  oc.width = SPRITE_W; oc.height = SPRITE_H;
  const ox = oc.getContext('2d');
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const p = frameData[y * 16 + x];
      if (p === 0) continue;
      ox.fillStyle = palette[p];
      ox.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    }
  }
  return oc;
}

const builtSprites = AVATARS.map(av => ({
  name: av.name,
  palette: av.palette,
  idle0: renderSprite(av.frames[0], av.palette),
  idle1: renderSprite(av.frames[1], av.palette),
  jump:  renderSprite(av.frames[2], av.palette),
  duck0: renderSprite(av.frames[3], av.palette),
  duck1: renderSprite(av.frames[4], av.palette),
}));

// ── Avatar picker UI ─────────────────────────────────────────────────────────
let selectedAvatar = 0;
const avatarGrid = document.getElementById('avatar-grid');

builtSprites.forEach((sp, i) => {
  const btn = document.createElement('button');
  btn.className = 'avatar-btn' + (i === 0 ? ' selected' : '');
  btn.dataset.index = i;

  const preview = document.createElement('canvas');
  preview.width = SPRITE_W; preview.height = SPRITE_H;
  const px = preview.getContext('2d');
  px.drawImage(sp.idle0, 0, 0);

  const label = document.createElement('span');
  label.textContent = sp.name;

  btn.appendChild(preview);
  btn.appendChild(label);
  btn.addEventListener('click', () => {
    document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAvatar = i;
  });
  avatarGrid.appendChild(btn);
});

// ── Game state ────────────────────────────────────────────────────────────────
let state = 'menu'; // 'menu' | 'playing' | 'hit' | 'dead'
let score = 0;
let hiScore = 0;
let speed = 4;
let frameCount = 0;
let animFrame = 0;
let lives = 5;
const MAX_LIVES = 9;
let invincibleTimer = 0;   // frames of post-hit invincibility
const INVINCIBLE_FRAMES = 90;
let hitPauseTimer = 0;     // brief freeze on hit
const HIT_PAUSE_FRAMES = 40;
let slowTimer = 0;         // frames remaining of slowdown powerup
const SLOW_DURATION = 300; // 5 seconds at 60fps
const SLOW_MIN_SPEED = 4.0;
let treasuresCollected = 0;

// Treasures
let treasures = [];
let treasureTimer = 0;
let treasureInterval = 200;

// Player
const PLAYER_X = 80;
let playerY = GROUND;
let playerVY = 0;
let isDucking = false;
let isJumping = false;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 80; // frames between spawns

// Background layers
let bgLayers = [
  { x: 0, speed: 0.2, items: genMountains(800, 220, 0.2) },
  { x: 0, speed: 0.5, items: genCaves(800, 200, 0.5) },
];

// Particle effects
let particles = [];

// Ground scroll
let groundX = 0;

function genMountains(w, baseY, spd) {
  const pts = [];
  let x = 0;
  while (x < w + 200) {
    const h = 30 + Math.random() * 60;
    pts.push({ x, y: baseY - h, w: 40 + Math.random() * 60, h });
    x += 50 + Math.random() * 80;
  }
  return pts;
}
function genCaves(w, baseY, spd) {
  const pts = [];
  let x = 0;
  while (x < w + 200) {
    pts.push({ x, y: baseY, w: 20 + Math.random() * 40, h: 15 + Math.random() * 30 });
    x += 70 + Math.random() * 100;
  }
  return pts;
}

// ── Obstacle types ───────────────────────────────────────────────────────────
const OBSTACLE_TYPES = [
  { // rock on ground
    w: 24, h: 28, y: () => GROUND - 28,
    draw(ctx, x, y, w, h, t) {
      ctx.fillStyle = '#556677';
      ctx.fillRect(x, y + 4, w, h - 4);
      ctx.fillStyle = '#778899';
      ctx.fillRect(x + 4, y, w - 8, 6);
      ctx.fillStyle = '#99aabb';
      ctx.fillRect(x + 6, y + 2, 4, 3);
    },
    type: 'low',
  },
  { // tall spike
    w: 18, h: 40, y: () => GROUND - 40,
    draw(ctx, x, y, w, h, t) {
      ctx.fillStyle = '#884422';
      ctx.fillRect(x + 4, y + 12, w - 8, h - 12);
      ctx.fillStyle = '#cc6633';
      ctx.fillRect(x + 6, y + 4, w - 12, 12);
      ctx.fillStyle = '#ee9955';
      ctx.fillRect(x + 8, y, w - 16, 8);
    },
    type: 'low',
  },
  { // flying bat (high obstacle)
    w: 28, h: 16, y: () => GROUND - 80 - Math.random() * 30,
    draw(ctx, x, y, w, h, t) {
      const wing = Math.sin(t * 0.15) > 0 ? 1 : -1;
      ctx.fillStyle = '#220033';
      ctx.fillRect(x + 10, y + 4, 8, 8); // body
      ctx.fillStyle = '#440066';
      if (wing > 0) {
        ctx.fillRect(x, y, 10, 6);
        ctx.fillRect(x + 18, y, 10, 6);
      } else {
        ctx.fillRect(x + 2, y + 4, 8, 6);
        ctx.fillRect(x + 18, y + 4, 8, 6);
      }
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(x + 12, y + 5, 2, 2); // eye
    },
    type: 'high',
  },
  { // fire ball
    w: 20, h: 20, y: () => GROUND - 50 - Math.random() * 40,
    draw(ctx, x, y, w, h, t) {
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(x + 6, y + 2, w - 12, h - 4);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 8, y + 6, w - 16, h - 12);
      // flicker
      if (Math.floor(t / 4) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 9, y + 8, 2, 2);
      }
    },
    type: 'high',
  },
  { // double rock
    w: 44, h: 30, y: () => GROUND - 30,
    draw(ctx, x, y, w, h, t) {
      ctx.fillStyle = '#556677';
      ctx.fillRect(x, y + 6, 22, h - 6);
      ctx.fillRect(x + 22, y, 22, h);
      ctx.fillStyle = '#778899';
      ctx.fillRect(x + 2, y + 2, 16, 6);
      ctx.fillStyle = '#99aabb';
      ctx.fillRect(x + 4, y + 3, 4, 3);
    },
    type: 'low',
  },
];

function spawnObstacle() {
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  obstacles.push({
    x: W + 10,
    y: type.y(),
    w: type.w,
    h: type.h,
    draw: type.draw,
    kind: type.type,
  });
}

// ── Treasure types ────────────────────────────────────────────────────────────
const TREASURE_TYPES = [
  { // gold coin  (low, on ground)
    w: 14, h: 14, points: 50,
    y: () => GROUND - 20,
    color: '#ffcc00',
    draw(ctx, x, y, w, h, t) {
      const shine = Math.floor(t / 6) % 3;
      ctx.fillStyle = '#cc8800';
      ctx.fillRect(x + 2, y, w - 4, h);
      ctx.fillRect(x, y + 2, w, h - 4);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 3, y + 1, w - 6, h - 2);
      ctx.fillRect(x + 1, y + 3, w - 2, h - 6);
      ctx.fillStyle = shine === 0 ? '#ffffff' : '#ffee88';
      ctx.fillRect(x + 4, y + 3, 3, 3);
    },
  },
  { // gem  (mid-air)
    w: 16, h: 16, points: 150,
    y: () => GROUND - 70 - Math.random() * 30,
    color: '#00ccff',
    draw(ctx, x, y, w, h, t) {
      const pulse = Math.floor(t / 8) % 2;
      ctx.fillStyle = pulse ? '#0088cc' : '#00aaff';
      ctx.fillRect(x + 4, y, w - 8, 4);       // top point
      ctx.fillRect(x + 2, y + 4, w - 4, 6);   // middle
      ctx.fillRect(x + 4, y + 10, w - 8, 4);  // bottom
      ctx.fillStyle = '#88eeff';
      ctx.fillRect(x + 6, y + 2, 3, 3);
      ctx.fillStyle = pulse ? '#ffffff' : '#aaeeff';
      ctx.fillRect(x + 5, y + 5, 2, 2);
    },
  },
  { // treasure chest
    w: 22, h: 18, points: 300,
    y: () => GROUND - 18,
    color: '#ffaa00',
    draw(ctx, x, y, w, h, t) {
      const open = Math.floor(t / 10) % 2;
      // body
      ctx.fillStyle = '#7a4800';
      ctx.fillRect(x, y + 6, w, h - 6);
      ctx.fillStyle = '#cc8800';
      ctx.fillRect(x + 1, y + 7, w - 2, h - 8);
      // straps
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + 8, y + 7, 6, h - 8);
      ctx.fillRect(x + 1, y + 11, w - 2, 2);
      // lock
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(x + 9, y + 11, 4, 3);
      // lid
      ctx.fillStyle = '#7a4800';
      ctx.fillRect(x, y + (open ? 0 : 2), w, 6);
      ctx.fillStyle = '#cc8800';
      ctx.fillRect(x + 1, y + (open ? 1 : 3), w - 2, 4);
      // sparkles when open
      if (open) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 3, y - 4, 2, 2);
        ctx.fillRect(x + 10, y - 6, 2, 2);
        ctx.fillRect(x + 17, y - 3, 2, 2);
      }
    },
  },
  { // heart / extra life
    w: 16, h: 14, points: 0, isLife: true,
    y: () => GROUND - 60 - Math.random() * 20,
    color: '#ff4488',
    draw(ctx, x, y, w, h, t) {
      const pulse = Math.floor(t / 15) % 2;
      const s = pulse ? 1 : 0;
      ctx.fillStyle = '#cc0044';
      ctx.fillRect(x + 1 - s, y + 2 - s, 6 + s*2, 5 + s*2);
      ctx.fillRect(x + 9 - s, y + 2 - s, 6 + s*2, 5 + s*2);
      ctx.fillRect(x - s, y + 5 - s, w + s*2, 5 + s*2);
      ctx.fillRect(x + 2 - s, y + 9 - s, w - 4 + s*2, 3 + s);
      ctx.fillRect(x + 5 - s, y + 11 - s, w - 10 + s*2, 2);
      ctx.fillStyle = '#ff4488';
      ctx.fillRect(x + 2, y + 3, 3, 3);
      ctx.fillRect(x + 10, y + 3, 3, 3);
      ctx.fillStyle = '#ffaabb';
      ctx.fillRect(x + 3, y + 4, 1, 1);
    },
  },
  { // slowdown hourglass powerup
    w: 18, h: 20, points: 0, isSlow: true,
    y: () => GROUND - 55 - Math.random() * 25,
    color: '#00ffcc',
    draw(ctx, x, y, w, h, t) {
      const pulse = Math.floor(t / 10) % 2;
      const glow = pulse ? '#00ffcc' : '#00ccaa';
      // hourglass outline
      ctx.fillStyle = '#005544';
      ctx.fillRect(x + 1, y, w - 2, 3);
      ctx.fillRect(x + 1, y + h - 3, w - 2, 3);
      // top sand
      ctx.fillStyle = glow;
      ctx.fillRect(x + 3, y + 3, w - 6, 5);
      ctx.fillRect(x + 5, y + 7, w - 10, 3);
      // neck
      ctx.fillStyle = '#003333';
      ctx.fillRect(x + 8, y + 9, 2, 2);
      // bottom sand (filling up)
      const fill = Math.floor(t / 8) % 5;
      ctx.fillStyle = glow;
      ctx.fillRect(x + 5, y + h - 6 - fill, w - 10, 2 + fill);
      ctx.fillRect(x + 3, y + h - 5, w - 6, 2);
      // side pillars
      ctx.fillStyle = '#006655';
      ctx.fillRect(x, y, 3, h);
      ctx.fillRect(x + w - 3, y, 3, h);
      // sparkle
      if (pulse) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 1, 1, 1);
        ctx.fillRect(x + w - 5, y + h - 2, 1, 1);
      }
    },
  },
];

function spawnTreasure() {
  let pool = TREASURE_TYPES.filter(t => {
    if (t.isLife && lives >= MAX_LIVES) return false;
    if (t.isSlow && slowTimer > 0) return false;
    return true;
  });
  const type = pool[Math.floor(Math.random() * pool.length)];
  treasures.push({
    x: W + 10,
    y: type.y(),
    w: type.w,
    h: type.h,
    points: type.points,
    isLife: !!type.isLife,
    isSlow: !!type.isSlow,
    color: type.color,
    draw: type.draw,
    collected: false,
  });
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if ((e.code === 'Space' || e.code === 'ArrowUp') && state === 'playing') {
    tryJump();
    e.preventDefault();
  }
  if (e.code === 'ArrowDown' && state === 'playing') {
    isDucking = true;
    e.preventDefault();
  }
  if ((e.code === 'Space' || e.code === 'Enter') && state === 'dead') {
    restartGame();
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowDown') isDucking = false;
});

// Touch support
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'playing') tryJump();
  else if (state === 'dead') restartGame();
}, { passive: false });

document.getElementById('start-btn').addEventListener('click', startGame);

function tryJump() {
  if (playerY >= GROUND - 2) {
    playerVY = JUMP_FORCE;
    isJumping = true;
    spawnParticles(PLAYER_X + 20, GROUND, '#ff8800', 6);
  }
}

// ── Game lifecycle ────────────────────────────────────────────────────────────
function startGame() {
  document.getElementById('overlay').style.display = 'none';
  state = 'playing';
  resetGame();
  requestAnimationFrame(loop);
}

function resetGame() {
  score = 0;
  speed = 4;
  frameCount = 0;
  animFrame = 0;
  playerY = GROUND;
  playerVY = 0;
  isDucking = false;
  isJumping = false;
  obstacles = [];
  treasures = [];
  particles = [];
  obstacleTimer = 0;
  obstacleInterval = 90;
  treasureTimer = 0;
  treasureInterval = 200;
  lives = 5;
  invincibleTimer = 0;
  hitPauseTimer = 0;
  slowTimer = 0;
  treasuresCollected = 0;
}

function restartGame() {
  resetGame();
  state = 'playing';
}

// ── Particles ─────────────────────────────────────────────────────────────────
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 4 - 1,
      life: 20 + Math.random() * 15,
      maxLife: 20 + Math.random() * 15,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

// ── Background drawing ────────────────────────────────────────────────────────
function drawBackground() {
  // Sky gradient (pixel-art style bands)
  const bands = [
    [0,   40,  '#0a0a2a'],
    [40,  80,  '#0d0d33'],
    [80,  120, '#110d33'],
    [120, 160, '#150a2a'],
    [160, 200, '#1a0a22'],
    [200, H-60,'#1a0a1a'],
  ];
  for (const [y1, y2, c] of bands) {
    ctx.fillStyle = c;
    ctx.fillRect(0, y1, W, y2 - y1);
  }

  // Stars
  ctx.fillStyle = '#ffffff';
  const starSeed = [
    [50,20],[150,35],[270,15],[400,40],[530,10],[660,28],[740,18],
    [100,8],[300,50],[450,22],[600,38],[700,5],[20,45],[200,30],
  ];
  for (const [sx, sy] of starSeed) {
    if (Math.floor(frameCount / 30 + sx) % 2 === 0) {
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Far mountains
  ctx.fillStyle = '#1e0a3a';
  const mOff = (groundX * 0.15) % W;
  for (let pass = -1; pass <= 1; pass++) {
    const ox = pass * W - mOff;
    const mountains = [[0,160,80,60],[100,170,60,50],[180,155,100,70],[300,165,70,55],[400,150,90,65],[520,168,55,45],[620,158,80,60],[740,162,70,55]];
    for (const [mx, my, mw, mh] of mountains) {
      ctx.fillRect(ox + mx, my, mw, mh);
    }
  }

  // Mid ruins
  ctx.fillStyle = '#2a1144';
  const rOff = (groundX * 0.35) % W;
  for (let pass = -1; pass <= 1; pass++) {
    const ox = pass * W - rOff;
    const ruins = [[30,200,20,40],[60,210,14,30],[200,195,25,45],[230,205,12,35],[450,198,22,42],[480,208,16,32],[670,202,18,38]];
    for (const [rx, ry, rw, rh] of ruins) {
      ctx.fillRect(ox + rx, ry, rw, rh);
      // battlements
      for (let b = 0; b < rw; b += 6) {
        ctx.fillRect(ox + rx + b, ry - 6, 4, 6);
      }
    }
  }

  // Ground
  groundX += speed;
  const gOff = groundX % 32;
  ctx.fillStyle = '#2a1a00';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#3a2200';
  ctx.fillRect(0, GROUND, W, 4);
  // ground tiles
  ctx.fillStyle = '#4a3300';
  for (let gx = -gOff; gx < W; gx += 32) {
    ctx.fillRect(gx, GROUND + 4, 30, 2);
  }
  ctx.fillStyle = '#5a4400';
  for (let gx = -gOff + 16; gx < W; gx += 32) {
    ctx.fillRect(gx, GROUND + 8, 28, 2);
  }
}

// ── Player drawing ────────────────────────────────────────────────────────────
function drawPlayer() {
  const sp = builtSprites[selectedAvatar];
  let sprite;
  const tick = Math.floor(frameCount / 12);

  if (playerY < GROUND - 2) {
    sprite = sp.jump;
  } else if (isDucking) {
    sprite = tick % 2 === 0 ? sp.duck0 : sp.duck1;
  } else {
    sprite = tick % 2 === 0 ? sp.idle0 : sp.idle1;
  }

  const drawH = isDucking ? SPRITE_H * 0.65 : SPRITE_H;
  const drawY = playerY - drawH + (isDucking ? SPRITE_H * 0.35 : 0);

  ctx.drawImage(sprite, PLAYER_X - SPRITE_W / 2, drawY, SPRITE_W, drawH);

  // flame breath occasionally
  if (!isDucking && !isJumping && frameCount % 60 < 8) {
    const palette = builtSprites[selectedAvatar].palette;
    const flameColors = [palette[4] || '#ffcc00', palette[3] || '#ff8800', palette[2] || '#ff4400'];
    for (let f = 0; f < 3; f++) {
      ctx.fillStyle = flameColors[f % flameColors.length];
      const fw = 8 - f * 2;
      ctx.fillRect(PLAYER_X + SPRITE_W / 2 - 4 + f * 8, playerY - SPRITE_H / 2 + 4 + f * 2, fw, fw - 2);
    }
  }
}

// ── Collision detection ───────────────────────────────────────────────────────
function getPlayerBox() {
  if (isDucking) {
    return { x: PLAYER_X - SPRITE_W / 2 + 6, y: GROUND - SPRITE_H * 0.5, w: SPRITE_W - 12, h: SPRITE_H * 0.5 };
  }
  return { x: PLAYER_X - SPRITE_W / 2 + 8, y: playerY - SPRITE_H + 6, w: SPRITE_W - 16, h: SPRITE_H - 6 };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD() {
  document.getElementById('score-ui').textContent = `SCORE: ${Math.floor(score)}`;
  document.getElementById('hi-score-ui').textContent = `BEST: ${Math.floor(hiScore)}`;
  document.getElementById('speed-ui').textContent = `SPEED: ${speed.toFixed(1)}`;
  document.getElementById('treasure-ui').textContent = `LOOT: ${treasuresCollected}`;

  // Slow powerup timer bar
  if (slowTimer > 0) {
    const barW = 80;
    const barX = W / 2 - barW / 2;
    const barY = 8;
    ctx.fillStyle = '#003333';
    ctx.fillRect(barX, barY, barW, 8);
    const fill = Math.round((slowTimer / SLOW_DURATION) * barW);
    const blink = slowTimer < 90 && Math.floor(frameCount / 6) % 2 === 0;
    ctx.fillStyle = blink ? '#ffffff' : '#00ffcc';
    ctx.fillRect(barX, barY, fill, 8);
    ctx.fillStyle = '#00ffcc';
    ctx.font = '8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SLOW', W / 2, barY + 16);
    ctx.textAlign = 'left';
  }

  // Draw lives as pixel hearts on the canvas
  const heartW = 14, heartH = 12, heartGap = 3;
  const startX = W - (heartW + heartGap) * MAX_LIVES + heartGap - 4;
  const startY = 10;
  for (let i = 0; i < MAX_LIVES; i++) {
    const hx = startX + i * (heartW + heartGap);
    const hy = startY;
    if (i < lives) {
      ctx.fillStyle = '#cc0044';
      ctx.fillRect(hx + 1, hy + 2, 5, 4);
      ctx.fillRect(hx + 8, hy + 2, 5, 4);
      ctx.fillRect(hx, hy + 4, heartW, 4);
      ctx.fillRect(hx + 2, hy + 8, heartW - 4, 2);
      ctx.fillRect(hx + 4, hy + 10, heartW - 8, 2);
      ctx.fillStyle = '#ff4488';
      ctx.fillRect(hx + 2, hy + 3, 2, 2);
    } else {
      ctx.fillStyle = '#441122';
      ctx.fillRect(hx + 1, hy + 2, 5, 4);
      ctx.fillRect(hx + 8, hy + 2, 5, 4);
      ctx.fillRect(hx, hy + 4, heartW, 4);
      ctx.fillRect(hx + 2, hy + 8, heartW - 4, 2);
      ctx.fillRect(hx + 4, hy + 10, heartW - 8, 2);
    }
  }
}

// ── Death / hit screens ───────────────────────────────────────────────────────
function showHitScreen() {
  ctx.fillStyle = 'rgba(180,0,0,0.35)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff4400';
  ctx.font = 'bold 22px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('OUCH!', W / 2, H / 2 - 10);
  ctx.fillStyle = '#ffcc00';
  ctx.font = '14px Courier New';
  ctx.fillText(`LIVES REMAINING: ${lives}`, W / 2, H / 2 + 16);
  ctx.textAlign = 'left';
}

function showDeathScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ff4400';
  ctx.font = 'bold 28px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

  ctx.fillStyle = '#ffcc00';
  ctx.font = '16px Courier New';
  ctx.fillText(`SCORE: ${Math.floor(score)}   BEST: ${Math.floor(hiScore)}`, W / 2, H / 2 + 5);
  ctx.fillStyle = '#00ffcc';
  ctx.font = '13px Courier New';
  ctx.fillText(`LOOT COLLECTED: ${treasuresCollected}`, W / 2, H / 2 + 24);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '13px Courier New';
  ctx.fillText('SPACE / ENTER / TAP to restart', W / 2, H / 2 + 35);
  ctx.textAlign = 'left';
}

// ── Floating score text ───────────────────────────────────────────────────────
let floatingTexts = [];
function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 50, maxLife: 50, vy: -1.2 });
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function loop() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  if (state === 'hit') {
    // Brief pause showing "OUCH" then resume
    hitPauseTimer--;
    if (hitPauseTimer <= 0) {
      state = 'playing';
      invincibleTimer = INVINCIBLE_FRAMES;
    }
  }

  if (state === 'playing') {
    frameCount++;
    score += speed * 0.05;
    if (score > hiScore) hiScore = score;

    if (invincibleTimer > 0) invincibleTimer--;

    // Increase speed over time
    const baseSpeed = 4 + Math.floor(score / 300) * 0.5;
    speed = Math.min(baseSpeed, 12);
    if (slowTimer > 0) {
      slowTimer--;
      speed = Math.max(SLOW_MIN_SPEED, speed * 0.55);
    }

    // Spawn obstacles
    obstacleTimer++;
    const minInterval = Math.max(40, 90 - Math.floor(score / 200) * 5);
    if (obstacleTimer >= obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
      obstacleInterval = minInterval + Math.floor(Math.random() * 40);
    }

    // Spawn treasures
    treasureTimer++;
    if (treasureTimer >= treasureInterval) {
      spawnTreasure();
      treasureTimer = 0;
      treasureInterval = 160 + Math.floor(Math.random() * 120);
    }

    // Update player
    playerVY += GRAVITY;
    playerY += playerVY;
    if (playerY >= GROUND) {
      playerY = GROUND;
      playerVY = 0;
      isJumping = false;
    }

    // Update obstacles
    obstacles = obstacles.filter(o => o.x + o.w > -10);
    for (const o of obstacles) {
      o.x -= speed;
    }

    // Update treasures
    treasures = treasures.filter(t => t.x + t.w > -10 && !t.collected);
    for (const t of treasures) {
      t.x -= speed;
    }

    // Update particles
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
    }

    // Update floating texts
    floatingTexts = floatingTexts.filter(f => f.life > 0);
    for (const f of floatingTexts) {
      f.y += f.vy;
      f.life--;
    }

    const pBox = getPlayerBox();

    // Treasure collection
    for (const t of treasures) {
      const tBox = { x: t.x, y: t.y, w: t.w, h: t.h };
      if (rectsOverlap(pBox, tBox)) {
        t.collected = true;
        treasuresCollected++;
        if (t.isLife && lives < MAX_LIVES) {
          lives++;
          spawnFloatingText(t.x, t.y, '+LIFE!', '#ff4488');
          spawnParticles(t.x + t.w / 2, t.y + t.h / 2, '#ff4488', 12);
        } else if (t.isSlow) {
          slowTimer = SLOW_DURATION;
          spawnFloatingText(t.x, t.y, 'SLOW!', '#00ffcc');
          spawnParticles(t.x + t.w / 2, t.y + t.h / 2, '#00ffcc', 14);
        } else if (!t.isLife) {
          score += t.points;
          spawnFloatingText(t.x, t.y, `+${t.points}`, t.color);
          spawnParticles(t.x + t.w / 2, t.y + t.h / 2, t.color, 10);
        }
      }
    }

    // Obstacle collision (only when not invincible)
    if (invincibleTimer <= 0) {
      for (const o of obstacles) {
        const oBox = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 4 };
        if (rectsOverlap(pBox, oBox)) {
          lives--;
          spawnParticles(PLAYER_X, playerY - 20, '#ff4400', 16);
          spawnParticles(PLAYER_X, playerY - 20, '#ffcc00', 8);
          if (lives <= 0) {
            state = 'dead';
          } else {
            state = 'hit';
            hitPauseTimer = HIT_PAUSE_FRAMES;
          }
          break;
        }
      }
    }
  }

  // Draw treasures
  for (const t of treasures) {
    if (!t.collected) t.draw(ctx, t.x, t.y, t.w, t.h, frameCount);
  }

  // Draw obstacles
  for (const o of obstacles) {
    o.draw(ctx, o.x, o.y, o.w, o.h, frameCount);
  }

  // Draw particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Draw player (blink when invincible)
  const blink = invincibleTimer > 0 && Math.floor(invincibleTimer / 6) % 2 === 0;
  if (!blink) drawPlayer();

  // Draw floating score texts
  for (const f of floatingTexts) {
    ctx.globalAlpha = f.life / f.maxLife;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 13px Courier New';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  drawHUD();

  if (state === 'hit') {
    showHitScreen();
  } else if (state === 'dead') {
    showDeathScreen();
  }

  requestAnimationFrame(loop);
}
