// How the class answered each game question, for the "How the class answered" lines in the Exam 02
// review's replays. Fadel runs it; it needs the admin key, which is never typed into a chat or a file.
//
//   ADMIN_KEY=... node dev/pull_mistakes.mjs                    all four games, sections A and B
//   GAMES=race-call ADMIN_KEY=... node dev/pull_mistakes.mjs    only some (comma-separated)
//   then: node build.mjs
//
// Environment (all read here, none printed):
//   ADMIN_KEY                 the games' admin key (Game Day's; the others use the same value)
//   <GAME>_ADMIN_KEY          optional, a different key for one game, e.g. MAP_GALLERY_ADMIN_KEY
//   GAME_DAY_URL, RACE_CALL_URL, PRESS_TIME_URL, MAP_GALLERY_URL
//                             the game addresses (defaults: the live https://isa401-<game>.vercel.app)
//   RUN_<GAME>_<SECTION>      optional, the run to read when the class run is no longer the current
//                             one, e.g. RUN_GAME_DAY_A=3 (the run number is on each host page's dock)
//   GAMES                     optional, which games to pull (default: all four)
//
// It calls each game's GET /api/export?section=A and ?section=B with the key in the x-admin-key
// header, adds the two sections up, and writes data/game_mistakes.json with counts only:
//   { "<game>:<question id>": { right: share 0 to 1, n: answers, top: most common wrong answer } }
// top is the 0-based option index for a choice question, a number for Press Time, null otherwise.
// No name, initial, seat or answer text is written. Entries for games not pulled this time are kept,
// so Race Call can be added after Class 22 without pulling the others again.
// Pie on Trial has no export endpoint (its votes are counts on the projector only), so it is skipped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const GAMES_DIR = path.join(root, "..");
const OUT = path.join(root, "data", "game_mistakes.json");
const SECTIONS = ["A", "B"];
const env = (k) => (process.env[k] || "").trim();
const KEYNAME = (g) => g.toUpperCase().replace(/-/g, "_");

// one CSV parser for all four exports (quoted fields may hold commas, quotes and line breaks)
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0]);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
const isTrue = (v) => String(v).toUpperCase() === "TRUE";
// the most common value among wrong answers
function topWrong(values) {
  const c = new Map(); for (const v of values) c.set(v, (c.get(v) || 0) + 1);
  let best = null, nb = 0; for (const [v, k] of c) if (k > nb) { best = v; nb = k; }
  return best;
}
const share = (k, n) => Math.round((1000 * k) / n) / 1000;

const GAMES = {
  // one row per answer: q (1-based), answer (option index or text), correct
  "game-day": {
    async summarise(rows) {
      const qs = JSON.parse(fs.readFileSync(path.join(GAMES_DIR, "game-day", "questions.json"), "utf8"));
      const out = {};
      qs.forEach((q, i) => {
        const rs = rows.filter((r) => Number(r.q) === i + 1);
        if (!rs.length) return;
        const wrong = rs.filter((r) => !isTrue(r.correct));
        const top = q.kind === "choice" ? topWrong(wrong.map((r) => Number(r.answer)).filter(Number.isInteger)) : null;
        out[q.id] = { right: share(rs.length - wrong.length, rs.length), n: rs.length, top };   // open questions: right = earned any points
      });
      return out;
    },
  },
  // one row per answer: race_id, answer (A to D), correct
  "race-call": {
    async summarise(rows) {
      const out = {}, ids = [...new Set(rows.map((r) => r.race_id))];
      for (const id of ids) {
        const rs = rows.filter((r) => r.race_id === id), wrong = rs.filter((r) => !isTrue(r.correct));
        const t = topWrong(wrong.map((r) => "ABCD".indexOf(r.answer)).filter((k) => k >= 0));
        out[id] = { right: share(rs.length - wrong.length, rs.length), n: rs.length, top: t };
      }
      return out;
    },
  },
  // one row per player: q1 (.twbx), q2 (cases), q3 (population), all_three, and the numbers read
  "press-time": {
    async summarise(rows) {
      const out = {};
      const col = (q, field) => {
        const rs = rows.filter((r) => r[q] !== ""); if (!rs.length) return;
        const wrong = rs.filter((r) => !isTrue(r[q]));
        const t = field ? topWrong(wrong.map((r) => r[field]).filter((v) => v !== "").map(Number).filter(Number.isFinite)) : null;
        out[q] = { right: share(rs.length - wrong.length, rs.length), n: rs.length, top: t };
      };
      col("q1"); col("q2", "cases"); col("q3", "pop"); col("all_three");
      if (out.all_three) { out.all = out.all_three; delete out.all_three; }
      return out;
    },
  },
  // one row per player: ai_<check> columns, TRUE or FALSE once the map was graded
  "map-gallery": {
    async summarise(rows) {
      const out = {};
      const cols = Object.keys(rows[0] || {}).filter((c) => c.startsWith("ai_") && !["ai_model", "ai_at"].includes(c));
      for (const c of cols) {
        const rs = rows.filter((r) => r[c] === "TRUE" || r[c] === "FALSE"); if (!rs.length) continue;
        out[c.slice(3)] = { right: share(rs.filter((r) => isTrue(r[c])).length, rs.length), n: rs.length, top: null };
      }
      return out;
    },
  },
};

const key = env("ADMIN_KEY");
if (!key) { console.error("Set ADMIN_KEY in the environment first (it is never printed)."); process.exit(1); }
const wanted = env("GAMES") ? env("GAMES").split(",").map((s) => s.trim()).filter(Boolean) : Object.keys(GAMES);
for (const g of wanted) if (!GAMES[g]) { console.error(`Unknown game "${g}". Games with an export: ${Object.keys(GAMES).join(", ")} (Pie on Trial has none).`); process.exit(1); }
console.log("Pie on Trial: skipped, it has no export endpoint.");

const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
for (const g of wanted) {
  const base = (env(KEYNAME(g) + "_URL") || `https://isa401-${g}.vercel.app`).replace(/\/+$/, "");
  const k = env(KEYNAME(g) + "_ADMIN_KEY") || key;
  let rows = [], refused = false;
  for (const s of SECTIONS) {
    const run = env(`RUN_${KEYNAME(g)}_${s}`);
    const url = `${base}/api/export?section=${s}${run ? "&run=" + encodeURIComponent(run) : ""}`;
    const r = await fetch(url, { headers: { "x-admin-key": k } });
    // a wrong key counts toward the game's lockout, so stop at the first refusal
    if (r.status === 401 || r.status === 403 || r.status === 429) { console.error(`${g}: the key was refused (HTTP ${r.status}); nothing more is asked of this game.`); refused = true; break; }
    if (!r.ok) { console.error(`${g} section ${s}: HTTP ${r.status}`); continue; }
    const got = parseCSV(await r.text());
    console.log(`${g} section ${s}${run ? " run " + run : ""}: ${got.length} rows`);
    rows = rows.concat(got);
  }
  if (refused || !rows.length) { console.log(`${g}: nothing written (earlier entries kept)`); continue; }
  const counts = await GAMES[g].summarise(rows);
  for (const k2 of Object.keys(result)) if (k2.startsWith(g + ":")) delete result[k2];
  for (const [id, v] of Object.entries(counts)) result[`${g}:${id}`] = v;
  console.log(`${g}: ${Object.keys(counts).length} questions counted`);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(`wrote ${path.relative(root, OUT)} (${Object.keys(result).length} entries, counts only). Now run: node build.mjs`);
