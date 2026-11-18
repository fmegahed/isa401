// The naive way to count pairs: one counter box per pair of items, all kept in main memory. Five items make
// 10 pairs and fit easily; a store with 100,000 items makes about 5 billion pairs, the room bursts at 20 GB.
// Class 25 deck, slide "Naive Approach to Counting Frequent Itemsets". Load after stick.js.
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, legs, walkSeg, fig, inkFill, rr, ln, text, seg, breathe, pulse, sparks, bubble, pill, lerp } = R;

  const ROOM = { l: -22, r: 166, top: -128 };
  const COLS = 8, ROWS = 5, BW = 21, BH = 22;
  const SLOT = (i) => [ROOM.l + 8 + (i % COLS) * (BW + 2) + BW / 2, -3 - Math.floor(i / COLS) * (BH + 2)];   // bottom centre
  const PAIRS = ['M·C', 'M·P', 'M·B', 'M·J', 'C·P', 'C·B', 'C·J', 'P·B', 'P·J', 'B·J'];
  const PILE = [[18, -128], [42, -129], [66, -128], [90, -128], [114, -129], [138, -128], [30, -152], [55, -153], [80, -152], [105, -153]];
  const HOME = -150, AT = -62, BACK = -100;
  const BOARD = { x: -210, y: -186, w: 116, h: 54 };
  const READY = P({ hF: [20, -76], hB: [-3, -55], head: [8, -114], chest: [3, -90] });   // a box in hand
  const FLICK = P({ hF: [30, -90], hB: [-3, -55], head: [8, -114], chest: [3, -90] });   // a small toss toward the room
  const BOX_T = (i) => 0.8 + i * 0.2;                                                    // the ten labelled pairs land one per flick
  const SWITCH = 2.85;                                                                   // the store goes to 100,000 items

  const comma = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function bytes(b) {
    if (b < 1e3) return Math.round(b) + ' B';
    if (b < 1e6) return (b / 1e3).toFixed(0) + ' KB';
    if (b < 1e9) return (b / 1e6).toFixed(0) + ' MB';
    return (b / 1e9).toFixed(0) + ' GB';
  }
  function room(g, bulge, shake, t) {
    const L = ROOM.l, Rr = ROOM.r, Tp = ROOM.top, j = shake * Math.sin(t * 28) * 1.2;
    g.beginPath();
    g.moveTo(L, 0);
    g.quadraticCurveTo(L - bulge * 26 + j, Tp / 2, L, Tp);
    g.lineTo(Rr, Tp);
    g.quadraticCurveTo(Rr + bulge * 26 - j, Tp / 2, Rr, 0);
    inkFill(g, C.floor, 2.2);
    text(g, 'main memory', (L + Rr) / 2, 17, 9, C.muted);   // on the floor in front, so the pile never covers it
  }
  function box(g, x, y, k, label, tilt) {   // (x, y) = bottom centre; k = pop-in
    if (k <= 0.01) return;
    const z = E.back(Math.min(1, k));
    g.save();
    g.translate(x, y - BH / 2);
    g.rotate(tilt || 0);
    g.scale(z, z);
    rr(g, -BW / 2, -BH / 2, BW, BH, 2.5); inkFill(g, C.butterSoft, 1.2);
    if (label) text(g, label, 0, 3, 7, C.umber);
    else { ln(g, -6, -2, 6, -2, 1.3, '#d4b26a'); ln(g, -6, 3, 3, 3, 1.3, '#d4b26a'); }
    g.restore();
  }
  function readout(g, items, pairs, mem, hot) {
    rr(g, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 5); inkFill(g, C.paper, 1.6);
    const row = (i, k, v, col) => { text(g, k, BOARD.x + 8, BOARD.y + 15 + i * 15, 8.5, C.muted, 'left'); text(g, v, BOARD.x + BOARD.w - 8, BOARD.y + 15 + i * 15, 9, col || C.ink, 'right'); };
    row(0, 'items', items, hot ? C.redInk : C.ink);
    row(1, 'pairs', pairs);
    row(2, 'memory', mem, hot ? C.redInk : C.ink);
  }

  SC['counter-room'] = {
    dur: 7.7,
    width: 430,
    label: 'A stick figure tosses one counter box per pair of items into a room marked main memory. Five items make 10 pairs and fit. With 100,000 items the pairs climb to about five billion, the boxes pile over the walls, and the room bursts at 20 gigabytes.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let x = HOME, sx = 1, gait = { ph: 0, amp: 0 };
      let pose = breathe(P({ hF: [12, -60], hB: [-4, -52] }), t);
      let nBoxes = 0, popK = [], bulge = 0, shake = 0, pileK = 0, sayK = 0, fadeAll = 1;
      let items = '5', pairs = '0', mem = '0 B', hot = false, fly = null;
      if (T < 0) {
        pose = mix(pose, P({ hF: [10, -96], head: [7, -116], hB: [-4, -54] }), pulse(t, 5.5, 2, 2.2));
      } else {
        const fade = 1 - seg(T, this.dur - 0.5, this.dur);
        fadeAll = fade;
        const segs = [walkSeg(T, 0, 0.55, HOME, AT), walkSeg(T, 4.65, 5.0, AT, BACK), walkSeg(T, 6.45, 7.15, BACK, HOME)];
        const ws = T < 4.65 ? segs[0] : T < 6.45 ? segs[1] : segs[2];
        x = ws.x;
        gait = ws.dir * sx < 0 ? { ph: -ws.ph, amp: ws.amp, stride: ws.stride } : ws;
        // tossing: small flicks, one per box at first, a little faster once the store has 100,000 items.
        // The phase accumulates, so the change of pace never makes the hand jump.
        const on = E.soft(seg(T, 0.6, 0.8)) * (1 - E.soft(seg(T, 4.35, 4.6)));
        const ph = 2 * Math.PI * (5 * (Math.min(T, SWITCH) - 0.6) + 5.5 * Math.max(0, T - SWITCH));
        pose = mix(pose, READY, on);
        pose = mix(pose, FLICK, (0.5 - 0.5 * Math.cos(ph)) * on);
        // boxes: ten labelled pairs for 5 items, then the room fills
        const n1 = PAIRS.filter((_, i) => T >= BOX_T(i)).length;
        const n2 = Math.floor(lerp(0, COLS * ROWS - 10, E.in(seg(T, 3.0, 4.4))));
        nBoxes = Math.min(COLS * ROWS, n1 + n2);
        for (let i = 0; i < nBoxes; i++) popK[i] = i < 10 ? seg(T, BOX_T(i) + 0.14, BOX_T(i) + 0.32) : 1;
        if (n1 > 0 && n1 <= 10 && T < BOX_T(n1 - 1) + 0.16) fly = { i: n1 - 1, k: seg(T, BOX_T(n1 - 1), BOX_T(n1 - 1) + 0.16) };
        // the readout
        if (T < SWITCH) { items = '5'; pairs = String(n1); mem = bytes(4 * n1); }
        else {
          hot = true; items = '100,000';
          const k = E.in(seg(T, 3.0, 4.4)), p = 10 * Math.pow(4999950000 / 10, k);
          pairs = comma(p); mem = bytes(4 * p);
        }
        // overflow: the pile, the bulge, the startle
        pileK = seg(T, 4.15, 4.75);
        bulge = E.soft(seg(T, 4.25, 4.75)) * fade;
        shake = seg(T, 4.35, 4.55) * (1 - seg(T, 5.7, 6.1));
        const whoa = E.soft(seg(T, 4.55, 4.95)) * (1 - E.soft(seg(T, 5.8, 6.25)));
        pose = mix(pose, P({ hF: [18, -110], hB: [9, -106], head: [-4, -118], chest: [-3, -90] }), whoa);
        sayK = seg(T, 4.95, 5.15) * (1 - seg(T, 6.0, 6.2));
        if (fade < 1) { items = '5'; pairs = '0'; mem = '0 B'; hot = false; }
      }
      pose = legs(pose, gait.ph, gait.amp, { arms: false, stride: gait.stride });

      readout(g, items, pairs, mem, hot);
      room(g, bulge, shake, t);
      g.save(); g.globalAlpha *= fadeAll;
      for (let i = 0; i < nBoxes; i++) {
        const [bx, by] = SLOT(i), wob = bulge * Math.sin(i * 1.7) * 0.06;
        box(g, bx + bulge * ((bx - (ROOM.l + ROOM.r) / 2) / 90) * 10, by, popK[i], i < 10 ? PAIRS[i] : null, wob);
      }
      PILE.forEach(([px, py], i) => box(g, px, py, seg(pileK, i / PILE.length * 0.6, i / PILE.length * 0.6 + 0.4), null, ((i * 37) % 11 - 5) * 0.03));
      g.restore();
      const J = fig(g, pose, x, 0, { sx, wave: S.wave, wt: S.wt });
      if (fly && J && J.w && J.w.handF) {
        const [tx, ty] = SLOT(fly.i), p = R.arcPt([J.w.handF[0], J.w.handF[1] - 4], [tx, ty - BH / 2], 30, E.soft(fly.k));
        g.save(); g.translate(p[0], p[1]); g.rotate(fly.k * 3); rr(g, -8, -8, 16, 16, 2); inkFill(g, C.butterSoft, 1.1); g.restore();
      }
      sparks(g, ROOM.r - 6, ROOM.top + 4, seg(T, 4.45, 5.05), 16, 7, C.redInk);
      bubble(g, x + 44, -122, '20 GB?!', sayK, { tail: -36, size: 9.5 });
    },
  };
})();
