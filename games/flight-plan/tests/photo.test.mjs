import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_KEY = "local-test";
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const G = require("../api/_game.js");
const KEY = "local-test", S = "Z";
const tiny = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");
beforeEach(() => { store.setRedis(memoryRedis()); });

test("a valid photo is stored, listed on the board and served back to the host", async () => {
  const r = await G.uploadPhoto({ section: S, key: KEY, kind: "teams", dataUrl: tiny, w: 1600, h: 1200 }, "ip");
  assert.equal(r.status, 200);
  const b = await G.host({ section: S, key: KEY, action: "board" }, "ip");
  assert.equal(b.body.photos.length, 1);
  assert.equal(b.body.photos[0].id, r.body.photoId);
  assert.equal(b.body.photos[0].w, 1600);
  const img = await G.getImage({ section: S, id: r.body.photoId, key: KEY, ip: "ip" });
  assert.equal(img.status, 200);
  assert.equal(img.type, "image/jpeg");
  assert.deepEqual([...img.buffer], [0xff, 0xd8, 0xff, 0xd9]);
});

test("oversized, wrong-type and wrong-key uploads are refused", async () => {
  const big = "data:image/jpeg;base64," + "A".repeat(1_600_001);
  assert.equal((await G.uploadPhoto({ section: S, key: KEY, kind: "teams", dataUrl: big, w: 1, h: 1 }, "ip")).status, 413);
  assert.equal((await G.uploadPhoto({ section: S, key: KEY, kind: "teams", dataUrl: "data:image/gif;base64,AAAA", w: 1, h: 1 }, "ip")).status, 400);
  assert.equal((await G.uploadPhoto({ section: S, key: "nope", kind: "teams", dataUrl: tiny, w: 1, h: 1 }, "ip2")).status, 403);
  assert.equal((await G.getImage({ section: S, id: "x", key: "nope", ip: "ip3" })).status, 403);
});
