// POST /api/reset  {section, key}
// Starts a new run for one section: the run id goes up by one, so the board and
// every student device start clean. Old runs stay in Redis until they expire.
const { redis, runId, sendJSON, readBody, SECTIONS } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const b = readBody(req);
  const section = String(b.section || "").toUpperCase();
  if (!SECTIONS.includes(section)) return sendJSON(res, 400, { error: "bad section" });
  if (!process.env.ADMIN_KEY || b.key !== process.env.ADMIN_KEY) return sendJSON(res, 403, { error: "bad key" });
  try {
    const cur = await runId(section);
    await redis("SET", `salvage:run:${section}:id`, String(cur + 1));
    return sendJSON(res, 200, { ok: true, section, runId: cur + 1 });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
