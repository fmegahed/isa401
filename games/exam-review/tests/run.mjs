// Runs every sample answer in tests/cases.json through Jev with the same rubric and thresholds
// the site uses (api/_judge.js), and reports where the verdict differs from the expected one.
//   node tests/run.mjs            all questions
//   node tests/run.mjs tidy-      only question ids that start with "tidy-"
//   node tests/run.mjs --repeat 3 each answer three times (checks that verdicts are stable)
// JEV_API_KEY is read from the course .Renviron and is never printed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { askJev, judge } = require("../api/_judge.js");
const rubrics = require("../api/_rubrics.json");
const cases = require("./cases.json");

const env = fs.readFileSync(path.join(here, "..", "..", "..", ".Renviron"), "utf8");
const key = env.match(/^JEV_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)[1].trim();

const args = process.argv.slice(2);
const rep = args.includes("--repeat") ? Number(args[args.indexOf("--repeat") + 1]) : 1;
const prefix = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repeat") || "";
const todo = cases.filter((c) => c.id.startsWith(prefix)).flatMap((c) => Array.from({ length: rep }, () => c));

const results = [];
let next = 0;
async function worker() {
  while (next < todo.length) {
    const c = todo[next++];
    try {
      const answers = await askJev(rubrics[c.id], c.text, key);
      const v = judge(rubrics[c.id], answers);
      const got = v.ideas.map((i) => (i.met ? 1 : 0));
      const gotWrong = v.status === "revisit";
      const ok = got.every((g, i) => c.ideas[i] === null || g === c.ideas[i]) && gotWrong === c.wrong;   // null = either is acceptable
      const probs = Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, Math.round(a.noul * 100) / 100]));
      results.push({ ...c, got, gotWrong, ok, probs });
    } catch (e) {
      results.push({ ...c, ok: false, error: String(e.message) });
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const byId = {};
for (const r of results) (byId[r.id] ||= []).push(r);
let bad = 0;
for (const [id, rs] of Object.entries(byId)) {
  const fails = rs.filter((r) => !r.ok);
  bad += fails.length;
  console.log(`${fails.length ? "FAIL" : "ok  "} ${id}  ${rs.length - fails.length}/${rs.length}`);
  for (const f of fails) {
    console.log(`      [${f.kind}] "${f.text.slice(0, 110)}"`);
    console.log(f.error ? `      error: ${f.error}` : `      expected ideas ${JSON.stringify(f.ideas)} wrong=${f.wrong}; got ${JSON.stringify(f.got)} wrong=${f.gotWrong}  ${JSON.stringify(f.probs)}`);
  }
}
console.log(`\n${results.length - bad} of ${results.length} sample answers judged as expected (${Object.keys(byId).length} questions)`);
fs.writeFileSync(path.join(here, "report.json"), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed: bad, results }, null, 1));
process.exit(bad ? 1 : 0);
