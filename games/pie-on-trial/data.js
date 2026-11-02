// The charts in Pie on Trial, shared by the phone page, the projector page and the tests.
// Same three datasets as the "Pie Charts are Awful By Design" slides in Class 20 (based on
// https://www.data-to-viz.com/caveat/pie.html), adjusted so each one adds up to 100 in whole percents.
// Charts 1-3 are pies, charts 4-6 are the same data as bars. Not secret: the values must reach the
// phone to be drawn, and the game counts for nothing.
(function (root) {
  var LETTERS = ["a", "b", "c", "d", "e"];
  var DATASETS = [
    { id: "rising", label: "Rising", values: [16, 18, 20, 22, 24] },
    { id: "flat", label: "Flat", values: [20, 19, 21, 20, 20] },
    { id: "falling", label: "Falling", values: [23, 22, 20, 18, 17] },
  ];
  // viridis, reversed, as in the slides: a is yellow, e is purple
  var FILLS = ["#FDE725", "#5DC863", "#21908C", "#3B528B", "#440154"];
  var INK = ["#1b1b1b", "#1b1b1b", "#ffffff", "#ffffff", "#ffffff"];
  var SECONDS = 15;
  var CHARTS = [];
  ["pie", "bar"].forEach(function (form) {
    DATASETS.forEach(function (d, i) {
      CHARTS.push({
        n: CHARTS.length + 1, form: form, dataset: i, values: d.values,
        answer: d.values.indexOf(Math.max.apply(null, d.values)),
      });
    });
  });

  // SVG strings, so the phone and the projector draw the same charts.
  function piePath(cx, cy, r, from, to) {
    var a0 = (from - 90) * Math.PI / 180, a1 = (to - 90) * Math.PI / 180;
    var large = to - from > 180 ? 1 : 0;
    return "M" + cx + " " + cy + "L" + (cx + r * Math.cos(a0)).toFixed(2) + " " + (cy + r * Math.sin(a0)).toFixed(2) +
      "A" + r + " " + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)).toFixed(2) + " " + (cy + r * Math.sin(a1)).toFixed(2) + "Z";
  }
  function pieSVG(values) {
    var total = values.reduce(function (a, b) { return a + b; }, 0), at = 0, out = "";
    values.forEach(function (v, i) {
      var sweep = 360 * v / total, mid = (at + sweep / 2 - 90) * Math.PI / 180;
      out += '<g class="opt" data-opt="' + i + '"><path class="mark" d="' + piePath(200, 200, 186, at, at + sweep) + '" fill="' + FILLS[i] + '" stroke="#fff" stroke-width="2"/>';
      out += '<text x="' + (200 + 118 * Math.cos(mid)).toFixed(1) + '" y="' + (200 + 118 * Math.sin(mid)).toFixed(1) + '" fill="' + INK[i] +
        '" font-size="34" font-weight="700" text-anchor="middle" dominant-baseline="central">' + LETTERS[i] + "</text></g>";
      at += sweep;
    });
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Pie chart with slices a to e">' + out + "</svg>";
  }
  function barSVG(values) {
    var left = 46, right = 390, top = 12, bottom = 352, max = 25, out = "";
    var y = function (v) { return bottom - (bottom - top) * v / max; };
    [0, 5, 10, 15, 20, 25].forEach(function (t) {
      out += '<line x1="' + left + '" x2="' + (left - 7) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="#585E60" stroke-width="1.5"/>';
      out += '<text x="' + (left - 12) + '" y="' + y(t) + '" fill="#585E60" font-size="19" text-anchor="end" dominant-baseline="central">' + t + "</text>";
    });
    var step = (right - left) / values.length, w = step * 0.82;
    values.forEach(function (v, i) {
      var x = left + step * i + (step - w) / 2;
      // the whole column can be tapped, including above the bar and its letter
      out += '<g class="opt" data-opt="' + i + '"><rect x="' + (left + step * i).toFixed(1) + '" y="' + top + '" width="' + step.toFixed(1) + '" height="388" fill="transparent"/>';
      out += '<rect class="mark" x="' + x.toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (bottom - y(v)).toFixed(1) + '" fill="' + FILLS[i] + '"/>';
      out += '<text x="' + (x + w / 2).toFixed(1) + '" y="382" fill="#1b1b1b" font-size="30" font-weight="700" text-anchor="middle">' + LETTERS[i] + "</text></g>";
    });
    out += '<line x1="' + left + '" x2="' + right + '" y1="' + bottom + '" y2="' + bottom + '" stroke="#585E60" stroke-width="1.5"/>';
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Bar chart with bars a to e">' + out + "</svg>";
  }
  function chartSVG(chart) { return chart.form === "pie" ? pieSVG(chart.values) : barSVG(chart.values); }

  var api = { LETTERS: LETTERS, DATASETS: DATASETS, FILLS: FILLS, CHARTS: CHARTS, SECONDS: SECONDS, chartSVG: chartSVG };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PT = api;
})(this);
