const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "bookquest_state_v3";
const DRIVE_FILENAME = "bookquest_state.json";
const DEFAULT_CLIENT_ID = "195858719729-36npag3q1fclmj2pnqckk4dgcblqu1f9.apps.googleusercontent.com";
const IS_TEST = typeof window !== "undefined" && Boolean(window.BOOKQUEST_TEST);
const DRIVE_SESSION_KEY = "bookquest_drive_session_v1";
const QUEST_THRESHOLDS = [0.1, 0.3, 0.5, 0.7, 0.9];
const QUEST_MIN_OBJECTS = 5;
const QUEST_MAX_OBJECTS = 10;
const WEBLLM_IMPORT_URL = "https://esm.run/@mlc-ai/web-llm";
const WEBLLM_MODEL_ID = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
const WEBLLM_MODEL_SIZE_MB = 290;
const TRANSFORMERS_IMPORT_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2/dist/transformers.min.js";
const TRANSFORMERS_MODEL_ID = "Xenova/flan-t5-small";
const BOOK_MATCH_LIMIT = 5;
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const OPENLIBRARY_SEARCH_API = "https://openlibrary.org/search.json";
const OPENLIBRARY_BASE = "https://openlibrary.org";
const OPENLIBRARY_COVER_BASE = "https://covers.openlibrary.org/b/id";
// Only the opening slice of a plot section is used: it keeps the late-book
// reveals out, and it is the only way the text fits a small model's context.
const WIKI_PLOT_FRACTION = 0.4;
const WIKI_PLOT_MAX_CHARS = 1500;
// Floor: 40% of an already-short plot section leaves nothing for the model to
// work with, so short summaries are kept whole.
const WIKI_PLOT_MIN_CHARS = 400;
const WIKI_PLOT_SECTIONS = [
  "plot", "plot summary", "synopsis", "summary", "story", "plot outline",
  "argumento", "trama", "sinopsis", "resumen",
  "intrigue", "resume", "handlung", "inhalt", "enredo", "fabula", "syuzhet"
];
// Open Library reports MARC 3-letter codes; map the common ones to what langCodeToName expects.
const OPENLIBRARY_LANG = {
  eng:"en", spa:"es", rus:"ru", fre:"fr", fra:"fr", ger:"de", deu:"de", ita:"it", por:"pt",
  jpn:"ja", chi:"zh", zho:"zh", kor:"ko", dut:"nl", nld:"nl", pol:"pl", swe:"sv", dan:"da",
  nor:"no", fin:"fi", cze:"cs", ces:"cs", gre:"el", ell:"el", heb:"he", ara:"ar", hin:"hi",
  tur:"tr", ukr:"uk", rum:"ro", ron:"ro", hun:"hu", cat:"ca", ind:"id", vie:"vi", tha:"th",
  ben:"bn", per:"fa", fas:"fa", urd:"ur", swa:"sw", slo:"sk", slk:"sk", hrv:"hr", srp:"sr", bul:"bg"
};
const TRANSFORMERS_MODEL_SIZE_MB = 80;
const QUEST_FALLBACK_POOL = [
  "bookmark","library card","paperback","hardcover","dust jacket",
  "page","chapter","footnote","index","glossary",
  "notebook","journal","diary","pen","pencil",
  "highlighter","sticky note","paper clip","envelope","letter",
  "map","key","candle","lamp","magnifying glass"
];
const QUEST_ABSTRACT_TERMS = new Set(["love","life","time","world","destiny","meaning","truth","power"]);
const QUEST_STOPWORDS = new Set([
  "a","an","the","and","or","but","if","so","no","yes","to","of","in","on","at","by","as","is","it","its","into",
  "from","for","with","that","this","these","those","there","here","then","than","when","where","which","what","who",
  "you","your","yours","we","our","ours","they","their","theirs","he","him","his","she","her","hers","i","me","my",
  "mine","us","was","were","be","been","being","are","am","do","does","did","done","can","could","would","should",
  "may","might","must","also","just","like","some","more","most","such","over","under","between","within","without",
  "before","after","during","across","about","up","down","out","off","back","front","left","right",
  "el","la","los","las","un","una","unos","unas","y","o","u","de","del","al","que","como","por","para","con","sin",
  "sobre","entre","cuando","donde","quien","quienes","cual","cuales","su","sus","mi","mis","tu","tus","nuestro",
  "nuestra","nuestros","nuestras","ellos","ellas","ella","lo","le","les","se","es","son","era","eran","fue","fueron",
  "ser","estar","hay","hace","hacia","desde","hasta","mas","muy","ya","en"
]);

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
    questTitle: "Quest objects",
    vaultTitle: "Valt",
    vaultObjects: "Objects",
    vaultReveal: "Reveal objects",
    vaultHide: "Hide objects",
    vaultDelete: "Delete objects",
    aiTitle: "On-device AI (Quest Generation)",
    aiToggleLabel: "Use on-device AI to generate quest objects",
    aiClearModel: "Clear on-device AI model",
    aiReload: "Reload the app",
    aiClearHint: "Clears on-device model files (may require a refresh).",
    questRegenerate: "Regenerate quest objects",
    matchTitle: "Which edition is it?",
    matchSubtitle: "{count} results for \u201c{title}\u201d. Pick the one that matches your copy.",
    matchNoneBtn: "None of these \u2014 enter manually",
    matchNone: "No match found. Add the synopsis by hand to get better quest objects.",
    matchNeedsAuthor: "Add the author to look this book up.",
    synopsisLabel: "Synopsis (used to generate quest objects)",
    synopsisPlaceholder: "Paste a synopsis here if the lookup found none.",
    matchNoSynopsis: "No synopsis",
    matchNoSynopsisFound: "No synopsis found for this book. Paste one into the book's synopsis field to get AI-generated objects.",
    matchPages: "{pages} pages",
    questSourceWindowAi: "Generated by AI (Chrome built-in)",
    questSourceWebLLM: "Generated by AI (WebLLM)",
    questSourceTransformers: "Generated by AI (lite model)",
    questSourceHeuristic: "Extracted from the synopsis (no AI)",
    questSourcePool: "Generic list \u2014 no synopsis found",
    questSourceUnknown: "Unknown origin",
    questTextWikipedia: "from the Wikipedia plot",
    questTextManual: "from your synopsis",
    questTextBlurb: "from the back-cover synopsis",
    plotToggleLabel: "Use Wikipedia plot summaries (richer objects, opening section only)",
    aiClearToast: "Refresh the page to fully release storage.",
    aiStatusFallback: "AI not available → using fallback.",
    aiStatusReady: "On-device AI ready (WebGPU).",
    aiStatusWindowAi: "Chrome AI ready (no download needed).",
    aiStatusTransformers: "Lite AI ready.",
    aiStatusTransformersDownloading: "Downloading lite AI model... {pct}%",
    aiStatusUnavailable: "WebGPU not available.",
    aiStatusDisabled: "On-device AI is off.",
    aiStatusDownloading: "Downloading AI model... {pct}%",
    aiStatusOffline: "Offline. Using fallback quests.",
    aiStatusIdle: "Ready to download when needed.",
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
    lang: "en-GB",
    aiEnabled: true,
    aiEnabledMigrated: false,
    usePlotSummaries: true
  },
  ui: {
    quotesBookId: null,
    quoteAuthorAuto: "",
    vaultReveal: {}
  }
};

let _tokenClient = null;
let _driveAutoId = null;
let _ocrState = null;
let _pendingNewCoverData = "";
let _authResolved = false;
let _authFallbackId = null;
const _googleBooksPending = new Set();
const _questPending = new Set();
const _webLLMPendingBooks = new Set();
const _questStatus = {};
const _googleBooksStatus = {};
let _webLLM = null;
let _webLLMEngine = null;
let _webLLMLoading = false;
let _webLLMProgress = 0;
let _webLLMLastStatus = "";
let _webLLMFailed = false;
let _windowAiSession = null;
let _windowAiFailed = false;
let _transformersLib = null;
let _transformersEngine = null;
let _transformersLoading = false;
let _transformersProgress = 0;
let _transformersFailed = false;
const _transformersPendingBooks = new Set();

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

function getBackendUrl(){
  if(typeof window === "undefined") return "";
  const raw = (window.BOOKQUEST_CONFIG && window.BOOKQUEST_CONFIG.backendUrl) || "";
  return raw.replace(/\/+$/, "");
}

function backendEnabled(){
  return Boolean(getBackendUrl());
}

function getDriveSession(){
  try{
    return localStorage.getItem(DRIVE_SESSION_KEY) || "";
  }catch(_){
    return "";
  }
}

function setDriveSession(sessionId){
  if(!sessionId) return;
  try{
    localStorage.setItem(DRIVE_SESSION_KEY, sessionId);
  }catch(_){}
}

function clearDriveSession(){
  try{
    localStorage.removeItem(DRIVE_SESSION_KEY);
  }catch(_){}
}

function captureDriveSessionFromUrl(){
  if(typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const sessionId = url.searchParams.get("session");
  if(!sessionId) return;
  setDriveSession(sessionId);
  url.searchParams.delete("session");
  window.history.replaceState({}, "", url.toString());
}

function syncDriveConsentFromSession(){
  if(backendEnabled() && getDriveSession()){
    state.drive.hasConsent = true;
  }
}

function startBackendAuth(){
  const backend = getBackendUrl();
  if(!backend || typeof window === "undefined") return;
  const returnTo = window.location.href;
  window.location.href = `${backend}/auth/start?return=${encodeURIComponent(returnTo)}`;
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
    const key = el.dataset.i18n;
    const value = t(key);
    if(value !== key){
      el.textContent = value;
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const value = t(key);
    if(value !== key){
      el.placeholder = value;
    }
  });
}

function setLanguage(lang){
  state.settings.lang = lang;
  applyI18n();
  updateAiUI();
  renderAll();
  save();
}

function save(){
  const snapshot = JSON.parse(JSON.stringify(state));
  if(snapshot.drive){
    snapshot.drive.token = null;
    snapshot.drive.expiresAt = 0;
  }
  if(snapshot.timer){
    snapshot.timer.intervalId = null;
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
  state.settings = Object.assign({ lang:"en-GB", aiEnabled:true, aiEnabledMigrated:false, usePlotSummaries:true }, state.settings || {});
  if(!state.settings.aiEnabledMigrated){
    state.settings.aiEnabled = true;
    state.settings.aiEnabledMigrated = true;
  }
  state.settings.aiEnabled = Boolean(state.settings.aiEnabled);
  state.settings.usePlotSummaries = state.settings.usePlotSummaries !== false;
  state.quotes = Array.isArray(state.quotes) ? state.quotes : [];
  state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "", vaultReveal: {} }, state.ui || {});
  if(!state.books) state.books = {};
  syncDriveConsentFromSession();
}

function normalizeTimerState(){
  const defaults = {
    running: false,
    mode: "sprint",
    sprintMins: 8,
    startMs: 0,
    elapsedMs: 0,
    intervalId: null,
    bell: false,
    paused: false
  };
  state.timer = Object.assign({}, defaults, state.timer || {});
  if(!Number.isFinite(state.timer.sprintMins) || state.timer.sprintMins < 1) state.timer.sprintMins = 8;
  if(!Number.isFinite(state.timer.elapsedMs) || state.timer.elapsedMs < 0) state.timer.elapsedMs = 0;
  if(!Number.isFinite(state.timer.startMs) || state.timer.startMs < 0) state.timer.startMs = 0;
  if(!["sprint", "open", "flow"].includes(state.timer.mode)) state.timer.mode = "sprint";
  state.timer.intervalId = null;
  if(state.timer.running && !state.timer.startMs && state.timer.elapsedMs === 0){
    state.timer.running = false;
    state.timer.paused = false;
    state.timer.bell = false;
  }
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
    if(typeof b.synopsis !== "string") b.synopsis = b.synopsis ? String(b.synopsis) : "";
    if(typeof b.plotSummary !== "string") b.plotSummary = "";
    if(!b.plotSource || typeof b.plotSource !== "object") b.plotSource = { lang:"", article:"", fetchedAt:"" };
    b.synopsisManual = Boolean(b.synopsisManual);
    ensureGoogleBooksDefaults(b);
    ensureQuestDefaults(b);
    if(b.totalPages && (b.currentPage || 0) >= b.totalPages && !b.finishedAt){
      b.finishedAt = new Date().toISOString();
    }
  }
}

function stripHtml(input){
  if(!input) return "";
  return String(input).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(input){
  return String(input == null ? "" : input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMatchStr(input){
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/* Names arrive in every order and with patronymics attached: "Voinovich
   Vladimir" has to match "Vladimir Nikolaevich Voinovich". Comparing whole
   strings with includes() fails all of those, so compare token sets instead. */
function authorTokens(name){
  return normalizeMatchStr(name).split(" ").filter(tok => tok.length >= 2);
}

function authorsMatch(userAuthor, candidateAuthor){
  const a = authorTokens(userAuthor);
  const b = authorTokens(candidateAuthor);
  if(!a.length || !b.length) return false;
  const shorter = a.length <= b.length ? a : b;
  const longer = new Set(a.length <= b.length ? b : a);
  return shorter.every(tok => longer.has(tok));
}

function googleBooksStrictMatch(userTitle, userAuthor, candidateTitle, candidateAuthors){
  const ut = normalizeMatchStr(userTitle);
  const ua = normalizeMatchStr(userAuthor);
  const ct = normalizeMatchStr(candidateTitle);
  if(!ut || !ua || !ct) return false;
  const titleMatch = ct.includes(ut) || ut.includes(ct);
  if(!titleMatch) return false;
  const authors = Array.isArray(candidateAuthors) ? candidateAuthors : (candidateAuthors ? [candidateAuthors] : []);
  for(const author of authors){
    if(authorsMatch(ua, author)) return true;
  }
  return false;
}

function googleBooksMatchScore(userTitle, userAuthor, candidateTitle, candidateAuthors){
  const ut = normalizeMatchStr(userTitle);
  const ua = normalizeMatchStr(userAuthor);
  const ct = normalizeMatchStr(candidateTitle);
  if(!ut || !ua || !ct) return -1;
  let score = 0;
  if(ct === ut) score += 3;
  else if(ct.includes(ut) || ut.includes(ct)) score += 1;
  const authors = Array.isArray(candidateAuthors) ? candidateAuthors : (candidateAuthors ? [candidateAuthors] : []);
  for(const author of authors){
    const ca = normalizeMatchStr(author);
    if(!ca) continue;
    if(ca === ua) score += 3;
    else if(authorsMatch(ua, ca)) score += 2;
    else if(ca.includes(ua) || ua.includes(ca)) score += 1;
  }
  return score;
}


/* ---------- Book metadata providers ----------
   Each provider returns candidates in one shared shape so the picker and the
   apply step never need to know where a result came from. */

function candidateFromGoogleVolume(item){
  const info = (item && item.volumeInfo) ? item.volumeInfo : {};
  const images = info.imageLinks || {};
  const cover = images.thumbnail || images.smallThumbnail || "";
  return {
    provider: "google",
    id: item && item.id ? item.id : "",
    title: info.title || "",
    subtitle: info.subtitle || "",
    authors: Array.isArray(info.authors) ? info.authors : [],
    synopsis: stripHtml(info.description || ""),
    coverUrl: cover ? cover.replace(/^http:/, "https:") : "",
    pageCount: Number.isFinite(info.pageCount) ? info.pageCount : 0,
    publisher: info.publisher || "",
    language: info.language || "",
    year: String(info.publishedDate || "").slice(0, 4)
  };
}

async function fetchGoogleBooksCandidates(title, author){
  const out = [];
  const seen = new Set();
  // Exact first (best precision), then a loose query so translations and
  // "Title: A Novel" style records still surface.
  const queries = [`intitle:"${title}"+inauthor:"${author}"`, `${title} ${author}`];
  for(const q of queries){
    try{
      const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(q)}&maxResults=${BOOK_MATCH_LIMIT}`;
      const res = await fetch(url);
      if(!res.ok) continue;
      const data = await res.json();
      for(const item of (data.items || [])){
        const cand = candidateFromGoogleVolume(item);
        if(!cand.title) continue;
        const key = cand.id || normalizeMatchStr(cand.title);
        if(seen.has(key)) continue;
        seen.add(key);
        out.push(cand);
      }
    }catch(_){}
    if(out.length >= BOOK_MATCH_LIMIT) break;
  }
  return out;
}

function openLibraryDescription(raw){
  if(!raw) return "";
  if(typeof raw === "string") return raw;
  if(typeof raw.value === "string") return raw.value;
  return "";
}

async function fetchOpenLibraryDescription(workKey){
  if(!workKey) return "";
  try{
    const res = await fetch(`${OPENLIBRARY_BASE}${workKey}.json`);
    if(!res.ok) return "";
    const data = await res.json();
    return stripHtml(openLibraryDescription(data.description));
  }catch(_){
    return "";
  }
}

async function fetchOpenLibraryCandidates(title, author){
  const fields = "key,title,author_name,first_publish_year,number_of_pages_median,publisher,language,cover_i";
  const url = `${OPENLIBRARY_SEARCH_API}?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
    + `&fields=${fields}&limit=${BOOK_MATCH_LIMIT}`;
  let docs = [];
  try{
    const res = await fetch(url);
    if(!res.ok) return [];
    const data = await res.json();
    docs = Array.isArray(data.docs) ? data.docs : [];
  }catch(_){
    return [];
  }
  const candidates = docs.map(doc => {
    const langRaw = Array.isArray(doc.language) && doc.language.length ? doc.language[0] : "";
    return {
      provider: "openlibrary",
      id: doc.key || "",
      title: doc.title || "",
      subtitle: "",
      authors: Array.isArray(doc.author_name) ? doc.author_name : [],
      synopsis: "",
      coverUrl: Number.isFinite(doc.cover_i) ? `${OPENLIBRARY_COVER_BASE}/${doc.cover_i}-M.jpg` : "",
      pageCount: Number.isFinite(doc.number_of_pages_median) ? doc.number_of_pages_median : 0,
      publisher: Array.isArray(doc.publisher) && doc.publisher.length ? doc.publisher[0] : "",
      language: OPENLIBRARY_LANG[langRaw] || "",
      year: doc.first_publish_year ? String(doc.first_publish_year) : ""
    };
  }).filter(c => c.title);
  // Descriptions live on the work record, so they need one extra call each.
  await Promise.all(candidates.map(async (c) => {
    c.synopsis = await fetchOpenLibraryDescription(c.id);
  }));
  return candidates;
}

function wikiApi(lang){
  const code = (lang || "en").split("-")[0].toLowerCase();
  return `https://${code}.wikipedia.org/w/api.php`;
}

async function wikiJson(lang, params){
  const query = Object.assign({ format: "json", origin: "*" }, params);
  const qs = Object.keys(query).map(k => `${k}=${encodeURIComponent(query[k])}`).join("&");
  const res = await fetch(`${wikiApi(lang)}?${qs}`);
  if(!res.ok) throw new Error("wikipedia request failed");
  return res.json();
}

async function findWikipediaArticle(title, author, lang){
  // Requiring the title in the page title and the author anywhere in the body
  // keeps disambiguation pages and same-named films out of the results.
  const data = await wikiJson(lang, {
    action: "query",
    list: "search",
    srsearch: `intitle:"${title}" ${author}`,
    srlimit: 5
  });
  const hits = (data && data.query && data.query.search) ? data.query.search : [];
  const wanted = normalizeMatchStr(title);
  for(const hit of hits){
    const name = normalizeMatchStr(hit.title);
    if(name.includes(wanted) || wanted.includes(name)) return hit.title;
  }
  return hits.length ? hits[0].title : "";
}

function cleanWikiText(html){
  const text = stripHtml(String(html || "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")     // reference markers
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, ""));
  return text.replace(/\[\s*edit\s*\]/gi, "").replace(/\[\d+\]/g, "").trim();
}

function truncatePlot(text){
  const full = String(text || "").trim();
  if(!full) return "";
  const budget = Math.min(
    WIKI_PLOT_MAX_CHARS,
    Math.max(WIKI_PLOT_MIN_CHARS, Math.ceil(full.length * WIKI_PLOT_FRACTION))
  );
  if(full.length <= budget) return full;
  const slice = full.slice(0, budget);
  // Prefer cutting on a sentence boundary so the model never sees half a clause.
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return (lastStop > budget * 0.5 ? slice.slice(0, lastStop + 1) : slice).trim();
}

async function fetchWikipediaPlot(title, author, lang){
  const langs = [];
  const primary = (lang || "").split("-")[0].toLowerCase();
  if(primary) langs.push(primary);
  if(!langs.includes("en")) langs.push("en");
  for(const code of langs){
    try{
      const page = await findWikipediaArticle(title, author, code);
      if(!page) continue;
      const secData = await wikiJson(code, { action: "parse", page, prop: "sections" });
      const sections = (secData && secData.parse && secData.parse.sections) ? secData.parse.sections : [];
      const plot = sections.find(sec => WIKI_PLOT_SECTIONS.includes(normalizeMatchStr(sec.line)));
      if(!plot) continue;
      const txtData = await wikiJson(code, { action: "parse", page, prop: "text", section: plot.index });
      const html = (txtData && txtData.parse && txtData.parse.text) ? txtData.parse.text["*"] : "";
      const text = truncatePlot(cleanWikiText(html));
      if(text.length >= 120){
        return { text, lang: code, article: page, section: plot.line };
      }
    }catch(_){}
  }
  return null;
}

/* ---------- Picking the richest text ----------
   "Longest" is a poor proxy: back-cover blurbs pad with review quotes. Counting
   distinct meaningful words tracks how much the model actually has to work with. */
function synopsisRichness(text){
  const words = String(text || "").toLowerCase().match(/[\p{L}]{4,}/gu) || [];
  const unique = new Set();
  for(const w of words){
    if(QUEST_STOPWORDS.has(w)) continue;
    unique.add(w);
  }
  return unique.size;
}

function questSourceText(book){
  if(!book) return { text: "", source: "" };
  const options = [];
  const blurb = (book.synopsis || "").trim();
  const plot = (book.plotSummary || "").trim();
  if(blurb) options.push({ text: blurb, source: book.synopsisManual ? "manual" : "blurb" });
  if(plot) options.push({ text: plot, source: "wikipedia" });
  if(!options.length) return { text: "", source: "" };
  // A synopsis the user typed is a deliberate choice, so it outranks anything fetched.
  const manual = options.find(o => o.source === "manual");
  if(manual) return manual;
  options.sort((a, b) => synopsisRichness(b.text) - synopsisRichness(a.text));
  return options[0];
}

function candidateMatchScore(cand, title, author){
  let score = googleBooksMatchScore(title, author, cand.title, cand.authors);
  if(score < 0) score = 0;
  if(cand.synopsis) score += 2;
  if(cand.coverUrl) score += 1;
  if(cand.pageCount) score += 1;
  return score;
}

async function fetchBookCandidates(title, author){
  const results = await Promise.all([
    fetchGoogleBooksCandidates(title, author),
    fetchOpenLibraryCandidates(title, author)
  ]);
  const all = results[0].concat(results[1]);
  for(const cand of all){
    cand._strict = googleBooksStrictMatch(title, author, cand.title, cand.authors);
    cand._score = candidateMatchScore(cand, title, author);
  }
  all.sort((a, b) => (Number(b._strict) - Number(a._strict)) || (b._score - a._score));
  return all.slice(0, BOOK_MATCH_LIMIT * 2);
}

function applyBookCandidate(book, cand, options){
  if(!book || !cand) return false;
  if(!state.books || !state.books[book.id]) return false;
  ensureGoogleBooksDefaults(book);
  // An explicit pick means the user is correcting us, so it wins over whatever
  // a previous lookup stored. Automatic matches only fill in blanks.
  const explicit = Boolean(options && options.explicit);
  let changed = false;
  if(cand.synopsis && (explicit || !book.synopsis || !book.synopsis.trim())){
    book.synopsis = cand.synopsis;
    changed = true;
  }
  if(!book.coverData && cand.coverUrl){
    book.coverData = cand.coverUrl;
    changed = true;
  }
  if((!book.totalPages || book.totalPages < 1) && cand.pageCount){
    book.totalPages = cand.pageCount;
    changed = true;
  }
  if(!book.publisher && cand.publisher){
    book.publisher = cand.publisher;
    changed = true;
  }
  if(!book.language && cand.language){
    book.language = cand.language;
    changed = true;
  }
  if(cand.provider === "google" && (explicit || !book.googleBooks.id)){
    book.googleBooks.id = cand.id || "";
  }
  book.googleBooks.fetchedAt = new Date().toISOString();
  book.metaSource = {
    provider: cand.provider,
    id: cand.id || "",
    title: cand.title || "",
    pickedAt: new Date().toISOString()
  };
  return changed || true;
}

/* A picked edition often carries no description (Open Library records
   frequently lack one). Before giving up on the AI, ask the other provider
   for a synopsis of the same title. */
async function backfillSynopsis(book, cand){
  const title = (cand && cand.title) || (book && book.title) || "";
  const author = (cand && cand.authors && cand.authors[0]) || (book && book.author) || "";
  if(!title || !isOnline()) return "";
  const pickBest = (list) => {
    const strict = list.find(c => c.synopsis && googleBooksStrictMatch(title, author, c.title, c.authors));
    if(strict) return strict.synopsis;
    const any = list.find(c => c.synopsis);
    return any ? any.synopsis : "";
  };
  try{
    if(!cand || cand.provider !== "google"){
      const hit = pickBest(await fetchGoogleBooksCandidates(title, author));
      if(hit) return hit;
    }
    if(!cand || cand.provider !== "openlibrary"){
      const hit = pickBest(await fetchOpenLibraryCandidates(title, author));
      if(hit) return hit;
    }
  }catch(_){}
  return "";
}

async function ensurePlotSummary(book){
  if(!book || !book.id) return false;
  if(!state.settings.usePlotSummaries) return false;
  if((book.plotSummary || "").trim()) return false;
  if(!isOnline()) return false;
  const title = (book.title || "").trim();
  const author = (book.author || "").trim();
  if(!title) return false;
  setGoogleBooksStatus(book.id, "searching Wikipedia plot");
  const found = await fetchWikipediaPlot(title, author, book.language || state.settings.lang);
  if(!state.books || !state.books[book.id]) return false;
  if(!found){
    setGoogleBooksStatus(book.id, "no Wikipedia plot section");
    return false;
  }
  book.plotSummary = found.text;
  book.plotSource = {
    lang: found.lang,
    article: found.article,
    section: found.section,
    fetchedAt: new Date().toISOString()
  };
  setGoogleBooksStatus(book.id, `Wikipedia plot from ${found.lang}:${found.article}`);
  return true;
}

/* ---------- Match picker ---------- */

let _matchPickerBookId = "";
let _matchPickerCandidates = [];

function providerLabel(provider){
  if(provider === "google") return "Google Books";
  if(provider === "openlibrary") return "Open Library";
  return provider || "—";
}

function renderMatchPicker(){
  const list = $("matchList");
  if(!list) return;
  list.innerHTML = _matchPickerCandidates.map((cand, idx) => {
    const authors = cand.authors.length ? cand.authors.join(", ") : "—";
    const meta = [
      cand.year || "",
      cand.publisher || "",
      cand.pageCount ? t("matchPages", { pages: String(cand.pageCount) }) : ""
    ].filter(Boolean).join(" · ");
    const snippet = cand.synopsis
      ? escapeHtml(cand.synopsis.slice(0, 180)) + (cand.synopsis.length > 180 ? "…" : "")
      : `<em>${escapeHtml(t("matchNoSynopsis"))}</em>`;
    const cover = cand.coverUrl
      ? `<img class="matchCover" src="${escapeHtml(cand.coverUrl)}" alt="" loading="lazy" />`
      : `<div class="matchCover matchCoverEmpty"></div>`;
    const cls = cand.synopsis ? "matchItem" : "matchItem noSynopsis";
    return `<button class="${cls}" type="button" data-idx="${idx}">
      ${cover}
      <div class="matchInfo">
        <div class="matchTitle">${escapeHtml(cand.title)}</div>
        <div class="matchAuthor">${escapeHtml(authors)}</div>
        <div class="matchMeta">${escapeHtml(meta)}</div>
        <div class="matchSnippet">${snippet}</div>
        <div class="matchProvider">${escapeHtml(providerLabel(cand.provider))}</div>
      </div>
    </button>`;
  }).join("");
  list.querySelectorAll(".matchItem").forEach(el => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.idx);
      chooseBookMatch(idx);
    });
  });
}

function openBookMatchPicker(book, candidates){
  const overlay = $("matchOverlay");
  if(!overlay){
    return false;
  }
  _matchPickerBookId = book.id;
  _matchPickerCandidates = candidates;
  const subtitle = $("matchSubtitle");
  if(subtitle){
    subtitle.textContent = t("matchSubtitle", {
      title: book.title || t("untitled"),
      count: String(candidates.length)
    });
  }
  renderMatchPicker();
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  return true;
}

function closeBookMatchPicker(){
  const overlay = $("matchOverlay");
  if(overlay){
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }
  _matchPickerBookId = "";
  _matchPickerCandidates = [];
}

async function chooseBookMatch(idx){
  const bookId = _matchPickerBookId;
  const cand = _matchPickerCandidates[idx];
  closeBookMatchPicker();
  const book = state.books && state.books[bookId];
  if(!book || !cand) return;
  applyBookCandidate(book, cand, { explicit: true });
  save();
  renderAll();
  setGoogleBooksStatus(book.id, `picked ${cand.provider} match`);
  if(!(book.synopsis || "").trim()){
    setGoogleBooksStatus(book.id, `picked ${cand.provider} (no synopsis) → backfilling`);
    const synopsis = await backfillSynopsis(book, cand);
    if(!state.books || !state.books[book.id]) return;
    if(synopsis){
      book.synopsis = synopsis;
      save();
      renderAll();
      setGoogleBooksStatus(book.id, `synopsis backfilled from other provider`);
    }
  }
  // Always try Wikipedia as well: its plot section is usually far richer than a
  // back-cover blurb, and questSourceText picks whichever carries more.
  if(await ensurePlotSummary(book)) save();
  if(!state.books || !state.books[book.id]) return;
  if(!questSourceText(book).text){
    setGoogleBooksStatus(book.id, "no synopsis anywhere → generic pool");
    showToast(t("matchNoSynopsisFound"));
  }
  renderAll();
  await generateQuestObjectsForBook(book, { force: true });
}

async function dismissBookMatchPicker(){
  const bookId = _matchPickerBookId;
  closeBookMatchPicker();
  const book = state.books && state.books[bookId];
  if(!book) return;
  setGoogleBooksStatus(book.id, "user declined all matches → trying Wikipedia");
  // Wikipedia is looked up by title/author, not by a chosen catalogue record, so
  // declining every candidate still leaves it as a source worth trying.
  if(await ensurePlotSummary(book)) save();
  if(!state.books || !state.books[book.id]) return;
  if(!questSourceText(book).text){
    setGoogleBooksStatus(book.id, "no synopsis anywhere → generic pool");
    showToast(t("matchNoSynopsisFound"));
  }
  renderAll();
  await generateQuestObjectsForBook(book, { force: true });
}

function hashString(input){
  let h = 2166136261;
  const str = String(input || "");
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function questSeedForBook(book){
  const source = (book && book.id) ? book.id : `${book && book.title ? book.title : ""}|${book && book.author ? book.author : ""}`;
  const seed = book && book.quest && Number.isFinite(book.quest.seed) ? book.quest.seed : 0;
  if(seed){
    return hashString(`${source}|${seed}`);
  }
  return hashString(source);
}

function questObjectCountForBook(book){
  const pages = book && Number.isFinite(book.totalPages) && book.totalPages > 0
    ? book.totalPages : 0;
  if(pages === 0) return 3;
  if(pages < 200) return 2;
  if(pages < 300) return 3;
  if(pages < 500) return 4;
  if(pages < 700) return 5;
  return 6;
}

function computeQuestThresholds(count){
  const n = Math.max(1, count);
  return Array.from({ length: n }, (_, i) => parseFloat(((i + 1) / n).toFixed(4)));
}

function pickQuestFallbackObjects(book, count){
  const pool = QUEST_FALLBACK_POOL.slice();
  const rng = mulberry32(questSeedForBook(book));
  for(let i=pool.length-1;i>0;i--){
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count || 5);
}

function questThresholdsForBook(book){
  const thresholds = book && book.quest && Array.isArray(book.quest.thresholds) && book.quest.thresholds.length
    ? book.quest.thresholds
    : QUEST_THRESHOLDS;
  const objCount = book && book.quest && Array.isArray(book.quest.objects) ? book.quest.objects.length : 0;
  if(objCount && thresholds.length !== objCount){
    return Array.from({ length: objCount }, (_, i) => (i + 1) / (objCount + 1));
  }
  return thresholds;
}

function questProgress(book){
  if(!book || !book.totalPages) return 0;
  return clamp((book.currentPage || 0) / book.totalPages, 0, 1);
}

function questUnlockedCount(book){
  const thresholds = questThresholdsForBook(book);
  const progress = questProgress(book);
  let count = 0;
  for(const tVal of thresholds){
    if(progress >= tVal) count += 1;
  }
  const maxCount = book && book.quest && Array.isArray(book.quest.objects) ? book.quest.objects.length : 0;
  const limit = maxCount || thresholds.length;
  return limit ? Math.min(count, limit) : count;
}

function ensureQuestDefaults(book){
  if(!book.quest || typeof book.quest !== "object"){
    book.quest = { objects: [], generatedAt: "", method: "", thresholds: QUEST_THRESHOLDS.slice(), seed: 0 };
    return;
  }
  if(!Array.isArray(book.quest.objects)) book.quest.objects = [];
  if(typeof book.quest.generatedAt !== "string") book.quest.generatedAt = "";
  if(typeof book.quest.method !== "string") book.quest.method = "";
  if(!Array.isArray(book.quest.thresholds) || !book.quest.thresholds.length){
    const existingCount = Array.isArray(book.quest.objects) ? book.quest.objects.length : 0;
    book.quest.thresholds = existingCount > 0
      ? computeQuestThresholds(existingCount)
      : QUEST_THRESHOLDS.slice();
  }
  if(!Number.isFinite(book.quest.seed)) book.quest.seed = 0;
}

function bumpQuestSeed(book){
  if(!book) return;
  ensureQuestDefaults(book);
  const current = Number.isFinite(book.quest.seed) ? book.quest.seed : 0;
  book.quest.seed = current + 1;
}

function ensureGoogleBooksDefaults(book){
  if(!book.googleBooks || typeof book.googleBooks !== "object"){
    book.googleBooks = { id: "", fetchedAt: "" };
    return;
  }
  if(typeof book.googleBooks.id !== "string") book.googleBooks.id = "";
  if(typeof book.googleBooks.fetchedAt !== "string") book.googleBooks.fetchedAt = "";
}

function sanitizeQuestObjects(raw, count){
  if(!Array.isArray(raw) || !raw.length) return null;
  const target = (count && count > 0) ? count : QUEST_MIN_OBJECTS;
  const min = Math.max(1, target - 1);
  const max = target + 1;
  const cleaned = [];
  for(const item of raw){
    if(typeof item !== "string") continue;
    let val = item.trim().toLowerCase().replace(/\s+/g, " ");
    if(val.length < 2 || val.length > 30) continue;
    if(!/^[\p{L}][\p{L}\s-]*$/u.test(val)) continue;
    const tokens = val.split(/[\s-]+/g).filter(Boolean);
    if(tokens.some(tok => QUEST_ABSTRACT_TERMS.has(tok))) continue;
    cleaned.push(val);
  }
  const unique = Array.from(new Set(cleaned));
  if(unique.length < min) return null;
  if(unique.length > max) return unique.slice(0, target);
  return unique;
}

function langCodeToName(lang){
  const map = {
    "en":"English","en-GB":"English","en-US":"English","en-AU":"English","en-CA":"English",
    "es":"Spanish","es-MX":"Spanish","es-ES":"Spanish","es-AR":"Spanish","es-CO":"Spanish","es-CL":"Spanish","es-PE":"Spanish","es-VE":"Spanish",
    "zh":"Chinese","zh-CN":"Chinese","zh-TW":"Chinese","zh-HK":"Chinese",
    "hi":"Hindi","hi-IN":"Hindi",
    "ar":"Arabic","ar-SA":"Arabic","ar-EG":"Arabic","ar-MA":"Arabic",
    "fr":"French","fr-FR":"French","fr-CA":"French","fr-BE":"French",
    "pt":"Portuguese","pt-BR":"Portuguese","pt-PT":"Portuguese",
    "ru":"Russian","ru-RU":"Russian",
    "de":"German","de-DE":"German","de-AT":"German","de-CH":"German",
    "ja":"Japanese","ja-JP":"Japanese",
    "ko":"Korean","ko-KR":"Korean",
    "it":"Italian","it-IT":"Italian",
    "tr":"Turkish","tr-TR":"Turkish",
    "nl":"Dutch","nl-NL":"Dutch","nl-BE":"Dutch",
    "pl":"Polish","pl-PL":"Polish",
    "sv":"Swedish","sv-SE":"Swedish",
    "no":"Norwegian","nb":"Norwegian","nn":"Norwegian",
    "da":"Danish","da-DK":"Danish",
    "fi":"Finnish","fi-FI":"Finnish",
    "cs":"Czech","cs-CZ":"Czech",
    "ro":"Romanian","ro-RO":"Romanian",
    "hu":"Hungarian","hu-HU":"Hungarian",
    "el":"Greek","el-GR":"Greek",
    "he":"Hebrew","he-IL":"Hebrew",
    "id":"Indonesian","id-ID":"Indonesian",
    "ms":"Malay","ms-MY":"Malay",
    "th":"Thai","th-TH":"Thai",
    "vi":"Vietnamese","vi-VN":"Vietnamese",
    "uk":"Ukrainian","uk-UA":"Ukrainian",
    "bn":"Bengali","bn-BD":"Bengali","bn-IN":"Bengali",
    "sw":"Swahili","sw-KE":"Swahili",
    "ca":"Catalan","ca-ES":"Catalan",
    "eu":"Basque","gl":"Galician","hr":"Croatian","sk":"Slovak",
    "bg":"Bulgarian","sr":"Serbian",
    "fa":"Persian","fa-IR":"Persian",
    "ur":"Urdu","ur-PK":"Urdu"
  };
  if(!lang) return "English";
  return map[lang] || map[lang.split("-")[0]] || "English";
}

function questPromptForSynopsis(count, lang){
  const n = count || 4;
  const langName = langCodeToName(lang);
  return [
    "You are given a book synopsis.",
    `List exactly ${n} concrete physical objects from the story.`,
    "Avoid spoilers. Only tangible items, no abstract concepts.",
    "Order by story progression.",
    `Reply ONLY with a JSON array of exactly ${n} short names in ${langName}, lowercase.`
  ].join(" ");
}

function heuristicQuestObjectsFromSynopsis(synopsis, seed, count){
  const target = (count && count > 0) ? count : QUEST_MIN_OBJECTS;
  const text = stripHtml(synopsis || "").toLowerCase();
  const words = text.match(/[\p{L}]+/gu) || [];
  const picked = [];
  const seen = new Set();
  for(const wordRaw of words){
    const word = wordRaw.toLowerCase();
    if(word.length < 4) continue;
    if(QUEST_STOPWORDS.has(word)) continue;
    if(QUEST_ABSTRACT_TERMS.has(word)) continue;
    if(seen.has(word)) continue;
    seen.add(word);
    picked.push(word);
  }
  if(picked.length <= target) return picked;
  if(!seed) return picked.slice(0, target);
  const rng = mulberry32(hashString(`${seed}|${text}`));
  const pickedCount = Math.min(target, picked.length);
  const pickedIdx = new Set();
  while(pickedIdx.size < pickedCount){
    pickedIdx.add(Math.floor(rng() * picked.length));
  }
  return Array.from(pickedIdx).sort((a, b) => a - b).map(idx => picked[idx]);
}

function webgpuSupported(){
  return typeof navigator !== "undefined" && Boolean(navigator.gpu);
}

function windowAiSupported(){
  return typeof window !== "undefined" && window.ai && typeof window.ai.languageModel !== "undefined";
}

function isOnline(){
  if(typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function setQuestStatus(bookId, text){
  if(!bookId) return;
  _questStatus[bookId] = { text: String(text || ""), at: new Date().toISOString() };
  const b = activeBook();
  if(b && b.id === bookId){
    renderQuestDebug(b);
  }
}

function setGoogleBooksStatus(bookId, text){
  if(!bookId) return;
  _googleBooksStatus[bookId] = { text: String(text || ""), at: new Date().toISOString() };
  const b = activeBook();
  if(b && b.id === bookId){
    renderQuestDebug(b);
  }
}

function getAiStatusText(){
  if(!state.settings.aiEnabled){
    return t("aiStatusDisabled");
  }
  if(!isOnline()){
    return `${t("aiStatusOffline")} ${t("aiStatusFallback")}`;
  }
  // Chrome Built-in AI
  if(windowAiSupported()){
    return t("aiStatusWindowAi");
  }
  // WebLLM (WebGPU desktop)
  if(webgpuSupported()){
    if(_webLLMEngine) return t("aiStatusReady");
    if(_webLLMFailed){
      return _webLLMLastStatus ? `${t("aiStatusFallback")} ${_webLLMLastStatus}` : t("aiStatusFallback");
    }
    if(_webLLMLoading){
      const pct = Math.max(0, Math.min(100, Math.round((_webLLMProgress || 0) * 100)));
      const base = `${t("aiStatusDownloading", { pct: String(pct) })} ${t("aiStatusFallback")}`;
      return _webLLMLastStatus ? `${base} ${_webLLMLastStatus}` : base;
    }
    return `${t("aiStatusIdle")} ${t("aiStatusFallback")}`;
  }
  // Transformers.js (mobile/Safari)
  if(_transformersEngine) return t("aiStatusTransformers");
  if(_transformersFailed) return `${t("aiStatusFallback")}`;
  if(_transformersLoading){
    const pct = Math.max(0, Math.min(100, Math.round((_transformersProgress || 0) * 100)));
    return t("aiStatusTransformersDownloading", { pct: String(pct) });
  }
  return `${t("aiStatusIdle")} ${t("aiStatusFallback")}`;
}

function maybeAutoStartWebLLM(force){
  if(_webLLMLoading || _webLLMEngine) return;
  if(!state.settings.aiEnabled) return;
  if(!webgpuSupported() || !isOnline()) return;
  if(_webLLMFailed && !force) return;
  startWebLLMLoad();
}

function maybeAutoStartAI(force){
  if(windowAiSupported()) return; // window.ai needs no pre-loading
  if(webgpuSupported()){
    maybeAutoStartWebLLM(force);
  } else {
    // Mobile/Safari: pre-load Transformers.js lite model
    if(!_transformersLoading && !_transformersEngine && !_transformersFailed && state.settings.aiEnabled && isOnline()){
      startTransformersLoad();
    }
  }
}

function updateAiUI(){
  const toggle = $("aiToggle");
  const status = $("aiDownloadStatus");
  const bar = $("aiDownloadBar");
  if(toggle){
    toggle.checked = Boolean(state.settings.aiEnabled);
    toggle.disabled = false; // at least one engine works on all browsers
  }
  const plotToggle = $("plotToggle");
  if(plotToggle) plotToggle.checked = state.settings.usePlotSummaries !== false;
  if(!status) return;
  status.textContent = getAiStatusText();
  if(bar){
    const isLoading = _webLLMLoading || _transformersLoading;
    const progress = _webLLMLoading ? _webLLMProgress : _transformersProgress;
    const pct = Math.max(0, Math.min(100, Math.round((progress || 0) * 100)));
    bar.style.width = `${pct}%`;
    const wrap = bar.parentElement;
    if(wrap){
      wrap.classList.toggle("show", isLoading);
    }
  }
  if(state.settings.aiEnabled){
    maybeAutoStartAI(false);
  }
  const active = activeBook();
  if(active){
    renderQuestDebug(active);
  }
}

function extractJsonArray(text){
  if(!text) return null;
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if(start === -1 || end === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try{
    return JSON.parse(slice);
  }catch(_){
    return null;
  }
}

function buildWebLLMAppConfig(webllm){
  const base = webllm && webllm.prebuiltAppConfig ? webllm.prebuiltAppConfig : {};
  return Object.assign({}, base, { useIndexedDBCache: true });
}

async function loadWebLLMLibrary(){
  if(_webLLM) return _webLLM;
  _webLLM = await import(WEBLLM_IMPORT_URL);
  return _webLLM;
}

async function startWebLLMLoad(){
  if(_webLLMLoading || _webLLMEngine) return _webLLMEngine;
  if(!state.settings.aiEnabled || !webgpuSupported() || !isOnline()) return null;
  _webLLMLoading = true;
  _webLLMProgress = 0;
  _webLLMFailed = false;
  updateAiUI();
  try{
    const webllm = await loadWebLLMLibrary();
    const appConfig = buildWebLLMAppConfig(webllm);
    const list = appConfig && Array.isArray(appConfig.model_list) ? appConfig.model_list : [];
    if(!list.some(m => m && m.model_id === WEBLLM_MODEL_ID)){
      throw new Error("model not available");
    }
    const initProgressCallback = (report) => {
      if(typeof report === "number"){
        _webLLMProgress = report;
        _webLLMLastStatus = "";
      }else if(report && typeof report.progress === "number"){
        _webLLMProgress = report.progress;
        _webLLMLastStatus = report.text || "";
      }else if(report && typeof report.percentage === "number"){
        _webLLMProgress = report.percentage / 100;
        _webLLMLastStatus = report.text || "";
      }else if(report && typeof report.progress === "string"){
        const pct = Number(report.progress);
        if(Number.isFinite(pct)) _webLLMProgress = pct / 100;
        _webLLMLastStatus = report.text || "";
      }else if(report && report.text){
        _webLLMLastStatus = report.text;
      }
      updateAiUI();
    };
    _webLLMEngine = await webllm.CreateMLCEngine(WEBLLM_MODEL_ID, { initProgressCallback, appConfig });
    _webLLMProgress = 1;
    _webLLMLastStatus = "";
    flushWebLLMPendingBooks();
    return _webLLMEngine;
  }catch(err){
    _webLLMEngine = null;
    _webLLMLastStatus = err && err.message ? err.message : "";
    _webLLMFailed = true;
    return null;
  }finally{
    _webLLMLoading = false;
    updateAiUI();
  }
}

async function flushWebLLMPendingBooks(){
  if(!_webLLMEngine || !_webLLMPendingBooks.size) return;
  const ids = Array.from(_webLLMPendingBooks);
  _webLLMPendingBooks.clear();
  for(const id of ids){
    const book = state.books && state.books[id];
    if(!book) continue;
    if(!state.settings.aiEnabled) continue;
    if(!webgpuSupported() || !isOnline()){
      _webLLMPendingBooks.add(id);
      continue;
    }
    const synopsis = (book.synopsis || "").trim();
    if(!synopsis) continue;
    if(book.quest && book.quest.method === "webgpu-llm") continue;
    await generateQuestObjectsForBook(book, { force: true, allowFallback: false, queueForAI: false });
  }
}

async function loadTransformersLibrary(){
  if(_transformersLib) return _transformersLib;
  _transformersLib = await import(TRANSFORMERS_IMPORT_URL);
  return _transformersLib;
}

async function startTransformersLoad(){
  if(_transformersLoading || _transformersEngine || _transformersFailed) return;
  if(!state.settings.aiEnabled || !isOnline()) return;
  _transformersLoading = true;
  _transformersProgress = 0;
  updateAiUI();
  try{
    const { pipeline, env } = await loadTransformersLibrary();
    env.allowLocalModels = false;
    _transformersEngine = await pipeline("text2text-generation", TRANSFORMERS_MODEL_ID, {
      progress_callback: (report) => {
        if(report && typeof report.progress === "number"){
          _transformersProgress = report.progress / 100;
          updateAiUI();
        }
      }
    });
    _transformersProgress = 1;
    flushTransformersPendingBooks();
  }catch(err){
    _transformersFailed = true;
    _transformersEngine = null;
  }finally{
    _transformersLoading = false;
    updateAiUI();
  }
}

async function flushTransformersPendingBooks(){
  if(!_transformersEngine || !_transformersPendingBooks.size) return;
  const ids = Array.from(_transformersPendingBooks);
  _transformersPendingBooks.clear();
  for(const id of ids){
    const book = state.books && state.books[id];
    if(!book) continue;
    if(!state.settings.aiEnabled) continue;
    const synopsis = (book.synopsis || "").trim();
    if(!synopsis) continue;
    if(book.quest && (book.quest.method === "webgpu-llm" || book.quest.method === "window-ai" || book.quest.method === "transformers-js")) continue;
    await generateQuestObjectsForBook(book, { force: true, allowFallback: false, queueForAI: false });
  }
}

async function requestTransformersQuestObjects(book, count, lang){
  if(!_transformersEngine) return null;
  const prompt = `${questPromptForSynopsis(count, lang)}\nTitle: ${book.title || ""}\nSynopsis: ${stripHtml(book.synopsis || "")}`;
  try{
    const output = await _transformersEngine(prompt, { max_new_tokens: 120, temperature: 0.2 });
    const text = output && output[0] && output[0].generated_text ? output[0].generated_text : "";
    return extractJsonArray(text);
  }catch(_){
    return null;
  }
}

async function requestWebGPUQuestObjects(book, count, lang){
  if(!_webLLMEngine) return null;
  const synopsis = book.synopsis || "";
  const messages = [
    { role: "system", content: questPromptForSynopsis(count, lang) },
    { role: "user", content: `Title: ${book.title || ""}\nAuthor: ${book.author || ""}\nSynopsis: ${stripHtml(synopsis)}` }
  ];
  try{
    const result = await _webLLMEngine.chat.completions.create({
      messages,
      temperature: 0.2,
      max_tokens: 220
    });
    const text = result && result.choices && result.choices[0] && result.choices[0].message
      ? result.choices[0].message.content
      : "";
    return extractJsonArray(text);
  }catch(_){
    return null;
  }
}

async function requestWindowAiQuestObjects(book, count, lang){
  try{
    if(!windowAiSupported()) return null;
    const capabilities = await window.ai.languageModel.capabilities();
    if(!capabilities || capabilities.available === "no") return null;
    const session = await window.ai.languageModel.create({
      systemPrompt: questPromptForSynopsis(count, lang)
    });
    const prompt = `Title: ${book.title || ""}\nAuthor: ${book.author || ""}\nSynopsis: ${stripHtml(book.synopsis || "")}`;
    const text = await session.prompt(prompt);
    session.destroy();
    return extractJsonArray(text);
  }catch(_){
    _windowAiFailed = true;
    return null;
  }
}

async function clearWebLLMCache(){
  try{
    if(_webLLMEngine && _webLLMEngine.dispose){
      await _webLLMEngine.dispose();
    }
  }catch(_){}
  _webLLMEngine = null;
  _webLLMLoading = false;
  _webLLMProgress = 0;
  _webLLMLastStatus = "";
  _webLLMFailed = false;
  _webLLMPendingBooks.clear();
  try{
    const webllm = await loadWebLLMLibrary();
    if(webllm && typeof webllm.deleteModel === "function"){
      await webllm.deleteModel(WEBLLM_MODEL_ID);
    }else if(webllm && typeof webllm.deleteModelAll === "function"){
      await webllm.deleteModelAll();
    }
  }catch(_){}

  if(typeof caches !== "undefined"){
    try{
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => /mlc|webllm/i.test(k)).map(k => caches.delete(k)));
    }catch(_){}
  }
  if(typeof indexedDB !== "undefined"){
    try{
      if(indexedDB.databases){
        const dbs = await indexedDB.databases();
        await Promise.all((dbs || [])
          .filter(db => db && db.name && /mlc|webllm|tvm/i.test(db.name))
          .map(db => new Promise(resolve => {
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          })));
      }else{
        ["webllm", "mlc-web-llm", "mlc_llm", "mlc"].forEach(name => {
          try{ indexedDB.deleteDatabase(name); }catch(_){}
        });
      }
    }catch(_){}
  }
  updateAiUI();
}

async function generateQuestObjectsForBook(book, options){
  const opts = options || {};
  const force = Boolean(opts.force);
  const allowFallback = opts.allowFallback !== false;
  const queueForAI = opts.queueForAI !== false;
  if(!book || !book.id) return;
  if(!state.books || !state.books[book.id]) return;
  ensureQuestDefaults(book);
  if(!force && book.quest.objects && book.quest.objects.length){
    setQuestStatus(book.id, "skipped (already has objects)");
    return;
  }
  if(_questPending.has(book.id)) return;
  _questPending.add(book.id);

  let chosen = { text: "", source: "" };
  const count = questObjectCountForBook(book);
  const lang = book.language || (state.settings && state.settings.lang) || "en-GB";
  const computedThresholds = computeQuestThresholds(count);

  function commitObjects(objects, method){
    if(!state.books || !state.books[book.id]) return false;
    book.quest.objects = objects;
    book.quest.thresholds = computedThresholds;
    book.quest.generatedAt = new Date().toISOString();
    book.quest.method = method;
    book.quest.textSource = chosen.source || "";
    save();
    renderAll();
    return true;
  }

  try{
    setQuestStatus(book.id, "starting quest generation");
    chosen = questSourceText(book);
    const synopsis = chosen.text;
    if(synopsis){
      setQuestStatus(book.id, `using ${chosen.source} text (${synopsisRichness(synopsis)} distinct words)`);
    }

    if(!synopsis){
      if(allowFallback){
        setQuestStatus(book.id, "no synopsis → generic pool (AI never ran)");
        const fallback = pickQuestFallbackObjects(book, count);
        if(fallback.length) commitObjects(fallback, "pool");
      }
      return;
    }

    const wantsAI = Boolean(state.settings.aiEnabled);
    const online = isOnline();

    // 1. Chrome Built-in AI (window.ai / Gemini Nano) — zero download, all devices
    if(wantsAI && windowAiSupported()){
      setQuestStatus(book.id, "requesting Chrome AI objects");
      let objects = null;
      try{
        const raw = await requestWindowAiQuestObjects(book, count, lang);
        objects = sanitizeQuestObjects(raw, count);
        if(!objects){
          setQuestStatus(book.id, "Chrome AI retry");
          const retryRaw = await requestWindowAiQuestObjects(book, count, lang);
          objects = sanitizeQuestObjects(retryRaw, count);
        }
      }catch(_){}
      if(objects && objects.length){
        setQuestStatus(book.id, "Chrome AI success");
        commitObjects(objects, "window-ai");
        return;
      }
      setQuestStatus(book.id, "Chrome AI failed → trying next engine");
    }

    // 2. WebLLM (WebGPU — desktop Chrome/Edge)
    if(wantsAI && webgpuSupported() && online){
      if(!_webLLMEngine){
        if(queueForAI) _webLLMPendingBooks.add(book.id);
        maybeAutoStartWebLLM(force);
        if(allowFallback){
          setQuestStatus(book.id, _webLLMLoading ? "model downloading → queued (fallback shown)" : "model not ready → queued (fallback shown)");
          const heuristic = heuristicQuestObjectsFromSynopsis(synopsis, book.quest && book.quest.seed, count);
          const fallback = heuristic.length ? heuristic : pickQuestFallbackObjects(book, count);
          if(fallback.length) commitObjects(fallback, heuristic.length ? "heuristic" : "pool");
        }
        return;
      }
      let objects = null;
      try{
        setQuestStatus(book.id, "requesting WebLLM objects");
        const raw = await requestWebGPUQuestObjects(book, count, lang);
        objects = sanitizeQuestObjects(raw, count);
        if(!objects){
          setQuestStatus(book.id, "WebLLM retry");
          const retryRaw = await requestWebGPUQuestObjects(book, count, lang);
          objects = sanitizeQuestObjects(retryRaw, count);
        }
      }catch(_){}
      if(objects && objects.length){
        setQuestStatus(book.id, "WebLLM success");
        commitObjects(objects, "webgpu-llm");
        return;
      }
      setQuestStatus(book.id, "WebLLM failed → trying next engine");
    }

    // 3. Transformers.js (mobile/Safari — WebAssembly, ~80MB download)
    if(wantsAI && !webgpuSupported() && !windowAiSupported() && online){
      if(!_transformersEngine){
        if(queueForAI) _transformersPendingBooks.add(book.id);
        startTransformersLoad();
        if(allowFallback){
          setQuestStatus(book.id, _transformersLoading ? "lite model downloading → queued (fallback shown)" : "lite model not ready → queued (fallback shown)");
          const heuristic = heuristicQuestObjectsFromSynopsis(synopsis, book.quest && book.quest.seed, count);
          const fallback = heuristic.length ? heuristic : pickQuestFallbackObjects(book, count);
          if(fallback.length) commitObjects(fallback, heuristic.length ? "heuristic" : "pool");
        }
        return;
      }
      let objects = null;
      try{
        setQuestStatus(book.id, "requesting Transformers.js objects");
        const raw = await requestTransformersQuestObjects(book, count, lang);
        objects = sanitizeQuestObjects(raw, count);
        if(!objects){
          setQuestStatus(book.id, "Transformers.js retry");
          const retryRaw = await requestTransformersQuestObjects(book, count, lang);
          objects = sanitizeQuestObjects(retryRaw, count);
        }
      }catch(_){}
      if(objects && objects.length){
        setQuestStatus(book.id, "Transformers.js success");
        commitObjects(objects, "transformers-js");
        return;
      }
      setQuestStatus(book.id, "Transformers.js failed → heuristic fallback");
    }

    // 4. Heuristic / pool fallback
    if(!allowFallback){
      setQuestStatus(book.id, "AI failed → keeping existing fallback");
      return;
    }
    const heuristic = heuristicQuestObjectsFromSynopsis(synopsis, book.quest && book.quest.seed, count);
    const fallback = heuristic.length ? heuristic : pickQuestFallbackObjects(book, count);
    if(fallback.length){
      const reason = !wantsAI ? "ai disabled" : !online ? "offline" : "ai unavailable";
      setQuestStatus(book.id, `${reason} → ${heuristic.length ? "heuristic" : "generic pool"}`);
      commitObjects(fallback, heuristic.length ? "heuristic" : "pool");
    }
  }finally{
    _questPending.delete(book.id);
  }
}

function canAttemptGoogleBooks(book, mode){
  const title = (book.title || "").trim();
  const author = (book.author || "").trim();
  if(!title || !author) return false;
  if(mode === "save"){
    const hasSynopsis = Boolean(book.synopsis && book.synopsis.trim());
    const hasId = Boolean(book.googleBooks && book.googleBooks.id);
    if(hasSynopsis && hasId) return false;
  }
  return true;
}

async function enrichBookFromProviders(book, mode){
  if(!book || !book.id) return;
  if(!state.books || !state.books[book.id]) return;
  if(_googleBooksPending.has(book.id)) return;
  if(!canAttemptGoogleBooks(book, mode)){
    const title = (book.title || "").trim();
    const author = (book.author || "").trim();
    if(!title || !author){
      setGoogleBooksStatus(book.id, "missing title/author → skip lookup");
      showToast(t("matchNeedsAuthor"));
    }else if(mode === "save"){
      setGoogleBooksStatus(book.id, "already has synopsis/id → skip");
    }else{
      setGoogleBooksStatus(book.id, "skip");
    }
    await generateQuestObjectsForBook(book, { force: mode === "regen" });
    return;
  }
  if(!isOnline()){
    setGoogleBooksStatus(book.id, "offline → skip lookup");
    await generateQuestObjectsForBook(book, { force: mode === "regen" });
    return;
  }
  _googleBooksPending.add(book.id);
  try{
    const title = (book.title || "").trim();
    const author = (book.author || "").trim();
    setGoogleBooksStatus(book.id, "searching Google Books + Open Library");
    const candidates = await fetchBookCandidates(title, author);
    if(!state.books || !state.books[book.id]) return;

    if(!candidates.length){
      setGoogleBooksStatus(book.id, "no catalogue match → trying Wikipedia");
      const gotPlot = await ensurePlotSummary(book);
      if(!state.books || !state.books[book.id]) return;
      if(gotPlot){
        save();
        renderAll();
      }else{
        showToast(t("matchNone"));
      }
      await generateQuestObjectsForBook(book, { force: mode === "regen" });
      return;
    }

    // Only skip the picker when exactly one candidate is an unambiguous match
    // that actually carries a synopsis. Anything else is the user's call.
    const confident = candidates.filter(c => c._strict && c.synopsis);
    if(confident.length === 1){
      applyBookCandidate(book, confident[0]);
      setGoogleBooksStatus(book.id, `single confident match (${confident[0].provider})`);
      await ensurePlotSummary(book);
      if(!state.books || !state.books[book.id]) return;
      save();
      renderAll();
      await generateQuestObjectsForBook(book, { force: mode === "regen" });
      return;
    }

    setGoogleBooksStatus(book.id, `${candidates.length} candidates → waiting for user`);
    if(!openBookMatchPicker(book, candidates)){
      // No picker in the DOM (tests/older markup): fall back to the top hit.
      applyBookCandidate(book, candidates[0]);
      save();
      renderAll();
      await generateQuestObjectsForBook(book, { force: mode === "regen" });
    }
  }catch(_){
    setGoogleBooksStatus(book.id, "lookup error");
    await generateQuestObjectsForBook(book, { force: mode === "regen" });
  }finally{
    _googleBooksPending.delete(book.id);
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
    finishedAt: null,
    synopsis: "",
    language: "",
    googleBooks: { id: "", fetchedAt: "" },
    quest: { objects: [], generatedAt: "", method: "", thresholds: QUEST_THRESHOLDS.slice(), seed: 0 }
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

function startTimerInterval(){
  if(state.timer.intervalId){
    clearInterval(state.timer.intervalId);
  }
  state.timer.intervalId = setInterval(updateTimerDisplay, 250);
}

function stopTimerInterval(){
  if(state.timer.intervalId){
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }
}

function updateTimerDisplay(){
  if(!state.timer.running) return;
  const timerBig = $("timerBig");
  const timerHint = $("timerHint");
  const hyperBtn = $("hyper");
  if(!timerBig || !timerHint || !hyperBtn) return;

  if(!state.timer.paused){
    if(!state.timer.startMs){
      state.timer.startMs = Date.now() - (state.timer.elapsedMs || 0);
    }
    state.timer.elapsedMs = Date.now() - state.timer.startMs;
  }

  if(state.timer.mode === "sprint"){
    const target = state.timer.sprintMins * 60 * 1000;
    const remaining = target - state.timer.elapsedMs;

    if(remaining <= 0){
      if(!state.timer.bell){
        state.timer.bell = true;
        if(!state.timer.paused) beep();
      }
      timerBig.textContent = "+" + formatMMSS(-remaining);
      timerHint.textContent = state.timer.paused ? t("timerPaused") : t("timerSprintDone");
      hyperBtn.disabled = false;
    }else{
      state.timer.bell = false;
      timerBig.textContent = formatMMSS(remaining);
      timerHint.textContent = state.timer.paused ? t("timerPaused") : t("timerSprintHint");
      hyperBtn.disabled = true;
    }
  }else{
    timerBig.textContent = formatMMSS(state.timer.elapsedMs);
    timerHint.textContent = state.timer.paused ? t("timerPaused") : t("timerFlowHint");
    hyperBtn.disabled = true;
  }
}

function applyTimerState(){
  const modeSelect = $("mode");
  const sprintInput = $("sprintMins");
  if(modeSelect){
    modeSelect.value = state.timer.mode === "sprint" ? "sprint" : "open";
  }
  if(sprintInput){
    sprintInput.value = Number(state.timer.sprintMins || 8);
  }

  if(!state.timer.running){
    stopTimerInterval();
    $("start").disabled = false;
    $("pause").disabled = true;
    $("finish").disabled = true;
    $("hyper").disabled = true;
    $("pause").textContent = t("pause");
    $("timerBig").textContent = "00:00";
    $("timerHint").textContent = "";
    return;
  }

  $("start").disabled = true;
  $("pause").disabled = false;
  $("finish").disabled = false;
  $("pause").textContent = state.timer.paused ? t("resume") : t("pause");
  updateTimerDisplay();
  if(state.timer.paused){
    stopTimerInterval();
  }else{
    startTimerInterval();
  }
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
  applyTimerState();
  save();
}

function togglePause(){
  if(!state.timer.running) return;
  if(state.timer.paused){
    state.timer.paused = false;
    state.timer.startMs = Date.now() - state.timer.elapsedMs;
  }else{
    state.timer.elapsedMs = Date.now() - state.timer.startMs;
    state.timer.paused = true;
  }
  applyTimerState();
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
  stopTimerInterval();

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
  const synopsisEl = $("editSynopsis");
  if(synopsisEl && document.activeElement !== synopsisEl) synopsisEl.value = b.synopsis || "";
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

  renderQuestChecklist(b);
  renderQuestDebug(b);
}

function questMethodInfo(method){
  switch(method){
    case "window-ai":      return { key: "questSourceWindowAi",     good: true };
    case "webgpu-llm":     return { key: "questSourceWebLLM",       good: true };
    case "transformers-js":return { key: "questSourceTransformers", good: true };
    case "heuristic":      return { key: "questSourceHeuristic",    good: false };
    case "pool":           return { key: "questSourcePool",         good: false };
    default:               return { key: "questSourceUnknown",      good: false };
  }
}

function renderQuestSource(book){
  const el = $("questSource");
  if(!el) return;
  const quest = (book && book.quest) ? book.quest : null;
  const objects = (quest && Array.isArray(quest.objects)) ? quest.objects : [];
  if(!objects.length){
    el.textContent = "";
    el.className = "questSource";
    return;
  }
  const info = questMethodInfo(quest.method);
  const when = quest.generatedAt ? new Date(quest.generatedAt).toLocaleDateString() : "";
  const textKey = quest.textSource === "wikipedia" ? "questTextWikipedia"
    : quest.textSource === "manual" ? "questTextManual"
    : quest.textSource === "blurb" ? "questTextBlurb" : "";
  const parts = [t(info.key)];
  if(textKey) parts.push(t(textKey));
  if(when) parts.push(when);
  el.textContent = parts.join(" · ");
  el.className = info.good ? "questSource ok" : "questSource weak";
}

function renderQuestChecklist(book){
  renderQuestSource(book);
  const container = $("questChecklist");
  if(!container) return;
  if(!book || !book.quest || !Array.isArray(book.quest.objects) || !book.quest.objects.length){
    container.innerHTML = "";
    return;
  }
  const unlocked = questUnlockedCount(book);
  container.innerHTML = book.quest.objects.map((obj, idx) => {
    const isUnlocked = idx < unlocked;
    const label = isUnlocked ? escapeHtml(obj) : "???";
    const icon = isUnlocked ? "✅" : "⬜";
    const cls = isUnlocked ? "questItem" : "questItem locked";
    return `<div class="${cls}">${icon} ${label}</div>`;
  }).join("");
}

function renderQuestDebug(book){
  const container = $("questDebug");
  if(!container) return;
  if(!book){
    container.textContent = "No active book.";
    return;
  }
  const quest = book.quest || {};
  const objects = Array.isArray(quest.objects) ? quest.objects : [];
  const thresholds = questThresholdsForBook(book);
  const progressPct = Math.round(questProgress(book) * 100);
  const unlockedCount = questUnlockedCount(book);
  const statusEntry = _questStatus[book.id];
  const statusText = statusEntry && statusEntry.text ? statusEntry.text : "idle";
  const statusAt = statusEntry && statusEntry.at ? statusEntry.at : "";
  const statusLine = statusAt ? `${statusText} @ ${statusAt}` : statusText;
  const gbStatusEntry = _googleBooksStatus[book.id];
  const gbStatusText = gbStatusEntry && gbStatusEntry.text ? gbStatusEntry.text : "idle";
  const gbStatusAt = gbStatusEntry && gbStatusEntry.at ? gbStatusEntry.at : "";
  const gbStatusLine = gbStatusAt ? `${gbStatusText} @ ${gbStatusAt}` : gbStatusText;
  const gb = book.googleBooks || {};
  const synopsis = book.synopsis || "";
  const method = quest.method || "";
  const methodLabel = method ? t(questMethodInfo(method).key) : "—";
  const meta = book.metaSource || {};
  const plot = book.plotSource || {};
  const engineState = _webLLMEngine ? "ready" : _webLLMLoading ? "downloading" : _webLLMFailed ? "failed" : "idle";
  const engineProgress = _webLLMLoading ? `${Math.round((_webLLMProgress || 0) * 100)}%` : "—";
  const lines = [
    `Book: ${book.title || t("untitled")}`,
    `Author: ${book.author || "—"}`,
    `Google Books pending: ${_googleBooksPending.has(book.id) ? "yes" : "no"}`,
    `Google Books status: ${gbStatusLine}`,
    `Google Books ID: ${gb.id || "—"}`,
    `Meta source: ${meta.provider ? `${meta.provider} (${meta.id || "—"})` : "—"}`,
    `Google Books fetchedAt: ${gb.fetchedAt || "—"}`,
    `Synopsis length: ${synopsis.length} (${book.synopsisManual ? "manual" : "fetched"}, ${synopsisRichness(synopsis)} distinct words)`,
    `Plot summary: ${(book.plotSummary || "").length} chars (${synopsisRichness(book.plotSummary || "")} distinct words)`,
    `Plot source: ${plot.article ? `${plot.lang}:${plot.article} \u00a7${plot.section || "?"}` : "\u2014"}`,
    `Text fed to AI: ${questSourceText(book).source || "\u2014"}`,
    `Synopsis: ${synopsis || "—"}`,
    `Quest method: ${method || "—"} (${methodLabel})`,
    `Quest generatedAt: ${quest.generatedAt || "—"}`,
    `Quest seed: ${Number.isFinite(quest.seed) ? quest.seed : 0}`,
    `Quest objects (${objects.length}): ${objects.length ? objects.join(", ") : "—"}`,
    `Quest thresholds: ${thresholds.join(", ")}`,
    `Quest progress: ${progressPct}%`,
    `Quest unlocked: ${unlockedCount}/${Math.max(objects.length, thresholds.length)}`,
    `Quest pending: ${_questPending.has(book.id) ? "yes" : "no"}`,
    `Quest status: ${statusLine}`,
    `AI enabled: ${state.settings.aiEnabled ? "yes" : "no"}`,
    `WebGPU: ${webgpuSupported() ? "yes" : "no"}`,
    `Online: ${isOnline() ? "yes" : "no"}`,
    `Model: ${WEBLLM_MODEL_ID}`,
    `AI engine: ${engineState}`,
    `AI download: ${engineProgress}`,
    `AI status: ${getAiStatusText()}`,
    `AI queue: ${_webLLMPendingBooks.size}`
  ];
  container.textContent = lines.join("\n");
}

function renderVault(){
  const container = $("vault");
  if(!container) return;
  const mainDetails = container.querySelector(".vault-main");
  const mainOpen = mainDetails ? mainDetails.open : false;
  const openIds = new Set(Array.from(container.querySelectorAll(".vault-item[open]")).map(el => el.dataset.bookId));
  const books = Object.values(state.books || {});
  if(!state.ui.vaultReveal) state.ui.vaultReveal = {};
  const booksHtml = books.map(b => {
    if(!b) return "";
    const reveal = Boolean(state.ui.vaultReveal[b.id]);
    const thresholds = questThresholdsForBook(b);
    const progress = questProgress(b);
    let unlocked = 0;
    for(const tVal of thresholds){
      if(progress >= tVal) unlocked += 1;
    }
    const objects = b.quest && Array.isArray(b.quest.objects) ? b.quest.objects : [];
    const itemCount = Math.max(objects.length, thresholds.length || QUEST_THRESHOLDS.length);
    const openAttr = openIds.has(b.id) ? "open" : "";
    const authorLine = b.author ? `<div class="vault-author">${b.author}</div>` : "";
    const objectsHtml = Array.from({ length: itemCount }, (_, idx) => {
      const isUnlocked = idx < unlocked;
      const label = (isUnlocked || reveal) ? (objects[idx] || "???") : "???";
      const icon = isUnlocked ? "✅" : "⬜";
      const cls = isUnlocked ? "vault-object" : "vault-object locked";
      return `<div class="${cls}">${icon} ${label}</div>`;
    }).join("");
    const revealLabel = reveal ? t("vaultHide") : t("vaultReveal");
    return `
      <details class="vault-item" data-book-id="${b.id}" ${openAttr}>
        <summary class="vault-header">
          <div>
            <div class="vault-title">${b.title || t("untitled")}</div>
            ${authorLine}
          </div>
          <div class="vault-chip">${t("vaultObjects")}: ${Math.min(unlocked, itemCount)}/${itemCount}</div>
        </summary>
        <div class="vault-actions">
          <button class="btn" type="button" data-vault-action="reveal">${revealLabel}</button>
          <button class="btn danger" type="button" data-vault-action="delete">${t("vaultDelete")}</button>
        </div>
        <div class="vault-objects">${objectsHtml}</div>
      </details>
    `;
  }).join("");

  container.innerHTML = `
    <details class="vault-main" ${mainOpen ? "open" : ""}>
      <summary class="vault-main-header">
        <div class="vault-main-title">${t("vaultTitle")}</div>
        <div class="vault-main-caret" aria-hidden="true">▸</div>
      </summary>
      <div class="vault-books">
        ${booksHtml || ""}
      </div>
    </details>
  `;
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
  renderVault();
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
    finishedAt: null,
    synopsis: "",
    language: "",
    googleBooks: { id: "", fetchedAt: "" },
    quest: { objects: [], generatedAt: "", method: "", thresholds: QUEST_THRESHOLDS.slice(), seed: 0 }
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
  const book = state.books[id];
  if(canAttemptGoogleBooks(book, "add")){
    setGoogleBooksStatus(id, "starting provider lookup");
    enrichBookFromProviders(book, "add");
  }else{
    setGoogleBooksStatus(id, "missing title/author → skip");
    generateQuestObjectsForBook(book);
  }
}

function saveActiveBook(){
  const b = activeBook();
  ensureGoogleBooksDefaults(b);
  ensureQuestDefaults(b);
  b.title = $("editTitle").value.trim() || b.title || t("untitled");
  b.author = $("editAuthor").value.trim() || "";
  b.publisher = $("editPublisher").value.trim() || "";
  const synopsisInput = $("editSynopsis");
  const priorSynopsis = b.synopsis || "";
  if(synopsisInput) b.synopsis = synopsisInput.value.trim();
  const synopsisAdded = Boolean(b.synopsis) && b.synopsis !== priorSynopsis;
  if(synopsisAdded) b.synopsisManual = true;
  if(synopsisInput && !b.synopsis) b.synopsisManual = false;
  b.edition = $("editEdition").value.trim() || "";
  b.totalPages = Number($("editTotal").value || b.totalPages || 0);
  b.currentPage = clamp(Number($("editCurrent").value || b.currentPage || 0), 0, b.totalPages || 0);
  if(b.totalPages && b.currentPage >= b.totalPages && !b.finishedAt){
    b.finishedAt = new Date().toISOString();
  }
  const shouldEnrich = canAttemptGoogleBooks(b, "save");
  save();
  renderAll();
  showToast(t("bookSaved"));
  if(synopsisAdded){
    // A hand-written synopsis is the whole input the generator needs, so redo
    // the objects instead of looking the book up again.
    setGoogleBooksStatus(b.id, "manual synopsis → regenerating objects");
    generateQuestObjectsForBook(b, { force: true });
  }else if(shouldEnrich){
    setGoogleBooksStatus(b.id, "starting provider lookup");
    enrichBookFromProviders(b, "save");
  }else if(!b.quest.objects || !b.quest.objects.length){
    generateQuestObjectsForBook(b);
  }
}

function regenerateQuestForActiveBook(){
  const b = activeBook();
  if(!b) return;
  ensureQuestDefaults(b);
  bumpQuestSeed(b);
  if(!b.synopsisManual){
    // Re-fetch rather than reuse: a stale or wrong-book plot is the most likely
    // reason the user is regenerating in the first place.
    b.plotSummary = "";
    b.plotSource = { lang:"", article:"", fetchedAt:"" };
  }
  b.quest.objects = [];
  b.quest.generatedAt = "";
  b.quest.method = "";
  if(state.ui.vaultReveal) state.ui.vaultReveal[b.id] = false;
  save();
  renderAll();
  if(canAttemptGoogleBooks(b, "regen")){
    setGoogleBooksStatus(b.id, "starting provider lookup");
    enrichBookFromProviders(b, "regen");
    return;
  }
  generateQuestObjectsForBook(b, { force: true });
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
  if(backendEnabled()){
    return ensureDriveTokenViaBackend(interactive);
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

async function ensureDriveTokenViaBackend(interactive){
  const backend = getBackendUrl();
  if(!backend) return false;
  const sessionId = getDriveSession();
  if(sessionId){
    try{
      const res = await fetch(`${backend}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`
        }
      });
      if(res.ok){
        const data = await res.json();
        if(data && data.access_token){
          state.drive.token = data.access_token;
          state.drive.expiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 60000;
          state.drive.hasConsent = true;
          setDriveUI(true);
          save();
          return true;
        }
      }else if(res.status === 401){
        clearDriveSession();
        state.drive.hasConsent = false;
      }
    }catch(_){}
  }
  if(interactive){
    startBackendAuth();
  }
  return false;
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
  if(payload.timer){
    payload.timer.intervalId = null;
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
    state.settings = Object.assign({ lang:"en-GB", aiEnabled:true, aiEnabledMigrated:false, usePlotSummaries:true }, state.settings || {});
    if(!state.settings.aiEnabledMigrated){
      state.settings.aiEnabled = true;
      state.settings.aiEnabledMigrated = true;
    }
    state.settings.aiEnabled = Boolean(state.settings.aiEnabled);
    state.quotes = Array.isArray(state.quotes) ? state.quotes : [];
    state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "", vaultReveal: {} }, state.ui || {});
    normalizeTimerState();
    if(!state.drive.autoMins || state.drive.autoMins < 1) state.drive.autoMins = 1;
    state.drive.hasConsent = hadConsent || state.drive.hasConsent || Boolean(token);
    normalizeBooks();
    state.drive.lastPullISO = new Date().toISOString();

    ensureDefaultBook();
    applyI18n();
    const appLangSelect = $("appLang");
    if(appLangSelect) appLangSelect.value = state.settings.lang || "en-GB";
    updateAiUI();
    if(state.settings.aiEnabled){
      maybeAutoStartAI(true);
    }
    applyTimerState();
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
  const backend = getBackendUrl();
  const sessionId = getDriveSession();
  state.drive.token = null;
  state.drive.expiresAt = 0;
  state.drive.hasConsent = false;
  setConsentCookie(false);
  save();
  setDriveUI(false);
  if(backend && sessionId){
    fetch(`${backend}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionId}` }
    }).catch(()=>{});
  }
  clearDriveSession();
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
  const hasBackendSession = backendEnabled() && Boolean(getDriveSession());
  if(!state.drive.hasConsent && !hasBackendSession){
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
  if(interactive && backendEnabled()){
    startBackendAuth();
    return;
  }
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
  if(backendEnabled()){
    const ok = await ensureDriveToken(false);
    if(!ok) return false;
    setDriveUI(true);
    setAuthGate(false);
    await drivePull();
    scheduleDriveAuto();
    return true;
  }
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
      state.ui = Object.assign({ quotesBookId: null, quoteAuthorAuto: "", vaultReveal: {} }, state.ui || {});
      state.settings = Object.assign({ lang:"en-GB", aiEnabled:true, aiEnabledMigrated:false, usePlotSummaries:true }, state.settings || {});
      if(!state.settings.aiEnabledMigrated){
        state.settings.aiEnabled = true;
        state.settings.aiEnabledMigrated = true;
      }
      state.settings.aiEnabled = Boolean(state.settings.aiEnabled);
      normalizeTimerState();
      normalizeBooks();
      ensureDefaultBook();
      applyI18n();
      updateAiUI();
      if(state.settings.aiEnabled){
        maybeAutoStartWebLLM(true);
      }
      applyTimerState();
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
  const regenQuest = $("regenQuest");
  if(regenQuest) regenQuest.addEventListener("click", regenerateQuestForActiveBook);
  const plotToggle = $("plotToggle");
  if(plotToggle){
    plotToggle.addEventListener("change", () => {
      state.settings.usePlotSummaries = plotToggle.checked;
      save();
      updateAiUI();
    });
  }
  const matchNone = $("matchNone");
  if(matchNone) matchNone.addEventListener("click", dismissBookMatchPicker);
  const matchOverlay = $("matchOverlay");
  if(matchOverlay){
    matchOverlay.addEventListener("click", (ev) => {
      if(ev.target === matchOverlay) dismissBookMatchPicker();
    });
  }

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
  const aiToggle = $("aiToggle");
  if(aiToggle){
    aiToggle.addEventListener("change", () => {
      state.settings.aiEnabled = Boolean(aiToggle.checked);
      save();
      updateAiUI();
      if(state.settings.aiEnabled){
        maybeAutoStartWebLLM(true);
      }
    });
  }
  const aiClear = $("aiClearModel");
  if(aiClear){
    aiClear.addEventListener("click", () => {
      clearWebLLMCache().then(() => {
        showToast(t("aiClearToast"));
      });
    });
  }
  const aiReload = $("aiReload");
  if(aiReload){
    aiReload.addEventListener("click", () => {
      location.reload();
    });
  }
  if(typeof window !== "undefined"){
    window.addEventListener("online", () => {
      updateAiUI();
      if(state.settings.aiEnabled){
        maybeAutoStartWebLLM(true);
      }
    });
    window.addEventListener("offline", updateAiUI);
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
  const vault = $("vault");
  if(vault){
    vault.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("button[data-vault-action]");
      if(actionBtn && vault.contains(actionBtn)){
        const item = actionBtn.closest(".vault-item");
        if(!item) return;
        const bookId = item.dataset.bookId;
        const book = state.books[bookId];
        if(!book) return;
        const action = actionBtn.dataset.vaultAction;
        if(action === "reveal"){
          if(!state.ui.vaultReveal) state.ui.vaultReveal = {};
          state.ui.vaultReveal[bookId] = !state.ui.vaultReveal[bookId];
          save();
          renderAll();
          return;
        }
        if(action === "delete"){
          ensureQuestDefaults(book);
          book.quest.objects = [];
          book.quest.generatedAt = "";
          book.quest.method = "";
          save();
          renderAll();
          return;
        }
      }
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
if(typeof window !== "undefined"){
  window.BOOKQUEST_TEST_API = {
    state,
    normalizeTimerState,
    applyTimerState,
    updateTimerDisplay,
    formatMMSS
  };
}

if(!IS_TEST){
  captureDriveSessionFromUrl();
  load();
  normalizeTimerState();
  normalizeBooks();
  ensureDefaultBook();
  applyI18n();
  const appLangSelect = $("appLang");
  if(appLangSelect) appLangSelect.value = state.settings.lang || "en-GB";
  updateAiUI();
  if(state.settings.aiEnabled){
    maybeAutoStartWebLLM(true);
  }
  syncDriveConsentFromSession();
  const hasBackendSession = backendEnabled() && Boolean(getDriveSession());
  setDriveUI(Boolean(state.drive.token) || hasBackendSession);
  setAuthGate(false);
  bind();
  applyTimerState();
  scheduleSilentSignIn();
  togglePagesMode();
  renderAll();

  cleanupServiceWorkers();
}
