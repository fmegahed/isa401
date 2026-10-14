// GET /exam/registry?start=S  (rewritten to /api/exam)
// The Exam 01 copy of the registry: same markup as the Class 11 game, different
// data (api/_exam_data.json: 360 wrecks, 40 a page). The game's own pages and data
// are not used here except for the shared page chrome in _site.js.
//
// The page answers two kinds of visitor: R on a student's computer (rvest, httr2,
// base R), and a person's web browser (for the Inspector and SelectorGadget).
// Anything else gets a 403. That includes the link fetchers of AI chatbots,
// which name themselves in the User-Agent and do not send a browser's
// navigation headers.
const { esc, img, page } = require("./_site");
const DATA = require("./_exam_data.json");

const PER = DATA.per_page, N = DATA.n;
const BASE = "/exam/registry";
const byPos = {};
for (const w of DATA.wrecks) byPos[w.pos] = w;

// ---- who is asking? ---------------------------------------------------------------
const AI_OR_BOT = /gptbot|chatgpt|oai-|openai|claude|anthropic|perplexity|gemini|bard|google-extended|googleother|google-cloudvertexbot|google-read-aloud|googlebot|bingbot|copilot|bytespider|ccbot|cohere|meta-external|facebookexternalhit|amazonbot|applebot|duckassist|mistral|youbot|diffbot|grok|xai|kagi|phind|bot\b|crawler|spider|fetcher|headless|playwright|puppeteer|selenium|phantomjs|python|aiohttp|httpx|node|axios|undici|go-http|okhttp|java\/|wget/i;
const R_CLIENT = /^R \(|r-curl|libcurl|httr|rvest|RStudio/;

function verdict(req) {
  const ua = String(req.headers["user-agent"] || "");
  if (!ua) return "deny:no-user-agent";
  if (AI_OR_BOT.test(ua)) return "deny:named-bot";
  if (R_CLIENT.test(ua)) return "allow:r";
  // a real browser navigating to a page sends Sec-Fetch headers; link fetchers do not
  const browser = /Mozilla\/5\.0/.test(ua) && (req.headers["sec-fetch-mode"] || req.headers["sec-fetch-dest"]);
  if (browser) return "allow:browser";
  return "deny:not-a-browser";
}

function send(res, status, html) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // never let the CDN hand one visitor's answer to another
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "User-Agent");
  res.setHeader("X-Robots-Tag", "noindex, noarchive");
  res.status(status).send(html);
}

// the shared chrome links to the Class 11 game; point it at the exam registry instead
function examPage(title, body) {
  return page(title, body, "registry")
    .split('href="/registry?start=1"').join(`href="${BASE}?start=1"`)
    .replace('<a href="/">Crew console</a>', "")
    .split("Ceres Salvage Registry").join("Pallas Salvage Registry");
}

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
      </div>
    </article>`;
}

function pager(start) {
  const starts = [];
  for (let s = 1; s <= N; s += PER) starts.push(s);
  const on = starts.includes(start) ? start : null;
  const prev = start - PER >= 1 ? `<a class="prev" href="${BASE}?start=${start - PER}">&larr; Previous</a>` : `<span class="off">&larr; Previous</span>`;
  const next = start + PER <= N ? `<a class="next" href="${BASE}?start=${start + PER}">Next &rarr;</a>` : `<span class="off">Next &rarr;</span>`;
  const nums = starts.map((s, i) => s === on ? `<span class="current">${i + 1}</span>` : `<a href="${BASE}?start=${s}">${i + 1}</a>`).join("");
  return `<nav class="pager">${prev}${nums}${next}</nav>`;
}

module.exports = (req, res) => {
  const v = verdict(req);
  const raw = (req.query && req.query.start) ?? "1";
  // one line per request in the function log, so the rule can be checked and tightened
  console.log(JSON.stringify({
    exam: v, start: String(raw).slice(0, 12), ua: String(req.headers["user-agent"] || "").slice(0, 220),
    sfm: req.headers["sec-fetch-mode"] || null, sfd: req.headers["sec-fetch-dest"] || null,
    accept: String(req.headers["accept"] || "").slice(0, 60),
  }));
  if (!v.startsWith("allow")) {
    return send(res, 403, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>403</title></head><body style="font:16px/1.5 sans-serif; max-width:560px; margin:60px auto; padding:0 20px;"><h1>403</h1><p>This registry answers web browsers and R only.</p></body></html>`);
  }

  const start = Number(raw);
  if (!Number.isInteger(start) || start < 1 || start > N) {
    return send(res, 404, examPage("Not found: Pallas Salvage Registry", `
      <div class="dossier"><section><h2>404: no wrecks at start=${esc(raw)}</h2>
      <p>The registry counts wrecks from 1 to ${N}. <code>start</code> is the number of the first wreck on the page.</p>
      <p><a href="${BASE}?start=1">Back to the first page</a></p></section></div>`));
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
  send(res, 200, examPage(`Registry (${start}-${end}): Pallas Salvage Registry`, body));
};
