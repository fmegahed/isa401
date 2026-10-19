// Runs every sample answer in tests/jev_cases.json through Jev with the same rubric and thresholds
// the game uses (api/_judge.js), and reports where the verdict differs from the expected one.
//   node tests/run_jev.mjs              all open questions
//   node tests/run_jev.mjs miners       only question ids that start with "miners"
//   node tests/run_jev.mjs --repeat 3   each answer three times (checks that verdicts are stable)
// Rubrics come from content/questions.mjs (the same objects build.mjs writes to api/_questions.json).
// JEV_API_KEY is read from the course .Renviron and is never printed.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import questions from "../content/questions.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { askJev, judge } = require("../api/_judge.js");
const cases = JSON.parse(fs.readFileSync(path.join(here, "jev_cases.json"), "utf8"));
const rubrics = Object.fromEntries(questions.filter((q) => q.kind === "open")
  .map((q) => [q.id, { prompt: q.prompt, context: q.context, ideas: q.ideas, wrong: q.wrong || [] }]));

const env = fs.readFileSync(path.join(here, "..", "..", "..", ".Renviron"), "utf8");
const key = env.match(/^JEV_API_KEY\s*=\s*"?([^"\r\n]+)"?/m)[1].trim();

const args = process.argv.slice(2);
const rep = args.includes("--repeat") ? Number(args[args.indexOf("--repeat") + 1]) : 1;
const prefix = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--repeat") || "";
const todo = cases.filter((c) => c.id.startsWith(prefix)).flatMap((c) => Array.from({ length: rep }, (_, r) => ({ ...c, rep: r + 1 })));

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
await Promise.all(Array.from({ length: 6 }, worker));

let bad = 0;
const byCase = {};
for (const r of results) (byCase[`${r.id} | ${r.kind} | ${r.text.slice(0, 60)}`] ||= []).push(r);
for (const [label, rs] of Object.entries(byCase)) {
  const fails = rs.filter((r) => !r.ok);
  bad += fails.length;
  console.log(`${fails.length ? "FAIL" : "ok  "} ${rs.length - fails.length}/${rs.length}  ${label}`);
  for (const f of fails) console.log(f.error ? `      error: ${f.error}` :
    `      expected ${JSON.stringify(f.ideas)} wrong=${f.wrong}; got ${JSON.stringify(f.got)} wrong=${f.gotWrong}  ${JSON.stringify(f.probs)}`);
}
console.log(`\n${results.length - bad} of ${results.length} sample answers judged as expected (${Object.keys(byCase).length} cases x ${rep})`);
fs.writeFileSync(path.join(here, "jev_report.json"), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed: bad, results }, null, 1));
process.exit(bad ? 1 : 0);
