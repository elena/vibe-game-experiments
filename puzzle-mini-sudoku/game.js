// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIGS = {
  4: { size: 4, boxR: 2, boxC: 2 },
  6: { size: 6, boxR: 2, boxC: 3 },
  9: { size: 9, boxR: 3, boxC: 3 },
};

const REMOVE_FRAC = { easy: 0.38, medium: 0.52, hard: 0.64 };

// ─── State ────────────────────────────────────────────────────────────────────
const MAX_MISTAKES = 3;

let cfg        = CONFIGS[6];
let difficulty = 'easy';
let solution   = [];
let board      = [];
let given      = [];
let notes      = [];   // notes[r][c] = Set | null
let sel        = null; // {r,c}
let mistakes   = 0;
let timerSec   = 0;
let timerHandle= null;
let notesMode    = false;
let dead         = false;
let overlayMode  = 'end'; // 'ask' = too-many-mistakes prompt, 'end' = win/lose

// ─── Puzzle generation ────────────────────────────────────────────────────────
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function valid(g, r, c, v) {
  const n = cfg.size;
  for (let i = 0; i < n; i++) {
    if (g[r][i] === v || g[i][c] === v) return false;
  }
  const r0 = Math.floor(r / cfg.boxR) * cfg.boxR;
  const c0 = Math.floor(c / cfg.boxC) * cfg.boxC;
  for (let dr = 0; dr < cfg.boxR; dr++)
    for (let dc = 0; dc < cfg.boxC; dc++)
      if (g[r0+dr][c0+dc] === v) return false;
  return true;
}

function blank() { return Array.from({length: cfg.size}, () => Array(cfg.size).fill(0)); }

function fill(g) {
  const n = cfg.size;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (g[r][c] === 0) {
        for (const v of shuffle([...Array(n)].map((_,i)=>i+1))) {
          if (valid(g, r, c, v)) {
            g[r][c] = v;
            if (fill(g)) return true;
            g[r][c] = 0;
          }
        }
        return false;
      }
  return true;
}

function countSols(g, cap = 2) {
  const n = cfg.size;
  let found = 0;
  (function go(g) {
    if (found >= cap) return;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (g[r][c] === 0) {
          for (let v = 1; v <= n; v++) {
            if (valid(g, r, c, v)) {
              g[r][c] = v; go(g); g[r][c] = 0;
              if (found >= cap) return;
            }
          }
          return;
        }
    found++;
  })(g.map(row => row.slice()));
  return found;
}

function makePuzzle() {
  const n = cfg.size;
  const sol = blank();
  fill(sol);
  solution = sol.map(r => r.slice());

  const puz = sol.map(r => r.slice());
  const cells = shuffle([...Array(n*n)].map((_,i)=>i));
  let removed = 0;
  const target = Math.round(n * n * REMOVE_FRAC[difficulty]);

  for (const idx of cells) {
    if (removed >= target) break;
    const r = (idx / n) | 0, c = idx % n;
    const bak = puz[r][c];
    puz[r][c] = 0;
    if (countSols(puz) === 1) removed++;
    else puz[r][c] = bak;
  }
  return puz;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerHandle);
  timerSec = 0;
  tickTimer();
  timerHandle = setInterval(tickTimer, 1000);
}
function stopTimer() { clearInterval(timerHandle); }
function tickTimer() {
  timerSec++;
  const m = (timerSec / 60) | 0, s = timerSec % 60;
  document.getElementById('timer').textContent = m + ':' + String(s).padStart(2,'0');
}

// ─── Board rendering ──────────────────────────────────────────────────────────
function cellSize() {
  // Fit board inside viewport with some margin
  const avail = Math.min(window.innerWidth - 24, 440);
  return Math.floor(avail / cfg.size);
}

function buildTable() {
  const n = cfg.size;
  const cs = cellSize();
  const fontSize = Math.max(11, (cs * 0.48) | 0);
  const noteFontSize = Math.max(8, (cs * 0.22) | 0);

  const tbody = document.querySelector('#board tbody');
  tbody.innerHTML = '';

  for (let r = 0; r < n; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < n; c++) {
      const td = document.createElement('td');
      td.dataset.r = r;
      td.dataset.c = c;
      td.style.width  = cs + 'px';
      td.style.height = cs + 'px';
      td.style.fontSize = fontSize + 'px';
      td.style.setProperty('--nfs', noteFontSize + 'px');
      td.addEventListener('click', () => onCellClick(r, c));

      // thick box borders
      if ((c + 1) % cfg.boxC === 0 && c < n - 1) td.classList.add('box-right');
      if ((r + 1) % cfg.boxR === 0 && r < n - 1) td.classList.add('box-bottom');

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function renderAll() {
  const n = cfg.size;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      renderCell(r, c);
  applyHighlights();
  refreshNumpad();
}

function getCell(r, c) {
  return document.querySelector(`#board td[data-r="${r}"][data-c="${c}"]`);
}

function renderCell(r, c) {
  const td = getCell(r, c);
  if (!td) return;
  const n   = cfg.size;
  const val = board[r][c];
  const isGiven = given[r][c];
  const ns  = notes[r][c];

  // preserve structural classes, clear state classes
  td.classList.remove('given','user','wrong');
  td.innerHTML = '';

  if (isGiven) {
    td.classList.add('given');
    td.textContent = val;
  } else if (val !== 0) {
    td.classList.add(val === solution[r][c] ? 'user' : 'wrong');
    td.textContent = val;
  } else if (ns && ns.size > 0) {
    // render pencil marks
    const cs = cellSize();
    const nfs = Math.max(8, (cs * 0.22) | 0);
    const g = document.createElement('div');
    g.className = 'notes-grid';
    g.style.gridTemplateColumns = `repeat(${cfg.boxC}, 1fr)`;
    g.style.gridTemplateRows    = `repeat(${cfg.boxR}, 1fr)`;
    for (let v = 1; v <= n; v++) {
      const sp = document.createElement('span');
      sp.style.fontSize = nfs + 'px';
      sp.textContent = ns.has(v) ? v : '';
      g.appendChild(sp);
    }
    td.appendChild(g);
  }
}

function applyHighlights() {
  document.querySelectorAll('#board td').forEach(td => {
    td.classList.remove('sel','peer','twin');
  });
  if (!sel) return;

  const {r, c} = sel;
  const selVal  = board[r][c];
  const selBox  = boxIdx(r, c);
  const n       = cfg.size;

  for (let rr = 0; rr < n; rr++) {
    for (let cc = 0; cc < n; cc++) {
      const td = getCell(rr, cc);
      if (!td) continue;
      if (rr === r && cc === c) { td.classList.add('sel'); continue; }
      const peer = rr === r || cc === c || boxIdx(rr, cc) === selBox;
      if (peer) td.classList.add('peer');
      if (selVal !== 0 && board[rr][cc] === selVal) td.classList.add('twin');
    }
  }
}

function boxIdx(r, c) {
  return Math.floor(r / cfg.boxR) * Math.floor(cfg.size / cfg.boxC) + Math.floor(c / cfg.boxC);
}

// ─── Numpad ───────────────────────────────────────────────────────────────────
function buildNumpad() {
  const pad = document.getElementById('numpad');
  pad.innerHTML = '';
  const n = cfg.size;

  for (let v = 1; v <= n; v++) {
    const b = document.createElement('button');
    b.className = 'nk';
    b.textContent = v;
    b.dataset.v = v;
    b.addEventListener('click', () => enterValue(v));
    pad.appendChild(b);
  }

  const notesBtn = document.createElement('button');
  notesBtn.className = 'nk notes-toggle';
  notesBtn.id = 'notes-btn';
  notesBtn.textContent = 'Notes';
  notesBtn.addEventListener('click', () => {
    notesMode = !notesMode;
    notesBtn.classList.toggle('on', notesMode);
  });
  pad.appendChild(notesBtn);

  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'nk erase';
  eraseBtn.textContent = '✕';
  eraseBtn.addEventListener('click', erase);
  pad.appendChild(eraseBtn);
}

function refreshNumpad() {
  const n = cfg.size;
  const count = Array(n + 1).fill(0);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c]) count[board[r][c]]++;
  document.querySelectorAll('.nk[data-v]').forEach(b => {
    b.classList.toggle('done', count[+b.dataset.v] >= n);
  });
}

// ─── Input handlers ───────────────────────────────────────────────────────────
function onCellClick(r, c) {
  if (dead) return;
  sel = {r, c};
  applyHighlights();
}

function enterValue(v) {
  if (!sel || dead) return;
  const {r, c} = sel;
  if (given[r][c]) return;

  if (notesMode) {
    if (board[r][c] !== 0) return;
    if (!notes[r][c]) notes[r][c] = new Set();
    notes[r][c].has(v) ? notes[r][c].delete(v) : notes[r][c].add(v);
    renderCell(r, c);
    applyHighlights();
    return;
  }

  if (board[r][c] === v) return;
  board[r][c] = v;
  notes[r][c] = null;

  if (v !== solution[r][c]) {
    mistakes++;
    document.getElementById('mistakes').textContent = `Mistakes: ${mistakes} / ${MAX_MISTAKES}`;
    if (mistakes >= MAX_MISTAKES - 1) document.getElementById('mistakes').classList.add('danger');
    if (mistakes >= MAX_MISTAKES) { promptTooManyMistakes(); return; }
  } else {
    wipePeerNotes(r, c, v);
  }

  renderCell(r, c);
  applyHighlights();
  refreshNumpad();
  if (isSolved()) finish(true);
}

function erase() {
  if (!sel || dead) return;
  const {r, c} = sel;
  if (given[r][c]) return;
  board[r][c] = 0;
  notes[r][c] = null;
  renderCell(r, c);
  applyHighlights();
  refreshNumpad();
}

function wipePeerNotes(r, c, v) {
  const n = cfg.size, box = boxIdx(r, c);
  for (let rr = 0; rr < n; rr++)
    for (let cc = 0; cc < n; cc++)
      if (notes[rr][cc] && (rr === r || cc === c || boxIdx(rr, cc) === box)) {
        notes[rr][cc].delete(v);
        if (!notes[rr][cc].size) notes[rr][cc] = null;
        if (board[rr][cc] === 0) renderCell(rr, cc);
      }
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (dead) return;
  const n = cfg.size;
  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { erase(); return; }
  const v = parseInt(e.key);
  if (v >= 1 && v <= n) { enterValue(v); return; }
  if (!sel) return;
  let {r, c} = sel;
  if      (e.key === 'ArrowUp'    && r > 0)     r--;
  else if (e.key === 'ArrowDown'  && r < n - 1) r++;
  else if (e.key === 'ArrowLeft'  && c > 0)     c--;
  else if (e.key === 'ArrowRight' && c < n - 1) c++;
  else return;
  e.preventDefault();
  onCellClick(r, c);
});

// ─── Win / lose ───────────────────────────────────────────────────────────────
function isSolved() {
  const n = cfg.size;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}

function showOverlay(title, body, primaryLabel, showSecondary, secondaryLabel) {
  document.getElementById('msg-title').textContent = title;
  document.getElementById('msg-body').textContent  = body;
  document.getElementById('msg-btn').textContent   = primaryLabel;
  const btn2 = document.getElementById('msg-btn2');
  btn2.textContent = secondaryLabel || '';
  btn2.classList.toggle('hidden', !showSecondary);
  document.getElementById('overlay').classList.remove('hidden');
}

function promptTooManyMistakes() {
  overlayMode = 'ask';
  // Don't stop timer or set dead — player can choose to keep going
  showOverlay(
    'Too Many Mistakes',
    `You've made ${mistakes} mistakes. Keep going anyway, or give up and see the answer?`,
    'Show Answer',
    true,
    'Keep Going'
  );
}

function finish(won) {
  overlayMode = 'end';
  stopTimer();
  dead = true;
  const m = (timerSec / 60) | 0, s = timerSec % 60;
  showOverlay(
    won ? 'Solved!' : 'Game Over',
    won
      ? `Time: ${m}:${String(s).padStart(2,'0')}  ·  Mistakes: ${mistakes}`
      : 'Solution revealed.',
    'Play Again',
    false
  );
}

// ─── New game ─────────────────────────────────────────────────────────────────
function newGame() {
  stopTimer();
  dead = false; notesMode = false; mistakes = 0; sel = null;
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('mistakes').textContent = `Mistakes: 0 / ${MAX_MISTAKES}`;
  document.getElementById('mistakes').classList.remove('danger');
  document.getElementById('timer').textContent = '0:00';
  const notesBtn = document.getElementById('notes-btn');
  if (notesBtn) notesBtn.classList.remove('on');

  const puz = makePuzzle();
  const n   = cfg.size;
  board  = puz.map(r => r.slice());
  given  = puz.map(r => r.map(v => v !== 0));
  notes  = Array.from({length: n}, () => Array(n).fill(null));

  buildTable();
  buildNumpad();
  renderAll();
  startTimer();
}

// ─── Control wiring ───────────────────────────────────────────────────────────
document.querySelectorAll('#size-group .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#size-group .pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    cfg = CONFIGS[+b.dataset.size];
  });
});

document.querySelectorAll('#diff-group .pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#diff-group .pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    difficulty = b.dataset.diff;
  });
});

document.getElementById('new-btn').addEventListener('click', newGame);

document.getElementById('msg-btn').addEventListener('click', () => {
  if (overlayMode === 'ask') {
    // "Show Answer" chosen
    document.getElementById('overlay').classList.add('hidden');
    board = solution.map(r => r.slice());
    renderAll();
    finish(false);
  } else {
    newGame();
  }
});

// "Keep Going" — dismiss and resume without penalty
document.getElementById('msg-btn2').addEventListener('click', () => {
  document.getElementById('overlay').classList.add('hidden');
  overlayMode = 'end';
});

// kick off
newGame();
