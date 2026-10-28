// POST /api/vote {section, playerId, matchId, choice: "L" | "R" | "T", reason?} -> {ok, done, total}
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "vote")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.vote(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
