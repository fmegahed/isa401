// The projector's results screens, shown right after the vote (Fadel, Oct 27: nothing waits for
// Monday). Everything comes from GET /api/results (admin key), so no student data sits in this file.
// Views, one per Space or right arrow (left arrow goes back): the title, five analytics panels as a
// guess screen and then the answer, the class favorites, and the gallery (click a map for its plan,
// prompt, pins and AI checks). Chart colors follow the validated light palette of the dataviz skill.
const BLUE = "#2a78d6", ORANGE = "#eb6834", INK = "#1b1b1b", INK2 = "#52514e", MUTE = "#8a8984", GRID = "#e4e4e1";
const VIEWS = ["title", "tool?", "tool", "toolwin?", "toolwin", "seat?", "seat", "feat?", "feat", "prompts?", "prompts", "running?", "running", "favorites", "gallery"];
const FEATURES = [
  ["rate_map", "Rate (cases ÷ population)"], ["butler_captured", "Butler County captured"], ["descriptive_title", "Descriptive title"],
  ["scale_appropriate", "Sequential scale (or Butler = reference)"], ["rate_values_shown", "Rate values on the map"],
  ["low_junk", "Little chart junk"], ["source_caption", "Source caption"], ["emphasis_text", "Key words emphasized"],
  ["personalized", "Personal touches"], ["time_shown", "Shows change over time"],
];

export function initResults(ctx) {
  const { $, getKey, section, toast } = ctx;
  let R = null, view = 0, loading = false, images = {}, gradeTimer = null, detail = null;

  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (x) => Math.round(x * 100) + "%";
  const winRate = (m) => (m.games ? (m.wins + 0.5 * m.ties) / m.games : null);
  const has = (m, k) => (m.grade ? (k === "low_junk" ? m.grade.chart_junk === "low" : Boolean(m.grade[k])) : null);
  const name = (m) => m.first + " " + m.initial + ".";

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const r = await fetch("/api/results?section=" + section, { cache: "no-store", headers: { "x-admin-key": getKey() } });
      if (!r.ok) throw new Error(String(r.status));
      R = await r.json();
      paint();
      fetchImages();
    } catch (e) { toast("Could not load the results. Press R to retry."); }
    finally { loading = false; }
  }
  // map images as data URLs (admin endpoint), a few at a time
  async function fetchImages() {
    const want = (R.maps || []).filter((m) => !images[m.imgId]).map((m) => m.imgId);
    let i = 0;
    async function worker() {
      while (i < want.length) {
        const id = want[i++];
        try {
          const r = await fetch("/api/image?id=" + id, { headers: { "x-admin-key": getKey() } });
          if (r.ok) { images[id] = (await r.json()).image; paintImages(); }
        } catch (e) {}
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
  }
  function paintImages() { document.querySelectorAll("#results img[data-img]").forEach((im) => { const u = images[im.dataset.img]; if (u && im.src !== u) im.src = u; }); }

  // the AI grading runs in the background while the vote is on and when the results open
  async function gradeLoop() {
    clearTimeout(gradeTimer);
    try {
      const r = await fetch("/api/grade", { method: "POST", headers: { "content-type": "application/json", "x-admin-key": getKey() }, body: JSON.stringify({ section }) });
      const j = await r.json();
      ctx.setGradeStatus(j.remaining || j.plansRemaining ? "AI grading: " + (j.remaining || 0) + " maps, " + (j.plansRemaining || 0) + " plans left" : "AI grading done");
      if (j.remaining || j.plansRemaining) { gradeTimer = setTimeout(gradeLoop, 1500); return; }
      if (R && (R.ungraded || R.plansUngraded)) load();
    } catch (e) { gradeTimer = setTimeout(gradeLoop, 5000); }
  }

  // ---------- small SVG helpers
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 18}" fill="${o.c || INK2}"${o.a ? ` text-anchor="${o.a}"` : ""}${o.w ? ` font-weight="${o.w}"` : ""}>${esc(s)}</text>`;
  function hbar(x0, y, w, h, fill) { const r = Math.min(4, w); if (w <= 0) return ""; return `<path d="M${x0},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - r}z" fill="${fill}"/>`; }
  const panel = (kicker, title, sub, body) => `<div class="rp"><div class="rk">${esc(kicker)}</div><h2>${esc(title)}</h2>${sub ? `<div class="rs">${esc(sub)}</div>` : ""}<div class="rbody">${body}</div></div>`;
  const ask = (q, hint) => `<div class="rask"><div class="q">${q}</div>${hint ? `<div class="h">${esc(hint)}</div>` : ""}</div>`;

  // ---------- views
  function vTitle() {
    const maps = R.maps || [];
    const wall = maps.map((m) => `<div><img data-img="${m.imgId}" alt=""></div>`).join("");
    return `<div class="rtitle"><div class="wall">${wall}</div><div class="over"><div class="kick">SECTION ${esc(section)} RESULTS</div>
      <h1><b>${maps.length}</b> maps. <b>${R.votes}</b> votes. One question.</h1>
      <div class="q">How did Butler County's COVID experience compare with the rest of Ohio?</div>
      <div class="nums"><div><b>${R.plans}</b><span>plans</span></div><div><b>${maps.length}</b><span>maps</span></div><div><b>${R.voters}</b><span>voters</span></div><div><b>${maps.reduce((a, m) => a + (m.prompts || 0), 0)}</b><span>prompts sent</span></div></div></div></div>`;
  }
  function toolCounts() {
    const c = {};
    for (const m of R.maps) c[m.toolGroup] = (c[m.toolGroup] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }
  function vTool(reveal) {
    const rows = toolCounts(), max = Math.max(1, ...rows.map((r) => r[1]));
    let s = "";
    rows.forEach(([t, n], i) => {
      const y = 10 + i * 52, w = reveal ? n / max * 560 : 560;
      s += T(190, y + 30, t, { a: "end", c: INK, fs: 22 });
      s += reveal ? hbar(200, y, w, 36, BLUE) + T(210 + w, y + 27, n, { c: INK, fs: 22, w: 700 })
        : `<rect x="200" y="${y}" width="560" height="36" rx="4" fill="#f4f4f2" stroke="#d6d6d2" stroke-dasharray="6 5"/>` + T(480, y + 27, "?", { a: "middle", c: MUTE, fs: 22 });
    });
    const svg = `<svg viewBox="0 0 860 ${20 + rows.length * 52}">${s}</svg>`;
    const models = {};
    for (const m of R.maps) { const k = (m.model || "").trim() || "(blank)"; models[k] = (models[k] || 0) + 1; }
    const side = reveal
      ? `<div class="rside"><div class="lab">Models, as you typed them</div>${Object.entries(models).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `<div class="row"><span>${esc(k)}</span><b>${n}</b></div>`).join("")}</div>`
      : ask(`Out of <b>${R.maps.length}</b> maps, how many were made with <b>${esc(rows[0] ? rows[0][0] : "ChatGPT")}</b>?`, "Shout a number. Then: which tool came in second?");
    return panel("Panel 1 of 5", "Which AI tool did you use?", "Maps per tool", `<div class="two">${svg}${side}</div>`);
  }
  function vToolWin(reveal) {
    const g = {};
    for (const m of R.maps) { const k = m.toolGroup; g[k] = g[k] || { w: 0, n: 0, maps: 0 }; g[k].w += m.wins + 0.5 * m.ties; g[k].n += m.games; g[k].maps++; }
    const rows = Object.entries(g).filter(([, v]) => v.n > 0).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n);
    const X = (v) => 220 + v * 520;
    let s = "";
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => { s += `<line x1="${X(v)}" x2="${X(v)}" y1="0" y2="${rows.length * 52}" stroke="${v === 0.5 ? "#b9b9b4" : GRID}" ${v === 0.5 ? 'stroke-dasharray="5 4"' : ""}/>` + T(X(v), rows.length * 52 + 24, pct(v), { a: "middle", fs: 16, c: MUTE }); });
    rows.forEach(([t, v], i) => {
      const y = 26 + i * 52, p = v.w / v.n;
      // Wilson 90% interval: with a few maps the range is wide, which is the point
      const z = 1.645, n = v.n, c = (p + z * z / (2 * n)) / (1 + z * z / n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n);
      s += T(205, y + 6, t, { a: "end", c: INK, fs: 22 });
      if (reveal) s += `<line x1="${X(Math.max(0, c - h))}" x2="${X(Math.min(1, c + h))}" y1="${y}" y2="${y}" stroke="${BLUE}" stroke-width="3" opacity=".45"/><circle cx="${X(p)}" cy="${y}" r="9" fill="${BLUE}" stroke="#fff" stroke-width="2"/>` + T(X(Math.min(1, c + h)) + 10, y + 6, pct(p) + " · " + v.maps + " maps", { fs: 17 });
    });
    const svg = `<svg viewBox="0 0 900 ${rows.length * 52 + 40}">${s}</svg>`;
    const guesses = Object.entries(R.guesses || {}).sort((a, b) => b[1] - a[1]);
    const side = reveal
      ? `<div class="rside"><div class="lab">Your guesses after voting</div>${guesses.length ? guesses.map(([k, n]) => `<div class="row"><span>${esc(k)}</span><b>${n}</b></div>`).join("") : "<div class='row'><span>No guesses</span></div>"}<div class="note">Bars: likely range. Tools were hidden while you voted.</div></div>`
      : ask("Which tool's maps won the most matchups?", "Your guesses after voting are on the next screen.");
    return panel("Panel 2 of 5", "Which tool's maps won?", "Share of matchups won (a tie counts half)", `<div class="two">${svg}${side}</div>`);
  }
  function vSeat(reveal) {
    const cells = {};
    for (const m of R.maps) {
      const mm = /^([LR])([1-3])-/.exec(m.seat || ""); if (!mm) continue;
      const k = mm[1] + mm[2]; cells[k] = cells[k] || { w: 0, n: 0, maps: 0 }; cells[k].w += m.wins + 0.5 * m.ties; cells[k].n += m.games; cells[k].maps++;
    }
    const ramp = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
    let s = `<rect x="300" y="4" width="300" height="30" rx="4" fill="#efefec"/>` + T(450, 25, "Front of the room", { a: "middle", fs: 16 });
    ["L", "R"].forEach((side, k) => {
      const bx = k ? 470 : 130;
      s += T(bx + 150, 64, side === "L" ? "Left side" : "Right side", { a: "middle", c: INK, fs: 19, w: 700 });
      for (let row = 1; row <= 3; row++) {
        const c = cells[side + row], y = 80 + (row - 1) * 86;
        const p = c && c.n && c.maps >= 3 ? c.w / c.n : null;
        const fill = !reveal || p == null ? "#f4f4f2" : ramp[Math.max(0, Math.min(5, Math.round((p - 0.3) / 0.4 * 5)))];
        const ink = reveal && p != null && p > 0.55 ? "#fff" : INK;
        s += `<rect x="${bx}" y="${y}" width="300" height="76" rx="6" fill="${fill}" stroke="#d6d6d2"/>` + T(bx + 16, y + 30, "Row " + row, { fs: 17, c: ink });
        s += T(bx + 16, y + 56, (c ? c.maps : 0) + " maps", { fs: 15, c: ink });
        s += T(bx + 284, y + 50, reveal ? (p == null ? (c ? "too few" : "—") : pct(p)) : "?", { a: "end", fs: reveal && p != null ? 30 : 20, w: 700, c: ink });
      }
    });
    const svg = `<svg viewBox="0 0 900 350">${s}</svg>`;
    return panel("Panel 3 of 5", "Does where you sit matter?", "Share of matchups won, by side and row (rows with fewer than 3 maps are not shown)",
      reveal ? svg + `<div class="note c">Correlation, not cause: you chose your seat.</div>` : `<div class="two">${svg}${ask("Front row or back row: who won more matchups?", "")}</div>`);
  }
  function vFeat(reveal) {
    const graded = R.maps.filter((m) => m.grade && m.games);
    const rows = FEATURES.map(([k, label]) => {
      const yes = graded.filter((m) => has(m, k)), no = graded.filter((m) => !has(m, k));
      const wr = (arr) => { const g = arr.reduce((a, m) => a + m.games, 0); return g ? arr.reduce((a, m) => a + m.wins + 0.5 * m.ties, 0) / g : null; };
      return { label, n: yes.length, with: wr(yes), without: wr(no) };
    });
    const X = (v) => 360 + v * 480;
    let s = `<circle cx="372" cy="12" r="7" fill="${BLUE}"/>` + T(386, 18, "with", { fs: 16 }) + `<circle cx="450" cy="12" r="7" fill="${ORANGE}"/>` + T(464, 18, "without", { fs: 16 });
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => { s += `<line x1="${X(v)}" x2="${X(v)}" y1="30" y2="${36 + rows.length * 44}" stroke="${v === 0.5 ? "#b9b9b4" : GRID}" ${v === 0.5 ? 'stroke-dasharray="5 4"' : ""}/>` + T(X(v), 60 + rows.length * 44, pct(v), { a: "middle", fs: 15, c: MUTE }); });
    rows.forEach((r, i) => {
      const y = 54 + i * 44;
      s += T(345, y + 2, r.label, { a: "end", c: INK, fs: 18 }) + T(345, y + 20, "on " + r.n + " of " + graded.length + " maps", { a: "end", fs: 13, c: MUTE });
      if (!reveal) return;
      if (r.with != null && r.without != null) s += `<line x1="${X(r.without)}" x2="${X(r.with)}" y1="${y}" y2="${y}" stroke="#b9b9b4" stroke-width="3"/>`;
      if (r.without != null) s += `<circle cx="${X(r.without)}" cy="${y}" r="8" fill="${ORANGE}" stroke="#fff" stroke-width="2"/>`;
      if (r.with != null) s += `<circle cx="${X(r.with)}" cy="${y}" r="8" fill="${BLUE}" stroke="#fff" stroke-width="2"/>`;
    });
    const svg = `<svg viewBox="0 0 900 ${80 + rows.length * 44}">${s}</svg>`;
    const sub = "Share of matchups won by maps with vs. without each feature (AI-checked with Fadel's rubric)" + (R.ungraded ? ` · ${R.ungraded} maps not graded yet` : "");
    return panel("Panel 4 of 5", "Which features won votes?", sub,
      reveal ? svg + `<div class="note c">Correlation, not cause: maps with one good feature often have others.</div>` : `<div class="two">${svg}${ask("Which feature do you think won the most votes?", "")}</div>`);
  }
  function vPrompts(reveal) {
    const pts = R.maps.filter((m) => m.games && m.prompts);
    const maxP = Math.max(5, ...pts.map((m) => m.prompts));
    const X = (v) => 90 + (v - 1) / Math.max(1, maxP - 1) * 740, Y = (v) => 330 - v * 300;
    let s = "";
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => { s += `<line x1="80" x2="840" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0.5 ? "#b9b9b4" : GRID}"/>` + T(70, Y(v) + 6, pct(v), { a: "end", fs: 15, c: MUTE }); });
    for (let t = 1; t <= maxP; t += Math.max(1, Math.round(maxP / 8))) s += T(X(t), 360, t, { a: "middle", fs: 15, c: MUTE });
    s += T(840, 384, "prompts sent", { a: "end", fs: 15, c: MUTE });
    if (reveal) for (const m of pts) s += `<circle cx="${(X(m.prompts) + (Math.random() - 0.5) * 10).toFixed(1)}" cy="${Y(winRate(m)).toFixed(1)}" r="8" fill="${BLUE}" fill-opacity=".75" stroke="#fff" stroke-width="1.5"><title>${esc(name(m))}: ${m.prompts} prompts, won ${pct(winRate(m))}</title></circle>`;
    const svg = `<svg viewBox="0 0 860 392">${s}</svg>`;
    return panel("Panel 5 of 5", "Did more prompts help?", "Prompts sent vs. share of matchups won, one dot per map", reveal ? svg : `<div class="two">${svg}${ask("Did students who sent more prompts win more?", "")}</div>`);
  }
  function vRunning(reveal) {
    const maps = R.maps;
    const graded = maps.filter((m) => m.grade);
    const summed = graded.filter((m) => m.grade.running_total_mistake);
    const caught = maps.filter((m) => m.planGrade && m.planGrade.met.includes("running_total"));
    const missed = maps.filter((m) => m.planGrade && !m.planGrade.met.includes("running_total"));
    const wr = (arr) => { const g = arr.reduce((a, m) => a + m.games, 0); return g ? pct(arr.reduce((a, m) => a + m.wins + 0.5 * m.ties, 0) / g) : "—"; };
    const body = reveal
      ? `<div class="hero"><div><b>${summed.length}</b><span>of ${graded.length} maps added up the weekly running totals (Butler ≈ 7.6 million cases)</span></div>
         <div><b>${caught.length}</b><span>of ${caught.length + missed.length} plans said confirmed_cases is a running total</span></div></div>
         <div class="hero small"><div><b class="blue">${wr(caught)}</b><span>matchups won by maps whose plan caught it</span></div><div><b class="orange">${wr(missed)}</b><span>by the others</span></div></div>
         <div class="note c">The same trap as Tableau's SUM in Press Time: the AI does what you ask, including adding up running totals.</div>`
      : ask("How many of today's maps fell into the Press Time trap?", "Remember: confirmed_cases is a running total.");
    return panel("The Press Time check", "Did your plan catch the running total?", "From the AI checks of your plans (Jev) and your maps (gpt-6-luna)", body);
  }
  const ranked = () => R.maps.filter((m) => m.games >= 3).sort((a, b) => b.score - a.score);
  function vFavorites() {
    const top = ranked().slice(0, 5);
    return panel("Class favorites", "Your top 5 maps", "By the class's votes (Bradley-Terry scores from all matchups); click a map for its plan and prompt",
      `<div class="favs">${top.map((m, i) => `<button class="fav" data-key="${esc(m.key)}"><div class="rank">${i + 1}</div><img data-img="${m.imgId}" alt=""><div class="who"><b>${esc(name(m))}</b><span>${esc(m.tool)}${m.model ? " · " + esc(m.model) : ""} · ${m.prompts} prompts</span><span>${m.wins}–${m.losses}${m.ties ? "–" + m.ties : ""}${m.borrowed ? " · borrowed by " + m.borrowed : ""}</span></div></button>`).join("")}</div>`);
  }
  function vGallery() {
    const all = R.maps.slice().sort((a, b) => a.first.localeCompare(b.first));
    return panel("Gallery", "Every map", "Click a map for its plan, final prompt, pins and AI checks",
      `<div class="gal">${all.map((m) => `<button class="gm" data-key="${esc(m.key)}"><img data-img="${m.imgId}" alt=""><span><b>${esc(name(m))}</b> · ${esc(m.tool)}</span></button>`).join("")}</div>`);
  }
  function vDetail(m) {
    const pins = (m.pins || []).map((p, i) => `<div class="pinlab" style="left:${p.x * 100}%;top:${p.y * 100}%">${i + 1}</div>`).join("");
    const plan = m.plan ? ["measure", "period", "butler", "colors", "title", "creative"].filter((f) => m.plan[f]).map((f) => `<dt>${esc({ measure: "Measure", period: "Period", butler: "Butler", colors: "Colors", title: "Title idea", creative: "Creative idea" }[f])}</dt><dd>${esc(m.plan[f])}</dd>`).join("") : "<dd>No plan</dd>";
    const feats = m.grade ? FEATURES.map(([k, label]) => `<span class="${has(m, k) ? "y" : "n"}">${esc(label)}</span>`).join("") + (m.grade.running_total_mistake ? `<span class="bad">Added up running totals</span>` : "") : "<span class='n'>Not graded yet</span>";
    return `<div class="detail"><div class="dimg"><div class="dwrap"><img data-img="${m.imgId}" alt="">${pins}</div></div><div class="dtext">
      <h2>${esc(name(m))}</h2><div class="rs">${esc(m.tool)}${m.model ? " · " + esc(m.model) : ""} · ${m.prompts} prompts · record ${m.wins}–${m.losses}${m.ties ? "–" + m.ties : ""}</div>
      <div class="lab">Pins</div><ol class="pins">${(m.pins || []).map((p) => `<li><b>${esc(p.kind)}:</b> ${esc(p.text)}</li>`).join("")}</ol>
      <div class="lab">Final prompt</div><div class="prompt">${esc(m.finalPrompt)}</div>
      <div class="lab">Plan</div><dl>${plan}</dl>
      <div class="lab">AI checks</div><div class="feats">${feats}</div>
      <div class="note">Esc or click the map to go back</div></div></div>`;
  }

  function paint() {
    const host = $("results");
    if (!R) { host.innerHTML = "<div class='rp'><h2>Loading the results...</h2></div>"; return; }
    if (detail) { host.innerHTML = vDetail(detail); paintImages(); host.querySelector(".dimg").addEventListener("click", () => { detail = null; paint(); }); return; }
    const v = VIEWS[view];
    const html = { title: vTitle, tool: () => vTool(true), "tool?": () => vTool(false), toolwin: () => vToolWin(true), "toolwin?": () => vToolWin(false),
      seat: () => vSeat(true), "seat?": () => vSeat(false), feat: () => vFeat(true), "feat?": () => vFeat(false), prompts: () => vPrompts(true),
      "prompts?": () => vPrompts(false), running: () => vRunning(true), "running?": () => vRunning(false), favorites: vFavorites, gallery: vGallery }[v]();
    host.innerHTML = html + `<div class="dots">${VIEWS.map((_, i) => `<i class="${i === view ? "on" : ""}"></i>`).join("")}</div>`;
    host.querySelectorAll("[data-key]").forEach((b) => b.addEventListener("click", () => { detail = R.maps.find((m) => m.key === b.dataset.key); paint(); }));
    paintImages();
    ctx.setResultsLabel(view < VIEWS.length - 1 ? "Next" : "Last screen");
  }

  return {
    enter() { if (!R) load(); gradeLoop(); paint(); },
    leave() { clearTimeout(gradeTimer); },
    startGrading() { gradeLoop(); },
    next() { if (detail) { detail = null; paint(); return; } if (view < VIEWS.length - 1) { view++; paint(); if (VIEWS[view] === "feat?" || VIEWS[view] === "running?") load(); } },
    prev() { if (detail) { detail = null; paint(); return; } if (view > 0) { view--; paint(); } },
    reload() { load(); },
    escape() { if (detail) { detail = null; paint(); return true; } return false; },
  };
}
