const $ = (id) => document.getElementById(id);

// Config
const STORAGE_KEY = "bookquest_state_v6";
const DRIVE_FILENAME = "bookquest_state.json";
const BUILD_VERSION = "Build v1.2.0-share-fix"; 
const GOOGLE_CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";

// I18N Dictionary
const TRANSLATIONS = {
  en: {
    // ... (mismos textos base) ...
    nav_dashboard: "Dashboard", nav_books: "Books", nav_session: "Session", nav_stats: "Stats", nav_achievements: "Achievements", nav_quotes: "Quotes", nav_settings: "Settings", nav_history: "History",
    dash_title: "Dashboard", lbl_stats_range: "Stats range",
    opt_7days: "7 days", opt_30days: "30 days", opt_1year: "1 year", opt_alltime: "All time",
    btn_gen_story: "Share / Create Image", 
    title_active_book: "Active book", btn_mark_finish: "Mark finished",
    sum_edit_book: "Edit active book", btn_save: "Save Changes", btn_delete: "Delete book", 
    lbl_change_cover: "Change Cover", lbl_times_read: "Times Read", lbl_rating: "Rating (0-5)",
    lbl_mode: "Mode", btn_start: "Start", btn_pause: "Pause", btn_hyper: "Keep going",
    title_locked: "Next Up (Locked)", title_unlocked: "Unlocked",
    status_autopull: "Syncing...", status_saved: "Saved to Drive ✅", status_loaded: "Loaded ✅", status_token_exp: "Re-connecting...",
    share_opt_progress: "Current Progress", share_opt_finish: "Book Finished", share_opt_stats: "Yearly Stats"
  },
  es: {
    nav_dashboard: "Tablero", nav_books: "Libros", nav_session: "Sesión", nav_stats: "Estadísticas", nav_achievements: "Logros", nav_quotes: "Citas", nav_settings: "Ajustes", nav_history: "Historial",
    dash_title: "Tablero", lbl_stats_range: "Rango de estadísticas",
    opt_7days: "7 días", opt_30days: "30 días", opt_1year: "1 año", opt_alltime: "Todo el tiempo",
    btn_gen_story: "Compartir / Crear Imagen", 
    title_active_book: "Libro activo", btn_mark_finish: "Marcar terminado",
    sum_edit_book: "Editar libro activo", btn_save: "Guardar Cambios", btn_delete: "Borrar libro", 
    lbl_change_cover: "Cambiar Portada", lbl_times_read: "Veces Leído", lbl_rating: "Calificación (0-5)",
    lbl_mode: "Modo", btn_start: "Comenzar", btn_pause: "Pausa", btn_hyper: "Seguir (Hyperfocus)",
    title_locked: "Siguientes (Bloqueados)", title_unlocked: "Desbloqueados",
    status_autopull: "Sincronizando...", status_saved: "Guardado en Drive ✅", status_loaded: "Cargado ✅", status_token_exp: "Reconectando...",
    share_opt_progress: "Progreso Actual", share_opt_finish: "Libro Terminado", share_opt_stats: "Resumen del Año"
  }
};

let currentLang = "es"; // Default to Spanish as requested via prompt context if user prefers

// ---------- State ----------
const state = {
  books: {},           
  activeBookId: null,
  sessions: [],        
  timer: { running:false, mode:"sprint", sprintMins:8, startMs:0, elapsedMs:0, intervalId:null, bell:false, paused:false },
  drive: { token:null, fileId:null, lastSyncISO:null },
  quotes: [] 
};
let autoSaveInterval = null;

// Helpers
function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function t(key){ return TRANSLATIONS[currentLang][key] || key; }
function rangeDays(){ return Number($("rangeSelect").value || 30); }
function inRange(iso, days){
  const d = new Date(iso);
  const now = new Date();
  const ms = days * 24 * 3600 * 1000;
  return (now - d) <= ms;
}

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(state, data);
    if(!state.quotes) state.quotes = [];
  }catch(_){}
}

function updateLanguageUI(){
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if(TRANSLATIONS[currentLang][key]) el.textContent = TRANSLATIONS[currentLang][key];
  });
  renderAll();
}

function setLanguage(lang){ currentLang = lang; updateLanguageUI(); }

function ensureDefaultBook(){
  if(Object.keys(state.books).length > 0) return;
  const id = uid();
  state.books[id] = { id, title:"Mi Primer Libro", totalPages:300, currentPage:0, createdAt:new Date().toISOString(), isPlaceholder: true };
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
  updateTimerUI();

  const tick = () => {
    if(!state.timer.running || state.timer.paused) return;
    state.timer.elapsedMs = Date.now() - state.timer.startMs;
    if(state.timer.mode === "sprint"){
      const target = state.timer.sprintMins * 60 * 1000;
      const remaining = target - state.timer.elapsedMs;
      if(remaining <= 0 && !state.timer.bell){
        state.timer.bell = true;
        beep();
        $("timerHint").textContent = "Sprint Fin ✅";
        $("hyper").disabled = false;
      }
      if(!state.timer.bell) $("timerBig").textContent = formatMMSS(remaining);
      else $("timerBig").textContent = "+" + formatMMSS(-remaining);
    }else{
      $("timerBig").textContent = formatMMSS(state.timer.elapsedMs);
      $("timerHint").textContent = "Modo Flow 🔥";
    }
  };
  tick();
  state.timer.intervalId = setInterval(tick, 250);
  save();
}

function hyperfocus(){
  if(!state.timer.running) return;
  state.timer.mode = "flow";
  state.timer.bell = true; 
  $("mode").value = "open"; 
  $("hyper").disabled = true;
  $("timerHint").textContent = "Hyperfocus Activado 🔥";
  save();
}

function updateTimerUI(){
  $("start").disabled = state.timer.running;
  $("pause").disabled = !state.timer.running;
  $("finish").disabled = !state.timer.running;
  $("pause").textContent = state.timer.paused ? "Resume" : t("btn_pause");
}

function togglePause(forcePause = false){
  if(!state.timer.running) return;
  if(forcePause){
     if(!state.timer.paused){
       state.timer.paused = true;
       $("pause").textContent = "Resume";
       $("timerHint").textContent = "En Pausa";
     }
     save(); return;
  }
  state.timer.paused = !state.timer.paused;
  if(state.timer.paused){
    $("pause").textContent = "Resume";
    $("timerHint").textContent = "En Pausa";
  }else{
    state.timer.startMs = Date.now() - state.timer.elapsedMs;
    $("pause").textContent = t("btn_pause");
  }
  save();
}

function finishSession(){
  if(!state.timer.running) return;
  state.timer.running = false;
  state.timer.paused = false;
  if(state.timer.intervalId) clearInterval(state.timer.intervalId);
  updateTimerUI();
  $("hyper").disabled = true;

  const book = activeBook();
  const endISO = new Date().toISOString();
  const startISO = new Date(state.timer.startMs).toISOString();
  const mins = Math.max(1, Math.round(state.timer.elapsedMs / 60000));
  const pages = Number($("pagesRead").value || 0);

  if(Number.isFinite(pages) && pages > 0){
    book.currentPage = Math.min(book.totalPages, (book.currentPage || 0) + pages);
  }
  state.sessions.push({ id: uid(), bookId: book.id, startISO, endISO, mins, pages: Math.max(0, pages) });

  $("pagesRead").value = "";
  $("timerBig").textContent = "GG";
  save(); renderAll();
}

// ---------- Charts (Stats) ----------
function aggregateDaily(bookId, days){
  const map = new Map();
  const now = new Date();
  // Init map with zeros for all days
  for(let i=days-1;i>=0;i--){
      const dt = new Date(now.getTime() - i*24*3600*1000);
      map.set(dt.toISOString().slice(0,10), {pages:0, mins:0});
  }
  
  for(const s of state.sessions){
    if(bookId && s.bookId !== bookId) continue;
    if(!inRange(s.endISO || s.startISO, days)) continue;
    const day = (s.endISO || s.startISO).slice(0,10);
    if(map.has(day)){
        const cur = map.get(day);
        cur.pages += (s.pages||0);
        cur.mins += (s.mins||0);
    }
  }
  
  const labels = [], pagesArr = [], minsArr = [];
  map.forEach((val, key) => {
      labels.push(key.slice(5)); // MM-DD
      pagesArr.push(val.pages);
      minsArr.push(val.mins);
  });
  return {labels, pagesArr, minsArr};
}

function drawBarChart(canvas, labels, values){
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#0c0c0d"; ctx.fillRect(0,0,W,H); 

  const maxV = Math.max(1, ...values);
  const padL = 40, padT = 20, plotH = H - 50, plotW = W - 50;
  
  // Bars
  const n = values.length;
  const barW = Math.max(2, Math.floor(plotW / n) - 2);
  
  for(let i=0;i<n;i++){
    const h = Math.round((values[i] / maxV) * plotH);
    const x = padL + i*(barW+2);
    const y = padT + (plotH - h);
    ctx.fillStyle = values[i]>0 ? "#4caf50" : "#222";
    ctx.fillRect(x, y, barW, h);
  }
  
  // Text
  ctx.fillStyle = "#888"; ctx.font = "12px sans-serif";
  ctx.fillText("Max: "+maxV, 5, padT);
  // Simple axis
  ctx.strokeStyle="#333"; ctx.beginPath(); ctx.moveTo(padL, padT+plotH); ctx.lineTo(padL+plotW, padT+plotH); ctx.stroke();
}

// ---------- Achievements ----------
const ACHIEVEMENTS = [
  {id:"first", emoji:"🌱", title:"Primer Paso", desc:"Termina 1 sesión", check:()=>state.sessions.length >= 1},
  {id:"streak3", emoji:"🔥", title:"En Racha", desc:"Racha de 3 días", check:()=>{
     const days = [...new Set(state.sessions.map(s=>(s.endISO||"").slice(0,10)))].sort();
     return days.length >= 3; 
  }},
  {id:"reader", emoji:"🐛", title:"Ratón de Biblioteca", desc:"Lee 100 páginas", check:()=>state.sessions.reduce((a,b)=>a+(b.pages||0),0) >= 100},
  {id:"finish1", emoji:"🏆", title:"Finalista", desc:"Termina un libro", check:()=>{
     return Object.values(state.books).some(b=> b.totalPages && b.currentPage >= b.totalPages);
  }},
  {id:"expert", emoji:"🎓", title:"Experto", desc:"Lee 1000 páginas", check:()=>state.sessions.reduce((a,b)=>a+(b.pages||0),0) >= 1000}
];

function checkAchievements(){
  const unlocked = ACHIEVEMENTS.filter(a => a.check());
  const locked = ACHIEVEMENTS.filter(a => !a.check());
  
  $("achUnlockedList").innerHTML = unlocked.map(a => `
       <div class="item" style="border-left: 3px solid #4caf50;">
          <div style="font-size:24px; float:left; margin-right:10px">${a.emoji}</div>
          <div class="itemTitle">${a.title}</div>
          <div class="small muted">${a.desc}</div>
       </div>`).join("") || "<div class='notice'>Sigue leyendo para desbloquear.</div>";

  // Crear contenedor para Locked si no existe (hack para restaurar funcionalidad)
  let lockCont = $("achNextList");
  if(!lockCont){
      const h2 = document.createElement("h2");
      h2.textContent = t("title_locked");
      lockCont = document.createElement("div");
      lockCont.id = "achNextList";
      lockCont.className = "list";
      const section = $("achUnlockedList").parentNode;
      section.appendChild(document.createElement("hr"));
      section.appendChild(h2);
      section.appendChild(lockCont);
  } else {
     // Update header text
     lockCont.previousElementSibling.textContent = t("title_locked");
  }

  lockCont.innerHTML = locked.slice(0,3).map(a => `
       <div class="item" style="opacity:0.5; border:1px dashed #444">
          <div style="font-size:24px; float:left; margin-right:10px">🔒</div>
          <div class="itemTitle">${a.title}</div>
          <div class="small muted">${a.desc}</div>
       </div>`).join("");
}

// ---------- Visuals & Edit ----------
function renderActiveBookCard(b){
  const card = $("activeBookCard");
  if(!b) { card.innerHTML = "<div class='notice'>No active book.</div>"; return; }
  
  const pct = b.totalPages ? Math.round((b.currentPage/b.totalPages)*100) : 0;
  
  card.innerHTML = `
    <div style="display:flex; gap:15px; align-items:flex-start; width:100%">
      <div style="width:80px; height:120px; background:#222; border:1px solid #444; display:flex; align-items:center; justify-content:center; border-radius:8px; color:#555; text-align:center; font-size:10px; overflow:hidden">
         ${b.coverData ? `<img src="${b.coverData}" style="width:100%; height:100%; object-fit:cover" />` : "NO COVER"}
      </div>
      <div style="flex:1">
         <h3 style="margin:0; font-size:18px">${b.title}</h3>
         <div class="small muted" style="margin-bottom:8px">${b.author || "Unknown"}</div>
         <div class="small">Page ${b.currentPage} / ${b.totalPages}</div>
         <div style="background:#222; height:6px; border-radius:3px; margin-top:6px; overflow:hidden">
            <div style="width:${pct}%; background:#fff; height:100%"></div>
         </div>
         <div class="small muted" style="margin-top:4px">${pct}% Completed</div>
      </div>
    </div>
  `;
}

// Share Logic Revamp
function showShareOptions(){
    // Show a simple modal or overlays to pick type
    const opts = `
      <div style="display:flex; flex-direction:column; gap:10px">
        <button class="btn" onclick="generateShareImage('progress')">${t("share_opt_progress")}</button>
        <button class="btn" onclick="generateShareImage('finish')">${t("share_opt_finish")}</button>
        <button class="btn" onclick="generateShareImage('stats')">${t("share_opt_stats")}</button>
      </div>
    `;
    $("storyHint").innerHTML = opts; 
    $("storyPreview").style.display = "none";
    $("downloadStory").disabled = true;
}

async function generateShareImage(type){
   const cvs = $("storyCanvas");
   const ctx = cvs.getContext("2d");
   const W = 1080, H = 1920;
   cvs.width = W; cvs.height = H;
   
   // Background
   const grd = ctx.createLinearGradient(0,0,0,H);
   grd.addColorStop(0, "#1a1a1a"); grd.addColorStop(1, "#000000");
   ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);
   
   // Common Data
   const b = activeBook();
   
   // Helper to load image
   const loadImg = (src) => new Promise(r => { 
       const i = new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; 
   });

   if(type === 'stats'){
       // YEARLY STATS
       ctx.fillStyle = "#fff"; ctx.textAlign="center";
       ctx.font = "bold 80px sans-serif"; ctx.fillText("Resumen de Lectura", W/2, 200);
       
       const days = 365;
       const totalP = state.sessions.filter(s=>inRange(s.endISO||s.startISO, days)).reduce((a,x)=>a+(x.pages||0),0);
       const totalM = state.sessions.filter(s=>inRange(s.endISO||s.startISO, days)).reduce((a,x)=>a+(x.mins||0),0);
       const booksFin = Object.values(state.books).filter(bk=>bk.totalPages && bk.currentPage>=bk.totalPages).length;

       ctx.font = "40px sans-serif"; ctx.fillStyle="#aaa";
       ctx.fillText("Este año", W/2, 300);
       
       let y = 600;
       const drawStat = (label, val, unit) => {
           ctx.fillStyle="#fff"; ctx.font="bold 120px monospace";
           ctx.fillText(val, W/2, y);
           ctx.fillStyle="#4caf50"; ctx.font="bold 40px sans-serif";
           ctx.fillText(unit, W/2, y+60);
           ctx.fillStyle="#888"; ctx.font="30px sans-serif";
           ctx.fillText(label, W/2, y+110);
           y += 350;
       }
       
       drawStat("Páginas Leídas", totalP, "PÁGINAS");
       drawStat("Tiempo Dedicado", Math.round(totalM/60), "HORAS");
       drawStat("Libros Terminados", booksFin, "LIBROS");

   } else {
       // BOOK SPECIFIC (Progress or Finish)
       if(!b) return;
       
       // Draw Cover Blur BG
       if(b.coverData){
           const img = await loadImg(b.coverData);
           if(img){
               ctx.save();
               ctx.globalAlpha = 0.2;
               ctx.drawImage(img, -200, -200, W+400, H+400); // Zoom blur effect
               ctx.restore();
               
               // Main Cover
               const coverW = 600; const coverH = 900;
               const x = (W-coverW)/2;
               // Shadow
               ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(x+20, 320, coverW, coverH);
               ctx.drawImage(img, x, 300, coverW, coverH);
           }
       }
       
       ctx.fillStyle = "#fff"; ctx.textAlign="center";
       ctx.font = "bold 60px sans-serif";
       ctx.fillText(b.title.substr(0,25) + (b.title.length>25?"...":""), W/2, 1350);
       ctx.font = "italic 40px sans-serif"; ctx.fillStyle = "#ccc";
       ctx.fillText(b.author || "Autor Desconocido", W/2, 1420);
       
       if(type === 'finish'){
           // Stars
           const rating = b.rating || 5;
           let stars = "⭐".repeat(rating);
           ctx.font = "80px sans-serif"; ctx.fillText(stars, W/2, 1550);
           
           ctx.fillStyle = "#4caf50"; ctx.font = "bold 50px sans-serif";
           ctx.fillText("LIBRO TERMINADO", W/2, 200);
       } else {
           // Progress
           const pct = b.totalPages ? Math.round((b.currentPage/b.totalPages)*100) : 0;
           ctx.fillStyle = "#fff"; ctx.font = "bold 100px monospace";
           ctx.fillText(pct + "%", W/2, 1600);
           
           // Bar
           ctx.fillStyle="#333"; ctx.fillRect(140, 1650, 800, 30);
           ctx.fillStyle="#4caf50"; ctx.fillRect(140, 1650, 8 * pct, 30);
       }
   }
   
   // Footer
   ctx.fillStyle = "#555"; ctx.font = "30px monospace";
   ctx.fillText("BookQuest App", W/2, H - 100);

   // Output
   $("storyPreview").src = cvs.toDataURL();
   $("storyPreview").style.display = "block";
   $("storyHint").textContent = ""; // clear menu
   $("downloadStory").disabled = false;
   $("downloadStory").onclick = () => {
      const a = document.createElement("a");
      a.download = `share_${type}.png`;
      a.href = cvs.toDataURL();
      a.click();
   };
}

// ---------- CRUD & Events ----------
function addBook(){
  const title = $("newTitle").value.trim() || "Untitled";
  const total = Number($("newTotal").value);
  if(!total){ alert(t("alert_pages_req")); return; }
  const bookIds = Object.keys(state.books);
  if(bookIds.length === 1 && state.books[bookIds[0]].isPlaceholder) delete state.books[bookIds[0]];

  const id = uid();
  const newB = { id, title, totalPages:total, currentPage: Number($("newCurrent").value||0), createdAt:new Date().toISOString(), author: $("newAuthor").value };
  
  const fileInput = $("newCover");
  if(fileInput.files[0]){
     const reader = new FileReader();
     reader.onload = (e) => { newB.coverData = e.target.result; state.books[id] = newB; state.activeBookId = id; save(); renderAll(); };
     reader.readAsDataURL(fileInput.files[0]);
  } else {
     state.books[id] = newB; state.activeBookId = id; save(); renderAll();
  }
  
  $("newTitle").value=""; $("newTotal").value=""; $("newAuthor").value=""; $("newCurrent").value=""; $("newCover").value="";
}

function saveBook(){
  const b = activeBook();
  b.title = $("editTitle").value;
  b.totalPages = Number($("editTotal").value);
  b.currentPage = Number($("editCurrent").value);
  
  // Save extra fields injected via JS
  if($("editTimesRead")) b.timesRead = Number($("editTimesRead").value);
  if($("editRating")) b.rating = Number($("editRating").value);
  
  // Handle cover update if file selected
  const f = $("editCoverBtn")?.files[0];
  if(f){
      const r = new FileReader();
      r.onload = (e) => { b.coverData = e.target.result; save(); renderAll(); };
      r.readAsDataURL(f);
  } else {
      save(); renderAll();
  }
}

function deleteBook(){
  if(!confirm("Sure?")) return;
  delete state.books[state.activeBookId];
  ensureDefaultBook();
  save(); renderAll();
}

function markUnread(){
  const b = activeBook();
  if(!b) return;
  b.currentPage = Math.max(0, b.totalPages - 1); 
  save(); renderAll();
}

function rereadBook(){
  const b = activeBook();
  if(!b) return;
  if(!confirm("Re-read?")) return;
  b.timesRead = (b.timesRead || 0) + 1;
  b.currentPage = 0;
  save(); renderAll();
}

// ---------- Render Logic ----------
function renderAll(){
  const sel = $("bookSelect"); const qSel = $("quoteBookSelect");
  const ids = Object.keys(state.books);
  const opts = ids.map(id=> `<option value="${id}">${state.books[id].title}</option>`).join("");
  sel.innerHTML = opts; qSel.innerHTML = `<option value="">${t("opt_none")}</option>` + opts;
  if(state.activeBookId) sel.value = state.activeBookId;

  const b = activeBook();
  if(b){
    // Basic Edit Fields
    $("editTitle").value = b.title || "";
    $("editTotal").value = b.totalPages || 0;
    $("editCurrent").value = b.currentPage || 0;
    $("timesReadVal").textContent = b.timesRead || 0;

    // --- Inject Extra Edit Fields (Cover, TimesRead, Rating) ---
    // We target the parent of editCurrent and append if missing
    const container = $("editCurrent").parentNode.parentNode; // formGrid
    if(!document.getElementById("editCoverBtn")){
        // HTML Injection for Edit Fields
        const extras = document.createElement("div");
        extras.className = "field span2";
        extras.style.marginTop = "10px";
        extras.style.borderTop = "1px solid #333";
        extras.style.paddingTop = "10px";
        extras.innerHTML = `
           <div class="row">
             <div class="field">
                <label>${t("lbl_change_cover")}</label>
                <input type="file" id="editCoverBtn" accept="image/*">
             </div>
             <div class="field">
                <label>${t("lbl_times_read")}</label>
                <input type="number" id="editTimesRead" value="${b.timesRead||0}">
             </div>
             <div class="field">
                <label>${t("lbl_rating")}</label>
                <input type="number" id="editRating" min="0" max="5" value="${b.rating||0}">
             </div>
           </div>
        `;
        // Insert before the buttons
        const btnRow = container.querySelector(".span2:last-child");
        container.insertBefore(extras, btnRow);
    } else {
        // Just update values
        $("editTimesRead").value = b.timesRead || 0;
        $("editRating").value = b.rating || 0;
    }

    const isFinished = b.totalPages && b.currentPage >= b.totalPages;
    $("markUnread").style.display = isFinished ? "inline-block" : "none";
    $("rereadBook").style.display = isFinished ? "inline-block" : "none";
    
    const pct = b.totalPages ? Math.round((b.currentPage/b.totalPages)*100) : 0;
    $("progress").textContent = `${b.currentPage}/${b.totalPages} (${pct}%)`;
    
    // Pace calculation
    const sessions = state.sessions.filter(s=>s.bookId === b.id);
    let p=0, m=0;
    sessions.slice(-10).forEach(s=>{ p+=s.pages||0; m+=s.mins||0; });
    const pace = m? p/m : 0;
    $("pace").textContent = pace.toFixed(2) + " p/min";
    
    if(isFinished) $("eta").textContent = "Done";
    else if(pace>0) $("eta").textContent = ((b.totalPages-b.currentPage)/pace/60).toFixed(1) + "h";
    else $("eta").textContent = "—";

    renderActiveBookCard(b);
    
    // Stats Charts
    const d = rangeDays();
    const agg = aggregateDaily(b.id, d);
    drawBarChart($("chartPages"), agg.labels, agg.pagesArr);
    const aggAll = aggregateDaily(null, d);
    drawBarChart($("chartAllPages"), aggAll.labels, aggAll.pagesArr);

    // KPI
    const totalPages = state.sessions.filter(s=>inRange(s.endISO||s.startISO, d)).reduce((a,x)=>a+(x.pages||0),0);
    const totalMins = state.sessions.filter(s=>inRange(s.endISO||s.startISO, d)).reduce((a,x)=>a+(x.mins||0),0);
    $("pagesRange").textContent = totalPages;
    $("minsRange").textContent = totalMins;
    $("booksCount").textContent = ids.length;
    $("booksDone").textContent = Object.values(state.books).filter(bk=>bk.totalPages && bk.currentPage>=bk.totalPages).length;
  }
  
  renderQuotes();
  checkAchievements(); 
  const hist = [...state.sessions].slice(-25).reverse();
  $("history").innerHTML = hist.map(s=>{ return `<div class="item"><b>${(s.endISO||"").slice(0,10)}</b> <span class="muted">${s.mins}m</span></div>`; }).join("");
  $("buildVersion").textContent = BUILD_VERSION;
}

// ---------- Drive Sync (Persistent-ish) ----------
function driveTokenClient(){
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  if(!window.google) return null;
  return google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID, scope: SCOPE,
    callback: (resp) => {
      if(resp.access_token){
        state.drive.token = resp.access_token;
        $("driveStatus").textContent = t("status_autopull");
        save();
        drivePull().then(() => { if(autoSaveInterval) clearInterval(autoSaveInterval); autoSaveInterval = setInterval(drivePush, 60000); });
      }
    }
  });
}

let _tokenClient = null;
function driveSignIn(){ if(!_tokenClient) _tokenClient = driveTokenClient(); if(_tokenClient) _tokenClient.requestAccessToken({prompt: ""}); }

// Handle 401 Expiration
async function handleDriveError(res){
    if(res.status === 401){
        $("driveStatus").textContent = t("status_token_exp");
        // Try to refresh implicitly
        if(!_tokenClient) _tokenClient = driveTokenClient();
        // Prompt empty to try silent or minimal prompt
        _tokenClient.requestAccessToken({prompt: ""}); 
        return true; 
    }
    return false;
}

async function driveFindFileId(){
  const q = encodeURIComponent(`name='${DRIVE_FILENAME}'`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
  if(await handleDriveError(res)) return null;
  if(!res.ok) throw new Error("List failed");
  const data = await res.json();
  return (data.files && data.files[0]) ? data.files[0].id : null;
}
async function drivePull(){
  try{
    if(!state.drive.token) return;
    let fileId = state.drive.fileId || await driveFindFileId();
    if(!fileId){ $("driveStatus").textContent = "No backup."; return; }
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
    if(await handleDriveError(res)) return;
    if(!res.ok) throw new Error("DL failed");
    const data = await res.json();
    Object.assign(state, data); state.drive.fileId = fileId; state.drive.lastSyncISO = new Date().toISOString();
    ensureDefaultBook(); save(); renderAll();
    $("driveStatus").textContent = `${t("status_loaded")} (${new Date().toLocaleTimeString()})`;
  }catch(e){ console.log(e); $("driveStatus").textContent = "Error pulling."; }
}
async function drivePush(){
  try{
    if(!state.drive.token) return;
    let fileId = state.drive.fileId || await driveFindFileId();
    const body = JSON.stringify(state);
    if(!fileId){
      const boundary = "foo_bar_baz";
      const metadata = { name: DRIVE_FILENAME, parents: ["appDataFolder"] };
      const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${body}\r\n--${boundary}--`;
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`, { method:"POST", headers: { Authorization: `Bearer ${state.drive.token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body: multipart });
      if(await handleDriveError(res)) return;
      if(!res.ok) throw new Error("Create failed");
      const d = await res.json(); fileId = d.id; state.drive.fileId = fileId;
    } else {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method: "PATCH", headers: { Authorization: `Bearer ${state.drive.token}`, "Content-Type": "application/json; charset=UTF-8" }, body });
      if(await handleDriveError(res)) return;
      if(!res.ok) throw new Error("Update failed");
    }
    state.drive.lastSyncISO = new Date().toISOString(); save();
    $("driveStatus").textContent = `${t("status_saved")} (${new Date().toLocaleTimeString()})`;
  }catch(e){ console.log(e); $("driveStatus").textContent = "Error saving."; }
}

// ---------- Init ----------
function bind(){
  $("langEn").addEventListener("click", ()=>setLanguage("en"));
  $("langEs").addEventListener("click", ()=>setLanguage("es"));
  $("addBook").addEventListener("click", addBook);
  $("saveBook").addEventListener("click", saveBook);
  $("deleteBook").addEventListener("click", deleteBook);
  $("markUnread").addEventListener("click", markUnread);
  $("rereadBook").addEventListener("click", rereadBook);
  $("start").addEventListener("click", startTimer);
  $("pause").addEventListener("click", ()=>togglePause(false));
  $("finish").addEventListener("click", finishSession);
  $("hyper").addEventListener("click", hyperfocus);
  $("makeStory").addEventListener("click", showShareOptions); // Modified binding
  $("rangeSelect").addEventListener("change", renderAll);

  document.querySelectorAll(".tabbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabbtn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      $("tab-" + target).classList.add("active");
      if(target === "quotes" && state.timer.running){ togglePause(true); }
    });
  });
  $("driveSignIn").addEventListener("click", driveSignIn);
  $("drivePull").addEventListener("click", drivePull);
  $("drivePush").addEventListener("click", drivePush);
  
  // OCR Logic reuse (preserved)
  let cropper=null;
  $("quoteImage").addEventListener("change", (e)=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=()=>{ $("imageToCrop").src=r.result; $("cropperOverlay").classList.add("open"); if(cropper)cropper.destroy(); cropper=new Cropper($("imageToCrop"),{viewMode:1}); }; r.readAsDataURL(f); e.target.value="";
  });
  $("btnScanText").addEventListener("click", async()=>{
     if(!cropper)return; $("ocrStatus").textContent=t("status_scanning");
     try{ const{data:{text}}=await Tesseract.recognize(cropper.getCroppedCanvas().toDataURL("image/png"),'eng'); $("quoteText").value=text.replace(/\n/g," ").trim(); $("cropperOverlay").classList.remove("open"); $("ocrStatus").textContent=""; }catch(e){alert(t("alert_ocr_error"));}
  });
  $("btnCancelCrop").addEventListener("click",()=>{$("cropperOverlay").classList.remove("open")});
  $("addQuote").addEventListener("click",()=>{
     const txt=$("quoteText").value.trim(); if(!txt)return;
     state.quotes.push({id:uid(), bookId:$("quoteBookSelect").value||state.activeBookId, text:txt, author:$("quoteAuthor").value, bookTitle:$("quoteBookTitle").value, page:$("quotePage").value});
     $("quoteText").value=""; save(); renderAll();
  });
}

load(); ensureDefaultBook(); bind(); updateLanguageUI();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
