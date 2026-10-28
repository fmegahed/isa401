// POST /api/after {section, playerId, guess?, steal?: {img, kind, text}} after the six votes: the
// guess of which AI tool made the best maps, and one idea to borrow from a map the voter saw.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "after")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.after(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
