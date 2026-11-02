// GET /api/state?section=A -> {runId, phase, seq}. Cached by the Vercel CDN for 1 s, so phones polling
// every 2 s cost about one Redis command per second per section.
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
