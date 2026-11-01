/* ============================================================
   VERVE v2 — core : scroll, reveal, theme, chrome, transitions
   Everything here must fail open: content is never left hidden.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  V.modules = V.modules || {};

  const doc = document, root = doc.documentElement, body = doc.body;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const raf = (fn) => requestAnimationFrame(fn);
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const reduced = root.classList.contains("reduced") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = !matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced) root.classList.add("reduced");
  root.classList.add("js");

  V.reduced = reduced; V.isTouch = isTouch;
  V.img = (tier, slug) => `assets/img/${tier}/${slug}.jpg`;
  V.dim = (slug) => (window.DIMS && window.DIMS[slug]) || [1600, 1100];

  const nav = $("[data-nav]"), wipe = $("[data-wipe]"), menu = $("[data-menu]"), menuBtn = $("[data-menu-toggle]");

  /* ---------- smooth scroll (Lenis + ScrollTrigger) ---------- */

  let lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!reduced && !isTouch && window.Lenis) {
    try { lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false }); }
    catch (e) { lenis = null; }
  }
  if (lenis && hasGsap) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else if (lenis) { const loop = (t) => { lenis.raf(t); raf(loop); }; raf(loop); }
  V.lenis = window.__lenis = lenis;

  const navOffset = () => -((nav && nav.offsetHeight) || 0);
  function resolve(t) {
    if (typeof t === "number" || (t && t.nodeType === 1)) return t;
    if (typeof t !== "string" || t === "#" || t === "#top") return 0;
    try { return t[0] === "#" ? doc.getElementById(decodeURIComponent(t.slice(1))) : $(t); } catch (e) { return null; }
  }
  function scrollTo(target, opts = {}) {
    const el = resolve(target);
    if (el == null) return false;
    const offset = opts.offset != null ? opts.offset : typeof el === "number" ? 0 : navOffset();
    const y = typeof el === "number" ? el : el.getBoundingClientRect().top + scrollY + offset;
    if (lenis) {
      lenis.scrollTo(Math.max(0, y), { immediate: !!opts.immediate, force: true, duration: opts.duration || 1.4,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
    } else {
      window.scrollTo({ top: Math.max(0, y), behavior: reduced || opts.immediate ? "auto" : "smooth" });
    }
    return true;
  }
  V.scrollTo = scrollTo;

  /* ---------- theme : morning → noon → night — by the clock unless picked this session ---------- */

  const TKEY = "verve-theme", PKEY = "verve-daypart", PARTS = ["morning", "noon", "night"];
  const NAME = { morning: "Morning", noon: "Noon", night: "Night" };
  const hour = () => new Date().getHours(), byClock = () => { const h = hour(); return h >= 18 || h < 5 ? "night" : h < 11 ? "morning" : "noon"; };
  const partOf = (t) => (t === "dusk" ? "night" : hour() >= 5 && hour() < 11 ? "morning" : "noon");   // day ⇒ morning | noon
  const ss = (k, v) => { try { return v == null ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } };
  try { localStorage.removeItem(TKEY); localStorage.removeItem("verve-sky"); } catch (e) { /* private mode */ }
  const picked = () => { const p = ss(PKEY), t = ss(TKEY); return PARTS.includes(p) ? p : t === "day" || t === "dusk" ? partOf(t) : null; };
  function applyPart(p, manual) {
    p = PARTS.includes(p) ? p : byClock();
    const t = p === "night" ? "dusk" : "day", changed = root.dataset.theme !== t || root.dataset.daypart !== p;
    root.dataset.theme = t; root.dataset.daypart = p;
    if (manual) { ss(TKEY, t); ss(PKEY, p); }
    syncTheme();
    if (changed || manual) doc.dispatchEvent(new CustomEvent("verve:theme", { detail: { theme: t, daypart: p } }));
  }
  const theme = { get: () => (root.dataset.theme === "dusk" ? "dusk" : "day"), daypart: () => (PARTS.includes(root.dataset.daypart) ? root.dataset.daypart : partOf(theme.get())),
    next: () => PARTS[(PARTS.indexOf(theme.daypart()) + 1) % 3], set: (v) => applyPart(PARTS.includes(v) ? v : partOf(v), true), setDaypart: (p) => theme.set(p), toggle() { theme.set(theme.next()); } };
  { const p = picked() || byClock(); root.dataset.theme = p === "night" ? "dusk" : "day"; root.dataset.daypart = p; }
  setInterval(() => applyPart(picked() || byClock(), false), 60000);
  const syncTheme = () => $$("[data-theme-toggle]").forEach((b) => { const p = theme.daypart(), txt = $(".nav__theme-text, [data-theme-text]", b);
    b.setAttribute("aria-label", `Mode: ${NAME[p]}. Switch to ${NAME[theme.next()].toLowerCase()}`); b.dataset.mode = p; if (txt) txt.textContent = NAME[p]; });
  V.theme = theme;

  /* ---------- preload registry + ready ---------- */

  const preloads = [];
  let loaded = 0, isReady = false;
  const readyQ = [];
  const loadOne = (url) => new Promise((res) => {
    let fired = false;
    const done = () => { if (!fired) { fired = true; loaded++; res(url); } };
    if (!/\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(url)) return done();
    const im = new Image();
    im.onload = im.onerror = done;
    setTimeout(done, 7000);
    im.src = url;
  });
  V.preload = (urls) => {
    const ps = [].concat(urls || []).filter(Boolean).map(loadOne);
    preloads.push(...ps);
    return Promise.all(ps);
  };
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };
  V.ready = (fn) => { if (typeof fn === "function") isReady ? safe(fn) : readyQ.push(fn); };
  function fireReady() {
    if (isReady) return;
    isReady = true;
    root.classList.add("is-ready");
    readyQ.splice(0).forEach(safe);
    doc.dispatchEvent(new CustomEvent("verve:ready"));
  }
  const domReady = new Promise((res) => (doc.readyState === "loading" ? doc.addEventListener("DOMContentLoaded", res, { once: true }) : res()));
  const settle = (ms) => domReady.then(() => Promise.race([Promise.all(preloads), new Promise((r) => setTimeout(r, ms))]));

  /* ---------- text splitting ---------- */

  const WS = /([ \t\n\r]+)/;
  function split(el, mode = "words") {
    if (!el) return [];
    if (el.__split) return el.__split;
    const text = el.textContent.replace(/\s+/g, " ").trim();
    const interactive = !!el.querySelector("a, button, input, select, textarea");
    const out = [];
    const mask = (inner) => {
      const o = doc.createElement("span"), i = doc.createElement("span");
      o.className = "sw"; i.className = "sw__i"; i.textContent = inner;
      o.appendChild(i); out.push(i);
      return o;
    };
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          n.nodeValue.split(WS).forEach((tok) => {
            if (!tok) return;
            if (WS.test(tok)) return frag.appendChild(doc.createTextNode(" "));
            if (mode === "chars") {
              const w = doc.createElement("span");
              w.className = "sw-word";
              [...tok].forEach((ch) => w.appendChild(mask(ch)));
              frag.appendChild(w);
            } else frag.appendChild(mask(tok));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !/^(br|svg|img|picture|video|canvas|script|style)$/i.test(n.tagName)) walk(n);
      });
    };
    walk(el);
    if (!interactive && text) {
      $$(".sw, .sw-word", el).forEach((s) => s.setAttribute("aria-hidden", "true"));
      if (/^h[1-6]$/i.test(el.tagName) || el.getAttribute("role")) el.setAttribute("aria-label", text);
      else {
        const sr = doc.createElement("span");
        sr.className = "sr-only"; sr.textContent = text;
        el.appendChild(sr);
      }
    }
    el.__split = out;
    return out;
  }
  V.split = split;

  /* line index per word (for the "lines" reveal), measured at play time */
  function lineIndex(words) {
    let last = null, li = -1;
    return words.map((w) => {
      const t = Math.round(w.parentNode.getBoundingClientRect().top);
      if (last === null || Math.abs(t - last) > 4) { li++; last = t; }
      return li;
    });
  }

  /* ---------- reveal system ---------- */

  const pending = new Set();
  let queued = [];
  let io = null;
  if (!hasGsap) root.classList.add("rv-css");

  function prepare(el) {
    if (el.__rv) return; el.__rv = 1;
    if (reduced) { el.__rv = 2; el.classList.add("is-in"); return; }
    const v = el.dataset.reveal;
    if (v === "words" || v === "lines") { split(el, "words"); el.classList.add("is-split"); if (hasGsap) gsap.set(el.__split, { yPercent: 112 }); }
    if (v === "scale" && hasGsap) gsap.set(el, { scale: 1.15 });
    pending.add(el);
  }

  function play(el, stagger = 0) {
    if (el.__rv === 2) return;
    el.__rv = 2; pending.delete(el);
    const v = el.dataset.reveal || "up";
    const d = (parseFloat(el.dataset.revealDelay) || 0) + stagger;
    const words = el.__split;
    let li = null;
    if (words && words.length) {
      li = v === "lines" ? lineIndex(words) : words.map((_, i) => i);
      const step = v === "lines" ? 0.11 : Math.min(0.045, 0.9 / words.length);
      words.forEach((w, i) => w.style.setProperty("--wd", (li[i] * step).toFixed(3) + "s"));
    }
    el.style.setProperty("--rd", d + "s");
    el.classList.add("is-in");
    if (!hasGsap) return;
    const clear = (t, p) => () => gsap.set(t, { clearProps: p });
    const ease = "expo.out";
    if (v === "words" || v === "lines") {
      gsap.to(words, { yPercent: 0, duration: 1.15, ease, delay: (i) => d + parseFloat(words[i].style.getPropertyValue("--wd")),
        onComplete: clear(words, "transform") });
    } else if (v === "fade") {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out", delay: d, onComplete: clear(el, "opacity") });
    } else if (v === "clip") {
      gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "expo.inOut", delay: d, onComplete: clear(el, "clipPath") });
      const img = el.tagName === "IMG" ? null : $("img, video, canvas", el);
      if (img) gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.9, ease, delay: d, onComplete: clear(img, "transform") });
    } else if (v === "scale") {
      gsap.to(el, { scale: 1, duration: 1.9, ease, delay: d, onComplete: clear(el, "transform") });
    } else {
      const y = el.hasAttribute("data-parallax") ? 0 : 40;
      gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration: 1.2, ease, delay: d, onComplete: clear(el, "opacity,transform") });
    }
  }

  function arm(els) {
    els = els.filter((el) => el.__rv === 1 && !el.__armed);
    if (!els.length) return;
    els.forEach((el) => (el.__armed = true));
    if (hasGsap) {
      ScrollTrigger.batch(els, { start: "top 90%", once: true,
        onEnter: (b) => b.forEach((el, i) => play(el, i * 0.08)) });
      els.forEach((el) => { if (el.getBoundingClientRect().bottom < 0) play(el); });
    } else {
      io = io || new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { io.unobserve(e.target); play(e.target); }
      }), { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
      els.forEach((el) => io.observe(el));
    }
  }

  /* fail-safe: anything still hidden while in (or above) the viewport is shown */
  function sweep() {
    pending.forEach((el) => {
      if (!el.isConnected) return pending.delete(el);
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (r.top < innerHeight) play(el); /* in view, or already scrolled past */
    });
  }
  let sweepT = 0;
  const sweepSoon = () => { clearTimeout(sweepT); sweepT = setTimeout(sweep, 450); };

  function revealAll() {
    root.classList.add("reveal-all");
    pending.forEach((el) => { el.__rv = 2; el.classList.add("is-in"); });
    pending.clear();
  }

  function scan(rootEl = doc) {
    try {
      const has = (s) => (rootEl.matches && rootEl.matches(s) ? [rootEl] : []).concat($$(s, rootEl));
      const els = has("[data-reveal]");
      els.forEach(prepare);
      if (isReady) arm(els); else queued.push(...els);
      has("[data-parallax]").forEach(parallax);
      if (V.ui && V.ui.scan) V.ui.scan(rootEl);
      if (isReady && hasGsap) ScrollTrigger.refresh();
    } catch (e) { console.error(e); revealAll(); }
  }
  V.reveal = { scan, all: revealAll };

  /* ---------- parallax ---------- */

  function parallax(el) {
    if (el.__px || reduced || !hasGsap) return;
    el.__px = 1;
    const sp = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { y: () => -sp * innerHeight * 0.5 }, { y: () => sp * innerHeight * 0.5, ease: "none",
      scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
  }

  /* ---------- nav ---------- */

  function navScroll() {
    if (!nav) return;
    let lastY = scrollY, queued = false;
    const update = () => {
      queued = false;
      const y = scrollY;
      nav.classList.toggle("nav--solid", y > 40);
      if (!menuOpen) {
        if (y > lastY + 3 && y > 160) nav.classList.add("nav--hidden");
        else if (y < lastY - 3 || y < 160) nav.classList.remove("nav--hidden");
      }
      lastY = y;
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; raf(update); } sweepSoon(); }, { passive: true });
    update();
  }

  /* ---------- menu overlay ---------- */

  let menuOpen = false, menuTimer = 0;
  function buildMenu() {
    if (!menu) return;
    const P = window.PROJECTS || [], H = window.HOME || {};
    const cur = new URLSearchParams(location.search).get("p");
    const work = P.map((p, i) => `<li style="--i:${i + 1}"><a class="menu__link" href="project.html?p=${p.id}"${p.id === cur ? ' aria-current="page"' : ""}>
        <span class="menu__no num">${p.no}</span><span class="menu__name">${p.name}</span><span class="menu__meta label">${p.practice}</span></a></li>`).join("");
    const pages = [["index.html", "Home"], ["index.html#work", "Work"], ["index.html#about", "About"], ["index.html#contact", "Contact"]]
      .map(([h, t], i) => `<li style="--i:${i + 1}"><a class="menu__page" href="${h}">${t}</a></li>`).join("");
    [["role", "dialog"], ["aria-modal", "true"], ["aria-label", "Site menu"]].forEach(([k, v]) => menu.setAttribute(k, v));
    menu.innerHTML = `<div class="menu__bg" aria-hidden="true"></div>
      <div class="menu__inner">
        <div class="menu__work"><p class="menu__kicker label">Selected work — ${String(P.length).padStart(2, "0")}</p><ol class="menu__list">${work}</ol></div>
        <div class="menu__side"><p class="menu__kicker label">Index</p><ul class="menu__pages">${pages}</ul>
          <div class="menu__foot">
            <button class="menu__theme" type="button" data-theme-toggle><span class="nav__theme-icon" aria-hidden="true"></span><span class="label nav__theme-text">Day</span></button>
            ${H.email ? `<a class="menu__mail link-u" href="mailto:${H.email}">${H.email}</a>` : ""}
            ${H.instagram ? `<a class="label menu__ig" href="https://instagram.com/${H.instagram}" target="_blank" rel="noopener">Instagram — @${H.instagram}</a>` : ""}
          </div></div>
      </div>`;
    menu.addEventListener("click", (e) => { if (!e.target.closest("a, button, .menu__list li")) closeMenu(); });
  }
  const focusables = (r) => $$("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])", r).filter((f) => f.offsetParent !== null);
  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    clearTimeout(menuTimer);
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add("is-open");
    nav && nav.classList.add("nav--menu");
    nav && nav.classList.remove("nav--hidden");
    menuBtn.setAttribute("aria-expanded", "true");
    const l = $(".label", menuBtn); if (l) l.textContent = "Close";
    body.classList.add("is-locked");
    lenis && lenis.stop();
    setTimeout(() => { const f = $(".menu__link", menu); f && f.focus({ preventScroll: true }); }, 120);
  }
  function closeMenu(focusBtn = true) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    nav && nav.classList.remove("nav--menu");
    menuBtn.setAttribute("aria-expanded", "false");
    const l = $(".label", menuBtn); if (l) l.textContent = "Menu";
    body.classList.remove("is-locked");
    lenis && lenis.start();
    menuTimer = setTimeout(() => { if (!menuOpen) menu.hidden = true; }, reduced ? 0 : 800);
    if (focusBtn) menuBtn.focus({ preventScroll: true });
  }
  V.menu = { open: openMenu, close: closeMenu, isOpen: () => menuOpen };

  /* ---------- page transitions (wipe) ---------- */

  let wipeSafety = 0;
  const wipeIn = () => { if (wipe) wipe.dataset.state = reduced ? "gone" : "reveal"; };
  function go(url) {
    if (reduced || !wipe) { location.href = url; return; }
    wipe.dataset.state = "below";
    void wipe.offsetWidth;
    wipe.dataset.state = "cover";
    setTimeout(() => { location.href = url; }, 620);
    clearTimeout(wipeSafety);
    wipeSafety = setTimeout(() => { wipe.dataset.state = "reveal"; }, 6000);
  }
  V.go = go;
  addEventListener("pagehide", () => clearTimeout(wipeSafety));
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    clearTimeout(wipeSafety); closeMenu(false); applyPart(picked() || byClock(), false);
    if (wipe) wipe.dataset.state = "gone";
  });

  const page = (u) => u.pathname.replace(/index\.html$/, "") + u.search;
  doc.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const raw = a.getAttribute("href");
    if (!raw || /^(mailto|tel|javascript|sms):/i.test(raw)) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    const same = url.protocol === location.protocol && url.host === location.host;
    if (!same && raw[0] !== "#") return;
    if (raw[0] === "#" || page(url) === page(location)) {
      const t = url.hash ? resolve(url.hash) : 0;
      if (t == null) return;
      e.preventDefault();
      closeMenu(false);
      scrollTo(t);
      if (t && t.nodeType === 1) { if (!t.matches("a[href], button, input, select, textarea, [tabindex]")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
      try { history.replaceState(null, "", url.hash || location.pathname + location.search); } catch (err) { /* file:// */ }
      return;
    }
    if (a.hasAttribute("data-no-wipe") || !/(\.html?|\/)$/i.test(url.pathname)) return;
    e.preventDefault();
    go(url.href);
  });

  /* ---------- preloader ---------- */

  function seen() { try { return sessionStorage.getItem("verve-seen") === "1"; } catch (e) { return false; } }
  function runPreloader(pre) {
    pre.hidden = false;
    pre.setAttribute("aria-hidden", "true");
    const word = $(".preload__word", pre), count = $("[data-preload-count]", pre);
    if (word) split(word, "chars").forEach((c, i) => c.parentNode.style.setProperty("--ci", i));
    raf(() => raf(() => pre.classList.add("is-on")));
    let dom = false, shown = 0, finished = false;
    domReady.then(() => (dom = true));
    const t0 = performance.now(), MIN = 1900, MAX = 7000;
    const finish = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem("verve-seen", "1"); } catch (e) { /* ignore */ }
      setTimeout(() => {
        if (wipe) wipe.dataset.state = "gone";
        pre.classList.add("is-out");
        setTimeout(fireReady, 180);
        setTimeout(() => { pre.hidden = true; }, 1300);
      }, 260);
    };
    const tick = (now) => {
      const el = now - t0, total = preloads.length;
      let target = dom ? (total ? loaded / total : 1) : total ? (loaded / total) * 0.8 : 0;
      if (el > MAX) target = 1;
      const goal = Math.min(target, el / MIN) * 100;
      shown += (goal - shown) * 0.14;
      if (goal - shown < 0.6) shown = goal;
      if (count) count.textContent = String(Math.round(shown)).padStart(3, "0");
      pre.style.setProperty("--p", (shown / 100).toFixed(3));
      if (shown >= 100) finish(); else raf(tick);
    };
    raf(tick);
    setTimeout(finish, MAX + 800);
  }

  /* ---------- keyboard ---------- */

  addEventListener("keydown", (e) => {
    if (menuOpen && e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    if (menuOpen && e.key === "Tab") {
      const list = [menuBtn, ...focusables(menu)];
      const i = list.indexOf(doc.activeElement);
      e.preventDefault();
      list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length].focus();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    if (e.key === "t" || e.key === "T") theme.toggle();
  });

  /* ---------- boot ---------- */

  function onReady() {
    arm(queued.splice(0));
    setTimeout(sweep, 3000);
    if (hasGsap) {
      raf(() => {
        ScrollTrigger.refresh();
        if (location.hash && resolve(location.hash)) scrollTo(location.hash, { immediate: true });
        sweepSoon();
      });
      doc.fonts && doc.fonts.ready.then(() => ScrollTrigger.refresh());
    } else if (location.hash) raf(() => scrollTo(location.hash, { immediate: true }));
  }

  try {
    if (wipe && reduced) wipe.dataset.state = "gone";
    buildMenu();
    syncTheme();
    navScroll();
    doc.addEventListener("click", (e) => {
      if (e.target.closest("[data-theme-toggle]")) theme.toggle();
      if (e.target.closest("[data-menu-toggle]")) (menuOpen ? closeMenu() : openMenu());
      sweepSoon();
    });
    V.ready(onReady);
    doc.addEventListener("focusin", (e) => { const r = e.target.closest && e.target.closest("[data-reveal]"); if (!r) return; if (r.__rv === 1) play(r); if (hasGsap) gsap.getTweensOf(r).forEach((t) => t.progress(1)); });   /* focused ⇒ shown now */
    const pre = $("[data-preload]");
    if (pre && body.dataset.page === "home" && !reduced && !seen()) runPreloader(pre);
    else settle(reduced ? 600 : 2000).then(() => { fireReady(); wipeIn(); });
    domReady.then(() => scan(doc));
    if (!hasGsap && !("IntersectionObserver" in window)) revealAll();
  } catch (err) {
    console.error(err);
    revealAll();
    if (wipe) wipe.dataset.state = "gone";
    const pre = $("[data-preload]"); if (pre) pre.hidden = true;
    fireReady();
  }
})();
