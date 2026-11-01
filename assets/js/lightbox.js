/* ============================================================
   VERVE v2 — lightbox : paper sheet on an ink scrim
   web → full swap, cursor-anchored zoom 1–8×, drag pan,
   pinch-zoom + swipe on touch, keyboard, focus trap.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const doc = document;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const IMG = V.img || ((tier, slug) => `assets/img/${tier}/${slug}.jpg`);
  const dim = V.dim || ((slug) => (window.DIMS && window.DIMS[slug]) || [1600, 1100]);
  const plain = (h) => { const d = doc.createElement("div"); d.innerHTML = h || ""; return d.textContent.trim(); };
  const reduced = () => V.reduced || doc.documentElement.classList.contains("reduced");
  const MAX = 8;

  const lb = $("[data-lightbox]");
  const api = (V.lightbox = V.lightbox || {});
  api.groups = api.groups || {};
  api.register = (name, items) => { api.groups[name] = items || []; return api.groups[name]; };
  if (!lb) { api.open = () => {}; api.close = () => {}; api.isOpen = () => false; return; }

  /* ---------- DOM ---------- */

  const ico = {
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>'
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${ico[k]}</svg>`;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Drawing viewer");
  lb.innerHTML = `<div class="lb__scrim" data-lb-close></div>
    <header class="lb__bar">
      <span class="lb__count label" aria-live="polite"></span>
      <p class="lb__cap"><b class="lb__title"></b><span class="lb__note"></span></p>
      <div class="lb__tools">
        <button class="lb__btn" type="button" data-lb-zoom="-1" aria-label="Zoom out">${svg("minus")}</button>
        <span class="lb__zoom label" aria-hidden="true">100%</span>
        <button class="lb__btn" type="button" data-lb-zoom="1" aria-label="Zoom in">${svg("plus")}</button>
        <button class="lb__btn lb__btn--close" type="button" data-lb-close aria-label="Close viewer (Esc)">${svg("close")}</button>
      </div>
    </header>
    <div class="lb__stage" data-lenis-prevent data-cursor="zoom">
      <div class="lb__frame"><div class="lb__sheet"><img class="lb__img" alt="" draggable="false"></div></div>
      <span class="lb__spin" aria-hidden="true"></span>
    </div>
    <button class="lb__nav lb__nav--prev lb__btn" type="button" data-lb-step="-1" aria-label="Previous drawing">${svg("prev")}</button>
    <button class="lb__nav lb__nav--next lb__btn" type="button" data-lb-step="1" aria-label="Next drawing">${svg("next")}</button>
    <footer class="lb__foot label"><span class="lb__hint">Scroll or pinch to zoom · drag to pan · double-click to reset · ← → to browse</span></footer>`;

  const stage = $(".lb__stage", lb), frame = $(".lb__frame", lb), sheet = $(".lb__sheet", lb), img = $(".lb__img", lb);
  const elTitle = $(".lb__title", lb), elNote = $(".lb__note", lb), elCount = $(".lb__count", lb), elZoom = $(".lb__zoom", lb);

  /* ---------- state ---------- */

  let items = [], idx = 0, open = false, lastFocus = null, opener = null;
  let s = 1, ox = 0, oy = 0, base = null, closeT = 0;

  function apply(anim) {
    sheet.classList.toggle("is-anim", !!anim);
    sheet.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(${s})`;
    elZoom.textContent = Math.round(s * 100) + "%";
    lb.classList.toggle("is-zoomed", s > 1.001);
    stage.dataset.cursor = s > 1.001 ? "drag" : "zoom";
  }
  function measure() {
    const t = sheet.style.transform;
    sheet.style.transform = "none";
    base = sheet.getBoundingClientRect();
    sheet.style.transform = t;
  }
  function clampPan() {
    if (!base) return;
    const r = stage.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    ox = clamp(ox, cx - base.left - base.width * s, cx - base.left);
    oy = clamp(oy, cy - base.top - base.height * s, cy - base.top);
  }
  function reset(anim) { s = 1; ox = 0; oy = 0; apply(anim); }
  function zoomAt(cx, cy, f, anim) {
    if (!base) measure();
    const ns = clamp(s * f, 1, MAX);
    if (ns === s) return;
    const ix = (cx - base.left - ox) / s, iy = (cy - base.top - oy) / s;
    ox = cx - base.left - ix * ns;
    oy = cy - base.top - iy * ns;
    s = ns;
    if (s <= 1.001) { s = 1; ox = 0; oy = 0; } else clampPan();
    apply(anim);
  }

  /* fit the sheet (image + paper margin) inside the stage */
  function fit() {
    const it = items[idx];
    if (!it) return;
    const [w, h] = dim(it.src);
    const r = stage.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(sheet).paddingLeft) || 0;
    const maxW = r.width * (innerWidth < 700 ? 0.96 : 0.86) - pad * 2, maxH = r.height * 0.9 - pad * 2;
    const k = Math.min(maxW / w, maxH / h);
    img.style.width = Math.round(w * k) + "px";
    img.style.height = Math.round(h * k) + "px";
    img.width = w; img.height = h;
  }

  function show(i, dir = 0) {
    if (!items.length) return;
    idx = (i + items.length) % items.length;
    const it = items[idx];
    reset(false);
    base = null;
    elTitle.innerHTML = it.title || "";
    elNote.innerHTML = it.note || "";
    elCount.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    img.alt = plain(it.title) + (it.note ? " — " + plain(it.note) : "");
    lb.classList.add("is-loading");
    fit();
    img.src = IMG("web", it.src);
    if (dir && !reduced()) {
      frame.animate([{ opacity: 0, transform: `translate3d(${dir * 48}px,0,0)` }, { opacity: 1, transform: "none" }],
        { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    const hi = new Image();
    hi.onload = () => { if (items[idx] === it) { img.src = hi.src; lb.classList.remove("is-loading"); base = null; } };
    hi.onerror = () => { if (items[idx] === it) lb.classList.remove("is-loading"); };
    hi.src = IMG("full", it.src);
    [-1, 1].forEach((d) => { const n = items[(idx + d + items.length) % items.length]; if (n) new Image().src = IMG("web", n.src); });
    lb.classList.toggle("is-single", items.length < 2);
  }

  function openLb(list, i = 0, from = null) {
    items = (list || []).filter((x) => x && x.src);
    if (!items.length) return;
    clearTimeout(closeT);
    lastFocus = doc.activeElement;
    opener = from;
    open = true;
    lb.hidden = false;
    show(i);
    doc.body.classList.add("is-locked");
    V.lenis && V.lenis.stop();
    void lb.offsetWidth;
    lb.classList.add("is-open");
    flipFrom(from);
    setTimeout(() => $(".lb__btn--close", lb).focus({ preventScroll: true }), 60);
    doc.dispatchEvent(new CustomEvent("verve:lightbox", { detail: { open: true } }));
  }

  /* grow from the clicked drawing (FLIP) */
  function flipFrom(from) {
    if (!from || reduced() || !frame.animate) return;
    const src = $("img", from) || from;
    const a = src.getBoundingClientRect(), b = img.getBoundingClientRect();
    if (!a.width || !b.width) return;
    const k = a.width / b.width;
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    frame.animate([{ transform: `translate3d(${dx}px,${dy}px,0) scale(${k})`, opacity: 0.4 }, { transform: "none", opacity: 1 }],
      { duration: 760, easing: "cubic-bezier(.16,1,.3,1)" });
  }

  function closeLb() {
    if (!open) return;
    open = false;
    lb.classList.remove("is-open");
    doc.body.classList.remove("is-locked");
    V.lenis && V.lenis.start();
    closeT = setTimeout(() => { if (!open) { lb.hidden = true; img.removeAttribute("src"); } }, reduced() ? 0 : 520);
    const f = opener && opener.isConnected ? opener : lastFocus;
    if (f && f.focus) f.focus({ preventScroll: true });
    doc.dispatchEvent(new CustomEvent("verve:lightbox", { detail: { open: false } }));
  }

  api.open = (list, i) => openLb(list, i || 0, null);
  api.close = closeLb;
  api.isOpen = () => open;

  /* ---------- controls ---------- */

  lb.addEventListener("click", (e) => {
    const t = e.target.closest("[data-lb-close], [data-lb-step], [data-lb-zoom]");
    if (!t) return;
    if (t.hasAttribute("data-lb-close")) return closeLb();
    if (t.hasAttribute("data-lb-step")) return show(idx + +t.dataset.lbStep, +t.dataset.lbStep);
    const r = stage.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, +t.dataset.lbZoom > 0 ? 1.6 : 1 / 1.6, true);
  });
  img.addEventListener("load", () => { base = null; });

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const k = e.ctrlKey ? 0.012 : 0.0022;
    zoomAt(e.clientX, e.clientY, Math.exp(clamp(-e.deltaY * k, -0.5, 0.5)));
  }, { passive: false });

  /* pointers: 1 = pan (zoomed) or swipe (fit), 2 = pinch */
  const pts = new Map();
  let g = null, tapT = 0, tapX = 0, tapY = 0, sx = 0, sy = 0, moved = false;
  const mid = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };

  stage.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or stale pointer */ }
    if (!pts.size) { sx = e.clientX; sy = e.clientY; moved = false; }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!base) measure();
    if (pts.size === 2) { const m = mid(); g = { type: "pinch", d: m.d, x: m.x, y: m.y }; frame.style.transform = ""; }
    else if (pts.size === 1) g = { type: s > 1.001 ? "pan" : "swipe", x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() };
    lb.classList.add("is-grabbing");
  });
  stage.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId) || !g) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
    if (g.type === "pinch" && pts.size === 2) {
      const m = mid();
      zoomAt(m.x, m.y, m.d / (g.d || m.d));
      ox += m.x - g.x; oy += m.y - g.y;
      if (s > 1.001) clampPan(); else { ox = 0; oy = 0; }
      apply();
      g.d = m.d; g.x = m.x; g.y = m.y;
    } else if (g.type === "pan") {
      ox += e.clientX - g.x; oy += e.clientY - g.y;
      g.x = e.clientX; g.y = e.clientY;
      clampPan(); apply();
    } else if (g.type === "swipe" && items.length > 1) {
      const dx = e.clientX - g.x0;
      frame.style.transform = `translate3d(${dx * 0.6}px,0,0)`;
      frame.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, 0.5));
    }
  });
  function endPointer(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (g && g.type === "swipe") {
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0, dt = performance.now() - g.t;
      frame.style.transform = ""; frame.style.opacity = "";
      if (items.length > 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) { show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); g = null; }
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 300 && e.pointerType !== "mouse") {
        const now = performance.now();
        if (now - tapT < 320 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 30) { zoomAt(e.clientX, e.clientY, 2.5, true); tapT = 0; }
        else { tapT = now; tapX = e.clientX; tapY = e.clientY; }
      }
    }
    if (pts.size === 1) { const [p] = [...pts.values()]; g = { type: s > 1.001 ? "pan" : "swipe", x: p.x, y: p.y, x0: p.x, y0: p.y, t: performance.now() }; }
    else if (!pts.size) { g = null; lb.classList.remove("is-grabbing"); }
  }
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);
  stage.addEventListener("click", (e) => { if (!moved && !sheet.contains(e.target)) closeLb(); });
  stage.addEventListener("dblclick", (e) => { if (s > 1.001) reset(true); else zoomAt(e.clientX, e.clientY, 2.5, true); });

  /* keyboard + focus trap */
  addEventListener("keydown", (e) => {
    if (!open) return;
    const k = e.key;
    if (k === "Escape") { e.preventDefault(); closeLb(); }
    else if (k === "ArrowRight") show(idx + 1, 1);
    else if (k === "ArrowLeft") show(idx - 1, -1);
    else if (k === "+" || k === "=") { const r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.6, true); }
    else if (k === "-" || k === "_") { const r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.6, true); }
    else if (k === "0") reset(true);
    else if (k === "Tab") {
      const f = $$("button", lb).filter((b) => b.offsetParent !== null);
      const i = f.indexOf(doc.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }, true);

  let rt = 0;
  addEventListener("resize", () => { if (!open) return; clearTimeout(rt); rt = setTimeout(() => { fit(); base = null; reset(); }, 120); });

  /* ---------- auto-binding: [data-lb-group][data-lb-index] ---------- */

  function fromDom(group) {
    const seen = new Map();
    $$(`[data-lb-group="${CSS.escape(group)}"][data-lb-index]`).forEach((el) => {
      const i = +el.dataset.lbIndex;
      if (seen.has(i)) return;
      const im = $("img", el);
      const src = el.dataset.lbSrc || (im && (im.getAttribute("src") || "").replace(/^.*\/([^/]+)\.\w+(\?.*)?$/, "$1"));
      const b = $("figcaption b", el), n = $("figcaption span", el);
      seen.set(i, { src, title: b ? b.innerHTML : (im && im.alt) || "", note: n ? n.innerHTML : "" });
    });
    return [...seen.keys()].sort((a, b) => a - b).map((k) => seen.get(k));
  }
  function trigger(el) {
    const group = el.dataset.lbGroup, i = +el.dataset.lbIndex || 0;
    const list = api.groups[group] && api.groups[group].length ? api.groups[group] : fromDom(group);
    openLb(list, Math.min(i, list.length - 1), el);
  }
  doc.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    const el = e.target.closest && e.target.closest("[data-lb-group][data-lb-index]");
    if (!el || lb.contains(el)) return;
    e.preventDefault();
    trigger(el);
  });
  doc.addEventListener("keydown", (e) => {
    if (open || (e.key !== "Enter" && e.key !== " ")) return;
    const el = e.target.closest && e.target.closest("[data-lb-group][data-lb-index]");
    if (!el || el !== e.target) return;
    e.preventDefault();
    trigger(el);
  });
})();

/* ============================================================
   VERVE v2 — ui widgets : counters, magnetic, marquee, cursor
   (lives beside the lightbox to keep core.js under 500 lines;
   core's VERVE.reveal.scan(root) calls VERVE.ui.scan(root))
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const doc = document, root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const raf = (fn) => requestAnimationFrame(fn);
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const reduced = !!V.reduced, isTouch = !!V.isTouch;
  const ready = (fn) => (V.ready ? V.ready(fn) : fn());

  /* ---------- counters ---------- */

  let countIO = null;
  function counter(el) {
    if (el.__ct) return;
    el.__ct = 1;
    const n = parseFloat(el.dataset.count) || 0, suf = el.dataset.countSuffix || "";
    if (reduced || !("IntersectionObserver" in window)) { el.textContent = n + suf; return; }
    el.textContent = "0" + suf;
    countIO = countIO || new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      ready(() => runCount(e.target));
    }), { threshold: 0.5 });
    countIO.observe(el);
  }
  function runCount(el) {
    const n = parseFloat(el.dataset.count) || 0, suf = el.dataset.countSuffix || "";
    const t0 = performance.now(), dur = 1800;
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(n * e) + suf;
      if (p < 1) raf(tick);
    };
    raf(tick);
  }

  function magnetic(el) {
    if (el.__mg || isTouch || reduced) return;
    el.__mg = 1;
    const k = parseFloat(el.dataset.magnetic) || 0.3;
    el.classList.add("is-magnetic");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${((e.clientX - r.left - r.width / 2) * k).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * k).toFixed(1)}px`;
    });
    el.addEventListener("pointerleave", () => { el.style.translate = "0px 0px"; });
  }

  /* ---------- marquee ---------- */

  const marquees = [];
  function marquee(el) {
    if (el.__mq) return;
    const track = $(".marquee__track", el);
    if (!track) return;
    el.__mq = 1;
    if (reduced) { el.classList.add("marquee--static"); return; }
    const m = { el, tracks: [track], w: 0, x: 0, hover: 1, k: 1, skew: 0, on: false,
      dir: (parseFloat(el.dataset.marqueeDir) || 1) < 0 ? -1 : 1, speed: parseFloat(el.dataset.marqueeSpeed) || 45 };
    const fill = () => {
      m.w = track.offsetWidth;
      if (!m.w) return;
      const need = Math.ceil(el.offsetWidth / m.w) + 1;
      while (m.tracks.length < need) {
        el.insertAdjacentHTML("beforeend", track.outerHTML);   // parsed in place: lazy imgs stay lazy (cloneNode loads them eagerly)
        const c = el.lastElementChild;
        c.setAttribute("aria-hidden", "true");
        $$("a, button, [tabindex]", c).forEach((f) => f.setAttribute("tabindex", "-1"));
        m.tracks.push(c);
      }
    };
    fill();
    if ("ResizeObserver" in window) new ResizeObserver(fill).observe(track);
    el.addEventListener("pointerenter", () => (m.hover = 0));
    el.addEventListener("pointerleave", () => (m.hover = 1));
    el.addEventListener("focusin", (e) => {   // hold the marquee with the focused sheet in view (overflow-x: clip can't scroll to it)
      m.hover = 0; m.k = 0;
      const t = m.tracks.find((tr) => tr.contains(e.target));
      if (!t || !m.w) return;
      const o = e.target.getBoundingClientRect().left - t.getBoundingClientRect().left, iw = e.target.offsetWidth;
      m.x = Math.max(-m.w + 1, Math.min(0, Math.max(0, (el.offsetWidth - iw) / 2) - o));
    });
    el.addEventListener("focusout", () => (m.hover = 1));
    new IntersectionObserver((es) => (m.on = es[0].isIntersecting)).observe(el);
    marquees.push(m);
    if (marquees.length === 1) startMarquees();
  }
  function startMarquees() {
    let last = performance.now(), lastY = scrollY;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const vel = V.lenis ? V.lenis.velocity : (scrollY - lastY) / Math.max(dt * 60, 1);
      lastY = scrollY;
      marquees.forEach((m) => {
        if (!m.on || !m.w) return;
        m.k += (m.hover - m.k) * 0.08;
        const boost = 1 + Math.min(Math.abs(vel) * 0.12, 5);
        m.x -= m.dir * m.speed * m.k * boost * dt;
        if (m.x <= -m.w) m.x += m.w;
        if (m.x > 0) m.x -= m.w;
        m.skew += (clamp(-vel * 0.25, -5, 5) - m.skew) * 0.1;
        const tf = `translate3d(${m.x.toFixed(2)}px,0,0) skewX(${m.skew.toFixed(2)}deg)`;
        m.tracks.forEach((t) => (t.style.transform = tf));
      });
    };
    if (hasGsap) gsap.ticker.add(() => tick(performance.now()));
    else { const loop = (t) => { tick(t); raf(loop); }; raf(loop); }
  }

  /* ---------- cursor ---------- */

  function cursor() {
    const el = $("[data-cursor-el]");
    if (!el) return;
    if (isTouch || reduced) { el.hidden = true; return; }
    const mk = (c) => { const s = doc.createElement("span"); s.className = c; return s; };
    const dot = mk("cursor__dot"), ring = mk("cursor__ring");
    const label = $(".cursor__label", el) || mk("cursor__label");
    ring.appendChild(label);
    el.append(dot, ring);
    root.classList.add("has-cursor");
    const NAMES = { view: "View", drag: "Drag", zoom: "Zoom", play: "Play", open: "Open" };
    let mx = -100, my = -100, rx = -100, ry = -100, on = false;
    addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      if (!on) { on = true; rx = mx; ry = my; el.classList.add("is-on"); }
    }, { passive: true });
    doc.addEventListener("mouseout", (e) => { if (!e.relatedTarget) { on = false; el.classList.remove("is-on"); } });
    addEventListener("blur", () => { on = false; el.classList.remove("is-on"); });
    addEventListener("pointerdown", () => el.classList.add("is-down"));
    addEventListener("pointerup", () => el.classList.remove("is-down"));
    doc.addEventListener("pointerover", (e) => {
      const c = e.target.closest && e.target.closest("[data-cursor], .sheet, a, button, [role=button], label, select");
      const kind = c ? c.dataset.cursor || (c.classList.contains("sheet") ? "zoom" : "link") : "";
      const txt = c ? c.dataset.cursorLabel || NAMES[kind] || "" : "";
      el.dataset.state = txt ? "label" : kind ? "link" : "";
      if (txt) label.textContent = txt;
    });
    const tick = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    };
    if (hasGsap) gsap.ticker.add(tick); else { const loop = () => { tick(); raf(loop); }; raf(loop); }
  }

  function scan(r = doc) {
    const has = (s) => (r.matches && r.matches(s) ? [r] : []).concat($$(s, r));
    has("[data-count]").forEach(counter);
    has("[data-marquee]").forEach(marquee);
    has("[data-magnetic]").forEach(magnetic);
  }
  V.ui = { scan };
  try { cursor(); } catch (e) { console.error(e); }
})();
