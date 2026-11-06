/* ============================================================
   VERVE — published projects from Sanity, merged into PROJECTS
   Runs after data.js + core.js, before the page scripts. Sanity
   text is untrusted: every string is HTML-escaped here, so the
   page templates can treat it like data.js (already-safe HTML).
   Not configured, slow or broken ⇒ data.js only, never blocked.
   ============================================================ */
(() => {
  "use strict";

  const V = (window.VERVE = window.VERVE || {});
  const C = window.VERVE_CMS || {};
  const TIMEOUT = 3000;
  const LOCAL = (window.PROJECTS = window.PROJECTS || []);

  /* ---------- settle once : sync waiters first, then the promise ---------- */

  let settled = false, resolveCms = null;
  const waiters = [];
  V.cms = new Promise((res) => (resolveCms = res));
  V.afterCms = (fn) => { if (typeof fn !== "function") return; if (settled) fn(); else waiters.push(fn); };
  function finish(result) {
    if (settled) return;
    settled = true;
    waiters.splice(0).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    resolveCms(result);
  }

  const pid = String(C.projectId || "").trim(), ds = String(C.dataset || "production").trim();
  const ver = String(C.apiVersion || "2025-02-19").trim();
  if (!pid) return finish({ source: "local", changed: false });
  if (!/^[a-z0-9-]{1,64}$/.test(pid) || !/^[a-z0-9_-]{1,64}$/.test(ds) || !/^\d{4}-\d{2}-\d{2}$/.test(ver)) {
    console.warn("[verve] cms: invalid VERVE_CMS settings — showing built-in projects");
    return finish({ source: "local", changed: false });
  }

  /* ---------- sanitising ---------- */

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const str = (v) => (typeof v === "string" || typeof v === "number" ? esc(String(v).trim()) : "");
  const list = (v) => (Array.isArray(v) ? v : []);
  const IMG_RE = new RegExp(`^https://cdn\\.sanity\\.io/images/${pid}/${ds}/[A-Za-z0-9-]+\\.(?:jpe?g|png|webp|gif|avif)$`);
  window.DIMS = window.DIMS || {};

  /* {url, w, h} → the URL used as an image "slug" (dimensions registered in DIMS), or "" */
  function image(o) {
    const url = o && typeof o.url === "string" ? o.url : "";
    if (!IMG_RE.test(url)) return "";
    let w = +o.w, h = +o.h;
    if (!(w > 0 && h > 0)) { const m = url.match(/-(\d+)x(\d+)\.\w+$/); w = m ? +m[1] : 1600; h = m ? +m[2] : 1100; }
    window.DIMS[url] = [Math.round(w), Math.round(h)];
    return url;
  }
  function drawing(d) {
    const src = d && image(d.image);
    if (!src) return null;
    const out = { src, title: str(d.title), note: str(d.note) };
    if (d.tab) out.tab = str(d.tab);
    if (d.portrait === true) out.portrait = true;
    return out;
  }
  const drawings = (v) => list(v).map(drawing).filter(Boolean);

  const BLOCKS = {
    textBlock(b) {
      const body = list(b.body).map(str).filter(Boolean);
      return body.length || b.title ? { type: "text", kicker: str(b.kicker), title: str(b.title), body } : null;
    },
    featureBlock(b) { const item = drawing(b.drawing); return item && { type: "feature", label: str(b.label), item }; },
    gridBlock(b) {
      const items = drawings(b.drawings), cols = [1, 2, 3].includes(+b.cols) ? +b.cols : 2;
      return items.length ? { type: "grid", label: str(b.label), cols, items } : null;
    },
    tabsBlock(b) {
      const items = drawings(b.drawings).map((it, i) => ({ ...it, tab: it.tab || it.title || String(i + 1).padStart(2, "0") }));
      return items.length ? { type: "tabs", label: str(b.label), items } : null;
    },
    stepsBlock(b) { const items = drawings(b.drawings); return items.length ? { type: "seq", label: str(b.label), items } : null; },
    stripBlock(b) { const items = drawings(b.drawings); return items.length ? { type: "strip", label: str(b.label), items } : null; },
    compareBlock(b) {
      const a = drawing(b.a), z = drawing(b.b);
      return a && z ? { type: "compare", label: str(b.label), a, b: z, caption: str(b.caption) } : null;
    },
    legendBlock(b) {
      const d = drawing(b.drawing);
      return d ? { type: "legend", label: str(b.label), title: str(b.title) || d.title, src: d.src, items: list(b.items).map(str).filter(Boolean) } : null;
    }
  };
  function block(b) {
    try { return b && BLOCKS.hasOwnProperty(b._type) ? BLOCKS[b._type](b) : null; } catch (e) { return null; }
  }

  /* a Sanity document → the data.js project shape, or null when unusable */
  function project(d) {
    if (!d || typeof d.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,95}$/.test(d.id)) return null;
    const name = str(d.title), cover = image(d.cover);
    if (!name || !cover) return null;
    const p = { id: d.id, name, cover, banner: image(d.banner) || cover };
    /* home tile: its own drawing (focus from the hotspot), else the page shows banner → cover */
    const tile = image(d.tile);
    if (tile) {
      const h = d.tile.hotspot, ok = (v) => typeof v === "number" && v >= 0 && v <= 1;
      p.tile = tile; p.tileZoom = undefined;
      p.tilePos = h && ok(h.x) && ok(h.y) ? `${Math.round(h.x * 100)}% ${Math.round(h.y * 100)}%` : undefined;
    }
    ["practice", "place", "year", "typology", "role", "lede"].forEach((k) => (p[k] = str(d[k])));
    if (typeof d.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(d.accent)) p.accent = d.accent;
    p.thumbs = list(d.thumbs).map(image).filter(Boolean).slice(0, 3);
    p.intro = list(d.intro).map(str).filter(Boolean);
    p.blocks = list(d.blocks).map(block).filter(Boolean);
    if (typeof d.order === "number" && isFinite(d.order)) p.order = d.order;
    /* fields the document leaves empty */
    ["practice", "place", "year", "typology", "role", "lede"].forEach((k) => { if (d[k] == null) delete p[k]; });
    if (d.thumbs == null) delete p.thumbs;
    if (d.intro == null) delete p.intro;
    if (d.blocks == null) delete p.blocks;
    return p;
  }

  /* ---------- merge : same id replaces, others append, sort by order, renumber ---------- */

  const FILL = { accent: "", practice: "", place: "", year: "", typology: "", role: "", lede: "", thumbs: [], intro: [], blocks: [] };
  function merge(docs) {
    const out = LOCAL.map((p, i) => ({ ...p, order: typeof p.order === "number" ? p.order : i * 10 }));
    const at = {};
    out.forEach((p, i) => (at[p.id] = i));
    let extra = 0;
    docs.forEach((d) => {
      const p = project(d);
      if (!p) return;
      const i = at[p.id];
      if (i != null) out[i] = { ...out[i], ...p };   /* a field left empty in Sanity keeps the built-in value */
      else { at[p.id] = out.length; out.push({ ...FILL, order: 1e6 + extra++, ...p }); }
    });
    out.forEach((p, i) => (p.__i = i));
    out.sort((a, b) => a.order - b.order || a.__i - b.__i);
    out.forEach((p, i) => { delete p.__i; p.no = String(i + 1).padStart(2, "0"); });
    return out;
  }

  /* ---------- fetch (GROQ over the HTTP query API) ---------- */

  const IMG = `{ "url": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height }`;
  const TILE = IMG.replace(/ }$/, ", hotspot }");
  const DRAW = `{ title, note, tab, portrait, "image": image${IMG} }`;
  const GROQ = `*[_type == "project" && !(_id in path("drafts.**")) && defined(slug.current)] | order(order asc) {
    "id": slug.current, title, order, practice, place, year, typology, role, accent, lede, intro,
    "cover": cover${IMG}, "banner": banner${IMG}, "tile": tile${TILE}, "thumbs": thumbs[]${IMG},
    "blocks": blocks[]{ _type, kicker, title, body, label, cols, caption, items,
      "drawing": drawing${DRAW}, "drawings": drawings[]${DRAW}, "a": a${DRAW}, "b": b${DRAW} }
  }`;
  const host = C.useCdn === false ? "api.sanity.io" : "apicdn.sanity.io";
  const url = `https://${pid}.${host}/v${ver}/data/query/${ds}?query=${encodeURIComponent(GROQ)}&perspective=published`;

  const fallback = (why) => {
    if (settled) return;
    console.warn(`[verve] cms: ${why} — showing built-in projects`);
    finish({ source: "local", changed: false });
  };
  const ctrl = window.AbortController ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); fallback(`no answer in ${TIMEOUT / 1000}s`); }, TIMEOUT);

  try {
    fetch(url, { signal: ctrl ? ctrl.signal : undefined, credentials: "omit", headers: { Accept: "application/json" } })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => {
        clearTimeout(timer);
        if (settled) return;
        const docs = json && Array.isArray(json.result) ? json.result : null;
        if (!docs) return fallback("unexpected response");
        const merged = merge(docs);
        LOCAL.splice(0, LOCAL.length, ...merged);   /* same array object: earlier references stay valid */
        finish({ source: "sanity", changed: true, count: docs.length });
      })
      .catch((e) => { clearTimeout(timer); fallback(e && e.name === "AbortError" ? "request aborted" : String((e && e.message) || e)); });
  } catch (e) { clearTimeout(timer); fallback(String(e)); }
})();
