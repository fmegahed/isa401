// Checks what build.mjs writes, so a leak or a broken link is caught before a deploy.
//   node tests/check_build.mjs
// Runs `node build.mjs`, then checks that:
//   - units.json is byte-identical to the committed one (the Exam 01 review must not change);
//   - units_exam02.json exists and every Exam 02 step id starts with "x2-";
//   - no public JSON (units.json, units_exam02.json, data/*.json) has a rubric key: ask, yes, no,
//     ideas, wrong, tests or context;
//   - every x2- written question has its rubric in api/_rubrics.json (with a context when it shows a
//     chart) and sample answers in tests/cases.json;
//   - every charts[].src, ai.video, and file a step's html points to (src="..." or href="exam02/...")
//     exists on disk;
//   - every choice step's answer is a valid option index;
//   - no file in the site holds a ChatGPT chat link, and no student-facing string has an em dash.
//     ChatGPT's own words (ai.answer) are quoted verbatim, so an em dash there is only reported.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let failed = 0;
const good = (m) => console.log("ok   " + m);
const bad = (m) => { failed += 1; console.log("FAIL " + m); };
const expect = (cond, m) => (cond ? good(m) : bad(m));
const EM = String.fromCharCode(0x2014);
const CHAT = "chatgpt.com" + "/c/";   // split so this file does not match itself

// the committed Exam 01 file, to compare against after the build
let committed = null;
try { committed = execFileSync("git", ["show", "HEAD:./units.json"], { cwd: root, maxBuffer: 1 << 26 }); }
catch (e) { committed = fs.existsSync(path.join(root, "units.json")) ? fs.readFileSync(path.join(root, "units.json")) : null; console.log("note git is not available: comparing units.json with the copy on disk before the build"); }

try {
  const out = execFileSync(process.execPath, ["build.mjs"], { cwd: root, stdio: "pipe" });
  good("node build.mjs: " + String(out).trim().split("\n").join(" | "));
} catch (e) {
  bad("node build.mjs failed:\n" + String(e.stderr || e.stdout || e.message));
  process.exit(1);
}

// ---- Exam 01 unchanged ---------------------------------------------------------------------------
expect(committed && Buffer.compare(committed, fs.readFileSync(path.join(root, "units.json"))) === 0, "units.json is byte-identical to the committed one");

// ---- Exam 02 public file -------------------------------------------------------------------------
if (!fs.existsSync(path.join(root, "units_exam02.json"))) { bad("units_exam02.json was not written"); process.exit(1); }
const u1 = JSON.parse(read("units.json")), u2 = JSON.parse(read("units_exam02.json"));
good(`units_exam02.json: ${u2.length} units, ${u2.flatMap((u) => u.steps).length} steps`);
const steps2 = u2.flatMap((u) => u.steps.map((s) => ({ u, s })));
const badIds = steps2.filter(({ s }) => s.id && !s.id.startsWith("x2-")).map(({ s }) => s.id);
expect(!badIds.length, "every Exam 02 step id starts with x2-" + (badIds.length ? ": " + badIds.join(", ") : ""));
const all1 = new Set(u1.flatMap((u) => u.steps).filter((s) => s.id).map((s) => s.id));
const clash = steps2.filter(({ s }) => s.id && all1.has(s.id)).map(({ s }) => s.id);
expect(!clash.length, "no step id is used in both exams" + (clash.length ? ": " + clash.join(", ") : ""));

// ---- no rubric key in a public JSON --------------------------------------------------------------
const SECRET_KEYS = ["ask", "yes", "no", "ideas", "wrong", "tests", "context"];
function walk(x, at, fn) {
  if (Array.isArray(x)) x.forEach((v, i) => walk(v, `${at}[${i}]`, fn));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { fn(k, v, `${at}.${k}`); walk(v, `${at}.${k}`, fn); }
}
const publicFiles = ["units.json", "units_exam02.json", ...(fs.existsSync(path.join(root, "data")) ? fs.readdirSync(path.join(root, "data")).filter((f) => f.endsWith(".json")).map((f) => "data/" + f) : [])];
for (const f of publicFiles) {
  const leaks = [];
  walk(JSON.parse(read(f)), f, (k, v, at) => { if (SECRET_KEYS.includes(k)) leaks.push(at); });
  expect(!leaks.length, `${f}: no rubric keys (${SECRET_KEYS.join(", ")})` + (leaks.length ? ": " + leaks.slice(0, 5).join(", ") : ""));
}

// ---- rubrics and test answers for every x2- written question ---------------------------------------
const rubrics = JSON.parse(read("api/_rubrics.json")), cases = JSON.parse(read("tests/cases.json"));
const written2 = steps2.filter(({ s }) => s.type === "explain" || s.type === "interpret");
const noRubric = written2.filter(({ s }) => !rubrics[s.id]).map(({ s }) => s.id);
expect(!noRubric.length, `all ${written2.length} Exam 02 written questions have a rubric in api/_rubrics.json` + (noRubric.length ? ": missing " + noRubric.join(", ") : ""));
const noCtx = written2.filter(({ s }) => s.charts && !(rubrics[s.id] && rubrics[s.id].context)).map(({ s }) => s.id);
expect(!noCtx.length, "every question with a chart gives Jev a context" + (noCtx.length ? ": " + noCtx.join(", ") : ""));
const noCases = written2.filter(({ s }) => !cases.some((c) => c.id === s.id)).map(({ s }) => s.id);
expect(!noCases.length, "every Exam 02 written question has sample answers in tests/cases.json" + (noCases.length ? ": " + noCases.join(", ") : ""));
const lost = u1.flatMap((u) => u.steps).filter((s) => (s.type === "explain" || s.type === "interpret") && !rubrics[s.id]).map((s) => s.id);
expect(!lost.length, "every Exam 01 written question still has its rubric" + (lost.length ? ": missing " + lost.join(", ") : ""));

// ---- every file a step points to exists ------------------------------------------------------------
const missing = [];
const exists = (p) => fs.existsSync(path.join(root, decodeURI(p.split(/[?#]/)[0])));
for (const { u, s } of steps2) {
  for (const c of s.charts || []) { if (!c.src || !exists(c.src)) missing.push(`${s.id || u.id}: ${c.src}`); if (!c.alt) missing.push(`${s.id}: a chart without alt text`); }
  if (s.ai && s.ai.video && !exists(s.ai.video)) missing.push(`${s.id}: ${s.ai.video}`);
  walk(s, s.id || u.id, (k, v, at) => {
    if (typeof v !== "string") return;
    for (const m of v.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      const p = m[1];
      if (/^(https?:|mailto:|#|data:)/.test(p)) continue;
      if (!exists(p)) missing.push(`${at}: ${p}`);
    }
  });
}
expect(!missing.length, "every chart, recording and linked file exists" + (missing.length ? ":\n     " + missing.slice(0, 12).join("\n     ") : ""));

// ---- choice answers -------------------------------------------------------------------------------
const choices = steps2.filter(({ s }) => s.type === "choice");
const badAns = choices.filter(({ s }) => !Array.isArray(s.options) || !Number.isInteger(s.answer) || s.answer < 0 || s.answer >= s.options.length).map(({ s }) => s.id);
expect(!badAns.length, `all ${choices.length} choice steps have a valid answer index` + (badAns.length ? ": " + badAns.join(", ") : ""));

// ---- no chat links, no em dashes ------------------------------------------------------------------
const TEXT = /\.(html|js|mjs|json|md|r|py|csv|txt|svg|css)$/i;
const SKIP = new Set([".git", "node_modules", ".vercel", "recap_cache"]);
const links = [];
(function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (SKIP.has(f) || f.startsWith(".env")) continue;
    const p = path.join(dir, f), st = fs.statSync(p);
    if (st.isDirectory()) scan(p);
    else if (TEXT.test(f) && st.size < 50e6 && fs.readFileSync(p, "utf8").includes(CHAT)) links.push(path.relative(root, p));
  }
})(root);
expect(!links.length, "no file in the site holds a ChatGPT chat link" + (links.length ? ": " + links.join(", ") : ""));
const dashes = [], quoted = [];
for (const f of ["units.json", "units_exam02.json"]) {
  walk(JSON.parse(read(f)), f, (k, v, at) => {
    if (typeof v !== "string" || !v.includes(EM)) return;
    (/\.ai\.answer$/.test(at) ? quoted : dashes).push(at);
  });
}
if (read("index.html").includes(EM)) dashes.push("index.html");
expect(!dashes.length, "no em dash in student-facing copy" + (dashes.length ? ": " + dashes.slice(0, 8).join(", ") : ""));
if (quoted.length) console.log(`note ChatGPT's verbatim answer has an em dash (kept as quoted): ${quoted.join(", ")}`);

console.log(failed ? `\n${failed} build check(s) failed` : "\nAll build checks passed.");
process.exit(failed ? 1 : 0);
