const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 40;
const COLOR = '#535353';
const SKY_COLOR = '#f7f7f7';

// --- State ---
let state = 'idle'; // idle | running | dead
let score = 0;
let hiScore = 0;
let frameCount = 0;
let speed = 6;
let animFrame;

// --- Dino ---
const dino = {
  x: 80,
  y: GROUND_Y,
  w: 44,
  h: 48,
  vy: 0,
  gravity: 0.8,
  jumpForce: -16,
  ducking: false,
  onGround: true,
  legPhase: 0,
  // standing: 12x14 pixels * 4 = 48x56px / ducking: 16x8 pixels * 4 = 64x32px
  get hitW() { return this.ducking ? 56 : 40; },
  get hitH() { return this.ducking ? 28 : 52; },
  get hitX() { return this.x + (this.ducking ? 4 : 4); },
  get hitY() { return this.y - (this.ducking ? 28 : 52); },

  jump() {
    if (this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }
  },

  duck(on) {
    this.ducking = on;
    if (on && !this.onGround) {
      this.vy += 4; // fast fall
    }
  },

  update() {
    if (!this.onGround) {
      this.vy += this.gravity;
      this.y += this.vy;
    }
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    }
    if (this.onGround) {
      this.legPhase += speed * 0.12;
    }
  },

  draw(dead) {
    ctx.fillStyle = COLOR;
    if (this.ducking) {
      drawDucking(this.x, this.y, this.legPhase);
    } else {
      drawStanding(this.x, this.y, this.legPhase, this.onGround, dead);
    }
  }
};

// Each pixel = 4px. Dino is drawn on a 12x14 grid (48x56px total).
// Grid origin is bottom-left of the dino (x, y = ground contact point).
const S = 4; // pixel scale

// Pixel grid for standing dino (col 0 = leftmost = tail side, facing right)
// Row 0 = bottom, row 13 = top
// 1 = body, 2 = eye-white, 3 = eye
const DINO_PIXELS = [
  //0  1  2  3  4  5  6  7  8  9 10 11
  [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // row 0  (feet)
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // row 1
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // row 2
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 3  (feet tops)
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0], // row 4
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0], // row 5  (legs)
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // row 6  (body bottom)
  [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // row 7
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 8  (body mid + arm)
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 9  (body + snout)
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 10 (body + snout)
  [0, 0, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0], // row 11 (head, eye white)
  [0, 0, 1, 1, 1, 1, 1, 1, 3, 1, 0, 0], // row 12 (head, eye)
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0], // row 13 (head top)
];

// Ducking version: 16 cols x 8 rows
const DINO_DUCK_PIXELS = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
  [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // row 0 (feet)
  [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // row 1
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 2 (body low)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 3 (body)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 4 (body)
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0], // row 5 (head, eye)
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 0, 0, 0, 0], // row 6
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // row 7 (head top)
];

function drawDinoPixels(pixels, x, y, deadEye) {
  const rows = pixels.length;
  for (let row = 0; row < rows; row++) {
    const cols = pixels[row].length;
    for (let col = 0; col < cols; col++) {
      const v = pixels[row][col];
      if (v === 0) continue;
      const px = x + col * S;
      const py = y - (row + 1) * S;
      if (v === 2) {
        ctx.fillStyle = deadEye ? COLOR : SKY_COLOR;
      } else if (v === 3) {
        ctx.fillStyle = deadEye ? COLOR : COLOR;
      } else {
        ctx.fillStyle = COLOR;
      }
      ctx.fillRect(px, py, S, S);
    }
  }
  if (deadEye) {
    // Draw X over eye area
    ctx.strokeStyle = SKY_COLOR;
    ctx.lineWidth = 2;
    const ex = x + 8 * S + 2, ey = y - 12 * S;
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(ex + 8, ey + 8);
    ctx.moveTo(ex + 8, ey); ctx.lineTo(ex, ey + 8);
    ctx.stroke();
  }
}

function drawStanding(x, y, phase, moving, dead) {
  // Animate legs: swap rows 0-3 columns based on phase
  const step = Math.floor(phase / 5) % 2;
  const pixels = DINO_PIXELS.map((row, r) => [...row]);

  if (moving) {
    if (step === 0) {
      // left leg forward, right leg back
      pixels[0] = [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0];
      pixels[1] = [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
      pixels[2] = [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
      pixels[3] = [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0];
      pixels[4] = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0];
      pixels[5] = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0];
    } else {
      // right leg forward, left leg back
      pixels[0] = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0];
      pixels[1] = [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0];
      pixels[2] = [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0];
      pixels[3] = [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
      pixels[4] = [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
      pixels[5] = [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    }
  }

  drawDinoPixels(pixels, x, y, dead);
}

function drawDucking(x, y, phase) {
  const step = Math.floor(phase / 5) % 2;
  const pixels = DINO_DUCK_PIXELS.map(row => [...row]);

  if (step === 0) {
    pixels[0] = [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    pixels[1] = [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0];
  } else {
    pixels[0] = [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    pixels[1] = [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
  }

  drawDinoPixels(pixels, x, y, false);
}

// --- Obstacles ---
const obstacles = [];

const CACTUS_TYPES = [
  // [segments] each: {x, y, w, h} relative offsets
  { w: 18, h: 50, arms: [] },
  { w: 18, h: 68, arms: [{ x: -10, y: -28, w: 10, h: 20 }] },
  { w: 18, h: 68, arms: [{ x: -10, y: -28, w: 10, h: 20 }, { x: 18, y: -20, w: 10, h: 16 }] },
  { w: 34, h: 50, arms: [], double: true },
];

function spawnObstacle() {
  const type = CACTUS_TYPES[Math.floor(Math.random() * CACTUS_TYPES.length)];
  const isDouble = type.double;

  if (Math.random() < 0.2 && speed > 9) {
    // Pterodactyl
    const altitudes = [GROUND_Y - 48, GROUND_Y - 82, GROUND_Y - 110];
    const alt = altitudes[Math.floor(Math.random() * altitudes.length)];
    obstacles.push({ kind: 'ptero', x: W + 20, y: alt, w: 42, h: 32, flapPhase: 0 });
  } else {
    const count = isDouble ? 2 : (Math.random() < 0.3 ? 3 : 1);
    const cactusW = isDouble ? 36 : 18;
    for (let i = 0; i < count; i++) {
      obstacles.push({
        kind: 'cactus',
        x: W + 20 + i * (cactusW + 4),
        y: GROUND_Y,
        w: cactusW,
        h: type.h,
        arms: type.arms || []
      });
    }
  }
}

function drawCactus(obs) {
  ctx.fillStyle = COLOR;
  // Main trunk
  ctx.fillRect(obs.x + (obs.w - 10) / 2, obs.y - obs.h, 10, obs.h);
  // Top cap
  ctx.fillRect(obs.x + (obs.w - 16) / 2, obs.y - obs.h, 16, 10);
  // Arms
  for (const arm of obs.arms) {
    ctx.fillRect(obs.x + arm.x + (obs.w - 10) / 2, obs.y - obs.h + arm.y, arm.w, arm.h);
    // arm cap
    ctx.fillRect(obs.x + arm.x + (obs.w - 10) / 2, obs.y - obs.h + arm.y, arm.w, 6);
    // arm connect blob
    ctx.fillRect(obs.x + arm.x + arm.w + (obs.w - 10) / 2 - 4, obs.y - obs.h + arm.y, 6, 14);
  }
}

function drawPtero(obs) {
  ctx.fillStyle = COLOR;
  const flapUp = Math.sin(obs.flapPhase) > 0;
  const bx = obs.x, by = obs.y;
  // Body
  ctx.fillRect(bx + 10, by + 10, 22, 12);
  // Head & beak
  ctx.fillRect(bx + 28, by + 4, 14, 10);
  ctx.fillRect(bx + 40, by + 6, 8, 4);
  // Eye
  ctx.fillStyle = SKY_COLOR;
  ctx.fillRect(bx + 32, by + 6, 4, 4);
  ctx.fillStyle = COLOR;
  ctx.fillRect(bx + 33, by + 7, 2, 2);
  // Wings
  if (flapUp) {
    ctx.fillRect(bx, by, 14, 4);
    ctx.fillRect(bx + 4, by - 8, 10, 10);
    ctx.fillRect(bx + 28, by, 14, 4);
    ctx.fillRect(bx + 28, by - 8, 10, 10);
  } else {
    ctx.fillRect(bx, by + 16, 14, 4);
    ctx.fillRect(bx + 4, by + 16, 10, 10);
    ctx.fillRect(bx + 28, by + 16, 14, 4);
    ctx.fillRect(bx + 28, by + 16, 10, 10);
  }
  // Tail
  ctx.fillRect(bx + 4, by + 12, 8, 6);
  ctx.fillRect(bx, by + 16, 6, 4);
}

// --- Ground ---
const groundTiles = [];
for (let i = 0; i < 30; i++) {
  groundTiles.push({
    x: i * 28,
    type: Math.random() < 0.3 ? 1 : 0,
    size: 2 + Math.floor(Math.random() * 3)
  });
}

function drawGround() {
  ctx.fillStyle = COLOR;
  ctx.fillRect(0, GROUND_Y + 2, W, 2);
  for (const t of groundTiles) {
    if (t.type === 1) {
      ctx.fillRect(t.x, GROUND_Y + 4, t.size * 3, 2);
      ctx.fillRect(t.x + 4, GROUND_Y + 7, t.size * 2, 2);
    } else {
      ctx.fillRect(t.x, GROUND_Y + 4, t.size, 2);
    }
  }
}

function updateGround() {
  for (const t of groundTiles) {
    t.x -= speed;
    if (t.x < -40) {
      t.x += 30 * 28;
      t.type = Math.random() < 0.3 ? 1 : 0;
      t.size = 2 + Math.floor(Math.random() * 3);
    }
  }
}

// --- Clouds ---
const clouds = [];
for (let i = 0; i < 4; i++) {
  clouds.push({ x: Math.random() * W, y: 40 + Math.random() * 60, w: 60 + Math.random() * 60 });
}

function drawClouds() {
  ctx.fillStyle = COLOR;
  ctx.globalAlpha = 0.15;
  for (const c of clouds) {
    ctx.fillRect(c.x, c.y, c.w, 12);
    ctx.fillRect(c.x + 8, c.y - 8, c.w - 20, 10);
    ctx.fillRect(c.x + c.w - 30, c.y - 4, 22, 10);
  }
  ctx.globalAlpha = 1;
}

function updateClouds() {
  for (const c of clouds) {
    c.x -= speed * 0.3;
    if (c.x + c.w < 0) {
      c.x = W + 20;
      c.y = 40 + Math.random() * 60;
      c.w = 60 + Math.random() * 60;
    }
  }
}

// --- Score ---
function formatScore(n) {
  return String(Math.floor(n)).padStart(5, '0');
}

function updateScoreDisplay() {
  document.getElementById('score').textContent = formatScore(score);
  document.getElementById('hi-score').textContent = formatScore(hiScore);
}

// --- Collision ---
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  const pad = 4; // forgiveness
  return ax + pad < bx + bw - pad &&
         ax + aw - pad > bx + pad &&
         ay + pad < by + bh - pad &&
         ay + ah - pad > by + pad;
}

function checkCollisions() {
  const dx = dino.hitX, dy = dino.hitY, dw = dino.hitW, dh = dino.hitH;
  for (const obs of obstacles) {
    if (obs.kind === 'cactus') {
      const ox = obs.x + 2, oy = obs.y - obs.h, ow = obs.w - 4, oh = obs.h;
      if (rectsOverlap(dx, dy, dw, dh, ox, oy, ow, oh)) return true;
    } else if (obs.kind === 'ptero') {
      const ox = obs.x + 8, oy = obs.y + 4, ow = obs.w - 16, oh = obs.h - 8;
      if (rectsOverlap(dx, dy, dw, dh, ox, oy, ow, oh)) return true;
    }
  }
  return false;
}

// --- Spawn timing ---
let nextSpawnDist = 600;
let distSinceSpawn = 0;

function maybeSpawn() {
  distSinceSpawn += speed;
  if (distSinceSpawn >= nextSpawnDist) {
    spawnObstacle();
    distSinceSpawn = 0;
    nextSpawnDist = 400 + Math.random() * 500 - speed * 8;
    nextSpawnDist = Math.max(220, nextSpawnDist);
  }
}

// --- Input ---
const keys = {};
document.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;

  if (state === 'idle' || state === 'dead') {
    if (e.code === 'Space' || e.code === 'ArrowUp') startGame();
    return;
  }
  if (state === 'running') {
    if (e.code === 'Space' || e.code === 'ArrowUp') dino.jump();
    if (e.code === 'ArrowDown') dino.duck(true);
  }
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowDown') dino.duck(false);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'idle' || state === 'dead') { startGame(); return; }
  if (state === 'running') dino.jump();
}, { passive: false });

document.getElementById('restart-btn').addEventListener('click', startGame);

// --- Game loop ---
function startGame() {
  state = 'running';
  score = 0;
  speed = 6;
  frameCount = 0;
  distSinceSpawn = 0;
  nextSpawnDist = 600;
  obstacles.length = 0;
  dino.y = GROUND_Y;
  dino.vy = 0;
  dino.onGround = true;
  dino.ducking = false;
  dino.legPhase = 0;

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');

  cancelAnimationFrame(animFrame);
  loop();
}

function gameOver() {
  state = 'dead';
  if (score > hiScore) hiScore = score;
  updateScoreDisplay();
  document.getElementById('game-over-screen').classList.remove('hidden');
  cancelAnimationFrame(animFrame);
}

function loop() {
  ctx.clearRect(0, 0, W, H);

  drawClouds();
  drawGround();
  updateClouds();
  updateGround();

  if (state === 'running') {
    frameCount++;
    score += speed * 0.05;
    if (frameCount % 6 === 0) speed = Math.min(18, 6 + Math.floor(score / 400) * 0.5);

    // Flash score every 100 points
    if (Math.floor(score) % 100 === 0 && Math.floor(score) > 0) {
      // handled by blinking CSS would be cleaner, but keep simple
    }

    dino.update();
    maybeSpawn();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;
      if (obs.kind === 'ptero') {
        obs.flapPhase += 0.15;
      }
      if (obs.x + (obs.w || 50) < -20) obstacles.splice(i, 1);
    }

    if (checkCollisions()) {
      gameOver();
      // Draw final frame with dead dino
      for (const obs of obstacles) {
        if (obs.kind === 'cactus') drawCactus(obs);
        else if (obs.kind === 'ptero') drawPtero(obs);
      }
      dino.draw(true);
      return;
    }

    updateScoreDisplay();
  }

  // Draw obstacles
  for (const obs of obstacles) {
    if (obs.kind === 'cactus') drawCactus(obs);
    else if (obs.kind === 'ptero') drawPtero(obs);
  }

  dino.draw(false);

  animFrame = requestAnimationFrame(loop);
}

// Initial render
loop();
