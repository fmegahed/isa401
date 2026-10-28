// GET /api/state?section=A -> public, non-personal snapshot (phase, clock, player count).
// Cached by the Vercel CDN (s-maxage=1, stale-while-revalidate=1). Do not add playerId to this URL.
const game = require("./_game");
const { sendJSON } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.getState(req.query || {});
    return sendJSON(res, r.status, r.body, r.cache);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
