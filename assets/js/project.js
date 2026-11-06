/* ============================================================
   VERVE v2 — project page : case-study template
   Renders PROJECTS[?p] into [data-project-root]; tabs, massing
   step-through, pinned strip, legend, chapter rail, next link.
   ============================================================ */

(function (boot) { const V = window.VERVE || {}; if (V.afterCms) V.afterCms(boot); else boot(); })(function () {   /* after the CMS merge */
  "use strict";
  const V = (window.VERVE = window.VERVE || {});
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");

  const root = $("[data-project-root]");
  const LIST = window.PROJECTS || [];
  const id = new URLSearchParams(location.search).get("p");
  const at = LIST.findIndex((p) => p.id === id);
  if (!root) return;
  if (at < 0) { location.replace("index.html#work"); return; }

  const P = LIST[at];
  const NEXT = LIST[(at + 1) % LIST.length];
  const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
  const reduced = () => !!V.reduced || document.documentElement.classList.contains("reduced");

  /* ---------- helpers ---------- */

  const img = (tier, slug) => (V.img ? V.img(tier, slug) : `assets/img/${tier}/${slug}.jpg`);
  const dim = (slug) => (V.dim ? V.dim(slug) : (window.DIMS && window.DIMS[slug]) || [1600, 1100]);
  const decoder = document.createElement("textarea");
  const text = (html) => { decoder.innerHTML = String(html || "").replace(/<[^>]*>/g, ""); return decoder.value; };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- drawing index (lightbox order = page order) ---------- */

  const ITEMS = [], INDEX = {};
  const add = (it) => {
    if (!it || !it.src || INDEX[it.src] != null) return;
    INDEX[it.src] = ITEMS.length;
    ITEMS.push({ src: it.src, title: it.title || "", note: it.note || "" });
  };
  { const d = P.blocks.find((b) => b.type === "feature" && b.item.src === (P.banner || P.cover)); if (d) { add(d.item); P.blocks = P.blocks.filter((b) => b !== d); } }   /* banner isn't repeated in the body */
  P.blocks.forEach((b) => {
    if (b.type === "feature") add(b.item);
    if (b.items && /grid|tabs|seq|strip/.test(b.type)) b.items.forEach(add);
    if (b.type === "legend") add({ src: b.src, title: b.title, note: "Plan with room legend" });
  });
  add({ src: P.cover, title: P.name, note: P.lede });

  let figNo = 0;
  function sheet(it, o) {
    o = o || {};
    const [w, h] = dim(it.src);
    const t = text(it.title), n = text(it.note);
    const fig = o.fig || ++figNo;
    return `<figure class="sheet${o.cls ? " " + o.cls : ""}" data-lb-group="${P.id}" data-lb-index="${INDEX[it.src]}"
      tabindex="0" role="button" aria-label="Open ${esc(t)} at full size" data-cursor="zoom" style="--ar:${(w / h).toFixed(4)}"${o.reveal ? ` data-reveal="${o.reveal}"` : ""}>
      <img src="${img("web", it.src)}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="${esc(t + (n ? " — " + n : ""))}">
      <figcaption data-fig="Fig. ${pad(fig)}"><b>${it.title}</b>${o.short ? "" : it.note ? `<span>${it.note}</span>` : ""}</figcaption>
    </figure>`;
  }

  /* ---------- blocks ---------- */

  let chapter = 0;
  const projNo = parseInt(P.no, 10) || at + 1;

  function head(b, k, extra) {
    const count = b.items && b.type !== "legend" ? b.items.length : 1;
    const from = figNo + 1;
    const figs = /compare/.test(b.type) ? "Interactive"
      : count > 1 ? `Fig. ${pad(from)}–${pad(from + count - 1)}` : `Fig. ${pad(from)}`;
    return `<header class="pj-blk__head" data-reveal="fade">
      <span class="num">${figs}</span><h3 class="label" id="b${k}-h">${b.label}</h3>
      <span class="pj-blk__rule" aria-hidden="true"></span>${extra || `<span class="label pj-blk__count">${count} ${count > 1 ? "sheets" : /compare/.test(b.type) ? "study" : "sheet"}</span>`}
    </header>`;
  }

  const R = {
    text(b, k) {
      chapter++;
      return `<section class="pj-blk pj-text" id="b${k}" data-chapter="§ ${projNo}.${chapter}" aria-labelledby="b${k}-h">
        <p class="pj-text__kicker label" data-reveal="fade"><span class="num">§ ${projNo}.${chapter}</span>${b.kicker}</p>
        <h2 class="pj-text__title display" id="b${k}-h" data-reveal="lines">${b.title}</h2>
        <div class="pj-text__body body" data-reveal="up">${b.body.map((p) => `<p>${p}</p>`).join("")}</div>
      </section>`;
    },

    feature(b, k) {
      return `<section class="pj-blk pj-feature${b.item.portrait ? " is-portrait" : ""}" id="b${k}" aria-labelledby="b${k}-h">
        ${head(b, k)}${sheet(b.item, { reveal: "up" })}</section>`;
    },

    grid(b, k) {
      const h = head(b, k);
      return `<section class="pj-blk pj-grid pj-grid--${b.cols || 2}" id="b${k}" aria-labelledby="b${k}-h">
        ${h}<div class="pj-grid__items">${b.items.map((it) => sheet(it, { reveal: "up" })).join("")}</div></section>`;
    },

    tabs(b, k) {
      const h = head(b, k);
      return `<section class="pj-blk pj-tabs" id="b${k}" aria-labelledby="b${k}-h" data-tabs>
        ${h}
        <div class="pj-tabs__bar" role="tablist" aria-labelledby="b${k}-h" data-reveal="fade">
          ${b.items.map((it, n) => `<button class="pj-tabs__tab" role="tab" id="b${k}-t${n}" aria-controls="b${k}-p${n}"
            aria-selected="${n === 0}" tabindex="${n ? -1 : 0}"><span class="num">${pad(n + 1)}</span>${it.tab}</button>`).join("")}
          <span class="pj-tabs__ind" aria-hidden="true"></span>
        </div>
        <div class="pj-tabs__stage" data-reveal="up">
          ${b.items.map((it, n) => `<div class="pj-tabs__panel${n ? "" : " is-on"}" role="tabpanel" id="b${k}-p${n}" aria-labelledby="b${k}-t${n}">${sheet(it)}</div>`).join("")}
        </div>
      </section>`;
    },

    seq(b, k) {
      const h = head(b, k);
      const n = b.items.length;
      return `<section class="pj-blk pj-seq" id="b${k}" aria-labelledby="b${k}-h" data-steps>
        ${h}
        <div class="pj-seq__grid" data-reveal="up">
          <div class="pj-seq__stage">
            <div class="pj-seq__frames">
              ${b.items.map((it, i) => `<div class="pj-seq__panel${i ? "" : " is-on"}" role="tabpanel" id="b${k}-p${i}" aria-labelledby="b${k}-t${i}">${sheet(it, { short: true })}</div>`).join("")}
            </div>
            <div class="pj-seq__ctrl">
              <button class="pj-seq__btn" data-dir="-1" aria-label="Previous step"><span aria-hidden="true">←</span></button>
              <span class="label pj-seq__count" aria-live="polite">Step <b>01</b> / ${pad(n)}</span>
              <button class="pj-seq__btn" data-dir="1" aria-label="Next step"><span aria-hidden="true">→</span></button>
            </div>
          </div>
          <div class="pj-seq__steps">
            <span class="pj-seq__line" aria-hidden="true"><i></i></span>
            <div role="tablist" aria-orientation="vertical" aria-labelledby="b${k}-h">
              ${b.items.map((it, i) => `<button class="pj-seq__step" role="tab" id="b${k}-t${i}" aria-controls="b${k}-p${i}"
                aria-selected="${i === 0}" tabindex="${i ? -1 : 0}">
                <span class="pj-seq__dot" aria-hidden="true"></span>
                <span class="num">${pad(i + 1)}</span>
                <span class="pj-seq__t">${it.title}</span>
                <span class="pj-seq__n">${it.note}</span>
              </button>`).join("")}
            </div>
          </div>
        </div>
      </section>`;
    },

    strip(b, k) {
      const n = b.items.length;
      return `<section class="pj-blk pj-strip" id="b${k}" aria-labelledby="b${k}-h" data-strip>
        <div class="pj-strip__pin">
          ${head(b, k, `<span class="label pj-strip__count" aria-hidden="true"><b>01</b> / ${pad(n)}</span>`)}
          <div class="pj-strip__vp" tabindex="0" aria-label="${esc(text(b.label))} — horizontal gallery">
            <div class="pj-strip__track">${b.items.map((it) => sheet(it)).join("")}</div>
          </div>
          <div class="pj-strip__foot" aria-hidden="true"><span class="pj-strip__rule"><i></i></span><span class="label">Scroll</span></div>
        </div>
      </section>`;
    },

    compare(b, k) {
      return `<section class="pj-blk pj-mod pj-mod--compare" id="b${k}" aria-labelledby="b${k}-h">${head(b, k)}
        <div data-module="compare" data-a="${esc(b.a.src)}" data-b="${esc(b.b.src)}" data-a-label="${esc(text(b.a.title))}"
          data-b-label="${esc(text(b.b.title))}" data-caption="${esc(text(b.caption))}"></div></section>`;
    },

    legend(b, k) {
      const h = head(b, k);
      return `<section class="pj-blk pj-legend" id="b${k}" aria-labelledby="b${k}-h">${h}
        <div class="pj-legend__grid">
          ${sheet({ src: b.src, title: b.title, note: "" }, { reveal: "up" })}
          <div class="pj-legend__key" data-reveal="up">
            <p class="pj-legend__title display">${b.title}</p>
            <p class="label">Legend</p>
            <ol class="pj-legend__list">${b.items.map((r, i) => `<li><span class="num">${pad(i + 1)}</span><span>${r}</span></li>`).join("")}</ol>
          </div>
        </div>
      </section>`;
    }
  };

  /* ---------- page ---------- */

  function render() {
    const BAN = P.banner || P.cover;   /* landscape header drawing, shown at its own proportions */
    const [cw, ch] = dim(BAN);
    const meta = [["Practice", P.practice], ["Location", P.place], ["Year", P.year], ["Typology", P.typology], ["My role", P.role]];
    const blocks = P.blocks.map((b, k) => (R[b.type] ? R[b.type](b, k + 1) : "")).join("");
    const rail = railItems();

    root.innerHTML = `
      <header class="pj-head wrap">
        <div class="pj-head__top">
          <a class="pj-back label" href="index.html#work" data-cursor="link"><span aria-hidden="true">←</span> All work</a>
          <span class="label">Case study ${P.no} / ${pad(LIST.length)}</span>
        </div>
        <h1 class="pj-name display"><span class="pj-name__no" aria-hidden="true">${P.no}</span><span class="pj-name__txt" data-reveal="words">${P.name}</span></h1>
        <div class="pj-head__row">
          <p class="lede pj-lede" data-reveal="up" data-reveal-delay=".25">${P.lede}</p>
          <div class="tblock" data-reveal="up" data-reveal-delay=".35">
            <div class="tblock__ref" aria-hidden="true"><span class="tblock__bubble"><b>${P.no}</b><i>${pad(LIST.length)}</i></span><span class="label">Sheet</span></div>
            <dl class="tblock__cells">${meta.filter(([, v]) => text(v).trim()).map(([l, v]) => `<div class="tblock__cell"><dt class="label">${l}</dt><dd>${v}</dd></div>`).join("")}</dl>
          </div>
        </div>
      </header>

      <figure class="pj-cover" style="--ar:${(cw / ch).toFixed(4)}" data-reveal="clip" data-lb-group="${P.id}" data-lb-index="${INDEX[BAN] != null ? INDEX[BAN] : INDEX[P.cover]}" tabindex="0" role="button"
        aria-label="Open ${esc(text(P.name))} cover at full size" data-cursor="zoom">
        <div class="pj-cover__px"><img class="pj-cover__img" src="${img("web", BAN)}" width="${cw}" height="${ch}" decoding="async" fetchpriority="high" alt="${esc(text(P.name) + " — " + text(P.lede))}"></div>
      </figure>

      <div class="pj-main wrap">
        <aside class="pj-rail" aria-label="Chapters">
          <p class="label pj-rail__title">${P.name}</p>
          <span class="pj-rail__prog" aria-hidden="true"><i></i></span>
          <ol class="pj-rail__list">${rail}</ol>
        </aside>
        <div class="pj-flow">
          <section class="pj-intro" id="intro" aria-labelledby="intro-h">
            <p class="pj-text__kicker label" data-reveal="fade"><span class="num">§ ${projNo}.0</span><span id="intro-h">Introduction</span></p>
            <div class="pj-intro__body${P.intro.length > 1 ? " is-cols" : ""}" data-reveal="up">${P.intro.map((p) => `<p>${p}</p>`).join("")}</div>
          </section>
          ${blocks}
        </div>
      </div>

      <nav class="pj-next" aria-label="Next project">
        <div class="wrap">
          <p class="label pj-next__kicker"><span class="num">${NEXT.no}</span> Next project</p>
          <a class="pj-next__link" href="project.html?p=${NEXT.id}" data-cursor="view" data-cursor-label="Next">
            <span class="pj-next__name display">${NEXT.name}<span class="pj-next__arrow" aria-hidden="true">→</span></span>
            <span class="pj-next__meta label">${NEXT.practice} · ${NEXT.place} · ${NEXT.year}</span>
            <span class="pj-next__img"><img src="${img("web", NEXT.cover)}" width="${dim(NEXT.cover)[0]}" height="${dim(NEXT.cover)[1]}" loading="lazy" decoding="async" alt=""></span>
          </a>
          <a class="pj-all label" href="index.html#work" data-cursor="link">All work <span aria-hidden="true">↗</span></a>
        </div>
      </nav>

      <footer class="pj-foot">
        <div class="wrap pj-foot__in">
          <span class="label">© 2026 Krutika M Patange</span>
          <a class="label link-u" href="mailto:${(window.HOME && HOME.email) || "krutikapatange28@gmail.com"}">${(window.HOME && HOME.email) || "krutikapatange28@gmail.com"}</a>
          <a class="label link-u" href="https://www.instagram.com/${(window.HOME && HOME.instagram) || "verve.workbook"}/" target="_blank" rel="noopener">Instagram</a>
          <a class="label link-u pj-top" href="#main">Back to top ↑</a>
        </div>
      </footer>`;
  }

  function railItems() {
    let out = `<li class="pj-rail__ch"><a href="#intro" data-rail="intro"><span class="num">§ ${projNo}.0</span>Introduction</a></li>`;
    let c = 0;
    P.blocks.forEach((b, i) => {
      const k = i + 1;
      if (b.type === "text") {
        c++;
        out += `<li class="pj-rail__ch"><a href="#b${k}" data-rail="b${k}"><span class="num">§ ${projNo}.${c}</span>${b.kicker}</a></li>`;
      } else if (b.label) {
        out += `<li class="pj-rail__sub"><a href="#b${k}" data-rail="b${k}">${b.label}</a></li>`;
      }
    });
    return out;
  }

  /* ---------- tabs (ported from v1, roving tabindex + sliding indicator) ---------- */

  function tablist(btns, onSelect, vertical) {
    btns.forEach((t, n) => {
      t.addEventListener("click", () => onSelect(n, false));
      t.addEventListener("keydown", (e) => {
        const prev = vertical ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft", "ArrowUp"];
        const next = vertical ? ["ArrowDown", "ArrowRight"] : ["ArrowRight", "ArrowDown"];
        let to = -1;
        if (next.includes(e.key)) to = (n + 1) % btns.length;
        else if (prev.includes(e.key)) to = (n - 1 + btns.length) % btns.length;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = btns.length - 1;
        if (to < 0) return;
        e.preventDefault();
        onSelect(to, true);
      });
    });
  }

  function select(btns, panels, n, focus) {
    btns.forEach((x, i) => {
      x.setAttribute("aria-selected", i === n);
      x.tabIndex = i === n ? 0 : -1;
    });
    panels.forEach((p, i) => p.classList.toggle("is-on", i === n));
    $$("img", panels[n]).forEach((im) => (im.loading = "eager"));
    if (focus) btns[n].focus();
  }

  function initTabs() {
    $$("[data-tabs]", root).forEach((wrap) => {
      const btns = $$(".pj-tabs__tab", wrap), panels = $$(".pj-tabs__panel", wrap);
      const ind = $(".pj-tabs__ind", wrap);
      let cur = 0;
      const place = () => {
        const b = btns[cur];
        ind.style.transform = `translateX(${b.offsetLeft}px) scaleX(${b.offsetWidth / 100})`;
      };
      tablist(btns, (n, f) => { cur = n; select(btns, panels, n, f); place(); });
      place();
      addEventListener("resize", place);
      document.fonts && document.fonts.ready.then(place);
    });
  }

  /* ---------- massing step-through : numbered vertical timeline ---------- */

  function initSeq() {
    $$("[data-steps]", root).forEach((wrap) => {
      const btns = $$(".pj-seq__step", wrap), panels = $$(".pj-seq__panel", wrap);
      const fill = $(".pj-seq__line i", wrap), line = $(".pj-seq__line", wrap);
      const count = $(".pj-seq__count b", wrap);
      let cur = 0;
      /* dots and the line share .pj-seq__steps as offsetParent */
      const dotY = (b) => { const d = $(".pj-seq__dot", b); return d.offsetTop + d.offsetHeight / 2; };
      const measure = () => {
        const a = dotY(btns[0]), z = dotY(btns[btns.length - 1]);
        line.style.top = a + "px";
        line.style.height = Math.max(0, z - a) + "px";
        fill.style.transform = `scaleY(${z > a ? (dotY(btns[cur]) - a) / (z - a) : 0})`;
      };
      const go = (n, focus) => {
        cur = (n + btns.length) % btns.length;
        select(btns, panels, cur, focus);
        btns.forEach((b, i) => b.classList.toggle("is-past", i < cur));
        count.textContent = pad(cur + 1);
        measure();
      };
      tablist(btns, go, true);
      $$(".pj-seq__btn", wrap).forEach((b) => b.addEventListener("click", () => go(cur + +b.dataset.dir, false)));
      /* arrow keys anywhere inside the block (the tablist handles its own) */
      wrap.addEventListener("keydown", (e) => {
        if (e.target.closest('[role="tab"]')) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(cur + 1); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(cur - 1); }
      });
      go(0);
      addEventListener("resize", measure);
      document.fonts && document.fonts.ready.then(measure);
    });
  }

  /* ---------- strip : pinned horizontal scroll ≥ 900px, scroll-snap below ---------- */

  function initStrips() {
    $$("[data-strip]", root).forEach((wrap) => {
      const vp = $(".pj-strip__vp", wrap), track = $(".pj-strip__track", wrap);
      const pin = $(".pj-strip__pin", wrap), rule = $(".pj-strip__rule i", wrap);
      const count = $(".pj-strip__count b", wrap);
      const n = track.children.length;
      const show = (p) => {
        p = Math.min(1, Math.max(0, p || 0));
        rule.style.transform = `scaleX(${p})`;
        count.textContent = pad(Math.round(p * (n - 1)) + 1);
      };
      vp.addEventListener("scroll", () => {
        if (wrap.classList.contains("is-pinned")) return;
        const max = vp.scrollWidth - vp.clientWidth;
        show(max > 0 ? vp.scrollLeft / max : 0);
      }, { passive: true });
      show(0);

      if (!HAS_GSAP || reduced()) return;
      gsap.matchMedia().add("(min-width: 900px)", () => {
        wrap.classList.add("is-pinned"); vp.removeAttribute("tabindex");   /* sheets are tab stops; the pin drives the scroll */
        vp.scrollLeft = 0;
        const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
        const tw = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: pin, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6,
            invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (st) => show(st.progress)
          }
        });
        return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { x: 0 }); wrap.classList.remove("is-pinned"); vp.tabIndex = 0; show(0); };
      });
      /* keyboard: focus inside the pinned viewport scrolls the page to that sheet */
      $$(".sheet", track).forEach((s, i) => s.addEventListener("focus", () => {
        if (!wrap.classList.contains("is-pinned")) return;
        const st = ScrollTrigger.getAll().find((t) => t.trigger === pin);
        if (!st) return;
        const y = st.start + (st.end - st.start) * (n > 1 ? i / (n - 1) : 0);
        V.lenis ? V.lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
      }));
    });
  }

  /* ---------- cover parallax ---------- */

  function initCover() {
    const fig = $(".pj-cover", root), im = $(".pj-cover__px", root);
    if (!fig || !HAS_GSAP || reduced()) return;
    gsap.fromTo(im, { yPercent: -5 }, {
      yPercent: 5, ease: "none",
      scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* ---------- chapter rail ---------- */

  function initRail() {
    const links = $$(".pj-rail__list a", root);
    const prog = $(".pj-rail__prog i", root);
    const flow = $(".pj-flow", root);
    let active = null;
    const set = (key) => {
      if (key === active) return;
      active = key;
      links.forEach((a) => {
        const on = a.dataset.rail === key;
        a.classList.toggle("is-on", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    };
    links.forEach((a) => a.addEventListener("click", (e) => {
      const el = document.getElementById(a.dataset.rail);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      if (V.scrollTo) V.scrollTo(el);
      else if (V.lenis) V.lenis.scrollTo(el, { offset: -90 });
      else el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    }));
    const targets = links.map((a) => document.getElementById(a.dataset.rail)).filter(Boolean);
    set("intro");

    if (HAS_GSAP) {
      targets.forEach((t) => ScrollTrigger.create({
        trigger: t, start: "top 45%", end: "bottom 45%",
        onToggle: (st) => st.isActive && set(t.id)
      }));
      ScrollTrigger.create({
        trigger: flow, start: "top 45%", end: "bottom 55%",
        onUpdate: (st) => (prog.style.transform = `scaleY(${st.progress})`)
      });
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && set(e.target.id)),
        { rootMargin: "-45% 0px -54% 0px" });
      targets.forEach((t) => io.observe(t));
    }
  }

  /* ---------- keyboard + preloading for sheets ---------- */

  function initSheets() {
    /* lightbox.js binds Enter/Space on [data-lb-group]; only a fallback here */
    if (!V.lightbox) root.addEventListener("keydown", (e) => {
      const f = e.target.closest && e.target.closest(".sheet, .pj-cover");
      if (!f || f !== e.target || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      f.click();
    });
    /* hidden tab / step panels: warm their images once the block nears view */
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      $$("img", e.target).forEach((im) => (im.loading = "eager"));
      io.unobserve(e.target);
    }), { rootMargin: "600px 0px" });
    $$("[data-tabs], [data-steps], [data-strip]", root).forEach((b) => io.observe(b));
  }

  /* ---------- boot ---------- */

  document.title = `${text(P.name)} — Verve`;
  const md = $('meta[name="description"]');
  if (md) md.setAttribute("content", `${text(P.name)} — ${text(P.lede)} Architectural illustration by Ar. Krutika M Patange.`);
  document.body.style.setProperty("--accent", P.accent || "");
  document.body.dataset.project = P.id;

  render();

  if (V.lightbox && V.lightbox.register) V.lightbox.register(P.id, ITEMS);
  try { if (V.modules && V.modules.mountAll) V.modules.mountAll(root); } catch (err) { console.warn("[verve] modules", err); }

  initTabs();
  initSeq();
  initSheets();
  try { initStrips(); initCover(); initRail(); } catch (err) { console.warn("[verve] project motion", err); }

  if (V.reveal && V.reveal.scan) V.reveal.scan(root);
  else $$("[data-reveal]", root).forEach((el) => el.removeAttribute("data-reveal"));

  if (HAS_GSAP) {
    const refresh = () => { ScrollTrigger.sort && ScrollTrigger.sort(); ScrollTrigger.refresh(); };
    requestAnimationFrame(refresh);
    addEventListener("load", refresh);
    document.fonts && document.fonts.ready.then(refresh);
    /* late lazy images / font swaps change the flow height: re-measure pins so nothing overlaps */
    let lastH = 0, rt = 0;
    if (window.ResizeObserver) new ResizeObserver(() => {
      const h = root.offsetHeight;
      if (Math.abs(h - lastH) > 2) { lastH = h; clearTimeout(rt); rt = setTimeout(refresh, 200); }
    }).observe(root);
  }
});
