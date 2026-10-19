// Checks the files written by build.mjs: the public questions.json, the server-only
// api/_questions.json, and the Jev sample answers in tests/jev_cases.json.
//   node --test tests/build.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const pub = fs.existsSync(path.join(root, "questions.json")) ? read("questions.json") : [];
const server = fs.existsSync(path.join(root, "api", "_questions.json")) ? read("api/_questions.json") : [];
const cases = fs.existsSync(path.join(root, "tests", "jev_cases.json")) ? read("tests/jev_cases.json") : [];

// every string anywhere inside a value
const strings = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(strings) : []);

test("public file has 14 questions in play order", () => {
  assert.equal(pub.length, 14);
  assert.deepEqual(pub.map((q) => q.quarter), [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5]);
  assert.equal(new Set(pub.map((q) => q.id)).size, 14);
});

test("no public item has answer or rubric keys", () => {
  for (const q of pub) {
    assert.ok(!("answer" in q), `${q.id} leaks answer`);
    assert.ok(!("rubric" in q), `${q.id} leaks rubric`);
    assert.deepEqual(Object.keys(q).sort(), ["chart", "id", "kind", "options", "prompt", "quarter", "seconds", "source", "table"]);
  }
});

test("every chart file exists and every table is well formed", () => {
  for (const q of pub) {
    if (q.chart !== null) assert.ok(fs.existsSync(path.join(root, q.chart)), `${q.id}: missing ${q.chart}`);
    if (q.table !== null) {
      assert.ok(q.table.cols.length > 0 && q.table.rows.length > 0, `${q.id}: empty table`);
      for (const r of q.table.rows) assert.equal(r.length, q.table.cols.length, `${q.id}: ragged table`);
    }
  }
});

test("every item has a non-empty source with a link", () => {
  for (const q of pub) assert.match(q.source || "", /https?:\/\/\S+/, `${q.id}: source needs a URL`);
});

test("quarters 1-4 and the two-minute drill are all present", () => {
  assert.deepEqual([...new Set(pub.map((q) => q.quarter))].sort(), [1, 2, 3, 4, 5]);
});

test("exactly 2 open questions: one in quarter 1, one in the two-minute drill", () => {
  const open = pub.filter((q) => q.kind === "open");
  assert.equal(open.length, 2);
  assert.deepEqual(open.map((q) => q.quarter), [1, 5]);
  for (const q of open) assert.equal(q.options, null);
});

test("seconds are 20, 30 or 90; open questions get 90", () => {
  for (const q of pub) {
    assert.ok([20, 30, 90].includes(q.seconds), `${q.id}: ${q.seconds}`);
    assert.equal(q.kind === "open", q.seconds === 90, `${q.id}: 90 s is for open questions only`);
  }
});

test("no text field contains an em dash, 'categorical', or a reference to a class", () => {
  for (const s of [...strings(pub), ...strings(server)]) {
    assert.ok(!s.includes(String.fromCharCode(0x2014)),`em dash in: ${s.slice(0, 60)}`);
    assert.ok(!/categorical/i.test(s), `'categorical' in: ${s.slice(0, 60)}`);
    assert.ok(!/\b(in class|last class|as we saw|on wednesday|on monday|lecture)\b/i.test(s), `class reference in: ${s.slice(0, 60)}`);
  }
});

test("server file matches the public file and carries answers and rubrics", () => {
  assert.equal(server.length, pub.length);
  server.forEach((s, i) => {
    const p = pub[i];
    assert.equal(s.id, p.id);
    assert.equal(s.kind, p.kind);
    assert.equal(s.quarter, p.quarter);
    assert.equal(s.seconds, p.seconds);
    if (s.kind === "choice") {
      assert.equal(s.options, p.options.length, `${s.id}: options count`);
      assert.ok(Number.isInteger(s.answer) && s.answer >= 0 && s.answer < s.options, `${s.id}: answer index`);
      assert.ok(!("rubric" in s));
    } else {
      assert.ok(!("answer" in s));
      const r = s.rubric;
      assert.ok(r.prompt && r.context, `${s.id}: prompt and context`);
      assert.ok(r.ideas.length >= 2 && r.ideas.length <= 3, `${s.id}: 2-3 ideas`);
      assert.ok(r.wrong.length >= 1 && r.wrong.length <= 2, `${s.id}: 1-2 wrong claims`);
      for (const k of ["label", "hint", "ask", "yes", "no"]) for (const idea of r.ideas) assert.ok(idea[k], `${s.id}: idea missing ${k}`);
      for (const k of ["ask", "yes", "no", "msg"]) for (const w of r.wrong) assert.ok(w[k], `${s.id}: wrong missing ${k}`);
    }
  });
});

test("choice questions have 4 short options", () => {
  for (const q of pub.filter((x) => x.kind === "choice")) {
    assert.equal(q.options.length, 4, q.id);
    for (const o of q.options) assert.ok(o.length <= 70, `${q.id}: option too long: ${o}`);
  }
});

test("Jev cases: at least 3 good, 2 partial, and gibberish, injection, prompt-copied per open question", () => {
  for (const q of server.filter((x) => x.kind === "open")) {
    const mine = cases.filter((c) => c.id === q.id);
    const n = q.rubric.ideas.length;
    const kinds = (k) => mine.filter((c) => c.kind === k);
    assert.ok(kinds("good").length >= 3, `${q.id}: good`);
    assert.ok(kinds("partial").length >= 2, `${q.id}: partial`);
    for (const k of ["gibberish", "injection", "prompt copied back"]) assert.equal(kinds(k).length, 1, `${q.id}: ${k}`);
    for (const c of kinds("good")) assert.deepEqual(c.ideas, Array(n).fill(1));
    for (const c of kinds("partial")) assert.equal(c.ideas.filter((x) => x === 1).length, 1);
    for (const c of mine) assert.equal(c.ideas.length, n);
  }
});
