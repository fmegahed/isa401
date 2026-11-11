// POST /api/host {section, key, action, ...} -> the projector's board. Admin only (key also accepted in
// the x-admin-key header). Actions and phase rules are in _game.js host().
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    const body = Object.assign({}, readBody(req));
    if (req.headers && req.headers["x-admin-key"]) body.key = req.headers["x-admin-key"];
    const r = await game.host(body, clientIp(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) { return sendJSON(res, 500, { error: "The game server had a problem." }); }
};
