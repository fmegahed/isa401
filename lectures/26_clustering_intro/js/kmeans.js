// k-means math for the Class 26 widget: assign, move, inertia, zscore.
// Works in the browser (window.KM) and in Node (module.exports) so tests/kmeans.test.mjs can check it.
(function (root) {
  function dist(a, b) {
    let s = 0;
    for (let j = 0; j < a.length; j++) s += (a[j] - b[j]) ** 2;
    return Math.sqrt(s);
  }

  // Step 1: each point joins its nearest center (a tie goes to the lower-numbered center).
  function assign(points, centers) {
    const dists = points.map(p => centers.map(c => dist(p, c)));
    const labels = dists.map(d => {
      let best = 0;
      for (let k = 1; k < d.length; k++) if (d[k] < d[best] - 1e-12) best = k;
      return best;
    });
    return { labels, dists };
  }

  // Step 2: each center moves to the mean of its group; a center with no points stays where it is.
  function move(points, labels, centers) {
    return centers.map((c, k) => {
      const mine = points.filter((_, i) => labels[i] === k);
      if (mine.length === 0) return c.slice();
      return c.map((_, j) => mine.reduce((s, p) => s + p[j], 0) / mine.length);
    });
  }

  // Inertia (within-cluster sum of squares).
  function inertia(points, labels, centers) {
    return points.reduce((s, p, i) => s + dist(p, centers[labels[i]]) ** 2, 0);
  }

  // Column z-scores with the sample sd, as R's scale().
  function zscore(rows) {
    const n = rows.length, m = rows[0].length;
    const mean = [], sd = [];
    for (let j = 0; j < m; j++) {
      mean[j] = rows.reduce((s, r) => s + r[j], 0) / n;
      sd[j] = Math.sqrt(rows.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / (n - 1));
    }
    return rows.map(r => r.map((v, j) => (v - mean[j]) / sd[j]));
  }

  const KM = { dist, assign, move, inertia, zscore };
  if (typeof module !== "undefined" && module.exports) module.exports = KM;
  else root.KM = KM;
})(typeof window !== "undefined" ? window : this);
