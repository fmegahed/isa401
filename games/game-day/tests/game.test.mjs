// Game Day server tests.   cd games/game-day && node --test tests/
// The Upstash store is replaced by dev/memory_redis.js through _store.setRedis(fn), the clock by
// _game.setNow(fn), and the Jev call by _game.setAskJev(fn). No network is used.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
process.env.GD_QUESTIONS = path.join(here, "fixture_questions.json");
process.env.ADMIN_KEY = "test-key";
const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const game = require("../api/_game.js");
const J = require("../api/_judge.js");
const handlers = {
  join: require("../api/join.js"),
  state: require("../api/state.js"),
  me: require("../api/me.js"),
  answer: require("../api/answer.js"),
  host: require("../api/host.js"),
  board: require("../api/board.js"),
  export: require("../api/export.js"),
};

// ---------- handler harness (same req/res surface as Vercel and dev/server.js)
async function call(name, { method = "GET", query = {}, body = undefined, headers = {} } = {}) {
  const req = { method, query, body: body === undefined ? undefined : JSON.stringify(body), headers: Object.assign({ "x-forwarded-for": "10.0.0.1" }, headers) };
  const out = { status: 200, headers: {}, text: "" };
  const res = {
    setHeader(k, v) { out.headers[k.toLowerCase()] = v; },
    status(c) { out.status = c; return res; },
    send(s) { out.text = String(s); return res; },
  };
  await handlers[name](req, res);
  try { out.json = JSON.parse(out.text); } catch (e) { out.json = null; }
  return out;
}

let clock = 1_000_000;
const join = async (b) => (await call("join", { method: "POST", body: { section: "Z", ...b } })).json;
const snapshot = async () => (await call("state", { query: { section: "Z" } })).json;
const me = async (playerId) => (await call("me", { query: { section: "Z", playerId } })).json;
// The phone view: the public snapshot plus /api/me, folded into one object for the assertions.
const state = async (playerId) => {
  const s = await snapshot(); const m = await me(playerId);
  const out = Object.assign({}, s, { you: m.you ? Object.assign({}, m.you, { last: m.last }) : null });
  if (m.kicked) out.kicked = true;
  return out;
};
const answer = async (playerId, q, a) => (await call("answer", { method: "POST", body: { section: "Z", playerId, q, answer: a } })).json;
const host = async (action) => (await call("host", { method: "POST", body: { section: "Z", key: "test-key", action } })).json;
const board = async () => (await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).json;

beforeEach(() => {
  store.setRedis(memoryRedis());
  clock = 1_000_000;
  game.setNow(() => clock);
  game.setAskJev(async () => { throw new Error("askJev not stubbed"); });
});

// ---------- pure functions
test("points: speed scoring, double points", () => {
  assert.equal(game.points(true, 0, 20000), 2000);
  assert.equal(game.points(true, 20000, 20000), 1000);
  assert.equal(game.points(false, 0, 20000), 0);
  assert.equal(game.points(true, 25000, 20000), 1000);
});

test("openPoints: share of rubric ideas, no speed", () => {
  assert.equal(game.openPoints(2, 3), 1333);
  assert.equal(game.openPoints(0, 3), 0);
  assert.equal(game.openPoints(3, 3), 2000);
});

test("name sanitised", () => {
  assert.ok(!game.sanitizeName("<b>Al</b>").includes("<"));
  assert.ok(!game.sanitizeName("<img src=x onerror=alert(1)>Bo").includes("<"));
  assert.equal(game.sanitizeName("x".repeat(200)).length, 20);
  assert.equal(game.sanitizeName("  "), null);
  assert.equal(game.sanitizeName(""), null);
  assert.equal(game.sanitizeInitial("m"), "M");
  assert.equal(game.sanitizeInitial("Mo"), null);
  assert.equal(game.sanitizeInitial("1"), null);
});

// ---------- flows
test("join validates section, seat and names", async () => {
  assert.equal((await call("join", { method: "POST", body: { section: "C", first: "Al", initial: "M", seat: "L1-1" } })).status, 400);
  assert.equal((await call("join", { method: "POST", body: { section: "Z", first: "Al", initial: "M", seat: "L4-1" } })).status, 400);
  assert.equal((await call("join", { method: "POST", body: { section: "Z", first: " ", initial: "M", seat: "L1-1" } })).status, 400);
  const r = await join({ first: "Al", initial: "m", seat: "remote" });
  assert.match(r.playerId, /^[A-Za-z0-9_-]{8,40}$/);
  assert.equal(r.runId, 1);
});

test("rejoin keeps points", async () => {
  const { playerId } = await join({ first: "Maya", initial: "K", seat: "L2-3" });
  await host("open");                       // lobby -> question 1 open
  clock += 5000;
  assert.deepEqual(await answer(playerId, 1, 2), { ok: true });
  await host("reveal");
  const before = await state(playerId);
  assert.ok(before.you.points > 1000);
  assert.equal(before.you.last.correct, true);
  // reload: same playerId from localStorage, joining again (even at another seat)
  const again = await join({ playerId, first: "Maya", initial: "K", seat: "R1-2" });
  assert.equal(again.playerId, playerId);
  const after = await state(playerId);
  assert.equal(after.you.points, before.you.points);
  assert.equal(after.you.seat, "R1-2");
  assert.equal(after.kicked, undefined);
  assert.equal(after.players, 1);
});

test("late answer rejected", async () => {
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  await host("open");
  clock += 20000 + 1501;                    // 20 s question plus the 1.5 s grace
  assert.deepEqual(await answer(playerId, 1, 2), { ok: false, reason: "closed" });
  const s = await state(playerId);
  assert.equal(s.phase, "closed");          // the server clock closed it
  // within grace is still accepted
  const p2 = (await join({ first: "Bo", initial: "C", seat: "L1-2" })).playerId;
  await host("reveal"); await host("next"); await host("open");
  clock += 30000 + 1000;
  assert.deepEqual(await answer(p2, 2, 0), { ok: true });
  // wrong question number
  assert.deepEqual(await answer(playerId, 1, 0), { ok: false, reason: "closed" });
});

test("second answer ignored", async () => {
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  await host("open");
  clock += 1000;
  assert.deepEqual(await answer(playerId, 1, 0), { ok: true });       // wrong
  assert.deepEqual(await answer(playerId, 1, 2), { ok: false, reason: "duplicate" });
  await host("reveal");
  const s = await state(playerId);
  assert.equal(s.you.points, 0);
  assert.equal(s.you.last.correct, false);
});

test("unknown player cannot answer", async () => {
  await host("open");
  assert.deepEqual(await answer("nobody-here-123", 1, 2), { ok: false, reason: "unknown" });
});

test("seat steal kicks first", async () => {
  const a = (await join({ first: "Al", initial: "B", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Bo", initial: "C", seat: "L1-1" })).playerId;
  assert.notEqual(a, b);
  assert.equal((await state(a)).kicked, true);
  assert.equal((await state(b)).kicked, undefined);
  const bd = await board();
  assert.deepEqual(bd.players, [{ first: "Bo", seat: "L1-1" }]);
  await host("open");
  assert.deepEqual(await answer(a, 1, 2), { ok: false, reason: "unknown" });
});

test("jev failure stores unjudged", async () => {
  game.setAskJev(async () => { throw new Error("Jev HTTP 429"); });
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  await host("open"); await host("reveal"); await host("next");
  await host("open"); await host("reveal"); await host("next");      // now question 3 (open-ended)
  await host("open");
  clock += 10000;
  const t0 = Date.now();
  assert.deepEqual(await answer(playerId, 3, "The loss is drawn as a positive bar; it should go below zero."), { ok: true });
  assert.ok(Date.now() - t0 < 1000);
  await game.settle();
  const raw = JSON.parse(await store.redis("HGET", "gd:Z:1:a:3", playerId));
  assert.equal(raw.judged, false);
  assert.equal(raw.points, 0);
  assert.equal(raw.note, "Could not be checked");
  await host("reveal");
  const s = await state(playerId);
  assert.deepEqual(s.you.last, { correct: false, points: 0, note: "Could not be checked" });
  assert.equal(s.you.points, 0);
});

test("open answer judged from rubric only", async () => {
  game.setAskJev(async () => ({ idea_0: { noul: 0.9 }, idea_1: { noul: 0.1 }, wrong_0: { noul: 0.0 }, note: "MODEL TEXT" }));
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  for (let i = 0; i < 2; i++) { await host("open"); await host("reveal"); await host("next"); }
  await host("open");
  await answer(playerId, 3, "The loss is drawn as a positive bar going up.");
  await game.settle();
  let s = await state(playerId);
  assert.equal(s.you.points, 0);           // hidden until reveal
  assert.equal(s.you.last, null);
  assert.ok(!JSON.stringify([s, await me(playerId), await board()]).includes("STRONG ANSWER"));   // model answer hidden until reveal
  await host("reveal");
  s = await state(playerId);
  assert.equal(s.you.points, 1000);
  assert.equal(s.you.last.correct, true);
  assert.ok(s.you.last.note.includes("The loss is drawn as a gain"));
  assert.ok(!s.you.last.note.includes("MODEL"));
  const bd = await board();
  assert.deepEqual(bd.openNotes, ["The loss is drawn as a gain"]);
  assert.equal(bd.histogram, null);
  assert.equal(bd.openIdeas.judged, 1);
  assert.deepEqual(bd.openIdeas.ideas.map((d) => d.n), [1, 0]);
  assert.deepEqual(bd.openModel.text, [{ head: "What misleads", items: ["STRONG ANSWER: the loss is drawn up."] }, { head: "Fixes", items: ["Draw the loss below zero."] }]);
  assert.equal(bd.openModel.fix, "charts/fx3_fix.svg");
  assert.deepEqual((await me(playerId)).model, [{ head: "What misleads", items: ["STRONG ANSWER: the loss is drawn up."] }, { head: "Fixes", items: ["Draw the loss below zero."] }]);
});

test("answer before reveal never exposes correct index in state", async () => {
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  await host("open");
  const open = await state(playerId);
  assert.equal(open.phase, "open");
  assert.ok(open.remainingMs > 0 && open.remainingMs <= 20000);
  await answer(playerId, 1, 2);
  await host("close");
  for (const s of [await state(playerId), await board()]) {
    const text = JSON.stringify(s);
    assert.ok(!/"answer"/.test(text), text);
    assert.ok(!/"correct"\s*:\s*\d/.test(text), text);
    assert.ok(!/"correct"\s*:\s*true/.test(text), text);
  }
  const s = await state(playerId);
  assert.equal(s.you.last, null);
  assert.equal(s.you.points, 0);
  const bd = await board();
  assert.deepEqual(bd.top, [{ first: "Al", seat: "L1-1", points: 0 }]);
  assert.deepEqual(bd.seatResults, {});
  assert.deepEqual(bd.histogram, [0, 0, 1, 0]);
  await host("reveal");
  const after = await board();
  assert.equal(after.correct, 2);
  assert.deepEqual(after.seatResults, { "L1-1": "right" });
  assert.equal(after.top[0].points, 2000);
});

test("break and final phases", async () => {
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  await host("open"); await answer(playerId, 1, 2); await host("reveal");
  await host("next"); await host("open"); await answer(playerId, 2, 3); await host("reveal");
  const br = await host("break");
  assert.equal(br.phase, "break");
  assert.deepEqual(br.seatResults, { "L1-1": "right" });     // 1 of 2 in the quarter
  assert.equal((await state(playerId)).phase, "break");
  const fin = await host("final");
  assert.equal(fin.phase, "final");
  const bad = (await call("host", { method: "POST", body: { section: "Z", key: "wrong", action: "open" } }));
  assert.equal(bad.status, 403);
  assert.equal((await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "nope" } })).status, 403);
});

test("reset increments runId and clears lobby", async () => {
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  assert.equal((await state(playerId)).players, 1);
  const bd = await host("reset");
  assert.equal(bd.runId, 2);
  assert.equal(bd.phase, "lobby");
  assert.deepEqual(bd.players, []);
  const s = await state(playerId);
  assert.equal(s.runId, 2);
  assert.equal(s.players, 0);
  assert.equal(s.kicked, true);             // old player must join again
  const j = await join({ first: "Al", initial: "B", seat: "L1-1" });
  assert.equal(j.runId, 2);
});

test("export has header and one row per answer", async () => {
  const a = (await join({ first: "Al, Jr", initial: "B", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Bo", initial: "C", seat: "remote" })).playerId;
  await host("open"); await answer(a, 1, 2); await answer(b, 1, 1); await host("reveal");
  await host("next"); await host("open"); await answer(a, 2, 0); await host("reveal");
  const r = await call("export", { query: { section: "Z", run: "1" }, headers: { "x-admin-key": "test-key" } });
  assert.equal(r.status, 200);
  assert.match(r.headers["content-type"], /text\/csv/);
  const lines = r.text.trim().split("\n");
  assert.equal(lines[0], "section,run,first,initial,seat,joined_at,q,answer,correct,points,judged");
  assert.equal(lines.length, 1 + 3);
  assert.ok(lines.some((l) => l.startsWith('Z,1,"Al, Jr",B,L1-1,') && l.endsWith(",1,2,TRUE,2000,TRUE")));
  assert.equal((await call("export", { query: { section: "Z", run: "1" }, headers: { "x-admin-key": "bad" } })).status, 403);
  assert.equal((await call("export", { query: { section: "Z", run: "1", key: "test-key" } })).status, 403);   // query key no longer accepted
});

test("verdict landing after reveal is counted once", async () => {
  let release;
  game.setAskJev(() => new Promise((r) => { release = () => r({ idea_0: { noul: 0.9 }, idea_1: { noul: 0.8 } }); }));
  const { playerId } = await join({ first: "Al", initial: "B", seat: "L1-1" });
  for (let i = 0; i < 2; i++) { await host("open"); await host("reveal"); await host("next"); }
  await host("open");
  await answer(playerId, 3, "The loss points up like a gain; draw it below zero.");
  const during = await host("reveal");               // Jev still thinking
  assert.equal(during.judging, 1);
  assert.equal((await state(playerId)).you.last.note, "Reviewing answers");
  release(); await game.settle();
  await host("reveal");                               // a second click must not score again
  const s = await state(playerId);
  assert.equal(s.you.points, 2000);
  assert.equal(s.you.last.points, 2000);
  assert.equal(s.you.rank, 1);
});

// ---------- fix round 1
test("snapshot is public, cached and non-personal", async () => {
  const a = (await join({ first: "Al", initial: "B", seat: "L1-1" })).playerId;
  const r0 = await call("state", { query: { section: "Z" } });
  assert.equal(r0.headers["cache-control"], "public, s-maxage=1, stale-while-revalidate=1");
  assert.equal(r0.json.endsAt, null);
  const seq0 = r0.json.seq;
  await host("open");
  const r = await call("state", { query: { section: "Z", playerId: a } });   // playerId is ignored
  assert.equal(r.json.you, undefined);
  assert.equal(r.json.phase, "open");
  assert.equal(r.json.endsAt, clock + 20000);
  assert.equal(r.json.serverNow, clock);
  assert.equal(r.json.players, 1);
  assert.ok(r.json.seq > seq0);
  // a seat steal moves seq so the first phone refetches /api/me
  await join({ first: "Bo", initial: "C", seat: "L1-1" });
  const r2 = (await call("state", { query: { section: "Z" } })).json;
  assert.ok(r2.seq > r.json.seq);
  assert.equal(r2.players, 1);
  assert.equal((await me(a)).kicked, true);
  // errors are never cached
  const bad = await call("state", { query: { section: "Q" } });
  assert.equal(bad.status, 400);
  assert.equal(bad.headers["cache-control"], "no-store");
  // /api/me is no-store
  assert.equal((await call("me", { query: { section: "Z", playerId: a } })).headers["cache-control"], "no-store");
});

test("kicked players drop out of counts and histogram", async () => {
  const a = (await join({ first: "Al", initial: "B", seat: "L1-1" })).playerId;
  await join({ first: "Cy", initial: "D", seat: "remote" });
  await host("open");
  await answer(a, 1, 2);
  let bd = await board();
  assert.equal(bd.answered, 1);
  assert.deepEqual(bd.histogram, [0, 0, 1, 0]);
  await join({ first: "Bo", initial: "C", seat: "L1-1" });
  bd = await board();
  assert.equal(bd.answered, 0);
  assert.deepEqual(bd.histogram, [0, 0, 0, 0]);
  assert.deepEqual(bd.answeredSeats, []);
  assert.equal((await snapshot()).players, 2);
  // the kicked player taps a new seat: same id, counted again
  const back = await join({ playerId: a, first: "Al", initial: "B", seat: "R3-7" });
  assert.equal(back.playerId, a);
  assert.equal((await snapshot()).players, 3);
  assert.equal((await me(a)).kicked, undefined);
});

test("admin key comes from a header, wrong keys are rate limited", async () => {
  assert.equal((await call("board", { query: { section: "Z", key: "test-key" } })).status, 403);   // query key ignored
  assert.equal((await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).status, 200);
  assert.equal((await call("board", { method: "POST", body: { section: "Z", key: "test-key" } })).status, 200);
  assert.equal((await call("export", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).status, 200);
  assert.equal((await call("export", { query: { section: "Z", key: "test-key" } })).status, 403);   // query key ignored
  // the two ignored query keys above were failures 1-2; eight more guesses make 10
  for (let i = 1; i <= 7; i++) await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "guess" + i } });
  assert.equal((await call("host", { method: "POST", body: { section: "Z", key: "guess8", action: "open" } })).status, 403);
  // the 11th wrong key from this address is throttled
  assert.equal((await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "guess9" } })).status, 429);
  assert.equal((await call("host", { method: "POST", body: { section: "Z", key: "guess10", action: "open" } })).status, 429);
  // ...but the right key from the same (shared campus) address still works
  assert.equal((await call("board", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).status, 200);
  assert.equal((await call("host", { method: "POST", body: { section: "Z", key: "test-key", action: "open" } })).status, 200);
  assert.equal((await call("export", { query: { section: "Z" }, headers: { "x-admin-key": "test-key" } })).status, 200);
});

test("a full room on one address can join and answer", async () => {
  const ids = [];
  for (let i = 0; i < 60; i++) {
    const seat = i < 42 ? `${i < 21 ? "L" : "R"}${1 + Math.floor((i % 21) / 7)}-${1 + (i % 7)}` : "remote";
    const r = await call("join", { method: "POST", body: { section: "Z", first: "P" + i, initial: "A", seat } });
    assert.equal(r.status, 200, "join " + i);
    ids.push(r.json.playerId);
  }
  assert.equal(new Set(ids).size, 60);
  assert.equal((await snapshot()).players, 60);
  await host("open");
  for (const id of ids) assert.deepEqual(await answer(id, 1, 2), { ok: true });
  assert.equal((await board()).answered, 60);
  // one player hammering the same question is limited per player, not per address
  assert.deepEqual(await answer(ids[0], 1, 2), { ok: false, reason: "duplicate" });
  assert.deepEqual(await answer(ids[0], 1, 2), { ok: false, reason: "duplicate" });
  const r4 = await call("answer", { method: "POST", body: { section: "Z", playerId: ids[0], q: 1, answer: 2 } });
  assert.equal(r4.status, 429);
  assert.deepEqual(await answer(ids[1], 1, 2), { ok: false, reason: "duplicate" });   // others unaffected
});

test("askJev retries 429/5xx with backoff and passes an abort signal", async () => {
  const replies = [429, 503, 200];
  const seen = [];
  const fakeFetch = async (url, init) => {
    seen.push(init.signal);
    const status = replies.shift();
    return { ok: status === 200, status, json: async () => ({ answers: { idea_0: { noul: 1 } } }) };
  };
  const rubric = { prompt: "p", ideas: [{ label: "x", ask: "a", yes: "y", no: "n" }] };
  const answers = await J.askJev(rubric, "some text here", "k", { fetch: fakeFetch, baseMs: 5, budgetMs: 5000 });
  assert.deepEqual(answers, { idea_0: { noul: 1 } });
  assert.equal(seen.length, 3);
  assert.ok(seen.every((s) => s instanceof AbortSignal));
  // 401 is not retried
  let calls = 0;
  await assert.rejects(J.askJev(rubric, "t", "k", { fetch: async () => { calls++; return { ok: false, status: 401 }; }, baseMs: 5 }), /401/);
  assert.equal(calls, 1);
  // a 429 storm gives up inside the budget
  const t0 = Date.now();
  await assert.rejects(J.askJev(rubric, "t", "k", { fetch: async () => ({ ok: false, status: 429 }), baseMs: 50, budgetMs: 800 }), /429/);
  assert.ok(Date.now() - t0 < 1200);
});

test("reveal and rejudge re-queue answers Jev could not check", async () => {
  let jevUp = false;
  game.setAskJev(async () => { if (!jevUp) throw new Error("Jev HTTP 429"); return { idea_0: { noul: 0.9 }, idea_1: { noul: 0.9 } }; });
  const a = (await join({ first: "Al", initial: "B", seat: "L1-1" })).playerId;
  const b = (await join({ first: "Bo", initial: "C", seat: "L1-2" })).playerId;
  for (let i = 0; i < 2; i++) { await host("open"); await host("reveal"); await host("next"); }
  await host("open");
  await answer(a, 3, "The loss is drawn going up; draw it below zero.");
  await answer(b, 3, "It shows a loss as a gain, put it under the zero line.");
  await game.settle();
  assert.equal((await board()).unjudged, 2);
  // reveal re-queues, Jev still down: both stay unchecked
  const rv = await host("reveal");
  assert.equal(rv.requeued, 2);
  await game.settle();
  assert.equal((await me(a)).last.note, "Could not be checked");
  // Jev back: the host presses rejudge
  jevUp = true;
  const rj = await host("rejudge");
  assert.equal(rj.requeued, 2);
  assert.equal(rj.judging, 2);
  await game.settle();
  const ma = await me(a);
  assert.equal(ma.you.points, 2000);
  assert.equal(ma.last.points, 2000);
  assert.equal((await board()).unjudged, 0);
  // nothing left to re-queue, and points are not added twice
  assert.equal((await host("rejudge")).requeued, 0);
  await game.settle();
  assert.equal((await me(b)).you.points, 2000);
  // rejudge outside an opened open-ended question is refused
  await host("reset");
  assert.ok((await host("rejudge")).error);
});

test("export: excel=1 neutralises formulas, errors stay generic", async () => {
  game.setAskJev(async () => ({ idea_0: { noul: 0 }, idea_1: { noul: 0 } }));
  const a = (await join({ first: "Al", initial: "B", seat: "L1-1" })).playerId;
  for (let i = 0; i < 2; i++) { await host("open"); await host("reveal"); await host("next"); }
  await host("open");
  await answer(a, 3, "=HYPERLINK(\"http://x\") the loss goes up");
  await game.settle();
  const h = { "x-admin-key": "test-key" };
  const raw = (await call("export", { query: { section: "Z" }, headers: h })).text;
  assert.ok(raw.includes(',"=HYPERLINK(""http://x"") the loss goes up",'));
  const xl = (await call("export", { query: { section: "Z", excel: "1" }, headers: h })).text;
  assert.ok(xl.includes(",\"'=HYPERLINK(\"\"http://x\"\") the loss goes up\","));
  store.setRedis(async () => { throw new Error("secret-token-xyz"); });
  const err = await call("export", { query: { section: "Z" }, headers: h });
  assert.equal(err.status, 500);
  assert.ok(!err.text.includes("secret"));
});
