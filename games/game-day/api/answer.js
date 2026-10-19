// POST /api/answer {section, playerId, q, answer} -> {ok:true} | {ok:false, reason:"closed"|"duplicate"|"unknown"}
// answer is an option index (choice) or text up to 600 characters (open). Open answers are judged
// by Jev in the background (waitUntil); the verdict stays hidden until the host reveals.
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
