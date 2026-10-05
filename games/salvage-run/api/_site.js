// Shared chrome for the scraped pages: /registry and /wreck/<hull>.
// The markup is the lesson. Keep class names stable: the game questions,
// the hints and solution.R all depend on them.
const DATA = require("./_data.json");

const byHull = {};
for (const w of DATA.wrecks) byHull[w.hull] = w;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const img = (cls) => `/img/${cls.toLowerCase()}.jpg`;

const CSS = `
:root { --bg:#0b0f17; --panel:#121a27; --line:#233047; --ink:#e6edf7; --muted:#8a9ab3; --amber:#f5b942; --teal:#43d1c5; --red:#ff5a6a; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg) url(/img/starfield.jpg) center/cover fixed; color:var(--ink); font:15px/1.5 "Segoe UI", Helvetica, Arial, sans-serif; }
a { color:var(--teal); }
header.site { display:flex; align-items:center; gap:18px; padding:14px 28px; background:rgba(8,12,20,.92); border-bottom:1px solid var(--line); position:sticky; top:0; z-index:5; backdrop-filter:blur(6px); }
header.site .logo { font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--amber); text-decoration:none; font-size:15px; }
header.site .logo small { display:block; font-weight:500; letter-spacing:.06em; color:var(--muted); text-transform:none; font-size:11.5px; }
header.site nav { margin-left:auto; display:flex; gap:18px; font-size:13.5px; }
header.site nav a { color:var(--muted); text-decoration:none; }
header.site nav a.on { color:var(--ink); border-bottom:2px solid var(--amber); }
.layout { max-width:1240px; margin:0 auto; padding:24px 28px 40px; }
section.listing h1 { margin:0; font-size:26px; letter-spacing:.02em; }
section.listing .count { color:var(--muted); margin:2px 0 16px; }
.cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px,1fr)); gap:14px; }
article.wreck { background:rgba(18,26,39,.94); border:1px solid var(--line); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; transition:transform .15s, border-color .15s; }
article.wreck:hover { transform:translateY(-2px); border-color:var(--amber); }
article.wreck img { width:100%; aspect-ratio:16/10; object-fit:cover; display:block; background:#05070c; }
article.wreck .body { padding:10px 12px 12px; display:flex; flex-direction:column; gap:2px; flex:1; }
article.wreck .pos { font:600 12px Consolas, monospace; color:var(--muted); }
article.wreck h3 { margin:0; font:700 18px Consolas, "Source Code Pro", monospace; letter-spacing:.04em; }
article.wreck .ship-name { margin:0; color:var(--muted); font-size:13px; font-style:italic; }
article.wreck ul.facts { list-style:none; margin:6px 0 8px; padding:0; font-size:13px; display:grid; grid-template-columns:auto 1fr; gap:1px 10px; }
article.wreck ul.facts li { display:contents; }
article.wreck ul.facts b { color:var(--muted); font-weight:500; }
.ship-class.Dreadnought { color:var(--red); font-weight:700; }
.salvage-value { color:var(--amber); font-weight:700; }
article.wreck a.details { margin-top:auto; font-size:13px; text-decoration:none; }
nav.pager { display:flex; flex-wrap:wrap; gap:6px; margin:22px 0 0; align-items:center; }
nav.pager a, nav.pager span { padding:6px 11px; border:1px solid var(--line); border-radius:8px; text-decoration:none; font-size:13.5px; background:rgba(18,26,39,.94); }
nav.pager span.current { background:var(--amber); color:#111; border-color:var(--amber); font-weight:700; }
nav.pager span.off { color:#4b5a73; }
footer.site { text-align:center; color:var(--muted); font-size:12px; padding:20px; border-top:1px solid var(--line); background:rgba(8,12,20,.9); }
.dossier { max-width:980px; margin:0 auto; padding:24px 28px 40px; }
.dossier .hero { display:grid; grid-template-columns:1.2fr 1fr; gap:22px; background:rgba(18,26,39,.94); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
.dossier .hero img { width:100%; height:100%; object-fit:cover; display:block; }
.dossier .hero .txt { padding:18px 20px; }
.dossier h1 { margin:0; font:800 30px Consolas, monospace; letter-spacing:.05em; }
.dossier dl.specs { display:grid; grid-template-columns:auto 1fr; gap:4px 16px; margin:14px 0 0; font-size:14px; }
.dossier dt { color:var(--muted); }
.dossier dd { margin:0; }
.dossier section { margin-top:18px; background:rgba(18,26,39,.94); border:1px solid var(--line); border-radius:12px; padding:14px 18px; }
.dossier section h2 { margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:.14em; color:var(--amber); }
.core-status { font:800 20px Consolas, monospace; letter-spacing:.12em; padding:2px 10px; border-radius:6px; }
.core-status.LIVE { color:#0b0f17; background:var(--teal); box-shadow:0 0 18px var(--teal); }
.core-status.COLD { color:#9fc3ff; border:1px solid #9fc3ff; }
.core-status.BREACHED { color:var(--red); border:1px solid var(--red); }
table.manifest { border-collapse:collapse; width:100%; font-size:14px; }
table.manifest th, table.manifest td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); }
@media (max-width:760px) { .dossier .hero { grid-template-columns:1fr; } }
`;

function page(title, body, active) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="/favicon.png">
<style>${CSS}</style>
</head>
<body>
<header class="site">
  <a class="logo" href="/registry?start=1">Ceres Salvage Registry<small>Licensed wreck listings for the Main Belt</small></a>
  <nav><a href="/registry?start=1"${active === "registry" ? ' class="on"' : ""}>Registry</a><a href="/robots.txt">robots.txt</a><a href="/">Crew console</a></nav>
</header>
${body}
<footer class="site">Ceres Salvage Registry &middot; every ship, hull and sector here is fictional &middot; built for ISA 401 at Miami University</footer>
</body>
</html>`;
}

function send(res, status, html) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(status).send(html);
}

module.exports = { DATA, byHull, esc, img, page, send };
