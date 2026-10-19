// Checks on the player page (index.html), so a broken page is caught before a deploy.
//   node tests/check_page.mjs
// 1. the module script parses; 2. no em dashes; 3. never the word "categorical";
// 4. innerHTML is used only to insert the static seat plan (all other text goes through textContent).
// Adapted from games/exam-review/tests/check_page.mjs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
let failed = 0;
const bad = (msg) => { console.error("FAIL " + msg); failed++; };
const good = (msg) => console.log("ok   " + msg);

const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) bad("index.html has no <script type=\"module\">");
else {
  const js = m[1];
  const tmp = path.join(os.tmpdir(), "isa401_gameday_page_check.mjs");
  fs.writeFileSync(tmp, js);
  try { execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" }); good("module script: syntax ok"); }
  catch (e) { bad("module script has a syntax error:\n" + String(e.stderr).split("\n").slice(0, 8).join("\n")); }

  const inner = js.match(/\.innerHTML\s*=/g) || [];
  const planOnly = (js.match(/\$\("plan"\)\.innerHTML\s*=\s*planRes\.value/g) || []).length;
  if (inner.length !== planOnly) bad("innerHTML is assigned " + inner.length + " times; only the seat plan may use it");
  else good("innerHTML only for the seat plan");
  if (/insertAdjacentHTML|outerHTML\s*=|document\.write/.test(js)) bad("HTML-injecting API found in the script"); else good("no other HTML-injecting APIs");
  if (!/"isa401-gameday"/.test(js)) bad("localStorage key isa401-gameday missing"); else good("localStorage key present");
  if (/\/api\/state\?[^"'`]*playerId/.test(js)) bad("playerId added to /api/state (breaks the CDN cache)"); else good("/api/state has no playerId");
}

if (html.includes("—")) bad("em dash found in index.html"); else good("no em dashes");
if (/categorical/i.test(html)) bad("the word 'categorical' appears in index.html"); else good("no 'categorical'");
for (const f of ["plan.svg", "favicon.png"]) { if (!fs.existsSync(path.join(root, f))) bad(f + " missing"); else good(f + " present"); }

if (failed) { console.error(failed + " check(s) failed"); process.exit(1); }
console.log("index.html: all checks passed");
