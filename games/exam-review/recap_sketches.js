// Animated chart sketches for the recap whiteboards (Exam 02). Each sketch draws into an SVG group inside a box on the
// 960 x 540 board and is driven by the audio clock: update(t) sets every shape from the time alone, so a sketch can be
// scrubbed, replayed or played faster with nothing else to keep in sync.
//   ctx = { g, box: { x, y, w, h }, T: [start, phase 1, phase 2, ...] (seconds), sv(tag, attrs) }
// A clip asks for one with { sketch: "name", at: "cue", phases: ["cue", ...], box: "right" } in content/recap_exam02.mjs;
// make_recap.mjs turns the cues into times. Everything a sketch shows is also said in the narration.
// PHASES says how many phase cues each sketch expects (make_recap.mjs checks it).
const INK = "#1b1b1b", RED = "#c3142d", BLUE = "#1d4ed8", GRAY = "#d1d5db", PALE = "#f4c6cd";
const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : (1 - Math.cos(Math.PI * p)) / 2);
const prog = (t, t0, d = 1) => ease((t - t0) / d);
const lerp = (a, b, p) => a + (b - a) * p;
// a color between two hex colors
const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], p)).toString(16).padStart(2, "0")).join(""); };
const BLUES = (v) => mix("#eff6ff", "#1e3a8a", v);

function kit(ctx) {
  const { g, sv } = ctx;
  const add = (tag, a) => { const e = sv(tag, a); g.appendChild(e); return e; };
  return {
    add,
    // a stroke that draws itself: set(p) with p from 0 to 1
    stroke: (d, color = INK, width = 2.5, extra = {}) => {
      const e = add("path", { d, fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, ...extra });
      return { e, set: (p) => e.setAttribute("stroke-dashoffset", 1 - p) };
    },
    // handwritten text; parts = [[text, color], ...] for a line in more than one color
    text: (s, x, y, o = {}) => {
      const e = add("text", { x, y, class: "bhand", "font-size": o.size || 24, fill: o.color || INK, "text-anchor": o.anchor || "start", opacity: 0 });
      if (Array.isArray(s)) s.forEach(([str, c]) => { const sp = sv("tspan", { fill: c || INK }); sp.textContent = str; e.appendChild(sp); });
      else e.textContent = s;
      return e;
    },
    rect: (a) => add("rect", { rx: 2, ...a }),
    line: (x1, y1, x2, y2, a = {}) => add("line", { x1, y1, x2, y2, stroke: INK, "stroke-width": 2, "stroke-linecap": "round", ...a }),
    circle: (cx, cy, r, a = {}) => add("circle", { cx, cy, r, ...a }),
    fadeAll: (list, p) => list.forEach((e) => e.setAttribute("opacity", p)),
    fade: (e, p) => e.setAttribute("opacity", p),
    bar: (e, base, hh) => { e.setAttribute("y", base - hh); e.setAttribute("height", Math.max(0, hh)); },
  };
}

export const PHASES = { truncBars: 1, lieFactor: 1, dataInk: 3, dualAxes: 2, chooseChart: 2, pieVsBars: 1, stacked: 1, unstacked: 3, meanBar: 2,
  varTypes: 2, channels: 4, grammar: 7, schemes: 2, colorMistakes: 3, lineMany: 0, barsFew: 0, twoPoints: 1, unevenYears: 2, seasonal: 1, calendar: 0,
  animVsSmall: 1, countVsRate: 2, symbols: 1, smallMult: 1, parcoords: 2, fourCharts: 4, comb: 1, crashRows: 1, sumTrap: 2, checklist: 5, sanityBars: 1 };
// the stacked-bar example and its two fixes share one small data set: three years, three categories
const STACK = [[40, 30, 20], [22, 32, 38], [52, 31, 9]], STACK_CATS = ["north", "south", "west"], STACK_FILLS = [GRAY, PALE, "#bfdbfe"];
// one line each, for the Board line of the scripts file
export const ABOUT = {
  truncBars: "two bars (12,000 and 15,000) on an axis from 11,000, \"looks 4 times as big\"; then the same bars from zero, \"really 25% more\"",
  lieFactor: "bars growing 100 to 120 \"in the data\" and 100 to 160 \"as drawn\"; then \"lie factor = 60 / 20 = 3\"",
  dataInk: "a 3D bar chart on a heavy grid with a \"WOW!\" sticker; the 3D, the grid and the sticker go as each is named",
  dualAxes: "two lines on two axes; the scales (0 to 900, 40.1 to 40.3) appear; \"each scale was picked to line up\"",
  chooseChart: "three rows, one per question: bars, a line, sorted bars of the shares",
  pieVsBars: "an unsorted pie of 27, 25, 24, 24, \"which slice is largest?\"; then the same values as bars, \"A, at a glance\"",
  stacked: "three stacked bars (north, south, west); the middle (pink) segment is outlined, with dashed lines to where it starts",
  unstacked: "the same data, two ways: 1. two charts side by side, a total chart and a by-category chart of side-by-side bars; 2. a paneled bar chart, one panel per category",
  meanBar: "two equal bars for two groups with the same average; then the bars go and the points appear (one group tight, one spread out) with a line at each average; then the lines go and a box plot is drawn under each group's points",
  varTypes: "three name tags that trade places (no order); a podium, 1st 2nd 3rd; a number line with 12 and 27, \"27 - 12 = 15 points per game\"",
  channels: "the same two numbers shown by position, length, angle and area, and color intensity, one row each as named; then hue and shape for categories",
  grammar: "a chart built part by part as each is named: a data table, the mappings (hours to x, GPA to y, year to color, credits to size), the points, the scales and legend, two facets, the axes; then the axis titles are circled (two variables) and the legend (the rest)",
  schemes: "swatches: light to dark blue (low, high); purple to white to orange (below, the middle, above); five separate hues (categories, no order)",
  colorMistakes: "a rainbow legend for 1 to 5, \"which color means more?\"; a purple-white-orange scale for 0 to 60 minutes, \"what is special about 30?\"; red and green dots that turn to two near-identical olives, \"as about 1 man in 12 sees them\"",
  lineMany: "24 monthly points joined by a line",
  barsFew: "four bars, 2023 to 2026",
  twoPoints: "two points, 2020 and 2025, joined by a straight line; then dashed paths it might have taken, \"the straight path was never measured\"",
  unevenYears: "2000, 2010, 2020, 2022, 2024 drawn evenly; the gaps (10 yrs, 10 yrs, 2, 2) appear; then the years move to their true spacing and the rates show (+1 a year, +3 a year)",
  seasonal: "two years of monthly visits with the same dips; then September is circled in both years, \"Sep to Sep: +12%\"",
  calendar: "a month as a calendar grid, weekdays dark and weekends pale",
  animVsSmall: "one panel whose bars change from 2024 to 2025 to 2026; then three small panels, one per year",
  countVsRate: "a grid of 20 counties (not a real map) shaded by a rate; then by raw counts, and three tiles go dark: Franklin, Cuyahoga, Hamilton",
  symbols: "the same grid with one circle per county sized by the count; then the tiles resize by population (a cartogram)",
  smallMult: "four dining-hall panels on one shared axis (Western far above Bell Tower); then each panel gets its own axis and they look alike",
  parcoords: "three axes (price, units sold, revenue) and six lines; the price to units sold band is marked \"crossing: negative\", the units sold to revenue band \"parallel: positive\"",
  fourCharts: "a radar whose shape changes when its axes are reordered; a heat map; a treemap; two Chernoff faces",
  comb: "six weeks of daily cases with a spike every week; then the spikes are marked, \"a spike every Tuesday: the reporting day\"",
  crashRows: "a crash table with 7 rows, \"7 rows = 7 people\"; then the rows group into 3 crashes",
  sumTrap: "four course sections, each listing Oxford's enrollment, 19,240; the column is circled, \"SUM: 76,960 (4 x 19,240)\"; then \"MAX or AVG: 19,240 (once)\"",
  sanityBars: "Butler County in Map Gallery: a bar of 7.6 million cases (the running totals added up) next to a bar of its 383,134 people, \"more cases than people?\"",
  checklist: "a messy bar chart of Rec Center visits (rainbow colors, heavy grid, shadows, axis from 150) fixed one item at a time: a title, axis labels, bars from zero and sorted, one color, then the grid and shadows go",
};

export const SKETCHES = {
  // Honest charts: two seasons' attendance on an axis that starts at 11,000, then the same bars from zero.
  // phases: [the honest version]
  truncBars(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const ax = x + 80, base = y + h - 50, top = y + 64, H = base - top;
    const axis = k.stroke(`M${ax} ${top - 10} V${base} H${x + w - 10}`);
    const vals = [12000, 15000], cx = [ax + 60, ax + 200], bw = 92;
    const trunc = vals.map((v) => (v - 11000) / 4000), honest = vals.map((v) => v / 15000);
    const bars = vals.map((v, i) => k.rect({ x: cx[i], width: bw, y: base, height: 0, fill: i ? RED : PALE, stroke: INK, "stroke-width": 2 }));
    const labs = vals.map((v, i) => k.text(v.toLocaleString("en-US"), cx[i] + bw / 2, base, { anchor: "middle" }));
    const seasons = ["season 1", "season 2"].map((s, i) => k.text(s, cx[i] + bw / 2, base + 30, { anchor: "middle", size: 22 }));
    const low = k.text("11,000", ax - 8, base + 7, { anchor: "end", size: 22, color: RED });
    const zero = k.text("0", ax - 8, base + 7, { anchor: "end", size: 22, color: BLUE });
    const looks = k.text("looks 4 times as big", x + w / 2 + 20, y + 26, { anchor: "middle", color: RED });
    const really = k.text("really 25% more", x + w / 2 + 20, y + 26, { anchor: "middle", color: BLUE });
    return (t) => {
      axis.set(prog(t, T[0], 0.6));
      const p0 = prog(t, T[0] + 0.3, 1.1), p1 = prog(t, T[1], 1.2);
      bars.forEach((b, i) => {
        const hh = (trunc[i] + (honest[i] - trunc[i]) * p1) * p0 * H;
        k.bar(b, base, hh); labs[i].setAttribute("y", base - hh - 8); k.fade(labs[i], p0); k.fade(seasons[i], p0);
      });
      k.fade(low, p0 * (1 - p1)); k.fade(zero, p1); k.fade(looks, prog(t, T[0] + 1.6, 0.5) * (1 - p1)); k.fade(really, p1);
    };
  },

  // Lie factor: the data grow 20%, the drawing grows 60%.  phases: [the lie factor]
  lieFactor(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const base = y + h - 50, top = y + 90, H = base - top, bw = 64;
    const groups = [{ name: "in the data", v: [100, 120], c: "#6b7280", x: x + 30 }, { name: "as drawn", v: [100, 160], c: RED, x: x + w / 2 + 20 }];
    const floor = k.stroke(`M${x + 10} ${base} H${x + w - 10}`);
    const parts = groups.map((gr, gi) => ({
      bars: gr.v.map((v, i) => k.rect({ x: gr.x + i * (bw + 14), width: bw, y: base, height: 0, fill: i ? gr.c : GRAY, stroke: INK, "stroke-width": 2 })),
      name: k.text(gr.name, gr.x + bw + 7, base + 32, { anchor: "middle", size: 24 }),
      pct: k.text(gi ? "+60%" : "+20%", gr.x + bw * 1.5 + 14, base - (gr.v[1] / 160) * H - 10, { anchor: "middle", size: 26, color: gi ? RED : INK }),
    }));
    const lf = k.text([["lie factor = 60 / 20 = ", INK], ["3", RED]], x + w / 2, y + 30, { anchor: "middle", size: 30 });
    return (t) => {
      floor.set(prog(t, T[0], 0.5));
      parts.forEach((pt, gi) => {
        const p = prog(t, T[0] + 0.3 + gi * 1.4, 1);
        pt.bars.forEach((b, i) => k.bar(b, base, (groups[gi].v[i] / 160) * H * p));
        k.fade(pt.name, p); k.fade(pt.pct, prog(t, T[0] + 1 + gi * 1.4, 0.6));
      });
      k.fade(lf, prog(t, T[1], 0.6));
    };
  },

  // Data-ink: a 3D bar chart on a heavy grid with a sticker, and then each piece of decoration goes as it is named.
  // phases: [3D goes, the grid goes, the decoration goes]
  dataInk(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const base = y + h - 30, top = y + 40, H = base - top, vals = [0.5, 0.85, 0.65], bw = 76, gap = (w - 80 - 3 * bw) / 2;
    const bgd = k.rect({ x: x + 10, y: top - 20, width: w - 20, height: H + 20, fill: "#fde68a", opacity: 0, rx: 10 });
    const grid = []; for (let i = 0; i <= 8; i++) grid.push(k.add("line", { x1: x + 20, x2: x + w - 20, y1: top + (i * H) / 8, y2: top + (i * H) / 8, stroke: "#4b5563", "stroke-width": 2.5, opacity: 0 }));
    const bx = (i) => x + 40 + i * (bw + gap);
    const shade = vals.map(() => k.add("path", { d: "", fill: "#7f1d1d", opacity: 0 }));
    const bars = vals.map((v, i) => k.rect({ x: bx(i), width: bw, y: base, height: 0, fill: RED, stroke: INK, "stroke-width": 2 }));
    const star = k.add("path", { d: (() => { let d = ""; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 26 : 50; d += `${i ? "L" : "M"}${x + w - 70 + r * Math.cos(a)} ${top + 34 + r * Math.sin(a)}`; } return d + "Z"; })(), fill: "#facc15", stroke: "#b45309", "stroke-width": 2, opacity: 0 });
    const wow = k.text("WOW!", x + w - 70, top + 42, { anchor: "middle", size: 24, color: "#b45309" });
    const floor = k.stroke(`M${x + 20} ${base} H${x + w - 20}`);
    return (t) => {
      const p0 = prog(t, T[0], 1), on = (i) => prog(t, T[0] + 0.2, 0.6) * (1 - prog(t, T[i], 0.8));
      const d3 = on(1), gr = on(2), deco = on(3);
      floor.set(p0);
      grid.forEach((l) => l.setAttribute("opacity", gr));
      k.fade(bgd, deco * 0.7); k.fade(star, deco); k.fade(wow, deco);
      vals.forEach((v, i) => {
        const hh = v * H * p0, d = 18 * d3;
        k.bar(bars[i], base, hh);
        shade[i].setAttribute("d", hh > 0 ? `M${bx(i) + bw} ${base - hh} l${d} ${-d} v${hh} l${-d} ${d} Z M${bx(i)} ${base - hh} l${d} ${-d} h${bw} l${-d} ${d} Z` : "");
        shade[i].setAttribute("opacity", d3);
      });
    };
  },

  // Dual axes: two unrelated series, each with the scale the designer picked, look as if they move together.
  // phases: [show the two scales, "they agree"]
  dualAxes(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const lx = x + 70, rx = x + w - 70, top = y + 50, base = y + h - 60;
    const ax = k.stroke(`M${lx} ${top} V${base} H${rx} V${top}`);
    const pts = [0.15, 0.3, 0.26, 0.5, 0.58, 0.8];
    const path = (off) => pts.map((p, i) => `${i ? "L" : "M"}${lx + 20 + (i * (rx - lx - 40)) / 5} ${base - (p + off) * (base - top)}`).join(" ");
    const a = k.stroke(path(0), RED, 4), b = k.stroke(path(0.05), BLUE, 4);
    const la = k.text("ice cream sales", lx, top - 16, { size: 22, color: RED });
    const lb = k.text("rainfall", rx, top - 16, { anchor: "end", size: 22, color: BLUE });
    const ticks = [k.text("0", lx - 8, base + 7, { anchor: "end", size: 22, color: RED }), k.text("900", lx - 8, top + 7, { anchor: "end", size: 22, color: RED }),
      k.text("40.1", rx + 8, base + 7, { size: 22, color: BLUE }), k.text("40.3", rx + 8, top + 7, { size: 22, color: BLUE })];
    const note = k.text("each scale was picked to line up", x + w / 2, y + h - 14, { anchor: "middle", size: 24 });
    return (t) => {
      ax.set(prog(t, T[0], 0.7)); a.set(prog(t, T[0] + 0.4, 1.2)); b.set(prog(t, T[0] + 1.2, 1.2));
      k.fade(la, prog(t, T[0] + 0.4, 0.5)); k.fade(lb, prog(t, T[0] + 1.2, 0.5));
      ticks.forEach((e, i) => k.fade(e, prog(t, T[1] + (i >> 1) * 0.5, 0.5)));
      k.fade(note, prog(t, T[2], 0.6));
    };
  },

  // Commonly used charts: the question picks the chart, one row at a time.  phases: [change over time, part of a whole]
  chooseChart(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, rowH = h / 3, fw = 150;
    const rows = [["compare categories:  ", "bars"], ["change over time:  ", "a line"], ["part of a whole:  ", "sorted bars of the shares"]];
    const tiles = rows.map((lab, i) => {
      const ty = y + i * rowH + 8, bx = x, bh = rowH - 22, parts = [];
      parts.push(k.rect({ x: bx, y: ty, width: fw, height: bh, fill: "#fff", stroke: INK, "stroke-width": 2, opacity: 0 }));
      if (i === 0) [0.45, 0.9, 0.65].forEach((v, j) => parts.push(k.rect({ x: bx + 22 + j * 40, y: ty + bh - 10 - v * (bh - 24), width: 28, height: v * (bh - 24), fill: RED, opacity: 0 })));
      if (i === 1) parts.push(k.add("path", { d: `M${bx + 14} ${ty + bh - 18} L${bx + 48} ${ty + bh - 40} L${bx + 82} ${ty + bh - 32} L${bx + 134} ${ty + 16}`, fill: "none", stroke: RED, "stroke-width": 4.5, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }));
      if (i === 2) [0.85, 0.55, 0.3].forEach((v, j) => parts.push(k.rect({ x: bx + 14, y: ty + 14 + j * ((bh - 20) / 3), width: v * (fw - 28), height: (bh - 20) / 3 - 8, fill: RED, opacity: 0 })));
      parts.push(k.text([[lab[0], INK], [lab[1], RED]], bx + fw + 26, ty + bh / 2 + 10, { size: 30 }));
      return parts;
    });
    return (t) => tiles.forEach((parts, i) => parts.forEach((e) => k.fade(e, prog(t, T[i], 0.5))));
  },

  // Pie on Trial: four close values as a pie, then the same values as sorted bars.  phases: [the bars]
  pieVsBars(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const vals = [27, 25, 24, 24], cols = [RED, BLUE, "#d97706", "#059669"], names = ["A", "B", "C", "D"];
    const cx = x + w * 0.24, cy = y + h / 2 - 16, r = Math.min(w * 0.2, h * 0.36);
    const order = [2, 0, 3, 1]; // the pie is not sorted, as in the game
    let a0 = -Math.PI / 2;
    const slices = order.map((j) => { const a1 = a0 + (vals[j] / 100) * 2 * Math.PI, s = { a0, a1, j, e: k.add("path", { d: "", fill: cols[j], stroke: "#fff", "stroke-width": 2 }) }; a0 = a1; return s; });
    const arc = (s, p) => { const a1 = s.a0 + (s.a1 - s.a0) * p, large = a1 - s.a0 > Math.PI ? 1 : 0;
      return p <= 0 ? "" : `M${cx} ${cy} L${cx + r * Math.cos(s.a0)} ${cy + r * Math.sin(s.a0)} A${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`; };
    const plabs = slices.map((s) => { const m = (s.a0 + s.a1) / 2; return k.text(names[s.j], cx + r * 0.62 * Math.cos(m), cy + r * 0.62 * Math.sin(m) + 9, { anchor: "middle", size: 28, color: "#fff" }); });
    const q = k.text("which slice is largest?", cx, y + h - 8, { anchor: "middle" });
    const bx = x + w * 0.56, bw = w * 0.36, rowH = (h - 70) / 4;
    const bars = vals.map((v, i) => ({ r: k.rect({ x: bx, y: y + 20 + i * rowH, width: 0, height: rowH - 16, fill: cols[i] }),
      l: k.text(names[i], bx - 10, y + 20 + i * rowH + rowH / 2 + 2, { anchor: "end", size: 26 }), n: k.text(String(v) + "%", bx, y + 20 + i * rowH + rowH / 2 + 2, { size: 22 }) }));
    const win = k.text("as bars: A, at a glance", bx + bw / 2, y + h - 8, { anchor: "middle", color: BLUE });
    return (t) => {
      slices.forEach((s, i) => { s.e.setAttribute("d", arc(s, prog(t, T[0] + i * 0.25, 0.6))); k.fade(plabs[i], prog(t, T[0] + 1.2, 0.4)); });
      k.fade(q, prog(t, T[0] + 1.4, 0.5));
      bars.forEach((b, i) => { const p = prog(t, T[1] + i * 0.2, 0.7), ww = (vals[i] / 27) * bw * p;
        b.r.setAttribute("width", ww); k.fade(b.l, p); b.n.setAttribute("x", bx + ww + 8); k.fade(b.n, p); });
      k.fade(win, prog(t, T[1] + 1.4, 0.5));
    };
  },

  // Stacked bars: only the bottom segment sits on the baseline; the middle (pink) one floats.  phases: [the middle floats]
  stacked(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const base = y + h - 44, top = y + 76, H = base - top, bw = 84, gap = (w - 3 * bw) / 4, scale = H / 92;
    const colX = (i) => x + gap + i * (bw + gap);
    const floor = k.stroke(`M${x + 10} ${base} H${x + w - 10}`);
    const segs = STACK.map((col, i) => col.map((v, j) => k.rect({ x: colX(i), width: bw, y: base, height: 0, fill: STACK_FILLS[j], stroke: INK, "stroke-width": 2 })));
    const years = STACK.map((c, i) => k.text(String(2023 + i), colX(i) + bw / 2, base + 28, { anchor: "middle", size: 22 }));
    const ticks = STACK.map(() => k.add("line", { x1: 0, x2: 0, y1: 0, y2: 0, stroke: RED, "stroke-width": 2.5, "stroke-dasharray": "6 6", opacity: 0 }));
    const legend = STACK_CATS.map((c, j) => [k.rect({ x: x + 70 + j * 110, y: y + 40, width: 16, height: 16, fill: STACK_FILLS[j], stroke: INK, "stroke-width": 1.5, opacity: 0 }), k.text(c, x + 92 + j * 110, y + 55, { size: 20 })]);
    const note = k.text("where does the pink part start?", x + w / 2, y + 22, { anchor: "middle", color: RED });
    return (t) => {
      floor.set(prog(t, T[0], 0.5));
      const grow = prog(t, T[0] + 0.3, 1.2), hi = prog(t, T[1], 0.6);
      legend.forEach((l) => l.forEach((e) => k.fade(e, grow)));
      STACK.forEach((col, i) => {
        let acc = 0;
        col.forEach((v, j) => {
          const hh = v * scale * grow; k.bar(segs[i][j], base - acc, hh); acc += hh;
          if (j === 1) { segs[i][j].setAttribute("stroke", hi > 0.5 ? RED : INK); segs[i][j].setAttribute("stroke-width", 2 + hi * 1.5); }
        });
        const yb = base - col[0] * scale * grow;
        ticks[i].setAttribute("x1", x + 10); ticks[i].setAttribute("x2", colX(i)); ticks[i].setAttribute("y1", yb); ticks[i].setAttribute("y2", yb);
        ticks[i].setAttribute("opacity", hi);
        k.fade(years[i], grow);
      });
      k.fade(note, hi);
    };
  },

  // Instead of stacking (same data): 1. two charts side by side, one for the total and one for the categories as
  // side-by-side bars; 2. a paneled bar chart, one panel per category. Each chart is framed and titled.
  // phases: [the total chart, the category chart, the paneled chart]
  unstacked(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const half = w / 2, base = y + h - 46, ftop = y + 50, fbot = base + 34;
    const frame = (fx, fw) => k.rect({ x: fx, y: ftop, width: fw, height: fbot - ftop, fill: "none", stroke: "#9ca3af", "stroke-width": 1.5, rx: 6, opacity: 0 });
    const bar = (fill, j) => k.rect({ x: 0, width: 0, y: base, height: 0, fill, stroke: j === 1 ? RED : INK, "stroke-width": j === 1 ? 3 : 2 });
    const yr = (s, cx, size = 17) => k.text(s, cx, base + 22, { anchor: "middle", size });
    const floor = (x0, x1) => k.stroke(`M${x0} ${base} H${x1}`, INK, 2);
    // 1. two charts side by side
    const lab1 = k.text("1. two charts side by side", x + half / 2 - 6, y + 22, { anchor: "middle", size: 26, color: BLUE });
    const tX = x, tW = 150, cX = x + 162, cW = half - 180;
    const tFrame = frame(tX, tW), cFrame = frame(cX, cW);
    const tTitle = k.text("total", tX + tW / 2, ftop + 26, { anchor: "middle", size: 22 }), cTitle = k.text("by category", cX + cW / 2, ftop + 26, { anchor: "middle", size: 22 });
    const tTop = ftop + 44, tScale = (base - tTop) / 95, cTop = ftop + 64, cScale = (base - cTop) / 55;
    const tFloor = floor(tX + 10, tX + tW - 10), cFloor = floor(cX + 10, cX + cW - 10);
    const tBars = STACK.map(() => bar("#6b7280", 0)), tYears = STACK.map((c, i) => yr(String(2023 + i), tX + 34 + i * 41));
    const gW = 3 * 18 + 4, gGap = (cW - 3 * gW) / 4;
    const cBars = STACK.map((col) => col.map((v, j) => bar(STACK_FILLS[j], j))), cYears = STACK.map((c, i) => yr(String(2023 + i), cX + gGap + i * (gW + gGap) + gW / 2));
    const legend = STACK_CATS.map((c, j) => [k.rect({ x: cX + 16 + j * 74, y: ftop + 36, width: 13, height: 13, fill: STACK_FILLS[j], stroke: j === 1 ? RED : INK, "stroke-width": j === 1 ? 2.5 : 1.5, opacity: 0 }), k.text(c, cX + 33 + j * 74, ftop + 48, { size: 17 })]);
    // 2. a paneled bar chart
    const lab2 = k.text("2. a paneled bar chart", x + half + half / 2, y + 22, { anchor: "middle", size: 26, color: BLUE });
    const pW = (half - 30) / 3, pX = (j) => x + half + 14 + j * (pW + 8), pTop = ftop + 44, pScale = (base - pTop) / 55;
    const divider = k.add("line", { x1: x + half, x2: x + half, y1: y + 6, y2: fbot, stroke: "#d1d5db", "stroke-width": 2, "stroke-dasharray": "5 6", opacity: 0 });
    const pFrames = STACK_CATS.map((c, j) => frame(pX(j), pW)), pTitles = STACK_CATS.map((c, j) => k.text(c, pX(j) + pW / 2, ftop + 26, { anchor: "middle", size: 22, color: j === 1 ? RED : INK }));
    const pFloors = STACK_CATS.map((c, j) => floor(pX(j) + 8, pX(j) + pW - 8));
    const pBars = STACK_CATS.map((c, j) => STACK.map(() => bar(STACK_FILLS[j], j))), pYears = STACK_CATS.map((c, j) => STACK.map((col, i) => yr("'" + (23 + i), pX(j) + 14 + i * ((pW - 28) / 3) + (pW - 28) / 6, 16)));
    return (t) => {
      const f1 = prog(t, T[0], 0.6), g1 = prog(t, T[1], 1), g2 = prog(t, T[2], 1), f3 = prog(t, T[3], 0.6), g3 = prog(t, T[3] + 0.4, 1);
      k.fade(lab1, f1); k.fade(tFrame, f1); k.fade(tTitle, f1); tFloor.set(f1);
      k.fade(cFrame, f1); k.fade(cTitle, f1); cFloor.set(f1);
      STACK.forEach((col, i) => {
        const tb = tBars[i]; tb.setAttribute("x", tX + 20 + i * 41); tb.setAttribute("width", 28); k.bar(tb, base, col.reduce((a, b) => a + b, 0) * tScale * g1); k.fade(tYears[i], g1);
        col.forEach((v, j) => { const b = cBars[i][j]; b.setAttribute("x", cX + gGap + i * (gW + gGap) + j * 20); b.setAttribute("width", 18); k.bar(b, base, v * cScale * g2); });
        k.fade(cYears[i], g2);
      });
      legend.forEach((l) => l.forEach((e) => k.fade(e, g2)));
      k.fade(lab2, f3); k.fade(divider, f3);
      STACK_CATS.forEach((c, j) => {
        k.fade(pFrames[j], f3); k.fade(pTitles[j], f3); pFloors[j].set(f3);
        STACK.forEach((col, i) => { const b = pBars[j][i], sp = (pW - 28) / 3; b.setAttribute("x", pX(j) + 14 + i * sp + (sp - 26) / 2); b.setAttribute("width", 26); k.bar(b, base, col[j] * pScale * g3); k.fade(pYears[j][i], g3); });
      });
    };
  },

  // A bar for an average: the same two bars hide two very different sets of points. The two fixes: the points with a
  // line at each average, or the points on top of a box plot.  phases: [the points and the averages, the box plots]
  meanBar(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const base = y + h - 44, top = y + 60, H = base - top, bw = 120, cx = [x + w * 0.28, x + w * 0.72];
    const tight = [48, 52, 50, 46, 54, 49, 51, 50], wide = [12, 88, 30, 72, 95, 20, 60, 23]; // both average 50
    const Y = (v) => base - (v / 100) * H;
    const q = (vals, p) => { const s = [...vals].sort((a, b) => a - b), r = (s.length - 1) * p, lo = Math.floor(r); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (r - lo); };
    const floor = k.stroke(`M${x + 10} ${base} H${x + w - 10}`);
    const bars = cx.map((c) => k.rect({ x: c - bw / 2, width: bw, y: base, height: 0, fill: PALE, stroke: INK, "stroke-width": 2 }));
    // box plots (drawn under the points): whiskers, the box from the 25th to the 75th percentile, the median
    const boxes = [tight, wide].map((vals, gi) => {
      const [lo, q1, md, q3, hi] = [0, 0.25, 0.5, 0.75, 1].map((p) => q(vals, p)), c = cx[gi];
      // faded in whole (a drawn-in stroke shows loose pieces of the box while it draws)
      return k.add("path", { d: `M${c} ${Y(lo)} V${Y(q1)} M${c} ${Y(q3)} V${Y(hi)} M${c - 18} ${Y(lo)} H${c + 18} M${c - 18} ${Y(hi)} H${c + 18} M${c - 50} ${Y(q1)} H${c + 50} V${Y(q3)} H${c - 50} Z M${c - 50} ${Y(md)} H${c + 50}`,
        fill: "none", stroke: "#4b5563", "stroke-width": 2.5, "stroke-linejoin": "round", opacity: 0 });
    });
    const dots = [tight, wide].map((vals, gi) => vals.map((v, i) => k.add("circle", { cx: cx[gi] - 42 + (i % 4) * 28, cy: Y(v), r: 7, fill: gi ? BLUE : RED, stroke: "#fff", "stroke-width": 1.5, opacity: 0 })));
    const means = cx.map((c) => k.stroke(`M${c - 50} ${Y(50)} H${c + 50}`, INK, 3.5));
    const meanLab = [k.text("average", cx[1] + 56, Y(50) + 6, { size: 20 })];
    const names = ["group A", "group B"].map((s, i) => k.text(s, cx[i], base + 30, { anchor: "middle", size: 22 }));
    const notes = [k.text("same average, same bar", x + w / 2, y + 24, { anchor: "middle", color: RED }),
      k.text("1. the points + a line at the average", x + w / 2, y + 24, { anchor: "middle", size: 22, color: BLUE }),
      k.text("2. the points on a box plot", x + w / 2, y + 24, { anchor: "middle", size: 22, color: BLUE })];
    return (t) => {
      floor.set(prog(t, T[0], 0.5));
      // the two fixes never share the board: the average lines are gone before the box plots start
      const g = prog(t, T[0] + 0.3, 1), pts = prog(t, T[1], 1), out = prog(t, T[2], 0.4), bx = prog(t, T[2] + 0.4, 0.6);
      bars.forEach((b) => { k.bar(b, base, 0.5 * H * g); b.setAttribute("opacity", 1 - pts); });
      dots.forEach((ds) => ds.forEach((d, i) => d.setAttribute("opacity", prog(t, T[1] + i * 0.1, 0.4))));
      means.forEach((m) => { m.set(prog(t, T[1] + 0.9, 0.6)); m.e.setAttribute("opacity", 1 - out); });
      k.fade(meanLab[0], prog(t, T[1] + 1.2, 0.4) * (1 - out));
      boxes.forEach((b) => k.fade(b, bx));
      names.forEach((n) => k.fade(n, g));
      k.fade(notes[0], prog(t, T[0] + 1, 0.5) * (1 - pts)); k.fade(notes[1], pts * (1 - out)); k.fade(notes[2], bx);
    };
  },

  // ---- Data types and encodings -----------------------------------------------------------------------------------
  // Three kinds of variables, one row each.  phases: [ordinal, quantitative]
  varTypes(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, rh = h / 3;
    // nominal: names whose order means nothing (two of them trade places)
    const slot = (i) => x + 8 + i * 140;
    const tags = ["Finance", "Marketing", "Accountancy"].map((n) => [k.rect({ x: 0, y: y + 24, width: 128, height: 46, rx: 10, fill: "#fff", stroke: INK, "stroke-width": 2, opacity: 0 }), k.text(n, 0, y + 54, { anchor: "middle", size: 21 })]);
    const nomCap = k.text("no order", x + w / 2, y + 122, { anchor: "middle", size: 21, color: "#6b7280" });
    // ordinal: a podium
    const pb = y + rh + 118, pod = [["2nd", 64], ["1st", 96], ["3rd", 42]];
    const podium = pod.map(([lab, hh], i) => ({ hh, r: k.rect({ x: x + 96 + i * 82, width: 78, y: pb, height: 0, fill: i === 1 ? PALE : GRAY, stroke: INK, "stroke-width": 2 }), t: k.text(lab, x + 135 + i * 82, pb, { anchor: "middle", size: 22 }) }));
    // quantitative: points per game on a number line; the difference means something
    const ly = y + 2 * rh + 70, X = (v) => x + 40 + (v / 30) * 360;
    const axis = k.stroke(`M${X(0)} ${ly} H${X(30)}`);
    const ticks = [0, 10, 20, 30].map((v) => k.line(X(v), ly - 6, X(v), ly + 6, { opacity: 0 }));
    const ends = [k.text("0", X(0), ly + 26, { anchor: "middle", size: 18, color: "#6b7280" }), k.text("30", X(30), ly + 26, { anchor: "middle", size: 18, color: "#6b7280" })];
    const pts = [12, 27].map((v) => [k.circle(X(v), ly, 8, { fill: RED, opacity: 0 }), k.text(String(v), X(v), ly + 28, { anchor: "middle", size: 22, color: RED })]);
    const brace = k.stroke(`M${X(12)} ${ly - 18} V${ly - 28} H${X(27)} V${ly - 18}`, BLUE, 2.5);
    const diff = k.text("27 - 12 = 15 points per game", (X(12) + X(27)) / 2, ly - 38, { anchor: "middle", size: 21, color: BLUE });
    return (t) => {
      const sw = prog(t, T[0] + 1.8, 0.9), order = [lerp(0, 2, sw), 1, lerp(2, 0, sw)];
      // the two tags arc past each other (one over the middle tag, one under it) instead of sliding through it
      const lift = [-1, 0, 1].map((s) => s * 52 * Math.sin(Math.PI * sw));
      tags.forEach(([r, tx], i) => { const p = prog(t, T[0] + i * 0.2, 0.4); r.setAttribute("x", slot(order[i])); tx.setAttribute("x", slot(order[i]) + 64);
        r.setAttribute("y", y + 24 + lift[i]); tx.setAttribute("y", y + 54 + lift[i]); k.fade(r, p); k.fade(tx, p); });
      k.fade(nomCap, prog(t, T[0] + 2.8, 0.5));   // after the swap, so the lower tag never covers it
      podium.forEach((pd, i) => { const p = prog(t, T[1] + i * 0.15, 0.6); k.bar(pd.r, pb, pd.hh * p); pd.t.setAttribute("y", pb - pd.hh * p - 8); k.fade(pd.t, p); });
      axis.set(prog(t, T[2], 0.6)); k.fadeAll([...ticks, ...ends], prog(t, T[2] + 0.3, 0.4));
      pts.forEach((pp, i) => k.fadeAll(pp, prog(t, T[2] + 0.6 + i * 0.3, 0.4)));
      brace.set(prog(t, T[2] + 1.3, 0.6)); k.fade(diff, prog(t, T[2] + 1.6, 0.5));
    };
  },

  // The same two numbers in each channel, best read first; then hue and shape, which carry categories.
  // phases: [length, angle and area, color intensity, hue and shape]
  channels(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, rh = h / 5, a = 0.45, b = 0.8, gx = x + 150, gw = 250;
    const labels = ["position", "length", "angle, area", "color", "hue, shape"].map((s, i) => k.text(s, x + 4, y + i * rh + rh / 2 + 8, { size: 23, color: i === 4 ? BLUE : INK }));
    const rows = [[], [], [], [], []];
    { const cy = y + rh / 2 + 4;
      rows[0].push(k.line(gx, cy, gx + gw, cy, { opacity: 0 }), k.line(gx, cy - 7, gx, cy + 7, { opacity: 0 }), k.line(gx + gw, cy - 7, gx + gw, cy + 7, { opacity: 0 }),
        k.circle(gx + a * gw, cy, 8, { fill: RED, opacity: 0 }), k.circle(gx + b * gw, cy, 8, { fill: RED, opacity: 0 })); }
    { const cy = y + 1.5 * rh; [a, b].forEach((v, i) => rows[1].push(k.rect({ x: gx, y: cy - 17 + i * 20, width: v * gw, height: 14, fill: RED, opacity: 0 }))); }
    { const cy = y + 2.5 * rh + 14, r = 30;
      [a, b].forEach((v, i) => { const cx = gx + 30 + i * 72, an = v * Math.PI;
        rows[2].push(k.add("path", { d: `M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx + r * Math.sin(an)} ${cy - r * Math.cos(an)} Z`, fill: RED, opacity: 0 })); });
      [a, b].forEach((v, i) => rows[2].push(k.circle(gx + 186 + i * 52, cy - 12, 24 * Math.sqrt(v), { fill: RED, opacity: 0 }))); }
    { const cy = y + 3.5 * rh; [a, b].forEach((v, i) => rows[3].push(k.rect({ x: gx + i * 60, y: cy - 20, width: 40, height: 40, fill: mix("#ffffff", RED, v), stroke: INK, "stroke-width": 1, opacity: 0 }))); }
    { const cy = y + 4.5 * rh;
      rows[4].push(k.circle(gx + 20, cy, 15, { fill: BLUE, opacity: 0 }), k.add("path", { d: `M${gx + 80} ${cy - 16} L${gx + 97} ${cy + 14} L${gx + 63} ${cy + 14} Z`, fill: "#d97706", opacity: 0 }),
        k.rect({ x: gx + 125, y: cy - 14, width: 28, height: 28, fill: "#059669", opacity: 0 }), k.text("categories", gx + 172, cy + 7, { size: 21, color: BLUE })); }
    return (t) => rows.forEach((r, i) => { const p = prog(t, T[i], 0.5); k.fade(labels[i], p); k.fadeAll(r, p); });
  },

  // The grammar of graphics, built one part at a time; then where to read each variable.
  // phases: [aesthetics, geom, scales, facets, coordinates, the axes, the legends]
  grammar(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const tx = x + 4, ty = y + 6, cw = 28, rr = 15;
    const table = [k.rect({ x: tx, y: ty, width: 4 * cw, height: 4 * rr, fill: "#fff", stroke: INK, "stroke-width": 1.5, opacity: 0 }), k.rect({ x: tx, y: ty, width: 4 * cw, height: rr, fill: GRAY, opacity: 0 })];
    for (let i = 1; i < 4; i++) table.push(k.line(tx + i * cw, ty, tx + i * cw, ty + 4 * rr, { "stroke-width": 1, opacity: 0 }), k.line(tx, ty + i * rr, tx + 4 * cw, ty + i * rr, { "stroke-width": 1, opacity: 0 }));
    table.push(k.text("data", tx + 2 * cw, ty + 4 * rr + 20, { anchor: "middle", size: 20 }));
    const maps = [["hours", "x"], ["GPA", "y"], ["year", "color"], ["credits", "size"]].map(([v, c], i) => k.text([[v + " → ", INK], [c, RED]], x + 140 + (i % 2) * 140, y + 24 + Math.floor(i / 2) * 30, { size: 21 }));
    const px0 = x + 60, px1 = x + 322, py0 = y + 112, py1 = y + h - 58, pw = (px1 - px0 - 12) / 2;
    const P = [[.08, .22, 0, .3], [.15, .3, 1, .6], [.22, .4, 0, .9], [.3, .33, 1, .4], [.36, .5, 0, .5], [.42, .45, 1, .8], [.5, .58, 0, .2], [.56, .54, 1, .7],
      [.62, .66, 0, .6], [.68, .6, 1, .3], [.74, .74, 0, .9], [.8, .7, 1, .5], [.86, .82, 0, .4], [.92, .86, 1, .7]];
    const Yv = (v) => py1 - 12 - v * (py1 - py0 - 24);
    const frames = [0, 1].map((g) => k.rect({ x: px0 + g * (pw + 12), y: py0 - 22, width: pw, height: py1 - py0 + 22, fill: "none", stroke: "#9ca3af", "stroke-width": 1.5, opacity: 0 }));
    const strips = [0, 1].map((g) => k.text(String(2025 + g), px0 + g * (pw + 12) + pw / 2, py0 - 5, { anchor: "middle", size: 18 }));
    const axX = k.line(px0, py1, px1, py1, { opacity: 0 }), axY = k.line(px0, py0, px0, py1, { opacity: 0 });
    const dots = P.map(([, yv, g, s]) => k.circle(0, Yv(yv), 5 + 6 * s, { fill: g ? BLUE : RED, "fill-opacity": 0.85, stroke: "#fff", "stroke-width": 1, opacity: 0 }));
    const scale = [k.text("0", px0, py1 + 22, { anchor: "middle", size: 17 }), k.text("20", px1, py1 + 22, { anchor: "middle", size: 17 }), k.text("2", px0 - 8, py1 + 5, { anchor: "end", size: 17 }), k.text("4", px0 - 8, py0 + 5, { anchor: "end", size: 17 })];
    const xT = k.text("hours", (px0 + px1) / 2, py1 + 40, { anchor: "middle", size: 21 });
    const yT = k.text("GPA", px0 - 26, (py0 + py1) / 2, { anchor: "middle", size: 21 }); yT.setAttribute("transform", `rotate(-90 ${px0 - 26} ${(py0 + py1) / 2})`);
    const lx = x + 338, legend = [k.text("year", lx, py0 + 4, { size: 19 }), k.circle(lx + 8, py0 + 24, 6, { fill: RED, opacity: 0 }), k.text("2025", lx + 20, py0 + 30, { size: 17 }),
      k.circle(lx + 8, py0 + 46, 6, { fill: BLUE, opacity: 0 }), k.text("2026", lx + 20, py0 + 52, { size: 17 }), k.text("credits", lx, py0 + 90, { size: 19 }),
      k.circle(lx + 8, py0 + 110, 5, { fill: "none", stroke: INK, opacity: 0 }), k.circle(lx + 34, py0 + 110, 10, { fill: "none", stroke: INK, opacity: 0 })];
    const boxAxes = [k.rect({ x: (px0 + px1) / 2 - 36, y: py1 + 20, width: 72, height: 28, rx: 8, fill: "none", stroke: RED, "stroke-width": 3, opacity: 0 }),
      k.rect({ x: px0 - 42, y: (py0 + py1) / 2 - 30, width: 30, height: 60, rx: 8, fill: "none", stroke: RED, "stroke-width": 3, opacity: 0 })];
    const boxLeg = k.rect({ x: lx - 8, y: py0 - 16, width: 92, height: 140, rx: 10, fill: "none", stroke: RED, "stroke-width": 3, opacity: 0 });
    return (t) => {
      k.fadeAll(table, prog(t, T[0], 0.5));
      maps.forEach((m, i) => k.fade(m, prog(t, T[1] + i * 0.25, 0.4)));
      const gm = prog(t, T[2], 0.5), sc = prog(t, T[3], 0.5), fc = prog(t, T[4], 1.2);
      const pulse = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - T[5]) / 1.0)));
      [axX, axY].forEach((l) => { k.fade(l, gm); l.setAttribute("stroke-width", 2 + 4 * pulse); l.setAttribute("stroke", pulse > 0.05 ? RED : INK); });
      dots.forEach((d, i) => { const [xv, , g] = P[i];
        d.setAttribute("cx", lerp(px0 + 12 + xv * (px1 - px0 - 24), px0 + g * (pw + 12) + 8 + xv * (pw - 16), fc)); k.fade(d, prog(t, T[2] + i * 0.06, 0.3)); });
      k.fadeAll([...scale, xT, yT, ...legend], sc);
      k.fadeAll([...frames, ...strips], fc);
      k.fadeAll(boxAxes, prog(t, T[6], 0.4)); k.fade(boxLeg, prog(t, T[7], 0.4));
    };
  },

  // ---- Color --------------------------------------------------------------------------------------------------------
  // The three kinds of scheme, as swatches.  phases: [diverging, qualitative]
  schemes(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, rh = h / 3, sw = 50;
    const sets = [["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb", "#1e3a8a"], ["#5e3c99", "#998ec3", "#d8daeb", "#f7f7f7", "#fee0b6", "#f1a340", "#b35806"],
      ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#CC79A7"]];
    const caps = [[["low", 0], ["high", 6]], [["below", 0], ["the middle", 3], ["above", 6]], [["categories, no order", 2]]];
    const rows = sets.map((cols, r) => {
      const x0 = x + 20 + ((7 - cols.length) * (sw + 6)) / 2, yy = y + r * rh + 30;
      return { sw: cols.map((c, i) => k.rect({ x: x0 + i * (sw + 6), y: yy, width: sw, height: 50, fill: c, stroke: "#9ca3af", "stroke-width": 1, rx: 4, opacity: 0 })),
        cap: caps[r].map(([s, i]) => k.text(s, x0 + i * (sw + 6) + sw / 2, yy + 80, { anchor: "middle", size: 21, color: "#4b5563" })),
        mark: r === 1 ? k.line(x0 + 3 * (sw + 6) + sw / 2, yy - 8, x0 + 3 * (sw + 6) + sw / 2, yy + 58, { stroke: INK, "stroke-width": 2, "stroke-dasharray": "4 4", opacity: 0 }) : null };
    });
    return (t) => rows.forEach((r, i) => {
      r.sw.forEach((s, j) => k.fade(s, prog(t, T[i] + j * 0.12, 0.3)));
      k.fadeAll(r.cap, prog(t, T[i] + 0.9, 0.4)); if (r.mark) k.fade(r.mark, prog(t, T[i] + 0.9, 0.4));
    });
  },

  // Three mistakes: a rainbow on ordered values, a diverging scheme with no real middle, red next to green.
  // phases: [no real middle, red next to green, as 1 man in 12 sees it]
  colorMistakes(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, rh = h / 3;
    const rain = ["#e11d48", "#f59e0b", "#16a34a", "#2563eb", "#9333ea"];
    const r1 = rain.map((c, i) => [k.rect({ x: x + 60 + i * 64, y: y + 26, width: 58, height: 44, fill: c, opacity: 0 }), k.text(String(i + 1), x + 89 + i * 64, y + 96, { anchor: "middle", size: 21 })]);
    const q1 = k.text("which color means more?", x + w / 2, y + 126, { anchor: "middle", size: 21, color: RED });
    const div = ["#5e3c99", "#998ec3", "#d8daeb", "#f7f7f7", "#fee0b6", "#f1a340", "#b35806"];
    const y2 = y + rh + 22, r2 = div.map((c, i) => k.rect({ x: x + 50 + i * 47, y: y2, width: 47, height: 40, fill: c, opacity: 0 }));
    const l2 = [["0 min", 0], ["30", 3.5], ["60 min", 7]].map(([s, i]) => k.text(s, x + 50 + i * 47, y2 + 64, { anchor: "middle", size: 19, color: "#4b5563" }));
    const q2 = k.text("what is special about 30?", x + w / 2, y2 + 98, { anchor: "middle", size: 21, color: RED });
    const y3 = y + 2 * rh + 20, spots = [[.05, .3, 0], [.16, .7, 1], [.27, .2, 1], [.38, .55, 0], [.49, .8, 1], [.6, .35, 0], [.71, .65, 1], [.82, .25, 0], [.93, .6, 1]];
    const dots = spots.map(([a, b]) => k.circle(x + 40 + a * 350, y3 + 10 + b * 70, 11, { opacity: 0 }));
    const q3 = k.text("red and green", x + w / 2, y3 + 114, { anchor: "middle", size: 21, color: RED });
    const q4 = k.text("as about 1 man in 12 sees them", x + w / 2, y3 + 114, { anchor: "middle", size: 21, color: BLUE });
    const SEEN = ["#8b7d2a", "#a08f3c"];   // an approximation of red and green for a reader with deuteranopia
    return (t) => {
      r1.forEach((pair, i) => k.fadeAll(pair, prog(t, T[0] + i * 0.12, 0.3))); k.fade(q1, prog(t, T[0] + 1, 0.4));
      r2.forEach((s, i) => k.fade(s, prog(t, T[1] + i * 0.08, 0.3))); k.fadeAll(l2, prog(t, T[1] + 0.6, 0.4)); k.fade(q2, prog(t, T[1] + 1, 0.4));
      const cv = prog(t, T[3], 1.2);
      dots.forEach((d, i) => { const g = spots[i][2]; d.setAttribute("fill", mix(g ? "#16a34a" : "#dc2626", SEEN[g], cv)); k.fade(d, prog(t, T[2] + i * 0.05, 0.3)); });
      k.fade(q3, prog(t, T[2] + 0.5, 0.4) * (1 - cv)); k.fade(q4, cv);
    };
  },

  // ---- Time -----------------------------------------------------------------------------------------------------
  // Many evenly spaced points: a line.
  lineMany(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, x0 = x + 20, x1 = x + w - 10, y0 = y + 40, y1 = y + h - 70, n = 24;
    const P = Array.from({ length: n }, (_, i) => [x0 + 12 + (i * (x1 - x0 - 24)) / (n - 1), y1 - (0.22 + i * 0.022 + 0.07 * Math.sin(i * 1.7)) * (y1 - y0)]);
    const axis = k.stroke(`M${x0} ${y0} V${y1} H${x1}`), line = k.stroke("M" + P.map((p) => p.join(" ")).join(" L"), RED, 3.5);
    const dots = P.map(([px, py]) => k.circle(px, py, 3.5, { fill: RED, opacity: 0 }));
    const cap = k.text("many, evenly spaced points: a line", x + w / 2, y + h - 26, { anchor: "middle", size: 22 });
    return (t) => { axis.set(prog(t, T[0], 0.5)); line.set(prog(t, T[0] + 0.4, 1.6)); dots.forEach((d, i) => k.fade(d, prog(t, T[0] + 0.4 + (i * 1.6) / n, 0.2))); k.fade(cap, prog(t, T[0] + 1.6, 0.5)); };
  },

  // A few separate periods: bars.
  barsFew(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, base = y + h - 96, H = base - y - 50, vals = [0.5, 0.68, 0.6, 0.86];
    const floor = k.stroke(`M${x + 20} ${base} H${x + w - 10}`);
    const bars = vals.map((v, i) => k.rect({ x: x + 50 + i * 92, width: 64, y: base, height: 0, fill: RED, stroke: INK, "stroke-width": 2 }));
    const labs = vals.map((v, i) => k.text(String(2023 + i), x + 82 + i * 92, base + 26, { anchor: "middle", size: 20 }));
    const cap = k.text("a few periods, one by one: bars", x + w / 2, y + h - 26, { anchor: "middle", size: 22 });
    return (t) => { floor.set(prog(t, T[0], 0.4)); bars.forEach((b, i) => { const p = prog(t, T[0] + 0.2 + i * 0.15, 0.6); k.bar(b, base, vals[i] * H * p); k.fade(labs[i], p); }); k.fade(cap, prog(t, T[0] + 1.2, 0.5)); };
  },

  // Two time points: the line between them was never measured.  phases: [never measured]
  twoPoints(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, x0 = x + 40, x1 = x + w - 50, y0 = y + 40, y1 = y + h - 70;
    const a = [x0 + 20, y1 - 0.3 * (y1 - y0)], b = [x1 - 10, y1 - 0.72 * (y1 - y0)];
    const axis = k.stroke(`M${x0} ${y0} V${y1} H${x1 + 10}`), seg = k.stroke(`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`, RED, 3.5);
    const ends = [a, b].map(([px, py], i) => [k.circle(px, py, 8, { fill: RED, opacity: 0 }), k.text(String(2020 + 5 * i), px, y1 + 26, { anchor: "middle", size: 20 })]);
    const alt = [[0.15, 0.95, 0.2], [0.55, 0.05, 0.6], [0.9, 0.6, 0.05]].map((ws) => {
      const pts = ws.map((v, i) => [lerp(a[0], b[0], (i + 1) / 4), y1 - v * (y1 - y0)]);
      return k.add("path", { d: `M${a[0]} ${a[1]} ` + pts.map((p) => "L" + p.join(" ")).join(" ") + ` L${b[0]} ${b[1]}`, fill: "none", stroke: "#9ca3af", "stroke-width": 2, "stroke-dasharray": "6 6", opacity: 0 });
    });
    const q = k.text("?", (a[0] + b[0]) / 2, y0 + 30, { anchor: "middle", size: 40, color: "#6b7280" });
    const cap = k.text("the straight path was never measured", x + w / 2, y + h - 26, { anchor: "middle", size: 22, color: RED });
    return (t) => { axis.set(prog(t, T[0], 0.4)); ends.forEach((e, i) => k.fadeAll(e, prog(t, T[0] + 0.3 + i * 0.3, 0.3))); seg.set(prog(t, T[0] + 1, 0.8));
      const p = prog(t, T[1], 0.8); alt.forEach((e) => k.fade(e, p)); k.fade(q, p); k.fade(cap, p); };
  },

  // Skipped years drawn the same distance apart bend every slope; at the true spacing, compare the change per year.
  // phases: [every slope is bent, compare the change per year]
  unevenYears(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, x0 = x + 30, x1 = x + w - 30, y0 = y + 50, y1 = y + h - 90;
    const yrs = [2000, 2010, 2020, 2022, 2024], vals = [50, 60, 70, 76, 82], Y = (v) => y1 - ((v - 45) / 40) * (y1 - y0);
    const eqX = (i) => x0 + (i / 4) * (x1 - x0), trueX = (i) => x0 + ((yrs[i] - 2000) / 24) * (x1 - x0);
    const axis = k.stroke(`M${x0 - 10} ${y0 - 10} V${y1} H${x1 + 10}`);
    const line = k.stroke("", RED, 3.5), dots = yrs.map(() => k.circle(0, 0, 6, { fill: RED, opacity: 0 })), labs = yrs.map((yr) => k.text(String(yr), 0, y1 + 26, { anchor: "middle", size: 19 }));
    const gaps = ["10 yrs", "10 yrs", "2", "2"].map((s) => k.text(s, 0, y1 + 52, { anchor: "middle", size: 18, color: RED }));
    const rates = [["+1 a year", 0, 2], ["+3 a year", 2, 4]].map(([s, i, j]) => ({ i, j, e: k.text(s, 0, 0, { anchor: "middle", size: 21, color: BLUE }) }));
    const cap = k.text("drawn evenly: growth looks like it slowed", x + w / 2, y + h - 14, { anchor: "middle", size: 21, color: RED });
    const cap2 = k.text("true spacing: per year, it sped up", x + w / 2, y + h - 14, { anchor: "middle", size: 21, color: BLUE });
    return (t) => {
      axis.set(prog(t, T[0], 0.4));
      const m = prog(t, T[2], 1.3), X = (i) => lerp(eqX(i), trueX(i), m);
      line.e.setAttribute("d", "M" + yrs.map((_, i) => `${X(i)} ${Y(vals[i])}`).join(" L")); line.set(prog(t, T[0] + 0.3, 1.2));
      dots.forEach((d, i) => { d.setAttribute("cx", X(i)); d.setAttribute("cy", Y(vals[i])); k.fade(d, prog(t, T[0] + 0.3 + i * 0.25, 0.3)); });
      // at the true spacing 2020, 2022 and 2024 sit close together, so 2022's label steps aside
      labs.forEach((l, i) => { l.setAttribute("x", X(i)); k.fade(l, prog(t, T[0] + 0.3, 0.4) * (i === 3 ? 1 - m : 1)); });
      const g = prog(t, T[1], 0.4) * (1 - m);
      gaps.forEach((e, i) => { e.setAttribute("x", (X(i) + X(i + 1)) / 2); k.fade(e, g); });
      k.fade(cap, g);
      // "+1 a year" above the long flat stretch; "+3 a year" to the left of the steep end, clear of the line
      rates[0].e.setAttribute("x", (X(0) + X(2)) / 2); rates[0].e.setAttribute("y", (Y(vals[0]) + Y(vals[2])) / 2 - 22);
      rates[1].e.setAttribute("text-anchor", "end"); rates[1].e.setAttribute("x", X(3) - 12); rates[1].e.setAttribute("y", Y(vals[3]) - 14);
      rates.forEach((r) => k.fade(r.e, prog(t, T[2] + 1.1, 0.5)));
      k.fade(cap2, prog(t, T[2] + 1.1, 0.5));
    };
  },

  // Seasonality: two years of monthly visits with the same dips; growth is the same month a year apart.
  // phases: [same month, year over year]
  seasonal(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, x0 = x + 20, x1 = x + w - 10, y0 = y + 50, y1 = y + h - 90;
    const shape = [0.35, 0.7, 0.75, 0.7, 0.4, 0.2, 0.2, 0.45, 0.8, 0.78, 0.7, 0.35];
    const vals = [...shape.map((v) => v * 0.8), ...shape.map((v) => v * 0.9)], X = (i) => x0 + 10 + (i * (x1 - x0 - 20)) / 23, Y = (v) => y1 - v * (y1 - y0);
    const axis = k.stroke(`M${x0} ${y0 - 10} V${y1} H${x1}`), line = k.stroke("M" + vals.map((v, i) => `${X(i)} ${Y(v)}`).join(" L"), RED, 3);
    const yl = [k.text("2025", (X(0) + X(11)) / 2, y1 + 26, { anchor: "middle", size: 20 }), k.text("2026", (X(12) + X(23)) / 2, y1 + 26, { anchor: "middle", size: 20 })];
    const sep = k.line((X(11) + X(12)) / 2, y0, (X(11) + X(12)) / 2, y1, { stroke: "#d1d5db", "stroke-dasharray": "4 5", opacity: 0 });
    const cap = k.text("the same dips every year", x + w / 2, y + h - 40, { anchor: "middle", size: 22 });
    const sept = [8, 20].map((i) => k.circle(X(i), Y(vals[i]), 9, { fill: "none", stroke: BLUE, "stroke-width": 3, opacity: 0 }));
    const arc = k.stroke(`M${X(8)} ${Y(vals[8]) - 14} Q${(X(8) + X(20)) / 2} ${y0 - 40} ${X(20)} ${Y(vals[20]) - 14}`, BLUE, 2.5);
    const growth = k.text("Sep to Sep: +12%", (X(8) + X(20)) / 2, y0 - 6, { anchor: "middle", size: 22, color: BLUE });
    return (t) => {
      axis.set(prog(t, T[0], 0.4)); line.set(prog(t, T[0] + 0.3, 1.8)); k.fadeAll([...yl, sep], prog(t, T[0] + 0.5, 0.5)); k.fade(cap, prog(t, T[0] + 2, 0.5) * (1 - prog(t, T[1], 0.4)));
      const p = prog(t, T[1], 0.5); k.fadeAll(sept, p); arc.set(prog(t, T[1] + 0.3, 0.7)); k.fade(growth, prog(t, T[1] + 0.8, 0.4));
    };
  },

  // A calendar plot: one month, a cell per day; weekends stand out.
  calendar(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, cs = 52, gx = x + (w - 7 * cs) / 2, gy = y + 70;
    const head = ["M", "T", "W", "T", "F", "S", "S"].map((d, i) => k.text(d, gx + i * cs + cs / 2, gy - 12, { anchor: "middle", size: 20 }));
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      const v = c >= 5 ? 0.12 + 0.08 * ((r + c) % 3) : 0.55 + 0.1 * ((r * 3 + c) % 4);
      cells.push(k.rect({ x: gx + c * cs + 2, y: gy + r * cs + 2, width: cs - 4, height: cs - 4, fill: BLUES(v), opacity: 0 }));
    }
    const cap = k.text("day-of-week pattern: quiet weekends", x + w / 2, gy + 5 * cs + 40, { anchor: "middle", size: 22 });
    return (t) => { k.fadeAll(head, prog(t, T[0], 0.4)); cells.forEach((c, i) => k.fade(c, prog(t, T[0] + 0.2 + i * 0.035, 0.25))); k.fade(cap, prog(t, T[0] + 1.6, 0.5)); };
  },

  // Animation shows one frame at a time; small multiples put every frame side by side.  phases: [small multiples]
  animVsSmall(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T;
    const F = [[0.4, 0.65, 0.5], [0.55, 0.5, 0.72], [0.75, 0.42, 0.88]], cols = [RED, "#6b7280", BLUE];
    // the animation: one panel, its bars moving from year to year
    const bx = x + 100, bw = 230, bb = y + 300, bh = 220;
    const big = k.rect({ x: bx, y: bb - bh - 20, width: bw, height: bh + 20, fill: "none", stroke: "#9ca3af", "stroke-width": 1.5, opacity: 0 });
    const bigBars = [0, 1, 2].map((j) => k.rect({ x: bx + 30 + j * 62, width: 46, y: bb, height: 0, fill: cols[j] }));
    const yearLab = k.text("", bx + bw - 12, bb - bh + 8, { anchor: "end", size: 26 });
    const capA = k.text("one frame at a time: remember the rest", x + w / 2, y + h - 40, { anchor: "middle", size: 21 });
    // small multiples: one small panel per year
    const sp = (i) => x + 10 + i * 140, sb = y + 300, sh = 150;
    const small = F.map((fr, i) => ({ f: k.rect({ x: sp(i), y: sb - sh - 30, width: 130, height: sh + 30, fill: "none", stroke: "#9ca3af", "stroke-width": 1.5, opacity: 0 }),
      t: k.text(String(2024 + i), sp(i) + 65, sb - sh - 8, { anchor: "middle", size: 20 }), b: fr.map((v, j) => k.rect({ x: sp(i) + 16 + j * 36, width: 26, y: sb, height: 0, fill: cols[j] })) }));
    const capB = k.text("every time point side by side", x + w / 2, y + h - 40, { anchor: "middle", size: 21, color: BLUE });
    return (t) => {
      const on = prog(t, T[0], 0.4), off = prog(t, T[1], 0.5), el = Math.max(0, t - T[0] - 0.4), fi = Math.min(2, Math.floor(el / 1.3)), fp = prog(el - fi * 1.3, 0, 0.5);
      const cur = F[Math.min(2, fi)], prev = F[Math.max(0, fi - 1)];
      k.fade(big, on * (1 - off)); yearLab.textContent = String(2024 + fi); k.fade(yearLab, on * (1 - off));
      bigBars.forEach((b, j) => { k.bar(b, bb, lerp(fi ? prev[j] : cur[j], cur[j], fi ? fp : 1) * bh * on); k.fade(b, 1 - off); });
      k.fade(capA, prog(t, T[0] + 1.5, 0.4) * (1 - off));
      small.forEach((s, i) => { const p = prog(t, T[1] + 0.3 + i * 0.2, 0.5); k.fade(s.f, p); k.fade(s.t, p); s.b.forEach((b, j) => k.bar(b, sb, F[i][j] * sh * p)); });
      k.fade(capB, prog(t, T[1] + 1, 0.4));
    };
  },

  // ---- Maps -------------------------------------------------------------------------------------------------------
  // A grid of counties (not to scale): first filled by a rate, then by raw counts, which follow population.
  // phases: [raw counts, the three big counties]
  countVsRate(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, ts = 78, gp = 4, ox = x + (w - 5 * (ts + gp)) / 2, oy = y + 20;
    const tiles = COUNTIES.flatMap((row, r) => row.map((pop, c) => ({ pop, rate: RATES[r][c], name: NAMED[`${r},${c}`],
      e: k.rect({ x: ox + c * (ts + gp), y: oy + r * (ts + gp), width: ts, height: ts, rx: 4, fill: "#fff", stroke: "#9ca3af", "stroke-width": 1, opacity: 0 }) })));
    const names = tiles.filter((tl) => tl.name).map((tl) => k.text(tl.name, +tl.e.getAttribute("x") + ts / 2, +tl.e.getAttribute("y") + ts / 2 + 6, { anchor: "middle", size: 17, color: "#fff" }));
    const capY = oy + 4 * (ts + gp) + 30;
    const caps = [k.text("filled by a rate (per 10,000 residents)", x + w / 2, capY, { anchor: "middle", size: 21 }),
      k.text("filled by raw counts", x + w / 2, capY, { anchor: "middle", size: 21, color: BLUE }),
      k.text("3 counties: about 1/3 of Ohioans", x + w / 2, capY, { anchor: "middle", size: 21, color: RED })];
    return (t) => {
      const m = prog(t, T[1], 1);
      tiles.forEach((tl, i) => { tl.e.setAttribute("fill", mix(BLUES(tl.rate), BLUES(Math.min(1, tl.pop / 1320)), m)); k.fade(tl.e, prog(t, T[0] + i * 0.04, 0.3)); });
      k.fadeAll(names, prog(t, T[2], 0.5));
      k.fade(caps[0], prog(t, T[0] + 0.8, 0.4) * (1 - m)); k.fade(caps[1], m * (1 - prog(t, T[2], 0.4))); k.fade(caps[2], prog(t, T[2], 0.4));
    };
  },

  // Totals as proportional symbols, then a cartogram: the same grid, sized by population.  phases: [cartogram]
  symbols(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, ts = 78, gp = 4, ox = x + (w - 5 * (ts + gp)) / 2, oy = y + 20;
    const tiles = COUNTIES.flatMap((row, r) => row.map((pop, c) => {
      const cx = ox + c * (ts + gp) + ts / 2, cy = oy + r * (ts + gp) + ts / 2;
      return { pop, cx, cy, out: k.rect({ x: cx - ts / 2, y: cy - ts / 2, width: ts, height: ts, rx: 4, fill: "#fff", stroke: "#9ca3af", "stroke-width": 1, opacity: 0 }),
        dot: k.circle(cx, cy, 0, { fill: RED, "fill-opacity": 0.6, stroke: RED, "stroke-width": 1.5 }) };
    }));
    const capY = oy + 4 * (ts + gp) + 30;
    const cap = k.text("one circle per region, sized by the count", x + w / 2, capY, { anchor: "middle", size: 21 });
    const cap2 = k.text("cartogram: regions sized by population", x + w / 2, capY, { anchor: "middle", size: 21, color: BLUE });
    return (t) => {
      const c = prog(t, T[1], 1.2);
      tiles.forEach((tl, i) => {
        k.fade(tl.out, prog(t, T[0] + i * 0.03, 0.3));
        tl.dot.setAttribute("r", 38 * Math.sqrt(tl.pop / 1320) * prog(t, T[0] + 0.6 + i * 0.03, 0.5)); k.fade(tl.dot, 1 - c);
        const s = lerp(ts, Math.max(12, ts * Math.sqrt(tl.pop / 1320)), c);
        tl.out.setAttribute("x", tl.cx - s / 2); tl.out.setAttribute("y", tl.cy - s / 2); tl.out.setAttribute("width", s); tl.out.setAttribute("height", s);
        tl.out.setAttribute("fill", mix("#ffffff", "#93c5fd", c));
      });
      k.fade(cap, prog(t, T[0] + 1, 0.4) * (1 - c)); k.fade(cap2, c);
    };
  },

  // ---- Many variables ---------------------------------------------------------------------------------------------
  // Four small multiples, first on one shared axis, then each on its own: they all look alike.  phases: [free axes]
  smallMult(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, pw = 200, ph = 160;
    const halls = [["Western", 4000], ["Garden", 2200], ["Maple", 1300], ["Bell Tower", 380]];
    const pan = halls.map(([name, lv], i) => {
      const px = x + 10 + (i % 2) * (pw + 12), py = y + 46 + Math.floor(i / 2) * (ph + 20);
      const vals = Array.from({ length: 14 }, (_, d) => lv * ((d % 7) >= 5 ? 0.72 : 1) * (1 + 0.06 * Math.sin(d * 2.1 + i)));
      const lo = Math.min(...vals), hi = Math.max(...vals);
      return { px, py, vals, lo, hi, f: k.rect({ x: px, y: py, width: pw, height: ph, fill: "none", stroke: "#9ca3af", "stroke-width": 1.5, opacity: 0 }),
        n: k.text(name, px + 8, py + 22, { size: 19 }), line: k.add("path", { d: "", fill: "none", stroke: RED, "stroke-width": 2.5, opacity: 0 }),
        tk: k.text("5,000", px + pw - 6, py + 22, { anchor: "end", size: 16, color: "#6b7280" }) };
    });
    const capA = k.text("one shared axis: Western is far busier", x + w / 2, y + 22, { anchor: "middle", size: 21 });
    const capB = k.text("each its own axis: they all look alike", x + w / 2, y + 22, { anchor: "middle", size: 21, color: BLUE });
    return (t) => {
      const m = prog(t, T[1], 1.2);
      pan.forEach((p, i) => {
        const top = p.py + 34, bot = p.py + ph - 10, H = bot - top;
        const yv = (v) => lerp(bot - (v / 5000) * H, bot - ((v - p.lo) / (p.hi - p.lo)) * H, m);
        p.line.setAttribute("d", "M" + p.vals.map((v, d) => `${p.px + 10 + d * ((pw - 20) / 13)} ${yv(v)}`).join(" L"));
        const on = prog(t, T[0] + i * 0.25, 0.4); k.fadeAll([p.f, p.n, p.line], on);
        p.tk.textContent = m < 0.5 ? "5,000" : Math.round(p.hi / 10) * 10 >= 1000 ? (Math.round(p.hi / 10) * 10).toLocaleString("en-US") : String(Math.round(p.hi / 10) * 10);
        k.fade(p.tk, on * Math.abs(1 - 2 * m));
      });
      k.fade(capA, prog(t, T[0] + 1, 0.4) * (1 - m)); k.fade(capB, m);
    };
  },

  // Parallel coordinates: price and units sold cross (negative); units sold and revenue run parallel (positive).
  // phases: [crossing, parallel]
  parcoords(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, ax = [x + 50, x + 215, x + 380], top = y + 60, bot = y + h - 100;
    const names = ["price", "units sold", "revenue"].map((s, i) => k.text(s, ax[i], top - 18, { anchor: "middle", size: 21 }));
    const axes = ax.map((a) => k.stroke(`M${a} ${top} V${bot}`, INK, 2.5));
    const bands = [0, 1].map((i) => k.rect({ x: ax[i], y: top, width: ax[i + 1] - ax[i], height: bot - top, fill: i ? "#dbeafe" : "#fde2e4", opacity: 0, rx: 0 }));
    const obs = [[0.9, 0.12, 0.16], [0.75, 0.3, 0.3], [0.6, 0.42, 0.45], [0.45, 0.58, 0.55], [0.3, 0.72, 0.7], [0.15, 0.88, 0.84]];
    const Y = (v) => bot - v * (bot - top);
    const lines = obs.map((o) => k.stroke("M" + o.map((v, i) => `${ax[i]} ${Y(v)}`).join(" L"), "#374151", 2.5));
    const caps = [k.text("crossing: negative", (ax[0] + ax[1]) / 2, bot + 36, { anchor: "middle", size: 22, color: RED }), k.text("parallel: positive", (ax[1] + ax[2]) / 2, bot + 36, { anchor: "middle", size: 22, color: BLUE })];
    return (t) => {
      axes.forEach((a, i) => a.set(prog(t, T[0] + i * 0.15, 0.4))); k.fadeAll(names, prog(t, T[0], 0.4));
      lines.forEach((l, i) => l.set(prog(t, T[0] + 0.6 + i * 0.15, 0.8)));
      [0, 1].forEach((i) => { const p = prog(t, T[i + 1], 0.5); k.fade(bands[i], p * 0.8); k.fade(caps[i], p); });
    };
  },

  // Four more charts, one at a time: a radar (whose shape changes when the axes are reordered), a heat map, a treemap
  // and Chernoff faces.  phases: [reorder the radar's axes, heat map, treemap, faces]
  fourCharts(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, cw = 210, ch = 200;
    const cell = (i) => [x + (i % 2) * (cw + 10), y + Math.floor(i / 2) * (ch + 10)];
    const labs = ["radar", "heat map", "treemap", "Chernoff faces"].map((s, i) => { const [cx, cy] = cell(i); return k.text(s, cx + cw / 2, cy + ch - 6, { anchor: "middle", size: 20 }); });
    // radar
    const [rx, ry] = cell(0), rc = [rx + cw / 2, ry + 86], R = 66, A = [0.9, 0.3, 0.8, 0.35, 0.7], B = [0.9, 0.8, 0.7, 0.35, 0.3];
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const spokes = [0, 1, 2, 3, 4].map((i) => k.line(rc[0], rc[1], rc[0] + R * Math.cos(ang(i)), rc[1] + R * Math.sin(ang(i)), { stroke: "#9ca3af", "stroke-width": 1.5, opacity: 0 }));
    const poly = k.add("path", { d: "", fill: PALE, stroke: RED, "stroke-width": 2.5, opacity: 0 });
    // heat map
    const [hx, hy] = cell(1), heat = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) heat.push(k.rect({ x: hx + 18 + c * 29, y: hy + 14 + r * 30, width: 27, height: 28, fill: BLUES(0.15 + 0.7 * Math.abs(Math.sin(r * 1.3 + c * 0.7))), opacity: 0, rx: 2 }));
    // treemap
    const [mx, my] = cell(2), tm = [[0, 0, 110, 160, "#fecaca"], [110, 0, 70, 90, "#bfdbfe"], [110, 90, 70, 70, "#bbf7d0"], [0, 0, 110, 90, "#fca5a5"], [0, 90, 55, 70, "#fda4af"], [55, 90, 55, 70, "#f87171"]];
    const tree = tm.map(([a, b, c, d, f]) => k.rect({ x: mx + 15 + a, y: my + 14 + b, width: c, height: d, fill: f, stroke: "#fff", "stroke-width": 2, opacity: 0, rx: 0 }));
    // Chernoff faces: the eyes and the mouth carry the values
    const [fx, fy] = cell(3), face = (cx, cy, eye, smile) => [k.circle(cx, cy, 38, { fill: "#fef3c7", stroke: INK, "stroke-width": 2, opacity: 0 }),
      k.circle(cx - 13, cy - 10, eye, { fill: INK, opacity: 0 }), k.circle(cx + 13, cy - 10, eye, { fill: INK, opacity: 0 }),
      k.add("path", { d: `M${cx - 16} ${cy + 14} Q${cx} ${cy + 14 + smile} ${cx + 16} ${cy + 14}`, fill: "none", stroke: INK, "stroke-width": 2.5, opacity: 0 })];
    const faces = [...face(fx + 60, fy + 84, 7, 16), ...face(fx + 150, fy + 84, 3, -12)];
    return (t) => {
      const p0 = prog(t, T[0], 0.5), m = prog(t, T[1], 1.2);
      k.fadeAll([...spokes, poly, labs[0]], p0);
      poly.setAttribute("d", "M" + [0, 1, 2, 3, 4].map((i) => { const v = lerp(A[i], B[i], m) * R; return `${rc[0] + v * Math.cos(ang(i))} ${rc[1] + v * Math.sin(ang(i))}`; }).join(" L") + " Z");
      heat.forEach((c, i) => k.fade(c, prog(t, T[2] + i * 0.02, 0.3))); k.fade(labs[1], prog(t, T[2], 0.4));
      tree.forEach((c, i) => k.fade(c, prog(t, T[3] + i * 0.12, 0.3))); k.fade(labs[2], prog(t, T[3], 0.4));
      k.fadeAll(faces, prog(t, T[4], 0.5)); k.fade(labs[3], prog(t, T[4], 0.4));
    };
  },

  // ---- Is the data right? ----------------------------------------------------------------------------------------
  // Daily cases with a weekly comb: the spikes fall on the reporting day.  phases: [the reporting days]
  comb(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, x0 = x + 20, x1 = x + w - 10, y0 = y + 50, y1 = y + h - 90, n = 42;
    const WEEK = [0.55, 0.6, 1.55, 1.2, 1.05, 1.0, 0.9];   // Sunday first: few reports on weekends, a catch-up on Tuesday
    const vals = Array.from({ length: n }, (_, d) => (0.25 + 0.5 * Math.exp(-(((d - 21) / 11) ** 2))) * WEEK[d % 7]);
    const X = (d) => x0 + 8 + (d * (x1 - x0 - 16)) / (n - 1), Y = (v) => y1 - (v / 1.25) * (y1 - y0);
    const axis = k.stroke(`M${x0} ${y0 - 10} V${y1} H${x1}`), line = k.stroke("M" + vals.map((v, d) => `${X(d)} ${Y(v)}`).join(" L"), RED, 2.5);
    const weeks = [0, 1, 2, 3, 4, 5].map((i) => k.text(`week ${i + 1}`, X(i * 7 + 3), y1 + 24, { anchor: "middle", size: 16, color: "#6b7280" }));
    const spikes = vals.map((v, d) => (d % 7 === 2 ? k.circle(X(d), Y(v), 6, { fill: BLUE, opacity: 0 }) : null)).filter(Boolean);
    const cap = k.text("a spike every Tuesday: the reporting day", x + w / 2, y + h - 30, { anchor: "middle", size: 21, color: BLUE });
    return (t) => { axis.set(prog(t, T[0], 0.4)); line.set(prog(t, T[0] + 0.3, 2)); k.fadeAll(weeks, prog(t, T[0] + 0.5, 0.5));
      spikes.forEach((s, i) => k.fade(s, prog(t, T[1] + i * 0.15, 0.3))); k.fade(cap, prog(t, T[1] + 0.6, 0.4)); };
  },

  // The crash file: one row is one person, so counting rows counts people; the crashes are fewer.  phases: [crashes]
  crashRows(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, tx = x + 70, rh = 38, c1 = 90, c2 = 170, ty = y + 30;
    const rows = [[1, "driver"], [1, "passenger"], [1, "passenger"], [2, "driver"], [3, "driver"], [3, "passenger"], [3, "pedestrian"]];
    const head = [k.rect({ x: tx, y: ty, width: c1 + c2, height: rh, fill: GRAY, opacity: 0 }), k.text("crash", tx + c1 / 2, ty + 26, { anchor: "middle", size: 21 }), k.text("person", tx + c1 + c2 / 2, ty + 26, { anchor: "middle", size: 21 })];
    const fills = ["#fde2e4", "#dbeafe", "#dcfce7"];
    const body = rows.map(([c, p], i) => { const ry = ty + (i + 1) * rh;
      return { c, bg: k.rect({ x: tx, y: ry, width: c1 + c2, height: rh, fill: fills[c - 1], opacity: 0 }), cells: [k.rect({ x: tx, y: ry, width: c1 + c2, height: rh, fill: "none", stroke: "#9ca3af", "stroke-width": 1, opacity: 0 }),
        k.text(String(c), tx + c1 / 2, ry + 26, { anchor: "middle", size: 21 }), k.text(p, tx + c1 + 12, ry + 26, { size: 21 })] }; });
    const capA = k.text("7 rows = 7 people", x + w / 2, ty + 8 * rh + 42, { anchor: "middle", size: 22 });
    const capB = k.text("3 crashes", x + w / 2, ty + 8 * rh + 42, { anchor: "middle", size: 22, color: BLUE });
    const braces = [[0, 2], [3, 3], [4, 6]].map(([a, b], i) => k.stroke(`M${tx + c1 + c2 + 10} ${ty + (a + 1) * rh + 4} h10 V${ty + (b + 2) * rh - 4} h-10`, BLUE, 2.5));
    return (t) => { k.fadeAll(head, prog(t, T[0], 0.4)); body.forEach((r, i) => k.fadeAll(r.cells, prog(t, T[0] + 0.3 + i * 0.12, 0.3)));
      const p = prog(t, T[1], 0.6); body.forEach((r) => k.fade(r.bg, p)); braces.forEach((b, i) => b.set(prog(t, T[1] + i * 0.2, 0.4)));
      k.fade(capA, prog(t, T[0] + 1.4, 0.4) * (1 - p)); k.fade(capB, p); };
  },

  // ---- Build it -----------------------------------------------------------------------------------------------------
  // A campus's enrollment repeats on every course row: SUM adds it once per row; take it once.
  // phases: [SUM is wrong, take it once]
  sumTrap(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, tx = x + 15, rh = 40, cs = [120, 100, 150], ty = y + 20, tw = cs[0] + cs[1] + cs[2];
    const rows = [["section", "campus", "enrollment"], ["ISA 401 A", "Oxford", "19,240"], ["ISA 401 B", "Oxford", "19,240"], ["ISA 235", "Oxford", "19,240"], ["MKT 291", "Oxford", "19,240"]];
    const cx = [tx, tx + cs[0], tx + cs[0] + cs[1]];
    const els = rows.map((r, i) => [k.rect({ x: tx, y: ty + i * rh, width: tw, height: rh, fill: i ? "#fff" : GRAY, stroke: "#9ca3af", "stroke-width": 1, opacity: 0 }),
      ...r.map((s, j) => k.text(s, cx[j] + 10, ty + i * rh + 27, { size: 20 }))]);
    const col = k.rect({ x: cx[2] + 2, y: ty + rh + 2, width: cs[2] - 4, height: 4 * rh - 4, fill: "none", stroke: RED, "stroke-width": 3, rx: 6, opacity: 0 });
    const sum = k.text([["SUM: ", INK], ["76,960", RED], ["  (4 x 19,240)", "#6b7280"]], tx + 10, ty + 5 * rh + 50, { size: 24 });
    const once = k.text([["MAX or AVG: ", INK], ["19,240", BLUE], ["  (once)", "#6b7280"]], tx + 10, ty + 5 * rh + 96, { size: 24 });
    return (t) => { els.forEach((e, i) => k.fadeAll(e, prog(t, T[0] + i * 0.2, 0.4))); k.fade(col, prog(t, T[1], 0.4)); k.fade(sum, prog(t, T[1] + 0.5, 0.4)); k.fade(once, prog(t, T[2], 0.4)); };
  },

  // The design checklist, one fix at a time: a title, labeled axes, bars from zero and sorted, one color, no junk.
  // phases: [title, axes, zero and sorted, color, no junk]
  checklist(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, px0 = x + 70, px1 = x + w - 10, py0 = y + 70, py1 = y + h - 80, H = py1 - py0;
    const fac = ["pool", "gym", "track", "courts", "climb"], vals = [420, 980, 310, 650, 210], rank = [2, 0, 3, 1, 4];
    const rain = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"], slot = (px1 - px0) / 5, bw = 46;
    const bg = k.rect({ x: px0 - 4, y: py0 - 10, width: px1 - px0 + 8, height: H + 10, fill: "#fef9c3", opacity: 0 });
    const grid = Array.from({ length: 9 }, (_, i) => k.line(px0, py0 + (i * H) / 8, px1, py0 + (i * H) / 8, { stroke: "#6b7280", "stroke-width": 2, opacity: 0 }));
    const shadows = vals.map(() => k.rect({ x: 0, y: 0, width: bw, height: 0, fill: "#374151", opacity: 0 }));
    const bars = vals.map(() => k.rect({ x: 0, width: bw, y: py1, height: 0, stroke: INK, "stroke-width": 1.5 }));
    const labs = fac.map((f) => k.text(f, 0, py1 + 22, { anchor: "middle", size: 18 }));
    const axis = k.line(px0, py1, px1, py1, { opacity: 0 });
    const title = k.text("The gym gets the most visits", x + w / 2, y + 30, { anchor: "middle", size: 26 });
    const yT = k.text("visits, fall 2026", px0 - 46, (py0 + py1) / 2, { anchor: "middle", size: 19 }); yT.setAttribute("transform", `rotate(-90 ${px0 - 46} ${(py0 + py1) / 2})`);
    const xT = k.text("facility", (px0 + px1) / 2, py1 + 48, { anchor: "middle", size: 19 });
    const tickTop = k.text("1,000", px0 - 8, py0 + 6, { anchor: "end", size: 16 }), tickLow = k.text("150", px0 - 8, py1 + 5, { anchor: "end", size: 16 }), tickZero = k.text("0", px0 - 8, py1 + 5, { anchor: "end", size: 16 });
    return (t) => {
      const on = prog(t, T[0], 0.6), tl = prog(t, T[1], 0.5), ax = prog(t, T[2], 0.5), fx = prog(t, T[3], 1.2), cl = prog(t, T[4], 0.8), jk = prog(t, T[5], 0.8);
      k.fade(bg, on * (1 - jk) * 0.9); grid.forEach((g) => k.fade(g, on * (1 - jk))); k.fade(axis, on);
      vals.forEach((v, i) => {
        const hh = lerp(((v - 150) / 850) * H, (v / 1000) * H, fx) * on, bx = px0 + lerp(i, rank[i], fx) * slot + (slot - bw) / 2;
        bars[i].setAttribute("x", bx); k.bar(bars[i], py1, hh); bars[i].setAttribute("fill", mix(rain[i], "#64748b", cl));
        shadows[i].setAttribute("x", bx + 7); shadows[i].setAttribute("y", py1 - hh - 7); shadows[i].setAttribute("height", hh); k.fade(shadows[i], on * (1 - jk) * 0.8);
        labs[i].setAttribute("x", bx + bw / 2); k.fade(labs[i], on);
      });
      k.fade(title, tl); k.fadeAll([yT, xT, tickTop], ax); k.fade(tickLow, ax * (1 - fx)); k.fade(tickZero, ax * fx);
    };
  },

  // The sanity check from Map Gallery (Class 19): maps that added up the weekly running totals gave Butler County
  // about 7.6 million cases, in a county of 383,134 people.  phases: [the people]
  sanityBars(ctx) {
    const { x, y, w, h } = ctx.box, k = kit(ctx), T = ctx.T, base = y + h - 70, top = y + 124, H = base - top, M = 7.6;
    const floor = k.stroke(`M${x + 40} ${base} H${x + w - 40}`);
    const head = k.text("Butler County, in Map Gallery", x + w / 2, y + 24, { anchor: "middle", size: 22 });
    const bars = [[M, RED, "cases (added up)", "7.6 million"], [0.383, "#6b7280", "people", "383,134"]].map(([v, c, lab, num], i) => ({ v,
      r: k.rect({ x: x + 90 + i * 150, width: 100, y: base, height: 0, fill: c, stroke: INK, "stroke-width": 2 }),
      lab: k.text(lab, x + 140 + i * 150, base + 28, { anchor: "middle", size: 21 }), num: k.text(num, x + 140 + i * 150, base, { anchor: "middle", size: 22, color: c }) }));
    const q = k.text("more cases than people?", x + w / 2, y + 52, { anchor: "middle", size: 24, color: RED });
    return (t) => {
      floor.set(prog(t, T[0], 0.4)); k.fade(head, prog(t, T[0], 0.4));
      bars.forEach((b, i) => { const p = prog(t, T[i] + 0.2, 1); const hh = (b.v / M) * H * p; k.bar(b.r, base, hh); b.num.setAttribute("y", base - hh - 8); k.fade(b.num, p); k.fade(b.lab, p); });
      k.fade(q, prog(t, T[1] + 1.2, 0.5));
    };
  },
};

// The county grid shared by the two map sketches (thousands of residents, roughly placed: Cuyahoga in the northeast,
// Franklin in the middle, Hamilton in the southwest, Butler next to it). Not a real map.
const COUNTIES = [[60, 120, 90, 230, 1250], [45, 150, 1320, 180, 75], [110, 55, 200, 40, 95], [830, 390, 70, 130, 60]];
const RATES = [[0.6, 0.3, 0.8, 0.4, 0.5], [0.7, 0.5, 0.4, 0.9, 0.3], [0.4, 0.8, 0.6, 0.3, 0.7], [0.5, 0.9, 0.2, 0.6, 0.4]];
const NAMED = { "0,4": "Cuyahoga", "1,2": "Franklin", "3,0": "Hamilton" };

// where a sketch sits on the board: right of a column of short lines, or across the page under the title
export const BOXES = { right: { x: 500, y: 96, w: 430, h: 414 }, wide: { x: 60, y: 100, w: 840, h: 414 } };
export const makeSketch = (name, ctx) => { const f = SKETCHES[name]; if (!f) throw new Error("no sketch " + name); return f(ctx); };
