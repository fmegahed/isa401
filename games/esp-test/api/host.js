// POST /api/host {section, action} with header x-admin-key (or body key) -> the board payload.
// action: start_r1 | reveal_r1 | finding | start_r2 | reveal_r2 | wrap | reset (phase rules in _game.js),
// or demo: read-only rehearsal frames for host.html?demo=1 (nothing is written).
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
