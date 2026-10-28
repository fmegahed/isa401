// GET /api/me?section=A&playerId=... -> the player's own name, seat, personal code, plan and map
// details (never any scoring).
const game = require("./_game");
const { sendJSON } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.me(req.query || {});
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
