// POST /api/call {section, playerId, round, card, color} -> {ok:true} | {ok:false, reason:"closed"|"unknown"}
// color is "R" or "B". A call counts only while its card is open (plus a short network grace), judged
// by the server's clock. The latest call on a card counts; the phone never learns if it was right.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "call")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const r = await game.call(readBody(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
