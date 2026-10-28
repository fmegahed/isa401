// GET /api/results?section=A with header x-admin-key -> every map with its owner, tool, plan, final
// prompt, pins, AI grades (map and plan), vote record and Bradley-Terry score, plus the tool guesses.
// Admin only: the projector's results screens are built from this.
const game = require("./_game");
const { sendJSON, clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.results({ section: (req.query || {}).section, key: req.headers && req.headers["x-admin-key"], ip: clientIp(req) });
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
