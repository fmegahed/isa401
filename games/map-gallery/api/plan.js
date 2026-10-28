// POST /api/plan {section, playerId, plan: {audience, measure, period, butler, colors, title, creative, prompt}, final}
// Drafts save during the plan phase; plans lock when the build starts (late joiners excepted).
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "plan")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.savePlan(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
