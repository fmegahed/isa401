// POST /api/reset?section=A&key=ADMIN_KEY
// Starts a new run for the section: every seat goes dark, both tracks.
// Old runs stay in Redis (30-day expiry) but are never shown again.
const { redis, sendJSON, SECTIONS } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const q = req.query || {};
  const section = String(q.section || "").toUpperCase();
  if (!SECTIONS.includes(section)) return sendJSON(res, 400, { error: "bad section" });
  if (!process.env.ADMIN_KEY || q.key !== process.env.ADMIN_KEY) return sendJSON(res, 403, { error: "bad key" });
  try {
    const id = await redis("INCR", `run:${section}:id`);
    return sendJSON(res, 200, { ok: true, section, runId: id });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
