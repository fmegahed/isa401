// GET /api/team?section=A&playerId=... -> the player's own team (notes, brief, feedback, marker).
// POST /api/team {section, playerId, action: addNote|deleteNote|saveBrief|pickMarker, ...}.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") { const r = await game.team(req.query || {}); return sendJSON(res, r.status, r.body); }
    if (req.method !== "POST") return sendJSON(res, 405, { error: "GET or POST" });
    if (await game.limited(clientIp(req), "team")) return sendJSON(res, 429, { error: "Too many requests. Wait a minute." });
    const r = await game.teamAction(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) { return sendJSON(res, 500, { error: "The game server had a problem. Try again." }); }
};
