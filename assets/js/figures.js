/* ============================================================
   VERVE — abstract figures for the work plate
   Flat silhouettes: tiny heads on long coat-like torsos, stick
   legs on small flat feet, cone dresses. Drawn on a 100-unit
   adult (ground ≈ 98); limbs that move are groups with a pivot
   and a rest angle (--r) the CSS animates around. currentColor.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const f = (n) => +n.toFixed(2);

  /* a tapered segment as a filled quad */
  function quad(x0, y0, x1, y1, w0, w1) {
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L, a = w0 / 2, b = w1 / 2;
    return `<path d="M${f(x0 + nx * a)} ${f(y0 + ny * a)}L${f(x1 + nx * b)} ${f(y1 + ny * b)}L${f(x1 - nx * b)} ${f(y1 - ny * b)}L${f(x0 - nx * a)} ${f(y0 - ny * a)}Z"/>`;
  }
  /* a limb through points, width easing from w0 to w1, round knees / elbows */
  function limb(pts, w0, w1, dx, dy) {
    const n = pts.length / 2 - 1;
    let out = "";
    for (let i = 0; i < n; i++) {
      const wa = w0 + (w1 - w0) * (i / n), wb = w0 + (w1 - w0) * ((i + 1) / n);
      out += quad(pts[i * 2] + dx, pts[i * 2 + 1] + dy, pts[i * 2 + 2] + dx, pts[i * 2 + 3] + dy, wa, wb);
      if (i < n - 1) out += `<circle cx="${f(pts[i * 2 + 2] + dx)}" cy="${f(pts[i * 2 + 3] + dy)}" r="${f(wb / 2)}"/>`;
    }
    return out;
  }
  /* a small flat foot under an ankle, toe toward dir (±1) */
  function foot(x, y, dir, s = 1) {
    const p = [[-1.6, -.9], [1.5, -.9], [4.8, .3], [4.8, 1.7], [-1.6, 1.7]];
    return `<path d="M${p.map(([u, v]) => `${f(x + u * dir * s)} ${f(y + v * s)}`).join("L")}Z"/>`;
  }
  const pts = (s, dx, dy) => s.trim().split(/\s+/).map((pr) => { const [x, y] = pr.split(","); return `${f(+x + dx)},${f(+y + dy)}`; }).join(" ");

  function part(p, dx, dy) {
    switch (p[0]) {
      case "h": { const cx = f(p[1] + dx), cy = f(p[2] + dy); return `<ellipse cx="${cx}" cy="${cy}" rx="${p[3]}" ry="${p[4]}" transform="rotate(${p[5] || 0} ${cx} ${cy})"/>`; }
      case "p": return `<polygon points="${pts(p[1], dx, dy)}"/>`;
      case "l": return limb(p[1], p[2], p[3], dx, dy);
      case "f": return foot(p[1] + dx, p[2] + dy, p[3], p[4]);
      case "g": return `<g class="${p[1]}" style="transform-origin:${f(p[2] + dx)}px ${f(p[3] + dy)}px;--r:${p[4]}deg">${p[5].map((q) => part(q, dx, dy)).join("")}</g>`;
      default: return "";
    }
  }

  /* a swinging leg: hip pivot, slight forward knee, flat foot */
  const leg = (cls, hx, hy, r, len, dir = 1, w = 3.3) =>
    ["g", `fg-leg ${cls}`, hx, hy, r, [["l", [hx, hy, hx + dir * 1.1, hy + len * .52, hx, hy + len], w, w * .8], ["f", hx, hy + len, dir]]];

  /* name: { w, h, dx, dy (shift into the box), ax, ay (perch point, box units), parts } */
  const DEFS = {
    /* walking mid-stride, leaning into the step */
    walk: { w: 48, h: 100, dx: 2, dy: 1, ax: 23.6, ay: 98.2, parts: [
      ["g", "fg-arm fg-arm--b", 22.6, 12.4, 32, [["l", [22.6, 12.4, 21.6, 24, 23.2, 33.5], 2.2, 1.6]]],
      leg("fg-leg--b", 21.8, 47, 20, 50),
      ["h", 25.6, 4.4, 2.4, 3.7, 18],
      ["p", "23.4,7.6 25.4,8 27,11 27.8,20 27.4,34 26.6,50 17,50.6 18.4,38 20.6,22 22.4,11"],
      leg("fg-leg--a", 21.8, 47, -20, 50),
      ["g", "fg-arm fg-arm--a", 26, 12.4, -30, [["l", [26, 12.4, 26.6, 24, 25, 33.5], 2.2, 1.6]]]
    ] },

    /* standing, one arm up waving */
    wave: { w: 36, h: 112, dx: 1, dy: 13, ax: 21.6, ay: 111.1, parts: [
      ["l", [16.6, 12.6, 15, 24, 14.6, 35], 2.3, 1.8],
      ["l", [18.4, 54, 18.3, 96.4], 3.5, 3], ["f", 18.3, 96.4, -1],
      ["l", [23.2, 54, 23.4, 96.4], 3.5, 3], ["f", 23.4, 96.4, 1],
      ["h", 21.2, 3.8, 2.5, 3.8, 6],
      ["p", "15.6,13 17,10 19.6,8.4 23.8,8.6 25.4,10.2 26.8,17 25.8,25 25.4,56 16.4,56 16.2,32 15.2,21"],
      ["g", "fg-arm", 24.6, 11.2, 0, [
        ["l", [24.6, 11.2, 29.6, 2.4], 2.4, 2],
        ["g", "fg-fore", 29.6, 2.4, 0, [["l", [29.6, 2.4, 30.2, -9.4], 2, 1.6], ["h", 30.4, -10.8, 1.2, 2, 8]]]
      ]]
    ] },

    /* standing woman in a cone dress */
    dress: { w: 40, h: 100, dx: 0, dy: 1, ax: 20, ay: 99.1, parts: [
      ["l", [17.2, 11.4, 14.8, 26, 13.8, 39], 2, 1.6],
      ["l", [22.8, 11.4, 25.2, 26, 26.2, 39], 2, 1.6],
      ["h", 20, 3.9, 2.4, 3.8, 4],
      ["p", "18.6,7.6 21.4,7.6 23.4,11.6 24.6,30 26.8,50 29.8,65 32,73.6 27,74.8 20,75.2 13,74.8 8,73.6 10.2,65 13.2,50 15.4,30 16.6,11.6"],
      ["l", [17.6, 74, 17.6, 96.4], 3.2, 2.8], ["f", 17.6, 96.4, -1, .85],
      ["l", [22.4, 74, 22.4, 96.4], 3.2, 2.8], ["f", 22.4, 96.4, 1, .85]
    ] },

    /* seated on an edge, shins dangling (perch = the seat) */
    sit: { w: 42, h: 88, dx: 0, dy: 1, ax: 20, ay: 59.6, parts: [
      ["g", "fg-shin fg-shin--b", 31.8, 56.6, 10, [["l", [31.8, 56.6, 31.6, 84], 3.2, 2.8], ["f", 31.6, 84, 1, .9]]],
      ["h", 19.6, 4, 2.4, 3.8, 10],
      ["p", "17.6,8.4 21,8.6 23.8,12.4 25.2,30 26.6,48 26.8,58.6 13.8,58.6 13.2,48 13.8,30 15,14.2"],
      ["p", "22,54.2 35.4,54.6 35.6,58.6 22,58.6"],
      ["g", "fg-shin fg-shin--a", 34, 56.6, -3, [["l", [34, 56.6, 34.2, 84.4], 3.3, 2.9], ["f", 34.2, 84.4, 1]]],
      ["l", [22.6, 13, 26.4, 30, 32.4, 46.6], 2.3, 1.8]
    ] },

    /* leaning back against a wall on its left, ankles crossed */
    lean: { w: 42, h: 101, dx: 13, dy: 1, ax: 31.6, ay: 99.4, rot: [-8, 31.6, 99], parts: [
      ["l", [18.4, 54, 18.2, 75, 18.4, 96.4], 3.4, 2.9], ["f", 18.4, 96.4, 1],
      ["l", [22.6, 54, 21.6, 74, 15.4, 95.6], 3.4, 2.9], ["f", 15.4, 95.8, 1, .85],
      ["h", 20.4, 3.9, 2.5, 3.8, -6],
      ["p", "15.8,12.2 17.6,9.4 19.4,8.4 22.4,8.6 24.6,10.6 25.2,30 25.6,56 15.6,56 15.4,30"],
      ["l", [16.4, 12, 14.4, 23.6, 18.6, 32], 2.2, 1.7],
      ["l", [24.4, 12, 26.6, 23.6, 22.6, 32], 2.2, 1.7]
    ] },

    /* bent forward, looking closely */
    look: { w: 38, h: 100, dx: 0, dy: 1, ax: 21.2, ay: 99.1, parts: [
      ["l", [19.2, 60, 19, 96.4], 3.3, 2.9], ["f", 19, 96.4, 1],
      ["l", [23.4, 60, 23.6, 96.4], 3.3, 2.9], ["f", 23.6, 96.4, 1],
      ["p", "14.6,63 16.2,48 16.8,34 18.2,21 21.2,13.4 25.4,10.6 28.2,12.8 27.2,21 26.2,34 26.6,48 28.4,63"],
      ["h", 30.2, 11.6, 2.4, 3.6, 62],
      ["l", [26.4, 13.6, 30.2, 24, 33.6, 30.6], 2.1, 1.6]
    ] },

    /* a woman walking a small dog on a leash */
    dog: { w: 56, h: 100, dx: 1, dy: 1, ax: 19, ay: 99.4, parts: [
      ["l", [15.6, 11.4, 13.2, 26, 12.4, 39], 2, 1.6],
      leg("fg-leg--b", 17.8, 72, 8, 24.4, 1, 3.2),
      ["h", 18.2, 3.9, 2.4, 3.8, 10],
      ["p", "16.6,7.6 19.4,7.6 21.4,11.6 22.6,30 24.8,50 27.8,65 30,73.6 25,74.8 18,75.2 11,74.8 6,73.6 8.2,65 11.2,50 13.4,30 14.6,11.6"],
      leg("fg-leg--a", 17.8, 72, -8, 24.4, 1, 3.2),
      ["l", [21, 11.4, 24.6, 26, 28.4, 38.6], 2, 1.6],
      ["l", [28.6, 38.8, 45, 88.2], .6, .6],
      ["g", "fg-tail", 38.2, 89.4, 0, [["l", [38.2, 89.4, 36.2, 85.2], 1.3, .8]]],
      ["g", "fg-dleg fg-dleg--b", 39.8, 92, 9, [["l", [39.8, 92, 39.6, 97.6, 41.2, 97.8], 1.6, 1.3]]],
      ["g", "fg-dleg fg-dleg--b", 46.4, 92, 9, [["l", [46.4, 92, 46.2, 97.6, 47.8, 97.8], 1.6, 1.3]]],
      ["p", "37.6,88.4 45.2,88 46.6,86.2 47.2,84.2 47.6,81.8 48.8,84 50,84.6 52.6,86.2 52.2,87.8 49,88.6 47.8,90.6 47.4,93.2 38,93.2 37,90.8"],
      ["g", "fg-dleg fg-dleg--a", 38.8, 92, -9, [["l", [38.8, 92, 38.6, 97.6, 40.2, 97.8], 1.6, 1.3]]],
      ["g", "fg-dleg fg-dleg--a", 45.4, 92, -9, [["l", [45.4, 92, 45.2, 97.6, 46.8, 97.8], 1.6, 1.3]]]
    ] },

    /* a child mid-kick, arms flung out */
    kid: { w: 36, h: 52, dx: 1, dy: 1, ax: 13, ay: 50.3, parts: [
      ["l", [13.2, 10.4, 8, 7.6, 3, 4.2], 2, 1.5],
      ["g", "fg-kleg", 14.6, 25, 0, [["l", [14.6, 25, 13.2, 36.4, 12.2, 47], 2.8, 2.3], ["f", 12.2, 47, 1, .75]]],
      ["h", 16, 3.6, 2.2, 3, -12],
      ["p", "13.4,8 18.2,8 19.8,13 21.4,26 11.6,26.6 12.4,14"],
      ["g", "fg-kick", 18, 25, 0, [["l", [18, 25, 23, 32.6, 29.8, 33.4], 2.8, 2.3], ["p", "29,31.6 31.2,30.6 32.4,35 29.6,35.2"]]],
      ["l", [18.4, 10.4, 24, 9.6, 30.4, 5.6], 2, 1.5]
    ] },

    /* stepping forward, an arm reaching out to point */
    point: { w: 52, h: 100, dx: 1, dy: 1, ax: 21.4, ay: 99, parts: [
      ["l", [19.4, 12.6, 16, 23, 12.6, 30], 2.2, 1.7],
      leg("fg-leg--b", 20.4, 47, 16, 50),
      ["h", 24.4, 4.2, 2.4, 3.7, 14],
      ["p", "22.2,7.6 24.2,8 26.4,11 27.2,22 26.6,36 26,50 15.6,50.6 16.6,38 18.4,22 20.6,11"],
      leg("fg-leg--a", 20.4, 47, -16, 50),
      ["g", "fg-reach", 25.4, 12, 0, [["l", [25.4, 12, 35, 10.4, 45.4, 7.8], 2.3, 1.7], ["l", [45.4, 7.8, 48.4, 7], 1.3, .9]]]
    ] }
  };

  const cache = {};
  function inner(name) {
    const d = DEFS[name];
    if (!cache[name]) {
      const body = d.parts.map((p) => part(p, d.dx, d.dy)).join("");
      cache[name] = d.rot ? `<g transform="rotate(${d.rot.join(" ")})">${body}</g>` : body;
    }
    return cache[name];
  }

  V.figures = {
    names: Object.keys(DEFS),
    /* box size and perch point, in adult-height units (100 = one adult) */
    meta: (name) => { const d = DEFS[name]; return d ? { w: d.w, h: d.h, ax: d.ax, ay: d.ay } : null; },
    svg: (name, cls = "") => DEFS[name]
      ? `<svg class="fg fg--${name} ${cls}" viewBox="0 0 ${DEFS[name].w} ${DEFS[name].h}" fill="currentColor" aria-hidden="true" focusable="false">${inner(name)}</svg>`
      : ""
  };
})();
