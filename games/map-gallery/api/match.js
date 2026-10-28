// GET /api/match?section=A&playerId=...[&more=1] -> the voter's current or next blind matchup:
// {status: "match", match: {id, n, total, left, right}} (left and right are opaque image ids),
// {status: "done", done, seen} or {status: "not_enough"}. Only while the vote clock is on.
const game = require("./_game");
const { sendJSON, clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    if (await game.limited(clientIp(req), "match")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.match(req.query || {});
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
