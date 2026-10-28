// GET /api/image?id=<24 hex> with header x-admin-key -> {id, image: dataURL}. Admin only until the
// gallery is revealed.
const game = require("./_game");
const { sendJSON, clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const r = await game.image({ id: q.id, key: req.headers && req.headers["x-admin-key"], ip: clientIp(req) });
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
