/* BookQuest — minimal, offline-first, GitHub Pages friendly (en-GB)
   Data:
     - LocalStorage always
     - Optional Google Drive (appDataFolder) if you paste OAuth Client ID
   Optional preset:
     - If you add config.js that sets window.BOOKQUEST_CONFIG.googleClientId,
       we auto-fill it once into state.drive.clientId.
*/

(() => {
  "use strict";

  // -------------------------
  // Storage keys
  // -------------------------
  const LS_STATE = "bookquest_state_v1";
  const LS_TIMER = "bookquest_timer_v1";
  const LS_TAB = "bookquest_tab_v1";
  const LS_SERVER_OFFSET = "bookquest_server_offset_ms_v1";

  // -------------------------
  // Google Drive config (user-provided)
  // -------------------------
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const DRIVE_FILENAME = "bookquest.json";

  // Disable Google API key field for now (not needed for GIS + Drive REST)
  const DISABLE_GOOGLE_API_KEY_FIELD = true;

  // -------------------------
  // DOM helpers
  // -------------------------
  const $ = (id) => document.getElementById(id);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.remove("show"), 2600);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function fmtMinutes(m) {
    const mm = Math.round(m);
    if (!Number.isFinite(mm) || mm < 0) return "—";
    if (mm < 60) return `${mm} min`;
    const h = Math.floor(mm / 60);
    const r = mm % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  }

  function fmtDateTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return iso;
    }
  }

  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return iso;
    }
  }

  function daysAgoISO(days, nowMs) {
    const d = new Date(nowMs - days * 86400000);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  // -------------------------
  // Server time (best-effort)
  // -------------------------
  function loadServerOffset() {
    const v = Number(localStorage.getItem(LS_SERVER_OFFSET));
    return Number.isFinite(v) ? v : 0;
  }

  function saveServerOffset(ms) {
    localStorage.setItem(LS_SERVER_OFFSET, String(Math.round(ms)));
  }

  let serverOffsetMs = loadServerOffset();

  function nowMs() {
    return Date.now() + serverOffsetMs;
  }

  function nowISO() {
    return new Date(nowMs()).toISOString();
  }

  async function syncServerTimeOnce() {
    // worldtimeapi is simple and usually works from GitHub Pages.
    // If it fails, we just keep local time.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch("https://worldtimeapi.org/api/ip", { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("time fetch failed");
      const js = await res.json();
      const serverUnix = js.unixtime ? js.unixtime * 1000 : Date.parse(js.datetime);
      if (!Number.isFinite(serverUnix)) throw new Error("bad server time");
      const off = serverUnix - Date.now();
      serverOffsetMs = off;
      saveServerOffset(off);
    } catch {
      // ignore
    } finally {
      clearTimeout(t);
    }
  }

  // -------------------------
  // Default state
  // -------------------------
  function defaultState() {
    const b0 = {
      id: uuid(),
      title: "Untitled book",
      author: "",
      publisher: "",
      edition: "",
      totalPages: 0,
      currentPage: 0,
      coverDataUrl: "",
      createdAt: nowISO(),
      finishedAt: ""
    };
    return {
      version: 1,
      createdAt: nowISO(),
      settings: {
        rangeDays: 30,
        storyScope: "book",
        driveAutoMins: 5
      },
      books: [b0],
      activeBookId: b0.id,
      sessions: [],
      quotes: [],
      gamification: {
        xp: 0,
        level: 1,
        achievements: {}, // key -> {unlockedAt}
        dailyQuest: { date: "", targetMins: 8, targetPages: 6, doneMins: 0, donePages: 0 },
        streak: { days: 0, lastReadDate: "" }
      },
      drive: {
        fileId: "",
        lastSavedAt: "",
        lastPulledAt: "",
        clientId: "",
        apiKey: "" // disabled for now
      }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_STATE);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      if (!s || typeof s !== "object") return defaultState();
      // basic migrations
      if (!s.version) s.version = 1;
      if (!s.settings) s.settings = { rangeDays: 30, storyScope: "book", driveAutoMins: 5 };
      if (!Array.isArray(s.books) || s.books.length === 0) s.books = defaultState().books;
      if (!s.activeBookId) s.activeBookId = s.books[0].id;
      if (!Array.isArray(s.sessions)) s.sessions = [];
      if (!Array.isArray(s.quotes)) s.quotes = [];
      if (!s.gamification) s.gamification = defaultState().gamification;
      if (!s.drive) s.drive = defaultState().drive;

      // Disable API key option for now (clear any stored value)
      if (DISABLE_GOOGLE_API_KEY_FIELD && s.drive && s.drive.apiKey) s.drive.apiKey = "";

      return s;
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    dirty = true;
  }

  // -------------------------
  // Timer persistence
  // -------------------------
  function defaultTimer() {
    return {
      running: false,
      startedAtMs: 0,
      elapsedMs: 0,
      mode: "sprint",
      sprintMins: 8,
      pagesMode: "range", // range|count
      fromPage: "",
      toPage: "",
      pagesRead: "",
      sessionBookId: ""
    };
  }

  function loadTimer() {
    try {
      const raw = localStorage.getItem(LS_TIMER);
      if (!raw) return defaultTimer();
      const t = JSON.parse(raw);
      return { ...defaultTimer(), ...t };
    } catch {
      return defaultTimer();
    }
  }

  function saveTimer() {
    localStorage.setItem(LS_TIMER, JSON.stringify(timer));
  }

  // -------------------------
  // Charts (canvas)
  // -------------------------
  function drawBarChart(canvas, labels, values, title) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, W, H);

    // padding
    const top = 26;
    const left = 48;
    const right = 20;
    const bottom = 44;

    // title
    ctx.fillStyle = "rgba(242,243,244,0.9)";
    ctx.font = "700 16px system-ui, -apple-system, Segoe UI";
    ctx.fillText(title, left, 20);

    const maxV = Math.max(1, ...values);
    const innerW = W - left - right;
    const innerH = H - top - bottom;

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + innerH);
    ctx.lineTo(left + innerW, top + innerH);
    ctx.stroke();

    // bars
    const n = values.length;
    if (n === 0) return;

    const gap = 6;
    const bw = Math.max(6, Math.floor((innerW - gap * (n - 1)) / n));
    const startX = left;

    for (let i = 0; i < n; i++) {
      const v = values[i];
      const h = Math.round((v / maxV) * innerH);
      const x = startX + i * (bw + gap);
      const y = top + innerH - h;

      ctx.fillStyle = "rgba(242,243,244,0.65)";
      ctx.fillRect(x, y, bw, h);

      // labels (sparse)
      if (n <= 14 || i === 0 || i === n - 1 || i % 7 === 0) {
        ctx.fillStyle = "rgba(169,172,181,0.9)";
        ctx.font = "12px system-ui, -apple-system, Segoe UI";
        const txt = labels[i];
        ctx.save();
        ctx.translate(x + bw / 2, top + innerH + 18);
        ctx.rotate(-0.55);
        ctx.textAlign = "right";
        ctx.fillText(txt, 0, 0);
        ctx.restore();
      }
    }

    // y ticks
    ctx.fillStyle = "rgba(169,172,181,0.9)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI";
    ctx.textAlign = "right";
    ctx.fillText(String(maxV), left - 8, top + 4);
    ctx.fillText("0", left - 8, top + innerH);
  }

  function downloadCanvasPNG(canvas, filename) {
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  // -------------------------
  // Story PNG
  // -------------------------
  async function drawStoryPNG(scope) {
    const canvas = $("storyCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // bg
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b0c0e");
    g.addColorStop(1, "#060607");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const pad = 74;
    const leftW = 640;
    const rightX = 720;

    // header
    ctx.fillStyle = "rgba(242,243,244,0.95)";
    ctx.font = "800 64px system-ui, -apple-system, Segoe UI";
    ctx.fillText("BookQuest", pad, 90);

    const rangeTxt = rangeLabel(state.settings.rangeDays);
    ctx.fillStyle = "rgba(169,172,181,0.95)";
    ctx.font = "500 28px system-ui, -apple-system, Segoe UI";
    ctx.fillText(rangeTxt, pad, 134);

    // card helper
    function card(x, y, w, h, title, value) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundRect(ctx, x, y, w, h, 26);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, w, h, 26);
      ctx.stroke();

      ctx.fillStyle = "rgba(169,172,181,0.95)";
      ctx.font = "600 26px system-ui, -apple-system, Segoe UI";
      ctx.fillText(title, x + 26, y + 46);

      ctx.fillStyle = "rgba(242,243,244,0.95)";
      ctx.font = "800 42px system-ui, -apple-system, Segoe UI";
      wrapText(ctx, value, x + 26, y + 98, w - 52, 50);
    }

    const stats = computeStats(state.settings.rangeDays);

    // cover + title (scope book)
    if (scope === "book") {
      const b = getActiveBook();
      ctx.fillStyle = "rgba(242,243,244,0.95)";
      ctx.font = "800 44px system-ui, -apple-system, Segoe UI";
      wrapText(ctx, b.title || "Untitled", pad, 200, leftW, 52);

      ctx.fillStyle = "rgba(169,172,181,0.95)";
      ctx.font = "500 28px system-ui, -apple-system, Segoe UI";
      const byline = [b.author, b.publisher, b.edition].filter(Boolean).join(" • ");
      if (byline) wrapText(ctx, byline, pad, 260, leftW, 36);

      if (b.coverDataUrl) {
        const img = await loadImage(b.coverDataUrl);
        const cw = 320;
        const ch = 460;
        ctx.save();
        roundRect(ctx, rightX, 200, cw, ch, 32);
        ctx.clip();
        ctx.drawImage(img, rightX, 200, cw, ch);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        roundRect(ctx, rightX, 200, cw, ch, 32);
        ctx.stroke();
      } else {
        // placeholder
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        roundRect(ctx, rightX, 200, 320, 460, 32);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 2;
        roundRect(ctx, rightX, 200, 320, 460, 32);
        ctx.stroke();
      }

      card(pad, 340, 320, 150, "Progress", `${stats.book.progressPct}%`);
      card(pad + 340, 340, 320, 150, "Remaining", `${stats.book.remainingPages} pages`);
      card(pad, 510, 320, 150, "Pace", stats.book.paceTxt);
      card(pad + 340, 510, 320, 150, "ETA", stats.book.etaTxt);
    } else {
      ctx.fillStyle = "rgba(242,243,244,0.95)";
      ctx.font = "800 44px system-ui, -apple-system, Segoe UI";
      ctx.fillText("Overall", pad, 220);

      card(pad, 260, 320, 150, "Books", `${stats.overall.books}`);
      card(pad + 340, 260, 320, 150, "Finished", `${stats.overall.finished}`);
      card(pad, 430, 320, 150, "Pages", `${stats.overall.pages}`);
      card(pad + 340, 430, 320, 150, "Minutes", `${stats.overall.minutes}`);
      card(pad, 600, 660, 150, "Streak", `${stats.streakDays} days`);
    }

    // footer
    ctx.fillStyle = "rgba(169,172,181,0.95)";
    ctx.font = "500 24px system-ui, -apple-system, Segoe UI";
    const stamp = new Date(nowMs()).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    ctx.fillText(stamp, pad, H - 60);

    // preview
    const url = canvas.toDataURL("image/png");
    $("storyPreview").src = url;
    $("storyPreview").classList.add("show");
    $("downloadStory").disabled = false;
    storyLastUrl = url;
    $("storyHint").textContent = "Ready.";
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let yy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      const w = ctx.measureText(test).width;
      if (w > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // -------------------------
  // Quote PNG
  // -------------------------
  async function drawQuotePNG(quote) {
    const canvas = $("quoteCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // bg
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b0c0e");
    g.addColorStop(1, "#060607");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const pad = 86;
    const b = getActiveBook();

    // header
    ctx.fillStyle = "rgba(242,243,244,0.95)";
    ctx.font = "800 56px system-ui, -apple-system, Segoe UI";
    ctx.fillText("BookQuest", pad, 100);

    // book cover small
    if (b.coverDataUrl) {
      try {
        const img = await loadImage(b.coverDataUrl);
        ctx.save();
        roundRect(ctx, W - pad - 220, 70, 220, 320, 28);
        ctx.clip();
        ctx.drawImage(img, W - pad - 220, 70, 220, 320);
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 2;
        roundRect(ctx, W - pad - 220, 70, 220, 320, 28);
        ctx.stroke();
      } catch {}
    }

    // quote card
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, pad, 240, W - pad * 2, 1280, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    roundRect(ctx, pad, 240, W - pad * 2, 1280, 32);
    ctx.stroke();

    // quote text
    ctx.fillStyle = "rgba(242,243,244,0.95)";
    ctx.font = "600 44px system-ui, -apple-system, Segoe UI";
    const qt = `“${(quote.text || "").trim()}”`;
    wrapText(ctx, qt, pad + 52, 340, W - pad * 2 - 104, 62);

    // author + page
    ctx.fillStyle = "rgba(169,172,181,0.95)";
    ctx.font = "600 30px system-ui, -apple-system, Segoe UI";
    const metaParts = [];
    if (quote.quoteAuthor) metaParts.push(quote.quoteAuthor);
    if (quote.page) metaParts.push(`p. ${quote.page}`);
    const meta = metaParts.join(" • ");
    if (meta) ctx.fillText(meta, pad + 52, 1480);

    // footer book
    ctx.fillStyle = "rgba(169,172,181,0.95)";
    ctx.font = "500 26px system-ui, -apple-system, Segoe UI";
    wrapText(ctx, b.title || "Untitled", pad, H - 86, W - pad * 2, 34);

    const url = canvas.toDataURL("image/png");
    $("quotePreview").src = url;
    $("quotePreview").classList.add("show");
    quoteLastUrl = url;
    $("downloadQuote").disabled = false;
    $("previewQuote").disabled = false;
    return url;
  }

  // -------------------------
  // Stats computations
  // -------------------------
  function rangeLabel(days) {
    if (days === 7) return "Last 7 days";
    if (days === 30) return "Last 30 days";
    if (days === 90) return "Last 3 months";
    if (days === 180) return "Last 6 months";
    if (days === 365) return "Last year";
    return "All time";
  }

  function getActiveBook() {
    return state.books.find((b) => b.id === state.activeBookId) || state.books[0];
  }

  function sessionsInRange(days) {
    const startIso = days >= 99999 ? "1970-01-01T00:00:00.000Z" : daysAgoISO(days, nowMs());
    return state.sessions.filter((s) => s.endedAt >= startIso);
  }

  function computePaceGlobal() {
    const mins = state.sessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
    const pages = state.sessions.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    if (mins <= 0 || pages <= 0) return { pagesPerMin: 1, minsPerPage: 1 };
    return { pagesPerMin: pages / mins, minsPerPage: mins / pages };
  }

  function computeBookPace(bookId) {
    const ss = state.sessions.filter((s) => s.bookId === bookId);
    const mins = ss.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
    const pages = ss.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    if (mins <= 0 || pages <= 0) return null;
    return { pagesPerMin: pages / mins, minsPerPage: mins / pages };
  }

  function computeStats(days) {
    const b = getActiveBook();
    const inRange = sessionsInRange(days);

    // overall
    const overallPages = inRange.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    const overallMins = inRange.reduce((a, s) => a + (Number(s.minutes) || 0), 0);

    // book
    const bookSessions = inRange.filter((s) => s.bookId === b.id);
    const bookPages = bookSessions.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    const bookMins = bookSessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);

    const total = Number(b.totalPages) || 0;
    const curr = Number(b.currentPage) || 0;
    const remaining = Math.max(0, total > 0 ? total - curr : 0);
    const progressPct = total > 0 ? Math.round((curr / total) * 100) : 0;

    const pace = computeBookPace(b.id) || computePaceGlobal();
    const paceTxt = pace ? `${pace.pagesPerMin.toFixed(2)} pages/min` : "—";
    const etaMins = pace && pace.pagesPerMin > 0 ? Math.round(remaining / pace.pagesPerMin) : 0;
    const etaTxt = total > 0 && pace ? fmtMinutes(etaMins) : "—";

    // streak
    const streakDays = state.gamification?.streak?.days || 0;

    return {
      overall: {
        books: state.books.length,
        finished: state.books.filter((x) => x.finishedAt).length,
        pages: overallPages,
        minutes: overallMins
      },
      book: {
        pages: bookPages,
        minutes: bookMins,
        remainingPages: remaining,
        progressPct,
        paceTxt,
        etaTxt
      },
      streakDays
    };
  }

  function groupByDay(sessions, days) {
    // returns labels & values for last N days (inclusive)
    const end = new Date(nowMs());
    end.setHours(0, 0, 0, 0);

    const N = days >= 99999 ? 30 : days; // for all-time charts, show last 30 days
    const labels = [];
    const keys = [];
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      keys.push(key);
      labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
    }
    const map = new Map(keys.map((k) => [k, 0]));
    for (const s of sessions) {
      const k = String(s.endedAt).slice(0, 10);
      if (map.has(k)) map.set(k, map.get(k) + (s._val || 0));
    }
    const values = keys.map((k) => map.get(k) || 0);
    return { labels, values };
  }

  // -------------------------
  // Gamification (XP, level, daily quest, achievements)
  // -------------------------
  const ACH = [
    { key: "FIRST_SESSION", icon: "🎮", name: "First session", desc: "Log your first reading session." },
    { key: "MIN_60", icon: "⏱️", name: "One hour", desc: "Read for 60 minutes total." },
    { key: "MIN_300", icon: "🧠", name: "Five hours", desc: "Read for 300 minutes total." },
    { key: "PAGES_100", icon: "📄", name: "100 pages", desc: "Read 100 pages total." },
    { key: "PAGES_500", icon: "📚", name: "500 pages", desc: "Read 500 pages total." },
    { key: "STREAK_7", icon: "🔥", name: "7-day streak", desc: "Read at least a little for 7 days in a row." },
    { key: "FINISH_1", icon: "🏁", name: "Finish a book", desc: "Finish one book." },
    { key: "QUOTES_10", icon: "💬", name: "Quote keeper", desc: "Save 10 quotes." }
  ];

  function ensureDailyQuest() {
    const dq = state.gamification.dailyQuest;
    const today = new Date(nowMs());
    today.setHours(0, 0, 0, 0);
    const dkey = today.toISOString().slice(0, 10);
    if (dq.date !== dkey) {
      // adapt target based on user's median session length and pace
      const minsList = state.sessions
        .map((s) => Number(s.minutes) || 0)
        .filter((x) => x > 0)
        .sort((a, b) => a - b);
      const med = minsList.length ? minsList[Math.floor(minsList.length / 2)] : 8;
      const targetMins = clamp(Math.round(med), 6, 25);

      const pace = computePaceGlobal();
      const targetPages = clamp(Math.round(targetMins * pace.pagesPerMin), 3, 35);

      state.gamification.dailyQuest = { date: dkey, targetMins, targetPages, doneMins: 0, donePages: 0 };
      saveState();
    }
  }

  function addXP(pages, minutes) {
    const p = Math.max(0, Number(pages) || 0);
    const m = Math.max(0, Number(minutes) || 0);

    // balanced: pages and minutes both matter, gentle curve
    const xp = Math.round(p * 3 + Math.sqrt(m) * 8);
    state.gamification.xp += xp;

    // daily quest progress (today only)
    ensureDailyQuest();
    state.gamification.dailyQuest.doneMins += m;
    state.gamification.dailyQuest.donePages += p;

    // level up: 120 * level
    while (state.gamification.xp >= state.gamification.level * 120) {
      state.gamification.xp -= state.gamification.level * 120;
      state.gamification.level += 1;
      toast(`Level up! Level ${state.gamification.level}`);
    }
  }

  function updateStreakOnSession(endedAtIso) {
    const dayKey = String(endedAtIso).slice(0, 10);
    const streak = state.gamification.streak;
    if (!streak.lastReadDate) {
      streak.days = 1;
      streak.lastReadDate = dayKey;
      return;
    }
    if (streak.lastReadDate === dayKey) return;

    // compare days difference
    const last = new Date(streak.lastReadDate + "T00:00:00Z").getTime();
    const cur = new Date(dayKey + "T00:00:00Z").getTime();
    const diffDays = Math.round((cur - last) / 86400000);

    if (diffDays === 1) streak.days += 1;
    else if (diffDays > 1) streak.days = 1;
    streak.lastReadDate = dayKey;
  }

  function unlock(key) {
    if (state.gamification.achievements[key]) return;
    state.gamification.achievements[key] = { unlockedAt: nowISO() };
    toast(`Achievement unlocked: ${key}`);
  }

  function evaluateAchievements() {
    const totalMins = state.sessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
    const totalPages = state.sessions.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    const finished = state.books.filter((b) => b.finishedAt).length;
    const quotesN = state.quotes.length;
    const streakDays = state.gamification.streak.days || 0;

    if (state.sessions.length >= 1) unlock("FIRST_SESSION");
    if (totalMins >= 60) unlock("MIN_60");
    if (totalMins >= 300) unlock("MIN_300");
    if (totalPages >= 100) unlock("PAGES_100");
    if (totalPages >= 500) unlock("PAGES_500");
    if (streakDays >= 7) unlock("STREAK_7");
    if (finished >= 1) unlock("FINISH_1");
    if (quotesN >= 10) unlock("QUOTES_10");
  }

  // -------------------------
  // Sessions / books logic
  // -------------------------
  function normaliseInt(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.floor(n));
  }

  function recalcBooksFromSessions() {
    // recompute currentPage per book = max(toPage)
    const byBook = new Map(state.books.map((b) => [b.id, 0]));
    for (const s of state.sessions) {
      const tp = Number(s.toPage) || 0;
      if (byBook.has(s.bookId)) byBook.set(s.bookId, Math.max(byBook.get(s.bookId), tp));
    }
    for (const b of state.books) {
      const maxTp = byBook.get(b.id) || 0;
      b.currentPage = Math.max(0, maxTp, Number(b.currentPage) || 0);
      if ((Number(b.totalPages) || 0) > 0 && b.currentPage >= b.totalPages && !b.finishedAt) {
        b.finishedAt = nowISO();
      }
      if ((Number(b.totalPages) || 0) > 0 && b.currentPage < b.totalPages && b.finishedAt) {
        // if sessions edited back under total pages
        b.finishedAt = "";
      }
    }
  }

  function addSession({ bookId, startedAt, endedAt, minutes, fromPage, toPage, pages, mode }) {
    const sess = {
      id: uuid(),
      bookId,
      startedAt,
      endedAt,
      minutes,
      fromPage,
      toPage,
      pages,
      mode
    };
    state.sessions.push(sess);
    // keep only last 2000 sessions
    if (state.sessions.length > 2000) state.sessions = state.sessions.slice(-2000);

    // book progress
    const b = state.books.find((x) => x.id === bookId);
    if (b) {
      b.currentPage = Math.max(Number(b.currentPage) || 0, Number(toPage) || 0);
      if ((Number(b.totalPages) || 0) > 0 && b.currentPage >= b.totalPages) {
        b.finishedAt = b.finishedAt || endedAt;
      }
    }

    // gamification
    addXP(pages, minutes);
    updateStreakOnSession(endedAt);
    evaluateAchievements();

    saveState();
  }

  function editSession(sessionId, patch) {
    const idx = state.sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return;
    state.sessions[idx] = { ...state.sessions[idx], ...patch };
    recalcBooksFromSessions();
    // recompute XP and quest in simplest way: reset xp + level then reapply
    recomputeGamificationFromScratch();
    saveState();
  }

  function deleteSession(sessionId) {
    state.sessions = state.sessions.filter((s) => s.id !== sessionId);
    recalcBooksFromSessions();
    recomputeGamificationFromScratch();
    saveState();
  }

  function recomputeGamificationFromScratch() {
    // keep achievements unlocked timestamps (but allow re-evaluation)
    const oldAch = state.gamification.achievements || {};
    state.gamification.xp = 0;
    state.gamification.level = 1;
    state.gamification.streak = { days: 0, lastReadDate: "" };
    state.gamification.dailyQuest = { date: "", targetMins: 8, targetPages: 6, doneMins: 0, donePages: 0 };

    // rebuild streak from sessions (sorted by endedAt)
    const sorted = [...state.sessions].sort((a, b) => String(a.endedAt).localeCompare(String(b.endedAt)));
    for (const s of sorted) {
      addXP(Number(s.pages) || 0, Number(s.minutes) || 0);
      updateStreakOnSession(s.endedAt);
    }

    // restore unlocked achievements and re-evaluate
    state.gamification.achievements = oldAch;
    evaluateAchievements();
  }

  // -------------------------
  // Google Drive (token + REST)
  // -------------------------
  let tokenClient = null;
  let accessToken = "";
  let autosaveTimer = null;

  function driveConfigured() {
    const cid = (state.drive.clientId || "").trim();
    return cid.length > 10;
  }

  function setDriveStatus(txt) {
    const el = $("driveStatus");
    if (el) el.textContent = txt;
  }

  async function ensureDriveToken(interactive = true) {
    if (!driveConfigured()) {
      setDriveStatus("Client ID missing");
      throw new Error("Missing Google OAuth Client ID");
    }

    // Load GIS client (global google.accounts.oauth2)
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      throw new Error("Google Identity Services not loaded yet");
    }

    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: state.drive.clientId,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (resp && resp.access_token) {
            accessToken = resp.access_token;
            setDriveStatus("Signed in");
            toast("Signed in");
          }
        }
      });
    }

    return new Promise((resolve, reject) => {
      tokenClient.callback = (resp) => {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          setDriveStatus("Signed in");
          resolve(accessToken);
        } else {
          reject(new Error("No access token"));
        }
      };
      try {
        tokenClient.requestAccessToken({ prompt: interactive ? "consent" : "" });
      } catch (e) {
        reject(e);
      }
    });
  }

  async function driveSearchFile() {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("spaces", "appDataFolder");
    url.searchParams.set("fields", "files(id,name,modifiedTime)");
    url.searchParams.set("q", `name='${DRIVE_FILENAME}' and 'appDataFolder' in parents`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error("Drive search failed");
    const js = await res.json();
    const f = (js.files || [])[0];
    return f ? f.id : "";
  }

  async function driveCreateFile() {
    const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: DRIVE_FILENAME, parents: ["appDataFolder"] })
    });
    if (!res.ok) throw new Error("Drive create failed");
    const js = await res.json();
    return js.id || "";
  }

  async function driveUpload(fileId, jsonText) {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: jsonText
    });
    if (!res.ok) throw new Error("Drive upload failed");
  }

  async function driveDownload(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error("Drive download failed");
    return await res.text();
  }

  async function drivePush() {
    await ensureDriveToken(true);
    let fileId = state.drive.fileId || "";
    if (!fileId) {
      fileId = await driveSearchFile();
      if (!fileId) fileId = await driveCreateFile();
      state.drive.fileId = fileId;
      saveState();
    }
    await driveUpload(fileId, JSON.stringify(state));
    state.drive.lastSavedAt = nowISO();
    saveState();
    toast(`Saved to Drive (${fmtDateTime(state.drive.lastSavedAt)})`);
  }

  function normaliseStateInPlace() {
    if (!state.version) state.version = 1;
    if (!state.settings) state.settings = { rangeDays: 30, storyScope: "book", driveAutoMins: 5 };
    if (!Array.isArray(state.books) || state.books.length === 0) state.books = defaultState().books;
    if (!state.activeBookId) state.activeBookId = state.books[0].id;
    if (!Array.isArray(state.sessions)) state.sessions = [];
    if (!Array.isArray(state.quotes)) state.quotes = [];
    if (!state.gamification) state.gamification = defaultState().gamification;
    if (!state.drive) state.drive = defaultState().drive;

    // Disable API key option for now (clear any stored value)
    if (DISABLE_GOOGLE_API_KEY_FIELD && state.drive && state.drive.apiKey) state.drive.apiKey = "";
  }

  async function drivePullApply() {
    await ensureDriveToken(true);
    let fileId = state.drive.fileId || "";
    if (!fileId) fileId = await driveSearchFile();
    if (!fileId) throw new Error("No BookQuest file found in appDataFolder");
    const txt = await driveDownload(fileId);
    const incoming = JSON.parse(txt);
    if (!incoming || typeof incoming !== "object") throw new Error("Invalid Drive JSON");
    state = incoming;
    normaliseStateInPlace();
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    timer = loadTimer();
    toast("Pulled from Drive");
    state.drive.lastPulledAt = nowISO();
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    renderAll();
  }

  function setupDriveAutosave() {
    if (autosaveTimer) window.clearInterval(autosaveTimer);
    autosaveTimer = null;

    const mins = Number(state.settings.driveAutoMins) || 0;
    if (mins <= 0) return;

    autosaveTimer = window.setInterval(async () => {
      if (!dirty) return;
      if (!driveConfigured()) return;
      if (!accessToken) return;
      try {
        await drivePush();
        dirty = false;
      } catch {
        // ignore autosave errors
      }
    }, mins * 60 * 1000);
  }

  // -------------------------
  // UI rendering
  // -------------------------
  function renderActiveBookCard() {
    const b = getActiveBook();
    const total = Number(b.totalPages) || 0;
    const curr = Number(b.currentPage) || 0;
    const remaining = total > 0 ? Math.max(0, total - curr) : 0;
    const pct = total > 0 ? Math.round((curr / total) * 100) : 0;

    const pace = computeBookPace(b.id) || computePaceGlobal();
    const etaMins = total > 0 && pace && pace.pagesPerMin > 0 ? Math.round(remaining / pace.pagesPerMin) : 0;

    const html = `
      <img class="cover" src="${b.coverDataUrl || ""}" alt="" style="${b.coverDataUrl ? "" : "display:none"}" />
      <div>
        <div class="itemTitle">${escapeHtml(b.title || "Untitled")}</div>
        <div class="itemMeta">${escapeHtml([b.author, b.publisher, b.edition].filter(Boolean).join(" • "))}</div>
        <div class="itemMeta" style="margin-top:8px">${total ? `${curr}/${total} (${pct}%)` : `${curr} pages logged`}</div>
        <div class="itemMeta">${total ? `${remaining} pages remaining` : "Add total pages for remaining/ETA"}</div>
        <div class="itemMeta">${total ? `ETA: ${pace ? fmtMinutes(etaMins) : "—"}` : ""}</div>
      </div>
    `;
    $("activeBookCard").innerHTML = html;

    // session stats widgets
    $("progress").textContent = total ? `${curr}/${total} (${pct}%)` : `${curr} pages`;
    $("pace").textContent = pace ? `${pace.pagesPerMin.toFixed(2)} pages/min` : "—";
    $("eta").textContent = total && pace ? fmtMinutes(etaMins) : "—";

    const inRange = sessionsInRange(state.settings.rangeDays).filter((s) => s.bookId === b.id);
    $("sessionsN").textContent = String(inRange.length);
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  }

  function renderDashboardStats() {
    ensureDailyQuest();
    const dq = state.gamification.dailyQuest;
    const dqDone = dq.doneMins >= dq.targetMins || dq.donePages >= dq.targetPages;
    $("dailyQuest").textContent = dqDone ? `Complete ✓ (${Math.round(dq.doneMins)}m, ${Math.round(dq.donePages)}p)` : `${dq.targetMins}m / ${dq.targetPages}p (today)`;

    $("level").textContent = `Level ${state.gamification.level}`;
    $("xp").textContent = `${state.gamification.xp}/${state.gamification.level * 120}`;
    $("streak").textContent = `${state.gamification.streak.days || 0} days`;

    const stats = computeStats(state.settings.rangeDays);
    $("booksCount").textContent = String(stats.overall.books);
    $("booksDone").textContent = String(stats.overall.finished);
    $("pagesRange").textContent = String(stats.overall.pages);
    $("minsRange").textContent = String(stats.overall.minutes);
  }

  function renderBooksSelect() {
    const sel = $("bookSelect");
    sel.innerHTML = "";
    for (const b of state.books) {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.finishedAt ? `✓ ${b.title}` : b.title;
      if (b.id === state.activeBookId) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function renderBookEditForm() {
    const b = getActiveBook();
    $("editTitle").value = b.title || "";
    $("editAuthor").value = b.author || "";
    $("editPublisher").value = b.publisher || "";
    $("editEdition").value = b.edition || "";
    $("editTotal").value = String(Number(b.totalPages) || 0);
    $("editCurrent").value = String(Number(b.currentPage) || 0);
  }

  function renderAchievements() {
    const unlocked = state.gamification.achievements || {};
    const unlockedKeys = Object.keys(unlocked);
    $("achUnlocked").textContent = `${unlockedKeys.length}/${ACH.length}`;

    const unlockedList = $("achUnlockedList");
    unlockedList.innerHTML = "";
    const unlockedItems = ACH.filter((a) => unlocked[a.key]).sort((a, b) =>
      String(unlocked[a.key].unlockedAt).localeCompare(String(unlocked[b.key].unlockedAt))
    );
    for (const a of unlockedItems) {
      const when = unlocked[a.key].unlockedAt;
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTitle">${a.icon} ${a.name}</div>
        <div class="itemMeta">${escapeHtml(a.desc)}</div>
        <div class="itemMeta">${fmtDateTime(when)}</div>
      `;
      unlockedList.appendChild(div);
    }
    if (unlockedItems.length === 0) {
      unlockedList.innerHTML = `<div class="item"><div class="itemMeta">No achievements yet. Your first session unlocks one.</div></div>`;
    }

    // next up
    const nextList = $("achNextList");
    nextList.innerHTML = "";
    const locked = ACH.filter((a) => !unlocked[a.key]);
    if (locked.length === 0) {
      $("achNext").textContent = "All achievements unlocked.";
      return;
    }
    $("achNext").textContent = "Closest achievements:";

    const progress = computeAchievementProgress();
    const scored = locked
      .map((a) => ({ a, p: progress[a.key] ?? 0 }))
      .sort((x, y) => y.p - x.p)
      .slice(0, 4);
    for (const x of scored) {
      const div = document.createElement("div");
      div.className = "item";
      const pct = Math.round(x.p * 100);
      div.innerHTML = `
        <div class="itemTitle">${x.a.icon} ${x.a.name} <span class="small">(${pct}%)</span></div>
        <div class="itemMeta">${escapeHtml(x.a.desc)}</div>
      `;
      nextList.appendChild(div);
    }
  }

  function computeAchievementProgress() {
    const totalMins = state.sessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0);
    const totalPages = state.sessions.reduce((a, s) => a + (Number(s.pages) || 0), 0);
    const finished = state.books.filter((b) => b.finishedAt).length;
    const quotesN = state.quotes.length;
    const streakDays = state.gamification.streak.days || 0;

    const p = {};
    p.FIRST_SESSION = state.sessions.length ? 1 : 0;
    p.MIN_60 = clamp(totalMins / 60, 0, 1);
    p.MIN_300 = clamp(totalMins / 300, 0, 1);
    p.PAGES_100 = clamp(totalPages / 100, 0, 1);
    p.PAGES_500 = clamp(totalPages / 500, 0, 1);
    p.STREAK_7 = clamp(streakDays / 7, 0, 1);
    p.FINISH_1 = clamp(finished / 1, 0, 1);
    p.QUOTES_10 = clamp(quotesN / 10, 0, 1);
    return p;
  }

  function renderQuotes() {
    const b = getActiveBook();
    const list = $("quotesList");
    list.innerHTML = "";
    const qs = state.quotes.filter((q) => q.bookId === b.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    for (const q of qs) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTitle">💬 ${escapeHtml((q.text || "").slice(0, 60))}${(q.text || "").length > 60 ? "…" : ""}</div>
        <div class="itemMeta">${escapeHtml([q.quoteAuthor, q.page ? "p. " + q.page : ""].filter(Boolean).join(" • "))}</div>
        <div class="itemMeta">${fmtDateTime(q.createdAt)}</div>
        <div class="itemActions">
          <button class="btn" data-quote-export="${q.id}" type="button">Export PNG</button>
          <button class="btn danger" data-quote-del="${q.id}" type="button">Delete</button>
        </div>
      `;
      list.appendChild(div);
    }
    if (qs.length === 0) {
      list.innerHTML = `<div class="item"><div class="itemMeta">No quotes saved for this book yet.</div></div>`;
    }
  }

  function renderHistory() {
    const list = $("history");
    list.innerHTML = "";
    const items = [...state.sessions].sort((a, b) => String(b.endedAt).localeCompare(String(a.endedAt))).slice(0, 50);
    for (const s of items) {
      const b = state.books.find((x) => x.id === s.bookId);
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTitle">${escapeHtml(b ? b.title : "Unknown")} — ${s.pages} pages</div>
        <div class="itemMeta">${fmtDateTime(s.endedAt)} • ${fmtMinutes(s.minutes)} • p.${s.fromPage}-${s.toPage}</div>
        <div class="itemActions">
          <button class="btn" data-edit-session="${s.id}" type="button">Edit</button>
          <button class="btn danger" data-del-session="${s.id}" type="button">Delete</button>
        </div>
      `;
      list.appendChild(div);
    }
    if (items.length === 0) {
      list.innerHTML = `<div class="item"><div class="itemMeta">No sessions logged yet.</div></div>`;
    }
  }

  function renderCharts() {
    const days = state.settings.rangeDays;
    const startIso = days >= 99999 ? "1970-01-01T00:00:00.000Z" : daysAgoISO(days, nowMs());
    const inRange = state.sessions.filter((s) => s.endedAt >= startIso);

    const b = getActiveBook();
    const bookSessions = inRange.filter((s) => s.bookId === b.id);

    // pages per day
    const bookPagesByDay = bookSessions.map((s) => ({ ...s, _val: Number(s.pages) || 0 }));
    const overallPagesByDay = inRange.map((s) => ({ ...s, _val: Number(s.pages) || 0 }));
    const bookMinsByDay = bookSessions.map((s) => ({ ...s, _val: Number(s.minutes) || 0 }));
    const overallMinsByDay = inRange.map((s) => ({ ...s, _val: Number(s.minutes) || 0 }));

    const N = days >= 99999 ? 30 : days;
    const bp = groupByDay(bookPagesByDay, N);
    const ap = groupByDay(overallPagesByDay, N);
    const bm = groupByDay(bookMinsByDay, N);
    const am = groupByDay(overallMinsByDay, N);

    drawBarChart($("chartPages"), bp.labels, bp.values, "Pages/day");
    drawBarChart($("chartAllPages"), ap.labels, ap.values, "Pages/day");
    drawBarChart($("chartMins"), bm.labels, bm.values, "Minutes/day");
    drawBarChart($("chartAllMins"), am.labels, am.values, "Minutes/day");
  }

  function renderDrive() {
    $("driveAuto").value = String(state.settings.driveAutoMins || 0);
    $("googleClientId").value = state.drive.clientId || "";

    // API key field disabled for now
    const apiEl = $("googleApiKey");
    if (apiEl) {
      apiEl.value = "";
      apiEl.disabled = true;
      apiEl.placeholder = "Disabled";
      if (DISABLE_GOOGLE_API_KEY_FIELD) {
        // hide the field wrapper if possible
        const wrap = apiEl.closest(".field") || apiEl.parentElement;
        if (wrap) wrap.style.display = "none";
        else apiEl.style.display = "none";
      }
    }

    if (!driveConfigured()) {
      setDriveStatus("Client ID missing");
      $("driveHint").textContent = "Paste your OAuth Client ID above, then Sign in.";
    } else {
      $("driveHint").textContent = "Sign in once, then you can save/pull. Auto-save uses the hidden appDataFolder.";
      setDriveStatus(accessToken ? "Signed in" : "Ready");
    }
  }

  function renderAll() {
    renderBooksSelect();
    renderBookEditForm();
    renderActiveBookCard();
    renderDashboardStats();
    renderAchievements();
    renderQuotes();
    renderHistory();
    renderCharts();
    renderDrive();
    renderTimerUI();
  }

  // -------------------------
  // Tabs
  // -------------------------
  function setTab(name) {
    qsa(".tabbtn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    qsa(".tab").forEach((s) => s.classList.toggle("active", s.id === `tab-${name}`));
    localStorage.setItem(LS_TAB, name);
  }

  function restoreTab() {
    const t = localStorage.getItem(LS_TAB) || "dashboard";
    setTab(t);
  }

  // -------------------------
  // Timer UI
  // -------------------------
  let timerInterval = null;

  function timerElapsedMs() {
    if (!timer.running) return timer.elapsedMs;
    return timer.elapsedMs + (Date.now() - timer.startedAtMs);
  }

  function renderTimerUI() {
    // mode fields
    $("mode").value = timer.mode;
    $("sprintMins").value = String(timer.sprintMins);

    // inputs & radio
    $("pagesModeRange").checked = timer.pagesMode === "range";
    $("pagesModeCount").checked = timer.pagesMode === "count";
    $("rangeInputs").classList.toggle("hidden", timer.pagesMode !== "range");
    $("countInputs").classList.toggle("hidden", timer.pagesMode !== "count");

    $("fromPage").value = timer.fromPage;
    $("toPage").value = timer.toPage;
    $("pagesRead").value = timer.pagesRead;

    // buttons
    $("start").disabled = timer.running;
    $("pause").disabled = !timer.running;
    $("finish").disabled = !timer.running;
    $("hyper").disabled = !timer.running;

    // timer text
    const ms = timerElapsedMs();
    const secs = Math.floor(ms / 1000);
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    $("timerBig").textContent = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

    // hint
    if (!timer.running) {
      $("timerHint").textContent = "Press Start to begin.";
    } else if (timer.mode === "sprint") {
      const target = timer.sprintMins * 60 * 1000;
      const left = Math.max(0, target - ms);
      const ls = Math.floor(left / 1000);
      const lmm = Math.floor(ls / 60);
      const lss = ls % 60;
      $("timerHint").textContent = `Sprint ends in ${String(lmm).padStart(2, "0")}:${String(lss).padStart(2, "0")}.`;
      if (ms >= target) $("timerHint").textContent = "Sprint complete — end session or keep going.";
    } else {
      $("timerHint").textContent = "Open session running.";
    }
  }

  function startTimer() {
    if (timer.running) return;

    const b = getActiveBook();
    timer.sessionBookId = b.id;

    // copy UI settings into timer state
    timer.mode = $("mode").value;
    timer.sprintMins = clamp(normaliseInt($("sprintMins").value) || 8, 1, 180);

    // pages mode
    timer.pagesMode = $("pagesModeCount").checked ? "count" : "range";

    // fromPage autofill if empty
    const fp = normaliseInt($("fromPage").value);
    if (timer.pagesMode === "range") {
      if (!fp && fp !== 0) timer.fromPage = String((Number(b.currentPage) || 0) + 1);
      else timer.fromPage = String(fp);
      timer.toPage = $("toPage").value || "";
    } else {
      // count mode
      if (!fp && fp !== 0) timer.fromPage = String((Number(b.currentPage) || 0) + 1);
      else timer.fromPage = String(fp);
      timer.pagesRead = $("pagesRead").value || "";
    }

    timer.running = true;
    timer.startedAtMs = Date.now();
    timer.elapsedMs = timer.elapsedMs || 0;

    saveTimer();
    renderTimerUI();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      renderTimerUI();
      // allow sprint completion without stopping
      if (timer.running && timer.mode === "sprint") {
        const ms = timerElapsedMs();
        if (ms >= timer.sprintMins * 60 * 1000) {
          $("timerHint").textContent = "Sprint complete — end session or keep going.";
        }
      }
    }, 250);
  }

  function pauseTimer() {
    if (!timer.running) return;
    timer.elapsedMs = timerElapsedMs();
    timer.running = false;
    saveTimer();
    renderTimerUI();
  }

  function keepGoing() {
    if (!timer.running) return;
    timer.mode = "open";
    saveTimer();
    renderTimerUI();
  }

  function endSessionOpenModal(sessionIdForEdit = null) {
    // always require last page read (toPage)
    pauseTimer();

    const capturedMins = Math.max(0, Math.round(timer.elapsedMs / 60000));
    $("endMinsAuto").textContent = `${capturedMins} min`;
    $("endMins").value = String(capturedMins);

    // default pages
    const b = getActiveBook();
    const fromP = normaliseInt(timer.fromPage) ?? (Number(b.currentPage) || 0) + 1;
    $("endFromPage").value = String(fromP);

    if (sessionIdForEdit) {
      const s = state.sessions.find((x) => x.id === sessionIdForEdit);
      if (s) {
        $("endFromPage").value = String(s.fromPage ?? fromP);
        $("endToPage").value = String(s.toPage ?? "");
        $("endMins").value = String(s.minutes ?? capturedMins);
        $("endMsg").textContent = "Editing session.";
        $("endSave").dataset.editSessionId = sessionIdForEdit;
      }
    } else {
      // compute suggested toPage
      const tp = normaliseInt(timer.toPage);
      if (Number.isFinite(tp)) $("endToPage").value = String(tp);
      else {
        // count mode suggestion
        const pr = normaliseInt(timer.pagesRead);
        if (timer.pagesMode === "count" && Number.isFinite(pr)) {
          $("endToPage").value = String(fromP + pr - 1);
        } else {
          $("endToPage").value = "";
        }
      }
      $("endMsg").textContent = "";
      delete $("endSave").dataset.editSessionId;
    }

    // store last session id for quick edit/delete
    const last = getLastSessionForActiveBook();
    $("editLast").disabled = !last;
    $("deleteLast").disabled = !last;

    $("endOverlay").classList.add("open");
    $("endOverlay").setAttribute("aria-hidden", "false");
  }

  function closeEndModal() {
    $("endOverlay").classList.remove("open");
    $("endOverlay").setAttribute("aria-hidden", "true");
    $("endMsg").textContent = "";
    delete $("endSave").dataset.editSessionId;
  }

  function getLastSessionForActiveBook() {
    const b = getActiveBook();
    const ss = state.sessions.filter((s) => s.bookId === b.id);
    if (ss.length === 0) return null;
    ss.sort((a, b) => String(b.endedAt).localeCompare(String(a.endedAt)));
    return ss[0];
  }

  function saveEndSession() {
    const editId = $("endSave").dataset.editSessionId || "";
    const fromP = normaliseInt($("endFromPage").value);
    const toP = normaliseInt($("endToPage").value);
    const mins = normaliseInt($("endMins").value);

    if (!Number.isFinite(toP)) {
      $("endMsg").textContent = "Please enter the last page read.";
      return;
    }
    const fp = Number.isFinite(fromP) ? fromP : Math.max(0, (Number(getActiveBook().currentPage) || 0) + 1);
    const tp = toP;
    const pages = Math.max(0, tp - fp + 1);
    const minutes = Math.max(0, mins || 0);

    const endedAt = nowISO();
    const startedAt = new Date(nowMs() - (timer.elapsedMs || minutes * 60000)).toISOString();

    if (editId) {
      editSession(editId, { fromPage: fp, toPage: tp, pages, minutes });
      toast("Session updated");
    } else {
      addSession({
        bookId: timer.sessionBookId || getActiveBook().id,
        startedAt,
        endedAt,
        minutes,
        fromPage: fp,
        toPage: tp,
        pages,
        mode: timer.mode
      });
      toast("Session saved");
    }

    // reset timer state for next session
    timer = defaultTimer();
    saveTimer();

    dirty = true;
    closeEndModal();
    renderAll();
  }

  // -------------------------
  // Import / Export
  // -------------------------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookquest-${new Date(nowMs()).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON(file) {
    const txt = await file.text();
    const incoming = JSON.parse(txt);
    if (!incoming || !incoming.books || !incoming.sessions) throw new Error("Invalid BookQuest JSON");
    state = incoming;
    normaliseStateInPlace();
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    timer = defaultTimer();
    saveTimer();
    dirty = true;
    renderAll();
    toast("Imported");
  }

  // -------------------------
  // Event wiring
  // -------------------------
  function bindEvents() {
    // tabs
    qsa(".tabbtn").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    // settings
    $("rangeSelect").addEventListener("change", () => {
      state.settings.rangeDays = Number($("rangeSelect").value) || 30;
      saveState();
      renderAll();
    });

    $("storyScope").addEventListener("change", () => {
      state.settings.storyScope = $("storyScope").value;
      saveState();
      renderAll();
    });

    // books
    $("bookSelect").addEventListener("change", () => {
      state.activeBookId = $("bookSelect").value;
      saveState();
      // reset timer inputs to align with new book
      timer.fromPage = "";
      timer.toPage = "";
      timer.pagesRead = "";
      saveTimer();
      renderAll();
    });

    $("addBook").addEventListener("click", async () => {
      const title = $("newTitle").value.trim() || "Untitled book";
      const author = $("newAuthor").value.trim();
      const publisher = $("newPublisher").value.trim();
      const edition = $("newEdition").value.trim();
      const totalPages = normaliseInt($("newTotal").value) || 0;
      const currentPage = normaliseInt($("newCurrent").value) || 0;

      let coverDataUrl = "";
      const f = $("newCover").files && $("newCover").files[0];
      if (f) coverDataUrl = await fileToDataUrl(f);

      const b = {
        id: uuid(),
        title,
        author,
        publisher,
        edition,
        totalPages,
        currentPage,
        coverDataUrl,
        createdAt: nowISO(),
        finishedAt: ""
      };
      state.books.push(b);
      state.activeBookId = b.id;
      saveState();

      // clear form
      $("newTitle").value = "";
      $("newAuthor").value = "";
      $("newPublisher").value = "";
      $("newEdition").value = "";
      $("newTotal").value = "";
      $("newCurrent").value = "";
      $("newCover").value = "";

      toast("Book added");
      renderAll();
    });

    $("saveBook").addEventListener("click", async () => {
      const b = getActiveBook();
      b.title = $("editTitle").value.trim() || "Untitled book";
      b.author = $("editAuthor").value.trim();
      b.publisher = $("editPublisher").value.trim();
      b.edition = $("editEdition").value.trim();
      b.totalPages = normaliseInt($("editTotal").value) || 0;
      b.currentPage = normaliseInt($("editCurrent").value) || 0;

      const f = $("editCover").files && $("editCover").files[0];
      if (f) b.coverDataUrl = await fileToDataUrl(f);

      // finished toggle based on pages
      if (b.totalPages > 0 && b.currentPage >= b.totalPages) b.finishedAt = b.finishedAt || nowISO();
      if (b.totalPages > 0 && b.currentPage < b.totalPages) b.finishedAt = "";

      saveState();
      $("editCover").value = "";
      toast("Saved");
      renderAll();
    });

    $("deleteBook").addEventListener("click", () => {
      const b = getActiveBook();
      if (state.books.length <= 1) {
        toast("You must have at least one book.");
        return;
      }
      // delete sessions and quotes linked to book
      state.sessions = state.sessions.filter((s) => s.bookId !== b.id);
      state.quotes = state.quotes.filter((q) => q.bookId !== b.id);
      state.books = state.books.filter((x) => x.id !== b.id);
      state.activeBookId = state.books[0].id;
      recomputeGamificationFromScratch();
      saveState();
      toast("Book deleted");
      renderAll();
    });

    $("markFinished").addEventListener("click", () => {
      const b = getActiveBook();
      b.finishedAt = b.finishedAt ? "" : nowISO();
      saveState();
      toast(b.finishedAt ? "Marked finished" : "Marked not finished");
      renderAll();
    });

    // session fields
    $("pagesModeRange").addEventListener("change", () => {
      timer.pagesMode = "range";
      saveTimer();
      renderTimerUI();
    });
    $("pagesModeCount").addEventListener("change", () => {
      timer.pagesMode = "count";
      saveTimer();
      renderTimerUI();
    });

    $("fromPage").addEventListener("input", () => {
      timer.fromPage = $("fromPage").value;
      saveTimer();
    });
    $("toPage").addEventListener("input", () => {
      timer.toPage = $("toPage").value;
      saveTimer();
    });
    $("pagesRead").addEventListener("input", () => {
      timer.pagesRead = $("pagesRead").value;
      saveTimer();
    });
    $("mode").addEventListener("change", () => {
      timer.mode = $("mode").value;
      saveTimer();
      renderTimerUI();
    });
    $("sprintMins").addEventListener("input", () => {
      timer.sprintMins = clamp(normaliseInt($("sprintMins").value) || 8, 1, 180);
      saveTimer();
    });

    $("start").addEventListener("click", () => startTimer());
    $("pause").addEventListener("click", () => pauseTimer());
    $("hyper").addEventListener("click", () => keepGoing());
    $("finish").addEventListener("click", () => endSessionOpenModal());

    // end modal actions
    $("endCancel").addEventListener("click", () => closeEndModal());
    $("endSave").addEventListener("click", () => saveEndSession());

    $("editLast").addEventListener("click", () => {
      const last = getLastSessionForActiveBook();
      if (!last) return;
      endSessionOpenModal(last.id);
    });

    $("deleteLast").addEventListener("click", () => {
      const last = getLastSessionForActiveBook();
      if (!last) return;
      deleteSession(last.id);
      toast("Last session deleted");
      closeEndModal();
      renderAll();
    });

    // history edit/delete buttons (delegated)
    $("history").addEventListener("click", (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const idEdit = t.getAttribute("data-edit-session");
      const idDel = t.getAttribute("data-del-session");
      if (idEdit) {
        endSessionOpenModal(idEdit);
      }
      if (idDel) {
        deleteSession(idDel);
        toast("Session deleted");
        renderAll();
      }
    });

    // story
    $("makeStory").addEventListener("click", async () => {
      $("storyHint").textContent = "Generating…";
      try {
        await drawStoryPNG(state.settings.storyScope);
      } catch {
        $("storyHint").textContent = "Failed to render PNG.";
      }
    });

    $("downloadStory").addEventListener("click", () => {
      if (!storyLastUrl) return;
      const a = document.createElement("a");
      a.download = `bookquest-story-${new Date(nowMs()).toISOString().slice(0, 10)}.png`;
      a.href = storyLastUrl;
      a.click();
    });

    // charts downloads
    $("dlBookPages").addEventListener("click", () => downloadCanvasPNG($("chartPages"), "book-pages.png"));
    $("dlBookMins").addEventListener("click", () => downloadCanvasPNG($("chartMins"), "book-minutes.png"));
    $("dlAllPages").addEventListener("click", () => downloadCanvasPNG($("chartAllPages"), "overall-pages.png"));
    $("dlAllMins").addEventListener("click", () => downloadCanvasPNG($("chartAllMins"), "overall-minutes.png"));

    // quotes
    $("addQuote").addEventListener("click", async () => {
      const b = getActiveBook();
      const text = $("quoteText").value.trim();
      if (!text) {
        toast("Add some quote text.");
        return;
      }
      const quoteAuthor = $("quoteAuthor").value.trim();
      const page = normaliseInt($("quotePage").value) || 0;

      let imageDataUrl = "";
      const f = $("quoteImage").files && $("quoteImage").files[0];
      if (f) imageDataUrl = await fileToDataUrl(f);

      const q = { id: uuid(), bookId: b.id, text, quoteAuthor, page, imageDataUrl, createdAt: nowISO() };
      state.quotes.push(q);
      saveState();
      evaluateAchievements();

      // clear inputs
      $("quoteText").value = "";
      $("quoteAuthor").value = "";
      $("quotePage").value = "";
      $("quoteImage").value = "";

      $("previewQuote").disabled = false;
      $("downloadQuote").disabled = false;

      toast("Quote saved");
      renderQuotes();
    });

    $("previewQuote").addEventListener("click", async () => {
      // preview last quote in active book
      const b = getActiveBook();
      const qs = state.quotes.filter((q) => q.bookId === b.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      if (!qs.length) return;
      await drawQuotePNG(qs[0]);
      $("downloadQuote").disabled = false;
    });

    $("downloadQuote").addEventListener("click", () => {
      if (!quoteLastUrl) return;
      const a = document.createElement("a");
      a.download = `bookquest-quote-${new Date(nowMs()).toISOString().slice(0, 10)}.png`;
      a.href = quoteLastUrl;
      a.click();
    });

    $("quotesList").addEventListener("click", async (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const ex = t.getAttribute("data-quote-export");
      const del = t.getAttribute("data-quote-del");
      if (ex) {
        const q = state.quotes.find((x) => x.id === ex);
        if (!q) return;
        const url = await drawQuotePNG(q);
        const a = document.createElement("a");
        a.download = `bookquest-quote-${new Date(nowMs()).toISOString().slice(0, 10)}.png`;
        a.href = url;
        a.click();
      }
      if (del) {
        state.quotes = state.quotes.filter((x) => x.id !== del);
        saveState();
        toast("Quote deleted");
        renderQuotes();
      }
    });

    // sync
    $("exportBtn").addEventListener("click", () => exportJSON());
    $("importFile").addEventListener("change", async () => {
      const f = $("importFile").files && $("importFile").files[0];
      if (!f) return;
      try {
        await importJSON(f);
      } catch {
        toast("Import failed");
      } finally {
        $("importFile").value = "";
      }
    });

    $("googleClientId").addEventListener("input", () => {
      state.drive.clientId = $("googleClientId").value.trim();
      saveState();
      renderDrive();
    });

    // Google API key input DISABLED for now: do not bind any listener.

    $("driveAuto").addEventListener("change", () => {
      state.settings.driveAutoMins = Number($("driveAuto").value) || 0;
      saveState();
      setupDriveAutosave();
      toast("Auto-save updated");
    });

    $("driveSignIn").addEventListener("click", async () => {
      try {
        await ensureDriveToken(true);
        setupDriveAutosave();
      } catch {
        toast("Sign-in failed");
      }
    });

    $("drivePush").addEventListener("click", async () => {
      try {
        await ensureDriveToken(true);
        await drivePush();
        dirty = false;
      } catch {
        toast("Save to Drive failed");
      }
    });

    $("drivePull").addEventListener("click", async () => {
      try {
        await drivePullApply();
      } catch {
        toast("Pull failed");
      }
    });

    // close modal on overlay click
    $("endOverlay").addEventListener("click", (ev) => {
      if (ev.target === $("endOverlay")) closeEndModal();
    });

    // keep timer alive if user changes tab visibility
    document.addEventListener("visibilitychange", () => {
      saveTimer();
    });

    // local autosave heartbeat
    setInterval(() => {
      saveTimer();
      if (dirty) saveState();
      dirty = false;
    }, 30000);
  }

  async function fileToDataUrl(file) {
    const maxBytes = 1.8 * 1024 * 1024; // keep covers small-ish for LocalStorage
    const blob = file.size > maxBytes ? await downscaleImageFile(file, 900) : file;
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function downscaleImageFile(file, maxDim) {
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    const w = img.width;
    const h = img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));

    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, cw, ch);

    return await new Promise((resolve) => c.toBlob((b) => resolve(b), "image/jpeg", 0.85));
  }

  // -------------------------
  // Service worker registration
  // -------------------------
  async function registerSW() {
    try {
      if (!("serviceWorker" in navigator)) return;
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    } catch {
      // ignore
    }
  }

  // -------------------------
  // Boot
  // -------------------------
  let state = loadState();
  let timer = loadTimer();
  let dirty = false;

  let storyLastUrl = "";
  let quoteLastUrl = "";

  async function boot() {
    await syncServerTimeOnce();

    // after time sync, ensure state initialised with server time in this session
    if (!localStorage.getItem(LS_STATE)) {
      state = defaultState();
      saveState();
    } else {
      ensureDailyQuest();
    }

    // ---- NEW: auto-fill clientId from window.BOOKQUEST_CONFIG once ----
    const preset = (window.BOOKQUEST_CONFIG?.googleClientId || "").trim();
    if (preset && !(state.drive.clientId || "").trim()) {
      state.drive.clientId = preset;
      saveState();
    }

    // Disable API key option for now (clear any stored value)
    if (DISABLE_GOOGLE_API_KEY_FIELD) {
      state.drive.apiKey = "";
      saveState();
    }

    // restore settings into UI
    $("rangeSelect").value = String(state.settings.rangeDays || 30);
    $("storyScope").value = state.settings.storyScope || "book";
    restoreTab();

    // resume timer interval if running
    if (timer.running) {
      timer.startedAtMs = Date.now(); // best effort resume (elapsed preserved)
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(renderTimerUI, 250);
    }

    bindEvents();
    renderAll();
    setupDriveAutosave();
    await registerSW();

    // show drive status clearly
    renderDrive();
  }

  boot();
})();
