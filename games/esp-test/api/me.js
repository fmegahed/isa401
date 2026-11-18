// GET /api/me?section=A&playerId=... -> the player's own calls, and after each reveal their marks,
// score and top-scorer flag; after the finding, which group they were in (no-store).
// Phones call it after joining, after a reload and whenever /api/state's runId, seq or phase changes.
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
