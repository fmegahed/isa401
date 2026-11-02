// POST /api/host {section, action} with header x-admin-key: <ADMIN_KEY> -> the board payload.
// action: advance (lobby -> play -> reveal) | reset (new run, lobby)
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    const body = Object.assign({}, readBody(req), { key: req.headers && req.headers["x-admin-key"] });
    const r = await game.host(body, clientIp(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
