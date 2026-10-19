// POST /api/host {section, key, action} -> the board payload. Admin only (the key may also come in
// the x-admin-key header). action: open | close | reveal | rejudge | next | break | final | reset
// (phase rules in _game.js).
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    const body = Object.assign({}, readBody(req));
    if (req.headers && req.headers["x-admin-key"]) body.key = req.headers["x-admin-key"];
    const r = await game.host(body, clientIp(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
