import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.ADMIN_KEY = "local-test";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const R = require("../api/_reveal.json");
const CAT = require("../api/_catalog.json");
const store = require("../api/_store.js");
const { memoryRedis } = require("../dev/memory_redis.js");
const G = require("../api/_game.js");

// Every file the site serves: the pages, and the api functions (underscore files are bundled, never served).
const served = ["index.html", "host.html", "snap.html", ...fs.readdirSync(path.join(ROOT, "api")).filter((f) => f.endsWith(".js") && !f.startsWith("_")).map((f) => "api/" + f)];
const banned = [/ball/i, /crumpl/i, /choke/i, /lesson/i, /found it/i, /my throws/i, /tied to the goal/i, /client might value/i, /measured that/i, /supports the goal/i, R.gifs.lesson, R.gifs.choke,
  ...Object.values(R.text).map((t) => t.title), ...Object.values(R.ui), ...CAT.items.map((i) => i.desc)];

test("no served file carries the hidden lesson, the GIFs, the admin-only labels or the catalog", () => {
  for (const f of served) {
    const s = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const b of banned) {
      const hit = b instanceof RegExp ? b.test(s) : b.length > 3 && s.includes(b);
      assert.ok(!hit, `${f} contains ${b}`);
    }
  }
});

test("the public state never has recap content in any phase until the host publishes it", async () => {
  store.setRedis(memoryRedis());
  await G.join({ section: "Z", first: "A", initial: "B", seat: "L1-1" });
  for (const to of G.PHASES) {
    await G.host({ section: "Z", key: "local-test", action: "phase", to }, "ip");
    const j = JSON.stringify((await G.getState({ section: "Z" })).body);
    assert.ok(!/recap/.test(j), to);
    for (const t of Object.values(R.text)) assert.ok(!j.includes(t.title), to);
  }
});
