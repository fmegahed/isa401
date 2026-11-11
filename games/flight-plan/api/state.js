// GET /api/state?section=A -> the public snapshot (no recap content before Publish recap). CDN-cached 1 s.
const game = require("./_game");
const { sendJSON } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.getState(req.query || {});
    return sendJSON(res, r.status, r.body, r.cache);
  } catch (e) { return sendJSON(res, 500, { error: "The game server had a problem." }); }
};
