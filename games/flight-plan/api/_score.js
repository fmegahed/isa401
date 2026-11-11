// Pure scoring for Flight Plan: photo coordinates to inches, one team's score under a rule, and the
// ranking. Distances are always computed here, never by a model. A miss is never distance 0 (Fadel,
// Nov 10): each miss rule either adds a real distance, drops the throw, or sends the team to the bottom.
const SUMMARIES = ["average", "median", "closest", "farthest", "hit_rate", "spread"];
const MISS_RULES = ["fixed_penalty", "worst_landed", "dropped", "automatic_last"];

function lowerIsBetter(summary) { return summary !== "hit_rate"; }

// marks: [{team, x, y}] and X: {cx, cy, lx, ly, rx, ry}, all as fractions of the image (0..1).
// The X's arm tips (lx,ly)-(rx,ry) are xWidthIn inches apart; that sets the scale.
function toInches(marks, X, imgW, imgH, xWidthIn) {
  const pxW = Math.hypot((X.rx - X.lx) * imgW, (X.ry - X.ly) * imgH);
  const perIn = pxW / (Number(xWidthIn) || 1);
  const out = {};
  for (const m of marks || []) {
    if (!out[m.team]) out[m.team] = [];
    out[m.team].push({ dx: ((m.x - X.cx) * imgW) / perIn, dy: ((m.y - X.cy) * imgH) / perIn });
  }
  return out;
}
function pxPerInch(X, imgW, imgH, xWidthIn) {
  return Math.hypot((X.rx - X.lx) * imgW, (X.ry - X.ly) * imgH) / (Number(xWidthIn) || 1);
}

const dist = (p) => Math.hypot(p.dx, p.dy);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
function median(a) {
  const s = [...a].sort((x, y) => x - y), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
function summarize(list, summary) {
  if (summary === "average") return mean(list);
  if (summary === "median") return median(list);
  if (summary === "closest") return Math.min(...list);
  return Math.max(...list);   // farthest
}

// points: landed throws [{dx, dy}] in inches; misses: throws that missed the board.
// rule: {summary, miss, penaltyIn, hitN}. Returns {score, landed, closest, last}; last forces the bottom.
function teamScore(points, misses, rule) {
  const summary = rule.summary || "average";
  const miss = rule.miss || "dropped";
  const penalty = Number(rule.penaltyIn) || 48;
  const hitN = Number(rule.hitN) || 6;
  const d = (points || []).map(dist);
  const m = Math.max(0, Number(misses) || 0);
  const closest = d.length ? Math.min(...d) : null;
  const base = { landed: d.length, closest, last: false, score: null };
  if (miss === "automatic_last" && m > 0) base.last = true;

  if (summary === "spread") {
    if (d.length < 2) return Object.assign(base, { last: true });
    const cx = mean(points.map((p) => p.dx)), cy = mean(points.map((p) => p.dy));
    return Object.assign(base, { score: mean(points.map((p) => Math.hypot(p.dx - cx, p.dy - cy))) });
  }

  // The distance list after the miss rule.
  let list;
  if (miss === "fixed_penalty") list = d.concat(Array(m).fill(penalty));
  else if (miss === "worst_landed") {
    if (m > 0 && !d.length) return Object.assign(base, { last: true });
    list = d.concat(Array(m).fill(d.length ? Math.max(...d) : 0));
  } else list = d;   // dropped, or automatic_last (scored on landed throws to order the last group)
  if (!list.length) return Object.assign(base, { last: true });

  if (summary === "hit_rate") {
    if (miss === "dropped") return Object.assign(base, { score: d.filter((x) => x <= hitN).length / d.length });
    const total = miss === "automatic_last" ? d.length + m : list.length;
    return Object.assign(base, { score: list.filter((x) => x <= hitN).length / total });
  }
  return Object.assign(base, { score: summarize(list, summary) });
}

// A miss must never beat a throw that landed (review, Nov 10): the fixed penalty is raised to just
// beyond the farthest landed throw of any team.
function effectivePenalty(entries, penaltyIn) {
  let far = 0;
  for (const e of entries || []) for (const p of e.points || []) far = Math.max(far, dist(p));
  return Math.max(Number(penaltyIn) || 48, Math.ceil(far) + 1);
}

// entries: [{team, points, misses}] -> [{team, score, rank, closest, last}] best first.
function rankTeams(entries, rule) {
  const low = lowerIsBetter(rule.summary || "average");
  if (rule.miss === "fixed_penalty") rule = Object.assign({}, rule, { penaltyIn: effectivePenalty(entries, rule.penaltyIn) });
  const rows = (entries || []).map((e) => Object.assign({ team: e.team, misses: Math.max(0, Number(e.misses) || 0) }, teamScore(e.points, e.misses, rule)));
  const worst = low ? Infinity : -Infinity;
  const sc = (r) => (r.score == null ? worst : r.score);
  const cl = (r) => (r.closest == null ? Infinity : r.closest);
  // Spread cannot place a miss on the board, so unless misses are dropped, fewer misses rank first.
  const missFirst = rule.summary === "spread" && rule.miss !== "dropped";
  rows.sort((a, b) =>
    (a.last - b.last) ||
    (missFirst ? a.misses - b.misses : 0) ||
    (low ? sc(a) - sc(b) : sc(b) - sc(a)) ||
    (cl(a) - cl(b)) ||
    (a.team < b.team ? -1 : a.team > b.team ? 1 : 0));
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    r.rank = p && p.last === r.last && (!missFirst || p.misses === r.misses) && sc(p) === sc(r) && cl(p) === cl(r) ? p.rank : i + 1;
  });
  return rows;
}

// The ranking under every summary, keeping the locked miss rule. {summary: [{team, rank, score}]}
function whatIf(entries, rule) {
  const out = {};
  for (const summary of SUMMARIES) {
    out[summary] = rankTeams(entries, Object.assign({}, rule, { summary }))
      .map((r) => ({ team: r.team, rank: r.rank, score: r.score, last: r.last }));
  }
  return out;
}

module.exports = { SUMMARIES, MISS_RULES, lowerIsBetter, toInches, pxPerInch, teamScore, rankTeams, whatIf, effectivePenalty };
