// storage
const STORE_KEY = 'hc-store';
const SRS_KEY = 'hc-srs';
const CFG_KEY = 'hc-cfg';
const MEM_KEY = 'hc-memory-stats';

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// global state
let appData = { flash: [], memory: [] };
let srsData = load(SRS_KEY) || {};
let memoryStats = load(MEM_KEY) || {};
let config = load(CFG_KEY) || { memoryTime: 90, dailyGoal: 20 };

// initialization
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupNav();
  loadData().then(() => {
    updateHome();
    setupFlashcards();
    setupMemory();
    updateContentPreview();
    loadConfigUI();
  });
  setupContent();
  setupConfig();
}

// navigation
function setupNav() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
  document.getElementById('start-flash').addEventListener('click', () => {
    showTab('flash');
    startFlashcards();
  });
  document.getElementById('start-memory').addEventListener('click', () => {
    showTab('memory');
    startMemory();
  });
}

function showTab(id) {
  document.querySelectorAll('.tab-section').forEach((sec) => sec.classList.add('hidden'));
  const tab = document.getElementById(id);
  if (tab) tab.classList.remove('hidden');
}

// data loading
async function loadData() {
  const stored = load(STORE_KEY);
  if (stored) appData = stored;
  try {
    const resp = await fetch('data.json');
    if (resp.ok) {
      const json = await resp.json();
      appData = json;
      save(STORE_KEY, json);
    }
  } catch (e) {
    console.log('fetch failed');
  }
  if (!appData || !Array.isArray(appData.flash) || !Array.isArray(appData.memory)) {
    appData = stored || { flash: [], memory: [] };
  }
}

function updateHome() {
  document.getElementById('stats').textContent = `Flashcards: ${appData.flash.length} | Memory: ${appData.memory.length}`;
  const msg = document.getElementById('home-msg');
  if (appData.flash.length === 0 && appData.memory.length === 0) {
    msg.textContent = 'Dados não carregados. Use "Importar JSON" na aba Conteúdo.';
  } else {
    msg.textContent = '';
    if (appData.flash.length === 0) msg.textContent = 'Sem cartões no momento.';
  }
}

// Flashcards (SRS)
let flashQueue = [];
let flashIndex = 0;

function setupFlashcards() {
  document.getElementById('show-answer').addEventListener('click', showAnswer);
  document.querySelectorAll('.rate-btn').forEach((btn) => {
    btn.addEventListener('click', () => rateCard(parseInt(btn.dataset.rate)));
  });
}

function startFlashcards() {
  if (appData.flash.length === 0) {
    document.getElementById('flash-empty').classList.remove('hidden');
    return;
  }
  document.getElementById('flash-empty').classList.add('hidden');
  buildFlashQueue();
  flashIndex = 0;
  showFlashcard();
}

function buildFlashQueue() {
  const today = Date.now();
  const due = [];
  const rest = [];
  for (const card of appData.flash) {
    const st = srsData[card.id] || { reps: 0, interval: 1, ef: 2.5, due: 0 };
    card._state = st;
    if (st.due <= today) due.push(card); else rest.push(card);
  }
  shuffle(rest);
  flashQueue = due.concat(rest);
}

function showFlashcard() {
  const front = document.getElementById('flash-front');
  const back = document.getElementById('flash-back');
  const showBtn = document.getElementById('show-answer');
  const actions = document.getElementById('flash-actions');
  const counter = document.getElementById('flash-counter');
  if (flashIndex >= flashQueue.length) {
    front.textContent = 'Fim!';
    back.textContent = '';
    showBtn.classList.add('hidden');
    actions.classList.add('hidden');
    counter.textContent = '';
    return;
  }
  const card = flashQueue[flashIndex];
  front.textContent = card.front;
  back.textContent = card.back;
  back.classList.add('hidden');
  showBtn.classList.remove('hidden');
  actions.classList.add('hidden');
  counter.textContent = `Restantes: ${flashQueue.length - flashIndex}`;
}

function showAnswer() {
  document.getElementById('flash-back').classList.remove('hidden');
  document.getElementById('show-answer').classList.add('hidden');
  document.getElementById('flash-actions').classList.remove('hidden');
}

function rateCard(q) {
  const card = flashQueue[flashIndex];
  const st = card._state;
  if (q < 3) {
    st.reps = 0;
    st.interval = 1;
  } else {
    st.ef = Math.max(1.3, st.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (st.reps === 0) st.interval = 1;
    else if (st.reps === 1) st.interval = 6;
    else st.interval = Math.round(st.interval * st.ef);
    st.reps++;
  }
  st.due = Date.now() + st.interval * 24 * 60 * 60 * 1000;
  srsData[card.id] = st;
  save(SRS_KEY, srsData);
  flashIndex++;
  showFlashcard();
}

// Memory Items
let memoryIndex = 0;
let memoryTimer = null;
let timeLeft = config.memoryTime;
let seq = [];

function setupMemory() {
  document.getElementById('memory-check').addEventListener('click', checkMemory);
  document.getElementById('memory-reset').addEventListener('click', startMemory);
  document.getElementById('memory-next').addEventListener('click', () => {
    memoryIndex = (memoryIndex + 1) % (appData.memory.length || 1);
    startMemory();
  });
}

function startMemory() {
  if (appData.memory.length === 0) {
    document.getElementById('memory-empty').classList.remove('hidden');
    document.getElementById('memory-game').classList.add('hidden');
    return;
  }
  document.getElementById('memory-empty').classList.add('hidden');
  document.getElementById('memory-game').classList.remove('hidden');
  const item = appData.memory[memoryIndex];
  document.getElementById('memory-title').textContent = item.title;
  const options = (item.steps || []).concat(item.distractors || []);
  shuffle(options);
  const optDiv = document.getElementById('memory-options');
  optDiv.innerHTML = '';
  seq = [];
  options.forEach((step) => {
    const b = document.createElement('button');
    b.textContent = step;
    b.addEventListener('click', () => {
      b.disabled = true;
      seq.push(step);
      renderSequence();
    });
    optDiv.appendChild(b);
  });
  document.getElementById('memory-feedback').textContent = '';
  timeLeft = config.memoryTime;
  updateTimer();
  if (memoryTimer) clearInterval(memoryTimer);
  memoryTimer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(memoryTimer);
      checkMemory();
    }
  }, 1000);
}

function renderSequence() {
  document.getElementById('memory-sequence').textContent = seq.join(' \u203a ');
}

function checkMemory() {
  const item = appData.memory[memoryIndex];
  const correct = item.steps || [];
  let score = 0;
  const missing = [];
  for (let i = 0; i < correct.length; i++) {
    if (seq[i] === correct[i]) score += 10; else missing.push(correct[i]);
  }
  if (missing.length === 0 && seq.length === correct.length) score += 10;
  document.getElementById('memory-feedback').textContent = missing.length === 0 ? `Perfeito! ${score} pts` : `Faltou: ${missing.join(', ')} (${score} pts)`;
  memoryStats[item.id] = score;
  save(MEM_KEY, memoryStats);
}

function updateTimer() {
  document.getElementById('memory-timer').textContent = secondsToMMSS(timeLeft);
}

// Conteúdo (import/export)
function setupContent() {
  document.getElementById('export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import-json').addEventListener('change', handleImport);
  document.getElementById('clear-progress').addEventListener('click', () => {
    if (confirm('Limpar progresso?')) {
      localStorage.removeItem(SRS_KEY);
      localStorage.removeItem(MEM_KEY);
      srsData = {};
      memoryStats = {};
      alert('Progresso limpo.');
    }
  });
}

function handleImport(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      mergeData(json);
      save(STORE_KEY, appData);
      updateHome();
      updateContentPreview();
      startFlashcards();
      startMemory();
    } catch (e) {
      alert('JSON inválido');
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}

function mergeData(newData) {
  if (newData.flash) {
    const byId = Object.fromEntries(appData.flash.map((c) => [c.id, c]));
    newData.flash.forEach((c) => { byId[c.id] = c; });
    appData.flash = Object.values(byId);
  }
  if (newData.memory) {
    const byId = Object.fromEntries(appData.memory.map((c) => [c.id, c]));
    newData.memory.forEach((c) => { byId[c.id] = c; });
    appData.memory = Object.values(byId);
  }
}

function updateContentPreview() {
  document.getElementById('content-preview').textContent = JSON.stringify(appData, null, 2);
}

// Config
function setupConfig() {
  document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    config.memoryTime = parseInt(document.getElementById('cfg-memory-time').value, 10) || 90;
    config.dailyGoal = parseInt(document.getElementById('cfg-daily-goal').value, 10) || 20;
    save(CFG_KEY, config);
    document.getElementById('config-msg').textContent = 'Salvo!';
    setTimeout(() => (document.getElementById('config-msg').textContent = ''), 2000);
  });
}

function loadConfigUI() {
  document.getElementById('cfg-memory-time').value = config.memoryTime;
  document.getElementById('cfg-daily-goal').value = config.dailyGoal;
}

// helpers
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function secondsToMMSS(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}
