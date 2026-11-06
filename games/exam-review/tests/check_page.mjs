// Checks index.html, so a broken page is caught before a deploy.
//   node tests/check_page.mjs                    syntax check, then the page in a headless browser
//   node tests/check_page.mjs --update-exam01    record the Exam 01 pages as the new reference
//   node tests/check_page.mjs --shots <folder>   also save screenshots of the Exam 02 pages there
// The browser part starts dev/server.js on a spare port (CHECK_PORT, default 4027) and answers
// /api/* itself, so no answer is sent to Jev and nothing is written to the shared store.
// It checks:
//   1. the Exam 01 pages are exactly what tests/exam01_pages.json recorded (same HTML, header, title);
//   2. the Exam 02 home lists its units and shows Exam 02's own progress;
//   3. a question with charts and an AI block shows the image, our prompt, ChatGPT's answer and a
//      <video controls preload="none">; a recording that fails to load leaves the answer on the page;
//   4. a replay question marks right and wrong, shows the why, and shows the saved pick on a revisit;
//   5. a task card opens its "Check your work";
//   6. the two exams keep their progress under separate keys;
//   7. at 375 px no Exam 02 page scrolls sideways.
// Needs playwright-core: from this folder's node_modules if installed, else from the npx cache that
// the Playwright plugin uses (as games/press-time/tiktok/record_preview.mjs does).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const args = process.argv.slice(2);
const UPDATE = args.includes("--update-exam01");
const SHOTS = args.includes("--shots") ? path.resolve(args[args.indexOf("--shots") + 1]) : null;
const SNAP = path.join(here, "exam01_pages.json");
const KEY01 = "isa401_exam01_review_v1", KEY02 = "isa401_exam02_review_v1";

// ---- 1. the module script parses -----------------------------------------------------------------
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const tmp = path.join(os.tmpdir(), "isa401_review_page_check.mjs");
fs.writeFileSync(tmp, js);
try {
  execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
  console.log("ok   index.html script: syntax ok");
} catch (e) {
  console.error("index.html script has a syntax error:\n" + String(e.stderr).split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}

// ---- the browser ---------------------------------------------------------------------------------
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
// Playwright's own build if it is installed; else the newest headless shell already downloaded
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

const PORT = Number(process.env.CHECK_PORT || 4027);
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

// every page gets the same stubbed API: no Jev, no store
async function newContext(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 500 ? 2 : 1 });
  await ctx.route("**/api/**", (r) => {
    const u = r.request().url();
    if (u.includes("/api/check")) {
      let body = {}; try { body = JSON.parse(r.request().postData() || "{}"); } catch (e) {}
      return r.fulfill({ contentType: "application/json", body: JSON.stringify(body.reveal ? { ideas: [{ label: "An idea" }] } : { status: "keep_going", ideas: [], note: null }) });
    }
    return r.fulfill({ contentType: "application/json", body: "{}" });
  });
  return ctx;
}
const errors = [];
async function open(ctx, hash) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${hash}: ${e.message}`));
  await page.goto(BASE + hash);
  await page.waitForFunction(() => !document.querySelector("#app").textContent.includes("Loading the review"));
  await page.waitForTimeout(150);
  return page;
}
// what a page shows, with the recap whiteboard left out (it draws itself over time)
const capture = (page) => page.evaluate(() => {
  const app = document.querySelector("#app").cloneNode(true);
  app.querySelectorAll(".recap").forEach((c) => { c.innerHTML = ""; });
  const prog = document.querySelector("#prog");
  return { title: document.title, sub: document.querySelector("#sub").textContent, prog: prog.style.display === "none" ? null : prog.textContent, html: app.innerHTML };
});

try {
  // ---- 1. Exam 01 pages, compared with the recorded reference ------------------------------------
  const units01 = JSON.parse(fs.readFileSync(path.join(root, "units.json"), "utf8"));
  const routes01 = ["#/exam01", ...units01.map((u) => "#/exam01/" + u.id)];
  const ctx1 = await newContext({ width: 1280, height: 900 });
  const now = {};
  for (const r of routes01) { const p = await open(ctx1, r); now[r] = await capture(p); await p.close(); }
  const old = await open(ctx1, "#/" + units01[0].id);          // a link from before the landing page
  expect(old.url().endsWith("#/exam01/" + units01[0].id), "an old bare unit link still redirects to #/exam01/<unit>");
  await old.close(); await ctx1.close();
  if (UPDATE) {
    fs.writeFileSync(SNAP, JSON.stringify(now, null, 1));
    console.log(`recorded ${routes01.length} Exam 01 pages in tests/exam01_pages.json`);
  } else if (!fs.existsSync(SNAP)) bad("tests/exam01_pages.json is missing (run with --update-exam01 on a page you trust)");
  else {
    const ref = JSON.parse(fs.readFileSync(SNAP, "utf8"));
    for (const r of routes01) {
      const a = ref[r], b = now[r];
      if (!a) { bad(`${r}: not in the reference`); continue; }
      const diffs = ["title", "sub", "prog", "html"].filter((k) => a[k] !== b[k]);
      if (!diffs.length) { good(`Exam 01 unchanged: ${r}`); continue; }
      let at = 0; while (at < a.html.length && a.html[at] === b.html[at]) at += 1;
      bad(`Exam 01 changed: ${r} (${diffs.join(", ")})` + (diffs.includes("html") ? `\n     was: ...${a.html.slice(Math.max(0, at - 60), at + 80)}\n     now: ...${b.html.slice(Math.max(0, at - 60), at + 80)}` : diffs.map((k) => `\n     ${k} was "${a[k]}", now "${b[k]}"`).join("")));
    }
  }

  if (!UPDATE) {
    const units02 = JSON.parse(fs.readFileSync(path.join(root, "units_exam02.json"), "utf8"));
    // a RECAP_PREVIEW build shows silent previews and clips not switched on yet: fine locally, never deployed
    const previews = [...units01, ...units02].filter((u) => u.recap === "preview").map((u) => u.id);
    if (previews.length) console.log(`WARN this is a RECAP_PREVIEW build (silent previews: ${previews.join(", ")}); run node build.mjs before deploying`);
    const steps02 = units02.flatMap((u) => u.steps.map((s) => ({ u, s })));
    const scored02 = units02.filter((u) => !u.optional).flatMap((u) => u.steps).filter((s) => !["read", "task"].includes(s.type));
    const scored01 = units01.filter((u) => !u.optional).flatMap((u) => u.steps).filter((s) => s.type !== "read");
    const ctx = await newContext({ width: 1280, height: 900 });
    // Exam 01 progress the student already has, which nothing in Exam 02 may touch
    const mine01 = JSON.stringify({ done: { [scored01[0].id]: true }, text: {}, code: {}, speed: 1 });
    await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem(k, v); sessionStorage.setItem("seeded", "1"); } }, [KEY01, mine01]);

    // ---- 2. landing and Exam 02 home ---------------------------------------------------------------
    let page = await open(ctx, "#/");
    expect(await page.locator('a.exam[href="#/exam02"]').count() === 1, "landing: the Exam 02 card is a live link to #/exam02");
    expect(await page.locator('a.exam[href="#/exam01"]').count() === 1, "landing: the Exam 01 card is still a live link");
    await page.goto(BASE + "#/exam02"); await page.waitForTimeout(150);
    const hrefs = await page.locator("a.unit").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(JSON.stringify(hrefs) === JSON.stringify(units02.map((u) => "#/exam02/" + u.id)), `Exam 02 home lists its ${units02.length} units in order`);
    expect((await page.locator("#sub").textContent()).includes("Exam 02"), "Exam 02 home: the header says Exam 02");
    expect(await page.locator("#prog").textContent() === `0 of ${scored02.length} done`, `Exam 02 home: the header counts Exam 02's own progress (0 of ${scored02.length})`);
    expect((await page.title()).includes("Exam 02"), "Exam 02 home: the tab title says Exam 02");

    // ---- 3. a question with charts and an AI block ------------------------------------------------
    const aiq = steps02.find(({ s }) => s.type === "explain" && s.charts && s.ai);
    if (!aiq) bad("no Exam 02 question has both charts and an AI block");
    else {
      const { u, s } = aiq;
      await page.goto(BASE + "#/exam02/" + u.id); await page.waitForTimeout(200);
      const card = page.locator(".card.step", { has: page.locator(`img[src="${s.charts[0].src}"]`) }).first();
      expect(await card.count() === 1, `${s.id}: the chart image is on the page`);
      expect((await card.locator("img").first().getAttribute("alt")) === s.charts[0].alt, `${s.id}: the image has its alt text`);
      const text = norm(await card.innerText());
      expect(text.includes(norm(s.ai.prompt)), `${s.id}: our prompt to ChatGPT is shown`);
      expect(text.includes(norm(s.ai.answer)), `${s.id}: ChatGPT's answer is shown as text`);
      expect(text.includes(s.ai.date), `${s.id}: the date of the run is shown`);
      expect((await card.locator(".kind").textContent()).trim() === "Check the AI", `${s.id}: labelled "Check the AI"`);
      const vid = card.locator(`video[controls][preload="none"][playsinline][src="${s.ai.video}"]`);
      expect(await vid.count() === 1, `${s.id}: a <video controls preload="none" playsinline> with the recording`);
      expect(!(await vid.isVisible()), `${s.id}: the video stays closed until asked for`);
      const toggle = card.getByRole("button", { name: /Watch the recording/ });
      expect((await toggle.textContent()).includes(`(${s.ai.seconds} s)`), `${s.id}: the toggle gives the length (${s.ai.seconds} s)`);
      await toggle.click();
      expect(await vid.isVisible() && (await toggle.getAttribute("aria-expanded")) === "true", `${s.id}: "Watch the recording" opens the video`);
      // a recording that cannot load leaves the answer in place and says so
      const ctxBlocked = await newContext({ width: 1280, height: 900 });
      await ctxBlocked.route("**/*.mp4", (r) => r.abort());
      const pb = await open(ctxBlocked, "#/exam02/" + u.id);
      const cb = pb.locator(".card.step", { has: pb.locator(`img[src="${s.charts[0].src}"]`) }).first();
      await cb.getByRole("button", { name: /Watch the recording/ }).click();
      await cb.locator("video").evaluate((v) => v.play().catch(() => {}));
      await pb.waitForTimeout(800);
      const ans = cb.locator(".aitext");
      expect(await ans.isVisible() && norm(await ans.innerText()) === norm(s.ai.answer), `${s.id}: with the video blocked, the answer text is still on the page`);
      expect(await cb.locator(".vidnote").isVisible(), `${s.id}: with the video blocked, the page says the recording did not load`);
      await ctxBlocked.close();
    }

    // ---- 4. a replay question ----------------------------------------------------------------------
    const cq = steps02.find(({ s }) => s.type === "choice");
    if (!cq) bad("no Exam 02 choice step (is content/exam02_replays.mjs there?)");
    else {
      const { u, s } = cq;
      await page.goto(BASE + "#/exam02/" + u.id); await page.waitForTimeout(200);
      const name = "c-" + s.id;
      const card = page.locator(".card.step", { has: page.locator(`input[name="${name}"]`) });
      expect((await card.locator(".kind").textContent()).trim().startsWith("Replay"), `${s.id}: labelled "Replay"`);
      expect(await card.locator("fieldset legend").count() === 1 && await card.locator(`label input[type=radio][name="${name}"]`).count() === s.options.length, `${s.id}: options are radio buttons inside labels, in a fieldset with a legend`);
      const wrongPick = (s.answer + 1) % s.options.length;
      await card.locator(`input[name="${name}"]`).nth(wrongPick).check();
      await card.getByRole("button", { name: /^Check/ }).click();
      const labels = card.locator("label.opt");
      expect((await labels.nth(wrongPick).getAttribute("class")).includes("wrong") && (await labels.nth(s.answer).getAttribute("class")).includes("right"), `${s.id}: a wrong pick is marked wrong and the answer is marked right`);
      const why = norm(s.why).slice(0, 40);
      expect(norm(await card.innerText()).includes(why), `${s.id}: the why is shown`);
      expect(await page.locator("#prog").textContent() === `1 of ${scored02.length} done`, `${s.id}: answering counts as done in the Exam 02 header`);
      const st = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY02));
      expect(st.choice && st.choice[s.id] === wrongPick && st.done[s.id] === true, `${s.id}: the pick is saved under ${KEY02}`);
      expect(await page.evaluate((k) => localStorage.getItem(k), KEY01) === mine01, `Exam 01's saved progress (${KEY01}) is untouched`);
      await page.reload(); await page.waitForTimeout(300);
      const card2 = page.locator(".card.step", { has: page.locator(`input[name="${name}"]`) });
      expect(await card2.locator(`input[name="${name}"]`).nth(wrongPick).isChecked() && norm(await card2.innerText()).includes(why), `${s.id}: on a revisit the saved pick and the reveal are shown`);
      await card2.getByRole("button", { name: /Try it again/ }).click();
      await card2.locator(`input[name="${name}"]`).nth(s.answer).check();
      await card2.getByRole("button", { name: /^Check/ }).click();
      expect((await card2.locator(".cresult").textContent()).startsWith("Right"), `${s.id}: the right pick says so`);
    }

    // ---- 5. a task card ----------------------------------------------------------------------------
    const tq = steps02.find(({ s }) => s.type === "task");
    if (!tq) bad("no Exam 02 task step");
    else {
      await page.goto(BASE + "#/exam02/" + tq.u.id); await page.waitForTimeout(200);
      const card = page.locator(".card.step.task").first();
      expect((await card.locator(".kind").textContent()).trim() === "Try it", `task in ${tq.u.id}: labelled "Try it"`);
      const b = card.getByRole("button", { name: /Check your work/ });
      expect(!(await card.locator(".taskcheck").isVisible()), `task in ${tq.u.id}: the check is closed at first`);
      await b.click();
      expect(await card.locator(".taskcheck").isVisible() && (await b.getAttribute("aria-expanded")) === "true", `task in ${tq.u.id}: "Check your work" opens the check`);
    }

    // ---- 6. Exam 01 still counts its own progress ----------------------------------------------------
    await page.goto(BASE + "#/exam01"); await page.waitForTimeout(150);
    expect(await page.locator("#prog").textContent() === `1 of ${scored01.length} done`, `Exam 01 header still counts only Exam 01 (1 of ${scored01.length})`);
    await ctx.close();

    // ---- 7. phone width: no sideways scroll on any Exam 02 page --------------------------------------
    const phone = await newContext({ width: 375, height: 812 });
    for (const hash of ["#/", "#/exam02", ...units02.map((u) => "#/exam02/" + u.id)]) {
      const p = await open(phone, hash);
      // open everything a student can open: recordings, checks, and every replay answered
      await p.evaluate(() => {
        document.querySelectorAll("button.vidtoggle, button.checktoggle").forEach((b) => b.click());
        document.querySelectorAll("fieldset.choices").forEach((f) => { const r = f.querySelector("input[type=radio]"); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); } });
        document.querySelectorAll("button.ccheck").forEach((b) => b.click());
      });
      await p.waitForLoadState("networkidle").catch(() => {});
      await p.waitForTimeout(300);
      const wide = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= vw) return null;
        const out = [];
        document.querySelectorAll("#app *").forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > vw + 1 && out.length < 3) out.push(`${e.tagName.toLowerCase()}.${[...e.classList].join(".")} (right edge ${Math.round(r.right)})`); });
        return `${document.documentElement.scrollWidth}px wide: ${out.join("; ")}`;
      });
      expect(!wide, `375 px, ${hash}: no sideways scroll${wide ? " (" + wide + ")" : ""}`);
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await p.screenshot({ path: path.join(SHOTS, `375_${hash.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "landing"}.png`), fullPage: true });
      }
      await p.close();
    }
    await phone.close();
    if (SHOTS) {
      const desk = await newContext({ width: 1280, height: 900 });
      for (const hash of ["#/", "#/exam02", ...units02.map((u) => "#/exam02/" + u.id)]) {
        const p = await open(desk, hash);
        await p.evaluate(() => document.querySelectorAll("button.vidtoggle").forEach((b) => b.click()));
        await p.waitForTimeout(300);
        await p.screenshot({ path: path.join(SHOTS, `1280_${hash.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "landing"}.png`), fullPage: true });
        await p.close();
      }
      await desk.close();
      console.log("screenshots in " + SHOTS);
    }
  }
  expect(!errors.length, "no script errors on any page" + (errors.length ? ":\n     " + errors.slice(0, 5).join("\n     ") : ""));
} catch (e) {
  bad("the check stopped: " + (e.stack || e.message));
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed} page check(s) failed` : "\nAll page checks passed.");
process.exit(failed ? 1 : 0);
