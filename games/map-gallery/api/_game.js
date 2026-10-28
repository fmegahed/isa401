// Map Gallery (Class 19): all game logic. The api/*.js handlers are thin wrappers around this module.
// Not a function of its own: Vercel ignores underscore-prefixed files in api/.
// Join, seats, admin key and rate limits are adapted from games/press-time/api/_game.js.
//
// Section pointer: mg:{s}:cur is one hash {run, state, players, kicks}, so the public snapshot
// (GET /api/state) costs a single HGETALL and is cached 1 s by the Vercel CDN.
//   state  JSON {phase, startedAt, endsAt, seq}
//
// Phase model (the host moves every step; a clock reaching 0:00 changes nothing by itself; Fadel's
// times, Oct 27, each adjustable by a minute either way):
//   lobby    players join
//   plan     the 10-minute plan clock; plans save as drafts until the build starts
//   build    the 15-minute build clock; plans are locked; maps may be submitted
//   submit   the 2-minute submit clock; maps may be submitted
//   vote     the 6-minute vote clock: six blind matchups per student, in class; no more maps
//   closed   nothing more
// Host actions: plan, build, submit, vote, close, reopen, extend, shorten, reset, code (a code for an
// absent student).
//
// Per run: players (pid -> {first, initial, seat, joinedAt, kicked, code}), seats (seat -> pid),
// plans (pid -> plan), subs (pid -> map submission), chk (pid -> last pin check), voters (pid ->
// {done, current, pairs, seen}), expo (map key -> times shown), votes (list), after (pid -> guess
// and "steal one idea"). A map key is "{section}:{run}:{pid}"; section B votes on A's maps too.
// Global: mg:codes (code -> {s, run, pid}) so a student can vote later from any device.
// Images: mg:img:{id} holds one JPEG data URL; nothing about the student is in the id.
const crypto = require("crypto");
const store = require("./_store");
const V = require("./_vision");
const J = require("./_judge");
const RUBRIC = require("./_rubric.json");

const SECTIONS = ["A", "B", "Z"];
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const PID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const TTL = 120 * 24 * 3600;         // keep everything through the end of the semester
const MIN = 60 * 1000;
const CLOCKS = { plan: 10 * MIN, build: 15 * MIN, submit: 2 * MIN, vote: 6 * MIN };
const EXTEND_MS = MIN;
const PER_MINUTE = 900;              // per-address ceiling (a whole lab shares one address)
const ADMIN_FAILS = 10;
const SNAPSHOT_CACHE = "public, s-maxage=1, stale-while-revalidate=1";
const NEXT = { lobby: "plan", plan: "build", build: "submit", submit: "vote", vote: "close" };
const MATCHES = 6;                   // matchups per student in class
const POOLS = { A: ["A"], B: ["B"], Z: ["Z"] };   // each section votes on its own maps (results are shown the same day)

const TOOLS = ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Grok", "Meta AI", "DeepSeek", "Other"];
const KINDS = ["What it shows (measure)", "Butler", "Color", "Title or text", "Legend", "Change over time", "Something creative"];
const PLAN_FIELDS = ["audience", "measure", "period", "butler", "colors", "title", "creative", "prompt"];
const PLAN_MAX = { audience: 400, measure: 400, period: 200, butler: 400, colors: 400, title: 200, creative: 400, prompt: 4000 };
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // no 0/O, 1/I/L

let nowFn = () => Date.now();
function setNow(fn) { nowFn = fn || (() => Date.now()); }
const now = () => nowFn();

const K = {
  cur: (s) => `mg:${s}:cur`,
  players: (s, r) => `mg:${s}:${r}:players`,
  seats: (s, r) => `mg:${s}:${r}:seats`,
  plans: (s, r) => `mg:${s}:${r}:plans`,
  subs: (s, r) => `mg:${s}:${r}:subs`,
  chk: (s, r) => `mg:${s}:${r}:chk`,
  grades: (s, r) => `mg:${s}:${r}:grades`,
  checks: (s, r) => `mg:${s}:${r}:checks`,
  voters: (s, r) => `mg:${s}:${r}:voters`,
  expo: (s, r) => `mg:${s}:${r}:expo`,
  votes: (s, r) => `mg:${s}:${r}:votes`,
  after: (s, r) => `mg:${s}:${r}:after`,
  pgrades: (s, r) => `mg:${s}:${r}:pgrades`,
  codes: () => "mg:codes",
  img: (id) => `mg:img:${id}`,
};

// ---------- text (names from Game Day; free text keeps punctuation, loses control characters)
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
// Free text: newlines kept (prompts have them), other control characters dropped, trimmed, capped.
function cleanText(v, max) {
  if (typeof v !== "string") return "";
  const t = v.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁩﻿]/g, "").trim();
  return Array.from(t).slice(0, max).join("");
}
const oneLine = (v, max) => cleanText(v, max).replace(/\s+/g, " ");

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
async function adminCheck(key, ip) {
  if (keyMatches(key)) return null;
  const rl = `mg:rl:admin:${ip || "local"}:${Math.floor(now() / 60000)}`;
  const n = Number(await store.quiet("INCR", rl)) || 0;
  if (n === 1) await store.quiet("EXPIRE", rl, 120);
  return n > ADMIN_FAILS ? fail(429, "Too many wrong keys. Wait a minute.") : fail(403, "Wrong key.");
}
async function limited(ip, kind) {
  const key = `mg:rl:${kind}:${ip}:${Math.floor(now() / 60000)}`;
  const used = await store.quiet("INCR", key);
  if (used === 1) await store.quiet("EXPIRE", key, 120);
  return Boolean(used && used > PER_MINUTE);
}
function randomCode() {
  const b = crypto.randomBytes(6);
  return Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
}
// A new code, unique across sections and runs (HSETNX makes the claim atomic).
async function newCode(rec) {
  for (let i = 0; i < 8; i++) {
    const c = randomCode();
    if (await store.redis("HSETNX", K.codes(), c, JSON.stringify(rec))) return c;
  }
  throw new Error("could not make a code");
}

// ---------- state
const LOBBY = { phase: "lobby", startedAt: null, endsAt: null, seq: 0 };
function parseState(raw) { return Object.assign({}, LOBBY, parseJSON(raw) || {}); }
async function readCur(s) {
  const h = parseHash(await store.redis("HGETALL", K.cur(s)), false);
  if (h.run == null) await store.redis("HSETNX", K.cur(s), "run", "1");
  return { run: Number(h.run) || 1, st: parseState(h.state), players: Math.max(0, Number(h.players) || 0), kicks: Number(h.kicks) || 0 };
}
function saveState(s, st) { return store.redis("HSET", K.cur(s), "state", JSON.stringify(st)); }
const seqOf = (cur) => (cur.st.seq || 0) + cur.kicks;
const canSubmit = (phase) => phase === "build" || phase === "submit";

async function activePlayer(s, run, pid) {
  const p = parseJSON(await store.redis("HGET", K.players(s, run), pid));
  return p && !p.kicked ? p : null;
}

// ---------- players
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

  const cur = await readCur(s), run = cur.run;
  let pid = pidOf(body.playerId);
  let prev = null;
  if (pid) {
    prev = parseJSON(await store.redis("HGET", K.players(s, run), pid));
    if (!prev) pid = null;
  }
  if (!prev && cur.st.phase === "closed") return fail(409, "Submissions are closed for this section.");
  if (!pid) pid = crypto.randomBytes(12).toString("base64url");
  const code = prev && prev.code ? prev.code : await newCode({ s, run, pid });

  const rec = { first, initial, seat, joinedAt: prev ? prev.joinedAt : now(), kicked: false, code };
  const cmds = [["HSET", K.players(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.players(s, run), TTL]];
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
        cmds.push(["HSET", K.players(s, run), holder, JSON.stringify(old)],
          ["HINCRBY", K.cur(s), "players", -1], ["HINCRBY", K.cur(s), "kicks", 1]);
      }
    }
    cmds.push(["HSET", K.seats(s, run), seat, pid], ["EXPIRE", K.seats(s, run), TTL]);
  }
  await store.pipe(cmds);
  return ok({ playerId: pid, runId: run, code });
}

// body: {code}. A student who switches computers or closes the tab types their personal code on the
// join screen to get the same player back (plan, map, votes and results), in the current run only.
async function resume(body) {
  const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) return fail(400, "A code has 6 letters and digits.");
  const rec = parseJSON(await store.redis("HGET", K.codes(), code));
  if (!rec || !SECTIONS.includes(rec.s)) return fail(404, "That code was not found. Check it, or join with your name.");
  const cur = await readCur(rec.s);
  if (cur.run !== rec.run) return fail(410, "That code is from an earlier round. Join with your name.");
  const p = await activePlayer(rec.s, rec.run, rec.pid);
  if (!p) return fail(404, "That code was not found. Check it, or join with your name.");
  return ok({ section: rec.s, playerId: rec.pid, runId: rec.run, first: p.first });
}

async function getState(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const cur = await readCur(s);
  const st = cur.st;
  return ok({
    runId: cur.run, phase: st.phase, startedAt: st.startedAt, endsAt: st.endsAt, serverNow: now(),
    players: cur.players, seq: seqOf(cur),
  }, SNAPSHOT_CACHE);
}

// What a student may see of their own map: what they sent, never any scoring.
function publicSub(sub) {
  if (!sub) return null;
  return {
    submittedAt: sub.submittedAt, tool: sub.tool, toolOther: sub.toolOther || "", model: sub.model || "",
    prompts: sub.prompts, share: sub.share || "", finalPrompt: sub.finalPrompt || "", pins: sub.pins || [],
  };
}

async function me(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const cur = await readCur(s);
  const base = { runId: cur.run, phase: cur.st.phase, seq: seqOf(cur), serverNow: now() };
  const pid = pidOf(query.playerId);
  const p = pid ? await activePlayer(s, cur.run, pid) : null;
  if (!p) return ok(Object.assign(base, { you: null, kicked: true }));
  const [plan, sub, n] = await store.pipe([["HGET", K.plans(s, cur.run), pid], ["HGET", K.subs(s, cur.run), pid], ["HGET", K.checks(s, cur.run), pid]]);
  return ok(Object.assign(base, {
    you: { first: p.first, initial: p.initial, seat: p.seat, code: p.code }, kicked: false,
    plan: parseJSON(plan), sub: publicSub(parseJSON(sub)), checksLeft: Math.max(0, CHECKS_PER_PLAYER - (Number(n) || 0)),
  }));
}

// ---------- plan
// body: {section, playerId, plan: {audience, ...}, final}. Drafts save during the plan phase. After
// the build starts, a student with no saved plan (joined late) may still save one, marked late.
async function savePlan(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  if (!pid) return fail(403, "Join the game first.");
  const cur = await readCur(s), run = cur.run, phase = cur.st.phase;
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");
  const prev = parseJSON(await store.redis("HGET", K.plans(s, run), pid));
  let late = false;
  if (phase === "lobby") return fail(409, "The plan has not started yet.");
  if (phase !== "plan") {
    // a plan written during the plan phase is locked; a late joiner's plan stays open until final
    if (prev && (!prev.late || prev.locked)) return fail(409, "Plans are locked now. Build your map.");
    if (phase === "closed") return fail(409, "Submissions are closed.");
    late = true;
  }
  const src = body.plan && typeof body.plan === "object" ? body.plan : {};
  const plan = {};
  for (const f of PLAN_FIELDS) plan[f] = cleanText(src[f], PLAN_MAX[f]);
  if (!PLAN_FIELDS.some((f) => plan[f])) return fail(400, "Write at least one part of your plan.");
  const final = Boolean(body.final);
  const rec = Object.assign(plan, { savedAt: now(), final: final || Boolean(prev && prev.final), late, locked: late && final });
  await store.pipe([["HSET", K.plans(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.plans(s, run), TTL]]);
  return ok({ ok: true, savedAt: rec.savedAt, final: rec.final });
}

// ---------- map submission
const MAX_BODY = 4_400_000;
const MAX_IMAGE = 1_600_000;          // data URL length; the browser aims for about 1 MB
const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
const CHECKS_PER_PLAYER = 3;
const CHECKS_PER_RUN = 250;

function cleanPins(raw) {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 6) return null;
  const pins = [];
  for (const p of raw) {
    const x = Number(p && p.x), y = Number(p && p.y);
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return null;
    const kind = KINDS.includes(p.kind) ? p.kind : null;
    const text = oneLine(p.text, 90);
    if (!kind || !text) return null;
    pins.push({ x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000, kind, text });
  }
  return pins;
}

// body: {section, playerId, image, w, h, tool, toolOther, model, prompts, share, finalPrompt, pins}
async function submit(body, rawLength) {
  if (rawLength > MAX_BODY) return fail(413, "That image is too large. Snip a smaller area.");
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  if (!pid) return fail(403, "Join the game first.");
  if (typeof body.image !== "string" || !IMG_RE.test(body.image) || body.image.length > MAX_IMAGE) return fail(400, "Paste a screenshot of your map first.");
  const tool = TOOLS.includes(body.tool) ? body.tool : null;
  if (!tool) return fail(400, "Pick the AI tool you used.");
  const toolOther = tool === "Other" ? oneLine(body.toolOther, 40) : "";
  if (tool === "Other" && !toolOther) return fail(400, "Type the name of the AI tool you used.");
  const prompts = Math.floor(Number(body.prompts));
  if (!(prompts >= 1 && prompts <= 300)) return fail(400, "Enter how many prompts you sent (a number).");
  const pins = cleanPins(body.pins);
  if (!pins) return fail(400, "Pin 2 to 6 features, each with a kind and a sentence.");
  const finalPrompt = cleanText(body.finalPrompt, 4000);
  if (!finalPrompt) return fail(400, "Paste the last prompt you sent.");
  let share = oneLine(body.share, 300);
  if (share && !/^https:\/\/\S+$/.test(share)) return fail(400, "The share link should start with https://");
  const w = Math.floor(Number(body.w)) || 0, h = Math.floor(Number(body.h)) || 0;
  // the page rejects snips under 600 x 400 before shrinking big ones to 1,600 px; this is a floor
  if (w < 400 || h < 300) return fail(400, "That screenshot is too small. Open the image full size in the chat, or download it and choose the file.");

  const cur = await readCur(s), run = cur.run;
  if (!canSubmit(cur.st.phase)) return fail(409, cur.st.phase === "closed" ? "Submissions are closed." : "Submissions open when the build starts.");
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");

  const prev = parseJSON(await store.redis("HGET", K.subs(s, run), pid));
  const imgId = crypto.randomBytes(12).toString("hex");
  const rec = {
    imgId, w, h, tool, toolOther, model: oneLine(body.model, 60), prompts, share, finalPrompt, pins,
    submittedAt: now(), versions: ((prev && prev.versions) || 0) + 1,
  };
  const cmds = [
    ["SET", K.img(imgId), body.image, "EX", TTL],
    ["HSET", K.subs(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.subs(s, run), TTL],
  ];
  if (prev && prev.imgId) cmds.push(["DEL", K.img(prev.imgId)]);
  // a plan still open when the map comes in is locked (late joiners, mostly)
  const plan = parseJSON(await store.redis("HGET", K.plans(s, run), pid));
  if (plan && !plan.locked) cmds.push(["HSET", K.plans(s, run), pid, JSON.stringify(Object.assign(plan, { locked: true }))]);
  await store.pipe(cmds);
  return ok({ ok: true, submittedAt: rec.submittedAt, versions: rec.versions });
}

// ---------- "Check my pins"
let checkerFn = (image, pins) => V.checkPins(image, pins);
function setChecker(fn) { checkerFn = fn || ((image, pins) => V.checkPins(image, pins)); }

// body: {section, playerId, image (the screenshot with the pins drawn on it), pins: [{kind, text}]}
// Answers only yes/no per pin (no rubric, so no hints about the data); nothing the model writes reaches the page.
async function check(body, rawLength) {
  if (rawLength > MAX_BODY) return fail(413, "That image is too large. Snip a smaller area.");
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  if (!pid) return fail(403, "Join the game first.");
  if (typeof body.image !== "string" || !IMG_RE.test(body.image) || body.image.length > MAX_IMAGE) return fail(400, "Paste a screenshot of your map first.");
  const raw = Array.isArray(body.pins) ? body.pins.slice(0, 6) : [];
  const pins = raw.map((p) => ({ kind: KINDS.includes(p && p.kind) ? p.kind : "", text: oneLine(p && p.text, 90) }));
  if (pins.length < 1 || pins.some((p) => !p.text)) return fail(400, "Write a sentence for every pin first.");
  const cur = await readCur(s), run = cur.run;
  if (!canSubmit(cur.st.phase)) return fail(409, "Checks are open while maps can be submitted.");
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");
  const used = Number(await store.redis("HINCRBY", K.checks(s, run), pid, 1)) || 0;
  await store.quiet("EXPIRE", K.checks(s, run), TTL);
  if (used > CHECKS_PER_PLAYER) return fail(429, "You have used your " + CHECKS_PER_PLAYER + " checks. You can still submit.");
  const total = Number(await store.redis("HINCRBY", K.cur(s), "checks:" + run, 1)) || 0;
  if (total > CHECKS_PER_RUN) return fail(429, "The class has used up its checks. You can still submit.");

  let res;
  try { res = await checkerFn(body.image, pins); } catch (e) {
    await store.quiet("HINCRBY", K.checks(s, run), pid, -1);   // a failed check does not count
    return ok({ status: "service_error" });
  }
  await store.pipe([["HSET", K.chk(s, run), pid, JSON.stringify(Object.assign({ at: now(), pins }, res))], ["EXPIRE", K.chk(s, run), TTL]]);
  return ok({ status: "ok", seen: res.seen, checksLeft: Math.max(0, CHECKS_PER_PLAYER - used) });
}

// ---------- voting (in class: six blind matchups per student)
// Maps a section votes on: its own current run, plus section A's current run for section B, so the
// two sections end up on one scale. Each map is identified by "{section}:{run}:{pid}".
async function pool(s) {
  const out = {};
  for (const ps of POOLS[s]) {
    const run = (await readCur(ps)).run;
    const subs = parseHash(await store.redis("HGETALL", K.subs(ps, run)));
    for (const [pid, sub] of Object.entries(subs)) if (sub && sub.imgId) out[`${ps}:${run}:${pid}`] = sub.imgId;
  }
  return out;
}
const pairKey = (a, b) => [a, b].sort().join("|");
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// The two least-shown maps this voter has not been paired on before, never their own map.
function pickPair(maps, mine, expo, pairs) {
  const keys = shuffle(Object.keys(maps).filter((k) => k !== mine)).sort((a, b) => (expo[a] || 0) - (expo[b] || 0));
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      if (!pairs.includes(pairKey(keys[i], keys[j]))) return crypto.randomInt(2) ? [keys[i], keys[j]] : [keys[j], keys[i]];
    }
  }
  return null;
}
const publicMatch = (v, maps) => ({ id: v.current.id, n: v.done + 1, total: MATCHES, left: maps[v.current.L] || v.current.imgL, right: maps[v.current.R] || v.current.imgR });

// query: {section, playerId, more?} -> {status: "match", match} | {status: "done", seen} | {status: "not_enough"}
async function match(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(query.playerId);
  if (!pid) return fail(403, "Join the game first.");
  const cur = await readCur(s), run = cur.run;
  if (cur.st.phase !== "vote") return fail(409, "Voting is not open.");
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");
  const v = parseJSON(await store.redis("HGET", K.voters(s, run), pid)) || { done: 0, current: null, pairs: [], seen: [] };
  const maps = await pool(s);
  if (v.current) return ok({ status: "match", match: publicMatch(v, maps) });
  const limit = MATCHES * (query.more ? 2 : 1);
  if (v.done >= limit) return ok({ status: "done", done: v.done, seen: v.seen });
  const expo = parseHash(await store.redis("HGETALL", K.expo(s, run)), false);
  const pair = pickPair(maps, `${s}:${run}:${pid}`, expo, v.pairs);
  if (!pair) return ok({ status: v.done ? "done" : "not_enough", done: v.done, seen: v.seen });
  const [L, R] = pair;
  v.current = { id: crypto.randomBytes(6).toString("hex"), L, R, imgL: maps[L], imgR: maps[R], at: now() };
  await store.pipe([
    ["HSET", K.voters(s, run), pid, JSON.stringify(v)], ["EXPIRE", K.voters(s, run), TTL],
    ["HINCRBY", K.expo(s, run), L, 1], ["HINCRBY", K.expo(s, run), R, 1], ["EXPIRE", K.expo(s, run), TTL],
  ]);
  return ok({ status: "match", match: publicMatch(v, maps) });
}

// body: {section, playerId, matchId, choice: "L" | "R" | "T", reason?: one of KINDS}
async function vote(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  if (!pid) return fail(403, "Join the game first.");
  const choice = ["L", "R", "T"].includes(body.choice) ? body.choice : null;
  if (!choice) return fail(400, "Pick a map.");
  const reason = KINDS.includes(body.reason) ? body.reason : null;
  const cur = await readCur(s), run = cur.run;
  if (cur.st.phase !== "vote") return fail(409, "Voting is not open.");
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");
  const v = parseJSON(await store.redis("HGET", K.voters(s, run), pid));
  if (!v || !v.current || v.current.id !== String(body.matchId || "")) return fail(409, "That matchup is over. Here is the next one.");
  const c = v.current;
  const rec = { voter: `${s}:${run}:${pid}`, L: c.L, R: c.R, imgL: c.imgL, imgR: c.imgR, choice, reason, shownAt: c.at, at: now() };
  v.done += 1; v.pairs.push(pairKey(c.L, c.R));
  for (const img of [c.imgL, c.imgR]) if (!v.seen.includes(img)) v.seen.push(img);
  v.current = null;
  await store.pipe([
    ["RPUSH", K.votes(s, run), JSON.stringify(rec)], ["EXPIRE", K.votes(s, run), TTL],
    ["HSET", K.voters(s, run), pid, JSON.stringify(v)],
  ]);
  return ok({ ok: true, done: v.done, total: MATCHES });
}

// body: {section, playerId, guess (a tool), steal: {img, kind, text}}: both optional, after the votes
async function after(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  if (!pid) return fail(403, "Join the game first.");
  const cur = await readCur(s), run = cur.run;
  if (!(await activePlayer(s, run, pid))) return fail(403, "Join the game first.");
  const v = parseJSON(await store.redis("HGET", K.voters(s, run), pid));
  if (!v || !v.done) return fail(409, "Vote first.");
  const guess = TOOLS.includes(body.guess) ? body.guess : null;
  const st = body.steal && typeof body.steal === "object" ? body.steal : null;
  const steal = st && v.seen.includes(st.img) && KINDS.includes(st.kind) && oneLine(st.text, 140)
    ? { img: st.img, kind: st.kind, text: oneLine(st.text, 140) } : null;
  if (!guess && !steal) return fail(400, "Pick a tool or an idea, or skip.");
  const prev = parseJSON(await store.redis("HGET", K.after(s, run), pid)) || {};
  const rec = Object.assign(prev, guess ? { guess } : {}, steal ? { steal } : {}, { at: now() });
  await store.pipe([["HSET", K.after(s, run), pid, JSON.stringify(rec)], ["EXPIRE", K.after(s, run), TTL]]);
  return ok({ ok: true });
}

// query: {section, playerId, id}: one map's JPEG, for a voter who has been shown it; once the
// results are up, any map of the section (the gallery is open to the class then)
async function voteImage(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(query.playerId);
  const id = String(query.id || "");
  if (!pid || !/^[a-f0-9]{24}$/.test(id)) return fail(400, "Bad request.");
  const cur = await readCur(s), run = cur.run, phase = cur.st.phase;
  if (!["vote", "closed", "results"].includes(phase)) return fail(409, "Voting is not open.");
  let allowed;
  if (phase === "results") allowed = (await activePlayer(s, run, pid)) && Object.values(await pool(s)).includes(id);
  else {
    const v = parseJSON(await store.redis("HGET", K.voters(s, run), pid));
    allowed = v && (v.seen.includes(id) || (v.current && (v.current.imgL === id || v.current.imgR === id)));
  }
  if (!allowed) return fail(403, "Not one of your matchups.");
  const url = await store.redis("GET", K.img(id));
  if (!url) return fail(404, "No such image.");
  return { status: 200, jpeg: Buffer.from(url.slice(url.indexOf(",") + 1), "base64") };
}

// ---------- AI grading (admin; the projector runs it during the vote so results are ready after)
let graderFn = (image) => V.gradeMap(image);
function setGrader(fn) { graderFn = fn || ((image) => V.gradeMap(image)); }
const askPlan = (text) => J.askJev(RUBRIC, text, process.env.JEV_API_KEY || "", { budgetMs: 25000 });
let planJudgeFn = askPlan;
function setPlanJudge(fn) { planJudgeFn = fn || askPlan; }
const GRADE_BATCH = 6;   // maps per request, graded in parallel, to stay inside the function time limit
const PLAN_BATCH = 8;

const PLAN_LABELS = { audience: "Audience and takeaway", measure: "Measure", period: "Time period", butler: "How Butler stands out", colors: "Colors and legend", title: "Title idea", creative: "Creative idea", prompt: "First prompt for the AI" };
function planText(pl) { return PLAN_FIELDS.filter((f) => pl[f]).map((f) => PLAN_LABELS[f] + ": " + pl[f]).join("\n"); }
// Jev's answers -> {p: {key: probability}, wrong: {key: probability}, met: [keys], flags: [keys]}
function scorePlan(answers) {
  const p = {}, wrong = {};
  RUBRIC.ideas.forEach((idea, i) => { p[idea.key] = answers["idea_" + i] ? Number(answers["idea_" + i].noul) || 0 : 0; });
  (RUBRIC.wrong || []).forEach((w, i) => { wrong[w.key] = answers["wrong_" + i] ? Number(answers["wrong_" + i].noul) || 0 : 0; });
  return { p, wrong, met: Object.keys(p).filter((k) => p[k] >= J.MET), flags: Object.keys(wrong).filter((k) => wrong[k] >= J.WRONG) };
}

// body: {section, key, run?, force?}. Grades up to GRADE_BATCH maps (gpt-6-luna, Fadel's rubric) and
// PLAN_BATCH plans (Jev, api/_rubric.json) that have no grade for their current version. Call again
// until remaining is 0. force=<ms timestamp> regrades anything graded before it.
async function grade(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const run = /^\d+$/.test(String(body.run || "")) ? Number(body.run) : (await readCur(s)).run;
  const [subFlat, gradeFlat, planFlat, pgFlat] = await store.pipe([["HGETALL", K.subs(s, run)], ["HGETALL", K.grades(s, run)],
    ["HGETALL", K.plans(s, run)], ["HGETALL", K.pgrades(s, run)]]);
  const subs = parseHash(subFlat), grades = parseHash(gradeFlat), plans = parseHash(planFlat), pgrades = parseHash(pgFlat);
  const since = Number(body.force) || 0;
  const todo = Object.keys(subs).filter((pid) => { const g = grades[pid]; return !g || g.imgId !== subs[pid].imgId || (since && g.at < since); });
  const ptodo = Object.keys(plans).filter((pid) => { const g = pgrades[pid]; return !g || g.savedAt !== plans[pid].savedAt || (since && g.at < since); });
  const mapJobs = todo.slice(0, GRADE_BATCH).map(async (pid) => {
    const image = await store.redis("GET", K.img(subs[pid].imgId));
    if (!image) return { kind: "map", error: "image missing" };
    try {
      const g = await graderFn(image);
      await store.redis("HSET", K.grades(s, run), pid, JSON.stringify(Object.assign({ at: now(), imgId: subs[pid].imgId, model: V.MODEL }, g)));
      return { kind: "map", ok: true };
    } catch (e) { return { kind: "map", error: "service" }; }
  });
  const planJobs = ptodo.slice(0, PLAN_BATCH).map(async (pid) => {
    try {
      const answers = await planJudgeFn(planText(plans[pid]));
      await store.redis("HSET", K.pgrades(s, run), pid, JSON.stringify(Object.assign({ at: now(), savedAt: plans[pid].savedAt }, scorePlan(answers))));
      return { kind: "plan", ok: true };
    } catch (e) { return { kind: "plan", error: "service" }; }
  });
  const results = await Promise.all(mapJobs.concat(planJobs));
  await store.quiet("EXPIRE", K.grades(s, run), TTL);
  await store.quiet("EXPIRE", K.pgrades(s, run), TTL);
  const n = (kind) => results.filter((r) => r.kind === kind && r.ok).length;
  return ok({ run, graded: n("map"), plansGraded: n("plan"), failed: results.filter((r) => !r.ok).length,
    remaining: todo.length - n("map"), plansRemaining: ptodo.length - n("plan") });
}

// ---------- results (the same day, right after the vote)
// Bradley-Terry strengths by Hunter's MM algorithm; a tie counts half a win each way. Every map also
// gets one win and one loss against a virtual average map, so a map that never lost stays finite.
function bradleyTerry(keys, votes) {
  const idx = new Map(keys.map((k, i) => [k, i]));
  const n = keys.length, w = new Array(n).fill(1), games = Array.from({ length: n }, () => new Map());
  for (const v of votes) {
    const i = idx.get(v.L), j = idx.get(v.R);
    if (i == null || j == null || i === j) continue;
    w[i] += v.choice === "L" ? 1 : v.choice === "T" ? 0.5 : 0;
    w[j] += v.choice === "R" ? 1 : v.choice === "T" ? 0.5 : 0;
    games[i].set(j, (games[i].get(j) || 0) + 1); games[j].set(i, (games[j].get(i) || 0) + 1);
  }
  let p = new Array(n).fill(1);
  for (let it = 0; it < 300 && n; it++) {
    const next = p.map((pi, i) => {
      let d = 2 / (pi + 1);                       // the virtual opponent, strength 1, met twice
      for (const [j, nij] of games[i]) d += nij / (pi + p[j]);
      return w[i] / d;
    });
    const g = Math.exp(next.reduce((a, x) => a + Math.log(x), 0) / n);
    p = next.map((x) => x / g);
  }
  const out = {};
  keys.forEach((k, i) => { out[k] = Math.round(Math.log(p[i]) * 1000) / 1000; });
  return out;
}

async function loadRound(s) {
  const cur = await readCur(s), run = cur.run;
  const [pFlat, planFlat, subFlat, gFlat, pgFlat, aFlat, list] = await store.pipe([
    ["HGETALL", K.players(s, run)], ["HGETALL", K.plans(s, run)], ["HGETALL", K.subs(s, run)], ["HGETALL", K.grades(s, run)],
    ["HGETALL", K.pgrades(s, run)], ["HGETALL", K.after(s, run)], ["LRANGE", K.votes(s, run), 0, -1]]);
  return { cur, run, players: parseHash(pFlat), plans: parseHash(planFlat), subs: parseHash(subFlat), grades: parseHash(gFlat),
    pgrades: parseHash(pgFlat), after: parseHash(aFlat), votes: (list || []).map(parseJSON).filter(Boolean) };
}
function tallies(R, s) {
  const mk = (pid) => `${s}:${R.run}:${pid}`;
  const keys = Object.keys(R.subs).map(mk);
  const stats = {};
  for (const k of keys) stats[k] = { wins: 0, losses: 0, ties: 0, reasons: {}, beatenBy: {} };
  for (const v of R.votes) {
    const L = stats[v.L], Rr = stats[v.R];
    if (!L || !Rr) continue;
    if (v.choice === "T") { L.ties++; Rr.ties++; continue; }
    const [win, lose, wk] = v.choice === "L" ? [L, Rr, v.L] : [Rr, L, v.R];
    win.wins++; lose.losses++;
    if (v.reason) win.reasons[v.reason] = (win.reasons[v.reason] || 0) + 1;
    lose.beatenBy[wk] = (lose.beatenBy[wk] || 0) + 1;
  }
  return { keys, stats, bt: bradleyTerry(keys, R.votes), mk };
}

// query: {section, key, ip}: everything the projector's results screens need (admin only)
async function results(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  const R = await loadRound(s);
  const T = tallies(R, s);
  const maps = Object.keys(R.subs).map((pid) => {
    const p = R.players[pid] || {}, sub = R.subs[pid], k = T.mk(pid), st = T.stats[k];
    const g = R.grades[pid] && R.grades[pid].imgId === sub.imgId ? R.grades[pid] : null;
    const pg = R.pgrades[pid] && R.plans[pid] && R.pgrades[pid].savedAt === R.plans[pid].savedAt ? R.pgrades[pid] : null;
    return {
      key: k, first: p.first || "?", initial: p.initial || "", seat: p.seat || "", imgId: sub.imgId, w: sub.w, h: sub.h,
      tool: sub.tool === "Other" ? (sub.toolOther || "Other") : sub.tool, toolGroup: sub.tool, model: sub.model, prompts: sub.prompts,
      finalPrompt: sub.finalPrompt, pins: sub.pins, plan: R.plans[pid] || null, grade: g, planGrade: pg,
      wins: st.wins, losses: st.losses, ties: st.ties, games: st.wins + st.losses + st.ties, score: T.bt[k], reasons: st.reasons,
    };
  });
  const guesses = {};
  for (const a of Object.values(R.after)) if (a && a.guess) guesses[a.guess] = (guesses[a.guess] || 0) + 1;
  const steals = {};
  for (const a of Object.values(R.after)) if (a && a.steal) { const m = maps.find((x) => x.imgId === a.steal.img); if (m) steals[m.key] = (steals[m.key] || 0) + 1; }
  for (const m of maps) m.borrowed = steals[m.key] || 0;
  const players = Object.values(R.players).filter((p) => p && !p.kicked && !p.absent).length;
  return ok({ section: s, run: R.run, players, votes: R.votes.length, voters: new Set(R.votes.map((v) => v.voter)).size,
    plans: Object.keys(R.plans).length, maps, guesses, ungraded: maps.filter((m) => !m.grade).length,
    plansUngraded: Object.keys(R.plans).filter((pid) => !(R.pgrades[pid] && R.pgrades[pid].savedAt === R.plans[pid].savedAt)).length });
}

// query: {section, playerId}: a student's own results, once Fadel has put the results up
async function mine(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(query.playerId);
  if (!pid) return fail(403, "Join the game first.");
  const R = await loadRound(s);
  if (R.cur.st.phase !== "results") return fail(409, "The results are not up yet.");
  if (!R.players[pid] || R.players[pid].kicked) return fail(403, "Join the game first.");
  if (!R.subs[pid]) return ok({ hasMap: false });
  const T = tallies(R, s), k = T.mk(pid), st = T.stats[k];
  const byKey = {};
  for (const [opid, sub] of Object.entries(R.subs)) byKey[T.mk(opid)] = { pid: opid, imgId: sub.imgId };
  const beat = Object.entries(st.beatenBy).sort((a, b) => b[1] - a[1] || T.bt[b[0]] - T.bt[a[0]]).slice(0, 2).map(([bk, n]) => {
    const o = byKey[bk], p = R.players[o.pid] || {}, sub = R.subs[o.pid];
    return { first: p.first, initial: p.initial, imgId: o.imgId, times: n, tool: sub.tool === "Other" ? sub.toolOther : sub.tool, finalPrompt: sub.finalPrompt, pins: sub.pins };
  });
  const stolen = Object.values(R.after).filter((a) => a && a.steal && a.steal.img === R.subs[pid].imgId).map((a) => a.steal.kind);
  return ok({ hasMap: true, imgId: R.subs[pid].imgId, wins: st.wins, losses: st.losses, ties: st.ties, reasons: st.reasons, beatenBy: beat, borrowedKinds: stolen });
}

// ---------- projector
async function buildBoard(s) {
  const cur = await readCur(s);
  const run = cur.run, st = cur.st;
  const [pFlat, planFlat, subFlat, vFlat, nVotes] = await store.pipe([["HGETALL", K.players(s, run)], ["HGETALL", K.plans(s, run)],
    ["HGETALL", K.subs(s, run)], ["HGETALL", K.voters(s, run)], ["LLEN", K.votes(s, run)]]);
  const players = parseHash(pFlat), plans = parseHash(planFlat), subs = parseHash(subFlat), voters = parseHash(vFlat);
  // codes made for absent students are not people in the room
  const ids = Object.keys(players).filter((pid) => players[pid] && !players[pid].kicked && !players[pid].absent)
    .sort((a, b) => players[a].joinedAt - players[b].joinedAt);
  const planned = ids.filter((pid) => plans[pid]);
  const done = ids.filter((pid) => subs[pid]);
  return {
    runId: run, phase: st.phase, startedAt: st.startedAt, endsAt: st.endsAt, serverNow: now(), seq: seqOf(cur),
    players: ids.map((pid) => ({ first: players[pid].first, seat: players[pid].seat, planned: Boolean(plans[pid]), submitted: Boolean(subs[pid]) })),
    planned: planned.length, submitted: done.length,
    votes: Number(nVotes) || 0, votersDone: Object.values(voters).filter((v) => v && v.done >= MATCHES).length,
    _players: players, _plans: plans, _subs: subs, _ids: ids,
  };
}
function publicBoard(b) { const { _players, _plans, _subs, _ids, ...rest } = b; return rest; }

async function board(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  return ok(publicBoard(await buildBoard(s)));
}

// body: {section, key, action, first?, initial?}
async function host(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const action = String(body.action || "");
  const cur = await readCur(s);
  const st = Object.assign({}, cur.st), t = now(), phase = st.phase;
  let changed = true, extra = null;

  if (action === "reset") {
    await store.pipe([
      ["HINCRBY", K.cur(s), "run", 1],
      ["HSET", K.cur(s), "state", JSON.stringify(Object.assign({}, LOBBY, { seq: (st.seq || 0) + 1 })), "players", 0, "kicks", 0],
    ]);
    return ok(publicBoard(await buildBoard(s)));
  }
  const startClock = (ph) => Object.assign(st, { phase: ph, startedAt: t, endsAt: t + CLOCKS[ph] });
  if (action === "plan" && phase === "lobby") startClock("plan");
  else if (action === "build" && phase === "plan") startClock("build");
  else if (action === "submit" && phase === "build") startClock("submit");
  else if (action === "vote" && (phase === "submit" || phase === "build")) startClock("vote");
  else if (action === "close" && ["build", "submit", "vote"].includes(phase)) Object.assign(st, { phase: "closed", endsAt: t });
  else if (action === "reopen" && phase === "closed") startClock("vote");
  else if (action === "results" && (phase === "vote" || phase === "closed")) Object.assign(st, { phase: "results", endsAt: t });
  else if (action === "unresults" && phase === "results") st.phase = "closed";
  else if (action === "extend" && CLOCKS[phase]) st.endsAt = Math.max(st.endsAt, t) + EXTEND_MS;
  else if (action === "shorten" && CLOCKS[phase]) st.endsAt = Math.max(t, st.endsAt - EXTEND_MS);
  else if (action === "code") {
    // a personal code for a student who missed class, so they can still vote
    const first = sanitizeName(body.first), initial = sanitizeInitial(body.initial);
    if (!first || !initial) return fail(400, "Enter a first name and last initial.");
    const pid = "absent-" + crypto.randomBytes(9).toString("base64url");
    const code = await newCode({ s, run: cur.run, pid });
    await store.pipe([["HSET", K.players(s, cur.run), pid, JSON.stringify({ first, initial, seat: "absent", joinedAt: t, kicked: false, code, absent: true })]]);
    changed = false; extra = { code, first, initial };
  } else changed = false;

  if (changed) { st.seq = (st.seq || 0) + 1; await saveState(s, st); }
  const b = publicBoard(await buildBoard(s));
  if (extra) b.newCode = extra;
  else if (!changed) b.error = "Not now.";
  return ok(b);
}

// ---------- images (admin only for now; the gallery opens them later)
async function image(query) {
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  const id = String(query.id || "");
  if (!/^[a-f0-9]{24}$/.test(id)) return fail(400, "Bad id.");
  const url = await store.redis("GET", K.img(id));
  if (!url) return fail(404, "No such image.");
  return ok({ id, image: url });
}

// ---------- export
function csvCell(v, excel) {
  let s = String(v == null ? "" : v);
  if (excel && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const iso = (ms) => (ms ? new Date(ms).toISOString() : "");
// the rubric columns (Fadel, Oct 27), blank until the map has been graded for its current image
const GRADE_COLS = ["running_total_mistake", "running_total_by_number", "measure", "rate_map", "descriptive_title", "butler_captured",
  "color_scale", "scale_appropriate", "time_shown", "extra_panels", "extra_panels_appropriate", "source_caption", "emphasis_text",
  "personalized", "rate_values_shown", "chart_junk", "largest_value_shown", "butler_value_shown", "model", "at"];
function gradeCell(g, sub, c) {
  if (!g || g.imgId !== sub.imgId) return "";
  const v = g[c];
  if (c === "at") return iso(v);
  return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : v == null ? "" : v;
}

async function exportCsv(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400, text: "bad section\n" };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status, text: denied.body.error + "\n" };
  const excel = String(query.excel || "") === "1";
  const run = /^\d+$/.test(String(query.run || "")) ? Number(query.run) : (await readCur(s)).run;
  const [pFlat, planFlat, subFlat, chkFlat, gFlat] = await store.pipe([
    ["HGETALL", K.players(s, run)], ["HGETALL", K.plans(s, run)], ["HGETALL", K.subs(s, run)], ["HGETALL", K.chk(s, run)], ["HGETALL", K.grades(s, run)],
  ]);
  const players = parseHash(pFlat), plans = parseHash(planFlat), subs = parseHash(subFlat), chks = parseHash(chkFlat), grades = parseHash(gFlat);
  const head = ["section", "run", "first", "initial", "seat", "code", "joined_at", "plan_saved_at", "plan_final", "plan_late"]
    .concat(PLAN_FIELDS.map((f) => "plan_" + f))
    .concat(["submitted_at", "versions", "tool", "tool_other", "model", "prompts", "share", "final_prompt", "n_pins", "pins_json", "last_check_json", "image_id"])
    .concat(GRADE_COLS.map((c) => "ai_" + c));
  const rows = [head];
  const ids = Object.keys(players).filter((pid) => players[pid] && !players[pid].kicked)
    .sort((a, b) => players[a].joinedAt - players[b].joinedAt);
  for (const pid of ids) {
    const p = players[pid], pl = plans[pid] || {}, sub = subs[pid] || {};
    rows.push([s, run, p.first, p.initial, p.seat, p.code, iso(p.joinedAt), iso(pl.savedAt), pl.final ? "TRUE" : "FALSE", pl.late ? "TRUE" : "FALSE"]
      .concat(PLAN_FIELDS.map((f) => pl[f] || ""))
      .concat([iso(sub.submittedAt), sub.versions || "", sub.tool || "", sub.toolOther || "", sub.model || "", sub.prompts || "", sub.share || "",
        sub.finalPrompt || "", (sub.pins || []).length || "", sub.pins ? JSON.stringify(sub.pins) : "", chks[pid] ? JSON.stringify(chks[pid]) : "", sub.imgId || ""])
      .concat(GRADE_COLS.map((c) => gradeCell(grades[pid], sub, c))));
  }
  return {
    status: 200,
    filename: `map_gallery_${s}_run${run}.csv`,
    text: rows.map((r) => r.map((c) => csvCell(c, excel)).join(",")).join("\n") + "\n",
  };
}

// One row per vote (admin). Map keys are "{section}:{run}:{pid}"; choice L, R or T (too close to call).
// what=after: the tool guesses and "steal one idea" lines instead.
async function votesCsv(query) {
  const s = sectionOf(query.section);
  if (!s) return { status: 400, text: "bad section\n" };
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return { status: denied.status, text: denied.body.error + "\n" };
  const excel = String(query.excel || "") === "1", what = String(query.what || "") === "after" ? "after" : "votes";
  const run = /^\d+$/.test(String(query.run || "")) ? Number(query.run) : (await readCur(s)).run;
  const [list, aFlat] = await store.pipe([["LRANGE", K.votes(s, run), 0, -1], ["HGETALL", K.after(s, run)]]);
  let rows;
  if (what === "votes") {
    rows = [["section", "run", "voter", "left", "right", "choice", "winner", "reason", "shown_at", "voted_at"]];
    for (const raw of list || []) {
      const v = parseJSON(raw); if (!v) continue;
      rows.push([s, run, v.voter, v.L, v.R, v.choice, v.choice === "L" ? v.L : v.choice === "R" ? v.R : "", v.reason || "", iso(v.shownAt), iso(v.at)]);
    }
  } else {
    rows = [["section", "run", "voter_pid", "guess", "steal_img", "steal_kind", "steal_text"]];
    for (const [pid, a] of Object.entries(parseHash(aFlat))) rows.push([s, run, pid, a.guess || "", a.steal ? a.steal.img : "", a.steal ? a.steal.kind : "", a.steal ? a.steal.text : ""]);
  }
  return { status: 200, filename: `map_gallery_${s}_run${run}_${what}.csv`, text: rows.map((r) => r.map((c) => csvCell(c, excel)).join(",")).join("\n") + "\n" };
}

module.exports = {
  sanitizeName, sanitizeInitial, cleanText, cleanPins,
  join, resume, getState, me, savePlan, submit, check, setChecker, grade, setGrader, host, board, image, exportCsv, votesCsv, limited,
  match, vote, after, voteImage, pickPair, MATCHES, POOLS, results, mine, bradleyTerry, setPlanJudge, scorePlan,
  readCur, adminCheck, buildBoard, setNow, parseJSON, parseHash, sectionOf, pidOf, ok, fail,
  SECTIONS, SEAT_RE, K, TOOLS, KINDS, PLAN_FIELDS, CLOCKS, EXTEND_MS, NEXT, SNAPSHOT_CACHE, CHECKS_PER_PLAYER, MAX_IMAGE,
};
