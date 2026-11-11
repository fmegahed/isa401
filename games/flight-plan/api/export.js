// GET /api/export?section=A (admin key in x-admin-key header or &key=) -> CSV, one row per student.
const game = require("./_game");
const { clientIp } = require("./_store");
module.exports = async (req, res) => {
  try {
    const q = Object.assign({}, req.query || {}, { ip: clientIp(req) });
    if (req.headers && req.headers["x-admin-key"]) q.key = req.headers["x-admin-key"];
    const r = await game.exportCsv(q);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (r.filename) res.setHeader("Content-Disposition", `attachment; filename="${r.filename}"`);
    res.status(r.status).send(r.text);
  } catch (e) { res.status(500).send("error\n"); }
};
