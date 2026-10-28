// POST /api/check (see _game.check). Bodies carry a JPEG data URL; 413 over 4.4 MB.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    if (await game.limited(clientIp(req), "check")) return sendJSON(res, 429, { error: "Too many requests from this network. Wait a minute." });
    const raw = typeof req.body === "string" ? req.body.length : JSON.stringify(req.body || {}).length;
    const r = await game.check(raw > 4_400_000 ? {} : readBody(req), raw);
    return sendJSON(res, r.status, r.body);
  } catch (e) {
    return sendJSON(res, 500, { error: "The game server had a problem. Try again." });
  }
};
