// POST /api/resume {code} -> {section, playerId, runId, first}: the personal code shown after joining
// brings a student back on another computer or after closing the tab (current run only).
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "resume")) return sendJSON(res, 429, { error: "Too many tries from this network. Wait a minute." });
    const r = await game.resume(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
