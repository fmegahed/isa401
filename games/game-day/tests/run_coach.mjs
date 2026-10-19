// Live Jev check for /api/coach rubrics: every sample answer in tests/coach_cases.json goes through
// the same askJev + verdict path as the endpoint, and each case must land in band every time.
//   node tests/run_coach.mjs              each case once
//   node tests/run_coach.mjs --repeat 3   each case three times (verdict stability)
// ideas: 1 = must be met, 0 = must not be met, null = either. wrong: whether a wrong claim must flag.
// JEV_API_KEY is read from the course .Renviron and never printed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { askJev } = require("../api/_judge.js");
const coach = require("../api/coach.js");
const cases = require("./coach_cases.json");

const NL = String.fromCharCode(10);
const envLine = fs.readFileSync(path.join(here, "..", "..", "..", ".Renviron"), "utf8").split(NL)
  .map((l) => l.trim()).find((l) => l.startsWith("JEV_API_KEY"));
if (!envLine) { console.error("JEV_API_KEY not found in the course .Renviron"); process.exit(2); }
const key = envLine.slice(envLine.indexOf("=") + 1).trim().replace(/^"|"$/g, "");

const args = process.argv.slice(2);
const rep = args.includes("--repeat") ? Number(args[args.indexOf("--repeat") + 1]) : 1;
const todo = cases.flatMap((c, n) => Array.from({ length: rep }, () => Object.assign({ n }, c)));

const results = [];
let next = 0;
async function worker() {
  while (next < todo.length) {
    const c = todo[next++];
    const rubric = coach.rubrics[c.id];
    try {
      const answers = await askJev(rubric, c.text, key, { budgetMs: 30000 });
      const v = coach.verdict(rubric, answers);
      const got = v.ideas.map((i) => (i.met ? 1 : 0));
      const gotWrong = v.status === "revisit";
      const ok = got.every((g, i) => c.ideas[i] === null || g === c.ideas[i]) && gotWrong === c.wrong;
      const probs = Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, Math.round(a.noul * 100) / 100]));
      results.push(Object.assign({}, c, { got, gotWrong, status: v.status, ok, probs }));
    } catch (e) {
      results.push(Object.assign({}, c, { ok: false, error: String(e.message) }));
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));

const byCase = {};
for (const r of results) (byCase[r.n] ||= []).push(r);
let bad = 0;
for (const rs of Object.values(byCase)) {
  const fails = rs.filter((r) => !r.ok);
  bad += fails.length;
  const c = rs[0];
  console.log(`${fails.length ? "FAIL" : "ok  "} ${c.id} [${c.kind}] ${rs.length - fails.length}/${rs.length}  "${c.text.slice(0, 70)}"`);
  for (const f of rs) {
    console.log(f.error ? `      error: ${f.error}` : `      ${f.ok ? "in band " : "OUT     "} got ${JSON.stringify(f.got)} wrong=${f.gotWrong} (expected ${JSON.stringify(f.ideas)} wrong=${f.wrong})  ${JSON.stringify(f.probs)}`);
  }
}
console.log(`${NL}${results.length - bad} of ${results.length} runs in band (${cases.length} cases x ${rep})`);
fs.writeFileSync(path.join(here, "coach_report.json"), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed: bad, results }, null, 1));
process.exit(bad ? 1 : 0);
