// Live check of the rubric (gpt-6-luna) on test maps: node tests/run_grade.mjs [png ...]
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const l of fs.readFileSync(new URL("../../../.Renviron", import.meta.url), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const V = require("../api/_vision.js");
const files = process.argv.slice(2).length ? process.argv.slice(2) : ["tests/shots/rubric_bad.png", "tests/shots/test_map.png", "tests/shots/rubric_good.png"];
await Promise.all(files.map(async (f) => {
  const t = Date.now();
  const g = await V.gradeMap("data:image/png;base64," + fs.readFileSync(f).toString("base64"));
  console.log("== " + f + " (" + (Date.now() - t) + " ms)\n" + JSON.stringify(g));
}));
