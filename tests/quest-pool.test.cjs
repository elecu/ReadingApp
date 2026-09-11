const test = require("node:test");
const assert = require("node:assert/strict");

global.window = {
  BOOKQUEST_TEST: true,
  BOOKQUEST_I18N_ES: {},
  BOOKQUEST_CONFIG: { backendUrl: "", questAppKey: "" }
};
global.document = { getElementById: () => null };

require("../app.js");
const api = global.window.BOOKQUEST_TEST_API;

test("computeWorkId is stable for the same title/author regardless of case/whitespace", () => {
  const a = api.computeWorkId("Moscow 2042", "Vladimir Voinovich");
  const b = api.computeWorkId("  moscow   2042 ", "VLADIMIR VOINOVICH");
  assert.equal(a, b);
});

test("computeWorkId differs for a different title or author", () => {
  const a = api.computeWorkId("Moscow 2042", "Vladimir Voinovich");
  const b = api.computeWorkId("Moscow 2043", "Vladimir Voinovich");
  const c = api.computeWorkId("Moscow 2042", "Someone Else");
  assert.notEqual(a, b);
  assert.notEqual(a, c);
});

test("mergeIntoQuestPool dedupes case-insensitively and grows the pool", () => {
  api.state.questPools = {};
  const workId = "work1";
  api.mergeIntoQuestPool(workId, ["Wall", "horse", "machine"]);
  const merged = api.mergeIntoQuestPool(workId, ["WALL", "cake", "letter"]);
  assert.deepEqual(merged, ["Wall", "horse", "machine", "cake", "letter"]);
  assert.deepEqual(api.getQuestPool(workId), merged);
});

test("mergeIntoQuestPool caps at the sanity ceiling instead of growing forever", () => {
  api.state.questPools = {};
  const workId = "work2";
  const many = Array.from({ length: 60 }, (_, i) => `object${i}`);
  const merged = api.mergeIntoQuestPool(workId, many);
  assert.ok(merged.length <= 50, `expected pool capped at 50, got ${merged.length}`);
});

test("pickFromQuestPool draws different subsets for two different reading passes", () => {
  api.state.questPools = { work3: { objects: Array.from({ length: 20 }, (_, i) => `item${i}`) } };
  const passA = { id: "passA", workId: "work3", quest: { seed: 0 } };
  const passB = { id: "passB", workId: "work3", quest: { seed: 0 } };
  const drawA = api.pickFromQuestPool(passA, 5);
  const drawB = api.pickFromQuestPool(passB, 5);
  assert.equal(drawA.length, 5);
  assert.equal(drawB.length, 5);
  assert.notDeepEqual(drawA, drawB);
});

test("pickFromQuestPool is stable for the same pass (same seed) across calls", () => {
  api.state.questPools = { work4: { objects: Array.from({ length: 20 }, (_, i) => `item${i}`) } };
  const pass = { id: "pass1", workId: "work4", quest: { seed: 0 } };
  assert.deepEqual(api.pickFromQuestPool(pass, 5), api.pickFromQuestPool(pass, 5));
});

test("getQuestPool returns an empty array for an unknown or missing workId", () => {
  api.state.questPools = {};
  assert.deepEqual(api.getQuestPool("nope"), []);
  assert.deepEqual(api.getQuestPool(""), []);
  assert.deepEqual(api.getQuestPool(null), []);
});

test("sanitizeQuestObjects accepts a small result from a large open-ended ask", () => {
  // Regression check: asking for up to 50 and getting only 3 back must not
  // be rejected as "too few" the way the old exact-count contract did.
  const result = api.sanitizeQuestObjects(["wall", "horse", "machine"], 50);
  assert.deepEqual(result, ["wall", "horse", "machine"]);
});
