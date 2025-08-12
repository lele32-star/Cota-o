// Simple Hawker 400 Trainer logic
const state = {
    data: null,
    currentFlash: null,
    currentMemory: null,
    settings: {
        time: parseInt(localStorage.getItem('time') || '20', 10),
        tolerance: parseInt(localStorage.getItem('tolerance') || '1', 10)
    }
};

async function loadData() {
    const res = await fetch('data/hawker400.json');
    state.data = await res.json();
    populateDatabase();
}

function switchTab(id) {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === id);
    });
    document.querySelectorAll('main .tab').forEach(sec => {
        sec.classList.toggle('hidden', sec.id !== id);
    });
}

// Tab buttons
 document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
 });

// Config
 document.getElementById('cfg-time').value = state.settings.time;
 document.getElementById('cfg-tolerance').value = state.settings.tolerance;
 document.getElementById('cfg-save').addEventListener('click', () => {
    state.settings.time = parseInt(document.getElementById('cfg-time').value, 10);
    state.settings.tolerance = parseInt(document.getElementById('cfg-tolerance').value, 10);
    localStorage.setItem('time', state.settings.time);
    localStorage.setItem('tolerance', state.settings.tolerance);
    alert('Configurações salvas');
 });

// Flash cards
 document.getElementById('start-flash').addEventListener('click', () => {
    document.getElementById('memory-area').classList.add('hidden');
    document.getElementById('flash-area').classList.remove('hidden');
    nextFlash();
 });

 function nextFlash() {
    const pool = state.data.flash;
    state.currentFlash = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('flash-question').textContent = state.currentFlash.front;
    document.getElementById('flash-answer').value = '';
    document.getElementById('flash-feedback').textContent = '';
 }

 function normalizeAnswer(ans) {
    return ans.trim().toUpperCase().replace(/KTS|KIAS|KT|KTS GS|KTS GROUND SPEED|KTS\.?/g, 'KIAS');
 }

 document.getElementById('flash-submit').addEventListener('click', () => {
    const user = normalizeAnswer(document.getElementById('flash-answer').value);
    const correct = normalizeAnswer(state.currentFlash.back);
    let feedback = 'Errado';

    if (user === correct) {
        feedback = 'Correto';
    } else {
        // numeric tolerance
        const numUser = parseFloat(user);
        const numCorrect = parseFloat(correct);
        if (!isNaN(numUser) && !isNaN(numCorrect)) {
            const diff = Math.abs(numUser - numCorrect);
            if (diff <= state.settings.tolerance) feedback = 'Parcial';
        }
    }
    document.getElementById('flash-feedback').textContent = feedback;
 });
 document.getElementById('flash-reveal').addEventListener('click', () => {
    document.getElementById('flash-feedback').textContent = state.currentFlash.back;
 });

// Memory items
 document.getElementById('start-memory').addEventListener('click', () => {
    document.getElementById('flash-area').classList.add('hidden');
    document.getElementById('memory-area').classList.remove('hidden');
    nextMemory();
 });

 function nextMemory() {
    const pool = state.data.memory;
    state.currentMemory = pool[Math.floor(Math.random() * pool.length)];
    document.getElementById('memory-title').textContent = state.currentMemory.title;
    const list = document.getElementById('memory-list');
    list.innerHTML = '';
    const steps = [...state.currentMemory.steps];
    shuffleArray(steps);
    steps.forEach((step, idx) => {
        const li = document.createElement('li');
        li.textContent = step;
        li.draggable = true;
        li.dataset.index = idx;
        list.appendChild(li);
    });
 }

 function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
 }

 let dragSrcEl = null;
 document.getElementById('memory-list').addEventListener('dragstart', e => {
    dragSrcEl = e.target;
 });
 document.getElementById('memory-list').addEventListener('dragover', e => {
    e.preventDefault();
 });
 document.getElementById('memory-list').addEventListener('drop', e => {
    e.preventDefault();
    if (dragSrcEl && e.target.tagName === 'LI') {
        const list = document.getElementById('memory-list');
        list.insertBefore(dragSrcEl, e.target.nextSibling);
    }
 });

 document.getElementById('memory-validate').addEventListener('click', () => {
    const items = Array.from(document.querySelectorAll('#memory-list li')).map(li => li.textContent);
    const correct = state.currentMemory.steps;
    let correctCount = 0;
    items.forEach((step, idx) => {
        if (step === correct[idx]) correctCount++;
    });
    document.getElementById('memory-feedback').textContent = `${correctCount}/${correct.length} passos corretos.`;
 });

 document.getElementById('memory-show').addEventListener('click', () => {
    document.getElementById('memory-feedback').textContent = state.currentMemory.steps.join('\n');
 });

// Database view
 function populateDatabase() {
    const list = document.getElementById('db-list');
    const filter = document.getElementById('filter-tag');
    function render() {
        const tag = filter.value.trim().toLowerCase();
        list.innerHTML = '';
        const all = [...state.data.flash, ...state.data.memory];
        all.filter(item => !tag || (item.tags && item.tags.some(t => t.toLowerCase().includes(tag)))).forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.front || item.title;
            list.appendChild(li);
        });
    }
    filter.addEventListener('input', render);
    render();
 }

loadData();
