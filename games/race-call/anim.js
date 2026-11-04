// Race Call: the two animated charts, drawn as SVG in the browser (projector and phones).
//   RCAnim.mount(el, kind, {annotate})  kind "gapminder" (question 8) or "ohio" (reveal of question 13)
// Returns {stop()}. Data come from charts/gapminder.json and charts/ohio_weeks.json, both written by
// make_charts.R. No libraries.
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const cache = {};
  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function load(kind) {
    const url = kind === "gapminder" ? "charts/gapminder.json" : "charts/ohio_weeks.json";
    if (!cache[url]) cache[url] = fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });
    return cache[url];
  }
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // ---------- Gapminder motion chart ----------
  // same Okabe-Ito hues as the Class 21 deck's bubble chart (Africa and Oceania were too close)
  const CONT = { Africa: "#E69F00", Americas: "#CC79A7", Asia: "#009E73", Europe: "#0072B2", Oceania: "#1A1A1A" };
  function gapminder(host, D, opt) {
    const W = 800, H = 500, L = 70, R = opt.annotate ? 250 : 130, T = 46, B = 56;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "rc-anim", role: "img", "aria-label": "Animated bubble chart of income and life expectancy by country, 1952 to 2007" });
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }, svg);
    const x = (g) => L + (Math.log10(g) - Math.log10(200)) / (Math.log10(150000) - Math.log10(200)) * (W - L - R);
    const y = (l) => H - B - (l - 20) / (88 - 20) * (H - T - B);
    const yearT = el("text", { x: L + (W - L - R) / 2, y: H - B - 40, "text-anchor": "middle", "font-size": 150, "font-weight": 800, fill: "#EEF0F2", "font-family": "Barlow Condensed, Arial Narrow, sans-serif" }, svg, "");
    for (const g of [300, 1000, 3000, 10000, 30000, 100000]) {
      el("line", { x1: x(g), x2: x(g), y1: T, y2: H - B, stroke: "#E6E8EA" }, svg);
      el("text", { x: x(g), y: H - B + 22, "text-anchor": "middle", "font-size": 15, fill: "#444" }, svg, g >= 1000 ? "$" + g / 1000 + "k" : "$" + g);
    }
    for (const l of [30, 40, 50, 60, 70, 80]) {
      el("line", { x1: L, x2: W - R, y1: y(l), y2: y(l), stroke: "#E6E8EA" }, svg);
      el("text", { x: L - 10, y: y(l) + 5, "text-anchor": "end", "font-size": 15, fill: "#444" }, svg, l);
    }
    el("text", { x: L + (W - L - R) / 2, y: H - 12, "text-anchor": "middle", "font-size": 16, fill: "#222", "font-weight": 600 }, svg, "Income per person (GDP per capita, log scale)");
    el("text", { x: 18, y: T + (H - T - B) / 2, "text-anchor": "middle", "font-size": 16, fill: "#222", "font-weight": 600, transform: `rotate(-90 18 ${T + (H - T - B) / 2})` }, svg, "Life expectancy (years)");
    el("text", { x: L, y: 28, "font-size": 20, "font-weight": 700, fill: "#1B1B1B" }, svg, "Income and life expectancy, 142 countries");
    let ly = T + 6;
    for (const c of D.continents) {
      el("circle", { cx: W - R + 26, cy: ly + 8, r: 7, fill: CONT[c], "fill-opacity": 0.8 }, svg);
      el("text", { x: W - R + 40, y: ly + 13, "font-size": 15, fill: "#222" }, svg, c);
      ly += 26;
    }
    if (opt.annotate) {
      const notes = [["x", "income per person"], ["y", "life expectancy"], ["size", "population"], ["color", "continent"], ["time", "the frames"]];
      let ny = ly + 26;
      el("text", { x: W - R + 20, y: ny, "font-size": 16, "font-weight": 800, fill: "#1B1B1B" }, svg, "Encodings");
      for (const [k, v] of notes) {
        ny += 28;
        const t = el("text", { x: W - R + 20, y: ny, "font-size": 16, fill: k === "time" ? "#B07A00" : "#222", "font-weight": k === "time" ? 800 : 400 }, svg);
        el("tspan", { "font-weight": 800 }, t, k + " = "); el("tspan", {}, t, v);
      }
    }
    const maxPop = Math.max(...D.countries.map((c) => Math.max(...c.pop)));
    const rad = (p) => 3 + 34 * Math.sqrt(p / maxPop);
    const order = D.countries.map((c, i) => [i, Math.max(...c.pop)]).sort((a, b) => b[1] - a[1]).map((d) => d[0]);
    const g = el("g", {}, svg);
    const dots = order.map((i) => ({ c: D.countries[i], e: el("circle", { fill: CONT[D.countries[i].continent], "fill-opacity": 0.72, stroke: "#fff", "stroke-width": 0.8 }, g) }));
    const yrs = D.years, STEP = 900, HOLD = 2200, total = (yrs.length - 1) * STEP + HOLD;
    let t0 = performance.now(), raf = 0, lastYear = null;
    function frame(now) {
      const t = (now - t0) % total;
      const k = Math.min(yrs.length - 1, Math.floor(t / STEP)), f = k >= yrs.length - 1 ? 0 : ease((t - k * STEP) / STEP);
      const k2 = Math.min(yrs.length - 1, k + 1);
      for (const d of dots) {
        const gd = d.c.gdp[k] + (d.c.gdp[k2] - d.c.gdp[k]) * f, lf = d.c.life[k] + (d.c.life[k2] - d.c.life[k]) * f, pp = d.c.pop[k] + (d.c.pop[k2] - d.c.pop[k]) * f;
        d.e.setAttribute("cx", x(gd).toFixed(1)); d.e.setAttribute("cy", y(lf).toFixed(1)); d.e.setAttribute("r", rad(pp).toFixed(1));
      }
      const yr = f > 0.5 ? yrs[k2] : yrs[k];
      if (yr !== lastYear) { yearT.textContent = yr; lastYear = yr; }
      raf = requestAnimationFrame(frame);
    }
    host.replaceChildren(svg);
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf); } };
  }

  // ---------- Ohio weekly COVID map ----------
  function ohio(host, D, opt) {
    const PAD = 20, LEG = 190, TOP = 70, BOT = 64;
    const W = D.w + 2 * PAD + LEG, H = D.h + TOP + BOT;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "rc-anim", role: "img", "aria-label": "Animated map of weekly COVID cases per 100,000 by Ohio county" });
    el("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }, svg);
    el("text", { x: PAD, y: 30, "font-size": 22, "font-weight": 700, fill: "#1B1B1B" }, svg, "Ohio: weekly COVID cases per 100,000, animated");
    const date = el("text", { x: PAD, y: 58, "font-size": 20, "font-weight": 700, fill: "#9E1B32" }, svg, "");
    const g = el("g", { transform: `translate(${PAD},${TOP})` }, svg);
    const paths = D.counties.map((c) => ({ c, e: el("path", { d: c.d, stroke: "#fff", "stroke-width": 0.8, fill: "#eee" }, g) }));
    let ly = TOP + 10;
    el("text", { x: D.w + 2 * PAD, y: ly, "font-size": 15, "font-weight": 700, fill: "#222" }, svg, "Weekly cases");
    ly += 18;
    el("text", { x: D.w + 2 * PAD, y: ly, "font-size": 15, "font-weight": 700, fill: "#222" }, svg, "per 100,000");
    D.colors.forEach((col, i) => {
      el("rect", { x: D.w + 2 * PAD, y: ly + 12 + i * 28, width: 22, height: 20, fill: col, stroke: "#ccc" }, svg);
      el("text", { x: D.w + 2 * PAD + 30, y: ly + 27 + i * 28, "font-size": 15, fill: "#222" }, svg, D.labels[i]);
    });
    // timeline
    const tl = el("g", { transform: `translate(${PAD},${H - 34})` }, svg);
    const TW = W - 2 * PAD;
    el("rect", { x: 0, y: 0, width: TW, height: 8, rx: 4, fill: "#E6E8EA" }, tl);
    const prog = el("rect", { x: 0, y: 0, width: 0, height: 8, rx: 4, fill: "#9E1B32" }, tl);
    const yrs = {}; D.weeks.forEach((w, i) => { const y = w.slice(0, 4); if (!(y in yrs)) yrs[y] = i; });
    for (const [y, i] of Object.entries(yrs)) el("text", { x: TW * i / (D.weeks.length - 1), y: 26, "font-size": 14, fill: "#444" }, tl, y);
    const MS = 150, HOLD = 1800, N = D.weeks.length, total = N * MS + HOLD;
    const fmt = (s) => { const d = new Date(s + "T12:00:00"); return "Week of " + d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); };
    let t0 = performance.now(), raf = 0, last = -1;
    function frame(now) {
      const k = Math.min(N - 1, Math.floor(((now - t0) % total) / MS));
      if (k !== last) {
        last = k;
        for (const p of paths) { const b = p.c.bins[k]; p.e.setAttribute("fill", b ? D.colors[b - 1] : "#eee"); }
        date.textContent = fmt(D.weeks[k]);
        prog.setAttribute("width", (TW * k / (N - 1)).toFixed(1));
      }
      raf = requestAnimationFrame(frame);
    }
    host.replaceChildren(svg);
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf); } };
  }

  function mount(host, kind, opt) {
    opt = opt || {};
    let stopped = false, inner = null;
    load(kind).then((D) => { if (!stopped) inner = (kind === "gapminder" ? gapminder : ohio)(host, D, opt); })
      .catch(() => { if (!stopped) host.textContent = "The animation could not load."; });
    return { stop() { stopped = true; if (inner) inner.stop(); } };
  }
  window.RCAnim = { mount };
})();
