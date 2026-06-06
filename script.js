// ── State ──────────────────────────────────────────────
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let mode = 'pvp'; // 'pvp' | 'pvc'
let difficulty = 'hard';
let scores = { X: 0, O: 0, D: 0 };
let isComputerTurn = false;

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ── Mode & Difficulty ──────────────────────────────────
function setMode(m) {
  mode = m;
  document.querySelectorAll('.mode-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (i === 0 && m === 'pvp') || (i === 1 && m === 'pvc'));
  });
  document.getElementById('diffRow').style.display = m === 'pvc' ? 'flex' : 'none';
  document.getElementById('oLabel').textContent = m === 'pvc' ? 'Computer' : 'Player O';
  resetGame();
}

function setDiff(d) {
  difficulty = d;
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === d);
  });
  resetGame();
}

// ── Core Game Logic ────────────────────────────────────
function getCells() { return document.querySelectorAll('.cell'); }

function handleClick(idx) {
  if (gameOver || board[idx] || isComputerTurn) return;
  makeMove(idx, currentPlayer);
  if (mode === 'pvc' && !gameOver) {
    triggerComputerMove();
  }
}

function makeMove(idx, player) {
  board[idx] = player;
  const cell = getCells()[idx];
  cell.textContent = player;
  cell.classList.add(player.toLowerCase(), 'taken');

  const won = checkWin(player);
  if (won) {
    highlightWin(won);
    scores[player]++;
    updateScores();
    const msg = player === 'X'
      ? (mode === 'pvc' ? 'YOU WIN! 🎉' : 'X WINS! 🎉')
      : (mode === 'pvc' ? 'COMPUTER WINS 🤖' : 'O WINS! 🎉');
    setStatus(msg, player === 'X' ? 'win-x' : 'win-o');
    lockBoard();
    gameOver = true;
  } else if (board.every(v => v)) {
    scores.D++;
    updateScores();
    setStatus("DRAW! 🤝", 'draw');
    gameOver = true;
  } else {
    currentPlayer = player === 'X' ? 'O' : 'X';
    updateActiveCard();
    if (!isComputerTurn) {
      const turnLabel = mode === 'pvc' && currentPlayer === 'O'
        ? "COMPUTER'S TURN"
        : `${currentPlayer}'S TURN`;
      setStatus(turnLabel, currentPlayer === 'X' ? 'x-turn' : 'o-turn');
    }
  }
}

// ── Computer AI ────────────────────────────────────────
function triggerComputerMove() {
  isComputerTurn = true;
  lockBoard();
  document.getElementById('thinkingDots').classList.add('show');
  setStatus("COMPUTER THINKING...", 'o-turn');

  const delay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 500 : 700;
  setTimeout(() => {
    const idx = getComputerMove();
    document.getElementById('thinkingDots').classList.remove('show');
    isComputerTurn = false;
    if (!gameOver) {
      unlockBoard();
      makeMove(idx, 'O');
    }
  }, delay);
}

function getComputerMove() {
  if (difficulty === 'easy') return randomMove();
  if (difficulty === 'medium') return Math.random() < 0.5 ? randomMove() : minimax(board, 'O').index;
  return minimax(board, 'O').index;
}

function randomMove() {
  const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function minimax(b, player, depth = 0, alpha = -Infinity, beta = Infinity) {
  const winner = getWinner(b);
  if (winner === 'O') return { score: 10 - depth };
  if (winner === 'X') return { score: depth - 10 };
  if (b.every(v => v)) return { score: 0 };

  const empty = b.map((v, i) => v ? null : i).filter(v => v !== null);
  let best = player === 'O' ? { score: -Infinity } : { score: Infinity };

  for (const idx of empty) {
    const nb = [...b];
    nb[idx] = player;
    const result = minimax(nb, player === 'O' ? 'X' : 'O', depth + 1, alpha, beta);
    result.index = idx;

    if (player === 'O') {
      if (result.score > best.score) best = result;
      alpha = Math.max(alpha, best.score);
    } else {
      if (result.score < best.score) best = result;
      beta = Math.min(beta, best.score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

// ── Win Detection ──────────────────────────────────────
function checkWin(player) {
  return WIN_LINES.find(line => line.every(i => board[i] === player)) || null;
}

function getWinner(b) {
  for (const line of WIN_LINES) {
    if (b[line[0]] && b[line[0]] === b[line[1]] && b[line[1]] === b[line[2]]) return b[line[0]];
  }
  return null;
}

function highlightWin(line) {
  line.forEach(i => getCells()[i].classList.add('win-cell'));
}

// ── Board State ────────────────────────────────────────
function lockBoard() {
  getCells().forEach(c => { if (!c.classList.contains('taken')) c.classList.add('disabled'); });
}

function unlockBoard() {
  getCells().forEach(c => c.classList.remove('disabled'));
}

// ── UI Updates ─────────────────────────────────────────
function updateActiveCard() {
  document.getElementById('xCard').classList.toggle('active', currentPlayer === 'X');
  document.getElementById('oCard').classList.toggle('active', currentPlayer === 'O');
}

function updateScores() {
  document.getElementById('xScore').textContent = scores.X;
  document.getElementById('oScore').textContent = scores.O;
  document.getElementById('drawCount').textContent = `${scores.D} draw${scores.D !== 1 ? 's' : ''}`;
}

function setStatus(msg, cls) {
  const bar = document.getElementById('statusBar');
  bar.textContent = msg;
  bar.className = 'status-bar ' + cls;
}

// ── Reset ──────────────────────────────────────────────
function resetGame() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  isComputerTurn = false;
  document.getElementById('thinkingDots').classList.remove('show');

  getCells().forEach(c => {
    c.textContent = '';
    c.className = 'cell';
  });

  document.getElementById('xCard').classList.add('active');
  document.getElementById('oCard').classList.remove('active');
  setStatus("X'S TURN", 'x-turn');
}

function resetScores() {
  scores = { X: 0, O: 0, D: 0 };
  updateScores();
  resetGame();
}