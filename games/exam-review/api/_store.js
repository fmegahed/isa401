// Redis helpers for the Exam 01 review (Upstash REST API, no SDK). Same store as the games;
// every key here starts with "review:". The store is optional: without it the site still
// works, it just has no rate limit, no counts and no saved reports.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const hasStore = Boolean(URL_ && TOKEN);

async function redis(...cmd) {
  if (!hasStore) throw new Error("Redis env vars are not set");
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Best effort: a failed write to the store must never break a student's check.
async function quiet(...cmd) {
  if (!hasStore) return null;
  try { return await redis(...cmd); } catch (e) { return null; }
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

function clientIp(req) {
  const f = (req.headers && req.headers["x-forwarded-for"]) || "";
  return String(f).split(",")[0].trim() || "local";
}

module.exports = { redis, quiet, hasStore, sendJSON, readBody, clientIp };
