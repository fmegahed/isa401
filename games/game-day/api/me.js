// GET /api/me?section=A&playerId=... -> the player's own score, rank and last result (no-store).
// Phones call it after joining and whenever the /api/state snapshot's runId, seq, phase or q changes
// (and every 3 s while last.pending is true).
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
