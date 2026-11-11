// Jev (TypeSafe) judgments on each KPI row of a team's brief. Jev answers typed questions; code decides
// (the typesafe skill's rule). One request per row asks everything over the same state:
//   feedback  measurability only, shown to the team during design as fixed sentences from
//             _kpi_questions.json (never relevance, never design)
//   match     which catalog measure the row is, plus the accuracy summary and miss rule it states;
//             relevance comes from _catalog.json in code and is shown only in the kpis phase
// Results are cached per row text, so re-saving an unchanged row costs nothing.
const crypto = require("crypto");
const store = require("./_store");
const Q = require("./_kpi_questions.json");
const CAT = require("./_catalog.json");

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const YES = 0.7, NO = 0.3;
const TTL = 30 * 24 * 3600;
const ITEMS = {};
for (const it of CAT.items) ITEMS[it.id] = it;

// Retry and timeout rules copied from games/map-gallery/api/_judge.js askJev.
async function jevCall(body, opts = {}) {
  const key = opts.key !== undefined ? opts.key : process.env.JEV_API_KEY;
  if (!key) throw new Error("JEV_API_KEY is not set");
  const budget = opts.budgetMs || 12000, base = opts.baseMs || 400, doFetch = opts.fetch || fetch;
  const start = Date.now(), left = () => budget - (Date.now() - start);
  let last = "Jev not reached";
  for (let attempt = 0; attempt < 8 && left() > 300; attempt++) {
    let retry = false;
    try {
      const r = await doFetch(JEV_URL, { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(Math.max(1, Math.min(left(), 12000))) });
      if (r.ok) return (await r.json()).answers;
      last = "Jev HTTP " + r.status;
      retry = r.status === 429 || r.status === 529 || r.status >= 500;
    } catch (e) {
      last = e && (e.name === "TimeoutError" || e.name === "AbortError") ? "Jev timeout" : "Jev network error";
      retry = last !== "Jev timeout";
    }
    if (!retry) break;
    const wait = Math.min(4000, base * 2 ** attempt) * (0.5 + Math.random());
    if (wait > left() - 300) break;
    await new Promise((s) => setTimeout(s, wait));
  }
  throw new Error(last);
}
let ask = jevCall;
function setJev(fn) { ask = fn || jevCall; }

function buildRequest(kpi) {
  const questions = {};
  for (const [id, q] of Object.entries(Q.nouls)) questions[id] = { type: "noul", instructions: q.ask, criteria: { true: q.yes, false: q.no } };
  const cat = {};
  for (const it of CAT.items) cat[it.id] = `${it.name}: ${it.desc}`;
  questions.catalog_item = { type: "choice", instructions: Q.catalogAsk, criteria: cat };
  for (const [id, c] of Object.entries(Q.choices)) questions[id] = { type: "choice", instructions: c.ask, criteria: c.options };
  return {
    model: "jev-latest",
    state: { activity: Q.activity, kpi: { type: kpi.type === "operational" ? "operational" : "product (client)", name: kpi.name || "", definition: kpi.definition || "" } },
    questions,
  };
}

const p = (a, id) => (a && a[id] && typeof a[id].noul === "number" ? a[id].noul : null);
const c = (a, id) => (a && a[id] ? a[id].choice : null);

// Measurability feedback: a sentence only for a clear "no" (below 0.3); the unsure band says nothing.
function feedbackFrom(a) {
  const notes = [];
  for (const id of ["measurable_in_class", "two_people_same_number", "names_unit"]) {
    const v = p(a, id); if (v != null && v < NO) notes.push(Q.sentences[id]);
  }
  const aboutX = p(a, "is_about_landing_near_x"), miss = p(a, "says_how_miss_counts");
  if (aboutX != null && aboutX >= YES && miss != null && miss < NO) notes.push(Q.sentences.says_how_miss_counts);
  return { ok: notes.length === 0, notes };
}

function matchFrom(a) {
  const fits = p(a, "fits_any");
  const chosen = c(a, "catalog_item");
  const item = fits != null && fits >= 0.5 && ITEMS[chosen] ? chosen : "other";
  const aboutX = p(a, "is_about_landing_near_x");
  const isAccuracy = ["accuracy", "hit_rate", "spread"].includes(item) || (aboutX != null && aboutX >= YES);
  let summary = null;
  if (p(a, "states_summary") != null && p(a, "states_summary") >= 0.5) summary = c(a, "summary");
  else if (item === "hit_rate" || item === "spread") summary = item;
  const missStated = p(a, "says_how_miss_counts");
  return {
    item, fits, relevance: item === "other" ? "other" : ITEMS[item].relevance, type: item === "other" ? null : ITEMS[item].type,
    isAccuracy, summary, miss: missStated != null && missStated >= 0.5 ? c(a, "miss_rule") : "not_stated",
    combines: (p(a, "combines_measures") || 0) >= YES,
  };
}

function rowHash(k) { return crypto.createHash("sha1").update([k.type, k.name, k.definition].join("\u0001")).digest("hex").slice(0, 16); }

// Judge every row of a brief (cached), then store feedback and matches for the team.
async function judgeBrief(G, s, run, team, brief) {
  const rows = (brief && brief.kpis) || [];
  const cacheKey = `fp:${s}:${run}:jev`;
  const hashes = rows.map(rowHash);
  const cached = hashes.length ? await store.redis("HMGET", cacheKey, ...hashes) : [];
  const results = await Promise.all(rows.map(async (k, i) => {
    const hit = cached && cached[i] ? JSON.parse(cached[i]) : null;
    if (hit) return hit;
    if (!(k.name || "").trim() && !(k.definition || "").trim()) return { fb: { ok: false, notes: [Q.sentences.two_people_same_number] }, match: matchFrom({}) };
    try {
      const a = await ask(buildRequest(k));
      const out = { fb: feedbackFrom(a), match: matchFrom(a) };
      await store.pipe([["HSET", cacheKey, hashes[i], JSON.stringify(out)], ["EXPIRE", cacheKey, TTL]]);
      return out;
    } catch (e) { return { fb: { error: true }, match: null }; }
  }));
  const feedback = { at: Date.now(), rows: results.map((r, i) => Object.assign({ name: rows[i].name }, r.fb)) };
  const match = results.map((r) => r.match);
  await store.pipe([
    ["HSET", G.K.feedback(s, run), team, JSON.stringify(feedback)], ["EXPIRE", G.K.feedback(s, run), TTL],
    ["HSET", G.K.match(s, run), team, JSON.stringify(match)], ["EXPIRE", G.K.match(s, run), TTL],
  ]);
  return { feedback, match };
}

// Hooks for _game.js: judge on every save; at the vote and kpis phases, fill in any team still missing.
function hooks(G) {
  return {
    onBriefSaved: (s, run, team, brief) => judgeBrief(G, s, run, team, brief),
    onPhase: async (s, run, phase) => {
      if (phase !== "vote" && phase !== "kpis") return;
      const briefs = await store.redis("HGETALL", G.K.briefs(s, run));
      const jobs = [];
      for (let i = 0; briefs && i < briefs.length; i += 2) {
        const b = JSON.parse(briefs[i + 1] || "null");
        if (b) jobs.push(judgeBrief(G, s, run, briefs[i], b));
      }
      await Promise.all(jobs);
    },
  };
}

module.exports = { buildRequest, feedbackFrom, matchFrom, judgeBrief, hooks, setJev, jevCall, rowHash };
