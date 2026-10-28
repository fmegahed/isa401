// GET /api/mine?section=A&playerId=... -> a student's own record once the results are up: wins,
// losses, ties, what voters said made their map better, the maps that beat it, and the kinds of ideas
// classmates said they would borrow from it.
const game = require("./_game");
const { sendJSON } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.mine(req.query || {});
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
