const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const STATE_TTL_SECONDS = 60 * 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;

function corsHeaders(request, env){
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = env.APP_ORIGIN || "";
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
  if(allowedOrigin && origin === allowedOrigin){
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }else{
    headers["Access-Control-Allow-Origin"] = allowedOrigin || "*";
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
  const fallback = env.APP_ORIGIN || new URL(request.url).origin;
  if(!raw) return fallback;
  try{
    const url = new URL(raw);
    if(env.APP_ORIGIN && url.origin !== env.APP_ORIGIN){
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

    return new Response("Not found", { status: 404 });
  }
};
