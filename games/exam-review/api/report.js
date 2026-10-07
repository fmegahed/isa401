// POST /api/report { id, text, verdict, comment }  -> { ok }
// "Report a problem": saves the anonymous answer and what the checker said, for the instructor.
// GET  /api/report  with header "Authorization: Bearer ADMIN_KEY"  -> { reports, stats }
// The key travels in a header, never in the address, so it does not end up in logs or history.
const crypto = require("crypto");
const { redis, quiet, hasStore, sendJSON, readBody } = require("./_store");

function isAdmin(req) {
  const supplied = String((req.headers && req.headers.authorization) || "").replace(/^Bearer /, "");
  const expected = process.env.ADMIN_KEY || "";
  return Boolean(expected) && supplied.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    if (!isAdmin(req)) return sendJSON(res, 403, { error: "key required" });
    if (!hasStore) return sendJSON(res, 200, { reports: [], stats: {} });
    const raw = (await redis("LRANGE", "review:reports", 0, 499)) || [];
    const flat = (await redis("HGETALL", "review:stats")) || [];
    const stats = {};
    for (let i = 0; i < flat.length; i += 2) stats[flat[i]] = Number(flat[i + 1]);
    return sendJSON(res, 200, { reports: raw.map((r) => JSON.parse(r)), stats });
  }
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST or GET" });
  const b = readBody(req);
  const entry = {
    at: new Date().toISOString(),
    id: String(b.id || "").slice(0, 60),
    text: String(b.text || "").slice(0, 1500),
    verdict: String(b.verdict || "").slice(0, 300),
    comment: String(b.comment || "").slice(0, 500),
  };
  await quiet("LPUSH", "review:reports", JSON.stringify(entry));
  await quiet("LTRIM", "review:reports", 0, 999);
  return sendJSON(res, 200, { ok: true });
};
