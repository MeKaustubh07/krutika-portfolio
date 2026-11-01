/* ============================================================
   VERVE v2 — module : compare (before / after slider)
   <div data-module="compare" data-a="slug" data-b="slug"
        data-a-label="Drawing" data-b-label="Render" data-caption="…">
   A sits on the left of the handle, B on the right.
   Clip is a GPU-friendly clip-path inset driven by one CSS var.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const M = (V.modules = V.modules || {});
  const doc = document;

  /* ---------- shared registry (either module file may load first) ---------- */

  M._mounters = M._mounters || {};
  if (!M.mountAll) {
    M.mountAll = (root) => {
      const scope = root && root.querySelectorAll ? root : doc;
      const els = [...scope.querySelectorAll("[data-module]")];
      if (scope !== doc && scope.matches && scope.matches("[data-module]")) els.unshift(scope);
      els.forEach((el) => {
        if (el.dataset.mounted) return;
        const fn = M._mounters[el.dataset.module];
        if (!fn) return;                       // its file may load later
        el.dataset.mounted = "1";
        try { fn(el); } catch (err) { console.warn("[verve] module " + el.dataset.module, err); }
      });
    };
  }

  /* ---------- helpers ---------- */

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = () => !!(V.reduced || doc.documentElement.classList.contains("reduced") ||
    matchMedia("(prefers-reduced-motion: reduce)").matches);
  const img = (tier, slug) => (V.img ? V.img(tier, slug) : `assets/img/${tier}/${slug}.jpg`);
  const dim = (slug) => (V.dim ? V.dim(slug) : (window.DIMS && window.DIMS[slug]) || [1600, 1100]);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let uid = 0;

  /* ---------- mount ---------- */

  function mount(el) {
    const a = el.dataset.a, b = el.dataset.b;
    if (!a || !b) return;
    const aLabel = el.dataset.aLabel || "Before", bLabel = el.dataset.bLabel || "After";
    const caption = el.dataset.caption || "";
    const [aw, ah] = dim(a), [bw, bh] = dim(b);
    const id = "cmp" + (++uid);

    el.classList.add("cmp");
    el.style.setProperty("--ar", `${bw} / ${bh}`);
    el.style.setProperty("--arn", (bw / bh).toFixed(4));
    el.innerHTML = `
      <div class="cmp__frame" role="slider" tabindex="0" data-cursor="drag" data-cursor-label="Drag"
        aria-label="${esc(aLabel)} and ${esc(bLabel)} comparison" aria-valuemin="0" aria-valuemax="100"
        aria-valuenow="50"${caption ? ` aria-describedby="${id}-cap"` : ""}>
        <img class="cmp__img cmp__img--b" src="${img("web", b)}" width="${bw}" height="${bh}" alt="${esc(bLabel)}" loading="lazy" decoding="async" draggable="false">
        <img class="cmp__img cmp__img--a" src="${img("web", a)}" width="${aw}" height="${ah}" alt="${esc(aLabel)}" loading="lazy" decoding="async" draggable="false">
        <span class="cmp__lbl cmp__lbl--a label" aria-hidden="true">${esc(aLabel)}</span>
        <span class="cmp__lbl cmp__lbl--b label" aria-hidden="true">${esc(bLabel)}</span>
        <div class="cmp__handle" aria-hidden="true"><span class="cmp__line"></span><span class="cmp__grip"><span class="cmp__arrows">&#10231;</span></span></div>
      </div>
      <div class="cmp__foot">
        ${caption ? `<p class="cmp__cap label" id="${id}-cap">${esc(caption)}</p>` : "<span></span>"}
        <button class="cmp__expand label" type="button" data-cursor="zoom" aria-label="View ${esc(aLabel)} and ${esc(bLabel)} full screen">
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M1.5 6V1.5H6M10 1.5h4.5V6M14.5 10v4.5H10M6 14.5H1.5V10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          <span>Expand</span>
        </button>
      </div>`;

    const frame = el.querySelector(".cmp__frame");
    const expand = el.querySelector(".cmp__expand");
    const lblA = el.querySelector(".cmp__lbl--a"), lblB = el.querySelector(".cmp__lbl--b");
    const box = { w: 1, aEnd: 0, bStart: 1 };
    const measure = () => {
      box.w = frame.clientWidth || 1;
      box.aEnd = lblA.offsetLeft + lblA.offsetWidth;
      box.bStart = lblB.offsetLeft;
    };
    let pos = 50, goal = 50, tween = 0, touched = false, dragging = false, startX = 0, rect = null;

    /* ---- render state ---- */
    const set = (p) => {
      pos = clamp(p, 0, 100);
      frame.style.setProperty("--p", pos.toFixed(3) + "%");
      // labels fade as the handle line reaches them (metrics cached, no layout reads here)
      const x = (pos / 100) * box.w;
      lblA.style.opacity = clamp((x - box.aEnd - 6) / 36, 0, 1).toFixed(3);
      lblB.style.opacity = clamp((box.bStart - x - 6) / 36, 0, 1).toFixed(3);
      const r = Math.round(pos);
      if (frame.getAttribute("aria-valuenow") !== String(r)) {
        frame.setAttribute("aria-valuenow", r);
        frame.setAttribute("aria-valuetext", `${r}% ${aLabel}, ${100 - r}% ${bLabel}`);
      }
    };

    const stop = () => { if (tween) cancelAnimationFrame(tween); tween = 0; };
    const animate = (keys, dur, ease) => {   // keys: [p0, p1, …] played evenly across dur (ms)
      stop();
      goal = keys[keys.length - 1];
      if (reduced()) { set(goal); return; }
      const t0 = performance.now(), seg = keys.length - 1;
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const k = Math.min(seg - 1, Math.floor(t * seg));
        const lt = t * seg - k;
        set(keys[k] + (keys[k + 1] - keys[k]) * (ease || easeOut)(clamp(lt, 0, 1)));
        tween = t < 1 ? requestAnimationFrame(step) : 0;
      };
      tween = requestAnimationFrame(step);
    };
    const toPct = (x) => ((x - rect.left) / rect.width) * 100;

    /* ---- pointer: drag anywhere, tap to jump ----
       mouse acts on press; touch waits to see a horizontal drag or a tap
       so vertical page scrolls (touch-action: pan-y) never move the handle */
    let pending = false, pid = null;
    const begin = (e) => {
      dragging = true; pending = false;
      el.classList.add("is-dragging");
      try { frame.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
    };
    frame.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      touched = true;
      rect = frame.getBoundingClientRect();
      startX = e.clientX; pid = e.pointerId;
      if (e.pointerType === "mouse") {
        const p = toPct(e.clientX);
        if (Math.abs(((p - pos) / 100) * rect.width) < 28) stop(); else animate([pos, p], 520, easeOut);
        begin(e);
      } else {
        pending = true;
      }
    });
    frame.addEventListener("pointermove", (e) => {
      if (pending && e.pointerId === pid && Math.abs(e.clientX - startX) > 6) { stop(); begin(e); }
      if (!dragging) return;
      if (tween && Math.abs(e.clientX - startX) < 4) return;   // let the jump ease play out
      stop();
      set(toPct(e.clientX));
    });
    const end = (e) => {
      if (pending && e.type === "pointerup") animate([pos, toPct(e.clientX)], 520, easeOut);   // tap
      pending = false;
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      try { frame.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    };
    frame.addEventListener("pointerup", end);
    frame.addEventListener("pointercancel", end);
    frame.addEventListener("lostpointercapture", () => { dragging = false; el.classList.remove("is-dragging"); });
    // the frame is a control, not a link: keep clicks away from lightbox/delegates
    frame.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
    frame.addEventListener("dragstart", (e) => e.preventDefault());

    /* ---- keyboard ---- */
    frame.addEventListener("keydown", (e) => {
      const big = e.shiftKey ? 15 : 5;
      const from = tween ? goal : pos;
      let p = null;
      switch (e.key) {
        case "ArrowLeft": case "ArrowDown": p = from - big; break;
        case "ArrowRight": case "ArrowUp": p = from + big; break;
        case "PageDown": p = from - 25; break;
        case "PageUp": p = from + 25; break;
        case "Home": p = 0; break;
        case "End": p = 100; break;
        default: return;
      }
      e.preventDefault();
      touched = true;
      animate([pos, clamp(p, 0, 100)], 260, easeOut);
    });

    /* ---- expand → lightbox with both images ---- */
    if (V.lightbox && typeof V.lightbox.open === "function") {
      expand.addEventListener("click", (e) => {
        e.stopPropagation();
        V.lightbox.open([
          { src: a, title: aLabel, note: caption },
          { src: b, title: bLabel, note: caption }
        ], pos >= 50 ? 0 : 1);
      });
    } else {
      expand.hidden = true;
    }

    /* ---- intro: one gentle sweep 50 → 35 → 50 when it enters view ---- */
    measure();
    set(50);
    const remeasure = () => { measure(); set(pos); };
    if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(frame);
    else window.addEventListener("resize", remeasure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
    if (!reduced() && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((ents) => {
        if (!ents.some((x) => x.isIntersecting)) return;
        io.disconnect();
        setTimeout(() => { if (!touched) animate([50, 35, 50], 2200, easeIO); }, 350);
      }, { threshold: .55 });
      io.observe(frame);
    }

    el.__compare = { set: (p) => { stop(); set(p); }, get: () => pos, animate: (p) => animate([pos, p], 520) };
  }

  M._mounters.compare = mount;
  M.compare = { mount };

  /* ---------- auto-mount static markup ---------- */
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", () => M.mountAll(doc));
  else M.mountAll(doc);
})();
