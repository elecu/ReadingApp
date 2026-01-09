const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "bookquest_state_v3";
const DRIVE_FILENAME = "bookquest_state.json";
const DEFAULT_CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";

const I18N = {
  "en-GB": {
    authTitle: "Connect Google Drive",
    authCopy: "Sign in once to unlock your tracker and keep every photo and session backed up safely.",
    authSignIn: "Sign in with Google",
    authMeta: "We only access your Drive app data folder.",
    authCheckingTitle: "Checking your session",
    authCheckingCopy: "Hang tight. Verifying your Google session.",
    navDashboard: "Dashboard",
    navBooks: "Books",
    navSession: "Session",
    navStats: "Stats",
    navAchievements: "Achievements",
    navQuotes: "Quotes",
    navSettings: "Settings",
    dashboardTitle: "Dashboard",
    statsRangeLabel: "Stats range",
    range7: "7 days",
    range30: "30 days",
    range90: "3 months",
    range180: "6 months",
    range365: "1 year",
    rangeAll: "All time",
    storyScopeLabel: "Story export scope",
    storyScopeBook: "Active book",
    storyScopeYear: "Year summary",
    storyScopeOverall: "Overall (range)",
    kpiLevel: "Level",
    kpiXp: "XP",
    kpiStreak: "Streak",
    kpiDailyQuest: "Daily quest",
    makeStory: "Generate Story PNG",
    downloadStory: "Download Story PNG",
    activeBookTitle: "Active book",
    markFinished: "Mark finished",
    shareFinish: "Share finish",
    finishNotice: "Finishing is based on reaching total pages (or marking manually).",
    overallTitle: "Overall (in range)",
    kpiBooks: "Books",
    kpiFinished: "Finished",
    kpiPages: "Pages",
    kpiMinutes: "Minutes",
    booksTitle: "Books",
    activeBookLabel: "Active book",
    addBookSummary: "Add a book",
    editBookSummary: "Edit active book",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Canto 2 (edition X)",
    authorLabel: "Author",
    authorPlaceholder: "e.g. ...",
    publisherLabel: "Publisher",
    publisherPlaceholder: "e.g. ...",
    editionLabel: "Edition",
    editionPlaceholder: "e.g. 2nd",
    totalPagesLabel: "Total pages",
    totalPagesPlaceholder: "e.g. 320",
    currentPageLabel: "Current page",
    currentPagePlaceholder: "e.g. 0",
    coverLabel: "Cover image (PNG/JPG/JPEG)",
    addBook: "Add",
    saveBook: "Save",
    deleteBook: "Delete book",
    sessionTitle: "Session",
    sessionBookLabel: "Reading book",
    sessionBookEmpty: "No active books",
    modeLabel: "Mode",
    modeSprint: "Sprint",
    modeOpen: "Open",
    sprintLabel: "Sprint (minutes)",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    endSession: "End session",
    keepGoing: "Keep going",
    pageRange: "Page range",
    pageCount: "Page count",
    fromPageLabel: "From page",
    fromPagePlaceholder: "Auto",
    toPageLabel: "To page (required)",
    toPagePlaceholder: "e.g. 42",
    pagesReadLabel: "Pages read",
    pagesReadPlaceholder: "e.g. 6",
    sessionNotice: "End session logs automatically and updates current page. Switching tabs won’t reset the timer.",
    activeBookStatsTitle: "Active book stats",
    progressLabel: "Progress",
    paceLabel: "Pace",
    etaLabel: "ETA",
    sessionsLabel: "Sessions (range)",
    activeBookCharts: "Active book charts",
    pagesPerDay: "Pages per day",
    minsPerDay: "Minutes per day",
    downloadPng: "Download PNG",
    overallCharts: "Overall charts",
    overallPagesPerDay: "Overall pages per day",
    overallMinsPerDay: "Overall minutes per day",
    unlockedTitle: "Unlocked",
    nextUpTitle: "Next up",
    addQuoteTitle: "Add a quote",
    quotePhotoHint: "Optional: extract text from a photo first, then edit it below.",
    quoteOcr: "Use photo for OCR",
    quoteLabel: "Quote",
    quotePlaceholder: "Paste or type the quote",
    quoteAuthorLabel: "Quote author",
    quoteAuthorPlaceholder: "e.g. the author",
    quotePageLabel: "Page",
    quotePagePlaceholder: "e.g. 42",
    saveQuote: "Save quote",
    previewQuote: "Preview PNG",
    downloadQuote: "Download PNG",
    savedQuotesTitle: "Saved quotes",
    quoteStory: "Story PNG",
    settingsTitle: "Settings",
    languageSummary: "Language",
    languageLabel: "Language",
    langEn: "English (UK)",
    langEs: "Spanish (Mexico)",
    languageNotice: "App text and share images follow this choice.",
    driveTitle: "Google Drive sync",
    driveNotice: "Connect once to keep your data and covers safely backed up.",
    driveConnect: "Connect Google Drive",
    driveSyncNow: "Sync now",
    driveDisconnect: "Log out",
    driveDisconnectConfirm: "Log out from Google Drive?",
    driveLogLabel: "Recent Drive uploads",
    driveLastBackup: "Backup uploaded {time}",
    driveLastBackupEmpty: "No backups yet.",
    manualBackupSummary: "Manual backup",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    manualBackupNotice: "Use this to move your progress between devices without signing in.",
    finishShareTitle: "Share your finish",
    finishRatingLabel: "Rating",
    finishRatingNone: "No rating",
    finishGenerate: "Generate Finish PNG",
    finishDownload: "Download PNG",
    finishClose: "Close",
    ocrTitle: "Extract text from photo",
    ocrUpload: "Upload photo",
    ocrCamera: "Take photo",
    ocrHint: "Drag to select the text area, then run OCR.",
    ocrUse: "Use selection",
    ocrCancel: "Cancel",
    statusConnected: "Connected",
    statusNotSigned: "Not signed in",
    statusPulled: "Pulled from Drive",
    statusSaved: "Saved to Drive",
    statusNoFile: "No file in Drive yet.",
    statusPullError: "Error pulling from Drive.",
    statusPushError: "Error saving to Drive.",
    toastSaved: "Saved",
    toastUpdated: "Updated",
    toastImported: "Imported",
    toastOcrMissing: "Add a photo first.",
    toastOcrWorking: "Reading text...",
    toastOcrDone: "Text ready. Edit if needed.",
    toastLoggedOut: "Logged out",
    confirmDeleteBook: "Delete \"{title}\"? (Sessions stay as deleted book)",
    confirmReset: "Reset everything?",
    alertNeedPages: "Add total pages (no blanks).",
    alertImportFail: "Could not import that JSON.",
    timerSprintDone: "Sprint complete. Keep going if you want.",
    timerSprintHint: "Just start. Decide at the end.",
    timerPaused: "Paused.",
    timerFlowHint: "Flow: no limit. You decide.",
    timerHyperHint: "Hyperfocus. Keep going.",
    sessionSaved: "Session saved. Another mini-session?",
    sessionNeedToPage: "Enter a final page.",
    etaFinished: "Finished",
    etaNeedPace: "Need one session with pages",
    storyTitleYear: "Your Reading Year",
    storyTitleOverall: "Your Reading Summary",
    storyTitleBook: "Current Book",
    storyBook: "Book",
    storyPages: "Pages",
    storyMinutes: "Minutes",
    storyHours: "Hours",
    storyBooks: "Books",
    storyFinished: "Finished",
    storySessions: "Sessions",
    storyProgress: "Progress",
    storyPace: "Pace",
    storyEta: "ETA",
    storyApp: "BookQuest",
    finishShareHeadline: "Finished",
    finishShareRating: "Rating",
    quoteShareLabel: "Quote",
    quoteShareBook: "Book",
    quoteSharePage: "Page",
    quoteShareApp: "BookQuest",
    quoteCopy: "Copy",
    quoteDelete: "Delete",
    bookSaved: "Changes saved.",
    resetTitle: "Reset data",
    resetCopy: "Deletes all local data on this device.",
    resetBtn: "Delete all data",
    resetConfirm1: "This will delete all your local data. Continue?",
    resetConfirm2: "Final confirmation: delete everything?",
    resetDone: "All data deleted.",
    achFirstTitle: "First Step",
    achFirstDesc: "Finish 1 session",
    achStreakTitle: "On Fire",
    achStreakDesc: "Read on 3 different days",
    achReaderTitle: "Bookworm",
    achReaderDesc: "Read 100 pages",
    achFinishTitle: "Finisher",
    achFinishDesc: "Finish a book",
    achExpertTitle: "Expert",
    achExpertDesc: "Read 1000 pages",
    achAllDone: "All achievements unlocked.",
    achKeepReading: "Keep reading to unlock.",
    achNextHint: "Next up",
    dayStreak: "day streak",
    dailyQuestDone: "Done",
    dailyQuestGoal: "Read {pages} pages",
    paceLabelUnit: "pages/min",
    minutesUnit: "min",
    pagesUnit: "pages",
    untitled: "Untitled",
    noQuotes: "No quotes yet.",
    noUploads: "No uploads yet.",
    daysUnit: "days"
  },
  "es-MX": (window.BOOKQUEST_I18N_ES || {})
};

const state = {
  books: {},
  activeBookId: null,
  sessions: [],
  quotes: [],
  timer: {
    running: false,
    mode: "sprint",
    sprintMins: 8,
    startMs: 0,
    elapsedMs: 0,
    intervalId: null,
    bell: false,
    paused: false
  },
  drive: {
    token: null,
    fileId: null,
    lastSyncISO: null,
    lastPullISO: null,
    autoMins: 1,
    syncLog: [],
    expiresAt: 0,
    hasConsent: false
  },
  settings: {
    lang: "en-GB"
  },
  ui: {
    quotesBookId: null,
    quoteAuthorAuto: ""
  }
};

let _tokenClient = null;
let _driveAutoId = null;
let _ocrState = null;
let _pendingNewCoverData = "";
let _authResolved = false;
let _authFallbackId = null;

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function todayKey(d=new Date()){ return d.toISOString().slice(0,10); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function fmt(n){ return Number.isFinite(n) ? n : 0; }

function t(key, vars){
  const lang = state.settings.lang || "en-GB";
  const dict = I18N[lang] || I18N["en-GB"];
  let str = dict[key] || I18N["en-GB"][key] || key;
  if(vars){
    for(const k of Object.keys(vars)){
      str = str.replace(`{${k}}`, vars[k]);
    }
  }
  return str;
}

function getConsentCookie(){
  const parts = document.cookie.split("; ").filter(Boolean);
  const row = parts.find(p => p.startsWith("bq_has_consent="));
  if(!row) return false;
  return row.split("=")[1] === "1";
}

function setConsentCookie(value){
  const maxAge = value ? 60 * 60 * 24 * 365 : 0;
  document.cookie = `bq_has_consent=${value ? "1" : "0"}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function applyI18n(){
  document.documentElement.lang = state.settings.lang || "en-GB";
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

function setLanguage(lang){
  state.settings.lang = lang;
  applyI18n();
  renderAll();
  save();
}

function save(){
  const snapshot = JSON.parse(JSON.stringify(state));
  if(snapshot.drive){
    snapshot.drive.token = null;
    snapshot.drive.expiresAt = 0;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(state, data);
  }catch(_){
    return;
  }
  state.drive = Object.assign({ token:null, fileId:null, lastSyncISO:null, lastPullISO:null, autoMins:1, syncLog:[], expiresAt:0, hasConsent:false }, state.drive || {});
  state.drive.token = null;
  state.drive.expiresAt = 0;
  state.drive.hasConsent = Boolean(state.drive.hasConsent) || getConsentCookie();
  if(!state.drive.autoMins || state.drive.autoMins < 1) state.drive.autoMins = 1;
  state.settings = Object.assign({ lang:"en-GB" }, state.settings || {});
  state.quotes = Array.isArray(state.quotes) ? state.quotes : [];
  state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "" }, state.ui || {});
  if(!state.books) state.books = {};
}

function normalizeBooks(){
  for(const id of Object.keys(state.books || {})){
    const b = state.books[id];
    if(!b.title) b.title = t("untitled");
    b.author = b.author || "";
    b.publisher = b.publisher || "";
    b.edition = b.edition || "";
    b.coverData = b.coverData || "";
    b.rating = b.rating || "";
    if(b.totalPages && (b.currentPage || 0) >= b.totalPages && !b.finishedAt){
      b.finishedAt = new Date().toISOString();
    }
  }
}

function isBookInProgress(b){
  if(!b) return false;
  if(!b.totalPages) return true;
  return (b.currentPage || 0) < b.totalPages;
}

function readingBooks(){
  return Object.values(state.books).filter(isBookInProgress);
}

function ensureQuoteBookSelection(){
  if(state.ui.quotesBookId && state.books[state.ui.quotesBookId]) return;
  const ids = Object.keys(state.books || {});
  state.ui.quotesBookId = state.activeBookId || ids[0] || null;
}

function ensureDefaultBook(){
  if(state.activeBookId && state.books[state.activeBookId]) return;
  const ids = Object.keys(state.books);
  if(ids.length){
    state.activeBookId = ids[0];
    return;
  }
  const id = uid();
  state.books[id] = {
    id,
    title: t("untitled"),
    author: "",
    publisher: "",
    edition: "",
    totalPages: 300,
    currentPage: 0,
    createdAt: new Date().toISOString(),
    coverData: "",
    rating: "",
    finishedAt: null
  };
  state.activeBookId = id;
  if(!state.ui.quotesBookId) state.ui.quotesBookId = id;
}



function activeBook(){ return state.books[state.activeBookId]; }

// ---------- UI Helpers ----------
function showToast(msg){
  const toast = $("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 2400);
}

function setAuthGate(show, mode = "login"){
  const gate = $("authGate");
  if(!gate) return;
  const title = gate.querySelector("h2");
  const copy = gate.querySelector(".authCopy");
  const btn = $("authSignIn");
  if(show){
    document.body.classList.add("auth");
    gate.classList.add("show");
    gate.setAttribute("aria-hidden", "false");
    if(mode === "checking"){
      gate.classList.add("checking");
      title.textContent = t("authCheckingTitle");
      copy.textContent = t("authCheckingCopy");
      btn.disabled = true;
    }else{
      gate.classList.remove("checking");
      applyI18n();
      btn.disabled = false;
    }
  }else{
    document.body.classList.remove("auth");
    gate.classList.remove("show");
    gate.setAttribute("aria-hidden", "true");
    gate.classList.remove("checking");
    btn.disabled = false;
  }
}

function formatDateTime(iso){
  if(!iso) return "—";
  const dt = new Date(iso);
  return new Intl.DateTimeFormat(state.settings.lang || "en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(dt);
}

function formatDateOnly(date){
  return new Intl.DateTimeFormat(state.settings.lang || "en-GB", {
    dateStyle: "medium"
  }).format(date);
}

function formatPace(pace){
  return pace > 0 ? `${pace.toFixed(2)} ${t("paceLabelUnit")}` : "—";
}

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
  }catch(_){ }
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
        $("timerHint").textContent = t("timerSprintDone");
        $("hyper").disabled = false;
      }
      if(!state.timer.bell){
        $("timerBig").textContent = formatMMSS(remaining);
        $("timerHint").textContent = t("timerSprintHint");
      }else{
        $("timerBig").textContent = "+" + formatMMSS(-remaining);
      }
    }else{
      $("timerBig").textContent = formatMMSS(state.timer.elapsedMs);
      $("timerHint").textContent = t("timerFlowHint");
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
    $("pause").textContent = t("resume");
    $("timerHint").textContent = t("timerPaused");
  }else{
    state.timer.startMs = Date.now() - state.timer.elapsedMs;
    $("pause").textContent = t("pause");
  }
  save();
}

function hyperfocus(){
  state.timer.mode = "flow";
  $("mode").value = "open";
  $("hyper").disabled = true;
  $("timerHint").textContent = t("timerHyperHint");
  save();
}

function getPagesRead(){
  if($("pagesModeRange").checked){
    const from = Number($("fromPage").value || activeBook().currentPage || 0);
    const to = Number($("toPage").value || 0);
    if(!to) return null;
    return Math.max(0, to - from + 1);
  }
  return Number($("pagesRead").value || 0);
}

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
  $("pause").textContent = t("pause");

  const book = activeBook();
  const endISO = new Date().toISOString();
  const startISO = new Date(state.timer.startMs).toISOString();
  const mins = Math.max(1, Math.round(state.timer.elapsedMs / 60000));

  const pages = getPagesRead();
  if(pages === null){
    alert(t("sessionNeedToPage"));
    return;
  }

  if(Number.isFinite(pages) && pages > 0){
    if($("pagesModeRange").checked){
      const to = Number($("toPage").value || book.currentPage || 0);
      book.currentPage = clamp(to, 0, book.totalPages || to);
    }else{
      book.currentPage = Math.min(book.totalPages, (book.currentPage || 0) + pages);
    }
  }
  if(book.totalPages && book.currentPage >= book.totalPages && !book.finishedAt){
    book.finishedAt = new Date().toISOString();
  }

  state.sessions.push({ id: uid(), bookId: book.id, startISO, endISO, mins, pages: Math.max(0, pages || 0) });

  $("pagesRead").value = "";
  $("fromPage").value = "";
  $("toPage").value = "";
  $("timerBig").textContent = "GG";
  $("timerHint").textContent = t("sessionSaved");
  save();
  renderAll();
}

function togglePagesMode(){
  const rangeOn = $("pagesModeRange").checked;
  $("rangeInputs").classList.toggle("hidden", !rangeOn);
  $("countInputs").classList.toggle("hidden", rangeOn);
}

// ---------- Stats / ETA ----------
function sessionsForBook(bookId){
  return state.sessions.filter(s => s.bookId === bookId);
}

function averagePace(bookId, N=10){
  const arr = sessionsForBook(bookId).filter(s => (s.pages||0) > 0 && (s.mins||0) > 0);
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
  if(remaining === 0) return t("etaFinished");
  const pace = averagePace(bookId);
  if(pace <= 0) return t("etaNeedPace");
  const mins = remaining / pace;
  const hours = mins / 60;
  if(hours < 2) return `~${Math.round(mins)} ${t("minutesUnit")}`;
  if(hours < 24) return `~${hours.toFixed(1)} h`;
  return `~${(hours/24).toFixed(1)} ${t("daysUnit")}`;
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
  const map = new Map();
  for(const s of state.sessions){
    if(bookId && s.bookId !== bookId) continue;
    if(!inRange(s.endISO || s.startISO, days)) continue;
    const day = (s.endISO || s.startISO).slice(0,10);
    const cur = map.get(day) || {pages:0, mins:0};
    cur.pages += (s.pages||0);
    cur.mins += (s.mins||0);
    map.set(day, cur);
  }
  const labels = [];
  const pagesArr = [];
  const minsArr = [];

  const now = new Date();
  for(let i=days-1;i>=0;i--){
    const dt = new Date(now.getTime() - i*24*3600*1000);
    const key = dt.toISOString().slice(0,10);
    const v = map.get(key) || {pages:0, mins:0};
    labels.push(key.slice(5));
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

function aggregateBookInRange(bookId, days){
  let pages=0, mins=0, sessions=0;
  for(const s of state.sessions){
    if(s.bookId !== bookId) continue;
    if(!inRange(s.endISO || s.startISO, days)) continue;
    pages += (s.pages||0);
    mins += (s.mins||0);
    sessions += 1;
  }
  return {pages, mins, sessions};
}

// ---------- Charts ----------
function drawBarChart(canvas, labels, values){
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  ctx.fillStyle = "#0c0c0d";
  ctx.fillRect(0,0,W,H);

  const maxV = Math.max(1, ...values);
  const padL = 40, padR = 10, padT = 10, padB = 28;
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
  ctx.fillText(String(maxV), 6, padT+12);

  const step = Math.ceil(n / 6);
  ctx.fillStyle = "#a8a8a8";
  ctx.font = "11px system-ui";
  for(let i=0;i<n;i+=step){
    const x = padL + i*(barW+gap);
    ctx.fillText(labels[i], x, padT+plotH+18);
  }
}

function downloadCanvas(canvas, filename){
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ---------- Dashboard + Stats ----------
function calcStreak(){
  const days = new Set();
  for(const s of state.sessions){
    const day = (s.endISO || s.startISO).slice(0,10);
    days.add(day);
  }
  let streak = 0;
  const now = new Date();
  for(;;){
    const key = new Date(now.getTime() - streak*24*3600*1000).toISOString().slice(0,10);
    if(days.has(key)){
      streak += 1;
    }else{
      break;
    }
  }
  return streak;
}

function renderDashboard(){
  const days = rangeDays();
  const {pages, mins} = aggregateGlobal(days);
  const xp = Math.round(pages * 3 + mins);
  const level = Math.floor(xp / 500) + 1;
  const streak = calcStreak();

  $("level").textContent = String(level);
  $("xp").textContent = String(xp);
  $("streak").textContent = `${streak} ${t("dayStreak")}`;

  const today = todayKey();
  let todayPages = 0;
  for(const s of state.sessions){
    const day = (s.endISO || s.startISO).slice(0,10);
    if(day === today) todayPages += (s.pages || 0);
  }
  if(todayPages >= 10){
    $("dailyQuest").textContent = t("dailyQuestDone");
  }else{
    $("dailyQuest").textContent = t("dailyQuestGoal", { pages: String(10 - todayPages) });
  }

  renderActiveBookCard();
}

function renderActiveBookCard(){
  const b = activeBook();
  if(!b){
    $("activeBookCard").innerHTML = "";
    return;
  }
  const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
  const pace = averagePace(b.id);
  const eta = computeETA(b.id);
  const cover = b.coverData
    ? `<img class="cover" src="${b.coverData}" alt="${b.title}" />`
    : `<div class="cover"></div>`;
  const authorLine = b.author ? `<div class="itemMeta">${b.author}</div>` : "";

  $("activeBookCard").innerHTML = `
    ${cover}
    <div>
      <div class="itemTitle">${b.title || t("untitled")}</div>
      ${authorLine}
      <div class="itemMeta">${b.currentPage || 0}/${b.totalPages || 0} (${pct}%)</div>
      <div class="itemMeta">${t("storyPace")}: ${formatPace(pace)}</div>
      <div class="itemMeta">${t("storyEta")}: ${eta}</div>
    </div>
  `;

  const finished = b.totalPages && (b.currentPage || 0) >= b.totalPages;
  $("shareFinish").disabled = !finished;
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

function renderSessionBookSelect(){
  const select = $("sessionBookSelect");
  if(!select) return;
  const cover = $("sessionCover");
  let books = readingBooks();
  if(!books.length){
    books = Object.values(state.books);
  }
  if(!books.length){
    select.innerHTML = "";
    if(cover) cover.style.backgroundImage = "";
    return;
  }
  if(!books.some(b => b.id === state.activeBookId)){
    state.activeBookId = books[0].id;
  }
  select.innerHTML = books.map(b => `<option value="${b.id}">${b.title}</option>`).join("");
  select.value = state.activeBookId;
  if(cover){
    const b = activeBook();
    cover.style.backgroundImage = b && b.coverData ? `url("${b.coverData}")` : "";
  }
}

function renderActiveBook(){
  const b = activeBook();
  if(!b) return;
  $("editTitle").value = b.title || "";
  $("editAuthor").value = b.author || "";
  $("editPublisher").value = b.publisher || "";
  $("editEdition").value = b.edition || "";
  $("editTotal").value = b.totalPages || 0;
  $("editCurrent").value = b.currentPage || 0;

  const pct = b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
  $("progress").textContent = `${b.currentPage||0}/${b.totalPages||0} (${pct}%)`;

  const pace = averagePace(b.id);
  $("pace").textContent = formatPace(pace);
  $("eta").textContent = computeETA(b.id);

  const days = rangeDays();
  const bookSessionsInRange = sessionsForBook(b.id).filter(s=>inRange(s.endISO||s.startISO, days));
  $("sessionsN").textContent = String(bookSessionsInRange.length);

  const agg = aggregateDaily(b.id, days);
  drawBarChart($("chartPages"), agg.labels, agg.pagesArr);
  drawBarChart($("chartMins"), agg.labels, agg.minsArr);

  const aggAll = aggregateDaily(null, days);
  drawBarChart($("chartAllPages"), aggAll.labels, aggAll.pagesArr);
  drawBarChart($("chartAllMins"), aggAll.labels, aggAll.minsArr);
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

function renderQuoteBooks(){
  const container = $("quoteBooks");
  if(!container) return;
  const books = Object.values(state.books);
  ensureQuoteBookSelection();
  if(!books.length){
    container.innerHTML = "";
    return;
  }
  container.innerHTML = books.map(b => {
    const active = b.id === state.ui.quotesBookId ? "active" : "";
    const cover = b.coverData
      ? `<img class="quoteBookCover" src="${b.coverData}" alt="${b.title}" />`
      : `<div class="quoteBookCover"></div>`;
    return `
      <div class="quoteBook ${active}" data-book-id="${b.id}">
        ${cover}
        <div class="quoteBookTitle">${b.title}</div>
      </div>
    `;
  }).join("");
}

function renderQuotes(){
  ensureQuoteBookSelection();
  renderQuoteBooks();
  syncQuoteAuthor();
  const bookId = state.ui.quotesBookId || state.activeBookId;
  if(!bookId){
    $("quotesList").innerHTML = `<div class="muted small">${t("noQuotes")}</div>`;
    return;
  }
  const list = state.quotes.filter(q => q.bookId === bookId).slice().reverse();
  $("quotesList").innerHTML = list.map(q => {
    const meta = [q.author, q.page ? `${t("quoteSharePage")}: ${q.page}` : ""].filter(Boolean).join(" · ");
    return `
      <div class="item">
        <div class="itemTitle">${q.text}</div>
        <div class="itemMeta">${meta}</div>
        <div class="itemActions">
          <button class="btn" data-quote-id="${q.id}" data-action="story">${t("quoteStory")}</button>
          <button class="btn" data-quote-id="${q.id}" data-action="copy">${t("quoteCopy")}</button>
          <button class="btn danger" data-quote-id="${q.id}" data-action="delete">${t("quoteDelete")}</button>
        </div>
      </div>
    `;
  }).join("") || `<div class="muted small">${t("noQuotes")}</div>`;
}

function syncQuoteAuthor(){
  const input = $("quoteAuthor");
  if(!input) return;
  const bookId = state.ui.quotesBookId || state.activeBookId;
  const book = state.books[bookId] || activeBook();
  const author = book && book.author ? book.author : "";
  const lastAuto = state.ui.quoteAuthorAuto || "";
  if(!input.value || input.value === lastAuto){
    input.value = author;
  }
  state.ui.quoteAuthorAuto = author;
}

function renderDriveLog(){
  const lastBackup = $("driveLastBackup");
  if(lastBackup){
    const time = formatDateTime(state.drive.lastSyncISO);
    lastBackup.textContent = state.drive.lastSyncISO ? t("driveLastBackup", { time }) : t("driveLastBackupEmpty");
  }
}

const ACHIEVEMENTS = [
  { id: "first", emoji: "🌱", titleKey: "achFirstTitle", descKey: "achFirstDesc", check: () => state.sessions.length >= 1 },
  { id: "streak3", emoji: "🔥", titleKey: "achStreakTitle", descKey: "achStreakDesc", check: () => {
      const days = new Set(state.sessions.map(s => (s.endISO || s.startISO || "").slice(0,10)));
      return days.size >= 3;
    }
  },
  { id: "reader", emoji: "🐛", titleKey: "achReaderTitle", descKey: "achReaderDesc", check: () => {
      const pages = state.sessions.reduce((sum, s) => sum + (s.pages || 0), 0);
      return pages >= 100;
    }
  },
  { id: "finish1", emoji: "🏆", titleKey: "achFinishTitle", descKey: "achFinishDesc", check: () => {
      return Object.values(state.books).some(b => b.totalPages && (b.currentPage || 0) >= b.totalPages);
    }
  },
  { id: "expert", emoji: "🎓", titleKey: "achExpertTitle", descKey: "achExpertDesc", check: () => {
      const pages = state.sessions.reduce((sum, s) => sum + (s.pages || 0), 0);
      return pages >= 1000;
    }
  }
];

function renderAchievements(){
  const unlockedList = $("achUnlockedList");
  const nextList = $("achNextList");
  if(!unlockedList || !nextList) return;

  const unlocked = ACHIEVEMENTS.filter(a => a.check());
  const locked = ACHIEVEMENTS.filter(a => !a.check());

  const unlockedCount = $("achUnlocked");
  if(unlockedCount) unlockedCount.textContent = `${unlocked.length}/${ACHIEVEMENTS.length}`;

  unlockedList.innerHTML = unlocked.map(a => `
    <div class="item">
      <div class="itemTitle">${a.emoji} ${t(a.titleKey)}</div>
      <div class="itemMeta">${t(a.descKey)}</div>
    </div>
  `).join("") || `<div class="muted small">${t("achKeepReading")}</div>`;

  const next = locked[0];
  const nextHint = $("achNext");
  if(nextHint){
    nextHint.textContent = next ? `${next.emoji} ${t(next.titleKey)} — ${t(next.descKey)}` : t("achAllDone");
  }

  nextList.innerHTML = locked.slice(0,3).map(a => `
    <div class="item">
      <div class="itemTitle">🔒 ${t(a.titleKey)}</div>
      <div class="itemMeta">${t(a.descKey)}</div>
    </div>
  `).join("") || `<div class="muted small">${t("achAllDone")}</div>`;
}

function renderAll(){
  refreshBookSelect();
  renderSessionBookSelect();
  renderDashboard();
  renderActiveBook();
  renderGlobal();
  renderAchievements();
  renderQuotes();
  renderDriveLog();
  save();
}

// ---------- CRUD Books ----------
function addBook(){
  const title = $("newTitle").value.trim() || t("untitled");
  const author = $("newAuthor").value.trim();
  const publisher = $("newPublisher").value.trim();
  const edition = $("newEdition").value.trim();
  const totalPages = Number($("newTotal").value || 0);
  const currentPage = Number($("newCurrent").value || 0);

  if(!totalPages || totalPages < 1){
    alert(t("alertNeedPages"));
    return;
  }

  const id = uid();
  state.books[id] = {
    id,
    title,
    author,
    publisher,
    edition,
    totalPages,
    currentPage: clamp(currentPage,0,totalPages),
    createdAt: new Date().toISOString(),
    coverData: _pendingNewCoverData || "",
    rating: "",
    finishedAt: null
  };
  state.activeBookId = id;

  $("newTitle").value = "";
  $("newAuthor").value = "";
  $("newPublisher").value = "";
  $("newEdition").value = "";
  $("newTotal").value = "";
  $("newCurrent").value = "";
  $("newCover").value = "";
  _pendingNewCoverData = "";

  save();
  renderAll();
}

function saveActiveBook(){
  const b = activeBook();
  b.title = $("editTitle").value.trim() || b.title || t("untitled");
  b.author = $("editAuthor").value.trim() || "";
  b.publisher = $("editPublisher").value.trim() || "";
  b.edition = $("editEdition").value.trim() || "";
  b.totalPages = Number($("editTotal").value || b.totalPages || 0);
  b.currentPage = clamp(Number($("editCurrent").value || b.currentPage || 0), 0, b.totalPages || 0);
  if(b.totalPages && b.currentPage >= b.totalPages && !b.finishedAt){
    b.finishedAt = new Date().toISOString();
  }
  save();
  renderAll();
  showToast(t("bookSaved"));
}

function deleteActiveBook(){
  const b = activeBook();
  if(!confirm(t("confirmDeleteBook", { title: b.title }))){
    return;
  }
  delete state.books[b.id];

  const ids = Object.keys(state.books);
  state.activeBookId = ids[0] || null;
  if(state.ui.quotesBookId === b.id){
    state.ui.quotesBookId = state.activeBookId;
  }
  ensureDefaultBook();
  save();
  renderAll();
}

function handleCoverInput(input, book){
  const file = input.files && input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    book.coverData = reader.result;
    save();
    renderAll();
  };
  reader.readAsDataURL(file);
}

function handleNewCoverInput(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    _pendingNewCoverData = reader.result;
  };
  reader.readAsDataURL(file);
}

// ---------- Quotes ----------
function addQuote(){
  const text = $("quoteText").value.trim();
  if(!text) return;
  ensureQuoteBookSelection();
  const bookId = state.ui.quotesBookId || state.activeBookId;
  const book = state.books[bookId] || activeBook();
  const quote = {
    id: uid(),
    bookId,
    text,
    author: book && book.author ? book.author.trim() : "",
    page: $("quotePage").value.trim(),
    createdAt: new Date().toISOString()
  };
  state.quotes.push(quote);
  state.ui.quotesBookId = bookId;
  $("quoteText").value = "";
  $("quotePage").value = "";
  save();
  renderAll();
}

function handleQuoteActions(e){
  const btn = e.target.closest("button[data-quote-id]");
  if(!btn) return;
  const id = btn.dataset.quoteId;
  const action = btn.dataset.action;
  const idx = state.quotes.findIndex(q => q.id === id);
  if(idx === -1) return;
  if(action === "delete"){
    state.quotes.splice(idx, 1);
    save();
    renderAll();
    return;
  }
  if(action === "story"){
    const quote = state.quotes[idx];
    const book = state.books[quote.bookId];
    drawQuoteStory(quote, book);
    return;
  }
  if(action === "copy"){
    navigator.clipboard.writeText(state.quotes[idx].text).catch(()=>{});
    showToast(t("toastUpdated"));
  }
}

async function drawQuoteImage(){
  const text = $("quoteText").value.trim();
  if(!text) return;
  ensureQuoteBookSelection();
  const bookId = state.ui.quotesBookId || state.activeBookId;
  const book = state.books[bookId] || activeBook();
  const quote = {
    text,
    author: book && book.author ? book.author.trim() : "",
    page: $("quotePage").value.trim()
  };
  await drawQuoteStory(quote, book);
}

// ---------- Story Generation ----------
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(" ");
  let line = "";
  for(let i=0;i<words.length;i++){
    const test = line + words[i] + " ";
    const w = ctx.measureText(test).width;
    if(w > maxWidth && i > 0){
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
    }else{
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
  return y;
}

function countWrapLines(ctx, text, maxWidth){
  const words = text.split(" ");
  let line = "";
  let lines = 1;
  for(let i=0;i<words.length;i++){
    const test = line + words[i] + " ";
    const w = ctx.measureText(test).width;
    if(w > maxWidth && i > 0){
      lines += 1;
      line = words[i] + " ";
    }else{
      line = test;
    }
  }
  return lines;
}

function loadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawQuoteStory(quote, book){
  if(!quote || !quote.text) return;
  const canvas = $("quoteCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0,0,W,H);
  const gradient = ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0, "#0f1016");
  gradient.addColorStop(1, "#151823");
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,W,H);

  const coverW = 320;
  const coverH = 460;
  const coverX = W - coverW - 90;
  const coverY = 280;

  if(book && book.coverData){
    try{
      const img = await loadImage(book.coverData);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(coverX - 12, coverY - 12, coverW + 24, coverH + 24);
      ctx.drawImage(img, coverX, coverY, coverW, coverH);
    }catch(_){}
  }else{
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(coverX, coverY, coverW, coverH);
  }

  const textX = 90;
  const textY = 240;
  const textW = coverX - textX - 50;
  const quoteText = `“${quote.text}”`;
  const author = (book && book.author ? book.author.trim() : "") || (quote.author ? quote.author.trim() : "");

  let quoteSize = 56;
  let quoteLine = Math.round(quoteSize * 1.2);
  const metaY = H - 220;
  while(quoteSize >= 40){
    ctx.font = `700 ${quoteSize}px system-ui`;
    const lines = countWrapLines(ctx, quoteText, textW);
    const authorSize = Math.round(quoteSize * 0.6);
    let authorBlock = 0;
    if(author){
      ctx.font = `500 ${authorSize}px system-ui`;
      const authorLines = countWrapLines(ctx, `— ${author}`, textW);
      authorBlock = authorLines * Math.round(authorSize * 1.2) + 36;
    }
    const totalHeight = lines * quoteLine + authorBlock;
    if(textY + totalHeight < metaY - 40) break;
    quoteSize -= 2;
    quoteLine = Math.round(quoteSize * 1.2);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${quoteSize}px system-ui`;
  let y = wrapText(ctx, quoteText, textX, textY, textW, quoteLine);

  if(author){
    const authorSize = Math.round(quoteSize * 0.6);
    ctx.fillStyle = "#b6b6bd";
    ctx.font = `500 ${authorSize}px system-ui`;
    y += Math.round(authorSize * 1.3);
    wrapText(ctx, `— ${author}`, textX, y, textW, Math.round(authorSize * 1.2));
  }

  const meta = [
    book ? `${t("quoteShareBook")}: ${book.title}` : "",
    quote.page ? `${t("quoteSharePage")}: ${quote.page}` : ""
  ].filter(Boolean).join(" · ");
  if(meta){
    ctx.fillStyle = "#8f90a0";
    ctx.font = "500 28px system-ui";
    wrapText(ctx, meta, textX, metaY, textW, 40);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 26px system-ui";
  ctx.fillText(t("quoteShareApp"), textX, H - 100);

  const url = canvas.toDataURL("image/png");
  $("quotePreview").src = url;
  $("quotePreview").classList.add("show");
  $("previewQuote").disabled = false;
  $("downloadQuote").disabled = false;
}

async function drawStory(scope){
  const canvas = $("storyCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0,0,W,H);
  const gradient = ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0, "#0e0f14");
  gradient.addColorStop(1, "#1d1f2a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(W - 120, 140, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px system-ui";

  let title = t("storyTitleOverall");
  if(scope === "book") title = t("storyTitleBook");
  if(scope === "year") title = t("storyTitleYear");
  ctx.fillText(title, 80, 140);

  ctx.font = "400 30px system-ui";
  ctx.fillStyle = "#c9c9d2";
  const sub = scope === "book" ? formatDateOnly(new Date()) : String(new Date().getFullYear());
  ctx.fillText(sub, 80, 190);

  const stats = [];
  let coverImg = null;
  let coverBook = null;
  if(scope === "book"){
    const b = activeBook();
    if(!b) return;
    coverBook = b;
    if(b && b.coverData){
      try{
        coverImg = await loadImage(b.coverData);
      }catch(_){}
    }
    const days = rangeDays();
    const bookAgg = aggregateBookInRange(b.id, days);
    const pace = averagePace(b.id);
    stats.push([t("storyBook"), b.title]);
    stats.push([t("storyPages"), `${b.currentPage || 0}/${b.totalPages || 0}`]);
    stats.push([t("storyProgress"), `${b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0}%`]);
    stats.push([t("storyMinutes"), `${bookAgg.mins}`]);
    stats.push([t("storySessions"), `${bookAgg.sessions}`]);
    stats.push([t("storyPace"), pace > 0 ? `${pace.toFixed(2)} ${t("paceLabelUnit")}` : "—"]);
    stats.push([t("storyEta"), computeETA(b.id)]);
  }else{
    const days = scope === "year" ? 365 : rangeDays();
    const {pages, mins} = aggregateGlobal(days);
    const hours = mins / 60;
    const finished = Object.values(state.books).filter(b => b.finishedAt && inRange(b.finishedAt, days)).length;
    const sessionsCount = state.sessions.filter(s => inRange(s.endISO || s.startISO, days)).length;
    stats.push([t("storyPages"), `${pages}`]);
    stats.push([t("storyMinutes"), `${mins}`]);
    stats.push([t("storyHours"), `${hours.toFixed(1)}`]);
    stats.push([t("storyBooks"), `${Object.keys(state.books).length}`]);
    stats.push([t("storyFinished"), `${finished}`]);
    stats.push([t("storySessions"), `${sessionsCount}`]);
  }

  if(scope === "book"){
    let y = 300;
    const labelX = 80;
    const valueX = 420;
    const valueW = W - valueX - 100;
    const labelFont = "600 34px system-ui";
    const valueFont = "600 34px system-ui";
    const valueLine = 44;
    stats.forEach(([label, value]) => {
      ctx.fillStyle = "#8f90a0";
      ctx.font = labelFont;
      ctx.fillText(label, labelX, y);
      ctx.fillStyle = "#ffffff";
      ctx.font = valueFont;
      const text = String(value);
      const lines = Math.max(1, countWrapLines(ctx, text, valueW));
      wrapText(ctx, text, valueX, y, valueW, valueLine);
      y += Math.max(1, lines) * (valueLine + 14);
    });

    if(coverImg && coverBook){
      const coverW = 320;
      const coverH = 480;
      const coverX = Math.round((W - coverW) / 2);
      const coverY = H - coverH - 220;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(coverX - 12, coverY - 12, coverW + 24, coverH + 24);
      ctx.drawImage(coverImg, coverX, coverY, coverW, coverH);
    }
  }else{
    let y = 320;
    ctx.font = "600 36px system-ui";
    stats.forEach(([label, value]) => {
      ctx.fillStyle = "#8f90a0";
      ctx.fillText(label, 80, y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(String(value), 420, y);
      y += 70;
    });
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px system-ui";
  ctx.fillText(t("storyApp"), 80, H - 100);

  const url = canvas.toDataURL("image/png");
  $("storyPreview").src = url;
  $("storyPreview").classList.add("show");
  $("downloadStory").disabled = false;
}

function drawFinishStory(){
  const b = activeBook();
  if(!b) return;
  const rating = $("finishRating").value;
  b.rating = rating;
  save();
  const canvas = $("finishCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0,0,W,H);
  const gradient = ctx.createLinearGradient(0,0,W,H);
  gradient.addColorStop(0, "#0b0c10");
  gradient.addColorStop(1, "#202334");
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 60px system-ui";
  ctx.fillText(`${t("finishShareHeadline")}!`, 80, 140);

  ctx.font = "600 44px system-ui";
  wrapText(ctx, b.title, 80, 230, W - 160, 60);

  ctx.fillStyle = "#b6b6bd";
  ctx.font = "500 32px system-ui";
  if(b.author){
    ctx.fillText(b.author, 80, 320);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 36px system-ui";
  ctx.fillText(`${t("storyPages")}: ${b.totalPages || 0}`, 80, 420);

  if(rating){
    ctx.fillText(`${t("finishShareRating")}: ${rating}/5`, 80, 490);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px system-ui";
  ctx.fillText(t("storyApp"), 80, H - 100);

  const url = canvas.toDataURL("image/png");
  $("finishPreview").src = url;
  $("finishPreview").classList.add("show");
  $("finishDownload").disabled = false;
}

// ---------- Drive Sync ----------
function setDriveUI(connected){
  const drivePullBtn = $("drivePull");
  if(drivePullBtn) drivePullBtn.disabled = !connected;
  const drivePushBtn = $("drivePush");
  if(drivePushBtn) drivePushBtn.disabled = !connected;
  const driveDisconnect = $("driveDisconnect");
  if(driveDisconnect) driveDisconnect.disabled = !connected;
  const driveStatus = $("driveStatus");
  if(driveStatus) driveStatus.textContent = connected ? t("statusConnected") : t("statusNotSigned");
}

function driveClientId(){
  return (window.BOOKQUEST_CONFIG && window.BOOKQUEST_CONFIG.googleClientId) || DEFAULT_CLIENT_ID;
}

function driveTokenClient(){
  if(!window.google || !google.accounts || !google.accounts.oauth2){
    return null;
  }
  if(_tokenClient) return _tokenClient;
  _tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: driveClientId(),
    scope: "https://www.googleapis.com/auth/drive.appdata",
    callback: () => {}
  });
  return _tokenClient;
}

function waitForGoogleClient(timeoutMs = 4000){
  if(window.google && google.accounts && google.accounts.oauth2){
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    const start = Date.now();
    const timer = setInterval(() => {
      if(window.google && google.accounts && google.accounts.oauth2){
        clearInterval(timer);
        resolve(true);
        return;
      }
      if(Date.now() - start >= timeoutMs){
        clearInterval(timer);
        resolve(false);
      }
    }, 150);
  });
}

function ensureDriveToken(interactive){
  if(state.drive.token && Date.now() < (state.drive.expiresAt || 0)){
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    const client = driveTokenClient();
    if(!client){
      resolve(false);
      return;
    }
    client.callback = (resp) => {
      if(resp && resp.access_token){
        state.drive.token = resp.access_token;
        state.drive.expiresAt = Date.now() + (resp.expires_in || 3600) * 1000 - 60000;
        state.drive.hasConsent = true;
        setConsentCookie(true);
        save();
        setDriveUI(true);
        resolve(true);
      }else{
        resolve(false);
      }
    };
    const prompt = interactive ? (state.drive.hasConsent ? "" : "consent") : "none";
    client.requestAccessToken({ prompt });
  });
}

async function driveFindFileId(){
  const q = encodeURIComponent(`name='${DRIVE_FILENAME}'`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${state.drive.token}` }
  });
  if(!res.ok) throw new Error("files.list failed");
  const data = await res.json();
  const f = (data.files || [])[0];
  return f ? f.id : null;
}

function sanitizeStateForDrive(){
  const payload = JSON.parse(JSON.stringify(state));
  if(payload.drive){
    payload.drive.token = null;
    payload.drive.expiresAt = 0;
  }
  return payload;
}

async function drivePull(){
  try{
    const ok = await ensureDriveToken(false);
    if(!ok) return;

    let fileId = state.drive.fileId || await driveFindFileId();
    if(!fileId){
      $("driveStatus").textContent = t("statusNoFile");
      return;
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${state.drive.token}` } });
    if(!res.ok) throw new Error("files.get alt=media failed");
    const text = await res.text();
    const data = JSON.parse(text);

    const token = state.drive.token;
    const expiresAt = state.drive.expiresAt;
    const hadConsent = state.drive.hasConsent;
    Object.assign(state, data);
    state.drive = Object.assign({ token:null, fileId:null, lastSyncISO:null, lastPullISO:null, autoMins:1, syncLog:[], expiresAt:0, hasConsent:false }, state.drive || {}, { token, expiresAt, fileId });
    state.settings = Object.assign({ lang:"en-GB" }, state.settings || {});
    state.quotes = Array.isArray(state.quotes) ? state.quotes : [];
    state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "" }, state.ui || {});
    if(!state.drive.autoMins || state.drive.autoMins < 1) state.drive.autoMins = 1;
    state.drive.hasConsent = hadConsent || state.drive.hasConsent || Boolean(token);
    normalizeBooks();
    state.drive.lastPullISO = new Date().toISOString();

    ensureDefaultBook();
    applyI18n();
    const appLangSelect = $("appLang");
    if(appLangSelect) appLangSelect.value = state.settings.lang || "en-GB";
    save();
    renderAll();
    setDriveUI(true);
    $("driveStatus").textContent = t("statusPulled");
  }catch(_){
    $("driveStatus").textContent = t("statusPullError");
  }
}

function disconnectDrive(){
  const token = state.drive.token;
  state.drive.token = null;
  state.drive.expiresAt = 0;
  state.drive.hasConsent = false;
  setConsentCookie(false);
  save();
  setDriveUI(false);
  if(_driveAutoId){
    clearInterval(_driveAutoId);
    _driveAutoId = null;
  }
  if(token && window.google && google.accounts && google.accounts.oauth2 && google.accounts.oauth2.revoke){
    google.accounts.oauth2.revoke(token, () => {});
  }
  setAuthGate(true, "login");
}

async function drivePush(){
  try{
    const ok = await ensureDriveToken(false);
    if(!ok) return;

    let fileId = state.drive.fileId || await driveFindFileId();
    const body = JSON.stringify(sanitizeStateForDrive());

    if(!fileId){
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

    const now = new Date().toISOString();
    state.drive.lastSyncISO = now;
    state.drive.syncLog = (state.drive.syncLog || []).slice(-49);
    state.drive.syncLog.push(now);
    save();
    renderDriveLog();
    $("driveStatus").textContent = t("statusSaved");
  }catch(_){
    $("driveStatus").textContent = t("statusPushError");
  }
}

function scheduleDriveAuto(){
  if(_driveAutoId){
    clearInterval(_driveAutoId);
    _driveAutoId = null;
  }
  const mins = Number(state.drive.autoMins || 0);
  if(!mins) return;
  _driveAutoId = setInterval(() => {
    drivePush();
  }, mins * 60000);
}

function scheduleSilentSignIn(){
  if(_authFallbackId){
    clearTimeout(_authFallbackId);
    _authFallbackId = null;
  }
  if(!state.drive.hasConsent){
    setAuthGate(true, "login");
    return;
  }
  _authResolved = false;
  silentSignIn().then(ok => {
    _authResolved = true;
    if(!ok){
      setDriveUI(false);
      setAuthGate(false);
    }
  });
}

function cleanupServiceWorkers(){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  }).catch(()=>{});
}

async function handleAuthFlow(interactive){
  if(interactive){
    setAuthGate(true, "checking");
  }
  const ready = await waitForGoogleClient();
  if(!ready){
    _authResolved = true;
    setAuthGate(true, "login");
    return;
  }
  const ok = await ensureDriveToken(interactive);
  _authResolved = true;
  if(_authFallbackId){
    clearTimeout(_authFallbackId);
    _authFallbackId = null;
  }
  if(!ok){
    setAuthGate(true, "login");
    return;
  }
  setDriveUI(true);
  setAuthGate(false);
  await drivePull();
  scheduleDriveAuto();
}

async function silentSignIn(){
  const ready = await waitForGoogleClient();
  if(!ready) return false;
  const ok = await ensureDriveToken(false);
  if(!ok) return false;
  setDriveUI(true);
  setAuthGate(false);
  await drivePull();
  scheduleDriveAuto();
  return true;
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
      state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "" }, state.ui || {});
      normalizeBooks();
      ensureDefaultBook();
      applyI18n();
      save();
      renderAll();
      showToast(t("toastImported"));
    }catch(_){
      alert(t("alertImportFail"));
    }
  };
  reader.readAsText(file);
}

// ---------- OCR ----------
function openOcrModal(){
  _ocrState = null;
  $("ocrOverlay").classList.add("open");
  $("ocrOverlay").setAttribute("aria-hidden", "false");
  const ctx = $("ocrCanvas").getContext("2d");
  ctx.clearRect(0,0,$("ocrCanvas").width,$("ocrCanvas").height);
  $("quoteOcrStatus").textContent = "";
}

function closeOcrModal(){
  $("ocrOverlay").classList.remove("open");
  $("ocrOverlay").setAttribute("aria-hidden", "true");
}

function loadOcrImage(file){
  const img = new Image();
  img.onload = () => {
    const canvas = $("ocrCanvas");
    const ctx = canvas.getContext("2d");
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    _ocrState = { img, canvas, ctx, scale, offsetX, offsetY, rect: {x: offsetX, y: offsetY, w: drawW, h: drawH} };
    drawOcrSelection();
  };
  img.src = URL.createObjectURL(file);
}

function drawOcrSelection(){
  if(!_ocrState) return;
  const { ctx, canvas, img, scale, offsetX, offsetY, rect } = _ocrState;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
  ctx.strokeStyle = "#00e0ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([6,4]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.setLineDash([]);
}

function handleOcrPointerDown(e){
  if(!_ocrState) return;
  const rect = $("ocrCanvas").getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  _ocrState.dragging = true;
  _ocrState.startX = x;
  _ocrState.startY = y;
  _ocrState.rect = { x, y, w: 0, h: 0 };
  drawOcrSelection();
}

function handleOcrPointerMove(e){
  if(!_ocrState || !_ocrState.dragging) return;
  const rect = $("ocrCanvas").getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = x - _ocrState.startX;
  const h = y - _ocrState.startY;
  _ocrState.rect = {
    x: w < 0 ? x : _ocrState.startX,
    y: h < 0 ? y : _ocrState.startY,
    w: Math.abs(w),
    h: Math.abs(h)
  };
  drawOcrSelection();
}

function handleOcrPointerUp(){
  if(!_ocrState) return;
  _ocrState.dragging = false;
}

async function runOcr(){
  if(!_ocrState){
    showToast(t("toastOcrMissing"));
    return;
  }
  if(!window.Tesseract){
    showToast(t("toastOcrMissing"));
    return;
  }
  showToast(t("toastOcrWorking"));
  $("quoteOcrStatus").textContent = t("toastOcrWorking");
  const { img, rect, scale, offsetX, offsetY } = _ocrState;
  const sx = clamp((rect.x - offsetX) / scale, 0, img.width);
  const sy = clamp((rect.y - offsetY) / scale, 0, img.height);
  const sw = clamp(rect.w / scale, 1, img.width - sx);
  const sh = clamp(rect.h / scale, 1, img.height - sy);
  const crop = document.createElement("canvas");
  crop.width = sw;
  crop.height = sh;
  const cctx = crop.getContext("2d");
  cctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const lang = state.settings.lang === "es-MX" ? "spa" : "eng";
  try{
    const result = await window.Tesseract.recognize(crop, lang);
    const text = (result.data && result.data.text ? result.data.text : "").trim();
    if(text){
      $("quoteText").value = text;
    }
    showToast(t("toastOcrDone"));
    $("quoteOcrStatus").textContent = t("toastOcrDone");
    closeOcrModal();
  }catch(_){
    showToast(t("toastOcrMissing"));
    $("quoteOcrStatus").textContent = "";
  }
}

// ---------- Tabs ----------
function switchTab(name){
  if(!name) return;
  const target = document.getElementById(`tab-${name}`);
  if(!target) return;
  document.querySelectorAll(".tabbtn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tabbtn").forEach(b => {
    if(b.dataset.tab === name) b.classList.add("active");
  });
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab === target);
  });
}

function setupTabs(){
  document.querySelectorAll(".tabbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });
}

// ---------- Events ----------
function bind(){
  setupTabs();

  $("addBook").addEventListener("click", addBook);

  $("bookSelect").addEventListener("change", ()=>{
    state.activeBookId = $("bookSelect").value;
    state.ui.quotesBookId = state.activeBookId;
    save();
    renderAll();
  });

  const sessionBookSelect = $("sessionBookSelect");
  if(sessionBookSelect){
    sessionBookSelect.addEventListener("change", () => {
      state.activeBookId = sessionBookSelect.value;
      state.ui.quotesBookId = state.activeBookId;
      save();
      renderAll();
    });
  }

  $("rangeSelect").addEventListener("change", ()=>{
    renderAll();
  });

  $("saveBook").addEventListener("click", saveActiveBook);
  $("deleteBook").addEventListener("click", deleteActiveBook);

  $("newCover").addEventListener("change", (e)=>handleNewCoverInput(e.target));
  $("editCover").addEventListener("change", (e)=>handleCoverInput(e.target, activeBook()));

  $("start").addEventListener("click", startTimer);
  $("pause").addEventListener("click", togglePause);
  $("finish").addEventListener("click", finishSession);
  $("hyper").addEventListener("click", hyperfocus);

  $("pagesModeRange").addEventListener("change", togglePagesMode);
  $("pagesModeCount").addEventListener("change", togglePagesMode);

  const exportBtn = $("exportBtn");
  if(exportBtn){
    exportBtn.addEventListener("click", exportJSON);
  }
  const importFile = $("importFile");
  if(importFile){
    importFile.addEventListener("change", (e)=>{
      const f = e.target.files && e.target.files[0];
      if(f) importJSON(f);
      e.target.value = "";
    });
  }

  const driveSignIn = $("driveSignIn");
  if(driveSignIn) driveSignIn.addEventListener("click", ()=>handleAuthFlow(true));
  const drivePullBtn = $("drivePull");
  if(drivePullBtn) drivePullBtn.addEventListener("click", drivePull);
  const drivePushBtn = $("drivePush");
  if(drivePushBtn) drivePushBtn.addEventListener("click", drivePush);
  const driveDisconnect = $("driveDisconnect");
  if(driveDisconnect){
    driveDisconnect.addEventListener("click", () => {
      if(!confirm(t("driveDisconnectConfirm"))) return;
      disconnectDrive();
      showToast(t("toastLoggedOut"));
    });
  }

  const appLang = $("appLang");
  if(appLang){
    appLang.addEventListener("change", () => {
      setLanguage($("appLang").value);
    });
  }

  $("addQuote").addEventListener("click", addQuote);
  $("quoteText").addEventListener("input", () => {
    const hasText = Boolean($("quoteText").value.trim());
    $("previewQuote").disabled = !hasText;
    if(!hasText){
      $("downloadQuote").disabled = true;
      $("quotePreview").classList.remove("show");
    }
  });
  $("quotesList").addEventListener("click", handleQuoteActions);
  const quoteBooks = $("quoteBooks");
  if(quoteBooks){
    quoteBooks.addEventListener("click", (e) => {
      const card = e.target.closest(".quoteBook");
      if(!card) return;
      state.ui.quotesBookId = card.dataset.bookId;
      save();
      renderQuotes();
    });
  }
  $("previewQuote").addEventListener("click", () => { drawQuoteImage(); });
  $("downloadQuote").addEventListener("click", ()=>downloadCanvas($("quoteCanvas"), `quote_${todayKey()}.png`));

  $("quoteOcrStart").addEventListener("click", openOcrModal);
  $("ocrCancel").addEventListener("click", closeOcrModal);
  $("ocrUse").addEventListener("click", runOcr);
  $("ocrUpload").addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if(f) loadOcrImage(f);
    e.target.value = "";
  });
  $("ocrCamera").addEventListener("change", (e)=>{
    const f = e.target.files && e.target.files[0];
    if(f) loadOcrImage(f);
    e.target.value = "";
  });
  $("ocrCanvas").addEventListener("pointerdown", handleOcrPointerDown);
  $("ocrCanvas").addEventListener("pointermove", handleOcrPointerMove);
  $("ocrCanvas").addEventListener("pointerup", handleOcrPointerUp);
  $("ocrCanvas").addEventListener("pointerleave", handleOcrPointerUp);

  $("makeStory").addEventListener("click", () => {
    drawStory($("storyScope").value);
  });
  $("downloadStory").addEventListener("click", ()=>downloadCanvas($("storyCanvas"), `story_${todayKey()}.png`));

  $("markFinished").addEventListener("click", ()=>{
    const b = activeBook();
    b.currentPage = b.totalPages || b.currentPage;
    b.finishedAt = new Date().toISOString();
    save();
    renderAll();
    $("finishOverlay").classList.add("open");
    $("finishOverlay").setAttribute("aria-hidden", "false");
  });
  $("shareFinish").addEventListener("click", ()=>{
    $("finishOverlay").classList.add("open");
    $("finishOverlay").setAttribute("aria-hidden", "false");
  });
  $("finishGenerate").addEventListener("click", drawFinishStory);
  $("finishDownload").addEventListener("click", ()=>downloadCanvas($("finishCanvas"), `finish_${todayKey()}.png`));
  $("finishClose").addEventListener("click", ()=>{
    $("finishOverlay").classList.remove("open");
    $("finishOverlay").setAttribute("aria-hidden", "true");
  });

  const authSignIn = $("authSignIn");
  if(authSignIn) authSignIn.addEventListener("click", ()=>handleAuthFlow(true));

  $("dlBookPages").addEventListener("click", ()=>downloadCanvas($("chartPages"), `book_pages_${todayKey()}.png`));
  $("dlBookMins").addEventListener("click", ()=>downloadCanvas($("chartMins"), `book_minutes_${todayKey()}.png`));
  $("dlAllPages").addEventListener("click", ()=>downloadCanvas($("chartAllPages"), `all_pages_${todayKey()}.png`));
  $("dlAllMins").addEventListener("click", ()=>downloadCanvas($("chartAllMins"), `all_minutes_${todayKey()}.png`));

  const resetAll = $("resetAll");
  if(resetAll){
    resetAll.addEventListener("click", () => {
      if(!confirm(t("resetConfirm1"))) return;
      if(!confirm(t("resetConfirm2"))) return;
      localStorage.removeItem(STORAGE_KEY);
      showToast(t("resetDone"));
      setTimeout(()=>location.reload(), 300);
    });
  }
}

// ---------- Init ----------
load();
normalizeBooks();
ensureDefaultBook();
applyI18n();
const appLangSelect = $("appLang");
if(appLangSelect) appLangSelect.value = state.settings.lang || "en-GB";
setDriveUI(Boolean(state.drive.token));
setAuthGate(false);
bind();
scheduleSilentSignIn();
togglePagesMode();
renderAll();

cleanupServiceWorkers();
