// GET /api/image?section=A&id=... with the admin key in x-admin-key (or &key=) -> the photo bytes.
const game = require("./_game");
const { clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    const q = Object.assign({}, req.query || {}, { ip: clientIp(req) });
    if (req.headers && req.headers["x-admin-key"]) q.key = req.headers["x-admin-key"];
    const r = await game.getImage(q);
    res.setHeader("Cache-Control", "private, no-store");
    if (r.status !== 200) return res.status(r.status).send("");
    res.setHeader("Content-Type", r.type);
    res.status(200).send(r.buffer);
  } catch (e) { res.status(500).send(""); }
};
