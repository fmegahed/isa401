// The itemset lattice as a flat picture, for the Class 25 deck's A-Priori slide.
// Each of the 31 itemsets of the 8 activity baskets is a chip that looks like a row of the basket grid: a dot in
// the item's colour (the deck's colours) for each item it holds. One row per size: single items at the bottom, all
// five at the top. "next pass" walks A-Priori (or counting everything) one pass at a time, at any support s.
// Hovering a chip draws lines to the sets just below and just above it. Plain JavaScript and SVG, no libraries.
// Markup: <div class="itemset-lattice" data-s="3" data-note="..."></div>  (data-s: the threshold it starts at)
// Node: require('./lattice.js').count(baskets, items, s, mode) is the counting logic, for the tests.
(function (root) {
  'use strict';

  const ITEMS = ['Milk', 'Coke', 'Pepsi', 'Beer', 'Juice'];
  const BASKETS = [['Milk', 'Coke', 'Beer'], ['Milk', 'Pepsi', 'Juice'], ['Milk', 'Beer'], ['Coke', 'Juice'], ['Milk', 'Pepsi', 'Beer'],
    ['Milk', 'Coke', 'Beer', 'Juice'], ['Coke', 'Beer', 'Juice'], ['Coke', 'Beer']];
  const COLOR = { Milk: '#0072B2', Coke: '#CC79A7', Pepsi: '#56B4E9', Beer: '#E69F00', Juice: '#D55E00' };
  const LEVEL = ['', 'singles', 'pairs', 'triples', 'sets of 4', 'sets of 5'];
  const LEVEL1 = ['', 'single', 'pair', 'triple', 'set of 4', 'set of 5'];   // for a count of 1

  // ---------------------------------------------------------------- counting (pure)
  // mode 'apriori': a k-itemset is counted in pass k only if every (k-1)-subset was frequent.
  // mode 'naive': every itemset is counted. Either way, frequent = counted and support >= s.
  function count(baskets, items, s, mode) {
    const n = items.length, sets = [], byMask = {};
    for (let m = 1; m < 1 << n; m++) {
      const its = items.filter((_, i) => m & (1 << i));
      const set = { mask: m, items: its, k: its.length, support: baskets.filter((b) => its.every((x) => b.includes(x))).length,
        counted: false, frequent: false, pass: null };
      sets.push(set); byMask[m] = set;
    }
    sets.sort((a, b) => a.k - b.k || a.mask - b.mask);
    const passes = [];
    for (let k = 1; k <= n; k++) {
      const level = sets.filter((x) => x.k === k);
      const cands = mode === 'naive' ? level : level.filter((x) => k === 1 || subsetsFrequent(x, byMask, items));
      if (k > 1 && mode !== 'naive' && !cands.length) { passes.push({ k, candidates: 0, frequent: 0 }); break; }
      cands.forEach((x) => { x.counted = true; x.pass = k; x.frequent = x.support >= s; });
      passes.push({ k, candidates: cands.length, frequent: cands.filter((x) => x.frequent).length });
    }
    return { sets, passes, counted: sets.filter((x) => x.counted).length, frequent: sets.filter((x) => x.frequent).length, s, mode };
  }
  function subsetsFrequent(x, byMask, items) {
    for (let i = 0; i < items.length; i++) {
      const bit = 1 << i;
      if (!(x.mask & bit)) continue;
      const sub = byMask[x.mask & ~bit];
      if (!sub || !sub.frequent) return false;
    }
    return true;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { count, ITEMS, BASKETS };
  }
  if (typeof document === 'undefined') return;

  // ---------------------------------------------------------------- the picture
  const W = 710, H = 312;                      // SVG units = CSS pixels at the widget's 960 px width
  const X0 = 76, X1 = 702;                     // chips sit between the row labels and the right edge
  const ROW_Y = [0, 270, 211, 152, 93, 34];    // chip centres by size: singles at the bottom
  const CW = 56, CH = 22, DOT = 10;            // a chip, and the gap between its five item slots
  const NS = 'http://www.w3.org/2000/svg';

  const CSS = `
  .il { display:grid; grid-template-columns:minmax(0,1fr) 250px; background:#fbfaf6; border:1px solid #e3dfd3; border-radius:10px; overflow:hidden; color:#1b1b1b; user-select:none; }
  .il-svg { display:block; width:100%; height:auto; }
  .il-svg text { font-family:inherit; }
  .il-rowlab { font-size:12.5px; fill:#9a948a; }
  .il-name { font-size:14px; font-weight:700; }
  .il-chip { transition:opacity .35s; }
  .il-chip .body { fill:#fff; stroke:#cfcac0; stroke-width:1.2; transition:fill .35s, stroke .35s; }
  .il-chip.freq .body { fill:#EFDB72; stroke:#c3142d; stroke-width:2; }
  .il-chip.rare .body { stroke:#8f8778; stroke-width:1.4; }
  .il-chip.skipped { opacity:.16; }
  .il-chip.skipped .body { stroke-dasharray:3 2; }
  .il-chip .x { display:none; stroke:#c3142d; stroke-width:2.2; stroke-linecap:round; }
  .il-chip.rare .x { display:inline; }
  .il-chip .sup { display:none; font-size:12.5px; font-weight:700; fill:#8f8778; }
  .il-chip.freq .sup, .il-chip.rare .sup { display:inline; }
  .il-chip.freq .sup { fill:#c3142d; }
  .il-links line { stroke:#585E60; stroke-width:1.3; }
  .il-side { border-left:1px solid #ece8de; padding:12px 14px 10px 16px; font-size:14px; line-height:1.4; color:#585E60; display:flex; flex-direction:column; gap:9px; }
  .il-big { font-size:40px; font-weight:700; line-height:1; color:#1b1b1b; }
  .il-big .of { font-size:18px; font-weight:400; color:#9a948a; }
  .il-lab { font-size:13px; color:#9a948a; margin-top:-4px; }
  .il-fr b { color:#c3142d; font-size:18px; }
  .il-passes div { white-space:nowrap; font-size:13px; }
  .il-passes .hd { color:#9a948a; }
  .il-passes .now { color:#c3142d; font-weight:700; }
  .il-passes .wait { color:#b3ad9f; }
  .il-key { display:grid; gap:3px; font-size:13px; }
  .il-key div { display:flex; align-items:center; gap:7px; }
  .il-key .il-chip.skipped { opacity:.45; }
  .il-note { margin-top:auto; border-top:1px solid #ece8de; padding-top:7px; font-size:12.5px; color:#9a948a; }
  .il-note b { color:#1b1b1b; white-space:nowrap; }
  .il-ctl { grid-column:1 / span 2; display:flex; align-items:center; gap:10px; padding:8px 12px 9px; border-top:1px solid #ece8de; font-size:14px; color:#585E60; white-space:nowrap; }
  .il-ctl button { font:inherit; font-size:14px; background:#fff; border:1px solid #d6d1c4; border-radius:6px; padding:4px 12px; cursor:pointer; color:#1b1b1b; }
  .il-ctl button.on { background:#1b1b1b; color:#fbfaf6; border-color:#1b1b1b; }
  .il-ctl button.red { background:#c3142d; border-color:#c3142d; color:#fff; min-width:96px; }
  .il-ctl input[type=range] { width:120px; accent-color:#c3142d; }
  .il-ctl .sv { font-weight:700; color:#c3142d; min-width:1em; display:inline-block; }
  @media (prefers-reduced-motion: reduce) { .il-chip, .il-chip .body { transition:none; } }
  `;
  function ensureStyle() {
    if (document.getElementById('il-css')) return;
    const st = document.createElement('style'); st.id = 'il-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  const svgEl = (tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== undefined) e.textContent = text;
    return e;
  };
  // a chip's outline, item slots and cross, drawn around (0, 0)
  function chipShapes(g, items) {
    g.appendChild(svgEl('rect', { class: 'body', x: -CW / 2, y: -CH / 2, width: CW, height: CH, rx: 6 }));
    ITEMS.forEach((it, i) => {
      const x = (i - 2) * DOT;
      g.appendChild(items.includes(it) ? svgEl('circle', { cx: x, cy: 0, r: 4.3, fill: COLOR[it] }) : svgEl('circle', { cx: x, cy: 0, r: 1.6, fill: '#d9d4c8' }));
    });
    g.appendChild(svgEl('path', { class: 'x', d: `M${-CW / 2 + 4} ${-CH / 2 + 3} L${CW / 2 - 4} ${CH / 2 - 3} M${CW / 2 - 4} ${-CH / 2 + 3} L${-CW / 2 + 4} ${CH / 2 - 3}` }));
  }
  // rows in the usual order (Milk first), centred, spaced so chips never touch
  function layout() {
    const pos = {}, combos = [];
    for (let m = 1; m < 1 << ITEMS.length; m++) combos.push(ITEMS.filter((_, i) => m & (1 << i)));
    const key = (its) => its.map((x) => ITEMS.indexOf(x));
    for (let k = 1; k <= ITEMS.length; k++) {
      const row = combos.filter((c) => c.length === k).sort((a, b) => {
        const A = key(a), B = key(b); for (let i = 0; i < k; i++) if (A[i] !== B[i]) return A[i] - B[i]; return 0; });
      const sp = Math.min(126, (X1 - X0) / row.length), cx = (X0 + X1) / 2;
      row.forEach((c, j) => { pos[c.join(',')] = { x: cx + (j - (row.length - 1) / 2) * sp, y: ROW_Y[k], items: c, k }; });
    }
    return pos;
  }
  const keyOf = (items) => ITEMS.filter((x) => items.includes(x)).join(',');

  // ---------------------------------------------------------------- one widget
  function mount(el) {
    if (el.__il) return;
    ensureStyle();
    const S = { s: Number(el.dataset.s) || 3, mode: 'apriori', step: 0 };
    el.classList.add('il');
    el.innerHTML = `
      ${el.dataset.made ? `<div class="made-for il-made">${el.dataset.made}</div>` : ''}
      <svg class="il-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="The 31 itemsets of the 8 baskets, one row per size, single items at the bottom; frequent ones in gold"></svg>
      <div class="il-side">
        <div><div class="il-big"><span class="n">0</span> <span class="of">of 31</span></div><div class="il-lab">itemsets counted</div></div>
        <div class="il-fr"></div>
        <div class="il-passes"></div>
        <div class="il-key"></div>
        ${el.dataset.note ? `<div class="il-note">${el.dataset.note}</div>` : ''}
      </div>
      <div class="il-ctl">
        <button data-m="naive">count everything</button><button data-m="apriori" class="on">A-Priori</button>
        <span>support s</span><input type="range" min="1" max="8" step="1" value="${S.s}" aria-label="support threshold s"><span class="sv">${S.s}</span>
        <button data-a="step" class="red">next pass</button><button data-a="all">all passes</button>
      </div>`;
    const svg = el.querySelector('svg'), slider = el.querySelector('input'), sv = el.querySelector('.sv');
    const stepBtn = el.querySelector('button[data-a=step]');

    // the picture: row labels, item names, then the chips (lines for a hovered chip go underneath)
    const pos = layout();
    const links = svgEl('g', { class: 'il-links' }); svg.appendChild(links);
    for (let k = 1; k <= ITEMS.length; k++) svg.appendChild(svgEl('text', { class: 'il-rowlab', x: 6, y: ROW_Y[k] + 4 }, k === 1 ? 'singles' : k === 2 ? 'pairs' : k === 3 ? 'triples' : `${k} items`));
    const chips = {};
    Object.entries(pos).forEach(([key, p]) => {
      const g = svgEl('g', { class: 'il-chip', 'data-set': key, transform: `translate(${p.x.toFixed(1)},${p.y})` });
      chipShapes(g, p.items);
      g.appendChild(svgEl('text', { class: 'sup', x: 0, y: -CH / 2 - 4, 'text-anchor': 'middle' }, ''));
      g.addEventListener('mouseenter', () => showLinks(key));
      g.addEventListener('mouseleave', () => { links.textContent = ''; });
      svg.appendChild(g); chips[key] = g;
      if (p.k === 1) svg.appendChild(svgEl('text', { class: 'il-name', x: p.x.toFixed(1), y: p.y + CH / 2 + 18, 'text-anchor': 'middle', fill: COLOR[p.items[0]] }, p.items[0]));
    });
    function showLinks(key) {
      links.textContent = '';
      const me = pos[key];
      Object.values(pos).forEach((q) => {
        const sub = q.k === me.k - 1 && q.items.every((x) => me.items.includes(x));
        const sup = q.k === me.k + 1 && me.items.every((x) => q.items.includes(x));
        if (!sub && !sup) return;
        const y1 = me.y + (sub ? CH / 2 : -CH / 2), y2 = q.y + (sub ? -CH / 2 : CH / 2);
        links.appendChild(svgEl('line', { x1: me.x.toFixed(1), y1, x2: q.x.toFixed(1), y2 }));
      });
    }

    // the key, drawn with the same chips
    const keyBox = el.querySelector('.il-key');
    [['freq', 'frequent'], ['rare', 'counted, too rare'], ['skipped', 'never counted']].forEach(([cls, label]) => {
      const row = document.createElement('div');
      const s = svgEl('svg', { width: 36, height: 16, viewBox: `${-CW / 2 - 2} ${-CH / 2 - 2} ${CW + 4} ${CH + 4}` });
      const g = svgEl('g', { class: `il-chip ${cls}` }); chipShapes(g, ['Milk', 'Beer']); s.appendChild(g);
      row.appendChild(s); row.appendChild(document.createTextNode(label)); keyBox.appendChild(row);
    });

    // keep remark's keys and swipes away from the controls, and give the keys back after a click
    ['keydown', 'keyup', 'keypress'].forEach((t) => el.addEventListener(t, (e) => { if (e.target !== el) e.stopPropagation(); }));
    ['touchstart', 'touchmove', 'touchend'].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));

    let R = count(BASKETS, ITEMS, S.s, S.mode);
    // after a change of mode or s, a finished run stays finished; a run in progress keeps its pass
    function recount() {
      const done = S.step >= R.passes.length;
      R = count(BASKETS, ITEMS, S.s, S.mode);
      S.step = done ? R.passes.length : Math.min(S.step, R.passes.length);
      draw();
    }
    el.querySelectorAll('button[data-m]').forEach((b) => b.addEventListener('click', () => {
      S.mode = b.dataset.m; el.querySelectorAll('button[data-m]').forEach((x) => x.classList.toggle('on', x === b)); b.blur(); recount(); }));
    stepBtn.addEventListener('click', () => { S.step = S.step >= R.passes.length ? 0 : S.step + 1; stepBtn.blur(); draw(); });
    el.querySelector('button[data-a=all]').addEventListener('click', (e) => { S.step = R.passes.length; e.currentTarget.blur(); draw(); });
    slider.addEventListener('input', () => { S.s = Number(slider.value); sv.textContent = S.s; recount(); });
    slider.addEventListener('change', () => slider.blur());
    // a click on the thumb without a drag fires no change event: let go of the slider anyway, so the arrow keys
    // and the clicker move slides again
    slider.addEventListener('pointerup', () => setTimeout(() => slider.blur(), 0));

    function draw() {
      const done = S.step >= R.passes.length;
      let counted = 0, frequent = 0;
      R.sets.forEach((x) => {
        const g = chips[keyOf(x.items)];
        const reached = done || x.k <= S.step;
        const shown = x.counted && (done || x.pass <= S.step);
        const state = !reached ? 'waiting' : shown ? (x.frequent ? 'freq' : 'rare') : 'skipped';
        g.setAttribute('class', `il-chip ${state}`);
        g.querySelector('.sup').textContent = shown ? x.support : '';
        if (shown) { counted++; if (x.frequent) frequent++; }
      });
      el.querySelector('.il-big .n').textContent = counted;
      el.querySelector('.il-fr').innerHTML = `<b>${frequent}</b> frequent<br>support &ge; ${S.s} basket${S.s === 1 ? '' : 's'}`;
      const shownPasses = R.passes.slice(0, S.step);
      const lines = shownPasses.map((p, i) => {
        const what = p.candidates === 0 ? `no ${LEVEL[p.k]} to count` : `${p.candidates} ${(p.candidates === 1 ? LEVEL1 : LEVEL)[p.k]} &rarr; ${p.frequent} frequent`;
        return `<div class="${i === shownPasses.length - 1 ? 'now' : ''}">pass ${p.k} &middot; ${what}</div>`;
      });
      el.querySelector('.il-passes').innerHTML = `<div class="hd">${S.mode === 'naive' ? 'count everything' : 'A-Priori'}</div>` +
        (lines.length ? lines.join('') : '<div class="wait">nothing counted yet</div>');
      stepBtn.textContent = done ? 'start over' : 'next pass';
    }
    draw();
    el.__il = S;
  }

  function mountAll() { document.querySelectorAll('.itemset-lattice').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
  // remark builds slides after load; xaringanExtra's tile view clones them: look again now and then
  let tries = 0;
  const again = setInterval(() => { mountAll(); if (++tries > 20) clearInterval(again); }, 500);
  root.ITEMSET_LATTICE = { mount, mountAll, count };
})(typeof window !== 'undefined' ? window : globalThis);
