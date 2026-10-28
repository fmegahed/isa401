// GET /api/vimg?section=A&playerId=...&id=<24 hex> -> one map as image/jpeg, only for a voter who
// was shown that map. Cached privately in the browser, so enlarging it does not fetch it again.
const game = require("./_game");
const { sendJSON } = require("./_store");
module.exports = async (req, res) => {
  try {
    const r = await game.voteImage(req.query || {});
    if (r.status !== 200) return sendJSON(res, r.status, r.body);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=86400, immutable");
    return res.status(200).send(r.jpeg);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem." });
  }
};
