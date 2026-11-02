// node --test tests/game.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const game = require("../api/_game.js");
const PT = require("../data.js");

process.env.ADMIN_KEY = "k";
const P = "player-one-0001", Q = "player-two-0002";
const host = (action, key = "k", section = "Z") => game.host({ section, key, action }, "ip");
const answer = (pid, chart, a, runId = 1, section = "Z") => game.answer({ section, playerId: pid, runId, chart, answer: a });
const fresh = () => store.setRedis(memoryRedis());

test("every dataset adds up to 100 in whole percents with one clear largest", () => {
  for (const d of PT.DATASETS) {
    assert.equal(d.values.reduce((a, b) => a + b, 0), 100, d.id);
    assert.ok(d.values.every(Number.isInteger), d.id);
    assert.equal(d.values.filter((v) => v === Math.max(...d.values)).length, 1, d.id);
  }
});

test("six charts: pies then the same data as bars, with the right answers", () => {
  assert.deepEqual(PT.CHARTS.map((c) => c.form), ["pie", "pie", "pie", "bar", "bar", "bar"]);
  assert.deepEqual(PT.CHARTS.map((c) => PT.LETTERS[c.answer]), ["e", "c", "a", "e", "c", "a"]);
});

test("bars carry no value labels, so the chart cannot give the answer away", () => {
  for (const c of PT.CHARTS) {
    const texts = [...PT.chartSVG(c).matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    for (const v of c.values) if (![0, 5, 10, 15, 20, 25].includes(v)) assert.ok(!texts.includes(String(v)), `${c.form} shows ${v}`);
  }
});

test("phases go lobby, play, reveal, and answers count only during play", async () => {
  fresh();
  assert.equal((await answer(P, 1, 0)).body.reason, "closed");
  assert.equal((await host("advance")).body.phase, "play");
  assert.equal((await answer(P, 1, 4)).body.ok, true);
  assert.equal((await host("advance")).body.phase, "reveal");
  assert.equal((await answer(Q, 1, 4)).body.reason, "closed");
  assert.equal((await host("advance")).body.phase, "reveal");
});

test("the first answer to a chart counts; a timeout counts as shown, not right", async () => {
  fresh();
  await host("advance");
  await answer(P, 1, 4);
  await answer(P, 1, 0);          // a second tap changes nothing
  await answer(Q, 1, -1);         // the clock ran out
  const b = (await game.board({ section: "Z", key: "k", ip: "ip" })).body;
  assert.deepEqual(b.hist[0], [0, 0, 0, 0, 1]);
  assert.equal(b.timedOut[0], 1);
  assert.equal(b.players, 2);
  assert.equal(b.done, 0);
});

test("done counts only phones that finished all six", async () => {
  fresh();
  await host("advance");
  for (const c of PT.CHARTS) await answer(P, c.n, c.answer);
  await answer(Q, 1, 0);
  const b = (await game.board({ section: "Z", key: "k", ip: "ip" })).body;
  assert.equal(b.done, 1);
  assert.equal(b.players, 2);
});

test("reset starts a new run, and an answer from the old run is refused", async () => {
  fresh();
  await host("advance");
  await answer(P, 1, 4);
  const b = (await host("reset")).body;
  assert.equal(b.phase, "lobby");
  assert.equal(b.runId, 2);
  assert.equal(b.players, 0);
  await host("advance");
  assert.equal((await answer(P, 1, 4, 1)).body.reason, "stale");
  assert.equal((await answer(P, 1, 4, 2)).body.ok, true);
});

test("sections keep separate runs", async () => {
  fresh();
  await host("advance", "k", "A");
  await answer(P, 1, 4, 1, "A");
  assert.equal((await game.board({ section: "B", key: "k", ip: "ip" })).body.players, 0);
  assert.equal((await game.getState({ section: "B" })).body.phase, "lobby");
});

test("bad input and wrong keys are refused", async () => {
  fresh();
  await host("advance");
  assert.equal((await answer(P, 7, 0)).status, 400);
  assert.equal((await answer(P, 1, 5)).status, 400);
  assert.equal((await answer("x", 1, 0)).status, 400);
  assert.equal((await game.getState({ section: "Q" })).status, 400);
  assert.equal((await host("advance", "wrong")).status, 403);
  assert.equal((await game.board({ section: "Z", key: "wrong", ip: "ip" })).status, 403);
});

test("keys never use another game's prefix in the shared store", () => {
  for (const key of [game.K.cur("A"), game.K.a("A", 1)]) assert.ok(key.startsWith("pot:"), key);
});

test("the clock is 15 seconds, and every slice and bar can be tapped", () => {
  assert.equal(PT.SECONDS, 15);
  for (const c of PT.CHARTS) {
    const opts = [...PT.chartSVG(c).matchAll(/data-opt="(\d)"/g)].map((m) => Number(m[1]));
    assert.deepEqual(opts, [0, 1, 2, 3, 4], `${c.form} chart ${c.n}`);
  }
});
