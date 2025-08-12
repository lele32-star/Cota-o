import { QUESTIONS } from './data.js';

const STORAGE = {
  players: 'h400.players',
  progress: p => `h400.progress.${p}`,
  best: p => `h400.bestScores.${p}`,
  history: p => `h400.history.${p}`,
  settings: p => `h400.settings.${p}`,
};

let state = {
  player: null,
  mode: 'train',
  categories: [],
  count: 10,
  timePerQ: 0,
  sound: true,
  pool: [],
  index: 0,
  score: 0,
  streak: 0,
  mistakes: [],
  timerId: null,
};

function loadPlayers(){
  return JSON.parse(localStorage.getItem(STORAGE.players) || '[]');
}
function savePlayers(players){
  localStorage.setItem(STORAGE.players, JSON.stringify(players));
}

function initApp(){
  const players = loadPlayers();
  const sel = document.getElementById('player-select');
  sel.innerHTML = players.map(p=>`<option>${p}</option>`).join('');
  sel.addEventListener('change',()=>{ state.player=sel.value; renderDashboard();});
  document.getElementById('new-player').onclick=()=>{
    const name=prompt('Nome do jogador?');
    if(name){ players.push(name); savePlayers(players); sel.innerHTML=players.map(p=>`<option>${p}</option>`).join(''); sel.value=name; state.player=name; renderDashboard(); }
  };
  if(players.length){ sel.value=players[0]; state.player=players[0]; renderDashboard(); }
}

function renderDashboard(){
  renderCategorySelect();
  renderProgress();
  renderRanking();
}

function renderCategorySelect(){
  const area=document.getElementById('category-select');
  area.innerHTML='';
  for(const cat of Object.keys(QUESTIONS)){
    const unlocked=isUnlocked(cat);
    const id=`cat-${cat}`;
    area.innerHTML+=`<label><input type="checkbox" id="${id}" value="${cat}" ${unlocked?'':'disabled'}>${cat}</label>`;
  }
}

function isUnlocked(cat){
  const prog=loadProgress();
  if(!prog.unlocked) prog.unlocked=['limitations'];
  return prog.unlocked.includes(cat);
}

function loadProgress(){
  return JSON.parse(localStorage.getItem(STORAGE.progress(state.player))||'{"byCategory":{},"unlocked":["limitations"]}');
}
function saveProgress(progress){
  localStorage.setItem(STORAGE.progress(state.player), JSON.stringify(progress));
}

function renderProgress(){
  const area=document.getElementById('progress-area');
  const prog=loadProgress();
  area.innerHTML='<h2>Progresso</h2>';
  for(const cat of Object.keys(QUESTIONS)){
    const data=prog.byCategory[cat]||{correct:0,total:0};
    const pct=data.total?Math.round(100*data.correct/data.total):0;
    area.innerHTML+=`<div>${cat}: ${data.correct}/${data.total} (${pct}%)</div>`;
  }
}

function renderRanking(){
  const area=document.getElementById('ranking-area');
  area.innerHTML='<h2>Ranking</h2>';
  const best=JSON.parse(localStorage.getItem(STORAGE.best(state.player))||'{}');
  for(const mode of ['train','challenge']){
    if(best[mode]) area.innerHTML+=`<div>${mode}: ${best[mode]}</div>`;
  }
}

function startGame(cfg){
  state.mode=cfg.mode;
  state.categories=cfg.categories;
  state.timePerQ=cfg.timePerQ;
  state.count=cfg.count;
  state.sound=cfg.sound;
  state.pool=getQuestionPool(cfg.categories,cfg.count);
  state.index=0; state.score=0; state.streak=0; state.mistakes=[];
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  nextQuestion();
}

function getQuestionPool(categories,count){
  let pool=[];
  for(const cat of categories){ pool=pool.concat(QUESTIONS[cat].map(q=>({...q,category:cat}))); }
  pool=shuffle(pool);
  if(count==='all') return pool; else return pool.slice(0,count);
}

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

function nextQuestion(){
  if(state.index>=state.pool.length){ return endGame(); }
  const q=state.pool[state.index];
  renderQuestion(q);
  if(state.timePerQ>0){
    const timer=document.getElementById('timer');
    timer.classList.remove('hidden');
    let t=state.timePerQ; timer.textContent=t;
    state.timerId=setInterval(()=>{t--; timer.textContent=t; if(t<=0){clearInterval(state.timerId); handleAnswer(null);}},1000);
  }
}

function renderQuestion(q){
  const area=document.getElementById('question-area');
  const feedback=document.getElementById('feedback');
  feedback.textContent='';
  let html=`<p>${q.question || q.prompt}</p>`;
  if(q.type==='single'){ html+=q.options.map(o=>`<button class="opt">${o}</button>`).join(''); }
  else if(q.type==='numeric'){ html+='<input id="answer" type="number">'; html+='<button id="submit">Responder</button>'; }
  else if(q.officialSequence){
    html+='<ul id="seq-list"></ul><button id="submit">Validar</button>';
  } else { html+='<input id="answer" type="text"> <button id="submit">Responder</button>'; }
  area.innerHTML=html;
  if(q.type==='single'){ area.querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>handleAnswer(btn.textContent)); }
  else if(q.officialSequence){
    const list=area.querySelector('#seq-list');
    const shuffled=shuffle(q.officialSequence.map((s,i)=>({s,i})));
    list.innerHTML=shuffled.map(item=>`<li draggable="true" data-idx="${item.i}">${item.s}</li>`).join('');
    enableDrag(list);
    area.querySelector('#submit').onclick=()=>{
      const user=Array.from(list.children).map(li=>li.textContent.trim());
      handleAnswer(user);
    };
  } else {
    area.querySelector('#submit').onclick=()=>handleAnswer(area.querySelector('#answer').value);
  }
}

function enableDrag(list){
  let drag; list.addEventListener('dragstart',e=>{drag=e.target;});
  list.addEventListener('dragover',e=>e.preventDefault());
  list.addEventListener('drop',e=>{ if(e.target.tagName==='LI'){ list.insertBefore(drag,e.target); }});
}

function handleAnswer(ans){
  clearInterval(state.timerId);
  const q=state.pool[state.index];
  const res=validateAnswer(q,ans);
  if(res.correct){ updateScore(true); displayFeedback('Correto',true); }
  else{ updateScore(false); displayFeedback('Errado',false); state.mistakes.push({q,ans}); }
  state.index++;
  document.getElementById('next-btn').classList.remove('hidden');
  document.getElementById('next-btn').onclick=()=>{document.getElementById('next-btn').classList.add('hidden'); nextQuestion();};
}

function displayFeedback(msg,ok){ const fb=document.getElementById('feedback'); fb.textContent=msg; fb.style.color=ok?'green':'red'; }

function validateAnswer(q,ans){
  if(q.type==='numeric'){
    const num=parseFloat(ans); return {correct:Math.abs(num-q.answer)<= (q.tolerance||0)};
  }
  if(q.officialSequence){
    const norm=ans.map(a=>a.toLowerCase());
    const ok=q.acceptableKeywords.every((kw,i)=>kw.some(k=>norm[i]?.includes(k)));
    return {correct:ok};
  }
  return {correct:String(ans).trim().toLowerCase()===String(q.answer).trim().toLowerCase()};
}

function updateScore(correct){
  if(state.mode!=='challenge') return;
  if(correct){
    state.streak++; state.score+=10; if(state.streak%3===0) state.score+=5;
  }else{ state.streak=0; }
}

function endGame(){
  document.getElementById('game').classList.add('hidden');
  document.getElementById('postgame').classList.remove('hidden');
  const pct=Math.round(100*(state.pool.length-state.mistakes.length)/state.pool.length);
  document.getElementById('score-summary').textContent=`Score ${state.score} - Acerto ${pct}%`;
  const list=document.getElementById('mistake-list');
  list.innerHTML=state.mistakes.map(m=>`<li>${m.q.question||m.q.prompt} — Resp: ${m.q.answer||m.q.officialSequence.join(', ')}</li>`).join('');
  document.getElementById('retry-errors').onclick=()=>replayMistakes();
  document.getElementById('back-dashboard').onclick=()=>{ document.getElementById('postgame').classList.add('hidden'); document.getElementById('dashboard').classList.remove('hidden'); renderProgress(); renderRanking(); };
  updateProgress(pct);
  saveBest(state.score);
  saveHistory(pct);
}

function replayMistakes(){
  state.pool=state.mistakes.map(m=>m.q);
  state.index=0; state.mistakes=[]; state.score=0; state.streak=0;
  document.getElementById('postgame').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  nextQuestion();
}

function updateProgress(pct){
  const prog=loadProgress();
  for(const cat of state.categories){
    const data=prog.byCategory[cat]||{correct:0,total:0};
    data.correct += Math.round(pct/100*state.pool.length);
    data.total += state.pool.length;
    prog.byCategory[cat]=data;
    if(pct>=80 && !prog.unlocked.includes(nextCat(cat))){ prog.unlocked.push(nextCat(cat)); }
  }
  saveProgress(prog);
}
function nextCat(cat){
  const cats=Object.keys(QUESTIONS); const idx=cats.indexOf(cat); return cats[idx+1];
}

function saveBest(score){ if(state.mode!=='challenge') return; const key=STORAGE.best(state.player); const best=JSON.parse(localStorage.getItem(key)||'{}'); best[state.mode]=Math.max(best[state.mode]||0,score); localStorage.setItem(key,JSON.stringify(best)); }

function saveHistory(pct){
  const key=STORAGE.history(state.player); const hist=JSON.parse(localStorage.getItem(key)||'[]'); hist.push({date:Date.now(),mode:state.mode,score:state.score,pct,categories:state.categories}); localStorage.setItem(key,JSON.stringify(hist)); }

document.getElementById('train-btn').onclick=()=>collectConfigAndStart('train');
document.getElementById('challenge-btn').onclick=()=>collectConfigAndStart('challenge');

document.getElementById('time-select').addEventListener('change',e=>state.timePerQ=parseInt(e.target.value));

document.getElementById('count-select').addEventListener('change',e=>state.count=e.target.value);

document.getElementById('sound-toggle').addEventListener('change',e=>state.sound=e.target.checked);

function collectConfigAndStart(mode){
  const cats=Array.from(document.querySelectorAll('#category-select input:checked')).map(i=>i.value);
  if(cats.length===0){alert('Selecione ao menos uma categoria'); return;}
  startGame({mode,categories:cats,count:state.count,timePerQ:state.timePerQ,sound:state.sound});
}

initApp();
