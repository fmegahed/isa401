// POST /api/answer {section, playerId, runId, chart, answer} -> {ok:true} | {ok:false, reason}
// answer is the option index 0-4, or -1 if the clock ran out. The first answer to a chart counts.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req))) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.answer(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
