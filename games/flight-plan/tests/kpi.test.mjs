import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_KEY = "local-test";
const KPI = require("../api/_kpi.js");
const Q = require("../api/_kpi_questions.json");
const CAT = require("../api/_catalog.json");
const REVEAL = require("../api/_reveal.json");
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const G = require("../api/_game.js");
const n = (p) => ({ noul: p });
const ch = (c) => ({ choice: c, probabilities: { [c]: 1 } });

test("feedback picks only the fixed sentences for clear no's", () => {
  const f = KPI.feedbackFrom({ measurable_in_class: n(.9), two_people_same_number: n(.2), names_unit: n(.9), is_about_landing_near_x: n(.1), says_how_miss_counts: n(.1) });
  assert.equal(f.ok, false);
  assert.deepEqual(f.notes, [Q.sentences.two_people_same_number]);
  const g = KPI.feedbackFrom({ measurable_in_class: n(.9), two_people_same_number: n(.9), names_unit: n(.9), is_about_landing_near_x: n(.9), says_how_miss_counts: n(.1) });
  assert.deepEqual(g.notes, [Q.sentences.says_how_miss_counts]);
  assert.equal(KPI.feedbackFrom({ measurable_in_class: n(.5), two_people_same_number: n(.5), names_unit: n(.5), is_about_landing_near_x: n(.5), says_how_miss_counts: n(.5) }).ok, true);
});

test("no feedback sentence judges relevance, the goal or the design", () => {
  for (const s of Object.values(Q.sentences)) assert.doesNotMatch(s, /goal|matter|relevan|ball|design|crumpl|client/i, s);
});

test("matching maps a KPI to a catalog item with Fadel's relevance label, and reads the accuracy rule", () => {
  const m = KPI.matchFrom({ catalog_item: ch("accuracy"), fits_any: n(.9), states_summary: n(.9), summary: ch("average"), says_how_miss_counts: n(.9), miss_rule: ch("fixed_penalty"), combines_measures: n(.1), is_about_landing_near_x: n(.9) });
  assert.equal(m.item, "accuracy"); assert.equal(m.relevance, "tied"); assert.equal(m.summary, "average"); assert.equal(m.miss, "fixed_penalty"); assert.equal(m.isAccuracy, true);
  const o = KPI.matchFrom({ catalog_item: ch("speed_flight"), fits_any: n(.2) });
  assert.equal(o.item, "other"); assert.equal(o.relevance, "other");
  assert.equal(CAT.items.find((x) => x.id === "speed_flight").relevance, "not_tied");
});

test("every catalog item has a ball value on the reveal row", () => {
  for (const it of CAT.items) if (it.id !== "other") assert.ok(REVEAL.ballRow[it.id], it.id);
});

test("the request asks every question over one KPI's state", () => {
  const body = KPI.buildRequest({ type: "product", name: "Accuracy", definition: "avg distance" });
  assert.equal(body.model, "jev-latest");
  assert.equal(body.state.kpi.name, "Accuracy");
  assert.equal(body.questions.catalog_item.type, "choice");
  assert.ok(Object.keys(body.questions.catalog_item.criteria).includes("cycle_time"));
  assert.equal(body.questions.measurable_in_class.type, "noul");
});

beforeEach(() => store.setRedis(memoryRedis()));
test("saving a brief stores feedback and matches per row; a failed Jev call is an error row, not a no", async () => {
  let calls = 0;
  KPI.setJev(async (body) => { calls++; if (body.state.kpi.name === "Broken") throw new Error("Jev timeout");
    return { measurable_in_class: n(.9), two_people_same_number: n(.9), names_unit: n(.1), is_about_landing_near_x: n(.9), says_how_miss_counts: n(.9), catalog_item: ch("accuracy"), fits_any: n(.9), states_summary: n(.9), summary: ch("median"), miss_rule: ch("dropped"), combines_measures: n(.1) }; });
  G.setHooks(KPI.hooks(G));
  const p = (await G.join({ section: "Z", first: "A", initial: "B", seat: "L1-1" })).body.playerId;
  await G.host({ section: "Z", key: "local-test", action: "phase", to: "design" }, "ip");
  const r = await G.teamAction({ section: "Z", playerId: p, action: "saveBrief", brief: { kpis: [{ type: "product", name: "Accuracy", definition: "median distance" }, { type: "product", name: "Broken", definition: "x" }] } });
  assert.equal(r.body.feedback.rows[0].ok, false);
  assert.deepEqual(r.body.feedback.rows[0].notes, [Q.sentences.names_unit]);
  assert.equal(r.body.feedback.rows[1].error, true);
  const b = await G.host({ section: "Z", key: "local-test", action: "board" }, "ip");
  assert.equal(b.body.match.L1[0].summary, "median");
  await G.teamAction({ section: "Z", playerId: p, action: "saveBrief", brief: { kpis: [{ type: "product", name: "Accuracy", definition: "median distance" }] } });
  assert.equal(calls, 2);   // the unchanged row came from the cache; the failed row is gone
});
