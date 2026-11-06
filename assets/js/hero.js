/* ============================================================
   VERVE v2 — hero : the illustration in a breeze
   Builds the HERO_LAYERS stack in art-space px inside
   [data-hero-stage] and frames it with ONE transform. Only the
   trees and the people move (CSS transform keyframes, generated
   per layer, compositor-only); clouds drift very slowly.
   Sky follows the site daypart (html[data-daypart], driven by
   core.js: clock default + the nav Day/Noon/Dusk button). At night only
   the surroundings change: the house keeps its daylight look, with
   warm light in the left facade openings only.
   Fails open: the static cover (.hero__fallback) stays.
   ============================================================ */
(() => {
  "use strict";

  const L = window.HERO_LAYERS;
  const doc = document, root = doc.documentElement;
  const hero = doc.querySelector("[data-hero]");
  const stage = hero && hero.querySelector("[data-hero-stage]");
  if (!L || !hero || !stage) return;

  const V = window.VERVE || null;
  const reduced = V && typeof V.reduced === "boolean" ? V.reduced
    : root.classList.contains("reduced") || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const AW = L.w, AH = L.h;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f3 = (n) => Math.round(n * 1000) / 1000;
  const px = (n) => `${f3(n)}px`;

  /* framing : keep the house, the street people and a band of sky */
  const F = { focus: [690, 1450], crownTop: 95, skyGap: 56, feet: 906, extSky: 0.92 };
  const SKIES = ["morning", "noon", "night"];
  const SKY_SRC = Object.assign({ noon: L.sky.src }, L.skies || {});
  const SKY_TOP = { morning: "#c8d1d3", noon: "#c9d2cb", night: "#161a35" };
  const GUST = 17;                                         // s — one breeze field for every tree / person

  function el(tag, cls, parent, html) {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }
  function box(n, b) {
    Object.assign(n.style, { left: px(b.x), top: px(b.y), width: px(b.w), height: px(b.h) });
    return n;
  }
  const imgs = [];
  function pic(parent, src, essential, lazy) {
    const im = el("img", "", parent);
    im.alt = ""; im.draggable = false; im.decoding = "async";
    if (lazy) im.dataset.src = src; else im.src = src;
    if (!lazy) imgs.push({ im, essential });
    return im;
  }

  /* ---------- keyframes (one <style>, compositor-only transforms) ---------- */

  const css = [];
  let kfId = 0;
  function keyframes(stops) {                             // stops: [[pct, transform], ...]
    const name = `hs-k${kfId++}`;
    css.push(`@keyframes ${name}{${stops.map(([p, t]) => `${f3(p)}%{transform:${t}}`).join("")}}`);
    return name;
  }
  function animate(n, name, dur, delay, extra) {
    if (reduced) return;
    n.style.animation = `${name} ${f3(dur)}s ${extra || "ease-in-out"} ${f3(delay)}s infinite`;
  }
  /* breeze gust: amplitude swells every GUST s, travelling left → right */
  function gust(n, deg, cx, origin) {
    n.style.transformOrigin = origin;
    const g = (k) => `rotate(${f3(deg * k)}deg) skewX(${f3(-deg * k * 0.35)}deg)`;
    const name = keyframes([[0, g(0)], [9, g(0.55)], [15, g(1)], [22, g(0.35)], [28, g(0.8)], [40, g(0.1)], [52, g(0)], [100, g(0)]]);
    animate(n, name, GUST, (cx / AW) * 1.8 - GUST + 4);
  }
  function sway(n, deg, period, origin, skew, lift) {
    n.style.transformOrigin = origin;
    const t = (k) => `rotate(${f3(deg * k)}deg) skewX(${f3(-deg * k * (skew || 0.4))}deg)${lift ? ` translateY(${f3(k > 0 ? -lift : 0)}px)` : ""}`;
    if (reduced) return;
    n.style.animation = `${keyframes([[0, t(-1)], [100, t(1)]])} ${f3(period)}s ease-in-out ${f3(-Math.random() * period)}s infinite alternate`;
  }

  /* ---------- build ---------- */

  hero.classList.add("is-staged");
  if (reduced) hero.classList.add("is-still");
  const world = el("div", "hs-world", stage);
  const skyL = el("div", "hs-sky", world);
  el("div", "hs-sky-ext", skyL);
  const skyImg = {};
  ["noon", "morning", "night"].forEach((k) => { skyImg[k] = pic(skyL, SKY_SRC[k] || L.sky.src, k === "noon", k !== "noon"); skyImg[k].className = `hs-sky-img hs-sky--${k}`; });
  const night = el("div", "hs-night", skyL);
  const cloudsL = el("div", "hs-clouds", world);
  const land = el("div", "hs-land", world);
  const treesL = el("div", "hs-trees", land);
  const sceneL = el("div", "hs-scene", land);
  el("div", "hs-earth-ext", land);
  const tint = el("div", "hs-tint", world);
  /* the house sits above the night haze: daylight look in every sky */
  const houseL = L.house ? box(el("div", "hs-house", world), L.house) : null;
  if (houseL) pic(houseL, L.house.src, true);
  const glow = el("div", "hs-glow", world);
  const folk = el("div", "hs-land hs-folk", world);          // people sit in front of the lit rooms

  /* night sky: soft stars (three twinkle groups) + crescent moon — behind everything */
  (function stars() {
    let seed = 11;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let g = 0; g < 3; g++) {
      let dots = "";
      for (let i = 0; i < 18; i++) {
        const x = r() * AW, y = r() * 1900, rad = 1.3 + r() * 1.4 * (r() > 0.86 ? 1.7 : 1);
        dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}"/>`;
      }
      const sv = el("div", "", null, `<svg class="hs-stars hs-stars--${g}" viewBox="0 0 ${AW} 1900" aria-hidden="true">${dots}</svg>`).firstChild;
      night.appendChild(sv);
    }
    const S = L.sun || { x: 1110, y: 105 };
    const m = el("div", "hs-moon", night, `<svg viewBox="-60 -60 120 120" aria-hidden="true"><defs>
      <radialGradient id="hsMoonGlow"><stop offset="0" stop-color="#ffeccc" stop-opacity=".42"/><stop offset="1" stop-color="#ffeccc" stop-opacity="0"/></radialGradient>
      <mask id="hsMoonCut"><rect x="-60" y="-60" width="120" height="120" fill="#fff"/><circle cx="10" cy="-7" r="19" fill="#000"/></mask></defs>
      <circle r="58" fill="url(#hsMoonGlow)"/><circle r="22" fill="#f5e7c8" mask="url(#hsMoonCut)"/></svg>`);
    box(m, { x: S.x - 60, y: S.y - 60, w: 120, h: 120 });
  })();

  /* clouds: very slow drift to the right, wrapping (starts at rest) */
  const CL = L.clouds || [];
  const extra = CL.length > 4 ? [[2, 120, -330], [4, 980, -250], [5, 560, -130], [3, 1250, -420]] : [];
  CL.concat(extra.map(([i, x, y]) => Object.assign({}, CL[i], { x, y, ext: 1 }))).forEach((c) => {
    const n = box(el("div", `hs-cloud${c.y <= 1 && c.y >= 0 ? " hs-cut" : ""}${c.ext ? " hs-cloud--ext" : ""}`, cloudsL), c);
    pic(n, c.src, false);
    const span = AW + c.w + 40, v = Math.max(1.2, (c.speed || 3) * 0.6), dur = span / v;
    const name = keyframes([[0, `translate3d(${px(-(c.x + c.w + 20))},0,0)`], [100, `translate3d(${px(AW - c.x + 20)},0,0)`]]);
    animate(n, name, dur, -((c.x + c.w + 20) / span) * dur, "linear");
  });

  /* back trees: sway about the trunk + the shared gust */
  (L.backTrees || []).forEach((t, i) => {
    const o = `${px(t.px - t.x)} ${px(t.py - t.y)}`;
    const n = box(el("div", `hs-tree${t.y <= 1 ? " hs-cut" : ""}`, treesL), t);
    const sw = el("div", "hs-fill", n);
    pic(sw, t.src, true);
    gust(n, clamp((t.amp || 0.8) * 0.9, 0.5, 1.2), t.px, o);
    sway(sw, clamp((t.amp || 0.8) * 1.15, 0.6, 1.5), (t.period || 8) * (0.7 + 0.05 * i), o, 0.45);
  });

  pic(sceneL, L.scene.src, true);

  /* foreground trees still drawn in the scene: crown-only shimmer (tiny, no ghosting) */
  (L.rustle || []).forEach((r, i) => {
    const n = box(el("div", "hs-rustle", land), r);
    const sh = el("div", "hs-fill", n);
    pic(sh, r.src, false);
    gust(n, 0.32, r.x + r.w / 2, "50% 100%");
    sway(sh, 0.28, 3.4 + i * 0.55, "50% 100%", 0.9);
  });

  /* the people who stay put: idle sway about the feet, breath, sari flutter */
  (L.stickers || []).forEach((p) => {
    const o = `${px(p.px - p.x)} ${px(p.py - p.y)}`;
    const Hs = L.house;                                    // people in / at the house stay in its daylight
    const inside = Hs && !p.street && p.px > Hs.x && p.px < Hs.x + Hs.w && p.py < Hs.y + Hs.h;
    const n = box(el("div", `hs-person${inside ? " is-in" : ""}`, folk), p);
    const id = el("div", "hs-fill", n);
    pic(id, p.src, true);
    gust(n, 0.7, p.px, o);
    sway(id, clamp((p.amp || 1.2) * 0.8, 0.6, 1.4), p.period || 6, o, 0.5, 0.9);
  });

  /* walkers: slow stroll along their path (with step bob), turn, pause; ping-pong */
  (L.movers || []).forEach((m, i) => {
    const path = m.path && m.path.length ? m.path : [[m.x, m.y]];
    const a = path[0], b = path[path.length - 1];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const ride = m.id === "cyclist";
    const walk = Math.max(2.5, Math.hypot(dx, dy) / (ride ? 8 : 6.5));
    const T = Math.max(m.duration || 16, 2 * walk + 5), pause = (T - 2 * walk) / 2;
    const n = box(el("div", "hs-person hs-walker", folk), { x: a[0], y: a[1], w: m.w, h: m.h });
    const face = el("div", "hs-fill", n);
    const idle = el("div", "hs-fill", face);
    pic(idle, m.src, true);
    const bob = Math.max(0.6, (m.bob || 0.7) * (ride ? 0.8 : 1.4)), step = ride ? 0.42 : 0.36;
    const st = [], at = (t) => (t / T) * 100;
    const leg = (t0, from, to) => {
      const k = Math.max(2, Math.round(walk / step));
      for (let j = 0; j <= k; j++) {
        const u = j / k, y = j % 2 && j < k ? -bob : 0;
        st.push([at(t0 + u * walk), `translate3d(${px(from * dx + (to - from) * u * dx)},${px(from * dy + (to - from) * u * dy + y)},0)`]);
      }
    };
    st.push([0, "translate3d(0,0,0)"]);
    leg(0, 0, 1);
    leg(walk + pause, 1, 0);
    st.push([100, "translate3d(0,0,0)"]);
    const delay = 0.8 + i * 1.9;
    animate(n, keyframes(st), T, delay, "linear");
    /* facing: mirror while walking against the sprite's native facing */
    const native = m.face === "left" ? -1 : m.face === "right" ? 1 : 0, dir = Math.sign(dx) || 1;
    if (native && !reduced) {
      const m1 = dir === native ? 1 : -1, t1 = at(walk + pause / 2), t2 = at(2 * walk + pause * 1.5);
      const sx = (v) => `scaleX(${v})`;
      const name = keyframes([[0, sx(m1)], [t1, sx(m1)], [t1 + 0.01, sx(-m1)], [Math.min(99.98, t2), sx(-m1)], [Math.min(99.99, t2 + 0.01), sx(m1)], [100, sx(m1)]]);
      face.style.animation = `${name} ${f3(T)}s steps(1, end) ${f3(delay)}s infinite`;
    }
    sway(idle, ride ? 0.4 : 0.9, 2.4 + i * 0.3, "50% 100%", 0.6);
  });

  /* night: warm light in the LEFT facade openings only (no interiors), two flicker softly */
  if (L.facade) pic(box(el("div", "hs-facade", glow), L.facade), L.facade.src, false, true);
  const wins = (L.dusk && L.dusk.windowGlow) || [];
  [5, 12].forEach((k, i) => {
    const r = wins[k];
    if (!r || !L.facade || r.x + r.w > L.facade.x + L.facade.w) return;
    const w = box(el("i", "hs-flick", glow), { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4 });
    w.style.setProperty("--d", `${-i * 2.3}s`);
  });

  const kf = el("style", "", doc.head);
  kf.textContent = css.join("\n");

  /* ---------- framing : one transform ---------- */

  const fallback = hero.querySelector(".hero__fallback");
  let frame = { s: 1, X: 0, T: 0 };
  function layout() {
    const Wv = hero.clientWidth, Hv = hero.clientHeight;
    if (!Wv || !Hv) return;
    const fw = F.focus[1] - F.focus[0];
    /* always fit the full width so the whole illustration shows (portrait screens get
       extra sky above instead of a zoomed crop — hero.css sizes the hero to the art) */
    const s = (Wv + 1) / AW;
    void fw;
    const visW = Wv / s, visH = Hv / s;
    const X = visW < AW ? clamp((F.focus[0] + F.focus[1]) / 2 - visW / 2, 0, AW - visW) : 0;
    let T;
    if (visH >= AH - 2) T = -Math.max(0, visH - AH) * F.extSky;   // whole art in view (hero sized to it)
    else {
      const cap = Math.max(0, F.crownTop - F.skyGap / s), floor = F.feet - visH;   // sky above the crowns / feet in view
      T = clamp(floor > cap ? cap : clamp(cap * 0.45, floor, cap), 0, AH - visH);
    }
    frame = { s, X, T };
    const tf = `translate3d(${px(-X * s)},${px(-T * s)},0) scale(${f3(s * 1e3) / 1e3})`;
    world.style.transform = tf;
    if (fallback) { fallback.classList.add("is-framed"); fallback.style.width = px(AW); fallback.style.height = px(AH); fallback.style.transform = tf; }
    hero.classList.toggle("is-ext", T < 0);
    hero.style.setProperty("--hs-s", f3(s));
  }
  layout();
  let rz = 0;
  const onResize = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); };
  addEventListener("resize", onResize, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(hero);

  /* ---------- sky : follows the site daypart (core.js) ---------- */

  const byClock = () => { const h = new Date().getHours(); return h >= 5 && h < 11 ? "morning" : h >= 11 && h < 18 ? "noon" : "night"; };
  function daypart() {
    if (V && V.theme && typeof V.theme.daypart === "function") return V.theme.daypart();
    const d = root.dataset.daypart;
    return SKIES.includes(d) ? d : root.dataset.theme === "dusk" ? "night" : byClock();
  }
  function wake(n) { if (n && n.dataset.src && !n.getAttribute("src")) n.src = n.dataset.src; return n; }
  const ready = (im) => (im.complete && im.naturalWidth ? Promise.resolve() : im.decode ? im.decode().catch(() => {}) : Promise.resolve());

  let sky = null, skyReq = 0;
  function setSky(k, opts) {
    opts = opts || {};
    if (!SKIES.includes(k)) return;
    const req = ++skyReq;
    const im = wake(skyImg[k]);
    if (k === "night") glow.querySelectorAll("img").forEach(wake);
    const apply = () => {
      if (req !== skyReq) return;
      if (opts.instant) hero.classList.add("no-fade");
      sky = k;
      hero.dataset.sky = k;
      hero.style.setProperty("--hs-top", SKY_TOP[k]);
      if (opts.instant) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.remove("no-fade")));
    };
    const night = k === "night" && glow.querySelector("img");
    Promise.all([ready(im), night ? ready(night) : null]).then(apply);
  }
  doc.addEventListener("verve:theme", (e) => {
    const d = e && e.detail && e.detail.daypart;
    setSky(SKIES.includes(d) ? d : daypart());
  });
  setSky(daypart(), { instant: true });

  /* ---------- load : fallback until the layers decode ---------- */

  const essential = imgs.filter((x) => x.essential).map((x) => x.im);
  if (V && typeof V.preload === "function") V.preload(imgs.map((x) => x.im.src).concat(skyImg[sky || "noon"].src || []));
  let failed = false;
  const settle = (im) => new Promise((res) => {
    if (im.complete) { if (!im.naturalWidth) failed = true; return res(); }
    im.addEventListener("load", () => res(), { once: true });
    im.addEventListener("error", () => { failed = true; res(); }, { once: true });
  });
  Promise.race([Promise.all(essential.map(settle)), new Promise((r) => setTimeout(() => { failed = true; r(); }, 9000))])
    .then(() => Promise.all(essential.map((im) => (im.decode ? im.decode().catch(() => {}) : null))))
    .then(() => {
      if (failed) { hero.classList.add("is-failed"); return; }
      requestAnimationFrame(() => { hero.classList.add("is-live"); setRun(); });
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
      idle(() => { SKIES.forEach((k) => wake(skyImg[k])); glow.querySelectorAll("img").forEach(wake); });
    });

  /* ---------- run only while visible ---------- */

  let inView = true;
  function setRun() {
    const on = inView && !doc.hidden && hero.classList.contains("is-live");
    hero.classList.toggle("is-paused", !on);
  }
  hero.classList.add("is-paused");
  if (window.IntersectionObserver) {
    new IntersectionObserver((es) => { inView = es[es.length - 1].isIntersecting; setRun(); }, { rootMargin: "40px 0px" }).observe(hero);
  }
  doc.addEventListener("visibilitychange", setRun);

  if (V) V.hero = { setSky, get sky() { return sky; }, get frame() { return frame; } };
})();
