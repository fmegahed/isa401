// Redis helpers for Game Day (Upstash REST API, no SDK). Same store as the other games;
// every key here starts with "gd:". Adapted from games/exam-review/api/_store.js and
// games/find-your-seat/api/_store.js. Tests swap the backend with setRedis(fn), where
// fn(...cmd) resolves to what Upstash would return as "result".
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash(...cmd) {
  if (!URL_ || !TOKEN) throw new Error("Redis env vars are not set");
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Several commands in one HTTP round trip (Upstash /pipeline). Not atomic; just faster.
async function upstashPipe(cmds) {
  if (!cmds.length) return [];
  if (!URL_ || !TOKEN) throw new Error("Redis env vars are not set");
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  const j = await r.json();
  if (!Array.isArray(j)) throw new Error((j && j.error) || "pipeline failed");
  return j.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}

let impl = upstash;
let pipeImpl = upstashPipe;

// Test hook: route every command to fn(...cmd). pipe() then runs the commands one by one.
function setRedis(fn) {
  impl = fn;
  pipeImpl = async (cmds) => { const out = []; for (const c of cmds) out.push(await fn(...c)); return out; };
}

function redis(...cmd) { return impl(...cmd); }
function pipe(cmds) { return pipeImpl(cmds); }

// Best effort: a failed write (rate-limit counters) must never break a player's request.
async function quiet(...cmd) {
  try { return await impl(...cmd); } catch (e) { return null; }
}

// cache defaults to no-store; only the public /api/state snapshot passes a CDN policy.
function sendJSON(res, status, obj, cache) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", status === 200 && cache ? cache : "no-store");
  res.status(status).send(JSON.stringify(obj));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

function clientIp(req) {
  const f = (req.headers && req.headers["x-forwarded-for"]) || "";
  return String(f).split(",")[0].trim() || "local";
}

module.exports = { redis, pipe, quiet, setRedis, sendJSON, readBody, clientIp };
