// Shared Redis helpers for the seat board (Upstash REST API, no SDK).
// Env vars come from the Vercel Marketplace "Upstash for Redis" resource; both
// naming conventions are accepted.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const SECTIONS = ["A", "B"];
const TRACKS = ["opener", "heist"];
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const TOP = { opener: 3, heist: 4 };

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
  const v = await redis("GET", `run:${section}:id`);
  return v ? Number(v) : 1;
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

module.exports = { redis, runId, sendJSON, readBody, SECTIONS, TRACKS, SEAT_RE, TOP };
