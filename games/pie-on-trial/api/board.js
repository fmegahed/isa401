// GET /api/board?section=A with header x-admin-key: <ADMIN_KEY> -> counts for the projector.
const game = require("./_game");
const { sendJSON, clientIp } = require("./_store");

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const r = await game.board({ section: q.section, key: req.headers && req.headers["x-admin-key"], ip: clientIp(req) });
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
