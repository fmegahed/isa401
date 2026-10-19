// Game Day at Yager: all game logic. The api/*.js handlers are thin wrappers around this module.
// Not a function of its own: Vercel ignores underscore-prefixed files in api/.
//
// Section pointer: gd:{s}:cur is one hash {run, state, players, kicks}, so the public snapshot
// (GET /api/state) costs a single HGETALL and is cached 1 s by the Vercel CDN.
//   run      current run number (HINCRBY on reset; never expires)
//   state    JSON {phase, q, openedAt, closedAt, revealedQ, seq}
//   players  active player count (kicked players are not counted)
//   kicks    seat steals so far; the snapshot's seq = state.seq + kicks, so a phone whose seat was
//            taken sees seq move and refetches /api/me
//
// Phase model:
//   q is the 1-based question number (questions()[q - 1]); q = 0 means no question yet.
//   lobby                       players join; q = 0
//   closed, openedAt = null     "pre-open": question q is chosen (after `next`) but its clock has
//                               not started. Clients see opened:false and show a waiting screen.
//   open                        the clock runs from openedAt for seconds*1000 ms. Once that time
//                               has passed the server reports phase "closed" without a write.
//   closed, openedAt set        time is up (or the host pressed close); waiting for reveal
//   reveal                      question q is scored; correct index, results and points visible
//   break                       between quarters (leaderboard plus seat map for the quarter)
//   final                       end of the game
// Host actions: open    (lobby -> open q=1, or pre-open -> open)
//               close   (open -> closed)
//               reveal  (open/closed after opening -> reveal; scores question q once and re-queues
//                        open answers Jev could not check)
//               rejudge (open question already opened: re-queue answers Jev could not check)
//               next    (lobby/reveal/break -> pre-open q+1, or final after the last question)
//               break   (reveal -> break)
//               final   (any phase except an opened, unrevealed question -> final)
//               reset   (any -> new run in the lobby)
// Every successful action adds 1 to state.seq. An action that does not fit the phase changes
// nothing; the board comes back with `error`.
//
// Secrecy: a choice question's correct index and every answer's points stay inside the answer
// hash until reveal. The leaderboard (zset) only grows at reveal, so `points`, `rank` and `top`
// never move before a question is revealed.
//
// Scoring race safety: reveal marks the question in gd:{s}:{run}:scored (HSETNX) before it reads
// the answers; an answer or a Jev verdict that lands later writes its record first and then checks
// that mark. Either way points are added once, guarded by HSETNX on gd:{s}:{run}:counted.
const fs = require("fs");
const crypto = require("crypto");
const store = require("./_store");
const J = require("./_judge");

const SECTIONS = ["A", "B", "Z"];
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const PID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const TTL = 30 * 24 * 3600;          // 30-day expiry on every per-run key
const GRACE_MS = 1500;               // network grace after the clock runs out
const MAX_TEXT = 600;                // open answers are cut to this many characters
const MIN_TEXT = 15;                 // shorter open answers are not sent to Jev
const JEV_BUDGET_MS = 20000;         // retries with backoff fit inside this
const STALE_MS = 35000;              // a verdict still pending this long counts as unchecked
const REJUDGE_CONCURRENCY = 6;
const TOP_N = 5;
const PER_MINUTE = 600;              // per-address ceiling for join/answer, abuse protection only: a whole
                                     // section shares one campus address (45+ joins in 2 min, 45+ answers in seconds)
const ANSWER_CALLS_PER_Q = 3;        // answer calls per player per question (the first answer counts; retries allowed)
const ADMIN_FAILS = 10;              // wrong admin keys per address per minute before 429
const NO_CHECK = "Could not be checked";
const SNAPSHOT_CACHE = "public, s-maxage=1, stale-while-revalidate=1";

// ---------- questions (server-only file; tests point GD_QUESTIONS at a fixture)
let QS = null;
function questions() {
  if (!QS) {
    QS = process.env.GD_QUESTIONS
      ? JSON.parse(fs.readFileSync(process.env.GD_QUESTIONS, "utf8"))
      : require("./_questions.json");
  }
  return QS;
}
function setQuestions(arr) { QS = arr; }
function optionCount(q) {
  if (typeof q.options === "number") return q.options;
  if (Array.isArray(q.options)) return q.options.length;
  return Number(q.n) || 4;
}

// ---------- injectable clock and judge (tests)
let nowFn = () => Date.now();
function setNow(fn) { nowFn = fn || (() => Date.now()); }
let askJevFn = J.askJev;
function setAskJev(fn) { askJevFn = fn || J.askJev; }
const pending = new Set();
async function settle() { while (pending.size) await Promise.allSettled([...pending]); }

// Vercel keeps the function alive for promises handed to waitUntil (what @vercel/functions does
// under the hood; same as games/data-import/api/_report.js). Elsewhere it is a no-op.
function keepAlive(promise) {
  try {
    const ctx = globalThis[Symbol.for("@vercel/request-context")];
    const s = ctx && typeof ctx.get === "function" ? ctx.get() : null;
    if (s && typeof s.waitUntil === "function") s.waitUntil(promise);
  } catch (e) { /* ignore */ }
}
function track(p) {
  const q = p.catch(() => {});
  pending.add(q);
  q.finally(() => pending.delete(q));
  keepAlive(q);
  return q;
}

// ---------- keys
const K = {
  cur: (s) => `gd:${s}:cur`,
  players: (s, r) => `gd:${s}:${r}:players`,
  seats: (s, r) => `gd:${s}:${r}:seats`,
  a: (s, r, q) => `gd:${s}:${r}:a:${q}`,
  lb: (s, r) => `gd:${s}:${r}:lb`,
  scored: (s, r) => `gd:${s}:${r}:scored`,
  counted: (s, r) => `gd:${s}:${r}:counted`,
};

// ---------- pure functions
// Double points: 2000 for an instant right answer down to 1000 at the buzzer.
function points(correct, elapsedMs, durationMs) {
  if (!correct) return 0;
  const d = Math.max(1, Number(durationMs) || 1);
  const e = Math.min(Math.max(0, Number(elapsedMs) || 0), d);
  return Math.min(2000, Math.max(1000, Math.round(2 * (1000 - 500 * e / d))));
}

// Open questions: share of rubric ideas met, double points, no speed component.
function openPoints(metCount, ideaCount) {
  const n = Number(ideaCount) || 0;
  if (n <= 0) return 0;
  const m = Math.min(Math.max(0, Number(metCount) || 0), n);
  return Math.round(2000 * m / n);
}

// Tags and HTML-special characters are removed (not escaped: pages render with textContent, so an
// escaped "&lt;" would show literally), along with control, zero-width and bidi characters.
// Max 20 characters.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g;
function sanitizeName(s) {
  if (typeof s !== "string") return null;
  let t = s.normalize("NFC")
    .replace(/<[^>]*>?/g, "")
    .replace(/[<>&"'`]/g, "")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim();
  t = Array.from(t).slice(0, 20).join("").trim();
  return t || null;
}

function sanitizeInitial(s) {
  const t = String(s == null ? "" : s).trim();
  return /^[A-Za-z]$/.test(t) ? t.toUpperCase() : null;
}

// ---------- helpers
const ok = (body, cache) => ({ status: 200, body, cache });
const fail = (status, error) => ({ status, body: { error } });
function sectionOf(v) { const s = String(v || "").trim().toUpperCase(); return SECTIONS.includes(s) ? s : null; }
function pidOf(v) { const p = String(v || ""); return PID_RE.test(p) ? p : null; }
function parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function parseHash(flat, json = true) {
  const o = {};
  for (let i = 0; flat && i < flat.length; i += 2) o[flat[i]] = json ? parseJSON(flat[i + 1]) : flat[i + 1];
  return o;
}
function keyMatches(key) {
  const k = process.env.ADMIN_KEY;
  if (!k || typeof key !== "string") return false;
  const a = Buffer.from(key), b = Buffer.from(k);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// null when allowed; otherwise 403 (wrong key) or 429 (too many wrong keys from this address).
// The right key always works: only wrong keys are counted, so guessing from the shared campus
// address can never lock the host out.
async function adminCheck(key, ip) {
  if (keyMatches(key)) return null;
  const rl = `gd:rl:admin:${ip || "local"}:${Math.floor(nowFn() / 60000)}`;
  const n = Number(await store.quiet("INCR", rl)) || 0;
  if (n === 1) await store.quiet("EXPIRE", rl, 120);
  return n > ADMIN_FAILS ? fail(429, "Too many wrong keys. Wait a minute.") : fail(403, "Wrong key.");
}

const LOBBY = { phase: "lobby", q: 0, openedAt: null, closedAt: null, revealedQ: 0, seq: 0 };
function parseState(raw) { return Object.assign({}, LOBBY, parseJSON(raw) || {}); }

async function readCur(s) {
  const h = parseHash(await store.redis("HGETALL", K.cur(s)), false);
  if (h.run == null) await store.redis("HSETNX", K.cur(s), "run", "1");
  return { run: Number(h.run) || 1, st: parseState(h.state), players: Math.max(0, Number(h.players) || 0), kicks: Number(h.kicks) || 0 };
}
function saveState(s, st) { return store.redis("HSET", K.cur(s), "state", JSON.stringify(st)); }

// What clients see at time `now`.
function view(st, now) {
  const question = questions()[st.q - 1] || null;
  const dur = question ? question.seconds * 1000 : 0;
  let phase = st.phase, remainingMs = null, endsAt = null;
  if (phase === "open") {
    endsAt = st.openedAt + dur;
    if (endsAt > now) remainingMs = endsAt - now; else { phase = "closed"; endsAt = null; }
  }
  return {
    phase, q: st.q, remainingMs, endsAt, question, dur,
    opened: st.openedAt != null,
    revealed: st.q > 0 && st.revealedQ === st.q,
  };
}

// Non-secret facts about the current question that phones and the host page need.
function meta(v) {
  const q = v.question;
  return {
    total: questions().length,
    kind: q ? q.kind : null,
    quarter: q ? q.quarter : null,
    seconds: q ? q.seconds : null,
    options: q && q.kind === "choice" ? optionCount(q) : null,
    opened: v.opened,
  };
}

const since = (rec) => rec.retryAt || rec.at;
const isFresh = (rec, now) => Boolean(rec && rec.pending && now - since(rec) <= STALE_MS);
// Open answers Jev did not check: failed, or pending so long the background job must have died.
const needsJudging = (rec, now) => Boolean(rec && !rec.judged && !isFresh(rec, now) && typeof rec.answer === "string");

// A player's result for one question, as shown after reveal. Notes come from the rubric only.
function resultFor(rec, now) {
  if (!rec) return { correct: false, points: 0, note: "No answer" };
  if (rec.pending) {
    if (!isFresh(rec, now)) return { correct: false, points: 0, note: NO_CHECK };
    return { correct: false, points: 0, note: "Reviewing answers", pending: true };
  }
  return { correct: Boolean(rec.correct), points: rec.points || 0, note: rec.note || null };
}

async function limited(ip, kind) {
  const minute = Math.floor(nowFn() / 60000);
  const key = `gd:rl:${kind}:${ip}:${minute}`;
  const used = await store.quiet("INCR", key);
  if (used === 1) await store.quiet("EXPIRE", key, 120);
  return Boolean(used && used > PER_MINUTE);
}

// ---------- scoring
async function claimAndAdd(s, run, items) {
  if (!items.length) return;
  const claims = await store.pipe(items.map(([q, pid]) => ["HSETNX", K.counted(s, run), `${q}:${pid}`, "1"]));
  const adds = items.filter((_, i) => Number(claims[i]) === 1).map(([, pid, pts]) => ["ZINCRBY", K.lb(s, run), pts, pid]);
  await store.pipe([...adds, ["EXPIRE", K.counted(s, run), TTL], ["EXPIRE", K.lb(s, run), TTL]]);
}

// Called after a final record is written: if the question was already revealed, add its points now.
async function settleRecord(s, run, q, pid, rec) {
  if (!rec.judged || !(rec.points > 0)) return;
  if (!(await store.redis("HGET", K.scored(s, run), String(q)))) return;
  await claimAndAdd(s, run, [[q, pid, rec.points]]);
}

// Returns the question's answer records (read after the scored mark is set).
async function scoreQuestion(s, run, q) {
  const first = await store.redis("HSETNX", K.scored(s, run), String(q), "1");
  await store.quiet("EXPIRE", K.scored(s, run), TTL);
  const recs = parseHash(await store.redis("HGETALL", K.a(s, run, q)));
  if (Number(first) === 1) {
    const items = Object.entries(recs).filter(([, r]) => r && r.judged && r.points > 0).map(([pid, r]) => [q, pid, r.points]);
    await claimAndAdd(s, run, items);
  }
  return recs;
}

// ---------- Jev
function withTimeout(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error("Jev timeout")), ms); })])
    .finally(() => clearTimeout(t));
}

async function judgeText(rubric, text) {
  const ideas = rubric.ideas || [];
  if (text.length < MIN_TEXT) {
    return { judged: true, met: 0, metIdx: [], points: 0, correct: false, note: "Too short to earn points" };
  }
  // askJev retries within the budget and aborts its own requests; the outer timeout is a backstop.
  const answers = await withTimeout(
    Promise.resolve().then(() => askJevFn(rubric, text, process.env.JEV_API_KEY || "", { budgetMs: JEV_BUDGET_MS })),
    JEV_BUDGET_MS + 2000);
  const v = J.judge(rubric, answers || {});
  const metIdx = v.ideas.map((x, i) => (x.met ? i : -1)).filter((i) => i >= 0);
  const pts = openPoints(metIdx.length, ideas.length);
  const labels = metIdx.map((i) => ideas[i].label);
  let note = labels.length ? "Covered: " + labels.join("; ") : "Did not cover the key ideas";
  if (v.note) note = v.note + " " + note;   // v.note is a wrong claim's msg, written in the rubric
  return { judged: true, met: metIdx.length, metIdx, points: pts, correct: pts > 0, note };
}

// Judge one stored (pending) record and write the verdict; never throws.
async function runJudge(s, run, q, pid, rec, question) {
  let result;
  try { result = await judgeText(question.rubric || { ideas: [] }, rec.answer); }
  catch (e) { result = { judged: false, correct: false, points: 0, note: NO_CHECK }; }
  const final = Object.assign({}, rec, result);
  delete final.pending;
  try {
    await store.redis("HSET", K.a(s, run, q), pid, JSON.stringify(final));
    await settleRecord(s, run, q, pid, final);
  } catch (e) { /* record stays pending; it reads as "Could not be checked" once stale */ }
}

// Re-queue every answer to question q that Jev could not check, a few at a time so a burst of
// failures does not become a burst of retries. Returns how many were queued.
async function requeue(s, run, q, question, recs) {
  if (!question || question.kind !== "open") return 0;
  const now = nowFn();
  const todo = Object.entries(recs || {}).filter(([, r]) => needsJudging(r, now))
    .map(([pid, r]) => [pid, Object.assign({}, r, { pending: true, judged: false, retryAt: now })]);
  if (!todo.length) return 0;
  await store.pipe(todo.map(([pid, r]) => ["HSET", K.a(s, run, q), pid, JSON.stringify(r)]));
  track((async () => {
    let i = 0;
    const worker = async () => { while (i < todo.length) { const [pid, r] = todo[i++]; await runJudge(s, run, q, pid, r, question); } };
    await Promise.all(Array.from({ length: Math.min(REJUDGE_CONCURRENCY, todo.length) }, worker));
  })());
  return todo.length;
}

// ---------- endpoints
async function join(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const first = sanitizeName(body.first);
  if (!first) return fail(400, "Enter your first name.");
  const initial = sanitizeInitial(body.initial);
  if (!initial) return fail(400, "Enter one letter for your last initial.");
  const raw = String(body.seat || "").trim();
  const seat = raw.toLowerCase() === "remote" ? "remote" : raw.toUpperCase();
  if (seat !== "remote" && !SEAT_RE.test(seat)) return fail(400, "Pick a seat.");

  const { run } = await readCur(s);
  let pid = pidOf(body.playerId);
  let prev = null;
  if (pid) {
    prev = parseJSON(await store.redis("HGET", K.players(s, run), pid));
    if (!prev) pid = null;   // unknown in this run (for example after a reset): start fresh
  }
  if (!pid) pid = crypto.randomBytes(12).toString("base64url");

  const rec = { first, initial, seat, joinedAt: prev ? prev.joinedAt : nowFn(), kicked: false };
  const cmds = [
    ["HSET", K.players(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.players(s, run), TTL],
    ["ZADD", K.lb(s, run), "NX", 0, pid], ["EXPIRE", K.lb(s, run), TTL],
  ];
  if (!prev || prev.kicked) cmds.push(["HINCRBY", K.cur(s), "players", 1]);
  if (prev && !prev.kicked && prev.seat !== "remote" && prev.seat !== seat) {
    if ((await store.redis("HGET", K.seats(s, run), prev.seat)) === pid) cmds.push(["HDEL", K.seats(s, run), prev.seat]);
  }
  if (seat !== "remote") {
    // re-tapping a seat overwrites it; the previous holder's record is marked kicked
    const holder = await store.redis("HGET", K.seats(s, run), seat);
    if (holder && holder !== pid) {
      const old = parseJSON(await store.redis("HGET", K.players(s, run), holder));
      if (old && !old.kicked && old.seat === seat) {
        old.kicked = true;
        cmds.push(["HSET", K.players(s, run), holder, JSON.stringify(old)],
          ["HINCRBY", K.cur(s), "players", -1], ["HINCRBY", K.cur(s), "kicks", 1]);
      }
    }
    cmds.push(["HSET", K.seats(s, run), seat, pid], ["EXPIRE", K.seats(s, run), TTL]);
  }
  await store.pipe(cmds);
  return ok({ playerId: pid, runId: run });
}

// Public, non-personal snapshot: one HGETALL, CDN-cached for 1 s.
async function getState(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const cur = await readCur(s);
  const now = nowFn();
  const v = view(cur.st, now);
  return ok(Object.assign({
    runId: cur.run, phase: v.phase, q: v.q, endsAt: v.endsAt, serverNow: now, remainingMs: v.remainingMs,
    players: cur.players, seq: (cur.st.seq || 0) + cur.kicks,
  }, meta(v)), SNAPSHOT_CACHE);
}

// Personal view: called on join and whenever the snapshot's runId, seq, phase or q changes.
async function me(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const cur = await readCur(s);
  const now = nowFn();
  const v = view(cur.st, now);
  const base = { runId: cur.run, serverNow: now, phase: v.phase, q: v.q, seq: (cur.st.seq || 0) + cur.kicks };
  const pid = pidOf(query.playerId);
  if (!pid) return ok(Object.assign(base, { you: null, last: null, kicked: true }));
  const showLast = v.revealed && ["reveal", "break", "final"].includes(v.phase);
  const cmds = [["HGET", K.players(s, cur.run), pid], ["ZSCORE", K.lb(s, cur.run), pid], ["ZREVRANK", K.lb(s, cur.run), pid]];
  if (showLast) cmds.push(["HGET", K.a(s, cur.run, cur.st.q), pid]);
  const [pRaw, score, rank, aRaw] = await store.pipe(cmds);
  const p = parseJSON(pRaw);
  if (!p || p.kicked) return ok(Object.assign(base, { you: null, last: null, kicked: true }));
  return ok(Object.assign(base, {
    you: { first: p.first, seat: p.seat, points: Number(score) || 0, rank: rank == null ? null : Number(rank) + 1 },
    last: showLast ? resultFor(parseJSON(aRaw), now) : null,
    model: showLast && v.question && v.question.kind === "open" ? v.question.model || null : null,
  }));
}

async function answer(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const closed = ok({ ok: false, reason: "closed" });
  const unknown = ok({ ok: false, reason: "unknown" });
  const pid = pidOf(body.playerId);
  if (!pid) return unknown;
  const rl = `gd:rl:ans:${s}:${pid}:${Number(body.q) || 0}`;
  const calls = Number(await store.quiet("INCR", rl)) || 0;
  if (calls === 1) await store.quiet("EXPIRE", rl, 600);
  if (calls > ANSWER_CALLS_PER_Q) return fail(429, "Too many tries for this question.");
  const { run, st } = await readCur(s);
  const p = parseJSON(await store.redis("HGET", K.players(s, run), pid));
  if (!p || p.kicked) return unknown;

  const now = nowFn();
  const q = Number(body.q);
  const question = questions()[st.q - 1];
  if (!question || q !== st.q || st.openedAt == null || st.revealedQ === st.q || !["open", "closed"].includes(st.phase)) return closed;
  const dur = question.seconds * 1000;
  const end = Math.min(st.openedAt + dur, st.closedAt == null ? Infinity : st.closedAt) + GRACE_MS;
  if (now > end) return closed;

  let rec;
  if (question.kind === "choice") {
    const a = typeof body.answer === "number" ? body.answer : (/^\d+$/.test(String(body.answer)) ? Number(body.answer) : NaN);
    if (!Number.isInteger(a) || a < 0 || a >= optionCount(question)) return unknown;
    const elapsed = Math.max(0, now - st.openedAt);
    const correct = a === Number(question.answer);
    rec = { answer: a, at: now, elapsed, correct, points: points(correct, elapsed, dur), judged: true };
  } else {
    if (typeof body.answer !== "string") return unknown;
    const text = Array.from(body.answer.replace(/\s+/g, " ").trim()).slice(0, MAX_TEXT).join("");
    rec = { answer: text, at: now, judged: false, pending: true, correct: false, points: 0 };
  }
  const added = await store.redis("HSETNX", K.a(s, run, q), pid, JSON.stringify(rec));
  if (Number(added) !== 1) return ok({ ok: false, reason: "duplicate" });
  await store.quiet("EXPIRE", K.a(s, run, q), TTL);
  if (question.kind === "choice") await settleRecord(s, run, q, pid, rec);
  else track(runJudge(s, run, q, pid, rec, question));   // response returns now; verdict lands in the hash
  return ok({ ok: true });
}

async function buildBoard(s) {
  const cur = await readCur(s);
  const run = cur.run, st = cur.st;
  const now = nowFn();
  const v = view(st, now);
  const qs = questions();
  const cmds = [["HGETALL", K.players(s, run)], ["ZREVRANGE", K.lb(s, run), 0, -1, "WITHSCORES"]];
  if (st.q > 0) cmds.push(["HGETALL", K.a(s, run, st.q)]);
  const [pFlat, lbFlat, aFlat] = await store.pipe(cmds);
  const players = parseHash(pFlat);
  const active = (pid) => Boolean(players[pid] && !players[pid].kicked);
  const activeIds = Object.keys(players).filter(active).sort((a, b) => players[a].joinedAt - players[b].joinedAt);

  const top = [];
  for (let i = 0; lbFlat && i < lbFlat.length && top.length < TOP_N; i += 2) {
    const p = players[lbFlat[i]];
    if (active(lbFlat[i])) top.push({ first: p.first, seat: p.seat, points: Number(lbFlat[i + 1]) || 0 });
  }

  const allRecs = parseHash(aFlat);
  const recs = {};   // answers from active players only (kicked players drop off the projector)
  for (const [pid, r] of Object.entries(allRecs)) if (r && active(pid)) recs[pid] = r;
  const q = v.question;
  let histogram = null;
  if (q && q.kind === "choice") {
    histogram = new Array(optionCount(q)).fill(0);
    for (const r of Object.values(recs)) if (Number.isInteger(r.answer) && r.answer < histogram.length) histogram[r.answer]++;
  }
  const answeredSeats = Object.keys(recs).filter((pid) => players[pid].seat !== "remote").map((pid) => players[pid].seat);
  const judging = Object.values(allRecs).filter((r) => isFresh(r, now)).length;
  const unjudged = q && q.kind === "open" ? Object.values(allRecs).filter((r) => needsJudging(r, now)).length : 0;

  // Seat colors: the revealed question during reveal, the quarter so far during break, the whole
  // game at final. Nothing before a reveal. "right" = at least half right, "wrong" = answered but
  // fewer, "none" = no answer. Remote players have no seat on the map.
  const seatResults = {};
  let windowQs = [];
  if (v.phase === "reveal" && v.revealed) windowQs = [st.q];
  else if (v.phase === "break" && st.revealedQ > 0) windowQs = qs.map((x, i) => i + 1).filter((n) => n <= st.revealedQ && qs[n - 1].quarter === qs[st.revealedQ - 1].quarter);
  else if (v.phase === "final" && st.revealedQ > 0) windowQs = qs.map((x, i) => i + 1).filter((n) => n <= st.revealedQ);
  if (windowQs.length) {
    const hashes = windowQs.map((n) => (n === st.q ? recs : null));
    const missing = windowQs.filter((n, i) => !hashes[i]);
    const got = await store.pipe(missing.map((n) => ["HGETALL", K.a(s, run, n)]));
    let j = 0;
    for (let i = 0; i < hashes.length; i++) if (!hashes[i]) hashes[i] = parseHash(got[j++]);
    const need = Math.ceil(windowQs.length / 2);
    for (const pid of activeIds) {
      const seat = players[pid].seat;
      if (seat === "remote") continue;
      const mine = hashes.map((h) => h[pid]).filter(Boolean);
      const right = mine.filter((r) => r.correct).length;
      seatResults[seat] = !mine.length ? "none" : right >= need ? "right" : "wrong";
    }
  }

  // Open questions after the reveal: the model answer and how many answers covered each rubric idea.
  let openNotes = [], openIdeas = null, openModel = null;
  if (q && q.kind === "open" && v.revealed) {
    const counts = {};
    const judged = Object.values(recs).filter((r) => r.judged);
    for (const r of judged) for (const i of r.metIdx || []) counts[i] = (counts[i] || 0) + 1;
    const ideas = (q.rubric && q.rubric.ideas) || [];
    openNotes = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([i]) => ideas[i] && ideas[i].label).filter(Boolean);
    openIdeas = { judged: judged.length, ideas: ideas.map((d, i) => ({ label: d.label, n: counts[i] || 0 })) };
    openModel = { text: q.model || null, code: q.code || null, fix: q.fix || null };
  }

  return Object.assign({
    runId: run, phase: v.phase, q: v.q, endsAt: v.endsAt, serverNow: now, remainingMs: v.remainingMs,
    seq: (st.seq || 0) + cur.kicks,
  }, meta(v), {
    players: activeIds.map((pid) => ({ first: players[pid].first, seat: players[pid].seat })),
    answered: Object.keys(recs).length,
    answeredSeats,
    judging,
    unjudged,
    histogram,
    correct: q && q.kind === "choice" && v.revealed ? Number(q.answer) : null,
    seatResults,
    top,
    openNotes,
    openIdeas,
    openModel,
  });
}

// query: {section, key, ip}
async function board(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  return ok(await buildBoard(s));
}

// body: {section, key, action}; ip from the request
async function host(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const action = String(body.action || "");
  const cur = await readCur(s);
  const run = cur.run, st = cur.st;
  if (action === "reset") {
    await store.redis("HINCRBY", K.cur(s), "run", 1);
    await store.redis("HSET", K.cur(s), "state", JSON.stringify(Object.assign({}, LOBBY, { seq: (st.seq || 0) + 1 })), "players", "0");
    return ok(await buildBoard(s));
  }
  const now = nowFn();
  const v = view(st, now);
  const total = questions().length;
  const question = v.question;
  let next = null, error = null;
  switch (action) {
    case "open":
      if (v.phase === "lobby" && total > 0) next = Object.assign({}, st, { phase: "open", q: 1, openedAt: now, closedAt: null });
      else if (v.phase === "closed" && !v.opened) next = Object.assign({}, st, { phase: "open", openedAt: now, closedAt: null });
      else error = "Open starts a question from the lobby or after Next.";
      break;
    case "close":
      if (st.phase === "open") next = Object.assign({}, st, { phase: "closed", closedAt: Math.min(now, st.openedAt + v.dur) });
      else error = "No question is open.";
      break;
    case "reveal":
      if ((v.phase === "open" || v.phase === "closed") && v.opened) {
        next = Object.assign({}, st, { phase: "reveal", closedAt: st.closedAt == null ? Math.min(now, st.openedAt + v.dur) : st.closedAt, revealedQ: st.q });
      } else error = "Reveal follows an opened question.";
      break;
    case "rejudge":
      if (question && question.kind === "open" && v.opened) next = Object.assign({}, st);
      else error = "Rejudge works on an open-ended question that has been opened.";
      break;
    case "next":
      if (["lobby", "reveal", "break"].includes(v.phase)) {
        next = st.q >= total ? Object.assign({}, st, { phase: "final" })
          : { phase: "closed", q: st.q + 1, openedAt: null, closedAt: null, revealedQ: st.revealedQ, seq: st.seq };
      } else error = "Next follows a reveal or a break.";
      break;
    case "break":
      if (v.phase === "reveal") next = Object.assign({}, st, { phase: "break" });
      else error = "A break follows a reveal.";
      break;
    case "final":
      if (v.phase === "open" || (v.phase === "closed" && v.opened)) error = "Reveal the current question first.";
      else next = Object.assign({}, st, { phase: "final" });
      break;
    default:
      return fail(400, "Unknown action.");
  }
  let requeued = 0;
  if (next) {
    next.seq = (st.seq || 0) + 1;
    await saveState(s, next);
    if (action === "reveal") requeued = await requeue(s, run, st.q, question, await scoreQuestion(s, run, st.q));
    if (action === "rejudge") requeued = await requeue(s, run, st.q, question, parseHash(await store.redis("HGETALL", K.a(s, run, st.q))));
  }
  const b = await buildBoard(s);
  if (action === "reveal" || action === "rejudge") b.requeued = requeued;
  if (error) b.error = error;
  return ok(b);
}

function csvCell(v, excel) {
  let s = String(v == null ? "" : v);
  if (excel && /^[=+\-@\t\r]/.test(s)) s = "'" + s;   // keep spreadsheet apps from running formulas
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// One row per answer, ordered by question then answer time. query: {section, run, key, ip, excel}
async function exportCsv(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400, text: "bad section\n" };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status, text: denied.body.error + "\n" };
  const excel = String(query.excel || "") === "1";
  const run = /^\d+$/.test(String(query.run || "")) ? Number(query.run) : (await readCur(s)).run;
  const total = questions().length;
  const players = parseHash(await store.redis("HGETALL", K.players(s, run)));
  const hashes = await store.pipe(Array.from({ length: total }, (_, i) => ["HGETALL", K.a(s, run, i + 1)]));
  const rows = [["section", "run", "first", "initial", "seat", "joined_at", "q", "answer", "correct", "points", "judged"]];
  hashes.forEach((flat, i) => {
    const recs = Object.entries(parseHash(flat)).filter(([, r]) => r).sort((a, b) => a[1].at - b[1].at);
    for (const [pid, r] of recs) {
      const p = players[pid] || {};
      rows.push([s, run, p.first, p.initial, p.seat, p.joinedAt ? new Date(p.joinedAt).toISOString() : "",
        i + 1, r.answer, r.correct ? "TRUE" : "FALSE", r.points || 0, r.judged ? "TRUE" : "FALSE"]);
    }
  });
  return {
    status: 200,
    filename: `game_day_${s}_run${run}.csv`,
    text: rows.map((r) => r.map((c) => csvCell(c, excel)).join(",")).join("\n") + "\n",
  };
}

module.exports = {
  points, openPoints, sanitizeName, sanitizeInitial,
  join, getState, me, answer, host, board, exportCsv, limited,
  questions, setQuestions, setNow, setAskJev, settle,
  SECTIONS, SEAT_RE, K, NO_CHECK, SNAPSHOT_CACHE,
};
