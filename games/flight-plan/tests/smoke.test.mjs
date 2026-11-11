import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");

test("memory store round-trips a hash and HSETNX is first-wins", async () => {
  store.setRedis(memoryRedis());
  await store.redis("HSET", "fp:t", "a", "1");
  assert.equal(await store.redis("HGET", "fp:t", "a"), "1");
  assert.equal(await store.redis("HSETNX", "fp:t", "pair", "L1"), 1);
  assert.equal(await store.redis("HSETNX", "fp:t", "pair", "L2"), 0);
  assert.equal(await store.redis("HGET", "fp:t", "pair"), "L1");
});
