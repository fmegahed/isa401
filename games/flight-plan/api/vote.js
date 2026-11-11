// POST /api/vote {section, playerId, summary, miss} -> {vote}. One vote per student; open only in the vote phase.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "vote")) return sendJSON(res, 429, { error: "Too many requests. Wait a minute." });
    const r = await game.vote(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) { return sendJSON(res, 500, { error: "The game server had a problem. Try again." }); }
};
