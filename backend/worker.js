const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const STATE_TTL_SECONDS = 60 * 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;

const QUEST_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const QUEST_SYNOPSIS_MAX_CHARS = 1800;
const QUEST_COUNT_MIN = 2;
const QUEST_COUNT_MAX = 8;
const QUEST_DEFAULT_DAILY_CAP = 150;
const QUEST_BUDGET_TTL_SECONDS = 60 * 60 * 36;

function allowedOrigins(env){
  // APP_ORIGIN can be one origin (today's GitHub Pages PWA) or a
  // comma-separated list, so a future Capacitor/TWA-wrapped app (which runs
  // from its own origin, e.g. capacitor://localhost or https://localhost)
  // can be added without touching this code again.
  return String(env.APP_ORIGIN || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);
}

function corsHeaders(request, env){
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins(env);
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-App-Key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
  if(allowed.length && origin && allowed.includes(origin)){
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }else{
    headers["Access-Control-Allow-Origin"] = allowed[0] || "*";
  }
  return headers;
}

function jsonResponse(request, env, body, status = 200){
  const headers = Object.assign(
    {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    corsHeaders(request, env)
  );
  return new Response(JSON.stringify(body), { status, headers });
}

function sanitizeReturnUrl(raw, request, env){
  const allowed = allowedOrigins(env);
  const fallback = allowed[0] || new URL(request.url).origin;
  if(!raw) return fallback;
  try{
    const url = new URL(raw);
    if(allowed.length && !allowed.includes(url.origin)){
      return fallback;
    }
    return url.toString();
  }catch(_){
    return fallback;
  }
}

function getRedirectUri(request, env){
  const base = env.BASE_URL || new URL(request.url).origin;
  return `${base}/auth/callback`;
}

function getSessionId(request, url){
  const authHeader = request.headers.get("Authorization") || "";
  if(authHeader.startsWith("Bearer ")){
    return authHeader.slice(7).trim();
  }
  return url.searchParams.get("session") || "";
}

async function handleAuthStart(request, env){
  if(!env.GOOGLE_CLIENT_ID){
    return new Response("Missing GOOGLE_CLIENT_ID", { status: 500 });
  }
  const url = new URL(request.url);
  const returnTo = sanitizeReturnUrl(url.searchParams.get("return"), request, env);
  const state = crypto.randomUUID();
  await env.BOOKQUEST_KV.put(
    `state:${state}`,
    JSON.stringify({ returnTo }),
    { expirationTtl: STATE_TTL_SECONDS }
  );

  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", getRedirectUri(request, env));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", DRIVE_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
}

async function handleAuthCallback(request, env){
  if(!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET){
    return new Response("Missing OAuth credentials", { status: 500 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if(!code || !state){
    return new Response("Missing code/state", { status: 400 });
  }
  const stateKey = `state:${state}`;
  const stateData = await env.BOOKQUEST_KV.get(stateKey, { type: "json" });
  if(!stateData){
    return new Response("State expired", { status: 400 });
  }
  await env.BOOKQUEST_KV.delete(stateKey);

  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: getRedirectUri(request, env),
    grant_type: "authorization_code"
  });
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const tokenData = await tokenRes.json();
  if(!tokenRes.ok || !tokenData.refresh_token){
    return new Response("Authorization failed", { status: 400 });
  }

  const sessionId = crypto.randomUUID();
  await env.BOOKQUEST_KV.put(
    `session:${sessionId}`,
    JSON.stringify({ refreshToken: tokenData.refresh_token }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  const returnUrl = new URL(stateData.returnTo || env.APP_ORIGIN || new URL(request.url).origin);
  returnUrl.searchParams.set("session", sessionId);
  return Response.redirect(returnUrl.toString(), 302);
}

async function handleAuthToken(request, env){
  if(!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET){
    return jsonResponse(request, env, { error: "missing_credentials" }, 500);
  }
  const url = new URL(request.url);
  const sessionId = getSessionId(request, url);
  if(!sessionId){
    return jsonResponse(request, env, { error: "missing_session" }, 401);
  }
  const sessionData = await env.BOOKQUEST_KV.get(`session:${sessionId}`, { type: "json" });
  if(!sessionData || !sessionData.refreshToken){
    return jsonResponse(request, env, { error: "invalid_session" }, 401);
  }

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: sessionData.refreshToken
  });
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const tokenData = await tokenRes.json();
  if(!tokenRes.ok || !tokenData.access_token){
    return jsonResponse(request, env, { error: "token_error" }, 400);
  }
  if(tokenData.refresh_token && tokenData.refresh_token !== sessionData.refreshToken){
    await env.BOOKQUEST_KV.put(
      `session:${sessionId}`,
      JSON.stringify({ refreshToken: tokenData.refresh_token }),
      { expirationTtl: SESSION_TTL_SECONDS }
    );
  }

  return jsonResponse(request, env, {
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in || 3600
  });
}

async function handleAuthLogout(request, env){
  const url = new URL(request.url);
  const sessionId = getSessionId(request, url);
  if(sessionId){
    await env.BOOKQUEST_KV.delete(`session:${sessionId}`);
  }
  return jsonResponse(request, env, { ok: true });
}

/* ---------- Quest object generation (shared cloud AI, tier 0) ----------
   One backend account/credential shared by every user of the app (same
   model as the OAuth Client ID above being one app registration) -- there
   is no per-user login for this endpoint, so protection is a static
   X-App-Key header (filters generic bots, not a determined reader of this
   public repo) plus a daily call budget, not identity. */

function normalizeBookIdentity(str){
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

async function sha256Hex(str){
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function questCacheKey(title, author, lang){
  const identity = `${normalizeBookIdentity(title)}|${normalizeBookIdentity(author)}`;
  const hash = await sha256Hex(identity);
  const langCode = String(lang || "en").split("-")[0].toLowerCase() || "en";
  return `quest:${langCode}:${hash.slice(0, 24)}`;
}

function todayKey(){
  return new Date().toISOString().slice(0, 10);
}

function buildQuestPrompt(title, author, count, lang, synopsis){
  return {
    system: [
      "You extract concrete, physical, tangible objects from book plot summaries",
      "for a reading-gamification app. Rules:",
      "(1) Only name objects a reader could physically hold, wear, or carry -- never abstract ideas, organizations, titles, or character names.",
      "(2) If a key plot element is not itself physical, name a real physical object closely tied to it instead (example: a spy agency -> its badge).",
      "(3) Every object must be clearly traceable to specific text in the synopsis provided -- do not invent generic genre tropes that are not mentioned.",
      `(4) Reply with ONLY a JSON array of exactly ${count} short lowercase strings in ${lang || "English"}, ordered earliest-appearing first.`,
      "No prose, no markdown fences, no explanation -- the array is the entire reply."
    ].join(" "),
    user: `Title: ${title}\nAuthor: ${author || ""}\nSynopsis: ${synopsis}`
  };
}

function extractJsonArray(text){
  if(!text) return null;
  let cleaned = String(text).trim().replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if(start === -1 || end === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try{
    return JSON.parse(slice);
  }catch(_){}
  try{
    const repaired = slice
      .replace(/'([^']*)'/g, (_, inner) => `"${inner.replace(/"/g, "'")}"`)
      .replace(/,\s*\]/g, "]");
    return JSON.parse(repaired);
  }catch(_){}
  const inner = slice.slice(1, -1).trim();
  if(!inner) return null;
  const items = inner.split(",").map(s => s.trim().replace(/^['"]+|['"]+$/g, "")).filter(Boolean);
  return items.length ? items : null;
}

function sanitizeObjects(raw, count){
  if(!Array.isArray(raw) || !raw.length) return null;
  const cleaned = [];
  for(const item of raw){
    if(typeof item !== "string") continue;
    const val = item.trim().toLowerCase().replace(/\s+/g, " ");
    if(val.length < 2 || val.length > 40) continue;
    if(!/^[\p{L}][\p{L}\s-]*$/u.test(val)) continue;
    cleaned.push(val);
  }
  const unique = Array.from(new Set(cleaned));
  const min = Math.max(1, (count || QUEST_COUNT_MIN) - 1);
  if(unique.length < min) return null;
  return unique.slice(0, count || QUEST_COUNT_MAX);
}

function groundObjects(objects, synopsis){
  const hay = normalizeBookIdentity(synopsis);
  if(!hay) return objects;
  return objects.filter(obj => {
    const tokens = obj.split(/[\s-]+/g).filter(tok => tok.length >= 3);
    if(!tokens.length) return true;
    return tokens.some(tok => hay.includes(normalizeBookIdentity(tok)));
  });
}

async function callQuestModel(env, prompt){
  const result = await env.AI.run(QUEST_MODEL, {
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user }
    ],
    max_tokens: 300
  });
  return (result && typeof result.response === "string") ? result.response : "";
}

async function checkAppKey(request, env){
  // Left unconfigured, this check is skipped entirely -- keeps the Worker
  // usable out of the box for anyone self-hosting it without extra setup.
  if(!env.QUEST_APP_KEY) return true;
  return request.headers.get("X-App-Key") === env.QUEST_APP_KEY;
}

async function handleQuestObjects(request, env){
  if(request.method !== "POST"){
    return jsonResponse(request, env, { error: "method_not_allowed" }, 405);
  }
  if(!env.AI){
    return jsonResponse(request, env, { error: "ai_not_configured" }, 500);
  }
  if(!(await checkAppKey(request, env))){
    return jsonResponse(request, env, { error: "unauthorized" }, 401);
  }

  let body;
  try{
    body = await request.json();
  }catch(_){
    return jsonResponse(request, env, { error: "invalid_input" }, 400);
  }
  const title = String(body && body.title || "").trim().slice(0, 300);
  const author = String(body && body.author || "").trim().slice(0, 300);
  const lang = String(body && body.lang || "en").trim().slice(0, 10);
  const sameLanguage = Boolean(body && body.sameLanguage);
  const count = Math.min(QUEST_COUNT_MAX, Math.max(QUEST_COUNT_MIN, Number(body && body.count) || 4));
  const synopsis = String(body && body.synopsis || "").trim().slice(0, QUEST_SYNOPSIS_MAX_CHARS);
  if(!title || !synopsis){
    return jsonResponse(request, env, { error: "invalid_input" }, 400);
  }

  const cacheKey = await questCacheKey(title, author, lang);
  const cached = await env.BOOKQUEST_KV.get(cacheKey, { type: "json" });
  if(cached && Array.isArray(cached.objects) && cached.objects.length){
    return jsonResponse(request, env, { objects: cached.objects.slice(0, count), cached: true });
  }

  const budgetKey = `quest-budget:${todayKey()}`;
  const cap = Number(env.QUEST_DAILY_CAP) || QUEST_DEFAULT_DAILY_CAP;
  const usedRaw = await env.BOOKQUEST_KV.get(budgetKey);
  const used = Number(usedRaw) || 0;
  if(used >= cap){
    return jsonResponse(request, env, { error: "budget_exceeded" }, 200);
  }

  let objects = null;
  try{
    const prompt = buildQuestPrompt(title, author, count, lang, synopsis);
    const text = await callQuestModel(env, prompt);
    // The call itself is what costs quota, so the budget counter advances
    // here regardless of whether the response turns out to be usable.
    await env.BOOKQUEST_KV.put(budgetKey, String(used + 1), { expirationTtl: QUEST_BUDGET_TTL_SECONDS });
    const raw = extractJsonArray(text);
    objects = sanitizeObjects(raw, count);
    if(objects && objects.length && sameLanguage){
      const grounded = groundObjects(objects, synopsis);
      objects = grounded.length ? grounded : null;
    }
  }catch(_){
    objects = null;
  }

  if(!objects || !objects.length){
    return jsonResponse(request, env, { error: "model_error" }, 200);
  }

  await env.BOOKQUEST_KV.put(cacheKey, JSON.stringify({ objects, generatedAt: new Date().toISOString(), model: QUEST_MODEL }));
  return jsonResponse(request, env, { objects, cached: false });
}

export default {
  async fetch(request, env){
    if(request.method === "OPTIONS"){
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    if(url.pathname === "/auth/start") return handleAuthStart(request, env);
    if(url.pathname === "/auth/callback") return handleAuthCallback(request, env);
    if(url.pathname === "/auth/token") return handleAuthToken(request, env);
    if(url.pathname === "/auth/logout") return handleAuthLogout(request, env);
    if(url.pathname === "/quest/objects") return handleQuestObjects(request, env);

    return new Response("Not found", { status: 404 });
  }
};
