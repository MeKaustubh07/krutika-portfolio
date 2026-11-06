/* ============================================================
   VERVE v2 — about : the axonometric that draws itself
   A small two-storey house in thin ink lines, built as inline
   SVG from 3-D points. It draws line by line when it scrolls
   into view; as you scroll through the section the floors lift
   apart into an exploded axonometric (cut wall tops hatched,
   dashed guides, level markers) and settle back.
   Transforms / opacity / dashoffset only. Reduced motion: the
   finished drawing, held part-exploded. Decorative: aria-hidden.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const host = document.querySelector("[data-axo]");
  const svg = host && host.querySelector("svg");
  if (!host || !svg || host.__axo) return;
  host.__axo = 1;
  const reduced = typeof V.reduced === "boolean" ? V.reduced
    : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- projection : isometric, K units per metre ---------- */

  const K = 15, CX = Math.cos(Math.PI / 6) * K, SY = 0.5 * K;
  const r1 = (n) => Math.round(n * 10) / 10;
  const P = (x, y, z) => [r1((x - y) * CX), r1((x + y) * SY - z * K)];
  const D = (poly) => "M" + poly.map((p) => P(...p).join(",")).join("L") + "Z";

  let out = [], i = 0;
  const groups = [];
  const face = (poly, cls) => {
    const d = D(poly), n = i++;
    out.push(`<path class="f ${cls}" d="${d}" style="--i:${n}"/><path class="ln" pathLength="1" d="${d}" style="--i:${n}"/>`);
  };
  /* visible faces of a solid: +x side, +y side, top */
  const box = (x0, y0, z0, x1, y1, z1, top = "f-t") => {
    face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], "f-r");
    face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], "f-l");
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top);
  };
  const winY = (Y, a, b, c, d) => face([[a, Y, c], [b, Y, c], [b, Y, d], [a, Y, d]], "gl");
  const winX = (X, a, b, c, d) => face([[X, a, c], [X, b, c], [X, b, d], [X, a, d]], "gl");
  /* the cut top of a ring of walls : poché + hatch */
  const ring = (X, Y, z, t) => {
    const d = D([[0, 0, z], [X, 0, z], [X, Y, z], [0, Y, z]]) + D([[t, t, z], [t, Y - t, z], [X - t, Y - t, z], [X - t, t, z]]);
    const n = i++;
    out.push(`<path class="f f-cut" fill-rule="evenodd" d="${d}" style="--i:${n}"/><path class="f hatch" fill-rule="evenodd" d="${d}" style="--i:${n}"/><path class="ln" pathLength="1" d="${d}" style="--i:${n}"/>`);
  };
  /* walls cut open from above: floor, inner back faces, [inside], outer front faces, [openings], cut top */
  const shell = (X, Y, z0, z1, t, inside, openings) => {
    face([[t, t, z0], [X - t, t, z0], [X - t, Y - t, z0], [t, Y - t, z0]], "f-fl");
    face([[t, t, z0], [X - t, t, z0], [X - t, t, z1], [t, t, z1]], "f-in");
    face([[t, t, z0], [t, Y - t, z0], [t, Y - t, z1], [t, t, z1]], "f-in2");
    if (inside) inside();
    face([[0, Y, z0], [X, Y, z0], [X, Y, z1], [0, Y, z1]], "f-l");
    face([[X, 0, z0], [X, Y, z0], [X, Y, z1], [X, 0, z1]], "f-r");
    if (openings) openings();
    ring(X, Y, z1, t);
  };
  const text = (x, y, s, cls = "", anchor = "start") =>
    out.push(`<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${s}</text>`);
  const line = (a, b, cls = "an") => out.push(`<path class="${cls}" d="M${a.join(",")}L${b.join(",")}"/>`);
  /* level marker to the left of the drawing, at screen height of (x,y,z) */
  const level = (x, y, z, s) => {
    const [px, py] = P(x, y, z), x0 = -158;
    out.push(`<path class="an" d="M${x0},${py}H${r1(px - 8)}"/><path class="an-fill" d="M${x0 + 12},${py}l-4,-6h8z"/>`);
    text(x0 + 22, py - 3, s, "an-t");
  };
  const guides = (pts, len) => pts.forEach((p) => {
    const [x, y] = P(...p);
    out.push(`<path class="gd" data-gd="${x},${y}" d="M${x},${y}v${len}"/>`);
  });
  const group = (name, lift, build) => {
    out = []; build(); groups.push({ name, lift, html: out.join("") });
  };

  /* ---------- the house : plinth, ground floor, first floor, roof ---------- */

  const L = { g: 0, l1: 30, l2: 84, roof: 142 };

  group("plinth", L.g, () => {
    box(-0.6, -0.6, 0, 9.6, 6.6, 0.45);
    box(1.1, 6.6, 0, 2.3, 7.3, 0.22);
    /* dimension lines: 9 000 along the front, 6 000 along the side */
    const d1a = P(0, 8.2, 0), d1b = P(9, 8.2, 0), d2a = P(10.9, 0, 0), d2b = P(10.9, 6, 0);
    line(P(0, 6.75, 0), P(0, 8.6, 0)); line(P(9, 6.75, 0), P(9, 8.6, 0));
    line(P(9.75, 0, 0), P(11.3, 0, 0)); line(P(9.75, 6, 0), P(11.3, 6, 0));
    line(d1a, d1b); line(d2a, d2b);
    [d1a, d1b, d2a, d2b].forEach(([x, y]) => line([x - 3, y + 3], [x + 3, y - 3], "an an-tk"));
    const m1 = P(4.5, 8.2, 0), m2 = P(10.9, 3, 0);
    out.push(`<text class="an-t" text-anchor="middle" transform="matrix(.866 .5 0 1 ${r1(m1[0] + 3)} ${r1(m1[1] + 9)})">9 000</text>`);
    out.push(`<text class="an-t" text-anchor="middle" transform="matrix(.866 -.5 0 1 ${r1(m2[0] + 6)} ${r1(m2[1] + 9)})">6 000</text>`);
  });

  group("l1", L.l1, () => {
    guides([[0, 6, 0.45], [9, 6, 0.45], [9, 0, 0.45]], L.l1 - L.g);
    shell(9, 6, 0.45, 3, 0.3, () => {
      box(5.4, 0.3, 0.45, 5.7, 3.4, 3, "f-cut hatch-t");                       // partition
      for (let s = 0; s < 8; s++) box(6.1 + s * 0.3, 0.3, 0.45, 6.4 + s * 0.3, 1.4, 0.45 + (s + 1) * 0.3); // stair
    }, () => {
      winY(6, 1.2, 2.2, 0.45, 2.6);                                             // door
      winY(6, 3.4, 5.2, 1.3, 2.6); winY(6, 6.4, 8.2, 1.3, 2.6);
      winX(9, 1.2, 2.8, 1.3, 2.6); winX(9, 3.6, 5.0, 1.3, 2.6);
    });
    level(0, 6.6, 0.45, "±0.00");
    /* section cut A — A′ through the ground floor */
    const [, sy] = P(0, 6, 1.7);
    out.push(`<path class="an an-cut" d="M-128,${sy}H150"/>`);
    out.push(`<path class="an-fill an-fill--t" d="M-128,${sy}l-4,7h8z M150,${sy}l-4,7h8z"/>`);
    text(-128, sy - 5, "A", "an-t an-t--t", "middle"); text(150, sy - 5, "A′", "an-t an-t--t", "middle");
  });

  group("l2", L.l2, () => {
    guides([[0, 6, 3], [9, 6, 3], [9, 0, 3]], L.l2 - L.l1);
    box(0, 0, 3, 9, 6, 3.3);
    shell(6.5, 6, 3.3, 6, 0.3, () => {
      box(3.6, 0.3, 3.3, 3.9, 2.6, 6, "f-cut hatch-t");
    }, () => {
      winY(6, 1, 4.6, 3.9, 5.6);
      winX(6.5, 2, 3.2, 3.3, 5.4); winX(6.5, 4, 5.4, 4.1, 5.4);
    });
    box(8.85, 0, 3.3, 9, 5.85, 4.2);                                            // terrace parapets
    box(6.5, 5.85, 3.3, 9, 6, 4.2);
    box(8.85, 0, 4.2, 9, 0.15, 6); box(8.85, 5.85, 4.2, 9, 6, 6);               // pergola posts
    level(0, 6, 3.3, "+3.00");
  });

  group("roof", L.roof, () => {
    guides([[0, 6, 6], [6.5, 6, 6], [6.5, 0, 6], [9, 6, 6]], L.roof - L.l2);
    box(-0.4, -0.4, 6, 6.9, 6.4, 6.35);
    box(2, 1.4, 6.35, 3.6, 3, 6.75, "gl");                                      // skylight
    box(8.82, 0, 6, 9, 6, 6.18);
    [0.3, 1.5, 2.7, 3.9, 5.1].forEach((y) => box(6.9, y, 6.18, 9.4, y + 0.18, 6.36)); // pergola
    level(-0.4, 6.4, 6.35, "+6.00");
  });

  /* ---------- static furniture : north arrow + scale bar ---------- */

  const furniture = (() => {
    out = [];
    const y = 172;
    out.push(`<g class="an-n" transform="translate(-140 ${y - 4}) rotate(60)"><circle r="10"/><path d="M0,-13 L4,6 L0,3 L-4,6Z"/></g>`);
    text(-140, y + 19, "N", "an-t", "middle");
    const x0 = -112, m = K;
    out.push(`<path class="an-bar" d="M${x0},${y}h${m}v3h-${m}z M${x0 + 2 * m},${y}h${m}v3h-${m}z"/>`);
    out.push(`<path class="an" d="M${x0},${y}h${5 * m}v3h-${5 * m}z"/>`);
    [[0, "0"], [1, "1"], [2, "2"], [5, "5 m"]].forEach(([k, s]) => text(x0 + k * m, y - 4, s, "an-t", k === 5 ? "start" : "middle"));
    text(x0, y + 15, "1 : 200", "an-t");
    return out.join("");
  })();

  /* ---------- build ---------- */

  svg.setAttribute("viewBox", "-162 -248 324 444");
  svg.innerHTML =
    `<defs><pattern id="axo-hatch" patternUnits="userSpaceOnUse" width="3.2" height="3.2" patternTransform="rotate(45)">` +
    `<path class="hatch-ln" d="M0,0V3.2"/></pattern></defs>` +
    groups.map((g) => `<g class="axo__g axo__g--${g.name}" data-lift="${g.lift}">${g.html}</g>`).join("") +
    `<g class="axo__furn">${furniture}</g>`;
  host.classList.add("is-built");

  const gEls = [...svg.querySelectorAll(".axo__g")].map((el) => ({
    el, lift: +el.dataset.lift,
    gd: [...el.querySelectorAll(".gd")].map((p) => ({ p, o: p.dataset.gd.split(",").map(Number) }))
  }));

  /* e: 0 assembled .. 1 fully exploded */
  function apply(e) {
    gEls.forEach(({ el, lift, gd }) => {
      el.setAttribute("transform", `translate(0 ${r1(-lift * e)})`);
      gd.forEach(({ p, o: [x, y] }) => {
        p.setAttribute("transform", `translate(${x} ${y}) scale(1 ${Math.max(0.001, e).toFixed(3)}) translate(${-x} ${-y})`);
        p.style.opacity = Math.min(1, e * 2.5).toFixed(2);
      });
    });
  }

  const finish = () => host.classList.add("is-drawn");

  if (reduced) { apply(0.7); finish(); return; }
  apply(0);

  /* draw line by line once it is in view */
  try {
    if ("IntersectionObserver" in window) {
      host.classList.add("is-armed");
      const io = new IntersectionObserver((ents) => {
        if (ents.some((en) => en.isIntersecting)) { finish(); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(host);
    } else finish();
  } catch (err) { finish(); }

  /* lift apart through the middle of the section, settle back at its end */
  const ss = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
  const curve = (p) => ss(0.06, 0.36, p) * (1 - ss(0.56, 0.9, p));
  if (window.gsap && window.ScrollTrigger) {
    const proxy = { e: 0 };
    const to = (e) => gsap.to(proxy, { e, duration: 0.5, ease: "power2.out", overwrite: true, onUpdate: () => apply(proxy.e) });
    ScrollTrigger.create({ trigger: host, start: "top 88%", end: "bottom 12%", onUpdate: (st) => to(curve(st.progress)) });
  } else {
    let q = false;
    const upd = () => {
      q = false;
      const r = host.getBoundingClientRect(), vh = innerHeight;
      apply(curve((vh * 0.88 - r.top) / (vh * 0.76 + r.height)));
    };
    addEventListener("scroll", () => { if (!q) { q = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
})();
