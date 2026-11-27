/* 動物園守護戰：場景繪製（草地、路、裝飾、動物之家、放塔格）。
   只負責「畫」，不碰規則與輸入；view.js 呼叫 DefScene.drawBackground / makeSlot。
   全部用向量圖形畫，不用 emoji。裝飾位置用固定種子（每關每次都一樣），並避開路線與放塔格。
   投影一律「往右下偏移＋低透明度」，不用零位移光暈。 */
(function (G) {
  "use strict";
  const P = {
    day: { grassA: 0x93d26b, grassB: 0x86c75e, tuft: 0x6aa846, edge: 0x2f6b34,
      leaf: 0x3f9a4d, leafHi: 0x5cbb67, leafLo: 0x347f40, bush: 0x56b25a, trunk: 0x7a5230,
      pathShadow: 0x1e3a14, pathEdge: 0x8a5a2b, pathBase: 0xe6c88d, pathInner: 0xf1dca9, pebble: 0xb98d54 },
    night: { grassA: 0x2b4f3b, grassB: 0x254635, tuft: 0x1d3b2c, edge: 0x0e2418,
      leaf: 0x245b3a, leafHi: 0x347a4d, leafLo: 0x1b4630, bush: 0x2c6b43, trunk: 0x4a3524,
      pathShadow: 0x050c08, pathEdge: 0x3d2c1d, pathBase: 0x6a5439, pathInner: 0x7b6444, pebble: 0x54402b },
  };
  const FLOWERS = [0xfff3b0, 0xffb3c7, 0xffffff, 0xffd166, 0xbfe3ff];

  function rngFor(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
  const shadow = (g, x, y, rx, ry) => g.ellipse(x + rx * 0.22, y, rx, ry).fill({ color: 0x000000, alpha: 0.2 });

  function tree(g, c, x, y, r) {
    shadow(g, x, y + r * 0.9, r * 1.0, r * 0.3);
    g.roundRect(x - r * 0.13, y + r * 0.1, r * 0.26, r * 0.85, 3).fill(c.trunk);
    g.circle(x, y, r).fill(c.leaf);
    g.circle(x - r * 0.4, y + r * 0.22, r * 0.68).fill(c.leafLo);
    g.circle(x + r * 0.42, y + r * 0.15, r * 0.64).fill(c.leaf);
    g.circle(x - r * 0.22, y - r * 0.32, r * 0.42).fill({ color: c.leafHi, alpha: 0.9 });
  }
  function bush(g, c, x, y, r) {
    shadow(g, x, y + r * 0.7, r * 1.1, r * 0.35);
    g.circle(x - r * 0.5, y + r * 0.1, r * 0.7).fill(c.leafLo);
    g.circle(x + r * 0.5, y + r * 0.15, r * 0.65).fill(c.bush);
    g.circle(x, y - r * 0.15, r * 0.8).fill(c.bush);
    g.circle(x - r * 0.2, y - r * 0.4, r * 0.35).fill({ color: c.leafHi, alpha: 0.85 });
  }
  function rock(g, x, y, r) {
    shadow(g, x, y + r * 0.55, r * 1.1, r * 0.35);
    g.poly([x - r, y + r * 0.45, x - r * 0.7, y - r * 0.4, x, y - r * 0.75, x + r * 0.8, y - r * 0.3, x + r, y + r * 0.45]).fill(0xaab2b5);
    g.poly([x - r * 0.7, y - r * 0.4, x, y - r * 0.75, x + r * 0.8, y - r * 0.3, x + r * 0.1, y - r * 0.05]).fill(0xcdd3d5);
  }
  function flower(g, x, y, col) {
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.circle(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, 2.6).fill(col); }
    g.circle(x, y, 2).fill(0xf2a93b);
  }
  function tuft(g, c, x, y) {
    g.moveTo(x, y).lineTo(x - 4, y - 8).moveTo(x, y).lineTo(x, y - 10).moveTo(x, y).lineTo(x + 4, y - 8).stroke({ width: 2, color: c.tuft, cap: "round" });
  }

  function drawHome(g, c, x, y) {
    shadow(g, x, y + 28, 40, 10);
    g.roundRect(x - 27, y - 8, 54, 36, 4).fill(0xf6e7c6).stroke({ width: 3, color: c.pathEdge });
    g.poly([x - 36, y - 6, x, y - 42, x + 36, y - 6]).fill(0xd9482b).stroke({ width: 3, color: 0x9a2f18, join: "round" });
    g.poly([x - 30, y - 8, x - 4, y - 34, x - 4, y - 8]).fill({ color: 0xf06a4c, alpha: 0.8 });
    g.roundRect(x - 7, y + 6, 14, 22, 4).fill(c.pathEdge);
    g.roundRect(x + 12, y + 2, 11, 11, 2).fill(0x9fd8f5).stroke({ width: 2, color: c.pathEdge });
    g.moveTo(x + 24, y - 36).lineTo(x + 24, y - 62).stroke({ width: 3, color: c.pathEdge, cap: "round" });
    g.poly([x + 24, y - 62, x + 44, y - 55, x + 24, y - 48]).fill(0x2f8f5b);
  }

  function drawBackground(layer, L, D) {
    const c = L.night ? P.night : P.day;
    const W = D.W, H = D.H, rnd = rngFor(L.no * 7919 + 13);
    const base = new PIXI.Graphics();
    base.rect(0, 0, W, H).fill(c.grassA);
    for (let y = 0, k = 0; y < H; y += 54, k++) if (k % 2) base.rect(0, y, W, 54).fill({ color: c.grassB, alpha: 0.7 });
    for (let i = 0; i < 9; i++) base.rect(i * 3, i * 3, W - i * 6, H - i * 6).stroke({ width: 6, color: c.edge, alpha: 0.06 }); // 邊緣暗角
    layer.addChild(base);

    const slots = L.slotsAt, paths = L.paths;
    const free = (x, y, r) => x > r && x < W - r && y > r + 56 && y < H - r &&
      paths.every((p) => D.distToPath(x, y, p) >= 46 + r * 0.5) && slots.every((s) => Math.hypot(x - s[0], y - s[1]) >= 50 + r * 0.6);
    const placed = [];
    const spot = (r, tries) => {
      for (let t = 0; t < tries; t++) {
        const x = rnd() * W, y = rnd() * H;
        if (free(x, y, r) && placed.every((q) => Math.hypot(x - q[0], y - q[1]) >= (r + q[2]) * 0.75)) { placed.push([x, y, r]); return [x, y]; }
      }
      return null;
    };
    const ground = new PIXI.Graphics(), deco = new PIXI.Graphics();
    for (let i = 0; i < 46; i++) { const x = rnd() * W, y = rnd() * H; if (paths.every((p) => D.distToPath(x, y, p) > 34)) tuft(ground, c, x, y); }
    for (let i = 0; i < 22; i++) { const s = spot(8, 20); if (s) { const col = FLOWERS[i % FLOWERS.length]; flower(ground, s[0], s[1], col); flower(ground, s[0] + 9, s[1] + 5, col); flower(ground, s[0] - 7, s[1] + 7, FLOWERS[(i + 2) % FLOWERS.length]); } }
    layer.addChild(ground);

    paths.forEach((p) => {
      const stroke = (dy, w, col, a) => {
        const pts = p.pts;
        const g = new PIXI.Graphics();
        g.moveTo(pts[0][0], pts[0][1] + dy); pts.slice(1).forEach((q) => g.lineTo(q[0], q[1] + dy));
        g.stroke({ width: w, color: col, alpha: a, cap: "round", join: "round" });
        layer.addChild(g);
      };
      stroke(6, 62, c.pathShadow, 0.22); stroke(0, 58, c.pathEdge, 1); stroke(0, 48, c.pathBase, 1); stroke(0, 30, c.pathInner, 0.6);
      const peb = new PIXI.Graphics();
      for (let d = 0; d < p.len; d += 22) {
        const q = D.posAt(p, d), nx = -Math.sin(q.ang), ny = Math.cos(q.ang), side = rnd() < 0.5 ? -1 : 1, off = 25 + rnd() * 5;
        const x = q.x + nx * off * side, y = q.y + ny * off * side;
        peb.circle(x, y, 2 + rnd() * 2).fill({ color: c.pebble, alpha: 0.95 });
      }
      layer.addChild(peb);
    });

    const items = [];
    for (let i = 0; i < 12; i++) { const r = 24 + rnd() * 10, s = spot(r, 30); if (s) items.push(["t", s[0], s[1], r]); }
    for (let i = 0; i < 12; i++) { const r = 13 + rnd() * 6, s = spot(r, 30); if (s) items.push(["b", s[0], s[1], r]); }
    for (let i = 0; i < 8; i++) { const r = 9 + rnd() * 6, s = spot(r, 30); if (s) items.push(["r", s[0], s[1], r]); }
    items.sort((a, b) => a[2] - b[2]).forEach(([k, x, y, r]) => (k === "t" ? tree(deco, c, x, y, r) : k === "b" ? bush(deco, c, x, y, r) : rock(deco, x, y, r)));
    layer.addChild(deco);

    const end = paths[0].pts[paths[0].pts.length - 1];
    const home = new PIXI.Graphics();
    drawHome(home, c, Math.min(end[0], W - 52) + 6, end[1] - 6);
    layer.addChild(home);
  }

  // 放塔格：木牌＋腳印，取代白色圓圈加「+」
  function makeSlot() {
    const g = new PIXI.Graphics();
    g.ellipse(4, 8, 33, 13).fill({ color: 0x000000, alpha: 0.2 });
    g.circle(0, 0, 30).fill(0x7a4a22);
    g.circle(0, 0, 26).fill(0xc79555);
    g.circle(0, 0, 21).fill({ color: 0xdfb878, alpha: 0.95 });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.circle(Math.cos(a) * 24, Math.sin(a) * 24, 1.6).fill({ color: 0x7a4a22, alpha: 0.7 }); }
    g.ellipse(0, 5, 8.5, 7).fill({ color: 0xfaf1da, alpha: 0.97 });
    [[-10, -4, 3.5], [-3.6, -10, 3.7], [3.6, -10, 3.7], [10, -4, 3.5]].forEach(([x, y, r]) => g.circle(x, y, r).fill({ color: 0xfaf1da, alpha: 0.97 }));
    return g;
  }

  G.DefScene = { drawBackground, makeSlot };
})(typeof window !== "undefined" ? window : globalThis);
