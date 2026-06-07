// ── Grid config ──────────────────────────────────────────────────────────────
const CONFIGS = {
  4: { size: 4, boxRows: 2, boxCols: 2 },
  6: { size: 6, boxRows: 2, boxCols: 3 },
  9: { size: 9, boxRows: 3, boxCols: 3 },
};

// Cells to REMOVE per difficulty (as fraction of total cells)
const REMOVE_FRAC = {
  easy:   0.38,
  medium: 0.52,
  hard:   0.64,
};

// ── State ─────────────────────────────────────────────────────────────────────
let cfg = CONFIGS[6];
let difficulty = 'easy';
let solution = [];
let puzzle = [];    // 0 = empty
let board = [];     // current player board
let given = [];     // bool mask
let notes = [];     // notes[r][c] = Set of numbers
let selected = null; // { r, c }
let mistakes = 0;
let maxMistakes = 20;
let timerSec = 0;
let timerInterval = null;
let notesMode = false;
let gameOver = false;

// ── Solver / Generator ────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function boxIndex(r, c) {
  const { boxRows, boxCols } = cfg;
  return Math.floor(r / boxRows) * (cfg.size / boxCols) + Math.floor(c / boxCols);
}

function isValid(grid, r, c, num) {
  const n = cfg.size;
  for (let i = 0; i < n; i++) {
    if (grid[r][i] === num) return false;
    if (grid[i][c] === num) return false;
  }
  const br = Math.floor(r / cfg.boxRows) * cfg.boxRows;
  const bc = Math.floor(c / cfg.boxCols) * cfg.boxCols;
  for (let i = 0; i < cfg.boxRows; i++)
    for (let j = 0; j < cfg.boxCols; j++)
      if (grid[br + i][bc + j] === num) return false;
  return true;
}

function emptyGrid() {
  return Array.from({ length: cfg.size }, () => Array(cfg.size).fill(0));
}

function fillGrid(grid) {
  const n = cfg.size;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([...Array(n).keys()].map(x => x + 1));
        for (const num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Count solutions (cap at 2 to check uniqueness)
function countSolutions(grid, limit = 2) {
  const n = cfg.size;
  let count = 0;
  function solve(g) {
    if (count >= limit) return;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (g[r][c] === 0) {
          for (let num = 1; num <= n; num++) {
            if (isValid(g, r, c, num)) {
              g[r][c] = num;
              solve(g);
              g[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve(grid.map(r => [...r]));
  return count;
}

function generatePuzzle() {
  const n = cfg.size;
  // Build full solution
  const sol = emptyGrid();
  fillGrid(sol);
  solution = sol.map(r => [...r]);

  // Remove cells while keeping unique solution
  const cells = shuffle([...Array(n * n).keys()]);
  const toRemove = Math.round(n * n * REMOVE_FRAC[difficulty]);
  const puz = sol.map(r => [...r]);
  let removed = 0;

  for (const idx of cells) {
    if (removed >= toRemove) break;
    const r = Math.floor(idx / n);
    const c = idx % n;
    const backup = puz[r][c];
    puz[r][c] = 0;
    if (countSolutions(puz) === 1) {
      removed++;
    } else {
      puz[r][c] = backup; // restore if not unique
    }
  }

  puzzle = puz;
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  clearInterval(timerInterval);
  timerSec = 0;
  renderTimer();
  timerInterval = setInterval(() => {
    timerSec++;
    renderTimer();
  }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

function renderTimer() {
  const m = Math.floor(timerSec / 60);
  const s = timerSec % 60;
  document.getElementById('timer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Build UI ──────────────────────────────────────────────────────────────────

function buildBoard() {
  const n = cfg.size;
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  // Set board size responsively
  const maxPx = Math.min(window.innerWidth - 32, 440);
  const cellPx = Math.floor((maxPx - (n - 1)) / n); // account for 1px gaps
  const totalPx = cellPx * n + (n - 1);
  boardEl.style.gridTemplateColumns = `repeat(${n}, ${cellPx}px)`;
  boardEl.style.gridTemplateRows = `repeat(${n}, ${cellPx}px)`;
  boardEl.style.gap = '1px';
  boardEl.style.width = totalPx + 'px';
  boardEl.style.height = totalPx + 'px';

  // Scale font to cell size
  const fontSize = Math.max(10, Math.floor(cellPx * 0.5));
  boardEl.style.fontSize = fontSize + 'px';

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('click', () => selectCell(r, c));
      boardEl.appendChild(cell);
    }
  }

  buildNumpad();
  renderAll();
}

function buildNumpad() {
  const pad = document.getElementById('numpad');
  pad.innerHTML = '';
  const n = cfg.size;

  for (let i = 1; i <= n; i++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = i;
    btn.dataset.num = i;
    btn.addEventListener('click', () => inputNumber(i));
    pad.appendChild(btn);
  }

  // Notes toggle
  const notesBtn = document.createElement('button');
  notesBtn.className = 'num-btn notes-btn';
  notesBtn.id = 'notes-btn';
  notesBtn.textContent = 'Notes';
  notesBtn.addEventListener('click', toggleNotes);
  pad.appendChild(notesBtn);

  // Erase
  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'num-btn erase-btn';
  eraseBtn.textContent = '✕';
  eraseBtn.addEventListener('click', eraseCell);
  pad.appendChild(eraseBtn);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderAll() {
  const n = cfg.size;
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    renderCell(cell, r, c);
  });
  renderHighlights();
  renderNumpadComplete();
}

function renderCell(cell, r, c) {
  const n = cfg.size;
  const val = board[r][c];
  const isGiven = given[r][c];
  const noteSet = notes[r][c];

  // Clear content and classes
  cell.innerHTML = '';
  cell.className = 'cell';

  // Box borders
  const isBoxRight = (c + 1) % cfg.boxCols === 0 && c < n - 1;
  const isBoxBottom = (r + 1) % cfg.boxRows === 0 && r < n - 1;
  if (isBoxRight) cell.classList.add('box-border-right');
  if (isBoxBottom) cell.classList.add('box-border-bottom');

  if (isGiven) cell.classList.add('given');

  if (val !== 0) {
    cell.textContent = val;
    if (!isGiven) {
      if (val !== solution[r][c]) {
        cell.classList.add('error-cell');
      } else {
        cell.classList.add('user-cell');
      }
    }
  } else if (noteSet && noteSet.size > 0) {
    renderNotes(cell, noteSet, n);
  }
}

function renderNotes(cell, noteSet, n) {
  const grid = document.createElement('div');
  grid.className = 'notes';
  const cols = cfg.boxCols;
  const rows = cfg.boxRows;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 1; i <= n; i++) {
    const span = document.createElement('span');
    span.textContent = noteSet.has(i) ? i : '';
    grid.appendChild(span);
  }
  cell.appendChild(grid);
}

function renderHighlights() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('selected', 'highlighted', 'same-value');
  });

  if (!selected) return;
  const { r, c } = selected;
  const selVal = board[r][c];
  const n = cfg.size;
  const selBox = boxIndex(r, c);

  cells.forEach(cell => {
    const cr = +cell.dataset.r;
    const cc = +cell.dataset.c;

    if (cr === r && cc === c) {
      cell.classList.add('selected');
      return;
    }

    const sameRow = cr === r;
    const sameCol = cc === c;
    const sameBox = boxIndex(cr, cc) === selBox;

    if (sameRow || sameCol || sameBox) {
      cell.classList.add('highlighted');
    }

    if (selVal !== 0 && board[cr][cc] === selVal) {
      cell.classList.add('same-value');
    }
  });
}

function renderNumpadComplete() {
  const n = cfg.size;
  const counts = Array(n + 1).fill(0);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c] !== 0) counts[board[r][c]]++;

  document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
    const num = +btn.dataset.num;
    btn.classList.toggle('complete', counts[num] >= n);
  });
}

// ── Interaction ───────────────────────────────────────────────────────────────

function selectCell(r, c) {
  if (gameOver) return;
  selected = { r, c };
  renderHighlights();
}

function inputNumber(num) {
  if (!selected || gameOver) return;
  const { r, c } = selected;
  if (given[r][c]) return;

  if (notesMode) {
    if (board[r][c] !== 0) return;
    if (!notes[r][c]) notes[r][c] = new Set();
    if (notes[r][c].has(num)) notes[r][c].delete(num);
    else notes[r][c].add(num);
    const cell = getCellEl(r, c);
    renderCell(cell, r, c);
    renderHighlights();
    return;
  }

  if (board[r][c] === num) return; // same value, ignore

  board[r][c] = num;
  notes[r][c] = null; // clear notes on fill

  if (num !== solution[r][c]) {
    mistakes++;
    updateMistakes();
    if (mistakes >= maxMistakes) {
      endGame(false);
      return;
    }
  } else {
    // Clear notes in same row/col/box that contain this number
    clearRelatedNotes(r, c, num);
  }

  const cell = getCellEl(r, c);
  renderCell(cell, r, c);
  renderHighlights();
  renderNumpadComplete();

  if (checkWin()) {
    endGame(true);
  }
}

function clearRelatedNotes(r, c, num) {
  const n = cfg.size;
  const selBox = boxIndex(r, c);
  for (let rr = 0; rr < n; rr++) {
    for (let cc = 0; cc < n; cc++) {
      if (notes[rr][cc] && (rr === r || cc === c || boxIndex(rr, cc) === selBox)) {
        notes[rr][cc].delete(num);
        if (notes[rr][cc].size === 0) notes[rr][cc] = null;
        if (board[rr][cc] === 0) {
          renderCell(getCellEl(rr, cc), rr, cc);
        }
      }
    }
  }
}

function eraseCell() {
  if (!selected || gameOver) return;
  const { r, c } = selected;
  if (given[r][c]) return;
  board[r][c] = 0;
  notes[r][c] = null;
  const cell = getCellEl(r, c);
  renderCell(cell, r, c);
  renderHighlights();
  renderNumpadComplete();
}

function toggleNotes() {
  notesMode = !notesMode;
  document.getElementById('notes-btn').classList.toggle('active', notesMode);
}

function getCellEl(r, c) {
  return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
}

// ── Keyboard support ──────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (gameOver) return;
  const n = cfg.size;

  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    eraseCell();
    return;
  }

  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= n) {
    inputNumber(num);
    return;
  }

  if (!selected) return;
  let { r, c } = selected;

  if (e.key === 'ArrowUp' && r > 0) r--;
  else if (e.key === 'ArrowDown' && r < n - 1) r++;
  else if (e.key === 'ArrowLeft' && c > 0) c--;
  else if (e.key === 'ArrowRight' && c < n - 1) c++;
  else return;

  e.preventDefault();
  selectCell(r, c);
});

// ── Game flow ─────────────────────────────────────────────────────────────────

function checkWin() {
  const n = cfg.size;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}

function updateMistakes() {
  const el = document.getElementById('mistake-counter');
  el.textContent = `Mistakes: ${mistakes} / ${maxMistakes}`;
  el.classList.toggle('danger', mistakes >= maxMistakes - 1);
}

function endGame(won) {
  stopTimer();
  gameOver = true;
  const m = Math.floor(timerSec / 60);
  const s = timerSec % 60;

  if (won) {
    document.getElementById('message-title').textContent = '🎉 Solved!';
    document.getElementById('message-body').textContent =
      `Time: ${m}:${s.toString().padStart(2,'0')} · Mistakes: ${mistakes}`;
  } else {
    // Reveal solution
    const n = cfg.size;
    board = solution.map(r => [...r]);
    renderAll();
    document.getElementById('message-title').textContent = '💀 Game Over';
    document.getElementById('message-body').textContent = 'Too many mistakes. The solution is shown.';
  }
  document.getElementById('message').classList.remove('hidden');
}

function newGame() {
  stopTimer();
  gameOver = false;
  notesMode = false;
  document.getElementById('notes-btn').classList.remove('active');
  mistakes = 0;
  updateMistakes();
  selected = null;
  document.getElementById('message').classList.add('hidden');

  generatePuzzle();

  const n = cfg.size;
  board = puzzle.map(r => [...r]);
  given = puzzle.map(r => r.map(v => v !== 0));
  notes = Array.from({ length: n }, () => Array(n).fill(null));

  buildBoard();
  startTimer();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.querySelectorAll('#size-btns .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#size-btns .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cfg = CONFIGS[+btn.dataset.size];
  });
});

document.querySelectorAll('#diff-btns .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#diff-btns .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
  });
});

document.getElementById('new-game-btn').addEventListener('click', newGame);
document.getElementById('message-btn').addEventListener('click', newGame);

// Start with defaults
newGame();
