// Race Call server tests.   cd games/race-call && node --test tests/
// The Upstash store is replaced by dev/memory_redis.js through _store.setRedis(fn) and the clock by
// _game.setNow(fn). No network is used.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
process.env.RC_QUESTIONS = path.join(here, "fixture_questions.json");
process.env.ADMIN_KEY = "test-key";
const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const game = require("../api/_game.js");
const handlers = {
  join: require("../api/join.js"), state: require("../api/state.js"), me: require("../api/me.js"),
  answer: require("../api/answer.js"), host: require("../api/host.js"), board: require("../api/board.js"),
  export: require("../api/export.js"),
};

async function call(name, { method = "GET", query = {}, body = undefined, headers = {} } = {}) {
  const req = { method, query, body: body === undefined ? undefined : JSON.stringify(body), headers: Object.assign({ "x-forwarded-for": "10.0.0.1" }, headers) };
  const out = { status: 200, headers: {}, text: "" };
  const res = { setHeader(k, v) { out.headers[k.toLowerCase()] = v; }, status(c) { out.status = c; return res; }, send(s) { out.text = String(s); return res; } };
  await handlers[name](req, res);
  try { out.json = JSON.parse(out.text); } catch (e) { out.json = null; }
  return out;
}

let clock = 1_000_000;
const join = async (b) => (await call("join", { method: "POST", body: { section: "Z", initial: "Q", ...b } })).json;
const snapshot = async () => (await call("state", { query: { section: "Z" } })).json;
const me = async (playerId) => (await call("me", { query: { section: "Z", playerId } })).json;
const answer = async (playerId, q, a) => (await call("answer", { method: "POST", body: { section: "Z", playerId, q, answer: a } })).json;
const host = async (action) => (await call("host", { method: "POST", body: { section: "Z", key: "test-key", action } })).json;
const board = async () => (await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).json;

beforeEach(() => { store.setRedis(memoryRedis()); clock = 1_000_000; game.setNow(() => clock); });

test("points: 2000 instant, 1000 at the buzzer, 0 when wrong", () => {
  assert.equal(game.points(true, 0, 20000), 2000);
  assert.equal(game.points(true, 20000, 20000), 1000);
  assert.equal(game.points(true, 10000, 20000), 1500);
  assert.equal(game.points(false, 0, 20000), 0);
});

test("names are cleaned and seats are validated", async () => {
  assert.equal(game.sanitizeName("  <b>Maya</b>  "), "Maya");
  assert.equal(game.sanitizeName("x".repeat(40)).length, 20);
  assert.equal((await call("join", { method: "POST", body: { section: "Z", first: "A", initial: "B", seat: "Q9-9" } })).status, 400);
  assert.equal((await call("join", { method: "POST", body: { section: "Z", first: "", initial: "B", seat: "L1-1" } })).status, 400);
  const j = await join({ first: "Maya", seat: "L1-1" });
  assert.ok(j.playerId && j.runId === 1);
});

test("nothing about the answer leaves the server before the reveal", async () => {
  const a = (await join({ first: "Ann", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Ben", seat: "L1-2" })).playerId;
  await host("next");                       // race 1 on screen, polls not open
  let bd = await board();
  assert.equal(bd.phase, "closed"); assert.equal(bd.opened, false);
  assert.equal(bd.reveal, null); assert.equal(bd.correct, null); assert.equal(bd.histogram, null);
  assert.equal((await answer(a, 1, 1)).reason, "closed");   // cannot answer before the polls open
  await host("open");
  clock += 2000;
  assert.equal((await answer(a, 1, 1)).ok, true);
  assert.equal((await answer(b, 1, 0)).ok, true);
  bd = await board();
  assert.equal(bd.phase, "open"); assert.equal(bd.answered, 2);
  assert.equal(bd.histogram, null, "no histogram while the polls are open");
  assert.equal(bd.reveal, null); assert.equal(bd.correct, null);
  assert.deepEqual(bd.top.map((p) => p.points), [0, 0], "points do not move before the reveal");
  const m = await me(a);
  assert.equal(m.last, null); assert.equal(m.you.points, 0);
  const st = await snapshot();
  const text = JSON.stringify([bd, m, st]);
  for (const secret of ["Takeaway one", "Call one", "r-aaaaaaaaaaaa"]) assert.ok(!text.includes(secret), secret + " leaked");
  // polls close: the histogram appears, the answer still does not
  await host("close");
  bd = await board();
  assert.deepEqual(bd.histogram, [1, 1, 0, 0]);
  assert.equal(bd.correct, null); assert.equal(bd.reveal, null);
  // the call
  bd = await host("reveal");
  assert.equal(bd.phase, "reveal"); assert.equal(bd.correct, 1);
  assert.deepEqual(bd.reveal, { correct: 1, call: "Call one", takeaway: "Takeaway one.", chart: "charts/r-aaaaaaaaaaaa.svg", anim: null, extra: null, extraAnim: null, extraCap: null });
  assert.deepEqual(bd.seatResults, { "L1-1": "right", "L1-2": "wrong" });
  const ma = await me(a), mb = await me(b);
  assert.equal(ma.last.correct, true); assert.equal(ma.last.points, 1900); assert.equal(ma.you.points, 1900); assert.equal(ma.you.rank, 1);
  assert.equal(ma.last.reveal.takeaway, "Takeaway one.");
  assert.equal(mb.last.correct, false); assert.equal(mb.you.points, 0);
  // answers after the call are refused
  assert.equal((await answer(b, 1, 1)).reason, "closed");
});

test("the first answer counts, the clock closes the polls, and late answers are refused", async () => {
  const a = (await join({ first: "Ann", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Ben", seat: "remote" })).playerId;
  await host("next"); await host("open");
  assert.equal((await answer(a, 1, 1)).ok, true);
  assert.equal((await answer(a, 1, 2)).reason, "duplicate");
  clock += 20000 + 1600;    // 20 s clock + more than the 1.5 s grace
  assert.equal((await snapshot()).phase, "closed");
  assert.equal((await answer(b, 1, 1)).reason, "closed");
  assert.equal((await answer(a, 2, 1)).reason, "closed");
  assert.equal((await answer("not a real id!", 1, 1)).reason, "unknown");
});

test("streaks, breaks by block, the final room map and the export", async () => {
  const a = (await join({ first: "Ann", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Ben", seat: "R2-3" })).playerId;
  const keys = [1, 3, 0, 2];
  await host("next");
  for (let q = 1; q <= 4; q++) {
    if (q > 1) await host("next");
    await host("open"); clock += 1000;
    await answer(a, q, keys[q - 1]);               // Ann: all right
    await answer(b, q, q === 2 ? keys[1] : 9);     // Ben: only race 2 right (9 is not an option)
    await answer(b, q, q === 2 ? keys[1] : (keys[q - 1] + 1) % 4);
    clock += 1000;
    const bd = await host("reveal");
    if (q === 3) assert.deepEqual(bd.streaks, [{ first: "Ann", seat: "L1-1", n: 3 }]);
    if (q === 2) {
      const br = await host("break");
      assert.equal(br.phase, "break");
      assert.deepEqual(br.seatTotals["L1-1"], { right: 2, answered: 2, of: 2, points: br.seatTotals["L1-1"].points });
      assert.equal(br.seatTotals["R2-3"].right, 1);
    }
  }
  assert.equal((await me(a)).you.streak, 4);
  assert.equal((await me(b)).you.streak, 0);
  const fin = await host("next");
  assert.equal(fin.phase, "final");
  assert.equal(fin.seatTotals["L1-1"].right, 4); assert.equal(fin.seatTotals["L1-1"].of, 4);
  assert.equal(fin.seatTotals["R2-3"].right, 1);
  assert.equal(fin.seatResults["L1-1"], "right"); assert.equal(fin.seatResults["R2-3"], "wrong");
  assert.equal(fin.top[0].first, "Ann");
  const ex = await call("export", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } });
  assert.equal(ex.status, 200);
  const rows = ex.text.trim().split("\n");
  assert.equal(rows.length, 1 + 8);
  assert.match(rows[0], /^section,run,first,initial,seat/);
  assert.match(rows[1], /^Z,1,Ann,Q,L1-1,/);
});

test("reset starts a new run; a taken seat kicks the old holder", async () => {
  const a = (await join({ first: "Ann", seat: "L1-1" })).playerId;
  const c = (await join({ first: "Cat", seat: "L1-1" })).playerId;
  assert.equal((await me(a)).kicked, true);
  assert.equal((await me(c)).you.first, "Cat");
  assert.equal((await snapshot()).players, 1);
  await host("next");
  const r1 = await host("reset");
  assert.equal(r1.phase, "lobby"); assert.equal(r1.runId, 2); assert.equal(r1.players.length, 0);
  assert.equal((await me(c)).kicked, true, "players from the old run must join again");
});

test("host actions need the key and fit the phase", async () => {
  const bad = await call("host", { method: "POST", body: { section: "Z", key: "nope", action: "next" } });
  assert.equal(bad.status, 403);
  const noKeyBoard = await call("board", { query: { section: "Z" } });
  assert.equal(noKeyBoard.status, 403);
  const ex = await call("export", { query: { section: "Z", key: "test-key" } });
  assert.equal(ex.status, 403, "the export key is read from the header only");
  assert.ok((await host("reveal")).error);
  assert.ok((await host("break")).error);
  await host("next"); await host("open");
  assert.ok((await host("final")).error, "final needs the open race called first");
});

test("the built files keep answers off the public site", () => {
  const root = path.join(here, "..");
  const pub = JSON.parse(fs.readFileSync(path.join(root, "questions.json"), "utf8"));
  const srv = JSON.parse(fs.readFileSync(path.join(root, "api", "_questions.json"), "utf8"));
  assert.equal(pub.questions.length, srv.length);
  const pubText = JSON.stringify(pub);
  for (const q of pub.questions) {
    assert.equal(q.options.length, 4);
    for (const k of ["answer", "call", "takeaway", "reveal", "revealAnim", "extra", "extraAnim", "extraCap"]) assert.ok(!(k in q), q.id + " has " + k);
  }
  for (const s of srv) {
    assert.ok(Number.isInteger(s.answer) && s.answer >= 0 && s.answer < 4);
    assert.ok(!pubText.includes(s.takeaway.slice(0, 30)), s.id + " takeaway in public file");
    if (s.reveal) { assert.match(s.reveal, /^charts\/r-[0-9a-f]{12}\.svg$/); assert.ok(!pubText.includes(s.reveal)); assert.ok(fs.existsSync(path.join(root, s.reveal))); }
    if (s.extra) { assert.match(s.extra, /^charts\/r-[0-9a-f]{12}\.svg$/); assert.ok(!pubText.includes(s.extra)); assert.ok(fs.existsSync(path.join(root, s.extra))); }
    if (s.extra || s.extraAnim) { assert.ok(s.extraCap && !pubText.includes(s.extraCap), s.id + " extraCap missing or public"); assert.ok(!s.reveal && !s.revealAnim, s.id + " has both an annotated reveal and a contrast chart"); }
  }
  const ignore = fs.readFileSync(path.join(root, ".vercelignore"), "utf8").split(/\r?\n/);
  for (const k of ["content", "reveal", "build.mjs", "data", "dev", "tests"]) assert.ok(ignore.includes(k), ".vercelignore misses " + k);
  // answers spread over the four options (no "always B")
  const counts = [0, 0, 0, 0]; for (const s of srv) counts[s.answer]++;
  assert.ok(counts.every((c) => c >= 2), "answer positions: " + counts.join(","));
});

test("the contrast chart and its caption stay on the server until the reveal", async () => {
  await join({ first: "Maya", seat: "L1-1" });
  await host("next"); await host("open"); await host("reveal"); await host("next");   // race 1
  await host("open"); await host("reveal"); await host("next");                        // race 2
  await host("open");                                                                   // race 3 (has a contrast chart)
  let bd = await board();
  assert.equal(bd.q, 3); assert.equal(bd.reveal, null);
  assert.ok(!JSON.stringify(bd).includes("Contrast caption") && !JSON.stringify(bd).includes("r-bbbbbbbbbbbb"));
  assert.ok(!JSON.stringify(await snapshot()).includes("Contrast caption"));
  bd = await host("close");
  assert.ok(!JSON.stringify(bd).includes("Contrast caption"), "not even at the close, when the room's projection shows");
  bd = await host("reveal");
  assert.equal(bd.reveal.extra, "charts/r-bbbbbbbbbbbb.svg"); assert.equal(bd.reveal.extraCap, "Contrast caption three.");
  assert.equal(bd.reveal.chart, null, "a contrast chart never replaces the question chart");
});

test("the demo's answer key is admin only and read-only", async () => {
  const no = await call("host", { method: "POST", body: { section: "Z", key: "nope", action: "key" } });
  assert.equal(no.status, 403);
  const before = await board();
  const k = await host("key");
  assert.equal(k.key.length, 4);
  assert.deepEqual(k.key.map((r) => r.correct), [1, 3, 0, 2]);
  assert.equal(k.key[2].extraCap, "Contrast caption three.");
  const after = await board();
  assert.equal(after.seq, before.seq, "reading the key changes nothing");
  assert.equal(after.phase, before.phase);
});
