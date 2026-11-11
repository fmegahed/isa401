import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_KEY = "local-test";
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const G = require("../api/_game.js");
const KEY = "local-test", S = "Z";
const host = (action, x = {}) => G.host(Object.assign({ section: S, key: KEY, action }, x), "ip");
let calls;
beforeEach(() => {
  store.setRedis(memoryRedis()); calls = [];
  G.setAI({
    compileBrief: async (notes) => { calls.push(["compile", notes.length]); return { design_process: "We tried a dart.", builder_choice: "", kpis: [{ type: "product", name: "Accuracy", definition: "avg", our_number: "" }] }; },
    transcribe: async () => "we tried a dart",
    readBoard: async (img, pairs) => { calls.push(["board", pairs]); return { X: { cx: .5, cy: .5, lx: .45, ly: .5, rx: .55, ry: .5 }, marks: [{ team: "L1", x: .52, y: .5 }] }; },
  });
});
async function join(seat) { return (await G.join({ section: S, first: "Ann", initial: "Q", seat })).body.playerId; }

test("compile merges the team's notes, saves the brief for the whole team, and is rate limited", async () => {
  const a = await join("L1-1"), b = await join("L1-2");
  await host("phase", { to: "design" });
  await G.teamAction({ section: S, playerId: a, action: "addNote", part: "design", text: "dart" });
  const r = await G.aiCompile({ section: S, playerId: a }, "ip");
  assert.equal(r.status, 200);
  assert.deepEqual(calls[0], ["compile", 1]);
  const tb = await G.team({ section: S, playerId: b });
  assert.equal(tb.body.brief.design_process, "We tried a dart.");
  assert.equal((await G.aiCompile({ section: S, playerId: b }, "ip")).status, 429);
});

test("transcribe needs a joined player in the design phase", async () => {
  const a = await join("L1-1");
  assert.equal((await G.aiTranscribe({ section: S, playerId: a, audio: "AAAA", mime: "audio/webm" }, "ip")).status, 409);
  await host("phase", { to: "design" });
  const r = await G.aiTranscribe({ section: S, playerId: a, audio: "AAAA", mime: "audio/webm" }, "ip");
  assert.equal(r.status, 200); assert.equal(r.body.text, "we tried a dart");
});

test("vision pre-fill is admin only and sends only the pairs in use", async () => {
  const a = await join("L1-1");
  await host("phase", { to: "design" });
  await G.teamAction({ section: S, playerId: a, action: "pickMarker", color: "blue", symbol: "star" });
  const up = await G.uploadPhoto({ section: S, key: KEY, kind: "teams", dataUrl: "data:image/jpeg;base64,/9j/", w: 10, h: 10 }, "ip");
  assert.equal((await G.aiVision({ section: S, key: "nope", photoId: up.body.photoId }, "ip9")).status, 403);
  const r = await G.aiVision({ section: S, key: KEY, photoId: up.body.photoId, kind: "teams" }, "ip");
  assert.equal(r.status, 200);
  assert.deepEqual(calls.at(-1)[1], { "blue|star": "L1" });
  assert.equal(r.body.marks[0].team, "L1");
});
