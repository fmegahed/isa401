// Flight Plan: the Class 23 paper plane KPI game (Wed Nov 11, 2026). Spec:
// docs/superpowers/specs/2026-11-10-class23-business-reporting-design.md. Patterned on Game Day's
// _game.js (join, admin key with lockout, runs per section, pipelines). Teams are seating rows.
// Every key starts with "fp:". Handlers return {status, body}; the api/*.js files are thin wrappers.
// Nothing from _reveal.json reaches a phone before the host presses Publish recap.
const crypto = require("crypto");
const store = require("./_store");
const SC = require("./_score");
const REVEAL = require("./_reveal.json");
let ai = require("./_ai");
function setAI(x) { ai = x || require("./_ai"); }

const SECTIONS = ["A", "B", "Z"];
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const TEAM_RE = /^[LR][1-3]$/;
const TEAMS = ["L1", "L2", "L3", "R1", "R2", "R3"];
const PID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const PHASES = ["lobby", "design", "vote", "throws", "check", "reveal", "instructor", "kpis"];
const RESULT_PHASES = ["reveal", "instructor", "kpis"];
const PARTS = ["design", "builder", "op", "prod"];
const TTL = 30 * 24 * 3600;
const DESIGN_MS = 17 * 60000;
const MAX_NOTE = 600, MAX_KPIS = 12;
const PER_MINUTE = 900;
const ADMIN_FAILS = 10;
const INSTRUCTOR = "INSTRUCTOR";
const SNAPSHOT_CACHE = "public, s-maxage=1, stale-while-revalidate=1";
const DEFAULT_SETTINGS = {
  colors: ["black", "blue", "red", "green", "purple"],
  symbols: ["circle", "triangle", "square", "star"],
  xWidthIn: 12, penaltyIn: 48, hitN: 6,
};

let nowFn = () => Date.now();
function setNow(fn) { nowFn = fn || (() => Date.now()); }
// Task 7/8 hooks: feedback on a saved brief, matching when a phase starts. Errors never break a request.
const hooks = { onBriefSaved: async () => {}, onPhase: async () => {} };
function setHooks(h) { Object.assign(hooks, h || {}); }

const K = {
  cur: (s) => `fp:${s}:cur`,
  players: (s, r) => `fp:${s}:${r}:players`,
  seats: (s, r) => `fp:${s}:${r}:seats`,
  notes: (s, r, t) => `fp:${s}:${r}:notes:${t}`,
  briefs: (s, r) => `fp:${s}:${r}:briefs`,
  feedback: (s, r) => `fp:${s}:${r}:feedback`,
  match: (s, r) => `fp:${s}:${r}:match`,
  markers: (s, r) => `fp:${s}:${r}:markers`,
  pairs: (s, r) => `fp:${s}:${r}:pairs`,
  votes: (s, r) => `fp:${s}:${r}:votes`,
  throws: (s, r) => `fp:${s}:${r}:throws`,
  marks: (s, r) => `fp:${s}:${r}:marks`,
  tape: (s, r) => `fp:${s}:${r}:tape`,
  results: (s, r) => `fp:${s}:${r}:results`,
  photos: (s, r) => `fp:${s}:${r}:photos`,
  img: (id) => `fp:img:${id}`,
};

// ---------- small helpers
const ok = (body, cache) => ({ status: 200, body, cache });
const fail = (status, error) => ({ status, body: { error } });
const INVISIBLE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g;
function cleanText(s, max) {
  if (typeof s !== "string") return "";
  return Array.from(s.normalize("NFC").replace(INVISIBLE, "").replace(/\r\n?/g, "\n").trim()).slice(0, max).join("").trim();
}
function sanitizeName(s) {
  const t = cleanText(String(s || "").replace(/<[^>]*>?/g, "").replace(/[<>&"'`\n]/g, ""), 20).replace(/\s+/g, " ");
  return t || null;
}
function sanitizeInitial(s) { const t = String(s == null ? "" : s).trim(); return /^[A-Za-z]$/.test(t) ? t.toUpperCase() : null; }
function sectionOf(v) { const s = String(v || "").trim().toUpperCase(); return SECTIONS.includes(s) ? s : null; }
function pidOf(v) { const p = String(v || ""); return PID_RE.test(p) ? p : null; }
function parseJSON(v) { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function parseHash(flat, json = true) {
  const o = {};
  for (let i = 0; flat && i < flat.length; i += 2) o[flat[i]] = json ? parseJSON(flat[i + 1]) : flat[i + 1];
  return o;
}
const num01 = (v) => typeof v === "number" && isFinite(v) && v >= 0 && v <= 1;
function keyMatches(key) {
  const k = process.env.ADMIN_KEY;
  if (!k || typeof key !== "string") return false;
  const a = Buffer.from(key), b = Buffer.from(k);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function adminCheck(key, ip) {
  if (keyMatches(key)) return null;
  const rl = `fp:rl:admin:${ip || "local"}:${Math.floor(nowFn() / 60000)}`;
  const n = Number(await store.quiet("INCR", rl)) || 0;
  if (n === 1) await store.quiet("EXPIRE", rl, 120);
  return n > ADMIN_FAILS ? fail(429, "Too many wrong keys. Wait a minute.") : fail(403, "Wrong key.");
}
async function limited(ip, kind) {
  const key = `fp:rl:${kind}:${ip || "local"}:${Math.floor(nowFn() / 60000)}`;
  const used = await store.quiet("INCR", key);
  if (used === 1) await store.quiet("EXPIRE", key, 120);
  return Boolean(used && used > PER_MINUTE);
}

// Teams credited with the ball: always a clean list (an older run may hold a single string).
function teamList(v) {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  return [...new Set(arr.map(String).filter((t) => TEAM_RE.test(t)))].sort((a, b) => TEAMS.indexOf(a) - TEAMS.indexOf(b));
}
const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six"];
function foundText(teams) {
  if (teams.length <= 1) return REVEAL.text.found;
  const t = REVEAL.text.foundMany;
  return { title: t.title.replace("{n}", COUNT_WORDS[teams.length] || String(teams.length)), lines: t.lines };
}

// ---------- state
function freshState(settings, seq) {
  return { phase: "lobby", seq: seq || 0, endsAt: null, settings: Object.assign({}, DEFAULT_SETTINGS, settings || {}),
    order: [], current: null, lockedRule: null, recap: false, instructor: null, instructorResult: null, firstTeam: null };
}
async function readCur(s) {
  const h = parseHash(await store.redis("HGETALL", K.cur(s)), false);
  if (h.run == null) await store.redis("HSETNX", K.cur(s), "run", "1");
  const st = Object.assign(freshState(), parseJSON(h.state) || {});
  st.settings = Object.assign({}, DEFAULT_SETTINGS, st.settings || {});
  return { run: Number(h.run) || 1, st };
}
function saveState(s, st) { return store.redis("HSET", K.cur(s), "state", JSON.stringify(st)); }

async function playersOf(s, run) {
  const all = parseHash(await store.redis("HGETALL", K.players(s, run)));
  for (const [pid, p] of Object.entries(all)) if (!p || p.kicked) delete all[pid];
  return all;
}
function teamsFrom(players) {
  const t = {};
  for (const [pid, p] of Object.entries(players)) (t[p.team] = t[p.team] || []).push(Object.assign({ pid }, p));
  return t;
}

// ---------- join
async function join(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const first = sanitizeName(body.first);
  if (!first) return fail(400, "Enter your first name.");
  const initial = sanitizeInitial(body.initial);
  if (!initial) return fail(400, "Enter one letter for your last initial.");
  const seat = String(body.seat || "").trim().toUpperCase();
  if (!SEAT_RE.test(seat)) return fail(400, "Pick your seat.");
  const team = seat.split("-")[0];
  const { run } = await readCur(s);
  let pid = pidOf(body.playerId), prev = null;
  if (pid) { prev = parseJSON(await store.redis("HGET", K.players(s, run), pid)); if (!prev) pid = null; }
  if (!pid) pid = crypto.randomBytes(12).toString("base64url");
  const rec = { first, initial, seat, team, joinedAt: prev ? prev.joinedAt : nowFn(), kicked: false };
  const cmds = [["HSET", K.players(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.players(s, run), TTL]];
  if (prev && !prev.kicked && prev.seat !== seat && (await store.redis("HGET", K.seats(s, run), prev.seat)) === pid) {
    cmds.push(["HDEL", K.seats(s, run), prev.seat]);
  }
  const holder = await store.redis("HGET", K.seats(s, run), seat);
  if (holder && holder !== pid) {
    const old = parseJSON(await store.redis("HGET", K.players(s, run), holder));
    if (old && !old.kicked && old.seat === seat) { old.kicked = true; cmds.push(["HSET", K.players(s, run), holder, JSON.stringify(old)]); }
  }
  cmds.push(["HSET", K.seats(s, run), seat, pid], ["EXPIRE", K.seats(s, run), TTL]);
  await store.pipe(cmds);
  return ok({ playerId: pid, runId: run, team, first, initial, seat });
}

// ---------- results (pure on stored data)
function landedFor(snapshot, team) {
  return (snapshot && snapshot.marks ? snapshot.marks : []).filter((m) => m.team === team);
}
function missCount(throws, team) { return (throws[team] || []).filter(Boolean).length; }

// snapshot: {X, imgW, imgH, marks, xWidthIn}. Tape overrides replace a landed throw's distance.
function computeResults(snapshot, throws, tape, rule, teams, briefs) {
  const inches = SC.toInches(snapshot.marks || [], snapshot.X, snapshot.imgW, snapshot.imgH, snapshot.xWidthIn);
  let taped = 0;
  const entries = teams.map((team) => {
    const photo = inches[team] || [];
    const marks = landedFor(snapshot, team);
    const points = photo.map((p, i) => {
      const t = tape[`${team}:${i}`];
      if (t != null && isFinite(t)) { taped++; return { dx: Number(t), dy: 0 }; }
      return p;
    });
    const detail = photo.map((p, i) => ({
      i, x: marks[i].x, y: marks[i].y, photoIn: Math.hypot(p.dx, p.dy),
      tapeIn: tape[`${team}:${i}`] != null ? Number(tape[`${team}:${i}`]) : null,
    }));
    return { team, points, misses: missCount(throws, team), detail };
  });
  const ranking = SC.rankTeams(entries, rule).map((r) => ({ team: r.team, rank: r.rank, score: r.score, closest: r.closest, last: r.last }));
  const top = ranking[0] && !ranking[0].last ? ranking[0].team : null;
  return {
    rule, ranking,
    penaltyUsed: rule.miss === "fixed_penalty" ? SC.effectivePenalty(entries, rule.penaltyIn) : null,
    whatIf: SC.whatIf(entries, rule),
    winner: top ? { team: top, brief: briefs[top] || null } : null,
    entries: entries.map((e) => ({ team: e.team, misses: e.misses, throws: e.detail })),
    pxPerInch: SC.pxPerInch(snapshot.X, snapshot.imgW, snapshot.imgH, snapshot.xWidthIn),
    snapshot,
    tapeNote: taped ? `Re-ranked after tape check (${taped} throw${taped === 1 ? "" : "s"})` : null,
  };
}

// ---------- public state (phones; CDN-cached for 1 s)
async function getState(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  const [pl, markers, briefs, throws, results, ...noteLens] = await store.pipe([
    ["HGETALL", K.players(s, run)], ["HGETALL", K.markers(s, run)], ["HGETALL", K.briefs(s, run)],
    ["HGETALL", K.throws(s, run)], ["GET", K.results(s, run)],
    ...TEAMS.map((t) => ["HLEN", K.notes(s, run, t)])]);
  const players = parseHash(pl);
  const counts = {};
  for (const p of Object.values(players)) if (p && !p.kicked) counts[p.team] = (counts[p.team] || 0) + 1;
  const mk = parseHash(markers, false), br = parseHash(briefs);
  const teams = TEAMS.filter((t) => counts[t]).map((t) => ({
    team: t, members: counts[t], notes: Number(noteLens[TEAMS.indexOf(t)]) || 0, marker: mk[t] || null, compiled: Boolean(br[t]),
  }));
  const body = {
    section: s, run, phase: st.phase, seq: st.seq, now: nowFn(), endsAt: st.endsAt,
    settings: { colors: st.settings.colors, symbols: st.settings.symbols, penaltyIn: st.settings.penaltyIn, hitN: st.settings.hitN },
    teams, order: st.order, current: st.current, lockedRule: st.lockedRule, throws: parseHash(throws),
  };
  const res = parseJSON(results);
  if (res && RESULT_PHASES.includes(st.phase)) {
    body.results = { rule: res.rule, ranking: res.ranking, whatIf: res.whatIf, winner: res.winner, tapeNote: res.tapeNote };
  }
  if (st.recap) {
    const found = teamList(st.firstTeam);
    const outcome = found.length ? "found" : st.instructorResult ? (st.instructorResult.wins ? "lesson" : "choke") : "lesson";
    body.recap = { outcome, text: outcome === "found" ? foundText(found) : REVEAL.text[outcome], firstTeam: found.length ? found : null,
      instructor: st.instructorResult ? { score: st.instructorResult.score, wins: st.instructorResult.wins } : null };
  }
  return ok(body, SNAPSHOT_CACHE);
}

// ---------- a player's own team
async function teamView(s, run, st, pid, p) {
  const [notes, brief, fb, markers, pairs] = await store.pipe([
    ["HGETALL", K.notes(s, run, p.team)], ["HGET", K.briefs(s, run), p.team], ["HGET", K.feedback(s, run), p.team],
    ["HGETALL", K.markers(s, run)], ["HGETALL", K.pairs(s, run)]]);
  const players = await playersOf(s, run);
  const members = Object.values(players).filter((x) => x.team === p.team).map((x) => ({ first: x.first, initial: x.initial, seat: x.seat }));
  const mk = parseHash(markers, false), pr = parseHash(pairs, false);
  return {
    team: p.team, me: { first: p.first, initial: p.initial, seat: p.seat }, members, phase: st.phase, endsAt: st.endsAt, now: nowFn(),
    notes: Object.values(parseHash(notes)).filter(Boolean).sort((a, b) => a.at - b.at)
      .map((n) => ({ id: n.id, part: n.part, text: n.text, via: n.via, seat: n.seat, first: n.first, at: n.at, mine: n.pid === pid })),
    brief: parseJSON(brief), feedback: parseJSON(fb), marker: mk[p.team] || null,
    taken: Object.entries(pr).filter(([, t]) => t !== p.team).map(([pair]) => pair),
    settings: { colors: st.settings.colors, symbols: st.settings.symbols, penaltyIn: st.settings.penaltyIn, hitN: st.settings.hitN },
  };
}
async function playerOf(s, run, pid) {
  if (!pid) return null;
  const p = parseJSON(await store.redis("HGET", K.players(s, run), pid));
  return p && !p.kicked ? p : null;
}
async function team(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  const pid = pidOf(query.playerId);
  const p = await playerOf(s, run, pid);
  if (!p) return fail(403, "Join first.");
  return ok(await teamView(s, run, st, pid, p));
}

function cleanBrief(b) {
  b = b && typeof b === "object" ? b : {};
  const kpis = (Array.isArray(b.kpis) ? b.kpis : []).slice(0, MAX_KPIS).map((k) => ({
    type: k && k.type === "operational" ? "operational" : "product",
    name: cleanText(k && k.name, 80), definition: cleanText(k && k.definition, 400), our_number: cleanText(k && k.our_number, 40),
  })).filter((k) => k.name || k.definition);
  return { design_process: cleanText(b.design_process, 2000), builder_choice: cleanText(b.builder_choice, 1000), kpis };
}

async function teamAction(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  const pid = pidOf(body.playerId);
  const p = await playerOf(s, run, pid);
  if (!p) return fail(403, "Join first.");
  const action = String(body.action || "");
  const writing = st.phase === "design";
  if (action === "addNote") {
    if (!writing) return fail(409, "Writing is closed.");
    const part = PARTS.includes(body.part) ? body.part : null;
    const text = cleanText(body.text, MAX_NOTE);
    if (!part || !text) return fail(400, "Write something first.");
    const id = crypto.randomBytes(6).toString("base64url");
    const note = { id, part, text, via: body.via === "voice" ? "voice" : "typed", seat: p.seat, first: p.first, at: nowFn(), pid };
    await store.pipe([["HSET", K.notes(s, run, p.team), id, JSON.stringify(note)], ["EXPIRE", K.notes(s, run, p.team), TTL]]);
  } else if (action === "deleteNote") {
    if (!writing) return fail(409, "Writing is closed.");
    const n = parseJSON(await store.redis("HGET", K.notes(s, run, p.team), String(body.id || "")));
    if (!n) return fail(404, "That note is gone.");
    if (n.pid !== pid) return fail(403, "Only the author can delete a note.");
    await store.redis("HDEL", K.notes(s, run, p.team), n.id);
  } else if (action === "saveBrief") {
    if (!writing) return fail(409, "Writing is closed.");
    const brief = Object.assign(cleanBrief(body.brief), { updatedAt: nowFn(), by: p.first });
    await store.pipe([["HSET", K.briefs(s, run), p.team, JSON.stringify(brief)], ["EXPIRE", K.briefs(s, run), TTL]]);
    try { await hooks.onBriefSaved(s, run, p.team, brief); } catch (e) { /* feedback is best effort */ }
  } else if (action === "pickMarker") {
    if (!["lobby", "design", "vote"].includes(st.phase)) return fail(409, "Markers are locked once throws start.");
    const color = String(body.color || ""), symbol = String(body.symbol || "");
    if (!st.settings.colors.includes(color) || !st.settings.symbols.includes(symbol)) return fail(400, "Pick a color and a symbol.");
    const pair = `${color}|${symbol}`;
    if (st.instructor && `${st.instructor.color}|${st.instructor.symbol}` === pair) return fail(409, "That marker is taken.");
    const got = await store.redis("HSETNX", K.pairs(s, run), pair, p.team);
    if (!Number(got) && (await store.redis("HGET", K.pairs(s, run), pair)) !== p.team) return fail(409, "That marker is taken.");
    const old = await store.redis("HGET", K.markers(s, run), p.team);
    const cmds = [["HSET", K.markers(s, run), p.team, pair], ["EXPIRE", K.markers(s, run), TTL], ["EXPIRE", K.pairs(s, run), TTL]];
    if (old && old !== pair && (await store.redis("HGET", K.pairs(s, run), old)) === p.team) cmds.push(["HDEL", K.pairs(s, run), old]);
    await store.pipe(cmds);
  } else return fail(400, "Unknown action.");
  return ok(await teamView(s, run, st, pid, p));
}

// ---------- vote
async function vote(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  if (st.phase !== "vote") return fail(409, "Voting is closed.");
  const pid = pidOf(body.playerId);
  const p = await playerOf(s, run, pid);
  if (!p) return fail(403, "Join first.");
  const summary = SC.SUMMARIES.includes(body.summary) ? body.summary : null;
  const miss = SC.MISS_RULES.includes(body.miss) ? body.miss : null;
  if (!summary || !miss) return fail(400, "Answer both questions.");
  await store.pipe([["HSET", K.votes(s, run), pid, JSON.stringify({ summary, miss })], ["EXPIRE", K.votes(s, run), TTL]]);
  return ok({ vote: { summary, miss } });
}
function tally(votes) {
  const t = { summary: {}, miss: {}, n: 0 };
  for (const v of Object.values(votes)) {
    if (!v) continue;
    t.n++; t.summary[v.summary] = (t.summary[v.summary] || 0) + 1; t.miss[v.miss] = (t.miss[v.miss] || 0) + 1;
  }
  return t;
}
function plurality(counts) {
  const e = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!e.length || (e[1] && e[1][1] === e[0][1])) return null;
  return e[0][0];
}

// ---------- host
function cleanMarks(body, kind) {
  const W = Math.round(Number(body.imgW)), H = Math.round(Number(body.imgH));
  const X = body.X || {};
  if (!(W > 0 && W <= 10000 && H > 0 && H <= 10000)) return null;
  if (!["cx", "cy", "lx", "ly", "rx", "ry"].every((k) => num01(X[k]))) return null;
  if (Math.hypot((X.rx - X.lx) * W, (X.ry - X.ly) * H) < 10) return null;   // the X needs a width to set the scale
  const marks = (Array.isArray(body.marks) ? body.marks : []).slice(0, 40)
    .filter((m) => m && num01(m.x) && num01(m.y) && (kind === "instructor" ? m.team === INSTRUCTOR : TEAM_RE.test(m.team)))
    .map((m) => ({ team: m.team, x: m.x, y: m.y }));
  const photoId = typeof body.photoId === "string" ? body.photoId.slice(0, 40) : null;
  return { X: { cx: X.cx, cy: X.cy, lx: X.lx, ly: X.ly, rx: X.rx, ry: X.ry }, imgW: W, imgH: H, marks, photoId };
}

async function buildBoard(s) {
  const { run, st } = await readCur(s);
  const [pl, markers, briefs, votes, throws, marks, tape, results, photos, fb, match, ...noteLens] = await store.pipe([
    ["HGETALL", K.players(s, run)], ["HGETALL", K.markers(s, run)], ["HGETALL", K.briefs(s, run)], ["HGETALL", K.votes(s, run)],
    ["HGETALL", K.throws(s, run)], ["HGETALL", K.marks(s, run)], ["HGETALL", K.tape(s, run)], ["GET", K.results(s, run)],
    ["HGETALL", K.photos(s, run)], ["HGETALL", K.feedback(s, run)], ["HGETALL", K.match(s, run)],
    ...TEAMS.map((t) => ["HLEN", K.notes(s, run, t)])]);
  const players = parseHash(pl);
  const byTeam = {};
  for (const p of Object.values(players)) if (p && !p.kicked) (byTeam[p.team] = byTeam[p.team] || []).push({ first: p.first, initial: p.initial, seat: p.seat });
  const mk = parseHash(markers, false), br = parseHash(briefs);
  const teams = TEAMS.filter((t) => byTeam[t]).map((t) => ({
    team: t, members: byTeam[t].sort((a, b) => a.seat.localeCompare(b.seat)), notes: Number(noteLens[TEAMS.indexOf(t)]) || 0,
    marker: mk[t] || null, brief: br[t] || null,
  }));
  const board = {
    section: s, run, now: nowFn(), state: st, teams, tally: tally(parseHash(votes)), throws: parseHash(throws),
    marks: parseHash(marks), tape: parseHash(tape), results: parseJSON(results),
    photos: Object.values(parseHash(photos)).filter(Boolean).sort((a, b) => a.at - b.at),
    feedback: parseHash(fb), match: parseHash(match), players: Object.keys(players).length,
  };
  if (["instructor", "kpis"].includes(st.phase) || st.instructorResult || st.firstTeam) {
    board.reveal = { text: { up: REVEAL.text.lesson, down: REVEAL.text.choke, first: foundText(teamList(st.firstTeam)) },
      gifs: { up: REVEAL.gifs.lesson, down: REVEAL.gifs.choke }, refRow: REVEAL.ballRow };
  }
  board.ui = REVEAL.ui;   // admin-only labels, so the public host.html source carries none of them
  return board;
}

async function host(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const action = String(body.action || "");
  const { run, st } = await readCur(s);
  let next = null, error = null, status = 200;
  const now = nowFn();
  const present = async () => Object.keys(teamsFrom(await playersOf(s, run))).sort((a, b) => TEAMS.indexOf(a) - TEAMS.indexOf(b));

  switch (action) {
    case "board": break;
    case "reset":
      await store.redis("HINCRBY", K.cur(s), "run", 1);
      await store.redis("HSET", K.cur(s), "state", JSON.stringify(freshState(st.settings, (st.seq || 0) + 1)));
      return ok(await buildBoard(s));
    case "phase": {
      const to = String(body.to || "");
      if (!PHASES.includes(to)) { error = "Unknown phase."; status = 400; break; }
      next = Object.assign({}, st, { phase: to });
      if (to === "design" && st.phase !== "design") next.endsAt = now + DESIGN_MS;
      if (to === "throws" && !st.order.length) { next.order = await present(); next.current = next.order[0] || null; }
      break;
    }
    case "timer":
      if (st.phase !== "design" || !st.endsAt) { error = "The clock runs only during design."; status = 409; break; }
      next = Object.assign({}, st, { endsAt: Math.max(now, st.endsAt + Math.max(-60000, Math.min(60000, Number(body.deltaMs) || 0))) });
      break;
    case "settings": {
      const set = Object.assign({}, st.settings);
      const list = (v, max) => (Array.isArray(v) ? v.map((x) => cleanText(String(x), 16).toLowerCase()).filter(Boolean).slice(0, max) : null);
      const c = list(body.colors, 8), y = list(body.symbols, 8);
      if (c && c.length) set.colors = c;
      if (y && y.length) set.symbols = y;
      for (const [k, lo, hi] of [["xWidthIn", 1, 60], ["penaltyIn", 1, 200], ["hitN", 1, 60]]) {
        if (body[k] != null) { const v = Number(body[k]); if (v >= lo && v <= hi) set[k] = v; }
      }
      next = Object.assign({}, st, { settings: set });
      if (st.lockedRule) next.lockedRule = Object.assign({}, st.lockedRule, { penaltyIn: set.penaltyIn, hitN: set.hitN });
      break;
    }
    case "lockVote": {
      if (st.lockedRule && (await store.redis("GET", K.results(s, run)))) { error = "The rule is final after Reveal."; status = 409; break; }
      const t = tally(parseHash(await store.redis("HGETALL", K.votes(s, run))));
      const summary = SC.SUMMARIES.includes(body.summary) ? body.summary : plurality(t.summary);
      const miss = SC.MISS_RULES.includes(body.miss) ? body.miss : plurality(t.miss);
      if (!summary || !miss) { error = "Tie or no votes: pick the " + (!summary ? "summary" : "miss rule") + "."; status = 409; break; }
      next = Object.assign({}, st, { lockedRule: { summary, miss, penaltyIn: st.settings.penaltyIn, hitN: st.settings.hitN } });
      break;
    }
    case "order": {
      const teams = (Array.isArray(body.teams) ? body.teams : []).filter((t) => TEAM_RE.test(t));
      next = Object.assign({}, st, { order: [...new Set(teams)] });
      if (!next.order.includes(next.current)) next.current = next.order[0] || null;
      break;
    }
    case "current":
      if (body.team !== null && !TEAM_RE.test(String(body.team)) && body.team !== INSTRUCTOR) { error = "Unknown team."; status = 400; break; }
      next = Object.assign({}, st, { current: body.team });
      break;
    case "miss": {
      const t = String(body.team || ""), i = Number(body.i);
      if (!(TEAM_RE.test(t) || t === INSTRUCTOR) || !(i >= 0 && i <= 2)) { error = "Bad throw."; status = 400; break; }
      const cur = parseJSON(await store.redis("HGET", K.throws(s, run), t)) || [false, false, false];
      cur[i] = Boolean(body.missed);
      await store.pipe([["HSET", K.throws(s, run), t, JSON.stringify(cur)], ["EXPIRE", K.throws(s, run), TTL]]);
      await retape(s, run, st);
      break;
    }
    case "marks": {
      const kind = body.kind === "instructor" ? "instructor" : "teams";
      const m = cleanMarks(body, kind);
      if (!m) { error = "Marks need the photo size and an X whose two tips are apart."; status = 400; break; }
      await store.pipe([["HSET", K.marks(s, run), kind, JSON.stringify(m)], ["EXPIRE", K.marks(s, run), TTL]]);
      break;
    }
    case "reveal": {
      if (!body.force && (await store.redis("GET", K.results(s, run)))) { next = Object.assign({}, st, { phase: "reveal" }); break; }
      if (!st.lockedRule) { error = "Lock the vote first."; status = 409; break; }
      const m = parseJSON(await store.redis("HGET", K.marks(s, run), "teams"));
      if (!m) { error = "Save the marks first."; status = 409; break; }
      const [throws, tape, briefs] = await store.pipe([["HGETALL", K.throws(s, run)], ["HGETALL", K.tape(s, run)], ["HGETALL", K.briefs(s, run)]]);
      const teams = [...new Set([...(st.order || []), ...(await present()), ...m.marks.map((x) => x.team)])]
        .sort((a, b) => TEAMS.indexOf(a) - TEAMS.indexOf(b));
      const snapshot = Object.assign({}, m, { xWidthIn: st.settings.xWidthIn, teams });
      const res = computeResults(snapshot, parseHash(throws), tapeNumbers(parseHash(tape, false)), st.lockedRule, teams, parseHash(briefs));
      await store.pipe([["SET", K.results(s, run), JSON.stringify(res)], ["EXPIRE", K.results(s, run), TTL]]);
      next = Object.assign({}, st, { phase: "reveal" });
      break;
    }
    case "tape": {
      const t = String(body.team || ""), i = Number(body.i);
      if (!TEAM_RE.test(t) || !(i >= 0 && i <= 2)) { error = "Bad throw."; status = 400; break; }
      const v = body.inches == null || body.inches === "" ? null : Number(body.inches);
      if (v != null && !(v >= 0 && v <= 500)) { error = "Inches between 0 and 500."; status = 400; break; }
      if (v == null) await store.redis("HDEL", K.tape(s, run), `${t}:${i}`);
      else await store.pipe([["HSET", K.tape(s, run), `${t}:${i}`, String(v)], ["EXPIRE", K.tape(s, run), TTL]]);
      await retape(s, run, st);
      break;
    }
    case "instructor": {
      const color = String(body.color || ""), symbol = String(body.symbol || "");
      if (!st.settings.colors.includes(color) || !st.settings.symbols.includes(symbol)) { error = "Pick a color and a symbol."; status = 400; break; }
      if (await store.redis("HGET", K.pairs(s, run), `${color}|${symbol}`)) { error = "A team has that marker."; status = 409; break; }
      next = Object.assign({}, st, { instructor: { color, symbol }, phase: "instructor" });
      break;
    }
    case "setMarker": {
      // The projector sets or changes a team's marker in any phase (for example on the Throws screen),
      // with the same first-wins claim on the color|symbol pair that phones use.
      const t = String(body.team || ""), color = String(body.color || ""), symbol = String(body.symbol || "");
      if (!TEAM_RE.test(t)) { error = "Unknown team."; status = 400; break; }
      if (!st.settings.colors.includes(color) || !st.settings.symbols.includes(symbol)) { error = "Pick a color and a symbol from Settings."; status = 400; break; }
      const pair = `${color}|${symbol}`;
      if (st.instructor && `${st.instructor.color}|${st.instructor.symbol}` === pair) { error = "That marker is yours."; status = 409; break; }
      const got = await store.redis("HSETNX", K.pairs(s, run), pair, t);
      const holder = Number(got) ? t : await store.redis("HGET", K.pairs(s, run), pair);
      if (holder !== t) { error = `Team ${holder} has that marker.`; status = 409; break; }
      const old = await store.redis("HGET", K.markers(s, run), t);
      const cmds = [["HSET", K.markers(s, run), t, pair], ["EXPIRE", K.markers(s, run), TTL], ["EXPIRE", K.pairs(s, run), TTL]];
      if (old && old !== pair && (await store.redis("HGET", K.pairs(s, run), old)) === t) cmds.push(["HDEL", K.pairs(s, run), old]);
      await store.pipe(cmds);
      break;
    }
    case "instructorScore": {
      const res = parseJSON(await store.redis("GET", K.results(s, run)));
      const m = parseJSON(await store.redis("HGET", K.marks(s, run), "instructor"));
      if (!res || !m) { error = "Reveal first, then save your marks."; status = 409; break; }
      const throws = parseHash(await store.redis("HGETALL", K.throws(s, run)));
      const pts = SC.toInches(m.marks, m.X, m.imgW, m.imgH, st.settings.xWidthIn)[INSTRUCTOR] || [];
      const pen = res.rule.miss === "fixed_penalty" ? Math.max(res.penaltyUsed || res.rule.penaltyIn, SC.effectivePenalty([{ points: pts }], res.rule.penaltyIn)) : res.rule.penaltyIn;
      const mine = SC.teamScore(pts, missCount(throws, INSTRUCTOR), Object.assign({}, res.rule, { penaltyIn: pen }));
      const best = res.ranking.find((r) => !r.last);
      const low = SC.lowerIsBetter(res.rule.summary);
      const wins = !mine.last && mine.score != null && (!best || (low ? mine.score <= best.score : mine.score >= best.score));
      next = Object.assign({}, st, { instructorResult: {
        score: mine.score, wins, closest: mine.closest, misses: missCount(throws, INSTRUCTOR),
        throws: pts.map((p, i) => ({ i, x: m.marks[i].x, y: m.marks[i].y, photoIn: Math.hypot(p.dx, p.dy) })),
        pxPerInch: SC.pxPerInch(m.X, m.imgW, m.imgH, st.settings.xWidthIn), photoId: m.photoId, X: m.X,
        best: best ? { team: best.team, score: best.score } : null,
      } });
      break;
    }
    case "firstTeam": {
      // One or more teams made the ball themselves (body.teams; body.team is still accepted).
      const teams = teamList(Array.isArray(body.teams) ? body.teams : body.team);
      next = Object.assign({}, st, { firstTeam: teams.length ? teams : null, phase: teams.length ? "instructor" : st.phase });
      break;
    }
    case "publishRecap":
      next = Object.assign({}, st, { recap: body.on !== false });
      break;
    default:
      return fail(400, "Unknown action.");
  }
  if (next) {
    next.seq = (st.seq || 0) + 1;
    await saveState(s, next);
    if (action === "phase") { try { await hooks.onPhase(s, run, next.phase); } catch (e) { /* matching is best effort */ } }
  }
  const b = await buildBoard(s);
  if (error) b.error = error;
  return { status, body: b };
}

function tapeNumbers(h) { const o = {}; for (const [k, v] of Object.entries(h)) if (v != null && v !== "") o[k] = Number(v); return o; }
// After Reveal, only the host's deliberate tape entries and miss corrections change the results; the
// photo snapshot stays the one taken at Reveal.
async function retape(s, run, st) {
  const res = parseJSON(await store.redis("GET", K.results(s, run)));
  if (!res) return;
  const [throws, tape, briefs] = await store.pipe([["HGETALL", K.throws(s, run)], ["HGETALL", K.tape(s, run)], ["HGETALL", K.briefs(s, run)]]);
  const fresh = computeResults(res.snapshot, parseHash(throws), tapeNumbers(parseHash(tape, false)), res.rule, res.snapshot.teams, parseHash(briefs));
  await store.redis("SET", K.results(s, run), JSON.stringify(fresh), "EX", TTL);
}

// ---------- photos from Fadel's phone (admin). Stored as data URLs, as Map Gallery stores screenshots.
const MAX_IMAGE = 1_600_000;
const IMG_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
async function uploadPhoto(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const dataUrl = String(body.dataUrl || "");
  if (dataUrl.length > MAX_IMAGE) return fail(413, "The photo is too large. Try again (it is shrunk before upload).");
  if (!IMG_RE.test(dataUrl)) return fail(400, "That is not a JPEG, PNG or WebP photo.");
  const { run } = await readCur(s);
  const id = crypto.randomBytes(9).toString("base64url");
  const meta = { id, kind: body.kind === "instructor" ? "instructor" : "teams", at: nowFn(),
    w: Math.round(Number(body.w)) || null, h: Math.round(Number(body.h)) || null };
  await store.pipe([["SET", K.img(id), dataUrl, "EX", TTL], ["HSET", K.photos(s, run), id, JSON.stringify(meta)], ["EXPIRE", K.photos(s, run), TTL]]);
  return ok({ photoId: id, meta });
}
async function getImage(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400 };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status };
  const id = String(query.id || "");
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return { status: 404 };
  const m = IMG_RE.exec(String((await store.redis("GET", K.img(id))) || ""));
  if (!m) return { status: 404 };
  return { status: 200, type: m[1], buffer: Buffer.from(m[2], "base64"), dataUrl: m[0] };
}

// ---------- AI endpoints (OpenAI). A failed call is an error the page shows, never a silent "nothing".
async function aiCompile(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  const pid = pidOf(body.playerId);
  const p = await playerOf(s, run, pid);
  if (!p) return fail(403, "Join first.");
  if (st.phase !== "design") return fail(409, "Writing is closed.");
  const gate = await store.redis("SET", `fp:${s}:${run}:compiling:${p.team}`, "1", "EX", 15, "NX");
  if (gate == null) return fail(429, "A teammate just compiled. Wait a few seconds.");
  const notes = Object.values(parseHash(await store.redis("HGETALL", K.notes(s, run, p.team)))).filter(Boolean).sort((a, b) => a.at - b.at);
  if (!notes.length) return fail(409, "Add some notes first.");
  let out;
  try { out = await ai.compileBrief(notes.map((n) => ({ part: n.part, text: n.text, first: n.first })), { budgetMs: 28000 }); }
  catch (e) { await store.quiet("DEL", `fp:${s}:${run}:compiling:${p.team}`); return fail(502, "Compiling failed. Try again, or write the brief below."); }
  const brief = Object.assign(cleanBrief(out), { updatedAt: nowFn(), by: p.first + " (compiled)" });
  await store.pipe([["HSET", K.briefs(s, run), p.team, JSON.stringify(brief)], ["EXPIRE", K.briefs(s, run), TTL]]);
  try { await hooks.onBriefSaved(s, run, p.team, brief); } catch (e) { /* best effort */ }
  return ok(await teamView(s, run, st, pid, p));
}
async function aiTranscribe(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const { run, st } = await readCur(s);
  const p = await playerOf(s, run, pidOf(body.playerId));
  if (!p) return fail(403, "Join first.");
  if (st.phase !== "design") return fail(409, "Writing is closed.");
  const audio = String(body.audio || "");
  if (!audio || audio.length > 3000000 || !/^[A-Za-z0-9+/=]+$/.test(audio)) return fail(400, "That recording could not be read. Type it instead.");
  if (await limited(pidOf(body.playerId), "voice")) return fail(429, "Too many recordings. Wait a minute.");
  try { return ok({ text: cleanText(await ai.transcribe(audio, String(body.mime || "audio/webm")), MAX_NOTE) }); }
  catch (e) { return fail(502, "Could not hear that. Type it instead."); }
}
async function aiVision(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const { run, st } = await readCur(s);
  const img = await getImage({ section: s, id: body.photoId, key: body.key, ip });
  if (img.status !== 200) return fail(404, "Photo not found.");
  const pairs = {};
  if (body.kind === "instructor") { if (st.instructor) pairs[`${st.instructor.color}|${st.instructor.symbol}`] = INSTRUCTOR; }
  else for (const [team, pair] of Object.entries(parseHash(await store.redis("HGETALL", K.markers(s, run)), false))) if (pair) pairs[pair] = team;
  if (!Object.keys(pairs).length) return fail(409, "No markers picked yet.");
  try { return ok(await ai.readBoard(img.dataUrl, pairs)); }
  catch (e) { return fail(502, "AI could not read the photo"); }
}

// ---------- CSV export (admin): one row per student, with the team's result.
function csvCell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
async function exportCsv(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400, text: "bad section\n" };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status, text: denied.body.error + "\n" };
  const { run } = await readCur(s);
  const players = await playersOf(s, run);
  const res = parseJSON(await store.redis("GET", K.results(s, run)));
  const rank = {};
  for (const r of (res && res.ranking) || []) rank[r.team] = r;
  const rows = [["section", "run", "team", "first", "initial", "seat", "rank", "score", "winner", "rule"]];
  for (const p of Object.values(players).sort((a, b) => a.seat.localeCompare(b.seat))) {
    const r = rank[p.team] || {};
    rows.push([s, run, p.team, p.first, p.initial, p.seat, r.rank || "", r.score == null ? "" : r.score,
      res && res.winner && res.winner.team === p.team ? "TRUE" : "FALSE", res ? `${res.rule.summary}/${res.rule.miss}` : ""]);
  }
  return { status: 200, filename: `flight_plan_${s}_run${run}.csv`, text: rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n" };
}

module.exports = {
  join, getState, team, teamAction, vote, host, exportCsv, limited, buildBoard, readCur, adminCheck, uploadPhoto, getImage,
  computeResults, cleanBrief, setNow, setHooks, setAI, aiCompile, aiTranscribe, aiVision,
  SECTIONS, TEAMS, PHASES, PARTS, K, INSTRUCTOR, SNAPSHOT_CACHE,
};

// Jev feedback and matching (Task 8). Tests may replace these with setHooks.
setHooks(require("./_kpi").hooks(module.exports));
