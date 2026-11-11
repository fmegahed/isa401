import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const S = require("../api/_score.js");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const X = { cx: 0.5, cy: 0.5, lx: 0.45, ly: 0.5, rx: 0.55, ry: 0.5 };

test("toInches scales by the X width and honors the image aspect ratio", () => {
  const r = S.toInches([{ team: "L1", x: 0.53, y: 0.5 }, { team: "L1", x: 0.5, y: 0.55 }], X, 1000, 800, 10);
  close(Math.hypot(r.L1[0].dx, r.L1[0].dy), 3);
  close(Math.hypot(r.L1[1].dx, r.L1[1].dy), 4);
});

const P = [{ dx: 3, dy: 0 }, { dx: 0, dy: 4 }, { dx: 6, dy: 8 }];
test("summaries of three landed throws", () => {
  close(S.teamScore(P, 0, { summary: "average" }).score, 17 / 3);
  close(S.teamScore(P, 0, { summary: "median" }).score, 4);
  close(S.teamScore(P, 0, { summary: "closest" }).score, 3);
  close(S.teamScore(P, 0, { summary: "farthest" }).score, 10);
  close(S.teamScore(P, 0, { summary: "hit_rate", hitN: 5 }).score, 2 / 3);
});

const P2 = [{ dx: 3, dy: 0 }, { dx: 0, dy: 4 }];
test("miss rules with one miss", () => {
  close(S.teamScore(P2, 1, { summary: "average", miss: "fixed_penalty", penaltyIn: 48 }).score, 55 / 3);
  close(S.teamScore(P2, 1, { summary: "average", miss: "worst_landed" }).score, 11 / 3);
  close(S.teamScore(P2, 1, { summary: "average", miss: "dropped" }).score, 3.5);
  assert.equal(S.teamScore(P2, 1, { summary: "average", miss: "automatic_last" }).last, true);
  close(S.teamScore(P2, 1, { summary: "hit_rate", hitN: 5, miss: "fixed_penalty", penaltyIn: 48 }).score, 2 / 3);
});

test("three misses rank last under every rule and never score 0 from distances", () => {
  for (const miss of S.MISS_RULES) for (const summary of S.SUMMARIES) {
    const r = S.teamScore([], 3, { summary, miss, penaltyIn: 48, hitN: 6 });
    if (miss === "fixed_penalty" && summary !== "spread") {
      if (summary === "hit_rate") close(r.score, 0); else close(r.score, 48);
    } else assert.equal(r.last, true, `${summary}/${miss}`);
  }
});

test("spread is the mean distance from the landed points' centroid", () => {
  close(S.teamScore([{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }], 0, { summary: "spread" }).score, 1);
  assert.equal(S.teamScore([{ dx: 0, dy: 0 }], 2, { summary: "spread", miss: "dropped" }).last, true);
});

test("rankTeams breaks ties by closest throw and puts last teams at the bottom", () => {
  const rule = { summary: "average", miss: "automatic_last" };
  const r = S.rankTeams([
    { team: "R1", points: [{ dx: 1, dy: 0 }, { dx: 9, dy: 0 }], misses: 0 },   // avg 5, closest 1
    { team: "L1", points: [{ dx: 4, dy: 0 }, { dx: 6, dy: 0 }], misses: 0 },   // avg 5, closest 4
    { team: "L2", points: [{ dx: 0, dy: 0 }], misses: 1 },                      // last
    { team: "L3", points: [{ dx: 2, dy: 0 }, { dx: 2, dy: 0 }], misses: 0 },   // avg 2
  ], rule);
  assert.deepEqual(r.map((x) => x.team), ["L3", "R1", "L1", "L2"]);
  assert.deepEqual(r.map((x) => x.rank), [1, 2, 3, 4]);
});

test("hit_rate ranks higher first and lowerIsBetter says so", () => {
  assert.equal(S.lowerIsBetter("hit_rate"), false);
  assert.equal(S.lowerIsBetter("average"), true);
  const r = S.rankTeams([
    { team: "L1", points: [{ dx: 9, dy: 0 }, { dx: 9, dy: 0 }, { dx: 1, dy: 0 }], misses: 0 },
    { team: "L2", points: [{ dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 9, dy: 0 }], misses: 0 },
  ], { summary: "hit_rate", hitN: 5 });
  assert.deepEqual(r.map((x) => x.team), ["L2", "L1"]);
});

test("whatIf ranks teams under every summary with the locked miss rule", () => {
  const w = S.whatIf([
    { team: "L1", points: [{ dx: 1, dy: 0 }, { dx: 20, dy: 0 }, { dx: 20, dy: 0 }], misses: 0 },
    { team: "L2", points: [{ dx: 5, dy: 0 }, { dx: 5, dy: 0 }, { dx: 5, dy: 0 }], misses: 0 },
  ], { summary: "average", miss: "dropped", hitN: 6 });
  assert.equal(w.closest[0].team, "L1");
  assert.equal(w.average[0].team, "L2");
  assert.deepEqual(Object.keys(w).sort(), [...S.SUMMARIES].sort());
});

test("under the fixed penalty a miss never beats a throw that landed, however far", () => {
  const r = S.rankTeams([
    { team: "L1", points: [{ dx: 50, dy: 0 }, { dx: 52, dy: 0 }, { dx: 49, dy: 0 }], misses: 0 },
    { team: "L2", points: [], misses: 3 },
  ], { summary: "average", miss: "fixed_penalty", penaltyIn: 48 });
  assert.deepEqual(r.map((x) => x.team), ["L1", "L2"]);
  assert.ok(S.effectivePenalty([{ points: [{ dx: 52, dy: 0 }] }], 48) > 52);
});

test("under spread, a team with a miss ranks below teams with none unless misses are dropped", () => {
  const entries = [
    { team: "L1", points: [{ dx: 0, dy: 0 }, { dx: 0.5, dy: 0 }], misses: 1 },                   // tight, one miss
    { team: "L2", points: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 1, dy: 0 }], misses: 0 },   // looser, no miss
  ];
  assert.deepEqual(S.rankTeams(entries, { summary: "spread", miss: "fixed_penalty", penaltyIn: 48 }).map((x) => x.team), ["L2", "L1"]);
  assert.deepEqual(S.rankTeams(entries, { summary: "spread", miss: "dropped" }).map((x) => x.team), ["L1", "L2"]);
});
