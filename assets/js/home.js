/* ============================================================
   VERVE v2 — home page
   Renders the work cards, drawing marquee, about and contact
   from window.PROJECTS / window.HOME. Work cards stack as you
   scroll (sticky, transforms only). The contact band opens with a ground
   line drawn like the cover's section cut, with trees and people
   moving in the breeze. Degrades to a static page if core fails.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PROJECTS = window.PROJECTS || [];
  const HOME = window.HOME || {};
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  const isReduced = () => (typeof V.reduced === "boolean" ? V.reduced : mq("(prefers-reduced-motion: reduce)"));
  const img = (tier, slug) => (V.img ? V.img(tier, slug) : `assets/img/${tier}/${slug}.jpg`);
  const dim = (slug) => (V.dim ? V.dim(slug) : (window.DIMS && window.DIMS[slug]) || [1600, 1100]);
  const plain = (html) => { const d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent.trim(); };
  const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const safe = (name, fn) => { try { fn(); } catch (e) { console.warn(`[home] ${name}:`, e); } };

  /* ---------- work : stacking project cards ---------- */

  const SCALE = `<svg class="glyph-scale" viewBox="0 0 84 12" aria-hidden="true"><path d="M1 2 V10 H83 V2 M21.5 6 V10 M42 2 V10 M62.5 6 V10"/><path class="fill" d="M1 7 H21.5 V10 H1Z M42 7 H62.5 V10 H42Z"/></svg>`;

  function panel(p, i, n) {
    const [cw, ch] = dim(p.cover);
    const thumbs = (p.thumbs || []).slice(0, 3);
    const meta = [p.practice, p.place, p.year].filter(Boolean).join(" · ");
    const name = plain(p.name);
    return `<article class="wpanel${ch > cw ? " wpanel--tall" : ""}" style="--accent:${attr(p.accent || "var(--terra)")};--i:${i}" data-id="${attr(p.id)}">
      <a class="wpanel__card" href="project.html?p=${encodeURIComponent(p.id)}" data-cursor="view"
         aria-label="${attr(`${p.no} ${name} — ${plain(p.typology)}. View project`)}">
        <div class="wpanel__info">
          <div class="wpanel__top">
            <span class="wpanel__no num">${p.no}<span class="wpanel__of"> / ${String(n).padStart(2, "0")}</span></span>
            ${SCALE}
          </div>
          <h3 class="wpanel__name display">${p.name}</h3>
          <p class="wpanel__meta label">${meta}</p>
          ${p.typology ? `<p class="wpanel__typ">${p.typology}</p>` : ""}
          <div class="wpanel__foot">
            <ul class="wpanel__thumbs" aria-hidden="true">${thumbs.map((t, k) => {
              const [tw, th] = dim(t);
              return `<li data-thumb="${k}"><img src="${img("thumb", t)}" width="${tw}" height="${th}" alt="" loading="lazy" decoding="async"></li>`;
            }).join("")}</ul>
            <span class="wpanel__cta label">View project <span class="wpanel__arrow" aria-hidden="true">→</span></span>
          </div>
        </div>
        <div class="wpanel__media">
          <div class="wpanel__frame">
            <img class="wpanel__cover" src="${img("web", p.cover)}" width="${cw}" height="${ch}" alt="${attr(name)} — cover drawing"
                 ${i ? 'loading="lazy"' : ""} decoding="async">
            ${thumbs.map((t, k) => {
              const [tw, th] = dim(t);
              return `<img class="wpanel__alt" data-alt="${k}" data-src="${img("web", t)}" width="${tw}" height="${th}" alt="" decoding="async">`;
            }).join("")}
          </div>
          <span class="wpanel__tick wpanel__tick--tl" aria-hidden="true"></span>
          <span class="wpanel__tick wpanel__tick--br" aria-hidden="true"></span>
          <span class="wpanel__stamp label" aria-hidden="true"><span>Sheet ${p.no}</span></span>
        </div>
        <span class="wpanel__shade" aria-hidden="true"></span>
      </a>
    </article>`;
  }

  function renderWork() {
    const list = $("[data-work-list]");
    if (!list || !PROJECTS.length) return;
    list.innerHTML = PROJECTS.map((p, i) => panel(p, i, PROJECTS.length)).join("");
    const count = $("[data-work-count]");
    if (count) count.textContent = String(PROJECTS.length).padStart(2, "0");
    $$(".wpanel", list).forEach(wireThumbs);
  }

  /* hover a thumb → crossfade that drawing into the cover frame */
  function wireThumbs(panelEl) {
    const card = $(".wpanel__card", panelEl);
    const alts = $$(".wpanel__alt", panelEl);
    let primed = false;
    const prime = () => {
      if (primed) return;
      primed = true;
      alts.forEach((a) => { if (a.dataset.src) a.src = a.dataset.src; });
    };
    card.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") prime(); });
    card.addEventListener("focus", prime);
    $$("[data-thumb]", panelEl).forEach((li) => {
      const k = li.dataset.thumb;
      li.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        prime();
        alts.forEach((a) => a.classList.toggle("is-on", a.dataset.alt === k));
        panelEl.classList.add("is-alt");
      });
      li.addEventListener("pointerleave", () => {
        alts.forEach((a) => a.classList.remove("is-on"));
        panelEl.classList.remove("is-alt");
      });
    });
  }

  /* sticky stacking: the previous card recedes (scale + dim) as the next slides over */
  function stackMotion() {
    if (!(window.gsap && window.ScrollTrigger) || isReduced()) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add("(min-width: 1px)", () => {   /* desktop and phones */
      const panels = $$(".wpanel");
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        if (!next) return;
        gsap.timeline({ scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true } })
          .to($(".wpanel__card", p), { scale: 0.94, ease: "none" }, 0)
          .to($(".wpanel__shade", p), { opacity: 0.55, ease: "none" }, 0);
      });
    });
  }

  /* ---------- drawings (two-row marquee) ---------- */

  function collectDrawings() {
    const seen = new Set(), out = [];
    const add = (p, it) => {
      if (!it || !it.src || seen.has(it.src)) return;
      seen.add(it.src);
      const note = [p.name, it.note].filter(Boolean).join(" — ");
      out.push({ src: it.src, title: it.title || p.name, note, no: p.no });
    };
    PROJECTS.forEach((p) => (p.blocks || []).forEach((b) => {
      if (b.item) add(p, b.item);
      if (b.type === "compare") { add(p, b.a); add(p, b.b); }
      if (b.type === "legend") add(p, { src: b.src, title: b.title, note: b.label });
      else if (Array.isArray(b.items)) b.items.forEach((it) => add(p, it));
    }));
    return out;
  }

  function renderDrawings() {
    const host = $("[data-drawings]");
    if (!host) return;
    const items = collectDrawings();
    if (!items.length) return;
    if (V.lightbox && typeof V.lightbox.register === "function") V.lightbox.register("all", items);
    /* round-robin across projects so each row mixes the folio */
    const byProject = {};
    items.forEach((it, i) => (byProject[it.no] = byProject[it.no] || []).push(i));
    const queues = Object.values(byProject), order = [];
    while (queues.some((q) => q.length)) queues.forEach((q) => { if (q.length) order.push(q.shift()); });
    const half = Math.ceil(order.length / 2);
    const rows = [order.slice(0, half), order.slice(half)];
    const sheet = (i) => {
      const it = items[i];
      const [w, h] = dim(it.src);
      return `<button class="dsheet" type="button" data-lb-group="all" data-lb-index="${i}" data-cursor="zoom"
          aria-label="${attr(`Open ${plain(it.title)} — ${plain(it.note)}`)}">
        <span class="dsheet__paper"><img src="${img("thumb", it.src)}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async"></span>
      </button>`;
    };
    host.innerHTML = rows.map((r, k) =>
      `<div class="drawings__row marquee" data-marquee${k ? ' data-marquee-dir="-1"' : ""}>
        <div class="marquee__track">${r.map(sheet).join("")}</div>
      </div>`).join("");
    /* hide any thumb that fails (e.g. a slug not exported yet) */
    $$(".dsheet img", host).forEach((im) => im.addEventListener("error", () => {
      const b = im.closest(".dsheet"); if (b) b.hidden = true;
    }, { once: true }));
  }

  /* ---------- about ---------- */

  function renderAbout() {
    const bio = $("[data-about-bio]");
    if (bio && HOME.bio && HOME.bio.length) {
      const [first, ...rest] = HOME.bio;
      bio.innerHTML = `<p class="about__lead" data-reveal="up">${first}</p>` + (rest.length
        ? `<details class="about__more"><summary class="label" data-cursor="link">More</summary>${rest.map((t) => `<p>${t}</p>`).join("")}</details>`
        : "");
    }

    const stats = $("[data-about-stats]");
    if (stats && HOME.stats) stats.innerHTML = HOME.stats.map((s, i) =>
      `<div class="stat" data-reveal="up" data-reveal-delay="${(i * 0.1).toFixed(2)}">
        <dt class="label">${s.label}</dt>
        <dd class="stat__n display"><span data-count="${s.n}"${s.suffix ? ` data-count-suffix="${attr(s.suffix)}"` : ""}>${s.n}${s.suffix || ""}</span></dd>
      </div>`).join("");

    const caps = $("[data-about-caps]");
    if (caps && HOME.capabilities) caps.innerHTML = HOME.capabilities.map((c, i) =>
      `<li><span>${c}</span><i aria-hidden="true"></i><span class="num">${String(i + 1).padStart(2, "0")}</span></li>`).join("");

    const pr = $("[data-about-practices]");
    if (pr && HOME.practices) pr.innerHTML = HOME.practices.map((p) =>
      `<li><span class="practices__name">${p.name}</span><i aria-hidden="true"></i><span class="label">${p.place}</span></li>`).join("");
  }

  /* ---------- contact ---------- */

  function renderContact() {
    const mail = $("[data-contact-email]");
    if (mail && HOME.email) { mail.href = `mailto:${HOME.email}`; mail.textContent = HOME.email; }
    const ig = $("[data-contact-ig]");
    if (ig && HOME.instagram) {
      ig.href = `https://www.instagram.com/${encodeURIComponent(HOME.instagram)}/`;
      ig.textContent = `Instagram — @${HOME.instagram} ↗`;
    }
  }

  /* ---------- ground line : the cover's section cut, continued ----------
     A natural, undulating ground line cut through the earth poché. Below it,
     stones drawn like a soil section thin out and fade with depth; above it a
     jungle of the cover's own trees, palms, plants, grass and people stands on
     the curve and moves in the breeze. Everything is seeded, so it is stable. */

  const GA = "assets/img/ground/";
  /* sprite: [art w, art h, trunk / feet anchor as a fraction of w] */
  const LIB = {
    "tree-a": [329, 373, .45], "tree-b": [293, 325, .56], "tree-c": [163, 373, .61], "tree-d": [140, 280, .5],
    "tree-e": [376, 453, .55], "palm": [215, 345, .5], "palm-fan": [215, 191, .57], "banana": [134, 95, .48],
    "fern-1": [96, 56, .44], "flower-1": [64, 44, .52], "grass-1": [70, 38, .59], "grass-2": [110, 50, .51],
    "grass-3": [54, 62, .48], "p-cyclist": [53, 113, .46], "p-dhoti": [37, 109, .61], "p-girl": [31, 69, .53],
    "p-mother": [92, 124, .39], "p-sari": [43, 124, .38], "p-umbrella": [52, 114, .61]
  };
  const BACK = ["tree-e", "tree-b", "tree-a", "tree-c", "palm", "tree-e", "tree-d"];
  const MID = ["tree-a", "tree-b", "palm", "tree-c", "tree-e", "tree-d", "tree-a", "palm"];
  const PLANTS = ["banana", "palm-fan", "fern-1", "banana", "flower-1"];
  const GRASS = ["grass-2", "grass-1", "grass-3", "grass-2", "fern-1", "flower-1", "grass-1"];
  /* people: dx = walk (art px, signed, 0 = stands and sways), flip = turns round at the far end */
  const PEOPLE = [
    { s: "p-mother", dx: 120, dur: 46, flip: 1 }, { s: "p-dhoti", dx: 70, dur: 40 },
    { s: "p-umbrella", dx: -110, dur: 42, flip: 1 }, { s: "p-girl" },
    { s: "p-cyclist", dx: -150, dur: 60, flip: 1 }, { s: "p-sari" }
  ];

  const seeded = (a) => () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const f1 = (n) => n.toFixed(1);

  /* a smooth closed stone outline through jittered points (quadratic midpoints) */
  function stone(cx, cy, r, flat, rnd) {
    const n = 7 + Math.floor(rnd() * 4), rot = (rnd() - .5) * .6, p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - .5) * .5, k = .8 + rnd() * .3;
      const x = Math.cos(a) * r * k, y = Math.sin(a) * r * k * flat;
      p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = `M${mid(p[n - 1], p[0]).map(f1).join(" ")}`;
    for (let i = 0; i < n; i++) d += `Q${p[i].map(f1).join(" ")} ${mid(p[i], p[(i + 1) % n]).map(f1).join(" ")}`;
    return d + "Z";
  }

  function soil(W, yAt, top, D, u, rnd) {
    const k = Math.max(.6, u / .74), placed = [];
    let rocks = "", hi = "", lo = "", dots = "";
    const tries = Math.round(W * D / (26 * k * k));
    for (let i = 0; i < tries && placed.length < W / 6; i++) {
      const x = rnd() * W, t = Math.pow(rnd(), 1.5);
      if (rnd() > Math.pow(1 - t, 1.4)) continue;            // sparser with depth
      const big = rnd() < .26 * (1 - t);
      const r = (big ? 9 + rnd() * 13 : 2 + rnd() * 5) * k * (1 - .35 * t), flat = .55 + rnd() * .3;
      const y = yAt(x) + 5 + r * flat + t * D;
      if (y - r * flat < Math.max(yAt(x - r), yAt(x + r)) + 3) continue;
      if (placed.some(([px, py, pr]) => Math.hypot(px - x, (py - y) * 1.4) < pr + r + 2 * k)) continue;
      placed.push([x, y, r]);
      rocks += `<path class="gr gr--${1 + Math.floor(rnd() * 4)}" d="${stone(x, y, r, flat, rnd)}"/>`;
      if (r > 6 * k) {
        hi += `M${f1(x - r * .55)} ${f1(y - r * flat * .2)}Q${f1(x - r * .3)} ${f1(y - r * flat * .7)} ${f1(x + r * .2)} ${f1(y - r * flat * .62)}`;
        if (rnd() < .4) hi += `M${f1(x + r * .1)} ${f1(y + r * flat * .1)}l${f1(r * .3)} ${f1(r * flat * .35)}`;
        lo += `M${f1(x - r * .5)} ${f1(y + r * flat * .55)}Q${f1(x + r * .25)} ${f1(y + r * flat * .95)} ${f1(x + r * .78)} ${f1(y + r * flat * .2)}`;
      }
    }
    for (let i = 0, n = Math.round(W / 3.2); i < n; i++) {   // fine soil stipple
      const x = rnd() * W, t = Math.pow(rnd(), 1.8);
      dots += `M${f1(x)} ${f1(yAt(x) + 3 + t * D * 1.1)}h.01`;
    }
    const strata = [.42, .78].map((g) => {
      let d = "";
      for (let x = 0; x <= W + 12; x += 12) d += `${x ? "L" : "M"}${x} ${f1(yAt(x) + g * D)}`;
      return `<path class="gr-strata" d="${d}"/>`;
    }).join("");
    return `<defs><linearGradient id="gfade" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(top)}" x2="0" y2="${f1(top + D * 1.15)}">
      <stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="gmask"><rect x="0" y="0" width="${W}" height="${f1(top + D * 1.3)}" fill="url(#gfade)"/></mask></defs>
      <g mask="url(#gmask)">${strata}<path class="gr-dots" d="${dots}"/>${rocks}<path class="gr-lo" d="${lo}"/><path class="gr-hi" d="${hi}"/></g>`;
  }

  function renderGround() {
    const host = $("[data-ground]");
    if (!host) return;
    let lastW = 0;

    const layout = () => {
      const W = host.clientWidth;
      if (!W || W === lastW) return;
      lastW = W;
      const rnd = seeded(20251101), mob = W < 720;
      const u = Math.min(.66, Math.max(.36, (W / 1440) * .58)), k = u / .74;   /* compact: jungle + contact fit one screen */
      const A = Math.max(13, 36 * k), sceneH = Math.round(410 * u + A);
      const D = Math.round(Math.max(56, 105 * k)), yb = sceneH, H = Math.round(yb + A + D);
      const ph = [rnd() * 6.3, rnd() * 6.3, rnd() * 6.3], lam = Math.max(.6, k);
      const yAt = (x) => yb + A * (.55 * Math.sin(x / (150 * lam) + ph[0]) + .3 * Math.sin(x / (78 * lam) + ph[1]) +
        .15 * Math.sin(x / (41 * lam) + ph[2]));
      host.style.height = `${H}px`;

      /* sprites stand on the curve; they sink a little under the poché */
      const items = [];
      const add = (cls, name, x, sc, z, extra = {}) => {
        const [aw, ah, ax] = LIB[name], w = aw * sc * u, h = ah * sc * u;
        const it = { cls, name, x, w, h, ax, z, sink: Math.max(2, 5 * k) + (extra.sink || 0) * h, ...extra };
        it.left = x - w * ax; it.top = yAt(x) + it.sink - h;
        items.push(it);
        return it;
      };
      const row = (list, gap, jit, scLo, scHi, cls, z, opt = {}) => {
        let x = -gap * rnd() * .6, i = Math.floor(rnd() * list.length);
        while (x < W + gap * .5) {
          const name = list[i++ % list.length];
          add(cls, name, x, scLo + rnd() * (scHi - scLo), z, {
            flip: rnd() < .5, amp: (opt.amp || 1) * (.6 + rnd() * .9), per: (opt.per || 7) * (.8 + rnd() * .5),
            hue: Math.round((rnd() - .5) * (opt.hue || 16)), br: (.92 + rnd() * .14).toFixed(2)
          });
          x += gap * (1 - jit / 2 + rnd() * jit) * (mob ? 1.3 : 1);
        }
      };
      row(BACK, 120 * u, .7, .55, .8, "g--tree g--back", 1, { amp: .7, per: 11, hue: 24 });
      row(MID, 205 * u, .6, .72, 1.02, "g--tree", 2, { amp: 1.1, per: 8 });
      row(PLANTS, 150 * u, .8, .55, .85, "g--plant", 4, { amp: 1.6, per: 5.5 });
      row(GRASS, 34 * u, .9, .75, 1.25, "g--grass", 5, { amp: 3, per: 3.2, hue: 10 });
      const nPeople = W >= 1200 ? 6 : W >= 720 ? 4 : 2;
      PEOPLE.slice(0, nPeople).forEach((p, i) => {
        const x = W * (i + .25 + rnd() * .5) / nPeople;
        const it = add(p.dx ? "g--person g--walk" : "g--person g--idle", p.s, x, 1, 6, p);
        it.dl = -rnd() * (p.dur || 6);
      });

      /* walkers follow the ground: per-walker keyframes sampled from the curve */
      let keys = "";
      items.forEach((it, i) => {
        if (!it.dx) return;
        const dxPx = it.dx * u, y0 = yAt(it.x), stops = [];
        for (let s = 0; s <= 10; s++) {
          const t = s / 10, dx = dxPx * t, dy = yAt(it.x + dx) - y0;
          stops.push([t * 49.9, `translate(${f1(dx)}px,${f1(dy)}px)`, 1]);
          stops.push([100 - t * 50, `translate(${f1(dx)}px,${f1(dy)}px)`, it.flip ? -1 : 1]);
        }
        stops.sort((a, b) => a[0] - b[0]);
        keys += `@keyframes gw${i}{${stops.map(([p, tr, m]) => `${p.toFixed(2)}%{transform:${tr} scaleX(${m})}`).join("")}}`;
      });

      const sp = items.map((it, i) => `<span class="g ${it.cls}" style="left:${f1(it.left)}px;top:${f1(it.top)}px;width:${f1(it.w)}px;z-index:${it.z};${
        it.dx ? `--an:gw${i};--dur:${it.dur}s;` : ""}--per:${f1(it.per || 6)}s;--amp:${(it.amp || 1).toFixed(2)}deg;--dl:${f1(it.dl != null ? it.dl : -rnd() * 9)}s;--ox:${(it.ax * 100).toFixed(0)}%;--hue:${it.hue || 0}deg;--br:${it.br || 1}"><img
        src="${GA}${it.name}.webp" width="${LIB[it.name][0]}" height="${LIB[it.name][1]}" alt="" loading="lazy" decoding="async"${it.flip && !it.dx ? ' class="is-flip"' : ""}></span>`).join("");

      const top = yb - A;
      let line = "";
      for (let x = 0; x <= W + 6; x += 6) line += `${x ? "L" : "M"}${x} ${f1(yAt(Math.min(x, W)))}`;
      host.innerHTML = `<style>${keys}</style><div class="ground__scene">${sp}</div>
        <svg class="ground__cut" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">
        <path class="ground__poche" d="${line}L${W} ${H}L0 ${H}Z"/>${soil(W, yAt, top, D, u, rnd)}<path class="ground__line" d="${line}"/></svg>`;
      host.classList.add("is-drawn");
    };
    layout();
    let t = 0;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(layout, 150); });

    /* animate only while the band is on screen */
    host.classList.add("is-paused");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => ents.forEach((e) => host.classList.toggle("is-paused", !e.isIntersecting)),
        { rootMargin: "120px 0px" }).observe(host);
    } else host.classList.remove("is-paused");
    if (isReduced()) host.classList.add("is-still");
  }

  /* ---------- failsafe: never leave content hidden ---------- */

  function failsafe() {
    if (V.reveal && typeof V.reveal.scan === "function") return;
    $$("[data-reveal]").forEach((e) => {
      e.style.opacity = "1"; e.style.transform = "none"; e.style.clipPath = "none"; e.style.visibility = "visible";
    });
  }

  /* ---------- boot ---------- */

  safe("work", renderWork);
  safe("drawings", renderDrawings);
  safe("about", renderAbout);
  safe("contact", renderContact);
  safe("ground", renderGround);

  const start = () => safe("stack", stackMotion);
  if (typeof V.ready === "function") safe("ready", () => V.ready(start));
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  if (V.reveal && typeof V.reveal.scan === "function") {
    safe("reveal", () => ["#work", "#drawings", "#about", "#contact"].forEach((s) => {
      const r = $(s); if (r) V.reveal.scan(r);
    }));
  }

  /* lazy images change layout height under Lenis — refresh triggers (debounced) as they land */
  let refreshT = 0;
  const refresh = () => {
    clearTimeout(refreshT);
    refreshT = setTimeout(() => { if (window.ScrollTrigger) safe("refresh", () => window.ScrollTrigger.refresh()); }, 250);
  };
  window.addEventListener("load", refresh, { once: true });
  $$("#work img, #about img").forEach((im) => { if (!im.complete) im.addEventListener("load", refresh, { once: true }); });

  failsafe();
  window.addEventListener("load", () => setTimeout(failsafe, 1200), { once: true });
})();
