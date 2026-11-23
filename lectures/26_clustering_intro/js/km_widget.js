// Class 26: the k-means step-by-step widget. Mounts into every <div class="km-widget"></div> in the slides.
// It follows the by-hand handout (Waldyn Martinez's worked solution) exactly:
//   Step 0: points 1 and 4 (the two farthest apart) are the starting centers.
//   Round 1 (the first pass): each click of "Assign Next Point" takes the next point (2, 3, 5, 6, 7), draws its
//   distance to both centers, writes out sqrt((x - a)^2 + (y - b)^2), puts it with the nearer center, and moves that
//   center to the mean of its points right away (MacQueen's version of k-means).
//   Round 2 on (the check): every point is measured against the same centers, then "Move Centers" moves each center to
//   its group's mean; repeat until nothing moves.
// Nothing plays by itself. Buttons lose focus after a click, so Space and the arrow keys keep moving the slides.
// Needs window.KM (js/kmeans.js).
(function () {
  "use strict";
  var KM = window.KM;
  var NS = "http://www.w3.org/2000/svg";
  var COLS = ["#c3142d", "#386CB0", "#c77d16", "#2e9e3e", "#8a6fb0"];

  // The spring activity's seven points; k = 2, starting at observations 1 and 4 (the handout's start).
  var SEVEN = [[1, 1], [1.5, 2], [3, 4], [5, 7], [3.5, 5], [4.5, 5], [3.5, 4.5]];

  var DATA = {
    seven: { pts: SEVEN, xr: [0, 6.5], yr: [0, 8], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 2, 4, 6, 8],
             xl: "X1", yl: "X2", r: 9, byHand: true, k: [2] }
  };

  var W = 470, H = 400, ML = 46, MR = 12, MT = 12, MB = 40;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, html, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function num(v) { return String(Math.round(v * 100) / 100); }            // 1.5, 3, 1.83
  function pt(p) { return "(" + num(p[0]) + ", " + num(p[1]) + ")"; }
  function same(a, b) {
    return a.every(function (c, k) { return c.every(function (v, j) { return Math.abs(v - b[k][j]) < 1e-9; }); });
  }
  // centers are kept to 2 decimals, as when working by hand, so the formulas shown give exactly the numbers shown
  function r2(c) { return c.map(function (v) { return Math.round(v * 100) / 100; }); }
  function nearest(d) { var b = 0; for (var k = 1; k < d.length; k++) if (d[k] < d[b] - 1e-12) b = k; return b; }

  function mount(root) {
    // phase: pick (placing starts) -> assign (points joining, one by one or all) -> move -> assign ... -> done
    var S = { data: "seven", k: 2, centers: [], prev: null, labels: null, prevLabels: null,
              newLabels: null, dists: null, cur: 0, last: -1, phase: "pick", iter: 0, log: [], msg: "", moved: false };

    root.innerHTML = "";
    var left = h("div", "kmw-left", null, root);
    var right = h("div", "kmw-right", null, root);
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "kmw-svg" }, left);
    var hint = h("div", "kmw-hint", "", left);

    var steps = h("div", "kmw-steps", null, right);
    var bPick = h("button", "kmw-btn", "<b>0</b> Pick Starting Centers", steps);
    var bAssign = h("button", "kmw-btn", "<b>1</b> Assign", steps);
    var bMove = h("button", "kmw-btn", "<b>2</b> Move Centers", steps);
    var bar3 = h("div", "kmw-row", null, right);
    var bRest = h("button", "kmw-chip", "Assign the Rest", bar3);
    var bRun = h("button", "kmw-chip", "Run to the End", bar3);
    var bReset = h("button", "kmw-chip", "Reset", bar3);

    var status = h("div", "kmw-status", "", right);
    var detail = h("div", "kmw-detail", "", right);

    function D() { return DATA[S.data]; }
    function n() { return D().pts.length; }
    function sx(x) { var d = D(); return ML + (x - d.xr[0]) / (d.xr[1] - d.xr[0]) * (W - ML - MR); }
    function sy(y) { var d = D(); return H - MB - (y - d.yr[0]) / (d.yr[1] - d.yr[0]) * (H - MT - MB); }

    function reset() {
      S.centers = []; S.prev = null; S.labels = null; S.prevLabels = null; S.newLabels = null; S.dists = null;
      S.cur = 0; S.last = -1; S.phase = "pick"; S.iter = 0; S.log = []; S.msg = ""; S.moved = false;
      S.dc = null; S.upd = null;
    }
    function logInertia(what, labels) {
      S.log.push({ what: what, v: KM.inertia(D().pts, labels, S.centers) });
    }
    var SEEDS = [0, 3];             // points 1 and 4, the two farthest apart
    function pick() {
      reset();
      S.centers = SEEDS.map(function (i) { return SEVEN[i].slice(); });
      startRound();
      SEEDS.forEach(function (i, k) { S.newLabels[i] = k; });
      S.cur = nextOpen(0);
      S.phase = "assign";
      S.msg = "Points 1 and 4 (the two farthest apart) are the starting centers, so they start in " +
              '<b style="color:' + COLS[0] + '">C1</b> and <b style="color:' + COLS[1] + '">C2</b>. Next: point ' + (S.cur + 1) + ".";
    }
    function startRound() {         // a new round: distances from every point to the current centers
      S.dists = KM.assign(D().pts, S.centers).dists;
      S.newLabels = D().pts.map(function () { return null; });
      S.prev = null; S.moved = false; S.iter += 1; S.last = -1; S.upd = null;
      S.dc = D().pts.map(function () { return S.centers.map(function (c) { return c.slice(); }); });
    }
    function nextOpen(from) {       // the next point not yet assigned this round (n() when none is left)
      var i = from;
      while (i < n() && S.newLabels[i] !== null) i++;
      return i;
    }
    function ready(msg) {           // centers are set: the next step is a new round of Assign
      S.phase = "assign"; S.cur = 0; S.last = -1; S.newLabels = null; S.dists = null; S.msg = msg;
    }
    function assignOne() {
      if (!S.newLabels) { startRound(); S.cur = nextOpen(0); }
      var i = S.cur;
      if (S.iter === 1) {           // first pass: distances to the centers as they are right now
        S.dists[i] = KM.assign([D().pts[i]], S.centers).dists[0];
        S.dc[i] = S.centers.map(function (c) { return c.slice(); });
      }
      var l = nearest(S.dists[i]);
      S.newLabels[i] = l; S.last = i; S.cur = nextOpen(i + 1);
      if (S.iter === 1) {           // ...and the center it joined moves to the mean of its points right away
        var mine = []; S.newLabels.forEach(function (x, j) { if (x === l) mine.push(j); });
        S.prev = S.centers.map(function (c) { return c.slice(); });
        S.centers[l] = r2([0, 1].map(function (j) { return mine.reduce(function (a, m) { return a + D().pts[m][j]; }, 0) / mine.length; }));
        S.upd = { k: l, mine: mine };
        S.msg = "Point " + (i + 1) + ' joins <b style="color:' + COLS[l] + '">C' + (l + 1) + "</b>, so C" + (l + 1) +
                " moves to the mean of points " + mine.map(function (m) { return m + 1; }).join(", ") + ".";
        if (S.cur === n()) finishFirstPass();
        return;
      }
      var was = S.labels ? S.labels[i] : null;
      var tie = S.dists[i].filter(function (v) { return Math.abs(v - S.dists[i][l]) < 1e-12; }).length > 1;
      S.msg = "Point " + (i + 1) + (was !== null && was !== l ? " <b>switches</b> from C" + (was + 1) + " to " : " joins ") +
              '<b style="color:' + COLS[l] + '">C' + (l + 1) + "</b>" + (tie ? " (a tie goes to the first center)." : ".");
      if (S.cur === n()) finishAssign();
    }
    function finishFirstPass() {
      S.labels = S.newLabels.slice();
      logInertia("Pass 1", S.labels);
      S.phase = "assign"; S.newLabels = null; S.cur = 0;
      S.msg += " Every point is in a cluster. Next: <b>check</b> every point against these centers.";
    }
    function finishAssign() {
      S.prevLabels = S.labels; S.labels = S.newLabels.slice();
      logInertia("Assign " + S.iter, S.labels);
      var changed = S.prevLabels ? S.labels.filter(function (l, i) { return l !== S.prevLabels[i]; }).length : null;
      var tail = changed === null ? " Every point has joined its nearest center."
               : changed === 0 ? " No point changed groups this round."
               : " " + changed + (changed === 1 ? " point" : " points") + " changed groups this round.";
      S.msg = S.msg + tail;
      S.phase = "move";
    }
    function assignRest() {         // finish the current round (and only it)
      assignOne();
      var it = S.iter;
      while (S.phase === "assign" && S.iter === it && S.newLabels) assignOne();
    }
    function move() {
      var nc = KM.move(D().pts, S.labels, S.centers).map(r2);
      var stopped = same(nc, S.centers);
      S.prev = S.centers; S.centers = nc; S.moved = true;
      logInertia("Move " + S.iter, S.labels);
      if (stopped) { S.phase = "done"; S.msg = "The centers did not move, so k-means <b>stops</b> after " + S.iter + " rounds."; }
      else { S.phase = "assign"; S.cur = 0; S.last = -1; S.newLabels = null; S.dists = null;
             S.msg = "Each center moved to the mean of its group. Next: assign every point again."; }
    }
    function runToEnd() {
      if (S.phase === "pick") pick();
      var guard = 0;
      while (S.phase !== "done" && guard++ < 500) { if (S.phase === "assign") assignOne(); else move(); }
    }

    // ---------------- drawing ----------------
    function label(x, y, text, col, bold) {
      var g = el("g", {}, svg);
      var t = el("text", { x: x, y: y + 4, class: "kmw-dlab" + (bold ? " b" : ""), "text-anchor": "middle", fill: col }, g);
      t.textContent = text;
      var w = text.length * (bold ? 7.4 : 6.8) + 8;
      var r = el("rect", { x: x - w / 2, y: y - 9, width: w, height: 18, rx: 4, class: "kmw-dbox", stroke: col }, null);
      g.insertBefore(r, t);
    }
    function draw() {
      var d = D(), pts = d.pts;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      d.xt.forEach(function (t) {
        el("line", { x1: sx(t), x2: sx(t), y1: MT, y2: H - MB, class: "kmw-grid" }, svg);
        el("text", { x: sx(t), y: H - MB + 16, class: "kmw-tick", "text-anchor": "middle" }, svg).textContent = t;
      });
      d.yt.forEach(function (t) {
        el("line", { x1: ML, x2: W - MR, y1: sy(t), y2: sy(t), class: "kmw-grid" }, svg);
        el("text", { x: ML - 7, y: sy(t) + 4, class: "kmw-tick", "text-anchor": "end" }, svg).textContent = t;
      });
      el("text", { x: (ML + W - MR) / 2, y: H - 6, class: "kmw-axl", "text-anchor": "middle" }, svg).textContent = d.xl;
      el("text", { x: 13, y: (MT + H - MB) / 2, class: "kmw-axl", "text-anchor": "middle",
                   transform: "rotate(-90 13 " + (MT + H - MB) / 2 + ")" }, svg).textContent = d.yl;

      // which group each point is shown in right now
      var shown = pts.map(function (_, i) {
        if (S.phase === "assign" && S.newLabels) return S.newLabels[i];       // this round, so far
        if (S.phase === "assign" && !S.newLabels && S.labels) return S.labels[i];
        return S.labels ? S.labels[i] : null;
      });
      // after Assign (all points in) or Move: a thin line from each point to its center
      // (7 points: only after Move, to show that each new center is the mean of these points)
      if (S.labels && ((!D().byHand && (S.phase === "move" || S.phase === "done")) || (D().byHand && S.moved))) {
        pts.forEach(function (p, i) {
          var c = S.centers[S.labels[i]];
          el("line", { x1: sx(p[0]), y1: sy(p[1]), x2: sx(c[0]), y2: sy(c[1]), stroke: COLS[S.labels[i]], class: "kmw-spoke" }, svg);
        });
      }
      // the point being assigned: a dashed line to every center, each labeled with its distance
      var cur = d.byHand && (S.phase === "assign" || (S.phase === "move" && !S.moved)) && S.last >= 0 && S.dists ? S.last : -1;
      if (cur >= 0) {
        var p = pts[cur], win = nearest(S.dists[cur]), cs = S.dc && S.dc[cur] ? S.dc[cur] : S.centers;
        cs.forEach(function (c, k) {
          el("line", { x1: sx(p[0]), y1: sy(p[1]), x2: sx(c[0]), y2: sy(c[1]), stroke: COLS[k],
                       class: k === win ? "kmw-dline win" : "kmw-dline" }, svg);
        });
        cs.forEach(function (c, k) {
          // the points lie along one diagonal, so each label sits off its line: C1's above-left, C2's below-right
          var x1 = sx(p[0]), y1 = sy(p[1]), x2 = sx(c[0]), y2 = sy(c[1]);
          var len = Math.max(1, Math.hypot(x2 - x1, y2 - y1)), nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
          var upLeft = (nx + ny <= 0 ? 1 : -1), side = k === 0 ? upLeft : -upLeft, off = 22;   // screen up-left: x + y falls
          label((x1 + x2) / 2 + side * nx * off, (y1 + y2) / 2 + side * ny * off, "d = " + f2(S.dists[cur][k]), COLS[k], k === win);
        });
      }
      // points
      pts.forEach(function (p, i) {
        var l = shown[i], fresh = S.phase === "assign" && S.newLabels && S.newLabels[i] === null;
        var col = l === null || l === undefined ? "#9ca3af" : COLS[l];
        var attrs = { cx: sx(p[0]), cy: sy(p[1]), r: d.r, class: "kmw-pt" };
        // not yet assigned this round: an open circle (in last round's color, or gray in round 1)
        if (fresh) attrs.style = "fill:#fff; stroke:" + (S.labels ? COLS[S.labels[i]] : "#9ca3af") + "; stroke-width:2.5px;";
        else attrs.fill = col;
        el("circle", attrs, svg);
        if (i === cur) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: d.r + 5, class: "kmw-ring" }, svg);
        if (d.byHand) el("text", { x: sx(p[0]) + 11, y: sy(p[1]) - 8, class: "kmw-plab" }, svg).textContent = i + 1;
      });
      // where the centers came from (the last Move)
      if (S.prev) S.prev.forEach(function (c, k) {
        var nw = S.centers[k];
        if (Math.abs(c[0] - nw[0]) + Math.abs(c[1] - nw[1]) < 1e-9) return;
        el("line", { x1: sx(c[0]), y1: sy(c[1]), x2: sx(nw[0]), y2: sy(nw[1]), stroke: COLS[k], class: "kmw-trail",
                     "marker-end": "url(#kmw-arr" + k + ")" }, svg);
        el("circle", { cx: sx(c[0]), cy: sy(c[1]), r: 8, stroke: COLS[k], class: "kmw-ghost" }, svg);
      });
      // arrowheads, one per color
      var defs = el("defs", {}, svg);
      COLS.forEach(function (col, k) {
        var m = el("marker", { id: "kmw-arr" + k, viewBox: "0 0 10 10", refX: 22, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 Z", fill: col }, m);
      });
      // centers: a white-ringed diamond with the center's number (and, on the 7 points, its coordinates)
      S.centers.forEach(function (c, k) {
        var x = sx(c[0]), y = sy(c[1]), s = 13;
        el("path", { d: "M" + x + "," + (y - s) + "L" + (x + s) + "," + y + "L" + x + "," + (y + s) + "L" + (x - s) + "," + y + "Z",
                     fill: COLS[k], class: "kmw-ctr" }, svg);
        el("text", { x: x, y: y + 4.5, class: "kmw-clab", "text-anchor": "middle" }, svg).textContent = "C" + (k + 1);
        if (d.byHand) {
          // C1's coordinates below-right of it, C2's above-left (away from the diagonal the points lie on)
          var t = k === 0 ? el("text", { x: x + 14, y: y + 26, class: "kmw-cxy", "text-anchor": "start", fill: COLS[k] }, svg)
                          : el("text", { x: x - 14, y: y - 16, class: "kmw-cxy", "text-anchor": "end", fill: COLS[k] }, svg);
          t.textContent = "(" + f2(c[0]) + ", " + f2(c[1]) + ")";
        }
      });
      el("rect", { x: ML, y: MT, width: W - ML - MR, height: H - MT - MB, class: "kmw-hit" }, svg);
    }

    // ---------------- the worked arithmetic (7 points) ----------------
    function workDist(i) {
      var p = D().pts[i], win = nearest(S.dists[i]), cs = S.dc && S.dc[i] ? S.dc[i] : S.centers;
      return cs.map(function (c, k) {
        return '<div class="kmw-eq' + (k === win ? " win" : "") + '">d(point ' + (i + 1) + ', <b style="color:' + COLS[k] + '">C' + (k + 1) + "</b>) = &radic;((" +
          num(p[0]) + " &minus; " + num(c[0]) + ")&sup2; + (" + num(p[1]) + " &minus; " + num(c[1]) + ")&sup2;) = <b>" + f2(S.dists[i][k]) + "</b></div>";
      }).join("");
    }
    function workMean(only, labels) {
      var pts = D().pts;
      return S.centers.map(function (c, k) {
        if (only !== undefined && k !== only) return "";
        var mine = []; labels.forEach(function (l, i) { if (l === k) mine.push(i); });
        var head = '<b style="color:' + COLS[k] + '">C' + (k + 1) + "</b> = ";
        if (!mine.length) return '<div class="kmw-eq">' + head + "no points joined, so it stays at " + pt(c) + "</div>";
        var xs = mine.map(function (i) { return num(pts[i][0]); }).join(" + ");
        var ys = mine.map(function (i) { return num(pts[i][1]); }).join(" + ");
        return '<div class="kmw-eq">' + head + "((" + xs + ")/" + mine.length + ", (" + ys + ")/" + mine.length + ") = <b>(" +
               f2(c[0]) + ", " + f2(c[1]) + ")</b></div>";
      }).join("");
    }
    function distTable() {
      var rows = S.dists ? D().pts.map(function (p, i) {
        var l = S.newLabels ? S.newLabels[i] : (S.labels ? S.labels[i] : null);
        var done = l !== null && l !== undefined;
        if (!done) return '<tr class="todo"><td>' + (i + 1) + "</td><td>" + pt(p) + "</td>" + S.centers.map(function () { return "<td></td>"; }).join("") + "<td></td></tr>";
        return "<tr" + (i === S.last ? ' class="now"' : "") + "><td>" + (i + 1) + "</td><td>" + pt(p) + "</td>" +
          S.dists[i].map(function (v, k) { return '<td class="' + (k === l ? "kmw-near" : "") + '">' + f2(v) + "</td>"; }).join("") +
          '<td><b style="color:' + COLS[l] + '">C' + (l + 1) + "</b>" +
          (S.iter === 1 && SEEDS.indexOf(i) >= 0 ? " (start)" : "") + "</td></tr>";
      }).join("") : "";
      return '<table class="kmw-t"><tr><th>Point</th><th>(X1, X2)</th>' +
        S.centers.map(function (_, k) { return "<th>to C" + (k + 1) + "</th>"; }).join("") + "<th>Joins</th></tr>" + rows + "</table>";
    }

    function renderDetail() {
      var d = D(), html = "";
      if (d.byHand) {
        if ((S.phase === "assign" || S.phase === "move") && S.last >= 0 && S.dists && !S.moved) {
          html += '<div class="kmw-work">' + workDist(S.last) +
                  (S.upd && S.iter === 1 ? '<div class="kmw-mv">' + workMean(S.upd.k, S.newLabels || S.labels) + "</div>" : "") + "</div>" + distTable();
        } else if (S.phase === "assign" && S.dists && S.newLabels && !S.moved) {
          html += '<div class="kmw-work"><div class="kmw-eq"><b style="color:' + COLS[0] + '">C1</b> = point 1 = (1, 1) &nbsp; &nbsp; ' +
                  '<b style="color:' + COLS[1] + '">C2</b> = point 4 = (5, 7)</div></div>' + distTable();
        } else if (S.moved) {
          html += '<div class="kmw-work"><div class="kmw-wh">New center = the mean of its points</div>' + workMean(undefined, S.labels) + "</div>";
        }
      } else if (S.labels) {
        var cnt = S.centers.map(function () { return 0; });
        S.labels.forEach(function (l) { cnt[l]++; });
        html += '<div class="kmw-sizes">' + cnt.map(function (v, k) {
          return '<span style="background:' + COLS[k] + '">C' + (k + 1) + ": " + v + "</span>"; }).join("") + "</div>";
      }
      if (S.log.length) {
        html += '<div class="kmw-in"><b>Inertia</b> (within-cluster sum of squares): ' +
          S.log.map(function (e, j) { return '<span class="' + (j === S.log.length - 1 ? "last" : "") + '" title="' + e.what + '">' + f1(e.v) + "</span>"; })
               .join(" &rarr; ") + "</div>";
      }
      detail.innerHTML = html;
    }

    function render() {
      var d = D();
      bAssign.innerHTML = d.byHand ? "<b>1</b> Assign Next Point" : "<b>1</b> Assign";
      var next = { pick: bPick, assign: bAssign, move: bMove, done: null }[S.phase];
      [bPick, bAssign, bMove].forEach(function (b) { b.classList.toggle("next", b === next); });
      bAssign.disabled = S.phase !== "assign";
      bMove.disabled = S.phase !== "move";
      bRest.disabled = !(S.phase === "assign" && d.byHand);
      bRest.style.display = d.byHand ? "" : "none";
      bRun.disabled = S.phase === "done";
      hint.textContent = S.phase === "done" ? "Done. Reset to start again." : "";
      status.innerHTML = (S.iter ? "<b>Round " + S.iter + ".</b> " : "") + (S.msg || "Step 0: pick the two starting centers.");
      draw();
      renderDetail();
    }

    function on(btn, fn) {
      btn.addEventListener("click", function (ev) { ev.stopPropagation(); fn(); btn.blur(); render(); });
    }
    on(bPick, pick);
    on(bAssign, function () { if (S.phase === "assign") { if (D().byHand) assignOne(); else assignRest(); } });
    on(bRest, function () { if (S.phase === "assign") assignRest(); });
    on(bMove, function () { if (S.phase === "move") move(); });
    on(bRun, runToEnd);
    on(bReset, function () { reset(); });

    render();
  }

  function init() {
    document.querySelectorAll(".remark-slides-area .km-widget").forEach(function (root) {
      if (!root.dataset.mounted) { root.dataset.mounted = "1"; mount(root); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  setTimeout(init, 500);
})();
