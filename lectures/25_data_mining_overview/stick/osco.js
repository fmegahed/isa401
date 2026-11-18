// Osco Drug, 1992: the beer-and-diapers pattern as it was found. A shopper comes in at the entrance with a basket,
// takes milk, looks at the chips and skips them, takes diapers, then a six-pack of beer, and pays at the checkout.
// The register scans the basket and marks diapers and beer in it; the receipt joins the tally, which counts up to
// 1.2 million baskets and shows {diapers, beer} bought together. After the first play the tally stays up.
// (The slide's card says the rest: the famous ending, moving the beer, never happened.)
// Class 25 deck, slide "Association Rule Discovery". Load after stick.js.
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, legs, walkSeg, fig, inkFill, rr, ln, text, seg, breathe, pulse, lp, sparks, tickBadge, circle, pill, poly, arcPt, bubble } = R;

  // ---- layout (world units; ground at 0)
  const SHELVES = [
    { label: 'MILK', kind: 'milk', x0: -204 },
    { label: 'CHIPS', kind: 'chips', x0: -120 },     // the one the shopper looks at and skips
    { label: 'DIAPERS', kind: 'diaper', x0: -36 },
    { label: 'BEER', kind: 'beer', x0: 48 },
  ];
  const SW = 44;                                       // shelf width: two items a row
  const AT = SHELVES.map((s) => s.x0 - 24);           // where the shopper stands to reach each shelf
  const HOME = -250;                                   // the store entrance (idle spot)
  const CO = { x0: 132, x1: 262, top: -46 };           // checkout counter; things sit on its top
  const AT_C = 120, AT_BAG = 180, EXIT = 310, ENTER = -306;
  const BASKET_X = 148;                                // where the basket is set on the counter
  const SCAN = 172, BELT0 = 164;                       // scanner window; items come out of the basket here
  const REG = { x: 220, y: -112, w: 42, h: 40, pole: 241 };
  const BAG_X = 213;
  const BOARD = { x: -110, y: -190, w: 220, h: 62 };
  const PILE = [BOARD.x + 16, BOARD.y + 38];
  const TALLY = [BOARD.x + BOARD.w - 17, BOARD.y + 42];
  const CLOCK = [-244, -166];
  const DIAPER_BAND = '#5b9bd5';
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // ---- timeline (seconds)
  const DUR = 13.5;
  const WALKS = [[0.15, 0.45, HOME, AT[0]], [1.45, 2.0, AT[0], AT[1]], [2.95, 3.5, AT[1], AT[2]], [4.5, 5.05, AT[2], AT[3]],
    [6.05, 6.75, AT[3], AT_C], [9.5, 10.0, AT_C, AT_BAG], [10.6, 11.5, AT_BAG, EXIT], [12.4, 13.3, ENTER, HOME]];
  const PICKS = [{ kind: 'milk', shelf: 0, a: 0.5 }, { kind: 'diaper', shelf: 2, a: 3.55 }, { kind: 'beer', shelf: 3, a: 5.1 }];
  const SKIP = 2.05;                                   // the chips: reach, think better of it, "nah"
  const PUT_T = 7.1;                                   // the basket lands on the counter
  // unloading goes top-down: the beer (last in) rides furthest, then the diapers, then the milk
  const RUNS = { beer: [7.6, 8.05, 228], diaper: [8.0, 8.4, 206], milk: [8.35, 8.7, 188] };
  const crossAt = ([t0, t1, x1]) => t0 + (t1 - t0) * Math.acos(1 - 2 * (SCAN - BELT0) / (x1 - BELT0)) / Math.PI;
  const SCANS = { beer: crossAt(RUNS.beer), diaper: crossAt(RUNS.diaper), milk: crossAt(RUNS.milk) };
  const RESET = [12.4, 12.9];                          // shelves restock, the counter clears

  // ---- products (drawn from their bottom centre)
  function item(g, kind, x, y, a, s) {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); if (s) g.scale(s, s);
    if (kind === 'milk') {
      poly(g, [[-6, -15], [0, -21], [6, -15]], true); inkFill(g, C.paper, 1.3);
      rr(g, -6, -15, 12, 15, 1.5); inkFill(g, C.paper, 1.3);
      rr(g, -4, -11, 8, 6, 1); g.fillStyle = '#cfe3f5'; g.fill();
    } else if (kind === 'chips') {
      rr(g, -8, -18, 16, 18, 3); inkFill(g, '#f4a259', 1.3);
      for (let i = 0; i < 4; i++) ln(g, -7 + i * 4, -18, -5 + i * 4, -16, 1, C.umber);
      circle(g, 0, -8, 3.6); inkFill(g, C.paper, 1);
    } else if (kind === 'diaper') {
      rr(g, -8, -15, 16, 15, 2.5); inkFill(g, C.paper, 1.3);
      ln(g, -6, -8, 6, -8, 2.4, DIAPER_BAND);
    } else {
      rr(g, -10, -13, 20, 13, 2); inkFill(g, C.butterHi, 1.3);
      for (let i = -1; i <= 1; i++) { circle(g, i * 6, -15, 2.4); inkFill(g, C.steel, 1); }
    }
    g.restore();
  }
  function shelves(g, taken) {
    for (const s of SHELVES) {
      const x1 = s.x0 + SW;
      ln(g, s.x0, -98, s.x0, 0, 2.2);
      ln(g, x1, -98, x1, 0, 2.2);
      for (const y of [-98, -48, -4]) { rr(g, s.x0 - 3, y, SW + 6, 5, 1.5); inkFill(g, C.wood, 1.4); }
      pill(g, s.x0 + SW / 2, -112, s.label, C.paper, C.ink, 8.5);
      item(g, s.kind, s.x0 + 11, -48, 1 - (taken[s.kind] || 0));
      item(g, s.kind, s.x0 + 33, -48, 1);
      item(g, s.kind, s.x0 + 11, -4, 1);
      item(g, s.kind, s.x0 + 33, -4, 1);
    }
  }
  // a hand basket hanging from (hx, hy), the top of its handle; what is inside peeks over the rim
  function basket(g, hx, hy, inside, a) {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a;
    g.beginPath(); g.moveTo(hx - 8, hy + 7); g.quadraticCurveTo(hx, hy - 5, hx + 8, hy + 7);
    g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
    [['milk', -6], ['diaper', 0], ['beer', 6]].forEach(([k, dx]) => item(g, k, hx + dx, hy + 15, inside[k] || 0, 0.6));
    poly(g, [[hx - 11, hy + 7], [hx + 11, hy + 7], [hx + 9, hy + 20], [hx - 9, hy + 20]], true); inkFill(g, C.wood, 1.5);
    ln(g, hx - 10, hy + 12, hx + 10, hy + 12, 1, C.woodDk); ln(g, hx - 9.5, hy + 16, hx + 9.5, hy + 16, 1, C.woodDk);
    g.restore();
  }
  function bag(g, hx, hy, a) {       // a paper bag hanging from (hx, hy), the top of its handle
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a;
    g.beginPath(); g.moveTo(hx - 5, hy + 4); g.quadraticCurveTo(hx, hy - 3, hx + 5, hy + 4);
    g.strokeStyle = C.ink; g.lineWidth = 1.4; g.stroke();
    rr(g, hx - 11, hy + 4, 22, 22, 2); inkFill(g, C.woodDk, 1.4);
    ln(g, hx - 11, hy + 8, hx + 11, hy + 8, 1, C.umber);
    g.restore();
  }
  function checkout(g, flash, lines, pairHL) {
    rr(g, CO.x0 + 2, CO.top + 6, CO.x1 - CO.x0 - 4, -CO.top - 6, 3); inkFill(g, C.wood, 1.6);
    rr(g, CO.x0 - 2, CO.top, CO.x1 - CO.x0 + 4, 6, 2); inkFill(g, C.steel, 1.4);
    text(g, 'CHECKOUT', (CO.x0 + CO.x1) / 2, -16, 9, C.umber);
    if (flash > 0) {
      g.save(); g.globalAlpha *= flash;
      poly(g, [[SCAN - 6, CO.top], [SCAN + 6, CO.top], [SCAN + 13, CO.top - 17], [SCAN - 13, CO.top - 17]], true);
      g.fillStyle = C.red; g.fill();
      g.restore();
    }
    rr(g, SCAN - 8, CO.top + 1.5, 16, 3, 1); g.fillStyle = C.ink; g.fill();
    ln(g, REG.pole, CO.top, REG.pole, REG.y + REG.h, 2.2);
    rr(g, REG.x, REG.y, REG.w, REG.h, 4); inkFill(g, C.paper, 1.6);
    if (pairHL > 0) {   // within this one basket: diapers and beer
      g.save(); g.globalAlpha *= pairHL;
      rr(g, REG.x + 3, REG.y + 4, REG.w - 6, 23, 3); g.fillStyle = C.butterSoft; g.fill();
      g.restore();
    }
    [['beer', 13], ['diapers', 24], ['milk', 35]].forEach(([s, dy], i) => {
      const a = lines[i];
      if (a <= 0.01) return;
      g.save(); g.globalAlpha *= a;
      text(g, s, REG.x + REG.w / 2, REG.y + dy, 8, i < 2 && pairHL > 0.5 ? C.redInk : C.ink);
      g.restore();
    });
  }
  function receipt(g, x, y, k, a) {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha *= a;
    g.translate(x, y); g.rotate(-0.25 + 0.5 * k);
    rr(g, -7, -9, 14, 18, 1.5); inkFill(g, C.paper, 1.2);
    ln(g, -4, -4, 4, -4, 1.3, C.soft); ln(g, -4, 0, 3, 0, 1.3, C.soft); ln(g, -4, 4, 4, 4, 1.3, C.soft);
    g.restore();
  }
  function clock(g, minute) {
    circle(g, CLOCK[0], CLOCK[1], 13); inkFill(g, C.paper, 1.5);
    const m = (minute / 60) * 2 * Math.PI, h = ((5 + minute / 60) / 12) * 2 * Math.PI;
    ln(g, CLOCK[0], CLOCK[1], CLOCK[0] + 6 * Math.sin(h), CLOCK[1] - 6 * Math.cos(h), 2);
    ln(g, CLOCK[0], CLOCK[1], CLOCK[0] + 10 * Math.sin(m), CLOCK[1] - 10 * Math.cos(m), 1.4);
    text(g, 'p.m.', CLOCK[0], CLOCK[1] + 25, 7.5, C.muted);
  }
  // the tally of every basket from 5 to 7 p.m.; b = { a, n, pile, pair, tick, glow }
  function board(g, b) {
    if (b.a <= 0.01) return;
    g.save(); g.globalAlpha *= b.a;
    rr(g, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 5); inkFill(g, C.paper, 1.6);
    const head = b.n < 1 ? '5-7 p.m.' : `${fmt(b.n)} basket${b.n === 1 ? '' : 's'}, 5-7 p.m.`;
    text(g, head, BOARD.x + BOARD.w / 2, BOARD.y + 16, 9.5, C.muted);
    ln(g, BOARD.x + 8, BOARD.y + 24, BOARD.x + BOARD.w - 8, BOARD.y + 24, 1, C.faint);
    for (let i = b.pile - 1; i >= 0; i--) receipt(g, PILE[0] + i * 6, PILE[1] - (i % 2) * 2, 0.4, 1);
    if (b.glow > 0) {
      g.save(); g.globalAlpha *= b.glow;
      rr(g, BOARD.x + 66, BOARD.y + 30, 112, 20, 3); g.fillStyle = C.butterSoft; g.fill();
      g.restore();
    }
    if (b.pair > 0.01) { g.save(); g.globalAlpha *= b.pair; text(g, '{diapers, beer}', BOARD.x + 122, BOARD.y + 45, 11.5, C.redInk); g.restore(); }
    tickBadge(g, TALLY[0], TALLY[1], b.tick, 7.5);
    g.restore();
  }
  const SHOWN = { a: 1, n: 1.2e6, pile: 7, pair: 1, tick: 1, glow: 0 };

  SC['osco'] = {
    dur: DUR,
    width: 548,
    label: 'A shopper with a basket takes milk, skips the chips, takes diapers and a six-pack of beer, and goes to the checkout. The register scans the basket, and a tally of 1.2 million baskets shows diapers and beer bought together.',
    draw(g, S) {
      const T = S.on ? S.u * this.dur : -1;
      const t = S.t;
      let x = HOME, sx = 1, gait = { ph: 0, amp: 0 }, figA = 1;
      const base = breathe(P({ hF: [12, -60], hB: [-4, -52] }), t);
      let pose = base;
      const taken = {}, inHand = {}, onCounter = {}, belt = [];
      let carry = null, hasBasket = 1, basketDown = 0, bagDown = 0, bagHeld = 0, flash = 0, lines = [0, 0, 0], pairHL = 0;
      let fly = null, nahK = 0, minute = 55, sparkK = 0;
      let boardIn = S.n > 0 ? SHOWN : null;               // after the first play, the tally stays up
      if (T < 0) {
        pose = mix(pose, P({ hF: [10, -96], head: [7, -116], hB: [-4, -54] }), pulse(t, 5.5, 2, 2.2));
      } else {
        const restock = 1 - seg(T, RESET[0], RESET[1]);
        // walking: the active leg of the trip is the last one that has started
        let wi = 0;
        WALKS.forEach((w, i) => { if (T >= w[0] - 0.05) wi = i; });
        const w = WALKS[wi], ws = walkSeg(T, w[0], w[1], w[2], w[3]);
        x = ws.x;
        gait = ws;
        figA = T < 10.6 ? 1 : x > 0 ? 1 - seg(x, 236, 276) : seg(x, -300, -268);   // out the right side, the next shopper in from the left
        // three products: reach, take, drop into the basket
        for (const pk of PICKS) {
          const s = SHELVES[pk.shelf], a = pk.a;
          const reach = E.soft(seg(T, a, a + 0.25)) * (1 - E.soft(seg(T, a + 0.3, a + 0.55)));
          pose = mix(pose, P({ hF: lp([s.x0 + 11, -56], x, 0, sx), hB: [-4, -52], head: [9, -114], chest: [3, -90] }), reach);
          const drop = E.soft(seg(T, a + 0.3, a + 0.55)) * (1 - E.soft(seg(T, a + 0.65, a + 0.9)));
          pose = mix(pose, P({ hF: [3, -50], hB: [-4, -52], head: [8, -112], chest: [3, -89] }), drop);
          taken[pk.kind] = seg(T, a + 0.23, a + 0.27) * restock;
          const c = seg(T, a + 0.23, a + 0.27) * (1 - seg(T, a + 0.53, a + 0.57));
          if (c > 0) carry = { kind: pk.kind, a: c };
          inHand[pk.kind] = seg(T, a + 0.53, a + 0.57);
        }
        // the chips: reach toward them, stop short, think better of it (skip)
        const look = E.soft(seg(T, SKIP, SKIP + 0.25)) * (1 - E.soft(seg(T, SKIP + 0.5, SKIP + 0.8)));
        pose = mix(pose, P({ hF: lp([SHELVES[1].x0 - 4, -66], x, 0, sx), hB: [-4, -52], head: [9, -113], chest: [3, -90] }), look);
        nahK = E.soft(seg(T, SKIP + 0.3, SKIP + 0.5)) * (1 - E.soft(seg(T, SKIP + 0.75, SKIP + 0.9)));
        // the checkout: set the basket on the counter
        const put = E.soft(seg(T, 6.8, PUT_T)) * (1 - E.soft(seg(T, PUT_T + 0.05, PUT_T + 0.35)));
        pose = mix(pose, P({ hF: [12, -60], hB: lp([BASKET_X, CO.top - 20], x, 0, sx), head: [9, -114], chest: [3, -90] }), put);
        const placed = seg(T, PUT_T - 0.02, PUT_T + 0.02);
        hasBasket = T < 12 ? 1 - placed : 1;               // a new shopper comes in with a fresh basket
        basketDown = placed * (1 - seg(T, RESET[0], RESET[1]));
        // unloading and scanning: each item leaves the basket and rides the belt over the scanner
        for (const k of ['beer', 'diaper', 'milk']) {
          const [t0, t1, x1] = RUNS[k];
          const out = seg(T, t0, t0 + 0.06);
          onCounter[k] = inHand[k] * (1 - out);
          belt.push({ kind: k, x: BELT0 + (x1 - BELT0) * E.soft(seg(T, t0, t1)), a: out * (1 - seg(T, 9.2, 9.45)) });
          flash = Math.max(flash, 1 - Math.abs(T - SCANS[k]) / 0.14);
        }
        lines = ['beer', 'diaper', 'milk'].map((k) => seg(T, SCANS[k], SCANS[k] + 0.1) * (1 - seg(T, RESET[0], RESET[1])));
        pairHL = E.soft(seg(T, 8.9, 9.1)) * (1 - seg(T, RESET[0], RESET[1]));
        // bag the groceries, pick up the bag, leave
        bagDown = seg(T, 9.2, 9.45) * (1 - seg(T, 10.28, 10.32));
        bagHeld = seg(T, 10.28, 10.32) * (T < 12 ? 1 : 0);
        const grab = E.soft(seg(T, 10.05, 10.3)) * (1 - E.soft(seg(T, 10.35, 10.6)));
        pose = mix(pose, P({ hF: lp([BAG_X, CO.top - 27], x, 0, sx), hB: [-4, -52], head: [9, -114], chest: [3, -90] }), grab);
        // the receipt goes to the tally, which counts up to 1.2 million baskets and finds {diapers, beer}
        const k = seg(T, 9.15, 9.75);
        if (k > 0 && k < 1) fly = { p: arcPt([REG.x + REG.w / 2, REG.y + REG.h / 2], PILE, 34, E.io(k)), k };
        const landed = T >= 9.75;
        const fresh = { a: E.soft(seg(T, 9.3, 9.6)), n: landed ? Math.pow(1.2e6, E.io(seg(T, 9.85, 10.75))) : 0,
          pile: landed ? 1 + Math.floor(6 * seg(T, 9.85, 10.75)) : 0, pair: seg(T, 10.85, 11.15), tick: seg(T, 10.95, 11.25),
          glow: E.soft(seg(T, 10.85, 11.15)) * (1 - E.soft(seg(T, 12.0, 12.6))) };
        const before = S.n > 0 ? 1 - E.soft(seg(T, 0, 0.4)) : 0;   // a replay first clears the old tally
        boardIn = T < 9.3 ? (before > 0 ? { ...SHOWN, a: before } : null) : fresh;
        sparkK = seg(T, 10.95, 11.55);
        minute = 55 + 5 * seg(T, 0, 9) * (1 - seg(T, RESET[0], RESET[1]));
      }
      pose = legs(pose, gait.ph, gait.amp, { arms: false, stride: gait.stride });

      clock(g, minute);
      if (boardIn) board(g, boardIn);
      text(g, 'ENTRANCE', -270, 15, 8, C.muted, 'left');
      shelves(g, taken);
      checkout(g, flash, lines, pairHL);
      basket(g, BASKET_X, CO.top - 20, onCounter, basketDown);
      for (const b of belt) item(g, b.kind, b.x, CO.top, b.a);
      bag(g, BAG_X, CO.top - 27, bagDown);
      const empty = T >= 12 ? {} : inHand;
      fig(g, pose, x, 0, { sx, alpha: figA, wave: S.wave, wt: S.wt,
        held: (gg, J) => R.held(gg, J, (hF, hB) => {
          basket(gg, hB[0], hB[1], empty, hasBasket);
          if (carry) item(gg, carry.kind, hF[0], hF[1] + 8, carry.a);
          bag(gg, hF[0], hF[1] + 1, bagHeld);
        }) });
      if (fly) receipt(g, fly.p[0], fly.p[1], fly.k, 1);
      sparks(g, TALLY[0], TALLY[1] - 2, sparkK, 14, 6, C.redInk);
      bubble(g, AT[1] + 6, -118, 'nah', nahK, { tail: 2, size: 9 });
    },
  };
})();
