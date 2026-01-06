const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "bookquest_state_v2";
const DRIVE_FILENAME = "bookquest_state.json";

// ---------- State ----------
const state = {
  books: {},           // id -> {id,title,totalPages,currentPage,createdAt}
  activeBookId: null,
  sessions: [],        // {id,bookId,startISO,endISO,mins,pages}
  timer: { running:false, mode:"sprint", sprintMins:8, startMs:0, elapsedMs:0, intervalId:null, bell:false, paused:false },
  drive: { token:null, fileId:null, lastSyncISO:null },
};

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function todayKey(d=new Date()){ return d.toISOString().slice(0,10); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function fmt(n){ return Number.isFinite(n) ? n : 0; }

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(state, data);
  }catch(_){}
}

function ensureDefaultBook(){
  if(state.activeBookId && state.books[state.activeBookId]) return;
  const ids = Object.keys(state.books);
  if(ids.length){
    state.activeBookId = ids[0];
    return;
  }
  // create a placeholder book
  const id = uid();
  state.books[id] = { id, title:"Mi libro", totalPages:300, currentPage:0, createdAt:new Date().toISOString() };
  state.activeBookId = id;
}

function activeBook(){ return state.books[state.activeBookId]; }

// ---------- Timer ----------
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
        $("timerHint").textContent = "Sprint completo ✅ Puedes seguir (hyperfocus).";
        $("hyper").disabled = false;
      }
      if(!state.timer.bell){
        $("timerBig").textContent = formatMMSS(remaining);
        $("timerHint").textContent = "Sólo empieza. Al final decides.";
      }else{
        $("timerBig").textContent = "+" + formatMMSS(-remaining);
      }
    }else{
      $("timerBig").textContent = formatMMSS(state.timer.elapsedMs);
      $("timerHint").textContent = "Flow: sin límite. Tú mandas.";
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
    $("pause").textContent = "Reanudar";
    $("timerHint").textContent = "En pausa.";
  }else{
    // rebase startMs so elapsed continues correctly
    state.timer.startMs = Date.now() - state.timer.elapsedMs;
    $("pause").textContent = "Pausa";
  }
  save();
}

function hyperfocus(){
  state.timer.mode = "flow";
  $("mode").value = "flow";
  $("hyper").disabled = true;
  $("timerHint").textContent = "Hyperfocus 🔥 Sigue. Cierra sesión cuando quieras.";
  save();
}

function finishSession(){
  if(!state.timer.running) return;

  // stop
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
  $("pause").textContent = "Pausa";

  const book = activeBook();
  const endISO = new Date().toISOString();
  const startISO = new Date(state.timer.startMs).toISOString();
  const mins = Math.max(1, Math.round(state.timer.elapsedMs / 60000));

  const pages = Number($("pagesRead").value || 0);
  // Update current page (assuming "sin blancas" consistently)
  if(Number.isFinite(pages) && pages > 0){
    book.currentPage = Math.min(book.totalPages, (book.currentPage || 0) + pages);
  }

  state.sessions.push({ id: uid(), bookId: book.id, startISO, endISO, mins, pages: Math.max(0, pages) });

  $("pagesRead").value = "";
  $("timerBig").textContent = "GG";
  $("timerHint").textContent = "Sesión guardada ✅ ¿Otra mini-sesión?";
  save();
  renderAll();
}

// ---------- Stats / ETA ----------
function sessionsForBook(bookId){
  return state.sessions.filter(s => s.bookId === bookId);
}

// weighted average pace using last N sessions with pages>0
function averagePace(bookId, N=10){
  const arr = sessionsForBook(bookId).filter(s => (s.pages||0) > 0 && (s.mins||0) > 0);
  if(!arr.length) return 0;
  const last = arr.slice(-N);
  // exponential weights (recent heavier)
  let wSum = 0, pSum = 0;
  for(let i=0;i<last.length;i++){
    const s = last[i];
    const w = Math.pow(1.18, i); // increasing
    wSum += w;
    pSum += w * (s.pages / s.mins);
  }
  return pSum / wSum;
}

function computeETA(bookId){
  const b = state.books[bookId];
  if(!b || !b.totalPages) return "—";
  const remaining = Math.max(0, (b.totalPages||0) - (b.currentPage||0));
  if(remaining === 0) return "Terminado 🎉";
  const pace = averagePace(bookId);
  if(pace <= 0) return "Necesito 1 sesión con páginas";
  const mins = remaining / pace;
  const hours = mins / 60;
  if(hours < 2) return `~${Math.round(mins)} min`;
  if(hours < 24) return `~${hours.toFixed(1)} h`;
  return `~${(hours/24).toFixed(1)} días`;
}

function rangeDays(){
  return Number($("rangeSelect").value || 30);
}

function inRange(iso, days){
  const d = new Date(iso);
  const now = new Date();
  const ms = days * 24 * 3600 * 1000;
  return (now - d) <= ms;
}

function aggregateDaily(bookId, days){
  // returns arrays: labels (YYYY-MM-DD), pagesByDay, minsByDay
  const map = new Map(); // day -> {pages,mins}
  for(const s of state.sessions){
    if(s.bookId !== bookId) continue;
    if(!inRange(s.endISO || s.startISO, days)) continue;
    const day = (s.endISO || s.startISO).slice(0,10);
    const cur = map.get(day) || {pages:0, mins:0};
    cur.pages += (s.pages||0);
    cur.mins += (s.mins||0);
    map.set(day, cur);
  }
  // build continuous days list from oldest->today
  const labels = [];
  const pagesArr = [];
  const minsArr = [];

  const now = new Date();
  for(let i=days-1;i>=0;i--){
    const dt = new Date(now.getTime() - i*24*3600*1000);
    const key = dt.toISOString().slice(0,10);
    const v = map.get(key) || {pages:0, mins:0};
    labels.push(key.slice(5)); // MM-DD
    pagesArr.push(v.pages);
    minsArr.push(v.mins);
  }
  return {labels, pagesArr, minsArr};
}

function aggregateGlobal(days){
  let pages=0, mins=0;
  for(const s of state.sessions){
    if(!inRange(s.endISO || s.startISO, days)) continue;
    pages += (s.pages||0);
    mins += (s.mins||0);
  }
  return {pages, mins};
}

// ---------- Charts (simple bar charts, offline-friendly) ----------
function drawBarChart(canvas, labels, values){
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle = "#0c0c0d";
  ctx.fillRect(0,0,W,H);

  const maxV = Math.max(1, ...values);
  const padL = 40, padR = 10, padT = 10, padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // axes
  ctx.strokeStyle = "#2a2b2e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT+plotH);
  ctx.lineTo(padL+plotW, padT+plotH);
  ctx.stroke();

  // bars
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

  // y label (max)
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "12px system-ui";
  ctx.fillText(String(maxV), 6, padT+12);

  // x labels (sparse)
  const step = Math.ceil(n / 6);
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "11px system-ui";
  for(let i=0;i<n;i+=step){
    const x = padL + i*(barW+gap);
    ctx.fillText(labels[i], x, padT+plotH+18);
  }
}

function renderHistory(){
  const hist = [...state.sessions].slice(-25).reverse();
  $("history").innerHTML = hist.map(s=>{
    const day = (s.endISO || s.startISO).slice(0,10);
    const b = state.books[s.bookId];
    const title = b ? b.title : "(libro borrado)";
    return `
      <div class="item">
        <b>${day} · ${title}</b>
        <div class="muted small">${s.mins||0} min · ${s.pages||0} pág</div>
      </div>
    `;
  }).join("") || `<div class="muted small">Aún no hay sesiones.</div>`;
}

function refreshBookSelect(){
  const sel = $("bookSelect");
  const ids = Object.keys(state.books);
  sel.innerHTML = ids.map(id=>{
    const b = state.books[id];
    return `<option value="${id}">${b.title}</option>`;
  }).join("");
  sel.value = state.activeBookId;
}

function renderActiveBook(){
  const b = activeBook();
  $("editTitle").value = b.title || "";
  $("editTotal").value = b.totalPages || 0;
  $("editCurrent").value = b.currentPage || 0;

  const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
  $("progress").textContent = `${b.currentPage||0}/${b.totalPages||0} (${pct}%)`;

  const pace = averagePace(b.id);
  $("pace").textContent = pace > 0 ? `${pace.toFixed(2)} pág/min` : "—";
  $("eta").textContent = computeETA(b.id);

  const days = rangeDays();
  const bookSessionsInRange = sessionsForBook(b.id).filter(s=>inRange(s.endISO||s.startISO, days));
  $("sessionsN").textContent = String(bookSessionsInRange.length);

  const agg = aggregateDaily(b.id, days);
  drawBarChart($("chartPages"), agg.labels, agg.pagesArr);
  drawBarChart($("chartMins"), agg.labels, agg.minsArr);
}

function renderGlobal(){
  const days = rangeDays();
  const {pages, mins} = aggregateGlobal(days);

  const ids = Object.keys(state.books);
  $("booksCount").textContent = String(ids.length);

  let done = 0;
  for(const id of ids){
    const b = state.books[id];
    if(b.totalPages && (b.currentPage || 0) >= b.totalPages) done++;
  }
  $("booksDone").textContent = String(done);
  $("pagesRange").textContent = String(pages);
  $("minsRange").textContent = String(mins);
}

function renderAll(){
  refreshBookSelect();
  renderActiveBook();
  renderGlobal();
  renderHistory();
  save();
}

// ---------- CRUD Books ----------
function addBook(){
  const title = $("newTitle").value.trim() || "Sin título";
  const totalPages = Number($("newTotal").value || 0);
  const currentPage = Number($("newCurrent").value || 0);

  if(!totalPages || totalPages < 1){
    alert("Pon un total de páginas (sin blancas).");
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
  b.title = $("editTitle").value.trim() || b.title || "Sin título";
  b.totalPages = Number($("editTotal").value || b.totalPages || 0);
  b.currentPage = clamp(Number($("editCurrent").value || b.currentPage || 0), 0, b.totalPages || 0);
  save();
  renderAll();
}

function deleteActiveBook(){
  const b = activeBook();
  if(!confirm(`¿Eliminar "${b.title}"? (no borra sesiones, pero quedarán como “libro borrado”)`)) return;
  delete state.books[b.id];

  const ids = Object.keys(state.books);
  state.activeBookId = ids[0] || null;
  ensureDefaultBook();
  save();
  renderAll();
}

// ---------- Manual Sync ----------
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
      ensureDefaultBook();
      save();
      renderAll();
      alert("Importado ✅");
    }catch(_){
      alert("No pude importar ese JSON.");
    }
  };
  reader.readAsText(file);
}

// ---------- Drive Sync (GIS token model + Drive REST) ----------
function setDriveUI(connected){
  $("drivePull").disabled = !connected;
  $("drivePush").disabled = !connected;
  $("driveStatus").textContent = connected
    ? "Conectado. Puedes traer/guardar."
    : "No conectado.";
}

function driveTokenClient(){
  // You must replace this with your OAuth Web Client ID
  const CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";
  // appDataFolder scope for Drive application data :contentReference[oaicite:4]{index=4}
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

  if(!window.google || !google.accounts || !google.accounts.oauth2){
    alert("Google Identity Services no cargó.");
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
        $("driveStatus").textContent = "Conectado ✅ (token activo)";
      }else{
        $("driveStatus").textContent = "No se obtuvo token.";
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
  // List files in appDataFolder space :contentReference[oaicite:5]{index=5}
  const q = encodeURIComponent(`name='${DRIVE_FILENAME}'`);
  const url =
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${state.drive.token}` }
  });
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
      $("driveStatus").textContent = "No hay archivo en Drive todavía.";
      return;
    }

    // Download file contents with alt=media :contentReference[oaicite:6]{index=6}
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
    if(!res.ok) throw new Error("files.get alt=media failed");
    const text = await res.text();
    const data = JSON.parse(text);

    Object.assign(state, data);
    state.drive.fileId = fileId;
    state.drive.lastSyncISO = new Date().toISOString();

    ensureDefaultBook();
    save();
    renderAll();
    $("driveStatus").textContent = "Traído de Drive ✅";
  }catch(e){
    $("driveStatus").textContent = "Error al traer de Drive.";
  }
}

async function drivePush(){
  try{
    if(!state.drive.token) return;

    let fileId = state.drive.fileId || await driveFindFileId();
    const body = JSON.stringify(state);

    if(!fileId){
      // Create new file in appDataFolder using multipart upload :contentReference[oaicite:7]{index=7}
      const boundary = "-------bookquestboundary" + Math.random().toString(16).slice(2);
      const metadata = {
        name: DRIVE_FILENAME,
        parents: ["appDataFolder"]
      };

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
      if(!res.ok) throw new Error("create multipart failed");
      const data = await res.json();
      fileId = data.id;
      state.drive.fileId = fileId;
    }else{
      // Update existing file content (media upload) :contentReference[oaicite:8]{index=8}
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
      if(!res.ok) throw new Error("update media failed");
    }

    state.drive.lastSyncISO = new Date().toISOString();
    save();
    $("driveStatus").textContent = "Guardado en Drive ✅";
  }catch(e){
    $("driveStatus").textContent = "Error al guardar en Drive.";
  }
}

// ---------- PWA ----------
function setupPWA(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
  $("installHint").textContent = "Tip: en móvil, ‘Add to Home Screen’ para usarlo como app.";
}

// ---------- Bind UI ----------
function bind(){
  $("addBook").addEventListener("click", addBook);

  $("bookSelect").addEventListener("change", ()=>{
    state.activeBookId = $("bookSelect").value;
    save();
    renderAll();
  });

  $("rangeSelect").addEventListener("change", ()=>{
    renderAll();
  });

  $("saveBook").addEventListener("click", saveActiveBook);
  $("deleteBook").addEventListener("click", deleteActiveBook);

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

  $("resetAll").addEventListener("click", ()=>{
    if(!confirm("¿Reset total?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

// ---------- Init ----------
load();
ensureDefaultBook();
bind();
setupPWA();
setDriveUI(Boolean(state.drive.token));
renderAll();
