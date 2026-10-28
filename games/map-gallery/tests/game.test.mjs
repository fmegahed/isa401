// node --test tests/  (in-memory store, stubbed pin checker)
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const G = require("../api/_game.js");
const { memoryRedis } = require("../dev/memory_redis.js");

process.env.ADMIN_KEY = "test-key";
const KEY = "test-key";
const IMG = "data:image/jpeg;base64," + Buffer.from("fake jpeg bytes").toString("base64");
let t0;
beforeEach(() => {
  store.setRedis(memoryRedis());
  t0 = 1_800_000_000_000;
  G.setNow(() => t0);
  G.setChecker(async (image, pins) => ({ seen: pins.map((p, i) => i !== 1), features: { per_capita: true }, form: "single_map", butlerValue: "29,627" }));
});
const host = (action, extra = {}) => G.host(Object.assign({ section: "Z", key: KEY, action }, extra), "1.2.3.4");
async function joined(first = "Maya", seat = "L1-1") {
  const r = await G.join({ section: "Z", first, initial: "q", seat });
  assert.equal(r.status, 200);
  return r.body;
}
const PINS = [{ x: 0.1, y: 0.2, kind: "Butler", text: "Butler outlined" }, { x: 0.5, y: 0.5, kind: "Color", text: "split at Ohio's rate" }];
const goodSub = (pid, extra = {}) => Object.assign({ section: "Z", playerId: pid, image: IMG, w: 900, h: 600, tool: "ChatGPT", model: "GPT-5", prompts: 6, finalPrompt: "make the title a takeaway", pins: PINS }, extra);

test("join gives a 6-character code that survives a rejoin", async () => {
  const a = await joined();
  assert.match(a.code, /^[A-HJ-NP-Z2-9]{6}$/);
  const again = await G.join({ section: "Z", first: "Maya", initial: "Q", seat: "L1-2", playerId: a.playerId });
  assert.equal(again.body.code, a.code);
  const me = await G.me({ section: "Z", playerId: a.playerId });
  assert.equal(me.body.you.code, a.code);
  assert.equal(me.body.you.initial, "Q");
});

test("plan saves drafts in the plan phase and locks when the build starts", async () => {
  const a = await joined();
  assert.equal((await G.savePlan({ section: "Z", playerId: a.playerId, plan: { measure: "x" } })).status, 409, "not in the lobby");
  await host("plan");
  assert.equal((await G.savePlan({ section: "Z", playerId: a.playerId, plan: { measure: "rate per 100k" } })).status, 200);
  assert.equal((await G.savePlan({ section: "Z", playerId: a.playerId, plan: { measure: "rate per 100k", butler: "outline" }, final: true })).body.final, true);
  await host("build");
  assert.equal((await G.savePlan({ section: "Z", playerId: a.playerId, plan: { measure: "changed" } })).status, 409);
  // a late joiner may still write one, marked late
  const b = await joined("Jae", "R2-3");
  const late = await G.savePlan({ section: "Z", playerId: b.playerId, plan: { measure: "late" } });
  assert.equal(late.status, 200);
  const me = await G.me({ section: "Z", playerId: b.playerId });
  assert.equal(me.body.plan.late, true);
});

test("submit validates, stores the image, and replaces it on resubmit", async () => {
  const a = await joined();
  await host("plan");
  assert.equal((await G.submit(goodSub(a.playerId), 100)).status, 409, "not before the build");
  await host("build");
  assert.equal((await G.submit(goodSub(a.playerId, { tool: "Bard" }), 100)).status, 400);
  assert.equal((await G.submit(goodSub(a.playerId, { pins: PINS.slice(0, 1) }), 100)).status, 400);
  assert.equal((await G.submit(goodSub(a.playerId, { pins: [{ x: 2, y: 0, kind: "Butler", text: "x" }, PINS[1]] }), 100)).status, 400);
  assert.equal((await G.submit(goodSub(a.playerId, { share: "javascript:alert(1)" }), 100)).status, 400);
  assert.equal((await G.submit(goodSub(a.playerId, { image: "data:image/png;base64,AAAA" }), 100)).status, 400);
  const r1 = await G.submit(goodSub(a.playerId), 100);
  assert.equal(r1.status, 200);
  const r2 = await G.submit(goodSub(a.playerId, { prompts: 9 }), 100);
  assert.equal(r2.body.versions, 2);
  const csv = await G.exportCsv({ section: "Z", key: KEY, ip: "x" });
  const ids = csv.text.match(/\b[a-f0-9]{24}\b/g);
  assert.equal(ids.length, 1);
  const img = await G.image({ id: ids[0], key: KEY, ip: "x" });
  assert.equal(img.body.image, IMG);
  const me = await G.me({ section: "Z", playerId: a.playerId });
  assert.equal(me.body.sub.prompts, 9);
  assert.equal(me.body.sub.imgId, undefined, "the image id is not sent to students");
});

test("check answers yes/no only, and counts at most 3 per player", async () => {
  const a = await joined();
  await host("plan"); await host("build");
  const body = { section: "Z", playerId: a.playerId, image: IMG, pins: PINS.map(({ kind, text }) => ({ kind, text })) };
  const r = await G.check(body, 100);
  assert.deepEqual(r.body.seen, [true, false]);
  assert.equal(r.body.checksLeft, 2);
  assert.equal(r.body.butlerValue, undefined, "the read value stays on the server");
  await G.check(body, 100); await G.check(body, 100);
  assert.equal((await G.check(body, 100)).status, 429);
  G.setChecker(async () => { throw new Error("down"); });
  const b = await joined("Jae", "R1-1");
  assert.equal((await G.check(Object.assign({}, body, { playerId: b.playerId }), 100)).body.status, "service_error");
  const me = await G.me({ section: "Z", playerId: b.playerId });
  assert.equal(me.body.checksLeft, 3, "a failed check does not count");
});

test("host steps through the phases; the board has counts and no maps", async () => {
  const a = await joined();
  assert.equal((await host("build")).body.error, "Not now.");
  await host("plan");
  let b = (await host("extend")).body;
  assert.equal(b.endsAt - b.startedAt, G.CLOCKS.plan + G.EXTEND_MS);
  await host("build"); await host("submit");
  await G.submit(goodSub(a.playerId), 100);
  b = (await host("close")).body;
  assert.equal(b.phase, "closed");
  assert.equal(b.submitted, 1);
  assert.equal(JSON.stringify(b).includes("data:image"), false);
  assert.equal((await G.submit(goodSub(a.playerId), 100)).status, 409);
  assert.equal((await host("reopen")).body.phase, "vote");
  const c = (await host("code", { first: "Lee", initial: "w" })).body.newCode;
  assert.match(c.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal((await G.host({ section: "Z", key: "wrong", action: "plan" }, "9.9.9.9")).status, 403);
});

test("export lists plans and maps, with formula guards on request", async () => {
  const a = await joined("=cmd");
  await host("plan");
  await G.savePlan({ section: "Z", playerId: a.playerId, plan: { measure: "=SUM(A1)", prompt: "line one\nline two" }, final: true });
  const raw = await G.exportCsv({ section: "Z", key: KEY, ip: "x" });
  assert.match(raw.text, /"line one\nline two"/);
  const xl = await G.exportCsv({ section: "Z", key: KEY, ip: "x", excel: "1" });
  assert.match(xl.text, /'=SUM\(A1\)/);
});

test("the in-class check sends back pins only, never rubric items", async () => {
  const a = await joined();
  await host("plan"); await host("build");
  const r = await G.check({ section: "Z", playerId: a.playerId, image: IMG, pins: [{ kind: "Butler", text: "outlined" }] }, 100);
  assert.deepEqual(Object.keys(r.body).sort(), ["checksLeft", "seen", "status"]);
});

test("grade runs the rubric once per image and fills the export's ai_ columns", async () => {
  const V = require("../api/_vision.js");
  let calls = 0;
  G.setGrader(async () => { calls++; return V.parseGrade({ largest_value_shown: "7.6M", butler_value_shown: null, running_total_mistake: false, measure: "raw_counts", descriptive_title: false, butler_captured: true, color_scale: "sequential", time_shown: false, extra_panels: "none", extra_panels_appropriate: false, source_caption: false, emphasis_text: false, personalized: false, rate_values_shown: false, chart_junk: "some" }); });
  const a = await joined(), b = await joined("Jae", "R1-1");
  await host("plan"); await host("build");
  await G.submit(goodSub(a.playerId), 100); await G.submit(goodSub(b.playerId), 100);
  assert.equal((await G.grade({ section: "Z", key: "wrong" }, "x")).status, 403);
  const g1 = await G.grade({ section: "Z", key: KEY }, "x");
  assert.deepEqual([g1.body.graded, g1.body.remaining], [2, 0]);
  await G.grade({ section: "Z", key: KEY }, "x");
  assert.equal(calls, 2, "already graded maps are skipped");
  await G.submit(goodSub(a.playerId), 100);          // a new image needs a new grade
  assert.equal((await G.grade({ section: "Z", key: KEY }, "x")).body.graded, 1);
  const [head, row] = parseCsv((await G.exportCsv({ section: "Z", key: KEY, ip: "x" })).text);
  assert.equal(row[head.indexOf("ai_running_total_mistake")], "TRUE", "7.6M on the legend is the summed running total");
  assert.equal(row[head.indexOf("ai_running_total_by_number")], "TRUE");
  assert.equal(row[head.indexOf("ai_scale_appropriate")], "TRUE");
  assert.equal(row[head.indexOf("ai_extra_panels_appropriate")], "TRUE", "no extra panels counts as fine");
});

test("shownNumber reads displayed numbers", () => {
  const V = require("../api/_vision.js");
  assert.equal(V.shownNumber("113,510"), 113510);
  assert.equal(V.shownNumber("7.6M"), 7600000);
  assert.equal(V.shownNumber("29.6k per 100k"), 29600);
  assert.equal(V.shownNumber(null), null);
  assert.equal(V.parseGrade({ largest_value_shown: "44,000", butler_value_shown: "29,627", running_total_mistake: false, color_scale: "diverging_other", extra_panels: "none" }).running_total_mistake, false);
});

// a small CSV reader for the tests (quoted cells, doubled quotes, newlines inside quotes)
function parseCsv(text) {
  const rows = [[]]; let cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { rows[rows.length - 1].push(cell); cell = ""; }
    else if (ch === "\n") { rows[rows.length - 1].push(cell); cell = ""; rows.push([]); }
    else cell += ch;
  }
  return rows;
}

test("shownNumber reads scientific notation from default legends", () => {
  const V = require("../api/_vision.js");
  assert.equal(V.shownNumber("2.0e+07"), 20000000);
  assert.equal(V.parseGrade({ largest_value_shown: "2.0e+07", running_total_mistake: false, extra_panels: "none" }).running_total_mistake, true);
});

test("clocks follow Fadel's times and move a minute either way", async () => {
  assert.deepEqual([G.CLOCKS.plan, G.CLOCKS.build, G.CLOCKS.submit, G.CLOCKS.vote].map((x) => x / 60000), [10, 15, 2, 6]);
  await host("plan");
  let b = (await host("shorten")).body;
  assert.equal(b.endsAt - b.startedAt, 9 * 60000);
  b = (await host("extend")).body; b = (await host("extend")).body;
  assert.equal(b.endsAt - b.startedAt, 11 * 60000);
  for (let i = 0; i < 15; i++) b = (await host("shorten")).body;
  assert.equal(b.endsAt, t0, "never shorter than now");
});

test("voting: six blind matchups, never your own map, no repeated pair", async () => {
  const people = [];
  for (let i = 0; i < 5; i++) people.push(await joined("P" + i, "L1-" + (i + 1)));
  await host("plan"); await host("build");
  for (const p of people) await G.submit(goodSub(p.playerId), 100);
  assert.equal((await G.match({ section: "Z", playerId: people[0].playerId })).status, 409, "not before the vote");
  await host("submit"); await host("vote");
  assert.equal((await G.submit(goodSub(people[0].playerId), 100)).status, 409, "no maps during the vote");
  const me = people[0].playerId;
  const csv = (await G.exportCsv({ section: "Z", key: KEY, ip: "x" })).text;
  const myImg = csv.split("\n")[1].match(/\b[a-f0-9]{24}\b/)[0];
  const seenPairs = new Set();
  for (let k = 1; k <= 6; k++) {
    const m = (await G.match({ section: "Z", playerId: me })).body;
    assert.equal(m.status, "match");
    assert.equal(m.match.n, k);
    const again = (await G.match({ section: "Z", playerId: me })).body;
    assert.equal(again.match.id, m.match.id, "a reload shows the same matchup");
    assert.notEqual(m.match.left, myImg); assert.notEqual(m.match.right, myImg);
    const key = [m.match.left, m.match.right].sort().join("|");
    assert.equal(seenPairs.has(key), false); seenPairs.add(key);
    assert.equal((await G.voteImage({ section: "Z", playerId: me, id: m.match.left })).status, 200);
    assert.equal((await G.vote({ section: "Z", playerId: me, matchId: m.match.id, choice: k % 2 ? "L" : "R", reason: "Butler" })).status, 200);
  }
  const done = (await G.match({ section: "Z", playerId: me })).body;
  assert.equal(done.status, "done");
  assert.equal((await G.voteImage({ section: "Z", playerId: people[1].playerId, id: done.seen[0] })).status, 403, "only images you were shown");
  assert.equal((await G.after({ section: "Z", playerId: me, guess: "Claude", steal: { img: done.seen[0], kind: "Color", text: "the single-hue blues" } })).status, 200);
  assert.equal((await G.after({ section: "Z", playerId: me, steal: { img: "f".repeat(24), kind: "Color", text: "x" } })).status, 400, "only maps you saw");
  const board = (await host("extend")).body;
  assert.equal(board.votes, 6); assert.equal(board.votersDone, 1);
  const votes = (await G.votesCsv({ section: "Z", key: KEY, ip: "x" })).text.trim().split("\n");
  assert.equal(votes.length, 7);
  assert.match((await G.votesCsv({ section: "Z", key: KEY, ip: "x", what: "after" })).text, /the single-hue blues/);
});

test("each section votes only on its own maps", async () => {
  const a = await G.join({ section: "A", first: "Ann", initial: "A", seat: "L1-1" });
  const hostIn = (s, action) => G.host({ section: s, key: KEY, action }, "x");
  await hostIn("A", "plan"); await hostIn("A", "build");
  await G.submit(Object.assign(goodSub(a.body.playerId), { section: "A" }), 100);
  const b1 = await G.join({ section: "B", first: "Bo", initial: "B", seat: "L1-1" });
  const b2 = await G.join({ section: "B", first: "Cy", initial: "C", seat: "L1-2" });
  await hostIn("B", "plan"); await hostIn("B", "build");
  await G.submit(Object.assign(goodSub(b2.body.playerId), { section: "B" }), 100);
  await hostIn("B", "vote");
  const m = (await G.match({ section: "B", playerId: b1.body.playerId })).body;
  assert.equal(m.status, "not_enough", "section A's map is not in section B's vote");
  const v = (await G.match({ section: "A", playerId: a.body.playerId }));
  assert.equal(v.status, 409, "section A is not voting");
});

test("results: Bradley-Terry order, personal results, plan grades from Jev", async () => {
  const V = require("../api/_vision.js");
  G.setGrader(async () => V.parseGrade({ largest_value_shown: "44,000", running_total_mistake: false, measure: "rate_per_population", descriptive_title: true, butler_captured: true, color_scale: "sequential", time_shown: false, extra_panels: "none", source_caption: true, emphasis_text: false, personalized: true, rate_values_shown: false, chart_junk: "low" }));
  G.setPlanJudge(async () => ({ idea_0: { noul: 0.9 }, idea_1: { noul: 0.2 }, wrong_0: { noul: 0.1 } }));
  const ps = [];
  for (let i = 0; i < 4; i++) ps.push(await joined("P" + i, "L2-" + (i + 1)));
  await host("plan");
  for (const p of ps) await G.savePlan({ section: "Z", playerId: p.playerId, plan: { measure: "rate", prompt: "go" }, final: true });
  await host("build");
  for (const p of ps) await G.submit(goodSub(p.playerId), 100);
  await host("submit"); await host("vote");
  // every voter prefers P0's map whenever it is shown, otherwise the left one
  const csv = (await G.exportCsv({ section: "Z", key: KEY, ip: "x" })).text;
  const p0img = parseCsv(csv)[1][parseCsv(csv)[0].indexOf("image_id")];
  for (const p of ps) {
    for (let k = 0; k < 3; k++) {
      const m = (await G.match({ section: "Z", playerId: p.playerId })).body;
      if (m.status !== "match") break;
      const choice = m.match.right === p0img ? "R" : "L";
      await G.vote({ section: "Z", playerId: p.playerId, matchId: m.match.id, choice, reason: "Color" });
    }
  }
  const g = (await G.grade({ section: "Z", key: KEY }, "x")).body;
  assert.deepEqual([g.graded, g.plansGraded, g.remaining, g.plansRemaining], [4, 4, 0, 0]);
  assert.equal((await G.results({ section: "Z", key: KEY, ip: "x" })).status, 200);
  assert.equal((await G.mine({ section: "Z", playerId: ps[0].playerId })).status, 409, "not before Fadel puts the results up");
  await host("results");
  const r = (await G.results({ section: "Z", key: KEY, ip: "x" })).body;
  const top = r.maps.slice().sort((a, b) => b.score - a.score)[0];
  assert.equal(top.first, "P0");
  assert.equal(top.losses, 0);
  assert.equal(r.maps[0].planGrade.met.includes("running_total"), true);
  assert.equal(r.maps[0].grade.scale_appropriate, true);
  assert.equal(r.ungraded, 0);
  const mine1 = (await G.mine({ section: "Z", playerId: ps[1].playerId })).body;
  assert.equal(mine1.hasMap, true);
  if (mine1.losses) assert.equal(mine1.beatenBy[0].first, "P0");
  assert.equal((await G.voteImage({ section: "Z", playerId: ps[1].playerId, id: p0img })).status, 200, "the gallery is open once results are up");
});

test("bradleyTerry ranks a map that always wins first and stays finite", () => {
  const votes = [{ L: "a", R: "b", choice: "L" }, { L: "a", R: "c", choice: "L" }, { L: "b", R: "c", choice: "T" }, { L: "c", R: "b", choice: "L" }];
  const bt = G.bradleyTerry(["a", "b", "c"], votes);
  assert.ok(bt.a > bt.c && bt.c > bt.b);
  assert.ok(Number.isFinite(bt.a));
});

test("a personal code brings the same player back on another computer", async () => {
  const a = await joined();
  const r = await G.resume({ code: a.code.toLowerCase() });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.section, r.body.playerId, r.body.first], ["Z", a.playerId, "Maya"]);
  assert.equal((await G.resume({ code: "ZZZZZZ" })).status, 404);
  assert.equal((await G.resume({ code: "abc" })).status, 400);
  await host("reset");
  assert.equal((await G.resume({ code: a.code })).status, 410, "codes from an earlier round do not work");
});

test("tiny screenshots are refused", async () => {
  const a = await joined();
  await host("plan"); await host("build");
  assert.equal((await G.submit(goodSub(a.playerId, { w: 300, h: 200 }), 100)).status, 400);
  assert.equal((await G.submit(goodSub(a.playerId, { w: 640, h: 420 }), 100)).status, 200);
});
