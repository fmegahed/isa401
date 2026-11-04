// Race Call: all game logic. The api/*.js handlers are thin wrappers around this module.
// Not a function of its own: Vercel ignores underscore-prefixed files in api/.
// Adapted from games/game-day/api/_game.js (same phase model, scoring and seat rules), without the
// open-ended Jev questions, plus: the reveal payload (call, takeaway, reveal chart), streaks, and
// the per-seat totals behind the final "results map of the room".
//
// Section pointer: rc:{s}:cur is one hash {run, state, players, kicks}, so the public snapshot
// (GET /api/state) costs a single HGETALL and is cached 1 s by the Vercel CDN.
//   state = JSON {phase, q, openedAt, closedAt, revealedQ, seq}
//
// Phases (q is 1-based; 0 = no question yet):
//   lobby                       players join
//   closed, openedAt = null     "pre-open": race q is on screen, polls not open yet (no options)
//   open                        clock runs from openedAt for seconds*1000 ms; after that the server
//                               reports "closed" without a write
//   closed, openedAt set        polls closed, waiting for the call
//   reveal                      race q is called: correct option, histogram, takeaway, seat colors
//   break                       results so far (between blocks)
//   final                       end of the night
// Host actions: open, close, reveal, next, break, final, reset (rules in host()).
//
// Secrecy: the answer, call, takeaway and reveal chart of race q leave the server only once q is
// revealed. The answer histogram is withheld while the polls are open (no herding; the projector
// only shows how many have answered) and appears once they close. Points and the leaderboard only
// move at a reveal.
const fs = require("fs");
const crypto = require("crypto");
const store = require("./_store");

const SECTIONS = ["A", "B", "Z"];
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const PID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const TTL = 30 * 24 * 3600;          // 30-day expiry on every per-run key
const GRACE_MS = 1500;               // network grace after the clock runs out
const TOP_N = 5;
const PER_MINUTE = 600;              // per-address ceiling for join/answer (a section shares one campus address)
const ANSWER_CALLS_PER_Q = 3;
const ADMIN_FAILS = 10;
const SNAPSHOT_CACHE = "public, s-maxage=1, stale-while-revalidate=1";

// ---------- questions (server-only file; tests point RC_QUESTIONS at a fixture)
let QS = null;
function questions() {
  if (!QS) {
    QS = process.env.RC_QUESTIONS
      ? JSON.parse(fs.readFileSync(process.env.RC_QUESTIONS, "utf8"))
      : require("./_questions.json");
  }
  return QS;
}
function setQuestions(arr) { QS = arr; }
const optionCount = (q) => (typeof q.options === "number" ? q.options : Array.isArray(q.options) ? q.options.length : 4);

let nowFn = () => Date.now();
function setNow(fn) { nowFn = fn || (() => Date.now()); }

const K = {
  cur: (s) => `rc:${s}:cur`,
  players: (s, r) => `rc:${s}:${r}:players`,
  seats: (s, r) => `rc:${s}:${r}:seats`,
  a: (s, r, q) => `rc:${s}:${r}:a:${q}`,
  lb: (s, r) => `rc:${s}:${r}:lb`,
  scored: (s, r) => `rc:${s}:${r}:scored`,
  counted: (s, r) => `rc:${s}:${r}:counted`,
  streak: (s, r) => `rc:${s}:${r}:streak`,
};

// ---------- pure functions
// 2000 points for an instant right call, falling linearly to 1000 at the buzzer; wrong = 0.
function points(correct, elapsedMs, durationMs) {
  if (!correct) return 0;
  const d = Math.max(1, Number(durationMs) || 1);
  const e = Math.min(Math.max(0, Number(elapsedMs) || 0), d);
  return Math.min(2000, Math.max(1000, Math.round(2 * (1000 - 500 * e / d))));
}

const INVISIBLE = /[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;
function sanitizeName(s) {
  if (typeof s !== "string") return null;
  let t = s.normalize("NFC").replace(/<[^>]*>?/g, "").replace(/[<>&"'`]/g, "").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
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
// The right key always works; only wrong keys are counted (campus guessing cannot lock the host out).
async function adminCheck(key, ip) {
  if (keyMatches(key)) return null;
  const rl = `rc:rl:admin:${ip || "local"}:${Math.floor(nowFn() / 60000)}`;
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

function view(st, now) {
  const question = questions()[st.q - 1] || null;
  const dur = question ? question.seconds * 1000 : 0;
  let phase = st.phase, remainingMs = null, endsAt = null;
  if (phase === "open") {
    endsAt = st.openedAt + dur;
    if (endsAt > now) remainingMs = endsAt - now; else { phase = "closed"; endsAt = null; }
  }
  return { phase, q: st.q, remainingMs, endsAt, question, dur, opened: st.openedAt != null, revealed: st.q > 0 && st.revealedQ === st.q };
}
function meta(v) {
  const q = v.question;
  return { total: questions().length, block: q ? q.block : null, seconds: q ? q.seconds : null, options: q ? optionCount(q) : null, opened: v.opened };
}
// What a revealed race shows. Only called when the race is revealed.
// chart/anim: an annotated version of the question chart (replaces it); extra/extraAnim: a contrast
// chart shown beside the takeaway under extraCap (never in place of the question chart).
function revealOf(q) {
  return { correct: Number(q.answer), call: q.call || null, takeaway: q.takeaway || null, chart: q.reveal || null, anim: q.revealAnim || null,
           extra: q.extra || null, extraAnim: q.extraAnim || null, extraCap: q.extraCap || null };
}

async function limited(ip, kind) {
  const key = `rc:rl:${kind}:${ip}:${Math.floor(nowFn() / 60000)}`;
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
// A late write of an answer to an already-revealed question cannot happen (answers close at the
// reveal), but the guard keeps the order of writes safe either way.
async function settleRecord(s, run, q, pid, rec) {
  if (!(rec.points > 0)) return;
  if (!(await store.redis("HGET", K.scored(s, run), String(q)))) return;
  await claimAndAdd(s, run, [[q, pid, rec.points]]);
}
// Scores race q once; the first reveal also moves every player's streak (right: +1, else 0).
async function scoreQuestion(s, run, q) {
  const first = await store.redis("HSETNX", K.scored(s, run), String(q), "1");
  await store.quiet("EXPIRE", K.scored(s, run), TTL);
  const recs = parseHash(await store.redis("HGETALL", K.a(s, run, q)));
  if (Number(first) === 1) {
    await claimAndAdd(s, run, Object.entries(recs).filter(([, r]) => r && r.points > 0).map(([pid, r]) => [q, pid, r.points]));
    const [pFlat, sFlat] = await store.pipe([["HGETALL", K.players(s, run)], ["HGETALL", K.streak(s, run)]]);
    const old = parseHash(sFlat, false);
    const cmds = [];
    for (const pid of Object.keys(parseHash(pFlat, false))) {
      const v = recs[pid] && recs[pid].correct ? (Number(old[pid]) || 0) + 1 : 0;
      cmds.push(["HSET", K.streak(s, run), pid, String(v)]);
    }
    if (cmds.length) await store.pipe([...cmds, ["EXPIRE", K.streak(s, run), TTL]]);
  }
  return recs;
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
  let pid = pidOf(body.playerId), prev = null;
  if (pid) { prev = parseJSON(await store.redis("HGET", K.players(s, run), pid)); if (!prev) pid = null; }
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
    const holder = await store.redis("HGET", K.seats(s, run), seat);
    if (holder && holder !== pid) {
      const old = parseJSON(await store.redis("HGET", K.players(s, run), holder));
      if (old && !old.kicked && old.seat === seat) {
        old.kicked = true;
        cmds.push(["HSET", K.players(s, run), holder, JSON.stringify(old)], ["HINCRBY", K.cur(s), "players", -1], ["HINCRBY", K.cur(s), "kicks", 1]);
      }
    }
    cmds.push(["HSET", K.seats(s, run), seat, pid], ["EXPIRE", K.seats(s, run), TTL]);
  }
  await store.pipe(cmds);
  return ok({ playerId: pid, runId: run });
}

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
  const cmds = [["HGET", K.players(s, cur.run), pid], ["ZSCORE", K.lb(s, cur.run), pid], ["ZREVRANK", K.lb(s, cur.run), pid], ["HGET", K.streak(s, cur.run), pid]];
  if (showLast) cmds.push(["HGET", K.a(s, cur.run, cur.st.q), pid]);
  const [pRaw, score, rank, streak, aRaw] = await store.pipe(cmds);
  const p = parseJSON(pRaw);
  if (!p || p.kicked) return ok(Object.assign(base, { you: null, last: null, kicked: true }));
  let last = null;
  if (showLast) {
    const rec = parseJSON(aRaw);
    last = rec ? { answer: rec.answer, correct: Boolean(rec.correct), points: rec.points || 0 } : { answer: null, correct: false, points: 0, none: true };
    last.reveal = revealOf(v.question);
  }
  return ok(Object.assign(base, {
    you: { first: p.first, seat: p.seat, points: Number(score) || 0, rank: rank == null ? null : Number(rank) + 1, streak: Number(streak) || 0 },
    last,
  }));
}

async function answer(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const closed = ok({ ok: false, reason: "closed" });
  const unknown = ok({ ok: false, reason: "unknown" });
  const pid = pidOf(body.playerId);
  if (!pid) return unknown;
  const rl = `rc:rl:ans:${s}:${pid}:${Number(body.q) || 0}`;
  const calls = Number(await store.quiet("INCR", rl)) || 0;
  if (calls === 1) await store.quiet("EXPIRE", rl, 600);
  if (calls > ANSWER_CALLS_PER_Q) return fail(429, "Too many tries for this race.");
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
  const a = typeof body.answer === "number" ? body.answer : (/^\d+$/.test(String(body.answer)) ? Number(body.answer) : NaN);
  if (!Number.isInteger(a) || a < 0 || a >= optionCount(question)) return unknown;
  const elapsed = Math.max(0, now - st.openedAt);
  const correct = a === Number(question.answer);
  const rec = { answer: a, at: now, elapsed, correct, points: points(correct, elapsed, dur) };
  const added = await store.redis("HSETNX", K.a(s, run, q), pid, JSON.stringify(rec));
  if (Number(added) !== 1) return ok({ ok: false, reason: "duplicate" });
  await store.quiet("EXPIRE", K.a(s, run, q), TTL);
  await settleRecord(s, run, q, pid, rec);
  return ok({ ok: true });
}

async function buildBoard(s) {
  const cur = await readCur(s);
  const run = cur.run, st = cur.st;
  const now = nowFn();
  const v = view(st, now);
  const qs = questions();
  const cmds = [["HGETALL", K.players(s, run)], ["ZREVRANGE", K.lb(s, run), 0, -1, "WITHSCORES"], ["HGETALL", K.streak(s, run)]];
  if (st.q > 0) cmds.push(["HGETALL", K.a(s, run, st.q)]);
  const [pFlat, lbFlat, sFlat, aFlat] = await store.pipe(cmds);
  const players = parseHash(pFlat);
  const active = (pid) => Boolean(players[pid] && !players[pid].kicked);
  const activeIds = Object.keys(players).filter(active).sort((a, b) => players[a].joinedAt - players[b].joinedAt);

  const scores = {};
  for (let i = 0; lbFlat && i < lbFlat.length; i += 2) scores[lbFlat[i]] = Number(lbFlat[i + 1]) || 0;
  const top = [];
  for (let i = 0; lbFlat && i < lbFlat.length && top.length < TOP_N; i += 2) {
    const p = players[lbFlat[i]];
    if (active(lbFlat[i])) top.push({ first: p.first, seat: p.seat, points: scores[lbFlat[i]] });
  }

  const recs = {};
  for (const [pid, r] of Object.entries(parseHash(aFlat))) if (r && active(pid)) recs[pid] = r;
  const q = v.question;
  // the histogram stays on the server while the polls are open
  let histogram = null;
  if (q && v.opened && v.phase !== "open") {
    histogram = new Array(optionCount(q)).fill(0);
    for (const r of Object.values(recs)) if (Number.isInteger(r.answer) && r.answer < histogram.length) histogram[r.answer]++;
  }
  const answeredSeats = Object.keys(recs).filter((pid) => players[pid].seat !== "remote").map((pid) => players[pid].seat);

  // streaks: only after a reveal (they move at reveals), the best three active runs of 3 or more
  let streaks = [];
  if (["reveal", "break", "final"].includes(v.phase)) {
    const sk = parseHash(sFlat, false);
    streaks = activeIds.map((pid) => ({ first: players[pid].first, seat: players[pid].seat, n: Number(sk[pid]) || 0 }))
      .filter((x) => x.n >= 3).sort((a, b) => b.n - a.n).slice(0, 3);
  }

  // Seat results: the revealed race during reveal, the block so far during break, the night at final.
  // seatResults: right/wrong/none (reveal; at least half right in a window); seatTotals: right of n.
  const seatResults = {}, seatTotals = {};
  let windowQs = [];
  if (v.phase === "reveal" && v.revealed) windowQs = [st.q];
  else if (v.phase === "break" && st.revealedQ > 0) windowQs = qs.map((x, i) => i + 1).filter((n) => n <= st.revealedQ && qs[n - 1].block === qs[st.revealedQ - 1].block);
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
      seatTotals[seat] = { right, answered: mine.length, of: windowQs.length, points: scores[pid] || 0 };
    }
  }

  return Object.assign({
    runId: run, phase: v.phase, q: v.q, endsAt: v.endsAt, serverNow: now, remainingMs: v.remainingMs,
    seq: (st.seq || 0) + cur.kicks, revealedQ: st.revealedQ || 0,
  }, meta(v), {
    players: activeIds.map((pid) => ({ first: players[pid].first, seat: players[pid].seat })),
    answered: Object.keys(recs).length,
    answeredSeats,
    histogram,
    reveal: q && v.revealed && ["reveal", "break", "final"].includes(v.phase) ? revealOf(q) : null,
    correct: q && v.revealed ? Number(q.answer) : null,
    seatResults,
    seatTotals,
    top,
    streaks,
  });
}

async function board(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  return ok(await buildBoard(s));
}

async function host(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const action = String(body.action || "");
  // read-only, admin only: the whole answer key, so the projector's demo rehearses the real answers
  if (action === "key") return ok({ key: questions().map(revealOf) });
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
  let next = null, error = null;
  switch (action) {
    case "open":
      if (v.phase === "lobby" && total > 0) next = Object.assign({}, st, { phase: "open", q: 1, openedAt: now, closedAt: null });
      else if (v.phase === "closed" && !v.opened) next = Object.assign({}, st, { phase: "open", openedAt: now, closedAt: null });
      else error = "Open starts a race from the lobby or after Next.";
      break;
    case "close":
      if (st.phase === "open") next = Object.assign({}, st, { phase: "closed", closedAt: Math.min(now, st.openedAt + v.dur) });
      else error = "No race is open.";
      break;
    case "reveal":
      if ((v.phase === "open" || v.phase === "closed") && v.opened) {
        next = Object.assign({}, st, { phase: "reveal", closedAt: st.closedAt == null ? Math.min(now, st.openedAt + v.dur) : st.closedAt, revealedQ: st.q });
      } else error = "A call follows an opened race.";
      break;
    case "next":
      if (["lobby", "reveal", "break"].includes(v.phase)) {
        next = st.q >= total ? Object.assign({}, st, { phase: "final" })
          : { phase: "closed", q: st.q + 1, openedAt: null, closedAt: null, revealedQ: st.revealedQ, seq: st.seq };
      } else error = "Next follows a call or a break.";
      break;
    case "break":
      if (v.phase === "reveal") next = Object.assign({}, st, { phase: "break" });
      else error = "A break follows a call.";
      break;
    case "final":
      if (v.phase === "open" || (v.phase === "closed" && v.opened)) error = "Call the current race first.";
      else next = Object.assign({}, st, { phase: "final" });
      break;
    default:
      return fail(400, "Unknown action.");
  }
  if (next) {
    next.seq = (st.seq || 0) + 1;
    await saveState(s, next);
    if (action === "reveal") await scoreQuestion(s, run, st.q);
  }
  const b = await buildBoard(s);
  if (error) b.error = error;
  return ok(b);
}

function csvCell(v, excel) {
  let s = String(v == null ? "" : v);
  if (excel && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
// One row per answer, by race then answer time. query: {section, run, key, ip, excel}
async function exportCsv(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400, text: "bad section\n" };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status, text: denied.body.error + "\n" };
  const excel = String(query.excel || "") === "1";
  const run = /^\d+$/.test(String(query.run || "")) ? Number(query.run) : (await readCur(s)).run;
  const qs = questions();
  const players = parseHash(await store.redis("HGETALL", K.players(s, run)));
  const hashes = await store.pipe(qs.map((_, i) => ["HGETALL", K.a(s, run, i + 1)]));
  const rows = [["section", "run", "first", "initial", "seat", "joined_at", "q", "race_id", "answer", "correct", "points", "seconds_to_answer"]];
  hashes.forEach((flat, i) => {
    const recs = Object.entries(parseHash(flat)).filter(([, r]) => r).sort((a, b) => a[1].at - b[1].at);
    for (const [pid, r] of recs) {
      const p = players[pid] || {};
      rows.push([s, run, p.first, p.initial, p.seat, p.joinedAt ? new Date(p.joinedAt).toISOString() : "",
        i + 1, qs[i].id, "ABCD"[r.answer] || r.answer, r.correct ? "TRUE" : "FALSE", r.points || 0, (Number(r.elapsed) / 1000).toFixed(1)]);
    }
  });
  return { status: 200, filename: `race_call_${s}_run${run}.csv`, text: rows.map((r) => r.map((c) => csvCell(c, excel)).join(",")).join("\n") + "\n" };
}

module.exports = {
  points, sanitizeName, sanitizeInitial,
  join, getState, me, answer, host, board, exportCsv, limited,
  questions, setQuestions, setNow,
  SECTIONS, SEAT_RE, K, SNAPSHOT_CACHE,
};
