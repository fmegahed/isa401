// GET /api/export?section=A&run=2 with header x-admin-key -> CSV, one row per answer:
//   section,run,first,initial,seat,joined_at,q,answer,correct,points,judged
// run defaults to the section's current run. Admin only, and the key is read from the header only
// (never the query string, so it stays out of logs and browser history). From R:
//   httr2::request("https://<host>/api/export?section=A") |>
//     httr2::req_headers("x-admin-key" = Sys.getenv("GD_ADMIN_KEY")) |>
//     httr2::req_perform() |> httr2::resp_body_string() |> readr::read_csv()
// &excel=1 prefixes cells starting with = + - @ with an apostrophe (for spreadsheet apps);
// the default output stays raw for readr.
const game = require("./_game");
const { clientIp } = require("./_store");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const q = req.query || {};
    const key = req.headers && req.headers["x-admin-key"];
    const r = await game.exportCsv({ section: q.section, run: q.run, excel: q.excel, key, ip: clientIp(req) });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    if (r.filename) res.setHeader("Content-Disposition", `inline; filename="${r.filename}"`);
    res.status(r.status).send(r.text);
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("The export failed. Try again.\n");
  }
};
