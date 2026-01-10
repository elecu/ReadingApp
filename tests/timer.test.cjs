const test = require("node:test");
const assert = require("node:assert/strict");

function createElement(seed = {}){
  return Object.assign(
    {
      disabled: false,
      textContent: "",
      value: "",
      classList: {
        add(){},
        remove(){},
        toggle(){}
      },
      style: {}
    },
    seed
  );
}

function setupDom(){
  const elements = {
    start: createElement(),
    pause: createElement(),
    finish: createElement(),
    hyper: createElement(),
    timerBig: createElement(),
    timerHint: createElement(),
    mode: createElement({ value: "sprint" }),
    sprintMins: createElement({ value: 8 })
  };
  global.document = {
    getElementById: id => elements[id] || null
  };
  return elements;
}

global.window = {
  BOOKQUEST_TEST: true,
  BOOKQUEST_I18N_ES: {}
};

setupDom();
require("../app.js");

const api = global.window.BOOKQUEST_TEST_API;

function resetState(){
  api.state.timer = {
    running: false,
    mode: "sprint",
    sprintMins: 8,
    startMs: 0,
    elapsedMs: 0,
    intervalId: null,
    bell: false,
    paused: false
  };
  api.state.settings = { lang: "en-GB" };
}

test("normalizeTimerState resets invalid timer values", () => {
  resetState();
  api.state.timer = {
    running: true,
    mode: "bad",
    sprintMins: 0,
    startMs: 0,
    elapsedMs: -50,
    intervalId: 123,
    bell: true,
    paused: true
  };
  api.normalizeTimerState();

  assert.equal(api.state.timer.running, false);
  assert.equal(api.state.timer.mode, "sprint");
  assert.equal(api.state.timer.sprintMins, 8);
  assert.equal(api.state.timer.elapsedMs, 0);
  assert.equal(api.state.timer.intervalId, null);
  assert.equal(api.state.timer.paused, false);
});

test("applyTimerState resets UI when idle", () => {
  const elements = setupDom();
  resetState();
  api.state.timer.running = false;

  api.applyTimerState();

  assert.equal(elements.start.disabled, false);
  assert.equal(elements.pause.disabled, true);
  assert.equal(elements.finish.disabled, true);
  assert.equal(elements.timerBig.textContent, "00:00");
  assert.equal(elements.timerHint.textContent, "");
});

test("applyTimerState sets resume label when paused", () => {
  const elements = setupDom();
  resetState();
  api.state.timer.running = true;
  api.state.timer.paused = true;
  api.state.timer.elapsedMs = 15000;

  api.applyTimerState();

  assert.equal(elements.start.disabled, true);
  assert.equal(elements.pause.textContent, "Resume");
  assert.equal(elements.timerHint.textContent, "Paused.");
});

test("updateTimerDisplay counts down in sprint mode", () => {
  const elements = setupDom();
  resetState();
  const realNow = Date.now;
  Date.now = () => 100000;

  api.state.timer.running = true;
  api.state.timer.paused = false;
  api.state.timer.mode = "sprint";
  api.state.timer.sprintMins = 1;
  api.state.timer.startMs = 70000;
  api.state.timer.elapsedMs = 0;

  api.updateTimerDisplay();

  assert.equal(elements.timerBig.textContent, "00:30");
  assert.equal(elements.timerHint.textContent, "Just start. Decide at the end.");

  Date.now = realNow;
});
