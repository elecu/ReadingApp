const $ = (id) => document.getElementById(id);

// Config
const STORAGE_KEY = "bookquest_state_v3";
const DRIVE_FILENAME = "bookquest_state.json";
const BUILD_VERSION = "Build v0.7.1-beta"; 
const GOOGLE_CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";

// I18N Dictionary
const TRANSLATIONS = {
  en: {
    nav_dashboard: "Dashboard", nav_books: "Books", nav_session: "Session", nav_stats: "Stats", nav_achievements: "Achievements", nav_quotes: "Quotes", nav_settings: "Settings", nav_history: "History",
    dash_title: "Dashboard", lbl_stats_range: "Stats range", lbl_export_scope: "Story export scope",
    opt_7days: "7 days", opt_30days: "30 days", opt_3months: "3 months", opt_6months: "6 months", opt_1year: "1 year", opt_alltime: "All time",
    opt_active_book: "Active book", opt_overall: "Overall",
    kpi_level: "Level", kpi_streak: "Streak", kpi_daily: "Daily quest",
    btn_gen_story: "Generate Story PNG", btn_dl_story: "Download Story PNG",
    title_active_book: "Active book", btn_mark_finish: "Mark finished", notice_finish: "Finishing is based on reaching total pages.",
    title_overall: "Overall", kpi_books: "Books", kpi_finished: "Finished", kpi_pages: "Pages", kpi_minutes: "Minutes",
    sum_add_book: "Add a book", lbl_title: "Title", lbl_author: "Author", lbl_total_pages: "Total pages", lbl_cur_page: "Current page", lbl_cover: "Cover image", btn_add: "Add",
    sum_edit_book: "Edit active book", btn_save: "Save", btn_delete: "Delete book", btn_mark_unread: "Mark Unread", btn_reread: "Re-read Book", lbl_reads: "times read",
    lbl_mode: "Mode", lbl_sprint_mins: "Sprint (minutes)", btn_start: "Start", btn_pause: "Pause", btn_end: "End session", btn_hyper: "Keep going",
    lbl_pages_read: "Pages read", title_active_stats: "Active book stats", kpi_progress: "Progress", kpi_pace: "Pace",
    title_chart_book: "Active book charts", title_chart_overall: "Overall charts", title_unlocked: "Unlocked",
    title_add_quote: "Add a quote", lbl_select_book: "Select Book", opt_none: "-- None --", lbl_quote_img: "1. Photo / Scan (Optional)", notice_ocr: "Upload to crop & extract text.", lbl_quote_text: "2. Quote Text", lbl_book_title: "Book Title", lbl_page: "Page (Info)", btn_save_quote: "Save quote", title_saved_quotes: "Saved quotes", lbl_gen_image: "Generate Image:", btn_story: "Story (9:16)", btn_post: "Post (1:1)",
    sec_sync: "Sync & Backup", lbl_language: "Language", drive_desc: "Stores progress as a JSON file in your Drive app data folder.", btn_signin: "Sign in with Google", btn_pull: "Pull from Drive", btn_push: "Save to Drive",
    modal_crop_title: "Crop & Scan", btn_scan: "Extract Text", btn_cancel: "Cancel",
    hint_paused: "Paused", hint_sprint_done: "Sprint complete ✅", hint_flow: "Flow mode.", hint_start: "Ready?",
    alert_pages_req: "Please enter total pages.", alert_imported: "Imported ✅", alert_ocr_error: "Could not read text.",
    status_scanning: "Scanning text...", status_connected: "Connected ✅", status_autopull: "Auto-syncing...", status_saved: "Saved to Drive ✅", status_loaded: "Loaded from Drive ✅"
  },
  es: {
    nav_dashboard: "Tablero", nav_books: "Libros", nav_session: "Sesión", nav_stats: "Estadísticas", nav_achievements: "Logros", nav_quotes: "Citas", nav_settings: "Ajustes", nav_history: "Historial",
    dash_title: "Tablero", lbl_stats_range: "Rango de estadísticas", lbl_export_scope: "Alcance de exportación",
    opt_7days: "7 días", opt_30days: "30 días", opt_3months: "3 meses", opt_6months: "6 meses", opt_1year: "1 año", opt_alltime: "Todo el tiempo",
    opt_active_book: "Libro activo", opt_overall: "General",
    kpi_level: "Nivel", kpi_streak: "Racha", kpi_daily: "Misión diaria",
    btn_gen_story: "Generar Historia PNG", btn_dl_story: "Descargar Historia PNG",
    title_active_book: "Libro activo", btn_mark_finish: "Marcar terminado", notice_finish: "Se basa en alcanzar el total de páginas.",
    title_overall: "General", kpi_books: "Libros", kpi_finished: "Terminados", kpi_pages: "Páginas", kpi_minutes: "Minutos",
    sum_add_book: "Agregar libro", lbl_title: "Título", lbl_author: "Autor", lbl_total_pages: "Páginas totales", lbl_cur_page: "Página actual", lbl_cover: "Portada", btn_add: "Agregar",
    sum_edit_book: "Editar libro activo", btn_save: "Guardar", btn_delete: "Borrar libro", btn_mark_unread: "Marcar NO leído", btn_reread: "Releer Libro", lbl_reads: "leídas",
    lbl_mode: "Modo", lbl_sprint_mins: "Sprint (minutos)", btn_start: "Comenzar", btn_pause: "Pausa", btn_end: "Terminar sesión", btn_hyper: "Seguir (Hyperfocus)",
    lbl_pages_read: "Páginas leídas", title_active_stats: "Estadísticas activas", kpi_progress: "Progreso", kpi_pace: "Ritmo",
    title_chart_book: "Gráficos del libro", title_chart_overall: "Gráficos generales", title_unlocked: "Desbloqueado",
    title_add_quote: "Agregar cita", lbl_select_book: "Elegir Libro", opt_none: "-- Ninguno --", lbl_quote_img: "1. Foto / Escanear (Opcional)", notice_ocr: "Sube para recortar y extraer texto.", lbl_quote_text: "2. Texto de la cita", lbl_book_title: "Título del libro", lbl_page: "Página (Info)", btn_save_quote: "Guardar cita", title_saved_quotes: "Citas guardadas", lbl_gen_image: "Generar Imagen:", btn_story: "Story (9:16)", btn_post: "Post (1:1)",
    sec_sync: "Respaldo y Sync", lbl_language: "Idioma", drive_desc: "Guarda el progreso como JSON en tu Google Drive.", btn_signin: "Iniciar sesión Google", btn_pull: "Traer de Drive", btn_push: "Guardar en Drive",
    modal_crop_title: "Recortar y Escanear", btn_scan: "Extraer Texto", btn_cancel: "Cancelar",
    hint_paused: "En pausa", hint_sprint_done: "Sprint completo ✅", hint_flow: "Modo Flow.", hint_start: "¿Listo?",
    alert_pages_req: "Por favor pon el total de páginas.", alert_imported: "Importado ✅", alert_ocr_error: "No se pudo leer el texto.",
    status_scanning: "Escaneando texto...", status_connected: "Conectado ✅", status_autopull: "Sincronizando...", status_saved: "Guardado en Drive ✅", status_loaded: "Cargado de Drive ✅"
  }
};

let currentLang = "en"; 

// ---------- State ----------
const state = {
  books: {},           
  activeBookId: null,
  sessions: [],        
  timer: { running:false, mode:"sprint", sprintMins:8, startMs:0, elapsedMs:0, intervalId:null, bell:false, paused:false },
  drive: { token:null, fileId:null, lastSyncISO:null },
  quotes: [] 
};

// Autosave Timer ID
let autoSaveInterval = null;

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function t(key){ return TRANSLATIONS[currentLang][key] || key; }

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
  // Update Drive Status if connected
  if(state.drive.token && state.drive.lastSyncISO){
      const time = new Date(state.drive.lastSyncISO).toLocaleTimeString();
      $("driveStatus").textContent = `Sync: ${time}`;
  }
  renderAll();
}

function setLanguage(lang){
  currentLang = lang;
  updateLanguageUI();
}

function ensureDefaultBook(){
  if(Object.keys(state.books).length > 0) return;
  
  const id = uid();
  state.books[id] = { id, title:"My First Book", totalPages:300, currentPage:0, createdAt:new Date().toISOString(), isPlaceholder: true };
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
        $("timerHint").textContent = t("hint_sprint_done");
        $("hyper").disabled = false;
      }
      if(!state.timer.bell) $("timerBig").textContent = formatMMSS(remaining);
      else $("timerBig").textContent = "+" + formatMMSS(-remaining);
    }else{
      $("timerBig").textContent = formatMMSS(state.timer.elapsedMs);
      $("timerHint").textContent = t("hint_flow");
    }
  };
  tick();
  state.timer.intervalId = setInterval(tick, 250);
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
       $("timerHint").textContent = t("hint_paused");
     }
     save();
     return;
  }

  state.timer.paused = !state.timer.paused;
  if(state.timer.paused){
    $("pause").textContent = "Resume";
    $("timerHint").textContent = t("hint_paused");
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
  save();
  renderAll();
}

// ---------- CRUD Books ----------
function addBook(){
  const title = $("newTitle").value.trim() || "Untitled";
  const total = Number($("newTotal").value);
  if(!total){ alert(t("alert_pages_req")); return; }
  
  // BUG FIX: Remove placeholder if it exists and is the only one
  const bookIds = Object.keys(state.books);
  if(bookIds.length === 1 && state.books[bookIds[0]].isPlaceholder){
     delete state.books[bookIds[0]];
  }

  const id = uid();
  state.books[id] = { id, title, totalPages:total, currentPage: Number($("newCurrent").value||0), createdAt:new Date().toISOString(), author: $("newAuthor").value };
  state.activeBookId = id;
  
  save(); renderAll();
  $("newTitle").value=""; $("newTotal").value=""; $("newAuthor").value=""; $("newCurrent").value="";
}

function saveBook(){
  const b = activeBook();
  b.title = $("editTitle").value;
  b.totalPages = Number($("editTotal").value);
  b.currentPage = Number($("editCurrent").value);
  save(); renderAll();
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
  if(!confirm("Re-read this book? Count will increase, page reset to 0.")) return;
  b.timesRead = (b.timesRead || 0) + 1;
  b.currentPage = 0;
  save(); renderAll();
}

// ---------- Quotes & OCR ----------
let cropper = null;
let lastSelectedQuote = null; 

function setupOCR(){
  $("quoteImage").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("imageToCrop").src = reader.result;
      $("cropperOverlay").classList.add("open");
      if(cropper) cropper.destroy();
      cropper = new Cropper($("imageToCrop"), { viewMode: 1 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  $("btnScanText").addEventListener("click", async () => {
    if(!cropper) return;
    $("ocrStatus").textContent = t("status_scanning");
    const canvas = cropper.getCroppedCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    try {
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');
      $("quoteText").value = text.replace(/\n/g, " ").trim();
      $("cropperOverlay").classList.remove("open");
      $("ocrStatus").textContent = "";
    } catch (err) {
      alert(t("alert_ocr_error"));
    }
  });

  $("btnCancelCrop").addEventListener("click", ()=>{ $("cropperOverlay").classList.remove("open"); });

  $("quoteBookSelect").addEventListener("change", (e)=>{
     const bId = e.target.value;
     if(bId && state.books[bId]){
       $("quoteAuthor").value = state.books[bId].author || "";
       $("quoteBookTitle").value = state.books[bId].title || "";
     }
  });

  $("addQuote").addEventListener("click", ()=>{
    const text = $("quoteText").value.trim();
    if(!text) return;
    state.quotes.push({
      id: uid(),
      bookId: $("quoteBookSelect").value || state.activeBookId,
      text,
      author: $("quoteAuthor").value,
      bookTitle: $("quoteBookTitle").value,
      page: $("quotePage").value
    });
    $("quoteText").value = "";
    save(); renderAll();
  });
  
  $("btnGenStory").addEventListener("click", ()=> generateQuoteImage("story"));
  $("btnGenPost").addEventListener("click", ()=> generateQuoteImage("post"));
}

function renderQuotes(){
  const container = $("quotesListContainer");
  container.innerHTML = "";
  
  const quotesByBook = {};
  state.quotes.forEach(q => {
    const key = q.bookTitle || "Unknown Book";
    if(!quotesByBook[key]) quotesByBook[key] = [];
    quotesByBook[key].push(q);
  });

  Object.keys(quotesByBook).forEach(title => {
    const wrapper = document.createElement("details");
    wrapper.className = "item";
    const summary = document.createElement("summary");
    summary.textContent = `📖 ${title} (${quotesByBook[title].length})`;
    wrapper.appendChild(summary);
    
    quotesByBook[title].forEach(q => {
      const d = document.createElement("div");
      d.style.padding = "10px";
      d.style.borderTop = "1px solid #333";
      d.innerHTML = `
        <div style="font-style:italic">"${q.text}"</div>
        <div class="small muted">— ${q.author || "?"}, p.${q.page||"?"}</div>
        <button class="btn small-btn" style="margin-top:5px">Select to Gen Image</button>
      `;
      d.querySelector("button").onclick = () => {
         lastSelectedQuote = q;
         $("quoteGenActions").style.display = "flex";
         document.querySelectorAll(".item div").forEach(x=>x.style.background="transparent");
         d.style.background = "rgba(255,255,255,0.05)";
      };
      wrapper.appendChild(d);
    });
    container.appendChild(wrapper);
  });
}

function generateQuoteImage(format){
  if(!lastSelectedQuote) return;
  const q = lastSelectedQuote;
  const cvs = $("quoteGenCanvas");
  const ctx = cvs.getContext("2d");
  
  const W = 1080;
  const H = format === "story" ? 1920 : 1080;
  cvs.width = W; cvs.height = H;
  
  ctx.fillStyle = "#121212";
  ctx.fillRect(0,0,W,H);
  
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  
  const fontSize = format === "story" ? 60 : 50;
  ctx.font = "italic " + fontSize + "px serif";
  
  const textX = W/2;
  const textY = H/2 - 100;
  const maxW = W - 140;
  
  wrapText(ctx, `"${q.text}"`, textX, textY, maxW, fontSize*1.3);
  
  ctx.font = "30px sans-serif";
  ctx.fillStyle = "#aaaaaa";
  ctx.fillText(q.author || "", W/2, H/2 + 200);
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(q.bookTitle || "", W/2, H/2 + 240);
  
  ctx.font = "20px monospace";
  ctx.fillStyle = "#555";
  ctx.fillText("BookQuest App", W/2, H - 50);

  const link = document.createElement('a');
  link.download = `quote_${format}.png`;
  link.href = cvs.toDataURL();
  link.click();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  
  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  let startY = y - ((lines.length-1) * lineHeight)/2;
  for(let i=0; i<lines.length; i++){
    ctx.fillText(lines[i], x, startY + (i*lineHeight));
  }
}

// ---------- Render Logic ----------
function renderAll(){
  const sel = $("bookSelect");
  const qSel = $("quoteBookSelect");
  const ids = Object.keys(state.books);
  
  const opts = ids.map(id=> `<option value="${id}">${state.books[id].title}</option>`).join("");
  sel.innerHTML = opts;
  qSel.innerHTML = `<option value="">${t("opt_none")}</option>` + opts;
  
  if(state.activeBookId) sel.value = state.activeBookId;

  const b = activeBook();
  if(b){
    $("editTitle").value = b.title || "";
    $("editTotal").value = b.totalPages || 0;
    $("editCurrent").value = b.currentPage || 0;
    $("timesReadVal").textContent = b.timesRead || 0;
    
    const isFinished = b.totalPages && b.currentPage >= b.totalPages;
    $("markUnread").style.display = isFinished ? "inline-block" : "none";
    $("rereadBook").style.display = isFinished ? "inline-block" : "none";
    
    const pct = b.totalPages ? Math.round((b.currentPage/b.totalPages)*100) : 0;
    $("progress").textContent = `${b.currentPage}/${b.totalPages} (${pct}%)`;
    
    const sessions = state.sessions.filter(s=>s.bookId === b.id);
    let p=0, m=0;
    sessions.slice(-10).forEach(s=>{ p+=s.pages||0; m+=s.mins||0; });
    const pace = m? p/m : 0;
    $("pace").textContent = pace.toFixed(2) + " p/min";
    
    if(isFinished) $("eta").textContent = "Done";
    else if(pace>0) $("eta").textContent = ((b.totalPages-b.currentPage)/pace/60).toFixed(1) + "h";
    else $("eta").textContent = "—";
  }

  renderQuotes();
  
  const hist = [...state.sessions].slice(-25).reverse();
  $("history").innerHTML = hist.map(s=>{
     return `<div class="item"><b>${(s.endISO||"").slice(0,10)}</b> <span class="muted">${s.mins}m</span></div>`;
  }).join("");
  
  $("buildVersion").textContent = BUILD_VERSION;
}

// ---------- Drive Sync (Restored & Enhanced) ----------
function driveTokenClient(){
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  if(!window.google) return null;
  return google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      if(resp.access_token){
        state.drive.token = resp.access_token;
        $("driveStatus").textContent = t("status_autopull");
        save();
        
        // AUTO PULL on sign in
        drivePull().then(() => {
           // Start Auto-Save (Every 1 minute)
           if(autoSaveInterval) clearInterval(autoSaveInterval);
           autoSaveInterval = setInterval(drivePush, 60000); 
           console.log("Auto-save enabled");
        });
      }
    }
  });
}

let _tokenClient = null;
function driveSignIn(){
  if(!_tokenClient) _tokenClient = driveTokenClient();
  if(_tokenClient) _tokenClient.requestAccessToken({prompt: "consent"});
}

async function driveFindFileId(){
  const q = encodeURIComponent(`name='${DRIVE_FILENAME}'`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
  if(!res.ok) throw new Error("List failed");
  const data = await res.json();
  return (data.files && data.files[0]) ? data.files[0].id : null;
}

async function drivePull(){
  try{
    if(!state.drive.token) return;
    let fileId = state.drive.fileId || await driveFindFileId();
    if(!fileId){
      $("driveStatus").textContent = "No backup found in Drive.";
      return;
    }
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
    if(!res.ok) throw new Error("DL failed");
    
    const data = await res.json();
    Object.assign(state, data); // merge
    state.drive.fileId = fileId; 
    state.drive.lastSyncISO = new Date().toISOString();
    
    ensureDefaultBook();
    save(); 
    renderAll();
    
    const time = new Date().toLocaleTimeString();
    $("driveStatus").textContent = `${t("status_loaded")} (${time})`;
  }catch(e){
    console.error(e);
    $("driveStatus").textContent = "Error pulling.";
  }
}

async function drivePush(){
  try{
    if(!state.drive.token) return;
    let fileId = state.drive.fileId || await driveFindFileId();
    const body = JSON.stringify(state);
    
    if(!fileId){
      // Create
      const boundary = "foo_bar_baz";
      const metadata = { name: DRIVE_FILENAME, parents: ["appDataFolder"] };
      const multipart = `
--${boundary}
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
--${boundary}
Content-Type: application/json; charset=UTF-8

${body}
--${boundary}--`;

      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`, {
         method:"POST",
         headers: { Authorization: `Bearer ${state.drive.token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
         body: multipart
      });
      if(!res.ok) throw new Error("Create failed");
      const d = await res.json();
      fileId = d.id;
      state.drive.fileId = fileId;
    } else {
      // Update
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
         method: "PATCH",
         headers: { Authorization: `Bearer ${state.drive.token}`, "Content-Type": "application/json; charset=UTF-8" },
         body
      });
      if(!res.ok) throw new Error("Update failed");
    }
    
    state.drive.lastSyncISO = new Date().toISOString();
    save();
    
    const time = new Date().toLocaleTimeString();
    $("driveStatus").textContent = `${t("status_saved")} (${time})`;
  }catch(e){
    console.error(e);
    $("driveStatus").textContent = "Error saving.";
  }
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
  
  document.querySelectorAll(".tabbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabbtn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      $( "tab-" + target ).classList.add("active");
      
      if(target === "quotes" && state.timer.running){
        togglePause(true); 
      }
    });
  });

  $("driveSignIn").addEventListener("click", driveSignIn);
  // Re-attached manual listeners
  $("drivePull").addEventListener("click", drivePull);
  $("drivePush").addEventListener("click", drivePush);
  
  setupOCR();
}

load();
ensureDefaultBook();
bind();
updateLanguageUI();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js");
}
