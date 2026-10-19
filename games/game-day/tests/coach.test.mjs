// /api/coach unit tests (no network: in-memory store, stubbed Jev).   node --test tests/coach.test.mjs
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const coach = require("../api/coach.js");
const rubric = coach.rubrics["c16-describe"];

let jevCalls = [];
let jevReply = null;
let mem;
let cmdLog = [];

async function call({ method = "POST", body, origin = "https://fmegahed.github.io", ip = "10.0.0.9", raw = false } = {}) {
  const headers = { "x-forwarded-for": ip, "content-type": "text/plain" };
  if (origin !== undefined) headers.origin = origin;
  // Vercel hands text/plain bodies over as a string
  const req = { method, headers, query: {}, body: raw ? body : body === undefined ? undefined : JSON.stringify(body) };
  const out = { status: 200, headers: {}, text: "" };
  const res = {
    setHeader(k, v) { out.headers[k.toLowerCase()] = v; },
    status(c) { out.status = c; return res; },
    send(s) { out.text = String(s); return res; },
  };
  await coach(req, res);
  try { out.json = JSON.parse(out.text); } catch (e) { out.json = null; }
  return out;
}
const ask = (text, extra = {}) => call({ body: { activity: "c16-describe", text }, ...extra });
const FULL = "Palmer penguins data, x = bill length, y = flipper length, color = species, points, facet_grid(palette ~ vision).";

beforeEach(() => {
  mem = memoryRedis();
  cmdLog = [];
  store.setRedis(async (...cmd) => { cmdLog.push(cmd[0]); return mem(...cmd); });
  coach.resetLocal();
  process.env.JEV_API_KEY = "test";
  jevCalls = [];
  jevReply = { idea_0: { noul: 0.9 }, idea_1: { noul: 0.8 }, idea_2: { noul: 0.1 }, idea_3: { noul: 0.2 }, wrong_0: { noul: 0 }, wrong_1: { noul: 0 } };
  coach.setAskJev(async (r, text) => { jevCalls.push(text); if (jevReply instanceof Error) throw jevReply; return jevReply; });
  coach.setNow(() => Date.UTC(2026, 9, 19, 13, 0, 0));
});

test("OPTIONS preflight: 204 with CORS for allowed origins only", async () => {
  for (const origin of ["https://fmegahed.github.io", "http://localhost:4321", "http://127.0.0.1:5500", "null"]) {
    const r = await call({ method: "OPTIONS", origin });
    assert.equal(r.status, 204);
    assert.equal(r.headers["access-control-allow-origin"], origin);
    assert.equal(r.headers.vary, "Origin");
    assert.match(r.headers["access-control-allow-methods"], /POST/);
    assert.equal(r.headers["access-control-allow-credentials"], undefined);
  }
  const bad = await call({ method: "OPTIONS", origin: "https://evil.example" });
  assert.equal(bad.status, 204);
  assert.equal(bad.headers["access-control-allow-origin"], undefined);
  assert.equal(bad.headers.vary, "Origin");
});

test("text/plain JSON body is judged; verdict carries rubric text only", async () => {
  const r = await ask(FULL, { origin: "null" });
  assert.equal(r.status, 200);
  assert.equal(r.headers["access-control-allow-origin"], "null");
  assert.equal(r.json.status, "more_detail");
  assert.deepEqual(r.json.ideas[0], { met: true, label: rubric.ideas[0].label });
  assert.deepEqual(r.json.ideas[2], { met: false, hint: rubric.ideas[2].hint });
  assert.equal(r.json.note, rubric.notes.more_detail);
  assert.deepEqual(Object.keys(r.json).sort(), ["ideas", "note", "status"]);
  assert.ok(r.json.ideas.every((i) => Object.keys(i).every((k) => ["met", "label", "hint"].includes(k))));
});

test("statuses: done, revisit (wrong claim note), keep_going", async () => {
  jevReply = { idea_0: { noul: 1 }, idea_1: { noul: 1 }, idea_2: { noul: 1 }, idea_3: { noul: 1 } };
  let r = await ask(FULL + " one");
  assert.equal(r.json.status, "done");
  assert.equal(r.json.note, rubric.notes.done);
  jevReply = { idea_0: { noul: 1 }, wrong_0: { noul: 0.9 } };
  r = await ask(FULL + " two");
  assert.equal(r.json.status, "revisit");
  assert.equal(r.json.note, rubric.wrong[0].msg);
  jevReply = {};
  r = await ask(FULL + " three");
  assert.equal(r.json.status, "keep_going");
  assert.equal(r.json.note, rubric.notes.keep_going);
});

test("short text: keep_going with every hint, no Jev call", async () => {
  const r = await ask("  points  ");
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { status: "keep_going", ideas: rubric.ideas.map((i) => ({ met: false, hint: i.hint })), note: "Write a little more." });
  assert.equal(jevCalls.length, 0);
});

test("text is capped at 1500 characters", async () => {
  await ask("penguins ".repeat(600));
  assert.equal(jevCalls.length, 1);
  assert.equal(jevCalls[0].length, 1500);
});

test("identical text (after normalizing) is served from the 10-minute cache", async () => {
  const a = await ask("Penguins data with  points, faceted by palette and vision.");
  const b = await ask("  penguins DATA with points, faceted by palette and vision. ");
  assert.equal(jevCalls.length, 1);
  assert.deepEqual(b.json, a.json);
  await ask("A different answer about penguins and points.");
  assert.equal(jevCalls.length, 2);
});

test("bad requests: 400; wrong method: 405", async () => {
  assert.equal((await call({ body: "not json", raw: true })).status, 400);
  assert.equal((await call({ body: { activity: "nope", text: FULL } })).status, 400);
  assert.equal((await call({ body: { activity: "c16-describe" } })).status, 400);
  assert.equal((await call({ body: { activity: "__proto__", text: FULL } })).status, 400);
  assert.equal((await call({ method: "GET" })).status, 405);
  // a parsed JSON object body (application/json) also works
  const r = await call({ body: { activity: "c16-describe", text: FULL }, raw: true });
  assert.equal(r.status, 200);
});

test("Jev failure or missing key: 503 unavailable, nothing cached", async () => {
  jevReply = new Error("Jev HTTP 429");
  const r = await ask(FULL);
  assert.equal(r.status, 503);
  assert.deepEqual(r.json, { error: "unavailable" });
  jevReply = { idea_0: { noul: 1 } };
  assert.equal((await ask(FULL)).status, 200);   // the failure was not cached
  delete process.env.JEV_API_KEY;
  assert.deepEqual((await ask(FULL + " again")).json, { error: "unavailable" });
});

test("per-address ceiling 600/min; a full class on one address is fine", async () => {
  for (let i = 0; i < 600; i++) assert.equal((await ask("short")).status, 200);
  assert.equal((await ask("short")).status, 429);
  assert.equal((await ask("short", { ip: "10.0.0.10" })).status, 200);
});

test("global daily cap of 20000 Jev calls; cache hits still served", async () => {
  await ask(FULL);                                       // cached, counts 1
  await mem("SET", "gd:coach:day:2026-10-19", "19998");
  assert.equal((await ask(FULL + " under the cap")).status, 200);   // 19999
  await mem("SET", "gd:coach:day:2026-10-19", "20000");
  const r = await ask(FULL + " new text");
  assert.equal(r.status, 429);
  assert.deepEqual(r.json, { error: "rate_limited" });
  assert.equal((await ask(FULL)).status, 200);           // cache hit, no Jev
  assert.equal(jevCalls.length, 2);
});

test("COACH_PER_DAY overrides the daily cap", async () => {
  process.env.COACH_PER_DAY = "3";
  const modPath = require.resolve("../api/coach.js");
  delete require.cache[modPath];
  const fresh = require("../api/coach.js");
  delete process.env.COACH_PER_DAY;
  delete require.cache[modPath];
  require("../api/coach.js");                            // restore the default module for later requires
  fresh.setAskJev(async () => ({ idea_0: { noul: 1 } }));
  const go = async (text) => {
    const out = { status: 200, headers: {}, text: "" };
    const res = { setHeader(k, v) { out.headers[k.toLowerCase()] = v; }, status(c) { out.status = c; return res; }, send(s) { out.text = String(s); return res; } };
    await fresh({ method: "POST", headers: { "x-forwarded-for": "10.0.0.9" }, body: JSON.stringify({ activity: "c16-describe", text }) }, res);
    return out.status;
  };
  for (let i = 1; i <= 3; i++) assert.equal(await go(FULL + " #" + i), 200);
  assert.equal(await go(FULL + " #4"), 429);
});

// ---------- coach fix round 1
test("daily counter moves only when Jev is called", async () => {
  const day = async () => Number(await mem("GET", "gd:coach:day:2026-10-19")) || 0;
  await ask("short");                                    // short text: no Jev
  assert.equal(await day(), 0);
  await ask(FULL);                                       // miss: Jev called
  assert.equal(await day(), 1);
  await ask(FULL);                                       // cache hit
  assert.equal(await day(), 1);
  await call({ body: { activity: "nope", text: FULL } });  // invalid
  delete process.env.JEV_API_KEY;
  await ask(FULL + " no key");                           // not configured: Jev not called
  assert.equal(await day(), 1);
  assert.equal(jevCalls.length, 1);
});

test("a cache hit is one pipeline; a miss is two", async () => {
  await ask(FULL);                                       // creates the minute and day keys
  cmdLog = [];
  await ask(FULL);                                       // hit: pipeline 1 only
  assert.deepEqual(cmdLog, ["INCR", "GET", "GET"]);
  cmdLog = [];
  await ask(FULL + " a new answer");                     // miss: pipeline 1, Jev, pipeline 2
  assert.deepEqual(cmdLog, ["INCR", "GET", "GET", "INCR", "SET"]);
});

test("Redis down: in-memory limits, 2000 Jev calls per instance, then 503", async () => {
  store.setRedis(async () => { throw new Error("Upstash unavailable"); });
  // spread over addresses so the 600-per-minute ceiling is not what stops them
  for (let i = 0; i < 2000; i++) {
    assert.equal((await ask(FULL + " #" + i, { ip: "10.2.0." + (i % 10) })).status, 200, "call " + i);
  }
  assert.equal(jevCalls.length, 2000);
  const r = await ask(FULL + " one more", { ip: "10.3.0.1" });
  assert.equal(r.status, 503);
  assert.deepEqual(r.json, { error: "unavailable" });
  assert.equal(jevCalls.length, 2000);
  // the per-address minute ceiling still applies from memory
  for (let i = 0; i < 600; i++) await ask("short");    // 600 calls this minute from 10.0.0.9
  assert.equal((await ask("short")).status, 429);
  assert.equal((await ask("short", { ip: "10.0.0.11" })).status, 200);
});

test("huge text is sliced before trimming and capped at 1500", async () => {
  const r = await ask("penguins points ".repeat(70000));  // about 1.1 MB
  assert.equal(r.status, 200);
  assert.equal(jevCalls[0].length, 1500);
});
