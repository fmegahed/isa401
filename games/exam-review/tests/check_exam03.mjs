// Checks the Quiz 03 review in a headless browser (the same setup as tests/check_page.mjs: dev/server.js on a
// spare port, /api/* stubbed so nothing reaches Jev or the store).
//   node tests/check_exam03.mjs              everything, including both code tasks in real webR (needs internet)
//   node tests/check_exam03.mjs --no-webr    skip the webR runs
//   node tests/check_exam03.mjs --shots <folder>   also save a screenshot of the landing page and each unit
// It checks: the landing page opens Quiz 03 and still links Exams 01 and 02; #/exam03 lists the five units; every
// picture loads; every choice marks a wrong pick wrong and the answer right; each code task's solution passes in
// webR and its starter does not; no page scrolls sideways at 375 px; no script errors.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const args = process.argv.slice(2);
const WEBR = !args.includes("--no-webr");
const SHOTS = args.includes("--shots") ? path.resolve(args[args.indexOf("--shots") + 1]) : null;
const units = JSON.parse(fs.readFileSync(path.join(root, "units_exam03.json"), "utf8"));

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require("playwright-core"); } catch (e) {}
  const npx = path.join(os.homedir(), "AppData", "Local", "npm-cache", "_npx");
  for (const d of fs.existsSync(npx) ? fs.readdirSync(npx) : []) {
    const p = path.join(npx, d, "node_modules", "playwright-core");
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error("playwright-core not found (npm i -D playwright-core)");
}
const { chromium } = loadPlaywright();
async function launch() {
  try { return await chromium.launch(); } catch (e) {
    const dir = path.join(os.homedir(), "AppData", "Local", "ms-playwright");
    const shells = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((d) => /^chromium_headless_shell-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const d of shells) {
      const exe = path.join(dir, d, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
      if (fs.existsSync(exe)) return chromium.launch({ executablePath: exe });
    }
    throw e;
  }
}
const browser = await launch();
const PORT = Number(process.env.CHECK_PORT || 4031);
const BASE = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, [path.join(root, "dev", "server.js")], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: ["ignore", "pipe", "pipe"] });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("dev server did not start")), 15000);
  server.stdout.on("data", (d) => { if (String(d).includes("dev on")) { clearTimeout(t); resolve(); } });
  server.on("exit", (c) => reject(new Error("dev server exited with " + c)));
});

let failed = 0;
const good = (m) => console.log("ok   " + m);
const bad = (m) => { failed += 1; console.log("FAIL " + m); };
const expect = (cond, m) => (cond ? good(m) : bad(m));
const norm = (t) => String(t).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
async function newContext(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 500 ? 2 : 1 });
  await ctx.route("**/api/**", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "keep_going", ideas: [], note: null }) }));
  return ctx;
}
const errors = [];
try {
  const ctx = await newContext({ width: 1280, height: 900 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));

  // ---- the landing page ----
  await page.goto(BASE); await page.waitForTimeout(800);
  const hero = page.locator(".hero");
  expect(await hero.locator('a.solid[href="#/exam03"]').count() === 1, "landing: the hero opens the Quiz 03 review");
  expect(await hero.locator('a.line[href="#/exam02"]').count() === 1 && await hero.locator('a.line[href="#/exam01"]').count() === 1, "landing: the Exam 02 and Exam 01 reviews are still linked");
  expect(await page.locator('a.exam[href="#/exam03"]').count() === 1, "landing: Quiz 03 has a live card");
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, "landing.png"), fullPage: true }); }

  // ---- the unit list ----
  await page.goto(BASE + "#/exam03"); await page.waitForTimeout(500);
  const text = norm(await page.locator("#app").innerText());
  expect(units.every((u) => text.includes(u.title)), `#/exam03 lists all ${units.length} units`);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "exam03.png"), fullPage: true });

  for (const u of units) {
    await page.goto(BASE + "#/exam03/" + u.id); await page.waitForTimeout(700);
    const imgs = await page.evaluate(() => [...document.querySelectorAll("#app img")].map((i) => ({ src: i.getAttribute("src"), w: i.naturalWidth, alt: i.alt })));
    expect(imgs.length > 0 && imgs.every((i) => i.w > 0 && i.alt), `${u.id}: ${imgs.length} picture(s) load, each with alt text`);
    for (const s of u.steps.filter((s) => s.type === "choice")) {
      const name = "c-" + s.id;
      const card = page.locator(".card.step", { has: page.locator(`input[name="${name}"]`) });
      const wrongPick = (s.answer + 1) % s.options.length;
      await card.locator(`input[name="${name}"]`).nth(wrongPick).check();
      await card.getByRole("button", { name: /^Check/ }).click();
      const labels = card.locator("label.opt");
      const okWrong = (await labels.nth(wrongPick).getAttribute("class")).includes("wrong") && (await labels.nth(s.answer).getAttribute("class")).includes("right");
      const showsWhy = norm(await card.innerText()).includes(norm(s.why).split(" ").slice(-6).join(" "));   // the why's last words (no entities there)
      expect(okWrong && showsWhy, `${s.id}: a wrong pick is marked wrong, the answer right, and the why is shown`);
    }
    if (WEBR) for (const s of u.steps.filter((s) => s.type === "code")) {
      const card = page.locator(".card.step", { has: page.getByRole("button", { name: `Run the code for: ${s.title}` }) });
      const run = async (src) => {
        await card.locator("textarea.r").fill(src);
        await card.getByRole("button", { name: `Run the code for: ${s.title}` }).click();
        await card.locator(".result").filter({ hasText: /Correct|not right|stopped/ }).waitFor({ timeout: 240000 });
        return (await card.locator(".result").innerText()).trim();
      };
      const r1 = await run(s.starter), r2 = await run(s.solution);
      expect(!r1.startsWith("Correct") && r2.startsWith("Correct"), `${s.id}: in webR the starter does not pass and the solution does ("${r2.slice(0, 60)}")`);
    }
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, u.id + ".png"), fullPage: true });
  }

  // ---- phones ----
  const ph = await (await newContext({ width: 375, height: 800 })).newPage();
  ph.on("pageerror", (e) => errors.push(String(e)));
  for (const h of ["#/exam03", ...units.map((u) => "#/exam03/" + u.id)]) {
    await ph.goto(BASE + h); await ph.waitForTimeout(500);
    const over = await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 1, `375 px, ${h}: no sideways scroll${over > 1 ? ` (${over} px)` : ""}`);
  }
  expect(errors.length === 0, "no script errors" + (errors.length ? ": " + errors.slice(0, 2).join(" | ") : ""));
} finally {
  await browser.close(); server.kill();
}
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll Quiz 03 review checks passed.");
process.exit(failed ? 1 : 0);
