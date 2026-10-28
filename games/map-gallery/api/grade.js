// POST /api/grade {section, key, run?, force?} -> {run, graded, failed, remaining}. Admin only (the key
// may also come in the x-admin-key header). Runs Fadel's rubric (gpt-6-luna) on up to 6 submitted maps
// per call; call it again until remaining is 0. force=<ms timestamp> regrades maps graded before it.
// The results go to the export (ai_* columns); students do not see them.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    const body = Object.assign({}, readBody(req));
    if (req.headers && req.headers["x-admin-key"]) body.key = req.headers["x-admin-key"];
    const r = await game.grade(body, clientIp(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
