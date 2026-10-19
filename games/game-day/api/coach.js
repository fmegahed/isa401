// POST /api/coach  {"activity":"c16-describe","text":"..."}
//   -> {status:"keep_going"|"more_detail"|"revisit"|"done",
//       ideas:[{met:true,label} | {met:false,hint}], note}
// In-class writing coach for deck activities (Class 16 "Describe a Chart in Grammar"), the same
// way games/exam-review/api/check.js works: Jev returns only probabilities per rubric idea and
// wrong claim (api/_judge.js, MET 0.6, WRONG 0.6); every word the student sees comes from the
// rubric in api/_coach.json (server-only: underscore files are never served).
//
// The deck widget sends Content-Type: text/plain to skip the CORS preflight, so the body is parsed
// as JSON whatever its content type. OPTIONS still answers 204 with the CORS headers.
// CORS: the Origin is echoed for https://fmegahed.github.io, http://localhost:<port>,
// http://127.0.0.1:<port> and "null" (a deck opened from file://). No credentials.
//
// Limits (the whole class shares one campus address):
//   600 calls per address per minute (abuse ceiling), 20000 Jev calls per day for everyone (COACH_PER_DAY)
//   (gd:coach:day:{YYYY-MM-DD}, 24 h expiry; only calls that reach Jev count).
//   If Redis is unavailable, in-memory counters per instance take over (600/min per address,
//   2000 Jev calls per day per instance) and the endpoint fails closed with 503 beyond them.
// Cache: identical (activity, normalized text) verdicts are kept 10 minutes (gd:coach:c:...).
// Errors: 400 bad body or unknown activity, 405 wrong method, 429 limits, 503 {error:"unavailable"}
// when Jev fails or is not configured.
const crypto = require("crypto");
const J = require("./_judge");
const { quiet, pipe, clientIp } = require("./_store");
const rubrics = require("./_coach.json");

const MAX_CHARS = 1500;
const MIN_CHARS = 15;
const PER_MINUTE = 600;
const PER_DAY = Number(process.env.COACH_PER_DAY) || 20000;   // Jev calls per UTC day for everyone (shared Redis counter)
const LOCAL_PER_DAY = 2000;          // per-instance Jev calls per day when Redis is unavailable
const CACHE_S = 600;
const JEV_BUDGET_MS = 15000;
const ORIGIN_RE = /^(https:\/\/fmegahed\.github\.io|https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?|null)$/;

let askJevFn = J.askJev;
let nowFn = () => Date.now();

function cors(req, res) {
  const origin = String((req.headers && req.headers.origin) || "");
  res.setHeader("Vary", "Origin");
  if (ORIGIN_RE.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}

function send(res, status, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(obj));
}

function parse(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  try { return JSON.parse(Buffer.isBuffer(b) ? b.toString("utf8") : String(b || "")); } catch (e) { return null; }
}

function normalize(text) { return text.toLowerCase().replace(/\s+/g, " ").trim(); }

// Jev answers -> the student-facing verdict. Only rubric text leaves the server.
function verdict(rubric, answers) {
  const v = J.judge(rubric, answers || {});
  const ideas = v.ideas.map((x, i) => (x.met ? { met: true, label: rubric.ideas[i].label } : { met: false, hint: rubric.ideas[i].hint }));
  const note = v.status === "revisit" ? v.note : rubric.notes[v.status];
  return { status: v.status, ideas, note };
}

function shortReply(rubric) {
  return { status: "keep_going", ideas: rubric.ideas.map((i) => ({ met: false, hint: i.hint })), note: rubric.notes.short };
}

async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") { res.setHeader("Cache-Control", "no-store"); return res.status(204).send(""); }
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });

  const body = parse(req);
  const rubric = body && typeof body.activity === "string" && Object.prototype.hasOwnProperty.call(rubrics, body.activity) ? rubrics[body.activity] : null;
  if (!rubric || typeof body.text !== "string") return send(res, 400, { error: "bad request" });

  const text = Array.from(body.text.slice(0, 6000).trim()).slice(0, MAX_CHARS).join("");
  const ip = clientIp(req);
  const now = nowFn();
  const minute = Math.floor(now / 60000);
  const rl = `gd:rl:coach:${ip}:${minute}`;
  const short = text.length < MIN_CHARS;
  const cacheKey = short ? null
    : `gd:coach:c:${body.activity}:${crypto.createHash("sha256").update(normalize(text)).digest("hex").slice(0, 32)}`;

  const day = new Date(now).toISOString().slice(0, 10);
  const dayKey = `gd:coach:day:${day}`;

  // REST call 1: the per-address counter and, for real answers, the cache lookup and today's count.
  const first = await tryPipe(short ? [["INCR", rl]] : [["INCR", rl], ["GET", cacheKey], ["GET", dayKey]]);
  const redisUp = Boolean(first);
  const used = redisUp ? Number(first[0]) || 0 : localCount(`ip:${ip}:${minute}`, minute);
  if (redisUp && used === 1) await quiet("EXPIRE", rl, 120);
  if (used > PER_MINUTE) return send(res, 429, { error: "rate_limited" });
  if (short) return send(res, 200, shortReply(rubric));
  if (redisUp && first[1]) { try { return send(res, 200, JSON.parse(first[1])); } catch (e) { /* fall through */ } }

  // Cache miss. The cap is checked against today's count; the count itself moves (in REST call 2)
  // only once Jev has been called. Concurrent misses can overshoot the cap by a few calls.
  const key = process.env.JEV_API_KEY;
  if (!key) return send(res, 503, { error: "unavailable" });
  if (redisUp) {
    if ((Number(first[2]) || 0) >= PER_DAY) return send(res, 429, { error: "rate_limited" });
  } else if (localDay(day) > LOCAL_PER_DAY) {
    return send(res, 503, { error: "unavailable" });   // no shared counter: fail closed past the instance cap
  }

  let out = null;
  try {
    out = verdict(rubric, await askJevFn(rubric, text, key, { budgetMs: JEV_BUDGET_MS }));
  } catch (e) { /* counted below, then 503 */ }
  if (redisUp) {
    // REST call 2: count the Jev call, cache the verdict, start the 24 h expiry on a new day key.
    const cmds = [["INCR", dayKey]];
    if (out) cmds.push(["SET", cacheKey, JSON.stringify(out), "EX", CACHE_S]);
    if (first[2] == null) cmds.push(["EXPIRE", dayKey, 86400]);
    await tryPipe(cmds);
  }
  if (!out) return send(res, 503, { error: "unavailable" });
  return send(res, 200, out);
}

// Redis pipeline that never throws: null when the store is missing or failing.
async function tryPipe(cmds) {
  try { return await pipe(cmds); } catch (e) { return null; }
}

// Fallback counters for when Redis is unavailable (per instance, in memory).
const local = { ip: new Map(), day: "", n: 0 };
function localCount(k, minute) {
  if (local.ip.size > 5000) for (const key of local.ip.keys()) if (!key.endsWith(":" + minute)) local.ip.delete(key);
  const v = (local.ip.get(k) || 0) + 1;
  local.ip.set(k, v);
  return v;
}
function localDay(day) {
  if (local.day !== day) { local.day = day; local.n = 0; }
  return ++local.n;
}

// Test hooks (not routes).
handler.setAskJev = (fn) => { askJevFn = fn || J.askJev; };
handler.setNow = (fn) => { nowFn = fn || (() => Date.now()); };
handler.resetLocal = () => { local.ip.clear(); local.day = ""; local.n = 0; };
handler.verdict = verdict;
handler.rubrics = rubrics;
handler.ORIGIN_RE = ORIGIN_RE;
module.exports = handler;
