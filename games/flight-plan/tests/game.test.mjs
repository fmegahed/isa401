import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_KEY = "local-test";
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const G = require("../api/_game.js");
const REVEAL = require("../api/_reveal.json");
const KEY = "local-test", S = "Z";
const host = (action, extra = {}) => G.host(Object.assign({ section: S, key: KEY, action }, extra), "1.1.1.1");
async function join(seat, first = "Ann") {
  const r = await G.join({ section: S, first, initial: "Q", seat });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.playerId;
}
const act = (playerId, action, extra = {}) => G.teamAction(Object.assign({ section: S, playerId, action }, extra));
beforeEach(() => { store.setRedis(memoryRedis()); });

test("seat row is the team; moving rows moves teams and drops the old team's notes", async () => {
  const p = await join("L2-3");
  await host("phase", { to: "design" });
  assert.equal((await act(p, "addNote", { part: "design", text: "We tried a dart" })).status, 200);
  const moved = await G.join({ section: S, first: "Ann", initial: "Q", seat: "R1-1", playerId: p });
  assert.equal(moved.body.team, "R1");
  const t = await G.team({ section: S, playerId: p });
  assert.equal(t.body.team, "R1");
  assert.equal(t.body.notes.length, 0);
});

test("a player only sees and edits their own team", async () => {
  const a = await join("L1-1", "Ann"), b = await join("L2-1", "Bo");
  await host("phase", { to: "design" });
  const n = await act(a, "addNote", { part: "prod", text: "Accuracy: average distance" });
  const id = n.body.notes[0].id;
  const tb = await G.team({ section: S, playerId: b });
  assert.equal(tb.body.notes.length, 0);
  assert.notEqual((await act(b, "deleteNote", { id })).status, 200);
  assert.equal((await G.team({ section: S, playerId: "nobodynobody1" })).status, 403);
});

test("writing is closed outside the design phase", async () => {
  const a = await join("L1-1");
  await host("phase", { to: "vote" });
  assert.equal((await act(a, "addNote", { part: "design", text: "late" })).status, 409);
});

test("two teams cannot hold the same marker", async () => {
  const a = await join("L1-1"), b = await join("L2-1");
  await host("phase", { to: "design" });
  assert.equal((await act(a, "pickMarker", { color: "blue", symbol: "star" })).status, 200);
  assert.equal((await act(b, "pickMarker", { color: "blue", symbol: "star" })).status, 409);
  assert.equal((await act(a, "pickMarker", { color: "red", symbol: "circle" })).status, 200);
  assert.equal((await act(b, "pickMarker", { color: "blue", symbol: "star" })).status, 200);
});

test("vote tally locks the plurality and refuses an unresolved tie", async () => {
  const ps = [await join("L1-1"), await join("L1-2"), await join("L2-1"), await join("L2-2")];
  await host("phase", { to: "vote" });
  const v = [["average", "dropped"], ["average", "dropped"], ["average", "fixed_penalty"], ["median", "fixed_penalty"]];
  for (let i = 0; i < 4; i++) assert.equal((await G.vote({ section: S, playerId: ps[i], summary: v[i][0], miss: v[i][1] })).status, 200);
  assert.equal((await host("lockVote")).status, 409);
  const r = await host("lockVote", { miss: "dropped" });
  assert.equal(r.status, 200);
  assert.equal(r.body.state.lockedRule.summary, "average");
  assert.equal(r.body.state.lockedRule.miss, "dropped");
});

const X = { cx: 0.5, cy: 0.5, lx: 0.45, ly: 0.5, rx: 0.55, ry: 0.5 };
async function throwAndReveal() {
  await join("L1-1"); await join("L2-1");
  await host("settings", { xWidthIn: 10 });
  await host("phase", { to: "vote" });
  await host("lockVote", { summary: "average", miss: "dropped" });
  await host("phase", { to: "throws" });
  await host("marks", { kind: "teams", imgW: 1000, imgH: 800, X, marks: [
    { team: "L1", x: 0.53, y: 0.5 }, { team: "L1", x: 0.53, y: 0.5 }, { team: "L1", x: 0.53, y: 0.5 },
    { team: "L2", x: 0.6, y: 0.5 }, { team: "L2", x: 0.6, y: 0.5 }, { team: "L2", x: 0.6, y: 0.5 }] });
  return host("reveal");
}

test("reveal freezes the ranking; later team marks do not change it", async () => {
  const r = await throwAndReveal();
  assert.equal(r.status, 200, JSON.stringify(r.body.error));
  assert.equal(r.body.results.ranking[0].team, "L1");
  assert.ok(Math.abs(r.body.results.ranking[0].score - 3) < 1e-9);
  const again = await host("marks", { kind: "teams", imgW: 1000, imgH: 800, X, marks: [{ team: "L2", x: 0.5, y: 0.5 }] });
  assert.equal(again.body.results.ranking[0].team, "L1");
});

test("a tape measurement overrides one throw, re-ranks with a note, and clearing it restores the photo", async () => {
  await throwAndReveal();
  let r = await host("tape", { team: "L2", i: 0, inches: 0.1 });
  r = await host("tape", { team: "L2", i: 1, inches: 0.1 });
  r = await host("tape", { team: "L2", i: 2, inches: 0.1 });
  assert.equal(r.body.results.ranking[0].team, "L2");
  assert.match(r.body.results.tapeNote, /tape check \(3 throws\)/);
  for (const i of [0, 1, 2]) r = await host("tape", { team: "L2", i, inches: null });
  assert.equal(r.body.results.ranking[0].team, "L1");
  assert.equal(r.body.results.tapeNote, null);
});

test("phones never get lesson content before the recap is published", async () => {
  await throwAndReveal();
  await host("instructor", { color: "black", symbol: "square" });
  await host("phase", { to: "kpis" });
  const st = await G.getState({ section: S });
  const json = JSON.stringify(st.body);
  assert.equal(st.body.recap, undefined);
  for (const v of Object.values(REVEAL.text)) assert.ok(!json.includes(v.title), "leaked: " + v.title);
  assert.ok(!json.includes(REVEAL.gifs.lesson) && !json.includes(REVEAL.gifs.choke));
  assert.ok(!/black\|square/.test(json), "instructor marker leaked");
  await host("publishRecap");
  assert.ok((await G.getState({ section: S })).body.recap);
});

test("the instructor cannot take a team's marker, and scores against the frozen winner", async () => {
  const a = await join("L1-1");
  await host("phase", { to: "design" });
  await act(a, "pickMarker", { color: "blue", symbol: "star" });
  await join("L2-1");
  await host("settings", { xWidthIn: 10 });
  await host("phase", { to: "vote" });
  await host("lockVote", { summary: "average", miss: "dropped" });
  await host("marks", { kind: "teams", imgW: 1000, imgH: 800, X, marks: [{ team: "L1", x: 0.53, y: 0.5 }, { team: "L2", x: 0.6, y: 0.5 }] });
  await host("reveal");
  assert.equal((await host("instructor", { color: "blue", symbol: "star" })).status, 409);
  assert.equal((await host("instructor", { color: "red", symbol: "circle" })).status, 200);
  await host("marks", { kind: "instructor", imgW: 1000, imgH: 800, X, marks: [{ team: "INSTRUCTOR", x: 0.51, y: 0.5 }] });
  const r = await host("instructorScore");
  assert.equal(r.body.state.instructorResult.wins, true);
  assert.equal(r.body.results.ranking[0].team, "L1");
});

test("a wrong admin key is refused", async () => {
  assert.equal((await G.host({ section: S, key: "nope", action: "phase", to: "design" }, "2.2.2.2")).status, 403);
});

test("an X with no width is refused", async () => {
  const r = await host("marks", { kind: "teams", imgW: 1000, imgH: 800, X: { cx: .5, cy: .5, lx: .5, ly: .5, rx: .5, ry: .5 }, marks: [] });
  assert.equal(r.status, 400);
});

test("results keep their expiry after a tape correction", async () => {
  const seen = [];
  const mem = memoryRedis();
  store.setRedis(async (...cmd) => { seen.push(cmd); return mem(...cmd); });
  await throwAndReveal();
  seen.length = 0;
  await host("tape", { team: "L2", i: 0, inches: 1 });
  const set = seen.find((c) => c[0] === "SET" && String(c[1]).endsWith(":results"));
  assert.ok(set && set.includes("EX"), JSON.stringify(set && set.slice(0, 1)));
});

test("going back to Reveal shows the frozen results instead of recomputing them", async () => {
  await throwAndReveal();
  await host("marks", { kind: "teams", imgW: 1000, imgH: 800, X, marks: [{ team: "L2", x: 0.5, y: 0.5 }] });
  await host("phase", { to: "kpis" });
  const r = await host("reveal");
  assert.equal(r.body.state.phase, "reveal");
  assert.equal(r.body.results.ranking[0].team, "L1");
});

test("purple is one of the default marker colors and can be picked", async () => {
  const st = await G.getState({ section: S });
  assert.ok(st.body.settings.colors.includes("purple"));
  const a = await join("L1-1");
  await host("phase", { to: "design" });
  assert.equal((await act(a, "pickMarker", { color: "purple", symbol: "star" })).status, 200);
});

test("several teams can be credited for the ball, and the recap title counts them", async () => {
  await throwAndReveal();
  const r = await host("firstTeam", { teams: ["L1", "L2", "nope"] });
  assert.deepEqual(r.body.state.firstTeam, ["L1", "L2"]);
  await host("publishRecap");
  const st = (await G.getState({ section: S })).body;
  assert.equal(st.recap.text.title, "Two teams solved for the real goal.");
  assert.deepEqual(st.recap.firstTeam, ["L1", "L2"]);
});

test("one credited team keeps the one-team title", async () => {
  await throwAndReveal();
  await host("firstTeam", { teams: ["L2"] });
  await host("publishRecap");
  assert.equal((await G.getState({ section: S })).body.recap.text.title, REVEAL.text.found.title);
});

test("the host can set or change a team's marker during throws, never onto another team's pair", async () => {
  const a = await join("L1-1"); await join("L2-1");
  await host("phase", { to: "design" });
  await act(a, "pickMarker", { color: "blue", symbol: "star" });
  await host("phase", { to: "throws" });
  let r = await host("setMarker", { team: "L2", color: "blue", symbol: "star" });
  assert.equal(r.status, 409);
  r = await host("setMarker", { team: "L2", color: "red", symbol: "circle" });
  assert.equal(r.status, 200);
  assert.equal(r.body.teams.find((t) => t.team === "L2").marker, "red|circle");
  r = await host("setMarker", { team: "L1", color: "green", symbol: "square" });
  assert.equal(r.status, 200);
  r = await host("setMarker", { team: "L2", color: "blue", symbol: "star" });   // L1 released it
  assert.equal(r.status, 200);
  assert.equal((await host("setMarker", { team: "L2", color: "pink", symbol: "star" })).status, 400);
});
