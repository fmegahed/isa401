// GET /wreck/<hull>  (rewritten to /api/wreck?hull=<hull>)
// A wreck's dossier. Dreadnoughts carry <span class="core-status">, except the
// ones with no reading on file, where the element is absent: html_element()
// gives NA there and html_elements() gives character(0). Two of the other
// Dreadnoughts mention an old LIVE reading in their archive log, so searching
// the whole page text for "LIVE" finds three hulls.
const { byHull, esc, img, page, send } = require("./_site");

function coreBlock(w) {
  if (w.cls !== "Dreadnought") {
    return `<section class="core"><h2>Warp core</h2><p>None fitted. ${esc(w.cls)}-class ships run on fusion drives.</p></section>`;
  }
  if (!w.core) {
    return `<section class="core"><h2>Warp core</h2><p>No reading on file. The survey drone could not reach the core bay.</p></section>`;
  }
  const note = { LIVE: "Containment holding. Recover with a Class IV tow.", COLD: "Core is inert. Salvage the shielding only.", BREACHED: "Radiation hazard. Do not approach inside 40 km." }[w.core];
  return `<section class="core"><h2>Warp core</h2><p>Current reading: <span class="core-status ${w.core}">${w.core}</span></p><p class="note">${note}</p></section>`;
}

module.exports = (req, res) => {
  const hull = String((req.query && req.query.hull) || "").toUpperCase();
  const w = byHull[hull];
  if (!w) {
    return send(res, 404, page("Not found: Ceres Salvage Registry", `
      <div class="dossier"><section><h2>404: no wreck ${esc(hull || "(blank)")}</h2>
      <p>Dossier addresses look like <code>/wreck/KV-1234</code>. The links on the registry cards (<code>a.details</code>) are relative: they start with <code>/wreck/</code>, so put the site address in front of them.</p>
      <p><a href="/registry?start=1">Back to the registry</a></p></section></div>`, "wreck"));
  }
  const cargo = w.cargo.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c)}</td><td>${["sealed", "intact", "scattered"][(w.pos + i) % 3]}</td></tr>`).join("");
  const log = [
    `${w.lost}: contact lost in ${esc(w.sector)}.`,
    `${w.lost + 1}: listed with the Ceres Salvage Registry as #${w.pos}.`,
    w.log ? esc(w.log) : null,
  ].filter(Boolean).map((t) => `<p class="log-entry">${t}</p>`).join("");
  const body = `
<main class="dossier">
  <div class="hero">
    <img src="${img(w.cls)}" alt="${esc(w.cls)}">
    <div class="txt">
      <h1 class="hull-id">${esc(w.hull)}</h1>
      <p class="ship-name">${esc(w.name)}</p>
      <dl class="specs">
        <dt>Class</dt><dd class="ship-class">${esc(w.cls)}</dd>
        <dt>Registry position</dt><dd class="pos">#${w.pos}</dd>
        <dt>Sector</dt><dd class="sector">${esc(w.sector)}</dd>
        <dt>Built</dt><dd class="built">${w.built}</dd>
        <dt>Lost</dt><dd class="lost">${w.lost}</dd>
        <dt>Crew complement</dt><dd class="crew">${w.crew}</dd>
        <dt>Est. salvage</dt><dd class="salvage-value">${w.value.toFixed(1)} MCr</dd>
      </dl>
    </div>
  </div>
  ${coreBlock(w)}
  <section class="cargo"><h2>Cargo manifest</h2><table class="manifest"><thead><tr><th>Hold</th><th>Contents</th><th>State</th></tr></thead><tbody>${cargo}</tbody></table></section>
  <section class="log"><h2>Registry log</h2>${log}</section>
  <p style="margin-top:18px;"><a href="/registry?start=${1 + Math.floor((w.pos - 1) / 50) * 50}">&larr; Back to the registry page that lists #${w.pos}</a></p>
</main>`;
  send(res, 200, page(`${w.hull}: Ceres Salvage Registry`, body, "wreck"));
};
