// POST /api/join {section, first, initial, seat, playerId?} -> {playerId, runId}
// seat is "L1-1".."R3-7" or "remote". Sending a known playerId (from localStorage) rejoins with the
// same score; a seat already taken passes to the newcomer and the previous holder is kicked.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "join")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.join(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
