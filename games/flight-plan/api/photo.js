// POST /api/photo {section, key, kind: "teams"|"instructor", dataUrl, w, h} -> {photoId}. Admin only;
// sent by snap.html on Fadel's phone. The projector picks the new photo up on its next board poll.
const game = require("./_game");
const { sendJSON, readBody, clientIp } = require("./_store");
module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  try {
    const body = Object.assign({}, readBody(req));
    if (req.headers && req.headers["x-admin-key"]) body.key = req.headers["x-admin-key"];
    const r = await game.uploadPhoto(body, clientIp(req));
    return sendJSON(res, r.status, r.body);
  } catch (e) { return sendJSON(res, 500, { error: "The upload failed. Try again." }); }
};
