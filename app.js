const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "bookquest_state_v3";
const DRIVE_FILENAME = "bookquest_state.json";

// ---------------------- State ----------------------
const state = {
  books: {},           // id -> {id,title,totalPages,currentPage,createdAt,finishedAt?}
  activeBookId: null,
  sessions: [],        // {id,bookId,startISO,endISO,mins,pages}
  timer: { running:false, mode:"sprint", sprintMins:8, startMs:0, elapsedMs:0, intervalId:null, bell:false, paused:false },
  drive: { token:null, fileId:null, lastSyncISO:null },
  game: {
    xp: 0,
    lastDailyKey: null,
    dailyQuestDone: false,
    weeklyKey: null,
    weeklyQuestDone: false,
    unlocked: {} // achId -> ISO
  },
  ui: { storyLastDataURL: null }
};

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function todayKey(d=new Date()){ return d.toISOString().slice(0,10); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function isoToDate(iso){ return new Date(iso); }

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(state, data);
    state.game = Object.assign({xp:0,lastDailyKey:null,dailyQuestDone:false,weeklyKey:null,weeklyQuestDone:false,unlocked:{}}, state.game||{});
    state.ui = Object.assign({storyLastDataURL:null}, state.ui||{});
  }catch(_){}
}

function ensureDefaultBook(){
  if(state.activeBookId && state.books[state.activeBookId]) return;
  const ids = Object.keys(state.books);
  if(ids.length){
    state.activeBookId = ids[0];
    return;
  }
  const id = uid();
  state.books[id] = { id, title:"My book", totalPages:300, currentPage:0, createdAt:new Date().toISOString() };
  state.activeBookId = id;
}

function activeBook(){ return state.books[state.activeBookId]; }

// ---------------------- Range helpers ----------------------
function rangeDays(){ return Number($("rangeSelect").value || 30); }
function inRange(iso, days){
  const d = new Date(iso);
  const now = new Date();
  return (now - d) <= (days * 86400000);
}
function sessionsInRange(days){
  return state.sessions.filter(s => inRange(s.endISO || s.startISO, days));
}
function sessionsForBookInRange(bookId, days){
  return state.sessions.filter(s => s.bookId===bookId && inRange(s.endISO || s.startISO, days));
}

// ---------------------- Timer ----------------------
function formatMMSS(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const m = Math.floor(s/60);
  const ss = String(s%60).padStart(2,"0");
  return `${String(m).padStart(2,"0")}:${ss}`;
}
function beep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.03;
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 180);
  }catch(_){}
}

function startTimer(){
  if(state.timer.running) return;
  state.timer.mode = $("mode").value;
  state.timer.sprintMins = Number($("sprintMins").value || 8);
  state.timer.running = true;
  state.timer.startMs = Date.now();
  state.timer.elapsedMs = 0;
  state.timer.bell = false;
  state.timer.paused = false;

  $("start").disabled = true;
  $("pause").disabled = false;
  $("finish").disabled = false;
  $("hyper").disabled = true;

  const tick = () => {
    if(!state.timer.running || state.timer.paused) return;
    state.timer.elapsedMs = Date.now() - state.timer.startMs;

    if(state.timer.mode === "sprint"){
      const target = state.timer.sprintMins * 60 * 1000;
      const remaining = target - state.timer.elapsedMs;

      if(remaining <= 0 && !state.timer.bell){
        state.timer.bell = true;
        beep();
        $("timerHint").textContent = "Sprint complete ✅ You can keep going (hyperfocus).";
        $("hyper").disabled = false;
      }
      if(!state.timer.bell){
        $("timerBig").textContent = formatMMSS(remaining);
        $("timerHint").textContent = "Just start. Decide later.";
      }else{
        $("timerBig").textContent = "+" + formatMMSS(-remaining);
      }
    }else{
      $("timerBig").textContent = formatMMSS(state.timer.elapsedMs);
      $("timerHint").textContent = "Flow mode: no limit. You're in charge.";
    }
  };

  tick();
  state.timer.intervalId = setInterval(tick, 250);
  save();
}

function togglePause(){
  if(!state.timer.running) return;
  state.timer.paused = !state.timer.paused;
  if(state.timer.paused){
    $("pause").textContent = "Resume";
    $("timerHint").textContent = "Paused.";
  }else{
    state.timer.startMs = Date.now() - state.timer.elapsedMs;
    $("pause").textContent = "Pause";
  }
  save();
}

function hyperfocus(){
  state.timer.mode = "flow";
  $("mode").value = "flow";
  $("hyper").disabled = true;
  $("timerHint").textContent = "Hyperfocus 🔥 Keep going. End the session whenever you like.";
  save();
}

// ---------------------- Pace / ETA ----------------------
function averagePace(bookId, N=10){
  const arr = state.sessions.filter(s => s.bookId===bookId && (s.pages||0)>0 && (s.mins||0)>0);
  if(!arr.length) return 0;
  const last = arr.slice(-N);
  let wSum = 0, pSum = 0;
  for(let i=0;i<last.length;i++){
    const s = last[i];
    const w = Math.pow(1.18, i);
    wSum += w;
    pSum += w * (s.pages / s.mins);
  }
  return pSum / wSum;
}

function computeETA(bookId){
  const b = state.books[bookId];
  if(!b || !b.totalPages) return "—";
  const remaining = Math.max(0, (b.totalPages||0) - (b.currentPage||0));
  if(remaining === 0) return "Finished 🎉";
  const pace = averagePace(bookId);
  if(pace <= 0) return "Need 1 session with pages";
  const mins = remaining / pace;
  const hours = mins / 60;
  if(hours < 2) return `~${Math.round(mins)} min`;
  if(hours < 24) return `~${hours.toFixed(1)} h`;
  return `~${(hours/24).toFixed(1)} days`;
}

// ---------------------- Aggregation for charts ----------------------
function fillDaily(map, days){
  const labels = [], pagesArr = [], minsArr = [];
  const now = new Date();
  for(let i=days-1;i>=0;i--){
    const dt = new Date(now.getTime() - i*86400000);
    const key = dt.toISOString().slice(0,10);
    const v = map.get(key) || {pages:0, mins:0};
    labels.push(key.slice(5)); // MM-DD
    pagesArr.push(v.pages);
    minsArr.push(v.mins);
  }
  return {labels, pagesArr, minsArr};
}

function aggregateDailyForBook(bookId, days){
  const map = new Map();
  for(const s of state.sessions){
    if(s.bookId !== bookId) continue;
    if(!inRange(s.endISO || s.startISO, days)) continue;
    const day = (s.endISO || s.startISO).slice(0,10);
    const cur = map.get(day) || {pages:0, mins:0};
    cur.pages += (s.pages||0);
    cur.mins += (s.mins||0);
    map.set(day, cur);
  }
  return fillDaily(map, days);
}

function aggregateDailyOverall(days){
  const map = new Map();
  for(const s of state.sessions){
    if(!inRange(s.endISO || s.startISO, days)) continue;
    const day = (s.endISO || s.startISO).slice(0,10);
    const cur = map.get(day) || {pages:0, mins:0};
    cur.pages += (s.pages||0);
    cur.mins += (s.mins||0);
    map.set(day, cur);
  }
  return fillDaily(map, days);
}

function aggregateOverall(days){
  let pages=0, mins=0;
  for(const s of state.sessions){
    if(!inRange(s.endISO || s.startISO, days)) continue;
    pages += (s.pages||0);
    mins += (s.mins||0);
  }
  return {pages, mins};
}

// ---------------------- Charts (offline-friendly) ----------------------
function drawBarChart(canvas, labels, values){
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#0c0c0d";
  ctx.fillRect(0,0,W,H);

  const maxV = Math.max(1, ...values);
  const padL = 46, padR = 10, padT = 10, padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  ctx.strokeStyle = "#2a2b2e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT+plotH);
  ctx.lineTo(padL+plotW, padT+plotH);
  ctx.stroke();

  const n = values.length;
  const gap = 1;
  const barW = Math.max(1, Math.floor(plotW / n) - gap);

  for(let i=0;i<n;i++){
    const v = values[i];
    const h = Math.round((v / maxV) * plotH);
    const x = padL + i*(barW+gap);
    const y = padT + (plotH - h);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = v === 0 ? 0.18 : 0.9;
    ctx.fillRect(x, y, barW, h);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#a8a8a8";
  ctx.font = "12px system-ui";
  ctx.fillText(String(maxV), 8, padT+12);

  const step = Math.ceil(n / 6);
  ctx.font = "11px system-ui";
  for(let i=0;i<n;i+=step){
    const x = padL + i*(barW+gap);
    ctx.fillText(labels[i], x, padT+plotH+18);
  }
}

function downloadCanvasPNG(canvas, filename){
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ---------------------- Game / Rewards ----------------------
function weekKey(d=new Date()){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}

function levelFromXP(xp){
  return Math.max(1, Math.floor(Math.sqrt(xp / 120)) + 1);
}
function nextLevelXP(level){
  return 120 * Math.pow(level, 2);
}
function computeStreak(){
  const daysWithSessions = new Set(state.sessions.map(s => (s.endISO||s.startISO).slice(0,10)));
  let streak = 0;
  const now = new Date();
  for(let i=0;;i++){
    const dt = new Date(now.getTime() - i*86400000);
    const key = dt.toISOString().slice(0,10);
    if(daysWithSessions.has(key)) streak++;
    else break;
  }
  return streak;
}

function refreshQuests(){
  const today = todayKey();
  const wk = weekKey(new Date());
  if(state.game.lastDailyKey !== today){
    state.game.lastDailyKey = today;
    state.game.dailyQuestDone = false;
  }
  if(state.game.weeklyKey !== wk){
    state.game.weeklyKey = wk;
    state.game.weeklyQuestDone = false;
  }
}

function dailyQuestProgress(){
  // Daily quest: 8 minutes today OR 4 pages today
  const today = todayKey();
  let mins=0, pages=0;
  for(const s of state.sessions){
    const key = (s.endISO||s.startISO).slice(0,10);
    if(key !== today) continue;
    mins += (s.mins||0);
    pages += (s.pages||0);
  }
  const done = (mins >= 8) || (pages >= 4);
  return {mins, pages, done};
}

function weeklyQuestProgress(){
  // Weekly quest: 5 sessions OR 60 minutes in the current ISO week
  const wk = weekKey(new Date());
  let sess=0, mins=0;
  for(const s of state.sessions){
    const d = isoToDate(s.endISO||s.startISO);
    if(weekKey(d) !== wk) continue;
    sess += 1;
    mins += (s.mins||0);
  }
  const done = (sess >= 5) || (mins >= 60);
  return {sess, mins, done};
}

const ACH = [
  {id:"first_session", name:"First session", desc:"Log your first reading session.", check:(ctx)=>ctx.totalSessions>=1},
  {id:"first_30_min", name:"30 minutes total", desc:"Accumulate 30 minutes of reading.", check:(ctx)=>ctx.totalMins>=30},
  {id:"first_100_pages", name:"100 pages total", desc:"Read 100 pages total.", check:(ctx)=>ctx.totalPages>=100},
  {id:"streak_3", name:"3-day streak", desc:"Read 3 days in a row.", check:(ctx)=>ctx.streak>=3},
  {id:"streak_7", name:"7-day streak", desc:"Read 7 days in a row.", check:(ctx)=>ctx.streak>=7},
  {id:"finish_one", name:"Finish a book", desc:"Mark a book as finished.", check:(ctx)=>ctx.finishedBooks>=1},
  {id:"finish_three", name:"Finish 3 books", desc:"Finish three books.", check:(ctx)=>ctx.finishedBooks>=3},
  {id:"level_5", name:"Level 5", desc:"Reach level 5.", check:(ctx)=>ctx.level>=5},
];

function computeContext(){
  const totalSessions = state.sessions.length;
  let totalPages=0, totalMins=0;
  for(const s of state.sessions){ totalPages += (s.pages||0); totalMins += (s.mins||0); }
  const streak = computeStreak();
  const level = levelFromXP(state.game.xp || 0);
  const finishedBooks = Object.values(state.books).filter(b => (b.totalPages||0)>0 && (b.currentPage||0) >= (b.totalPages||0)).length;
  return {totalSessions,totalPages,totalMins,streak,level,finishedBooks};
}

function unlockAchievements(){
  const ctx = computeContext();
  const newly = [];
  for(const a of ACH){
    if(state.game.unlocked[a.id]) continue;
    if(a.check(ctx)){
      state.game.unlocked[a.id] = new Date().toISOString();
      newly.push(a);
      state.game.xp += 50;
    }
  }
  return newly;
}

function awardXP(mins, pages){
  const xp = Math.round((mins * 2) + (pages * 6));
  state.game.xp += xp;
  return xp;
}

// ---------------------- Story PNG export ----------------------
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  const minR = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+minR, y);
  ctx.arcTo(x+w, y, x+w, y+h, minR);
  ctx.arcTo(x+w, y+h, x, y+h, minR);
  ctx.arcTo(x, y+h, x, y, minR);
  ctx.arcTo(x, y, x+w, y, minR);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

function drawKV(ctx, x, y, key, val){
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "30px system-ui";
  ctx.fillText(key, x, y);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui";
  ctx.fillText(val, x, y + 60);
}
function drawStatRow(ctx, x, y, k1, v1, k2, v2){
  const colW = 420;
  drawKV(ctx, x, y, k1, v1);
  drawKV(ctx, x + colW + 120, y, k2, v2);
}

function paceText(bookId){
  const p = averagePace(bookId);
  return p > 0 ? `${p.toFixed(2)} pages/min` : "—";
}

function drawStory(scope){
  const c = $("storyCanvas");
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;

  ctx.fillStyle = "#0f0f10";
  ctx.fillRect(0,0,W,H);

  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"#15161a");
  grad.addColorStop(1,"#0f0f10");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  const pad = 80;
  const cardX = pad, cardY = 220, cardW = W - pad*2, cardH = H - 420;
  ctx.fillStyle = "#17181a";
  roundRect(ctx, cardX, cardY, cardW, cardH, 40, true, false);
  ctx.strokeStyle = "#2a2b2e";
  ctx.lineWidth = 4;
  roundRect(ctx, cardX, cardY, cardW, cardH, 40, false, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px system-ui";
  ctx.fillText("Book Quest", pad, 150);

  const days = rangeDays();
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "32px system-ui";
  ctx.fillText(`Summary · last ${days} days`, pad, 200);

  const ctx2 = computeContext();
  const level = ctx2.level;
  const streak = ctx2.streak;
  const xp = state.game.xp || 0;

  const left = cardX + 60;
  let y = cardY + 90;

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px system-ui";
  ctx.fillText(scope === "overall" ? "Overall" : "Active book", left, y);

  y += 70;
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "34px system-ui";
  ctx.fillText(`Level ${level} · XP ${xp} · Streak ${streak} day${streak===1?"":"s"}`, left, y);

  y += 90;
  ctx.strokeStyle = "#2a2b2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(cardX + cardW - 60, y);
  ctx.stroke();

  y += 70;

  if(scope === "overall"){
    const agg = aggregateOverall(days);
    const books = Object.keys(state.books).length;
    const finished = Object.values(state.books).filter(b => (b.totalPages||0)>0 && (b.currentPage||0) >= (b.totalPages||0)).length;

    drawStatRow(ctx, left, y, "Books", String(books), "Finished", String(finished));
    y += 110;
    drawStatRow(ctx, left, y, "Pages", String(agg.pages), "Minutes", String(agg.mins));
    y += 110;

    const wp = weeklyQuestProgress();
    const dq = dailyQuestProgress();
    drawStatRow(ctx, left, y, "Weekly quest", wp.done ? "Done ✅" : "In progress", "Daily quest", dq.done ? "Done ✅" : "In progress");
    y += 140;

  }else{
    const b = activeBook();
    const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
    const remaining = Math.max(0, (b.totalPages||0) - (b.currentPage||0));
    const eta = computeETA(b.id);

    const bAgg = sessionsForBookInRange(b.id, days).reduce((acc,s)=>{
      acc.pages += (s.pages||0);
      acc.mins += (s.mins||0);
      acc.sessions += 1;
      return acc;
    }, {pages:0, mins:0, sessions:0});

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px system-ui";
    ctx.fillText(b.title || "Untitled", left, y);

    y += 70;
    drawStatRow(ctx, left, y, "Progress", `${pct}%`, "Remaining pages", String(remaining));
    y += 110;
    drawStatRow(ctx, left, y, "ETA", eta, "Pace", paceText(b.id));
    y += 110;
    drawStatRow(ctx, left, y, "Pages (range)", String(bAgg.pages), "Minutes (range)", String(bAgg.mins));
    y += 110;
    drawStatRow(ctx, left, y, "Sessions (range)", String(bAgg.sessions), "Daily quest", dailyQuestProgress().done ? "Done ✅" : "In progress");
    y += 140;
  }

  const unlockedCount = Object.keys(state.game.unlocked || {}).length;
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "32px system-ui";
  ctx.fillText(`Achievements unlocked: ${unlockedCount}/${ACH.length}`, left, cardY + cardH - 90);

  ctx.fillStyle = "#a8a8a8";
  ctx.font = "28px system-ui";
  ctx.fillText("Made for starting (ADHD-friendly).", pad, H - 90);

  state.ui.storyLastDataURL = c.toDataURL("image/png");
  $("downloadStory").disabled = false;
  $("storyHint").textContent = "Story PNG is ready — tap Download.";
  save();
}

function downloadStory(){
  const url = state.ui.storyLastDataURL;
  if(!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookquest_story_${todayKey()}.png`;
  a.click();
}

// ---------------------- Finish session ----------------------
function finishSession(){
  if(!state.timer.running) return;

  state.timer.running = false;
  state.timer.paused = false;
  if(state.timer.intervalId){
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }

  $("start").disabled = false;
  $("pause").disabled = true;
  $("finish").disabled = true;
  $("hyper").disabled = true;
  $("pause").textContent = "Pause";

  const book = activeBook();
  const endISO = new Date().toISOString();
  const startISO = new Date(state.timer.startMs).toISOString();
  const mins = Math.max(1, Math.round(state.timer.elapsedMs / 60000));
  const pages = Number($("pagesRead").value || 0);

  if(Number.isFinite(pages) && pages > 0){
    book.currentPage = Math.min(book.totalPages, (book.currentPage || 0) + pages);
  }

  state.sessions.push({ id: uid(), bookId: book.id, startISO, endISO, mins, pages: Math.max(0, pages) });

  refreshQuests();
  const gained = awardXP(mins, Math.max(0, pages));

  const dq = dailyQuestProgress();
  if(!state.game.dailyQuestDone && dq.done){
    state.game.dailyQuestDone = true;
    state.game.xp += 80;
  }
  const wq = weeklyQuestProgress();
  if(!state.game.weeklyQuestDone && wq.done){
    state.game.weeklyQuestDone = true;
    state.game.xp += 120;
  }

  const newly = unlockAchievements();
  const lvl = levelFromXP(state.game.xp);

  $("pagesRead").value = "";
  $("timerBig").textContent = "GG";
  const bonusTxt = (newly.length ? ` · +${newly.length} achievement${newly.length===1?"":"s"}` : "");
  $("timerHint").textContent = `Session saved ✅ +${gained} XP${bonusTxt}. Level ${lvl}.`;

  save();
  renderAll();
}

// ---------------------- CRUD books ----------------------
function addBook(){
  const title = $("newTitle").value.trim() || "Untitled";
  const totalPages = Number($("newTotal").value || 0);
  const currentPage = Number($("newCurrent").value || 0);

  if(!totalPages || totalPages < 1){
    alert("Please enter the total pages (excluding blank pages).");
    return;
  }

  const id = uid();
  state.books[id] = { id, title, totalPages, currentPage: clamp(currentPage,0,totalPages), createdAt:new Date().toISOString() };
  state.activeBookId = id;

  $("newTitle").value = "";
  $("newTotal").value = "";
  $("newCurrent").value = "";

  save();
  renderAll();
}

function saveActiveBook(){
  const b = activeBook();
  b.title = $("editTitle").value.trim() || b.title || "Untitled";
  b.totalPages = Number($("editTotal").value || b.totalPages || 0);
  b.currentPage = clamp(Number($("editCurrent").value || b.currentPage || 0), 0, b.totalPages || 0);
  save();
  renderAll();
}

function deleteActiveBook(){
  const b = activeBook();
  if(!confirm(`Delete "${b.title}"? (Sessions remain, but will show as “deleted book”.)`)) return;
  delete state.books[b.id];
  const ids = Object.keys(state.books);
  state.activeBookId = ids[0] || null;
  ensureDefaultBook();
  save();
  renderAll();
}

function markFinished(){
  const b = activeBook();
  if(!b || !b.totalPages) return;
  b.currentPage = b.totalPages;
  b.finishedAt = new Date().toISOString();
  const newly = unlockAchievements();
  if(newly.length) $("timerHint").textContent = `Nice. Book marked finished ✅ +${newly.length} achievement${newly.length===1?"":"s"}.`;
  save();
  renderAll();
}

// ---------------------- Manual sync ----------------------
function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookquest_${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(!data || typeof data !== "object") throw new Error("bad");
      Object.assign(state, data);
      state.game = Object.assign({xp:0,lastDailyKey:null,dailyQuestDone:false,weeklyKey:null,weeklyQuestDone:false,unlocked:{}}, state.game||{});
      state.ui = Object.assign({storyLastDataURL:null}, state.ui||{});
      ensureDefaultBook();
      refreshQuests();
      save();
      renderAll();
      alert("Imported ✅");
    }catch(_){
      alert("Could not import that JSON file.");
    }
  };
  reader.readAsText(file);
}

// ---------------------- Drive sync ----------------------
function setDriveUI(connected){
  $("drivePull").disabled = !connected;
  $("drivePush").disabled = !connected;
  $("driveStatus").textContent = connected ? "Connected. You can pull/save." : "Not connected.";
}

function driveTokenClient(){
  const CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  if(!window.google || !google.accounts || !google.accounts.oauth2){
    alert("Google Identity Services did not load.");
    return null;
  }
  return google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      if(resp && resp.access_token){
        state.drive.token = resp.access_token;
        save();
        setDriveUI(true);
        $("driveStatus").textContent = "Connected ✅ (token active)";
      }else{
        $("driveStatus").textContent = "No token received.";
      }
    }
  });
}

let _tokenClient = null;

function driveSignIn(){
  if(!_tokenClient) _tokenClient = driveTokenClient();
  if(!_tokenClient) return;
  _tokenClient.requestAccessToken({prompt: "consent"});
}

async function driveFindFileId(){
  const q = encodeURIComponent(`name='${DRIVE_FILENAME}'`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` }});
  if(!res.ok) throw new Error("files.list failed");
  const data = await res.json();
  const f = (data.files || [])[0];
  return f ? f.id : null;
}

async function drivePull(){
  try{
    if(!state.drive.token) return;
    let fileId = state.drive.fileId || await driveFindFileId();
    if(!fileId){
      $("driveStatus").textContent = "No file in Drive yet.";
      return;
    }
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` }});
    if(!res.ok) throw new Error("files.get failed");
    const text = await res.text();
    const data = JSON.parse(text);

    Object.assign(state, data);
    state.game = Object.assign({xp:0,lastDailyKey:null,dailyQuestDone:false,weeklyKey:null,weeklyQuestDone:false,unlocked:{}}, state.game||{});
    state.ui = Object.assign({storyLastDataURL:null}, state.ui||{});
    state.drive.fileId = fileId;
    state.drive.lastSyncISO = new Date().toISOString();

    ensureDefaultBook();
    refreshQuests();
    save();
    renderAll();
    $("driveStatus").textContent = "Pulled from Drive ✅";
  }catch(_){
    $("driveStatus").textContent = "Error pulling from Drive.";
  }
}

async function drivePush(){
  try{
    if(!state.drive.token) return;

    let fileId = state.drive.fileId || await driveFindFileId();
    const body = JSON.stringify(state);

    if(!fileId){
      const boundary = "-------bookquestboundary" + Math.random().toString(16).slice(2);
      const metadata = { name: DRIVE_FILENAME, parents: ["appDataFolder"] };
      const multipart =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${body}\r\n` +
        `--${boundary}--`;

      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.drive.token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`
          },
          body: multipart
        }
      );
      if(!res.ok) throw new Error("create failed");
      const data = await res.json();
      fileId = data.id;
      state.drive.fileId = fileId;
    }else{
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${state.drive.token}`,
            "Content-Type": "application/json; charset=UTF-8"
          },
          body
        }
      );
      if(!res.ok) throw new Error("update failed");
    }

    state.drive.lastSyncISO = new Date().toISOString();
    save();
    $("driveStatus").textContent = "Saved to Drive ✅";
  }catch(_){
    $("driveStatus").textContent = "Error saving to Drive.";
  }
}

// ---------------------- UI rendering ----------------------
function refreshBookSelect(){
  const sel = $("bookSelect");
  const ids = Object.keys(state.books);
  sel.innerHTML = ids.map(id => `<option value="${id}">${state.books[id].title}</option>`).join("");
  sel.value = state.activeBookId;
}

function renderHistory(){
  const hist = [...state.sessions].slice(-25).reverse();
  $("history").innerHTML = hist.map(s=>{
    const day = (s.endISO || s.startISO).slice(0,10);
    const b = state.books[s.bookId];
    const title = b ? b.title : "(deleted book)";
    return `
      <div class="item">
        <b>${day} · ${title}</b>
        <div class="muted small">${s.mins||0} min · ${s.pages||0} pages</div>
      </div>
    `;
  }).join("") || `<div class="muted small">No sessions yet.</div>`;
}

function renderDashboard(){
  refreshQuests();
  const ctx = computeContext();
  const level = ctx.level;
  const xp = state.game.xp || 0;
  const streak = ctx.streak;

  $("level").textContent = `Level ${level}`;
  $("xp").textContent = `${xp} / ${nextLevelXP(level)}`;
  $("streak").textContent = `${streak} day${streak===1?"":"s"}`;

  const dq = dailyQuestProgress();
  $("dailyQuest").textContent = dq.done ? "Done ✅" : `${dq.mins} min / ${dq.pages} pages (today)`;

  const unlockedIds = new Set(Object.keys(state.game.unlocked||{}));
  const unlocked = ACH.filter(a => unlockedIds.has(a.id));
  const locked = ACH.filter(a => !unlockedIds.has(a.id));

  $("achUnlocked").textContent = `${unlocked.length}/${ACH.length}`;
  $("achUnlockedList").textContent = unlocked.length ? unlocked.map(a => `• ${a.name}`).slice(0,6).join("\n") : "—";

  const next = locked.slice(0,4);
  $("achNext").textContent = `${locked.length} to go`;
  $("achNextList").textContent = next.length ? next.map(a => `• ${a.name} — ${a.desc}`).join("\n") : "All done 🎉";
}

function renderActiveBook(){
  const b = activeBook();
  $("editTitle").value = b.title || "";
  $("editTotal").value = b.totalPages || 0;
  $("editCurrent").value = b.currentPage || 0;

  const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
  $("progress").textContent = `${b.currentPage||0}/${b.totalPages||0} (${pct}%)`;

  const pace = averagePace(b.id);
  $("pace").textContent = pace > 0 ? `${pace.toFixed(2)} pages/min` : "—";
  $("eta").textContent = computeETA(b.id);

  const days = rangeDays();
  $("sessionsN").textContent = String(sessionsForBookInRange(b.id, days).length);

  const agg = aggregateDailyForBook(b.id, days);
  drawBarChart($("chartPages"), agg.labels, agg.pagesArr);
  drawBarChart($("chartMins"), agg.labels, agg.minsArr);
}

function renderOverall(){
  const days = rangeDays();
  const {pages, mins} = aggregateOverall(days);

  const ids = Object.keys(state.books);
  $("booksCount").textContent = String(ids.length);

  let done = 0;
  for(const id of ids){
    const b = state.books[id];
    if((b.totalPages||0)>0 && (b.currentPage||0) >= (b.totalPages||0)) done++;
  }
  $("booksDone").textContent = String(done);
  $("pagesRange").textContent = String(pages);
  $("minsRange").textContent = String(mins);

  const agg = aggregateDailyOverall(days);
  drawBarChart($("chartAllPages"), agg.labels, agg.pagesArr);
  drawBarChart($("chartAllMins"), agg.labels, agg.minsArr);
}

function renderAll(){
  refreshBookSelect();
  renderDashboard();
  renderActiveBook();
  renderOverall();
  renderHistory();
  save();
}

// ---------------------- PWA ----------------------
function setupPWA(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
  $("installHint").textContent = "Tip: on mobile, use “Add to Home Screen” to install it like an app.";
}

// ---------------------- Bind UI ----------------------
function bind(){
  $("addBook").addEventListener("click", addBook);

  $("bookSelect").addEventListener("change", ()=>{
    state.activeBookId = $("bookSelect").value;
    save();
    renderAll();
  });

  $("rangeSelect").addEventListener("change", renderAll);

  $("saveBook").addEventListener("click", saveActiveBook);
  $("deleteBook").addEventListener("click", deleteActiveBook);
  $("markFinished").addEventListener("click", markFinished);

  $("start").addEventListener("click", startTimer);
  $("pause").addEventListener("click", togglePause);
  $("finish").addEventListener("click", finishSession);
  $("hyper").addEventListener("click", hyperfocus);

  $("exportBtn").addEventListener("click", exportJSON);
  $("importFile").addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if(f) importJSON(f);
    e.target.value = "";
  });

  $("driveSignIn").addEventListener("click", driveSignIn);
  $("drivePull").addEventListener("click", drivePull);
  $("drivePush").addEventListener("click", drivePush);

  $("makeStory").addEventListener("click", ()=>{
    const scope = $("storyScope").value;
    drawStory(scope === "overall" ? "overall" : "book");
  });
  $("downloadStory").addEventListener("click", downloadStory);

  $("dlBookPages").addEventListener("click", ()=>downloadCanvasPNG($("chartPages"), `book_pages_${todayKey()}.png`));
  $("dlBookMins").addEventListener("click", ()=>downloadCanvasPNG($("chartMins"), `book_minutes_${todayKey()}.png`));
  $("dlAllPages").addEventListener("click", ()=>downloadCanvasPNG($("chartAllPages"), `overall_pages_${todayKey()}.png`));
  $("dlAllMins").addEventListener("click", ()=>downloadCanvasPNG($("chartAllMins"), `overall_minutes_${todayKey()}.png`));

  $("resetAll").addEventListener("click", ()=>{
    if(!confirm("Full reset? This deletes all local data on this device.")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

// ---------------------- Init ----------------------
load();
ensureDefaultBook();
refreshQuests();
bind();
setupPWA();
setDriveUI(Boolean(state.drive.token));
renderAll();
