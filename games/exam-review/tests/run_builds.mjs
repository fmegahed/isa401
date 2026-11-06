// Tests the "Build it" checks (api/_build.js) the way the site runs them.
//   node tests/run_builds.mjs                  numbers (in code) and every test screenshot through Jev once
//   node tests/run_builds.mjs x2-build-nba     only ids that start with this
//   node tests/run_builds.mjs --repeat 3       each screenshot three times (checks that verdicts are stable)
//   node tests/run_builds.mjs --numbers        only the number checks (no API calls)
// The screenshots are stand-ins drawn by make_exam02_builds.R (tests/build_shots/); each expects one flag per check,
// "is it a chart?" first. JEV_API_KEY is read from the course .Renviron and is never printed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const require = createRequire(import.meta.url);
const { parseNumber, judgeNumbers, askJevImage, judgeShots, MET } = require("../api/_build.js");
const rubrics = require("../api/_rubrics.json");
const cases = require("./build_cases.json");

const args = process.argv.slice(2);
const rep = args.includes("--repeat") ? Number(args[args.indexOf("--repeat") + 1]) : 1;
const onlyNumbers = args.includes("--numbers");
const prefix = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repeat") || "";
let failed = 0;
const ok = (m) => console.log("ok   " + m), bad = (m) => { failed += 1; console.log("FAIL " + m); };

// ---- numbers: the right answer in several formats is met; each known wrong value gets its message ----------------
const fmt = (x) => [String(x), x.toLocaleString("en-US"), "$" + x.toLocaleString("en-US"), x + "%", " " + x + " "];
for (const [id, r] of Object.entries(rubrics)) {
  if (r.kind !== "build" || !id.startsWith(prefix)) continue;
  for (const n of r.numbers) {
    const okAll = fmt(n.answer).every((v) => judgeNumbers({ numbers: [n] }, { [n.id]: v }).numbers[0].met);
    okAll ? ok(`${id}.${n.id}: ${n.answer} is accepted in every format`) : bad(`${id}.${n.id}: ${n.answer} not accepted in every format`);
    for (const w of n.wrong) {
      const v = judgeNumbers({ numbers: [n] }, { [n.id]: String(w.value) });
      !v.numbers[0].met && v.note === w.msg ? ok(`${id}.${n.id}: ${w.value} gets its message`) : bad(`${id}.${n.id}: ${w.value} -> ${JSON.stringify(v)}`);
    }
    const off = judgeNumbers({ numbers: [n] }, { [n.id]: String(n.answer + 1000) });
    !off.numbers[0].met ? ok(`${id}.${n.id}: a far-off value is not met`) : bad(`${id}.${n.id}: ${n.answer + 1000} was accepted`);
    const empty = judgeNumbers({ numbers: [n] }, {});
    !empty.numbers[0].met && empty.note === null ? ok(`${id}.${n.id}: an empty box is not met and says nothing`) : bad(`${id}.${n.id}: empty -> ${JSON.stringify(empty)}`);
  }
}
if (parseNumber("abc") !== null || parseNumber("1.2.3") !== null) bad("parseNumber accepts text"); else ok("parseNumber rejects text");

// ---- screenshots through Jev -------------------------------------------------------------------------------------
if (!onlyNumbers) {
  const env = fs.readFileSync(path.join(root, "..", "..", ".Renviron"), "utf8");
  const key = env.match(/^JEV_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)[1].trim();
  const todo = cases.filter((c) => c.id.startsWith(prefix));
  const tally = {};
  for (const c of todo) {
    const r = rubrics[c.id], b64 = fs.readFileSync(path.join(root, c.file)).toString("base64");
    for (let k = 0; k < rep; k++) {
      let v;
      try { v = judgeShots(r, await askJevImage(r, b64, "png", key)); }
      catch (e) { bad(`${c.id} ${c.file}: Jev error ${e.message}`); continue; }
      const got = [v.isChart ? 1 : 0, ...v.shots.map((s) => (s.met ? 1 : 0))];
      const same = got.every((g, i) => g === c.expect[i]);
      const probs = [v.probs.guard, ...v.probs.shots].map((p) => p.toFixed(2)).join(" ");
      const t = (tally[c.id] = tally[c.id] || { n: 0, ok: 0 }); t.n += 1; if (same) t.ok += 1;
      (same ? ok : bad)(`${c.id} ${path.basename(c.file)} (${c.kind}): got ${got.join("")} expected ${c.expect.join("")}  p = ${probs}`);
    }
  }
  for (const [id, t] of Object.entries(tally)) console.log(`${t.ok === t.n ? "ok  " : "FAIL"} ${id}: ${t.ok}/${t.n} screenshots judged as expected (met at p >= ${MET})`);
}
console.log(failed ? `\n${failed} failed` : "\nall build checks behave as intended");
process.exit(failed ? 1 : 0);
