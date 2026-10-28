// GET /api/export?section=A&run=2 with header x-admin-key -> CSV, one row per joined player:
// names, seat, personal code, the plan, and the map's details (tool, model, prompts, pins, image id).
// From R:
//   httr2::request("https://isa401-map-gallery.vercel.app/api/export?section=A") |>
//     httr2::req_headers("x-admin-key" = Sys.getenv("MG_ADMIN_KEY")) |>
//     httr2::req_perform() |> httr2::resp_body_string() |> readr::read_csv()
// &what=votes gives one row per vote; &what=after the tool guesses and "steal one idea" lines.
// &excel=1 guards cells starting with = + - @ for spreadsheet apps.
const game = require("./_game");
const { clientIp } = require("./_store");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const q = req.query || {};
    const args = { section: q.section, run: q.run, excel: q.excel, what: q.what, key: req.headers && req.headers["x-admin-key"], ip: clientIp(req) };
    const r = q.what === "votes" || q.what === "after" ? await game.votesCsv(args) : await game.exportCsv(args);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    if (r.filename) res.setHeader("Content-Disposition", `inline; filename="${r.filename}"`);
    res.status(r.status).send(r.text);
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("The export failed. Try again.\n");
  }
};
