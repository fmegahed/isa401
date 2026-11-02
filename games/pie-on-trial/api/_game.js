// Pie on Trial: all game logic. The api/*.js handlers are thin wrappers around this module.
// Not a function of its own: Vercel ignores underscore-prefixed files in api/.
//
// No join step and no names: a phone makes a random id and answers charts 1-6 at its own pace, on a
// clock kept on the phone. Nothing about a student reaches the projector, only counts.
//   pot:{s}:cur      hash {run, phase, seq}; phase is lobby -> play -> reveal
//   pot:{s}:{run}:a  hash "<playerId>:<chart>" -> option index 0-4, or -1 if the clock ran out
// HSETNX keeps the first answer to each chart, so a double tap or a retry changes nothing.
const crypto = require("crypto");
const store = require("./_store");
const { CHARTS } = require("../data.js");

const SECTIONS = ["A", "B", "Z"];
const PID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const TTL = 30 * 24 * 3600;      // 30-day expiry on every per-run key
const PER_MINUTE = 900;          // per-address ceiling, abuse protection only: a whole section shares one campus address
const ADMIN_FAILS = 10;          // wrong admin keys per address per minute before 429
const SNAPSHOT_CACHE = "public, s-maxage=1, stale-while-revalidate=1";
const NEXT = { lobby: "play", play: "reveal" };

const K = {
  cur: (s) => `pot:${s}:cur`,
  a: (s, r) => `pot:${s}:${r}:a`,
};

const ok = (body, cache) => ({ status: 200, body, cache });
const fail = (status, error) => ({ status, body: { error } });
function sectionOf(v) { const s = String(v || "").trim().toUpperCase(); return SECTIONS.includes(s) ? s : null; }
function pidOf(v) { const p = String(v || ""); return PID_RE.test(p) ? p : null; }
function parseHash(flat) {
  const o = {};
  for (let i = 0; flat && i < flat.length; i += 2) o[flat[i]] = flat[i + 1];
  return o;
}
function keyMatches(key) {
  const k = process.env.ADMIN_KEY;
  if (!k || typeof key !== "string") return false;
  const a = Buffer.from(key), b = Buffer.from(k);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// null when allowed. Only wrong keys are counted, so guessing from the shared campus address can
// never lock the host out.
async function adminCheck(key, ip) {
  if (keyMatches(key)) return null;
  const rl = `pot:rl:admin:${ip || "local"}:${Math.floor(Date.now() / 60000)}`;
  const n = Number(await store.quiet("INCR", rl)) || 0;
  if (n === 1) await store.quiet("EXPIRE", rl, 120);
  return n > ADMIN_FAILS ? fail(429, "Too many wrong keys. Wait a minute.") : fail(403, "Wrong key.");
}
async function limited(ip) {
  const key = `pot:rl:answer:${ip}:${Math.floor(Date.now() / 60000)}`;
  const used = await store.quiet("INCR", key);
  if (used === 1) await store.quiet("EXPIRE", key, 120);
  return Boolean(used && used > PER_MINUTE);
}

async function readCur(s) {
  const h = parseHash(await store.redis("HGETALL", K.cur(s)));
  if (h.run == null) await store.redis("HSETNX", K.cur(s), "run", "1");
  return { run: Number(h.run) || 1, phase: h.phase || "lobby", seq: Number(h.seq) || 0 };
}

// Counts per chart from the raw hash. `players` is everyone who sent at least one answer; `done` is
// everyone who has answered or timed out on all six. Only active answers enter a count.
function tally(flat) {
  const hist = CHARTS.map(() => [0, 0, 0, 0, 0]);
  const timedOut = CHARTS.map(() => 0);
  const seen = {};
  for (let i = 0; flat && i < flat.length; i += 2) {
    const [pid, c] = String(flat[i]).split(":");
    const chart = Number(c), a = Number(flat[i + 1]);
    if (!CHARTS[chart - 1]) continue;
    seen[pid] = (seen[pid] || 0) + 1;
    if (a === -1) timedOut[chart - 1]++;
    else if (Number.isInteger(a) && a >= 0 && a < 5) hist[chart - 1][a]++;
  }
  const ids = Object.keys(seen);
  return { hist, timedOut, players: ids.length, done: ids.filter((p) => seen[p] >= CHARTS.length).length };
}

async function getState(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const cur = await readCur(s);
  return ok({ runId: cur.run, phase: cur.phase, seq: cur.seq }, SNAPSHOT_CACHE);
}

// body: {section, playerId, chart, answer, runId}
async function answer(body) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const pid = pidOf(body.playerId);
  const chart = Number(body.chart), a = Number(body.answer);
  if (!pid || !CHARTS[chart - 1] || !Number.isInteger(a) || a < -1 || a > 4) return fail(400, "Bad answer.");
  const { run, phase } = await readCur(s);
  if (Number(body.runId) !== run) return ok({ ok: false, reason: "stale" });   // the host reset the game
  if (phase !== "play") return ok({ ok: false, reason: "closed" });
  await store.pipe([["HSETNX", K.a(s, run), `${pid}:${chart}`, String(a)], ["EXPIRE", K.a(s, run), TTL]]);
  return ok({ ok: true });
}

async function buildBoard(s) {
  const cur = await readCur(s);
  const t = tally(await store.redis("HGETALL", K.a(s, cur.run)));
  return Object.assign({ runId: cur.run, phase: cur.phase, seq: cur.seq }, t);
}

async function board(query) {
  const s = sectionOf(query.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(query.key, query.ip);
  if (denied) return denied;
  return ok(await buildBoard(s));
}

// body: {section, key, action}; action is advance (lobby -> play -> reveal) or reset (new run, lobby).
async function host(body, ip) {
  const s = sectionOf(body.section);
  if (!s) return fail(400, "Unknown section.");
  const denied = await adminCheck(body.key, ip);
  if (denied) return denied;
  const cur = await readCur(s);
  if (body.action === "reset") {
    await store.redis("HINCRBY", K.cur(s), "run", 1);
    await store.redis("HSET", K.cur(s), "phase", "lobby", "seq", String(cur.seq + 1));
  } else if (body.action === "advance") {
    if (NEXT[cur.phase]) await store.redis("HSET", K.cur(s), "phase", NEXT[cur.phase], "seq", String(cur.seq + 1));
  } else return fail(400, "Unknown action.");
  return ok(await buildBoard(s));
}

module.exports = { tally, getState, answer, board, host, limited, K, SECTIONS, SNAPSHOT_CACHE };
