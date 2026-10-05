// Shared Redis helpers for Salvage Run (Upstash REST API, no SDK). Same store as
// the seat game; every key here starts with "salvage:" so the games never mix.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const SECTIONS = ["A", "B", "Z"];   // Z is the hidden test section
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const TOP = 3;

async function redis(...cmd) {
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

async function runId(section) {
  const v = await redis("GET", `salvage:run:${section}:id`);
  return v ? Number(v) : 1;
}
const runKey = (section, id) => `salvage:run:${section}:${id}`;

async function readSeats(section, id) {
  const flat = (await redis("HGETALL", runKey(section, id))) || [];
  const seats = {};
  for (let i = 0; i < flat.length; i += 2) seats[flat[i]] = JSON.parse(flat[i + 1]);
  return seats;
}

function sendJSON(res, status, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(obj));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

module.exports = { redis, runId, runKey, readSeats, sendJSON, readBody, SECTIONS, SEAT_RE, TOP };
