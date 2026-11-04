// POST /api/answer {section, playerId, q, answer} -> {ok:true} | {ok:false, reason:"closed"|"duplicate"|"unknown"}
// answer is the option index (0-3). The first answer counts.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "answer")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.answer(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
