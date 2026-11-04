/* Shared helpers: DOM/SVG builders, multi-line text blocks, auto-fit, hexagon motif, transitions.
 * Every animation is a tween or a set on the single timeline (no callbacks), so seeking is deterministic. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const EASE = "power3.out";
  const EASE_IO = "power2.inOut";

  function el(tag, cls, parent, style) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (style) Object.assign(n.style, style);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svg(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  /** absolutely positioned box */
  function box(parent, x, y, w, h, cls) {
    return el("div", "abs " + (cls || ""), parent, { left: x + "px", top: y + "px", width: w + "px", height: (h == null ? "auto" : h + "px") });
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /**
   * Multi-line text block. Lines come from "\n" in config.json. Each line is masked so it can slide in.
   * opts.em: colour class applied to words written in CAPITALS (OBLIGATOIRE, JAMAIS…).
   */
  function text(parent, str, cls, opts = {}) {
    const n = el("div", "tx " + (cls || ""), parent);
    if (opts.wrap) {   // secondary mention: wraps naturally inside its box, fades in as a whole
      n.classList.add("wrap"); n.textContent = String(str || "").replace(/\n/g, " ");
      if (opts.maxW) n.style.maxWidth = opts.maxW + "px";
      if (opts.style) Object.assign(n.style, opts.style);
      return n;
    }
    const lines = String(str || "").split("\n").filter((l, i, a) => l.length || a.length === 1);
    n.innerHTML = lines.map((l) => {
      let h = esc(l);
      if (opts.em) h = h.replace(/(^|[\s(])([A-ZÀ-ÖØ-Þ]{2,})(?=$|[\s,.:;!?)])/g, `$1<span class="${opts.em}">$2</span>`);
      return `<span class="m"><span class="ln">${h}</span></span>`;
    }).join("");
    if (opts.maxW) n.dataset.maxw = opts.maxW;
    if (opts.min) n.dataset.min = opts.min;
    // 16:9 reading rules (L.RULES): size floors 72 px for main messages, 56 px secondary, 48 px anywhere
    else if (L.RULES) n.dataset.min = /\bt-(h1|big)\b/.test(cls) ? 72 : /\bt-(body|small)\b/.test(cls) ? 56 : 48;
    if (opts.label) n.dataset.kind = "label";        // icon label: shown at least 2 s
    if (opts.title) n.dataset.kind = "title";        // heading kept for the whole scene
    if (opts.group) n.dataset.group = opts.group;    // texts read together as one block
    if (opts.style) Object.assign(n.style, opts.style);
    return n;
  }

  /**
   * Shrinks each text block (all its lines together) until its longest line fits data-maxw.
   * Never goes below data-min (or the format's --small). Problems are logged to window.__report.
   */
  function fitAll(root, minDefault) {
    root.querySelectorAll(".tx[data-maxw]").forEach((n) => {
      const maxW = +n.dataset.maxw;
      const min = +(n.dataset.min || minDefault);
      let fs = parseFloat(getComputedStyle(n).fontSize);
      const widest = () => Math.max(...[...n.querySelectorAll(".ln")].map((l) => l.getBoundingClientRect().width / currentScale(n)));
      let w = widest();
      while (w > maxW && fs > min) { fs = Math.max(min, fs - 2); n.style.fontSize = fs + "px"; w = widest(); }
      if (w > maxW + 1) report("débordement", n, `${Math.round(w)} px > ${maxW} px à ${fs} px`);
    });
  }
  // the stage is CSS-scaled in preview: measure in stage pixels
  function currentScale(n) {
    const st = document.getElementById("stage");
    const r = st.getBoundingClientRect().width / st.offsetWidth;
    return r || 1;
  }
  window.__report = [];
  function report(kind, n, msg) { window.__report.push({ kind, text: n.textContent.trim().slice(0, 60), msg }); }

  /* ---------- hexagon motif (pointy top, rounded corners, like the logo) ---------- */
  function hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }
  /** SVG path of a polygon with rounded corners (radius in px) */
  function roundedPath(pts, rad) {
    const n = pts.length; let d = "";
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2), k = Math.min(rad, l1 / 2, l2 / 2);
      const a = [p1[0] + v1[0] / l1 * k, p1[1] + v1[1] / l1 * k], b = [p1[0] + v2[0] / l2 * k, p1[1] + v2[1] / l2 * k];
      d += (i ? "L" : "M") + a[0].toFixed(1) + " " + a[1].toFixed(1) + "Q" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + " " + b[0].toFixed(1) + " " + b[1].toFixed(1);
    }
    return d + "Z";
  }
  const hexD = (cx, cy, r, round = 0.12) => roundedPath(hexPoints(cx, cy, r), r * round);

  /** standalone hexagon <svg> of a given width, optional content (SVG string) centred inside */
  function hexBadge(parent, w, fill, inner, stroke) {
    const r = w / Math.sqrt(3), h = 2 * r;
    const s = svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, parent);
    s.innerHTML = `<path d="${hexD(w / 2, h / 2, r * (stroke ? 0.94 : 1))}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="${w * 0.05}"` : ""}/>` + (inner || "");
    return s;
  }

  /* ---------- tween helpers ---------- */
  function linesIn(tl, n, t, o = {}) {
    const ls = n.querySelectorAll(".ln");
    tl.fromTo(ls, { yPercent: 115 }, { yPercent: 0, duration: o.d || 0.6, ease: EASE, stagger: o.stagger ?? 0.12 }, t);
    return t + (o.d || 0.6) + (ls.length - 1) * (o.stagger ?? 0.12);
  }
  function linesOut(tl, n, t, d = 0.35) {
    tl.to(n.querySelectorAll(".ln"), { yPercent: -115, duration: d, ease: "power2.in", stagger: 0.04 }, t);
  }
  function pop(tl, n, t, o = {}) {
    tl.fromTo(n, { scale: o.from ?? 0.6, autoAlpha: 0, transformOrigin: o.origin || "50% 50%" }, { scale: 1, autoAlpha: 1, duration: o.d || 0.55, ease: o.ease || "back.out(1.8)" }, t);
  }
  function fadeUp(tl, n, t, o = {}) {
    tl.fromTo(n, { y: o.y ?? 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: o.d || 0.55, ease: EASE }, t);
  }

  /**
   * Hexagon wipe: a honeycomb in the brand blue grows from the centre and covers the frame,
   * the scenes swap underneath (swap(t)), then the cells shrink away. Returns the swap time.
   */
  function buildHexWipe(stage, W, H) {
    const layer = el("div", "", stage); layer.id = "hexwipe";
    const R = Math.max(W, H) / 9;
    const w = Math.sqrt(3) * R;
    const s = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, layer);
    const cells = [];
    for (let row = -1; row * 1.5 * R < H + R; row++) {
      for (let col = -1; col * w < W + w; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * 1.5 * R;
        const g = svg("g", { transform: `translate(${cx} ${cy})` }, s);
        svg("path", { d: hexD(0, 0, R * 1.02, 0.1), fill: "var(--bleu)" }, g);
        cells.push({ g, dist: Math.hypot(cx - W / 2, cy - H / 2) / Math.hypot(W / 2, H / 2) });
      }
    }
    gsap.set(cells.map((c) => c.g), { scale: 0, transformOrigin: "50% 50%" });
    return function wipe(tl, t, swap) {
      const IN = 0.45, OUT = 0.5, SPREAD = 0.3;
      cells.forEach((c) => {
        tl.fromTo(c.g, { scale: 0 }, { scale: 1.08, duration: IN, ease: "power2.in" }, t + c.dist * SPREAD);
        tl.to(c.g, { scale: 0, duration: OUT, ease: "power2.out" }, t + IN + SPREAD + 0.05 + c.dist * SPREAD);
      });
      const mid = t + IN + SPREAD + 0.02;
      swap(mid);
      return mid;
    };
  }

  /* ---------- reading rules (16:9) ---------- */
  const plain = (n) => { const ls = [...n.querySelectorAll(".ln")]; return (ls.length ? ls.map((l) => l.textContent).join(" ") : n.textContent).replace(/\s+/g, " ").trim(); };
  const words = (str) => String(str || "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  /** minimum time a text stays fully visible and still: max(2.5 s ; 0.5 s per word + 1 s); icon labels 2 s */
  const need = (str, label) => (label ? 2 : Math.max(2.5, 0.5 * words(str) + 1));
  const PAUSE = 0.5;   // fixed pause at the end of every scene
  /** plain fade-in of a block (no line is ever seen cut by its mask); returns the time it is fully visible */
  function show(tl, n, t, o = {}) {
    const ls = n.querySelectorAll(".ln"), d = o.d || 0.3, st = o.stagger ?? 0.06;
    tl.fromTo(ls, { opacity: 0 }, { opacity: 1, duration: d, ease: "power1.out", stagger: st }, t);
    return t + d + (ls.length - 1) * st;
  }
  function hide(tl, n, t, d = 0.3) { tl.to(n.querySelectorAll(".ln"), { opacity: 0, duration: d, ease: "power1.in" }, t); }
  /** show a block and keep it for its reading time (at least o.hold); returns the end of the reading */
  function read(tl, n, t, o = {}) { const full = show(tl, n, t, o); return full + Math.max(o.hold || 0, need(o.text != null ? o.text : plain(n), n.dataset.kind === "label")); }

  /**
   * 16:9 transition: one blue hexagon (point up) grows from the centre until it covers the whole frame, the scenes
   * swap underneath, then a hexagonal opening reveals the next scene. Same interface as buildHexWipe.
   */
  function buildHexWipe1(stage, W, H) {
    const layer = el("div", "", stage); layer.id = "hexwipe";
    const s = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, layer);
    const R = (Math.hypot(W, H) / 2) / (Math.sqrt(3) / 2) * 1.06;
    let n = 0;
    return function wipe(tl, t, swap) {
      const IN = 0.36, OUT = 0.42, k = n++;
      s.insertAdjacentHTML("beforeend", `<g class="wc${k}" transform="translate(${W / 2} ${H / 2})"><g class="ws"><path d="${hexD(0, 0, R, 0.04)}" fill="var(--bleu)"/></g></g>
        <mask id="wm${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>
          <g transform="translate(${W / 2} ${H / 2})"><g class="wh"><path d="${hexD(0, 0, R, 0.04)}" fill="#000"/></g></g></mask>
        <rect class="wr${k}" width="${W}" height="${H}" fill="var(--bleu)" mask="url(#wm${k})"/>`);
      const cover = s.querySelector(`.wc${k}`), grow = cover.querySelector(".ws");
      const rest = s.querySelector(`.wr${k}`), hole = s.querySelector(`#wm${k} .wh`);
      gsap.set([cover, rest], { autoAlpha: 0 });
      gsap.set([grow, hole], { scale: 0, transformOrigin: "50% 50%" });
      tl.set(cover, { autoAlpha: 1 }, t);
      tl.fromTo(grow, { scale: 0 }, { scale: 1, duration: IN, ease: "power2.in" }, t);
      const mid = t + IN;
      tl.set(cover, { autoAlpha: 0 }, mid); tl.set(rest, { autoAlpha: 1 }, mid);
      tl.fromTo(hole, { scale: 0 }, { scale: 1, duration: OUT, ease: "power2.out" }, mid + 0.02);
      tl.set(rest, { autoAlpha: 0 }, mid + 0.02 + OUT);
      swap(mid);
      return mid;
    };
  }

  /** gentle infinite-looking pulse, built from a finite repeat so the timeline stays seekable */
  function pulse(tl, n, t, until, o = {}) {
    const d = o.d || 0.5, reps = Math.max(0, Math.floor((until - t) / (2 * d)) - 1);
    tl.fromTo(n, { scale: 1 }, { scale: o.s || 1.06, duration: d, ease: "sine.inOut", yoyo: true, repeat: reps * 2 + 1, transformOrigin: o.origin || "50% 50%" }, t);
  }

  const L = { el, svg, box, esc, text, fitAll, report, hexPoints, roundedPath, hexD, hexBadge, linesIn, linesOut, pop, fadeUp, buildHexWipe, pulse, EASE, EASE_IO,
    plain, words, need, show, hide, read, PAUSE, buildHexWipe1, RULES: false };
  window.L = L;
})();
