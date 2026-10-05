// GET /registry?start=S  (rewritten to /api/registry)
// One page of the registry: wrecks S .. S+49, 1-based.
const { DATA, esc, img, page, send } = require("./_site");

const PER = DATA.per_page, N = DATA.n;
const byPos = {};
for (const w of DATA.wrecks) byPos[w.pos] = w;

function card(w) {
  return `
    <article class="wreck" id="w${w.pos}">
      <img src="${img(w.cls)}" alt="${esc(w.cls)}" loading="lazy">
      <div class="body">
        <span class="pos">#${w.pos}</span>
        <h3 class="hull-id">${esc(w.hull)}</h3>
        <p class="ship-name">${esc(w.name)}</p>
        <ul class="facts">
          <li><b>Class</b> <span class="ship-class ${esc(w.cls)}">${esc(w.cls)}</span></li>
          <li><b>Sector</b> <span class="sector">${esc(w.sector)}</span></li>
          <li><b>Est. salvage</b> <span class="salvage-value">${w.value.toFixed(1)} MCr</span></li>
        </ul>
        <a class="details" href="/wreck/${esc(w.hull)}">Open manifest &rarr;</a>
      </div>
    </article>`;
}

function pager(start) {
  const starts = [];
  for (let s = 1; s <= N; s += PER) starts.push(s);
  const on = starts.includes(start) ? start : null;
  const prev = start - PER >= 1 ? `<a class="prev" href="/registry?start=${start - PER}">&larr; Previous</a>` : `<span class="off">&larr; Previous</span>`;
  const next = start + PER <= N ? `<a class="next" href="/registry?start=${start + PER}">Next &rarr;</a>` : `<span class="off">Next &rarr;</span>`;
  const nums = starts.map((s, i) => s === on ? `<span class="current">${i + 1}</span>` : `<a href="/registry?start=${s}">${i + 1}</a>`).join("");
  return `<nav class="pager">${prev}${nums}${next}</nav>`;
}

module.exports = (req, res) => {
  const raw = (req.query && req.query.start) ?? "1";
  const start = Number(raw);
  if (!Number.isInteger(start) || start < 1 || start > N) {
    return send(res, 404, page("Not found: Ceres Salvage Registry", `
      <div class="dossier"><section><h2>404: no wrecks at start=${esc(raw)}</h2>
      <p>The registry counts wrecks from 1 to ${N}. <code>start</code> is the number of the first wreck on the page, so the pages begin at start=1, start=${1 + PER}, start=${1 + 2 * PER}, and so on.</p>
      <p><a href="/registry?start=1">Back to the first page</a></p></section></div>`, "registry"));
  }
  const end = Math.min(start + PER - 1, N);
  const cards = [];
  for (let p = start; p <= end; p++) cards.push(card(byPos[p]));
  const body = `
<main class="layout">
  <section class="listing">
    <h1>Registered wrecks</h1>
    <p class="count">Showing ${start}&ndash;${end} of ${N}</p>
    <div class="cards">${cards.join("")}
    </div>
    ${pager(start)}
  </section>
</main>`;
  send(res, 200, page(`Registry (${start}-${end}): Ceres Salvage Registry`, body, "registry"));
};
