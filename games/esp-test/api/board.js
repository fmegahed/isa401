// GET  /api/board?section=A   with header  x-admin-key: <ADMIN_KEY>
// POST /api/board {section, key}
// -> the host/projector payload (see _game.buildBoard). The key is never read from the query string.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");

module.exports = async (req, res) => {
  try {
    const body = req.method === "POST" ? readBody(req) : {};
    const q = req.query || {};
    const key = (req.headers && req.headers["x-admin-key"]) || body.key;
    const r = await game.board({ section: body.section || q.section, key, ip: clientIp(req) });
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
