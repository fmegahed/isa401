// Tests for js/kmeans.js (run: node --test lectures/26_clustering_intro/tests/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const KM = require("../js/kmeans.js");

const P7 = [[1, 1], [1.5, 2], [3, 4], [5, 7], [3.5, 5], [4.5, 5], [3.5, 4.5]];
const close = (a, b) => a.forEach((c, i) => c.forEach((v, j) => assert.ok(Math.abs(v - b[i][j]) < 1e-3, `${v} vs ${b[i][j]}`)));

test("7 points from obs 1 and 4 converge as in the classic solution", () => {
  let centers = [[1, 1], [5, 7]];
  let a = KM.assign(P7, centers);
  assert.deepEqual(a.labels, [0, 0, 0, 1, 1, 1, 1]); // point 3 ties; the first center wins
  centers = KM.move(P7, a.labels, centers);
  close(centers, [[1.8333, 2.3333], [4.125, 5.375]]);
  a = KM.assign(P7, centers);
  assert.deepEqual(a.labels, [0, 0, 1, 1, 1, 1, 1]);
  centers = KM.move(P7, a.labels, centers);
  close(centers, [[1.25, 1.5], [3.9, 5.1]]);
  assert.deepEqual(KM.assign(P7, centers).labels, [0, 0, 1, 1, 1, 1, 1]);
});

test("assign returns every distance", () => {
  const a = KM.assign([[0, 0]], [[3, 4], [0, 1]]);
  assert.deepEqual(a.dists, [[5, 1]]);
  assert.deepEqual(a.labels, [1]);
});

test("an empty group keeps its old center", () => {
  const c = KM.move([[0, 0], [1, 1]], [0, 0], [[0, 0], [9, 9]]);
  assert.deepEqual(c[1], [9, 9]);
  assert.deepEqual(c[0], [0.5, 0.5]);
});

test("a tie goes to the lower-numbered center", () => {
  assert.deepEqual(KM.assign([[0, 0]], [[1, 0], [-1, 0]]).labels, [0]);
});

test("inertia is the sum of squared distances to own center", () => {
  assert.equal(KM.inertia([[0, 0], [2, 0]], [0, 0], [[1, 0]]), 2);
});

test("zscore matches R's scale() (sample sd)", () => {
  close(KM.zscore([[1], [2], [3]]), [[-1], [0], [1]]);
});
