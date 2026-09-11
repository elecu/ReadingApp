const test = require("node:test");
const assert = require("node:assert/strict");

global.window = {
  BOOKQUEST_TEST: true,
  BOOKQUEST_I18N_ES: {},
  BOOKQUEST_CONFIG: {
    backendUrl: "https://worker.example.com",
    questAppKey: "test-key"
  }
};
global.document = { getElementById: () => null };

require("../app.js");
const api = global.window.BOOKQUEST_TEST_API;

const book = { id: "b1", title: "Moscow 2042", author: "Vladimir Voinovich" };

test("requestCloudQuestObjects sends the resolved synopsis and app key, returns the shared pool on success", async () => {
  let seen = null;
  global.fetch = async (url, opts) => {
    seen = { url, opts };
    return {
      ok: true,
      json: async () => ({ pool: ["time machine", "wall", "horse"], cached: false })
    };
  };
  const result = await api.requestCloudQuestObjects(book, 4, "en", "Kartsev travels through time.", true);
  assert.deepEqual(result, ["time machine", "wall", "horse"]);
  assert.equal(seen.url, "https://worker.example.com/quest/objects");
  assert.equal(seen.opts.headers["X-App-Key"], "test-key");
  const body = JSON.parse(seen.opts.body);
  assert.equal(body.title, "Moscow 2042");
  assert.equal(body.synopsis, "Kartsev travels through time.");
  assert.equal(body.sameLanguage, true);
});

test("requestCloudQuestObjects returns null on a non-ok response (e.g. budget_exceeded)", async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ error: "budget_exceeded" }) });
  const result = await api.requestCloudQuestObjects(book, 4, "en", "text", true);
  assert.equal(result, null);
});

test("requestCloudQuestObjects returns null instead of throwing on a network failure", async () => {
  global.fetch = async () => { throw new Error("network down"); };
  const result = await api.requestCloudQuestObjects(book, 4, "en", "text", true);
  assert.equal(result, null);
});

test("requestCloudQuestObjects returns null when the response has no objects array", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ error: "model_error" }) });
  const result = await api.requestCloudQuestObjects(book, 4, "en", "text", true);
  assert.equal(result, null);
});

test("sanitizeQuestObjects + groundQuestObjects still reject an ungrounded cloud response", () => {
  const raw = ["time machine", "space station", "wall"];
  const sanitized = api.sanitizeQuestObjects(raw, 3);
  assert.deepEqual(sanitized, ["time machine", "space station", "wall"]);
  const grounded = api.groundQuestObjects(sanitized, "Kartsev finds a time machine near the wall.", true);
  assert.deepEqual(grounded, ["time machine", "wall"]);
});

test("cloudAiEnabled is false without a configured backend", () => {
  const originalConfig = global.window.BOOKQUEST_CONFIG;
  global.window.BOOKQUEST_CONFIG = { backendUrl: "" };
  assert.equal(api.backendEnabled(), false);
  assert.equal(api.cloudAiEnabled(), false);
  global.window.BOOKQUEST_CONFIG = originalConfig;
});

test("cloudAiEnabled respects the per-device opt-out toggle", () => {
  api.state.settings = api.state.settings || {};
  api.state.settings.cloudAiEnabled = false;
  assert.equal(api.backendEnabled(), true);
  assert.equal(api.cloudAiEnabled(), false);
  api.state.settings.cloudAiEnabled = true;
  assert.equal(api.cloudAiEnabled(), true);
});
