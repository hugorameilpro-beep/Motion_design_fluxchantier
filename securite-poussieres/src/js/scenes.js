/* The ten scenes (16:9). Each builder adds its DOM to the stage and its tweens to the shared timeline,
 * starting at `t`, and returns the time at which the next transition should start.
 * C = { tl, stage, T (texts), cfg, W, H, PAD, logo }.
 * Contrast rules: red only on white (or as white text on a red band); never red on the dark blue. */
(function () {
  const { el, svg, box, text, linesIn, linesOut, pop, fadeUp, hexBadge, hexD, pulse, EASE } = L;
  const BLEU = "var(--bleu)", FONCE = "var(--fonce)", ROUGE = "var(--rouge)", BLANC = "var(--blanc)";

  function mkScene(C, cls) {
    const s = el("div", "scene " + cls, C.stage);
    gsap.set(s, { autoAlpha: 0 });
    return s;
  }
  const fit = (C, root) => L.fitAll(root, 48);
  const abs = (n, x, y, extra) => Object.assign(n.style, { position: "absolute", left: x + "px", top: y + "px" }, extra || {});
  /** deterministic pseudo-random numbers (same video at every render) */
  function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /** floating dust: n circles in a box, drifting slowly (finite yoyo so the timeline stays seekable) */
  function dust(tl, parent, n, bx, t, until, o = {}) {
    const r = rng(o.seed || 7), out = [];
    for (let i = 0; i < n; i++) {
      const c = svg("circle", { cx: (bx[0] + r() * bx[2]).toFixed(1), cy: (bx[1] + r() * bx[3]).toFixed(1), r: ((o.rmin || 2) + r() * ((o.rmax || 5) - (o.rmin || 2))).toFixed(1),
        fill: o.color || BLANC, opacity: ((o.omin || 0.35) + r() * ((o.omax || 0.9) - (o.omin || 0.35))).toFixed(2) }, parent);
      const d = 1.6 + r() * 1.6, reps = Math.max(1, Math.floor((until - t) / d));
      tl.fromTo(c, { x: 0, y: 0 }, { x: (r() - 0.5) * (o.amp || 40), y: (r() - 0.3) * (o.amp || 40), duration: d, ease: "sine.inOut", yoyo: true, repeat: reps }, t);
      out.push(c);
    }
    return out;
  }
  /** keyframes that move an SVG element along a path (no plugin needed): samples the path once */
  function alongPath(tl, node, path, t, d, o = {}) {
    const Lp = path.getTotalLength(), N = 48, kf = [];
    for (let i = 1; i <= N; i++) { const p = path.getPointAtLength((Lp * i) / N); kf.push({ x: p.x, y: p.y, duration: d / N, ease: "none" }); }
    const p0 = path.getPointAtLength(0);
    tl.set(node, { x: p0.x, y: p0.y }, t - 0.001);
    tl.to(node, { keyframes: kf, ease: o.ease || "power1.inOut" }, t);
  }
  const hexClip = (w, h, r) => "polygon(" + L.hexPoints(w / 2, h / 2, r).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",") + ")";
  /** reveal a card through a growing hexagon (the logo motif) */
  function hexReveal(tl, n, w, h, t, d = 0.55) {
    gsap.set(n, { autoAlpha: 0 });
    tl.set(n, { autoAlpha: 1 }, t);
    tl.fromTo(n, { clipPath: hexClip(w, h, 8) }, { clipPath: hexClip(w, h, Math.hypot(w, h)), duration: d, ease: "power2.inOut" }, t);
    tl.set(n, { clipPath: "none" }, t + d + 0.01);
  }
  const level = (C, zone) => {
    const p = C.cfg.protection_par_zone || {};
    const z = (p.zones || []).find((x) => x.id === zone);
    return (z && z.niveau) || p.defaut || "";
  };
  const fill = (str, C) => String(str || "").replace(/\{niveau\}/g, level(C, null));

  /* ---------- side-view worker, feet at 0,0, facing right ---------- */
  function person(o = {}) {
    const body = o.body || BLEU, ink = o.ink || FONCE;
    return `<g class="legs"><rect x="-26" y="-125" width="19" height="125" rx="9" fill="${ink}"/><rect x="7" y="-125" width="19" height="125" rx="9" fill="${ink}"/></g>
      <rect x="-37" y="-242" width="74" height="132" rx="27" fill="${body}"/>
      <rect x="-37" y="-196" width="74" height="12" fill="${BLANC}"/><rect x="-37" y="-166" width="74" height="12" fill="${BLANC}"/>
      <g fill="${ink}"><rect x="40" y="-150" width="70" height="20" rx="8"/><circle cx="96" cy="-118" r="30" fill="none" stroke="${ink}" stroke-width="10"/></g>
      <g transform="rotate(-62 0 -222)"><rect x="-10" y="-232" width="20" height="96" rx="10" fill="${body}" stroke="${ink}" stroke-width="3"/></g>
      <g class="head"><circle cx="0" cy="-276" r="31" fill="${ink}"/>
        <path d="M-37 -282 C-37 -326 37 -326 37 -282 Z" fill="${BLANC}" stroke="${ink}" stroke-width="5"/>
        <path d="M-38 -282 H50" stroke="${ink}" stroke-width="9" stroke-linecap="round"/></g>`;
  }

  /* ========== 0. Opening: Dumez logo on white ========== */
  function S0(C, t) {
    const { W, T, tl } = C;
    const s = mkScene(C, "bg-white"); gsap.set(s, { autoAlpha: 1 });
    const { w: lw, h: lh } = C.logo;
    const ly = 300;
    const lc = el("div", "abs", s, { left: (W - lw) / 2 + "px", top: ly + "px" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const pad = Math.max(48, Math.round(lh * 0.42));                       // clear space ≥ height of the "H" of DUMEZ
    const ttl = text(s, T.titre, "t-h1 c-bleu center", { maxW: W - 2 * C.PAD });
    abs(ttl, 0, ly + lh + pad + 40, { width: W + "px" });
    const sub = text(s, T.sous_titre, "t-body c-fonce center", { maxW: W - 2 * C.PAD });
    fit(C, s);
    abs(sub, 0, ttl.offsetTop + ttl.offsetHeight + 16, { width: W + "px", fontWeight: 650 });
    tl.fromTo(lc, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE }, t + 0.05);
    linesIn(tl, ttl, t + 0.5);
    linesIn(tl, sub, t + 0.8);
    return t + 2.0;
  }

  /* ========== 1. Hook: a light beam reveals the dust ========== */
  function S1(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s);
    abs(art, 0, 0);
    const lamp = [1560, 70];
    art.innerHTML = `<defs>
        <linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>
        <clipPath id="beamClip" clipPathUnits="userSpaceOnUse"><path class="beamC" d="M${lamp[0]} ${lamp[1]} L860 ${H} L1500 ${H} Z"/></clipPath></defs>
      <g stroke="${BLEU}" stroke-width="14" fill="none" stroke-linecap="round">
        <path d="M940 1080 V420 M1080 1080 V420 M1220 1080 V420 M1360 1080 V420 M940 420 H1360 M940 600 H1360 M940 780 H1360"/>
        <path d="M1660 1080 V150 M1700 1080 V150 M1660 200 L1700 250 L1660 300 L1700 350 L1660 400 L1700 450 L1660 500 L1700 550 L1660 600 L1700 650 L1660 700 L1700 750"/>
        <path d="M1360 170 H1900"/></g>
      <rect x="0" y="1030" width="${W}" height="60" fill="${BLEU}" opacity=".6"/>
      <g transform="translate(1180 1030)">${person({ body: BLEU, ink: BLANC })}</g>
      <rect x="1290" y="980" width="150" height="50" rx="4" fill="${BLEU}"/>
      <g class="beam"><path class="beamP" d="M${lamp[0]} ${lamp[1]} L860 ${H} L1500 ${H} Z" fill="url(#beamG)"/></g>
      <rect x="${lamp[0] - 46}" y="${lamp[1] - 30}" width="92" height="44" rx="10" fill="${BLANC}"/>
      <g class="motes" clip-path="url(#beamClip)"></g>`;
    const motes = art.querySelector(".motes");
    dust(tl, motes, 170, [760, 120, 1000, 960], t, t + 4.6, { seed: 11, rmin: 2, rmax: 6, amp: 50 });
    // the beam slowly sweeps, revealing more particles
    const beamP = art.querySelector(".beamP"), beamC = art.querySelector(".beamC");
    tl.fromTo([beamP, beamC], { rotation: 10, svgOrigin: lamp.join(" ") }, { rotation: -8, svgOrigin: lamp.join(" "), duration: 4.6, ease: "sine.inOut" }, t);
    tl.fromTo(art.querySelector(".beam"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, t + 0.1);
    tl.fromTo(motes, { opacity: 0 }, { opacity: 1, duration: 1.0 }, t + 0.3);

    const col = el("div", "abs", s, { left: C.PAD + "px", top: "230px", width: "720px" });
    const l1 = text(col, T.accroche_1, "t-big c-blanc", { maxW: 720 });
    const panel = el("div", "", col, { display: "inline-block", background: "var(--blanc)", borderRadius: "28px", padding: "22px 36px 28px", marginTop: "48px" });
    const l2 = text(panel, T.accroche_2, "t-big c-rouge", { maxW: 650 });
    fit(C, s);
    linesIn(tl, l1, t + 0.35, { d: 0.65 });
    tl.fromTo(panel, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.5, ease: EASE }, t + 1.9);
    linesIn(tl, l2, t + 2.1);
    return t + 4.4;
  }

  /* ========== 2. Zones at risk: site plan, taped zones, mask sign at each entrance ========== */
  function S2(C, t) {
    const { W, T, tl } = C;
    const A = T.a_valider || {};
    const s = mkScene(C, "bg-white");
    const ttl = text(s, T.zones_titre, "t-h1 c-bleu", { maxW: W - 2 * C.PAD }); abs(ttl, C.PAD, 30);
    const PX = C.PAD, PY = 140, PW = W - 2 * C.PAD, PH = 720;
    const plan = svg("svg", { width: PW, height: PH, viewBox: `0 0 ${PW} ${PH}` }, s); abs(plan, PX, PY);
    // rooms: top row, corridor, bottom row; each zone has a door on the corridor side
    const Z = [
      { id: "decoupe", x: 30, y: 30, w: 540, h: 230, door: 220, side: "b" },
      { id: "poncage", x: 640, y: 470, w: 470, h: 220, door: 770, side: "t" },
      { id: "demolition", x: 1160, y: 30, w: 520, h: 230, door: 1230, side: "b" },
    ];
    let g = `<rect x="8" y="8" width="${PW - 16}" height="${PH - 16}" rx="14" fill="none" stroke="${BLEU}" stroke-width="14"/>
      <path d="M8 270 H${PW - 8} M8 460 H${PW - 8} M600 8 V270 M1130 8 V270 M600 460 V${PH - 8} M1140 460 V${PH - 8}" stroke="${BLEU}" stroke-width="8" opacity=".55"/>
      <path d="M40 365 H${PW - 40}" stroke="${BLEU}" stroke-width="6" stroke-dasharray="18 16" opacity=".35"/>`;
    Z.forEach((z, i) => {
      const d = `M${z.x} ${z.y} H${z.x + z.w} V${z.y + z.h} H${z.x} Z`;
      g += `<defs><mask id="zm${i}" maskUnits="userSpaceOnUse"><path class="zmp${i}" d="${d}" fill="none" stroke="#fff" stroke-width="40"/></mask></defs>
        <g class="zone${i}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" fill="${BLEU}" opacity=".06"/><g class="zd${i}"></g>
        <g mask="url(#zm${i})"><path d="${d}" fill="none" stroke="${FONCE}" stroke-width="22"/><path d="${d}" fill="none" stroke="${BLANC}" stroke-width="15"/>
        <path d="${d}" fill="none" stroke="${ROUGE}" stroke-width="15" stroke-dasharray="26 26"/></g></g>`;
    });
    plan.innerHTML = g + `<g class="pion"></g>`;
    const items = Z.map((z, i) => {
      const zd = plan.querySelector(`.zd${i}`);
      const motes = dust(tl, zd, 46, [z.x + 20, z.y + 20, z.w - 40, z.h - 40], t + 0.8, t + 7.4, { seed: 30 + i, color: BLEU, rmin: 2.5, rmax: 6, omin: 0.25, omax: 0.6, amp: 26 });
      const nm = text(s, (T.zones.find((x) => x.id === z.id) || {}).nom || z.id, "t-small c-fonce", { style: { fontWeight: 800 } });
      abs(nm, PX + z.x + 26, PY + z.y + 18);
      // sign at the entrance, in the corridor
      const sg = el("div", "abs", s, { left: PX + z.door + 16 + "px", top: PY + 282 + "px", display: "flex", alignItems: "center", gap: "14px" });
      const sc = el("div", "", sg); sc.innerHTML = P.mandatory(150);
      const lab = text(sg, (A.panneau || "") + (level(C, z.id) ? "\n" + level(C, z.id) : ""), "t-small c-fonce", { maxW: 300, style: { fontWeight: 800, lineHeight: 1.05 } });
      return { z, zone: plan.querySelector(`.zone${i}`), mp: plan.querySelector(`.zmp${i}`), zd, nm, sg, sc, lab };
    });
    // the worker (hexagon token) walks to a zone, puts the mask on, and goes in
    const pion = plan.querySelector(".pion");
    const tok = (name) => `<g><path d="${hexD(0, 0, 46, 0.12)}" fill="${BLEU}" stroke="${BLANC}" stroke-width="5"/>
      <g transform="translate(-30 -30) scale(.6)">${P.icons[name](BLANC, BLANC)}</g></g>`;
    pion.innerHTML = `<g class="p0">${tok("visage")}</g><g class="p1" opacity="0">${tok("ajuster")}</g>`;
    const msg = text(s, A.zones_message, "t-big c-bleu center", { maxW: W - 2 * C.PAD });
    abs(msg, 0, 878, { width: W + "px" });
    fit(C, s);

    linesIn(tl, ttl, t + 0.1);
    tl.fromTo(plan, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, t + 0.15);
    items.forEach((o, i) => {
      const at = t + 0.8 + i * 0.7;
      const Lz = 2 * (o.z.w + o.z.h);
      tl.fromTo(o.mp, { strokeDasharray: Lz, strokeDashoffset: Lz }, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, at);
      tl.fromTo(o.zd, { opacity: 0 }, { opacity: 1, duration: 0.6 }, at + 0.2);
      fadeUp(tl, o.nm, at + 0.25, { y: 12 });
      pop(tl, o.sc, at + 0.45, { from: 0.3 });
      linesIn(tl, o.lab, at + 0.55, { stagger: 0.08 });
      pulse(tl, o.sc, at + 1.2, t + 7.2, { s: 1.06, d: 0.45 });
    });
    const zt = Z[1], door = [zt.door - 40, 365];
    tl.set(pion, { x: 60, y: 365 }, t);
    tl.fromTo(pion, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 2.9);
    tl.to(pion, { x: door[0], duration: 1.5, ease: "power1.inOut" }, t + 3.0);
    tl.to(pion.querySelector(".p1"), { opacity: 1, duration: 0.25 }, t + 4.6);
    tl.to(pion.querySelector(".p0"), { opacity: 0, duration: 0.25 }, t + 4.6);
    tl.fromTo(pion, { scale: 1 }, { scale: 1.2, duration: 0.18, yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, t + 4.6);
    tl.to(pion, { x: zt.door, y: zt.y + 110, duration: 0.8, ease: "power1.inOut" }, t + 5.05);
    linesIn(tl, msg, t + 5.0, { stagger: 0.14 });
    return t + 7.2;
  }

  /* ========== 3. What raises dust: 8 task cards ========== */
  function S3(C, t) {
    const { W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-dark");
    const ttl = text(s, T.taches_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD }); abs(ttl, C.PAD, 26);
    const m1 = text(s, T.taches_message_1, "t-h1 c-blanc", { maxW: W - 2 * C.PAD }); abs(m1, C.PAD, 26);
    gsap.set(m1.querySelectorAll(".ln"), { yPercent: 115 });
    const X0 = C.PAD, X1 = W - C.PAD, Y0 = 136, Y1 = 900, GAP = 20, COLS = 4;
    const cw = (X1 - X0 - (COLS - 1) * GAP) / COLS, chh = (Y1 - Y0 - GAP) / 2, inner = cw - 28;
    const cards = T.taches.map((tk, k) => {
      const c = el("div", "card", s, { left: X0 + (k % COLS) * (cw + GAP) + "px", top: Y0 + Math.floor(k / COLS) * (chh + GAP) + "px", width: cw + "px", height: chh + "px", borderRadius: "30px", padding: "16px 14px" });
      const ib = el("div", "", c); hexBadge(ib, 120, BLANC, P.inHex(tk.id, 120, BLEU, ROUGE, 0.66));
      const nm = text(c, tk.nom, "t-small c-blanc", { maxW: inner, style: { fontSize: "52px", fontWeight: 800, marginTop: "10px" } });
      return { c, ib, nm };
    });
    const ment = text(s, T.taches_mention, "t-small c-blanc", { maxW: 900 }); abs(ment, C.PAD, 930, { fontWeight: 600, opacity: 0.9 });
    let am = null;
    if (cfg.show_amiante_note) { am = text(s, T.amiante_note, "t-small c-blanc", { maxW: 820 }); abs(am, W - C.PAD - 820, 930, { width: "820px", textAlign: "right", fontWeight: 700 }); }
    const panel = el("div", "abs", s, { left: "50%", top: "50%", background: "var(--blanc)", borderRadius: "36px", padding: "40px 70px 48px" });
    const m2 = text(panel, T.taches_message_2, "t-big c-bleu center", { maxW: 1400 });
    fit(C, s);
    gsap.set(panel, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    cards.forEach((o) => { if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`); });

    linesIn(tl, ttl, t + 0.1);
    fadeUp(tl, ment, t + 0.5, { y: 16 }); if (am) fadeUp(tl, am, t + 0.6, { y: 16 });
    const STEP = 0.76, A0 = t + 0.7;
    cards.forEach((o, k) => {
      const at = A0 + k * STEP;
      hexReveal(tl, o.c, cw, chh, at, 0.5);
      pop(tl, o.ib, at + 0.15, { from: 0.4 });
      linesIn(tl, o.nm, at + 0.25, { stagger: 0.08 });
      tl.fromTo(o.ib.querySelectorAll("circle"), { y: 0 }, { y: -5, duration: 0.5, yoyo: true, repeat: 9, ease: "sine.inOut", stagger: 0.07 }, at + 0.5);
    });
    linesOut(tl, ttl, t + 3.1);
    linesIn(tl, m1, t + 3.35);
    const b = A0 + cards.length * STEP + 0.3;
    tl.to(cards.map((o) => o.c), { opacity: 0.22, duration: 0.4 }, b);
    tl.fromTo(panel, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE }, b + 0.1);
    linesIn(tl, m2, b + 0.3, { stagger: 0.15 });
    return b + 2.2;
  }

  /* ========== 4. Silica: what it is, and the way into the lungs ========== */
  function lungsSVG(o = {}) {   // front view, viewBox 0 0 640 600
    const st = o.stroke || BLEU, fl = o.fill || BLEU;
    return `<path class="lg" d="M300 120 C250 110 205 150 180 220 C150 300 130 400 140 480 C150 540 200 560 250 540 C290 524 300 490 300 440 Z"
        fill="${fl}" fill-opacity="${o.op ?? 0.12}" stroke="${st}" stroke-width="10" stroke-linejoin="round"/>
      <path class="lg" d="M340 120 C390 110 435 150 460 220 C490 300 510 400 500 480 C490 540 440 560 390 540 C350 524 340 490 340 440 Z"
        fill="${fl}" fill-opacity="${o.op ?? 0.12}" stroke="${st}" stroke-width="10" stroke-linejoin="round"/>
      <g stroke="${st}" stroke-width="10" fill="none" stroke-linecap="round"><path d="M320 0 V160"/><path d="M320 160 L270 220 L240 300 M270 220 L220 250 M240 300 L210 360 M240 300 L262 370"/>
        <path d="M320 160 L370 220 L400 300 M370 220 L420 250 M400 300 L430 360 M400 300 L378 370"/></g>`;
  }
  function S4(C, t) {
    const { W, H, T, tl, cfg } = C;
    const A = T.a_valider || {};
    const s = mkScene(C, "bg-dark");
    const ttl = text(s, T.silice_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD }); abs(ttl, C.PAD, 30);
    const col = el("div", "abs", s, { left: C.PAD + "px", top: "160px", width: "930px" });
    const st = text(col, A.silice, "t-big c-blanc", { maxW: 900 });
    const mats = el("div", "", col, { display: "flex", gap: "6px", marginTop: "44px" });
    const MI = ["beton", "mortier", "pierre", "carrelage"];
    const mt = T.silice_materiaux.map((m, i) => {
      const c = el("div", "", mats, { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "228px" });
      const hb = el("div", "", c); hexBadge(hb, 120, BLANC, P.inHex(MI[i % 4], 120, BLEU, BLEU, 0.62));
      const lb = text(c, m, "t-small c-blanc center", { maxW: 228, style: { fontWeight: 750 } });
      return { hb, lb };
    });
    const ch = text(col, T.silice_chemin, "t-body c-blanc", { maxW: 840, style: { marginTop: "44px", fontWeight: 650 } });
    let vl = null;
    if (cfg.show_vlep) { vl = text(s, T.vlep, "t-small c-blanc", { maxW: 840 }); abs(vl, C.PAD, 940, { fontWeight: 600, opacity: 0.85 }); }

    // illustration: profile head, airways, lungs; a fine particle goes in through the nose
    const art = svg("svg", { width: 870, height: 928, viewBox: "0 0 900 960" }, s); abs(art, 1030, 110);
    art.innerHTML = `<g class="draw" stroke="${BLANC}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path class="hd" d="M560 330 C580 230 600 80 450 40 C350 15 280 80 290 150 L262 200 L292 214 L300 240 L294 262 L312 272 C304 302 330 326 372 328 L400 360"/>
        <path class="aw" d="M300 214 C340 214 372 226 392 262 C410 296 420 330 420 380"/></g>
      <g transform="translate(100 350)">${lungsSVG({ stroke: BLANC, fill: BLANC, op: 0.08 })}</g>
      <path class="route" d="M60 200 C150 196 230 205 300 214 C340 214 372 226 392 262 C410 296 420 330 420 380 L420 510 L470 570 L500 650 L530 710" fill="none" stroke="none"/>
      <g class="trail"></g>
      <g class="pt"><circle r="16" fill="${BLANC}" opacity=".25"/><circle r="8" fill="${BLANC}"/></g>
      <g class="bub" transform="translate(720 770)"><circle r="150" fill="${BLANC}"/>
        <g stroke="${BLEU}" stroke-width="7" fill="none"><circle cx="-50" cy="-30" r="44"/><circle cx="34" cy="-48" r="40"/><circle cx="-12" cy="40" r="46"/><circle cx="66" cy="30" r="38"/><path d="M-120 -120 L-70 -64"/></g>
        <circle cx="-12" cy="40" r="11" fill="${ROUGE}"/></g>
      <path class="lead" d="M540 720 L590 740" stroke="${BLANC}" stroke-width="5" stroke-dasharray="10 10"/>`;
    fit(C, s);
    const draw = [...art.querySelectorAll(".draw path"), ...art.querySelectorAll("g[transform] path, g[transform] g path")].filter((p) => !p.closest(".bub"));
    const route = art.querySelector(".route"), pt = art.querySelector(".pt"), bub = art.querySelector(".bub"), lead = art.querySelector(".lead");

    linesIn(tl, ttl, t + 0.1);
    linesIn(tl, st, t + 0.4, { stagger: 0.14 });
    mt.forEach((o, i) => { pop(tl, o.hb, t + 1.1 + i * 0.15, { from: 0.4 }); linesIn(tl, o.lb, t + 1.2 + i * 0.15); });
    draw.forEach((p) => { const Lp = p.getTotalLength(); tl.fromTo(p, { strokeDasharray: Lp, strokeDashoffset: Lp }, { strokeDashoffset: 0, duration: 1.1, ease: "power1.inOut" }, t + 0.5); });
    tl.fromTo(pt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 1.8);
    alongPath(tl, pt, route, t + 1.9, 3.0);
    linesIn(tl, ch, t + 2.6, { stagger: 0.12 });
    tl.fromTo(lead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, t + 4.8);
    tl.fromTo(bub, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, t + 4.9);
    if (vl) fadeUp(tl, vl, t + 1.6, { y: 14 });
    return t + 7.2;
  }

  /* ========== 5. Consequences: lungs filling with red, then the strong message ========== */
  function S5(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-white");
    const art = svg("svg", { width: 860, height: 806, viewBox: "0 0 640 600" }, s); abs(art, -40, 150);
    const r = rng(5);
    let spots = "";
    for (let i = 0; i < 18; i++) {
      const left = i % 2 === 0, x = left ? 160 + r() * 130 : 350 + r() * 130, y = 180 + r() * 340;
      spots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(22 + r() * 34).toFixed(0)}" fill="${ROUGE}"/>`;
    }
    art.innerHTML = `<defs><clipPath id="lungClip"><path d="M300 120 C250 110 205 150 180 220 C150 300 130 400 140 480 C150 540 200 560 250 540 C290 524 300 490 300 440 Z"/>
        <path d="M340 120 C390 110 435 150 460 220 C490 300 510 400 500 480 C490 540 440 560 390 540 C350 524 340 490 340 440 Z"/></clipPath></defs>
      ${lungsSVG({})}<g class="spots" clip-path="url(#lungClip)" opacity=".9">${spots}</g>`;
    const spotEls = [...art.querySelectorAll(".spots circle")];
    const RX = 860, RW = W - RX - C.PAD;
    const hd = el("div", "abs", s, { left: RX + "px", top: "60px", display: "flex", alignItems: "center", gap: "28px" });
    const dg = el("div", "", hd); dg.innerHTML = P.danger(120);
    const h1 = text(hd, T.poumons_titre, "t-h1 c-fonce", { maxW: RW - 160 });
    const h2 = text(s, T.grave_titre, "t-h1 c-rouge", { maxW: RW - 160 }); abs(h2, RX + 148, 60);
    gsap.set(h2.querySelectorAll(".ln"), { yPercent: 115 });
    const list = el("div", "abs", s, { left: RX + "px", top: "250px", width: RW + "px", display: "flex", flexDirection: "column", gap: "30px" });
    const bullet = (row) => { const b = el("div", "", row, { flex: "none", marginTop: "10px" }); hexBadge(b, 40, BLEU); return b; };
    const items = T.poumons.map((p) => {
      const row = el("div", "", list, { display: "flex", gap: "26px", alignItems: "flex-start" });
      const b = bullet(row); const tx = text(row, p, "t-body c-fonce", { maxW: RW - 70 });
      return { row, b, tx };
    });
    const list2 = el("div", "abs", s, { left: RX + "px", top: "250px", width: RW + "px", display: "flex", flexDirection: "column", gap: "30px", alignItems: "flex-start" });
    const g1 = text(list2, T.grave[0], "t-big c-fonce", { maxW: RW });
    const gb = el("div", "band", list2, { display: "inline-block" });
    const g2 = text(gb, T.grave[1], "t-big", { maxW: RW - 80 });
    const g3 = text(list2, T.grave_delai, "t-body c-bleu", { maxW: RW, style: { fontWeight: 800 } });
    gsap.set(list2, { autoAlpha: 0 });
    const msgs = el("div", "abs", s, { left: RX + "px", top: "250px", width: RW + "px", display: "flex", flexDirection: "column", gap: "34px" });
    const mk = (ic, str, blue) => {
      const row = el("div", "", msgs, { display: "flex", alignItems: "center", gap: "30px", background: blue ? "var(--bleu)" : "var(--blanc)", border: blue ? "none" : "8px solid var(--bleu)", borderRadius: "30px", padding: "24px 30px" });
      const hb = el("div", "", row, { flex: "none" }); hexBadge(hb, 130, blue ? BLANC : BLEU, P.inHex(ic, 130, blue ? BLEU : BLANC, blue ? ROUGE : BLANC, 0.6));
      const tx = text(row, str, "t-body " + (blue ? "c-blanc" : "c-fonce"), { maxW: RW - 230 });
      return { row, hb, tx };
    };
    const d1 = mk("dose", T.dose_message, true), d2 = mk("tabac", T.tabac_message, false);
    gsap.set(msgs, { autoAlpha: 0 });
    // strong message on a red hexagon
    const big = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(big, 0, 0);
    big.innerHTML = `<path d="${hexD(W / 2, H / 2, Math.hypot(W, H) * 0.62)}" fill="${ROUGE}"/>`;
    const mf = text(s, T.message_fort, "t-big c-blanc center", { maxW: W - 2 * C.PAD });
    fit(C, s);
    abs(mf, 0, (H - mf.offsetHeight) / 2, { width: W + "px" });
    gsap.set(big, { autoAlpha: 0 }); gsap.set(mf.querySelectorAll(".ln"), { yPercent: 115 });

    tl.fromTo(dg, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)", transformOrigin: "50% 60%" }, t + 0.05);
    linesIn(tl, h1, t + 0.15);
    tl.fromTo(art, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: EASE }, t + 0.2);
    spotEls.forEach((c, i) => tl.fromTo(c, { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, t + 0.7 + i * 0.36));
    items.forEach((o, i) => { pop(tl, o.b, t + 0.6 + i * 0.75, { from: 0.3 }); linesIn(tl, o.tx, t + 0.65 + i * 0.75); });
    // phase 2: more serious
    const p2 = t + 4.0;
    tl.to(list, { autoAlpha: 0, y: -20, duration: 0.35 }, p2);
    linesOut(tl, h1, p2); linesIn(tl, h2, p2 + 0.25);
    tl.set(list2, { autoAlpha: 1 }, p2 + 0.35);
    linesIn(tl, g1, p2 + 0.4);
    tl.fromTo(gb, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.45, ease: EASE }, p2 + 0.9); linesIn(tl, g2, p2 + 1.05);
    linesIn(tl, g3, p2 + 1.5);
    // phase 3: dose and tobacco
    const p3 = t + 6.4;
    tl.to([list2, hd, h2], { autoAlpha: 0, duration: 0.3 }, p3);
    tl.set(msgs, { autoAlpha: 1 }, p3 + 0.3);
    [d1, d2].forEach((o, i) => { tl.fromTo(o.row, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE }, p3 + 0.3 + i * 0.55); linesIn(tl, o.tx, p3 + 0.45 + i * 0.55); });
    // phase 4: strong message
    const m = t + 8.1;
    tl.set(big, { autoAlpha: 1 }, m);
    tl.fromTo(big.firstChild, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: "power3.inOut" }, m);
    linesIn(tl, mf, m + 0.45, { stagger: 0.15 });
    return m + 1.9;
  }

  /* ========== 6. First, reduce the dust at the source ========== */
  function S6(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const ttl = text(s, T.source_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD }); abs(ttl, C.PAD, 24);
    const Y0 = 236, GAP = 30, cw = (W - 2 * C.PAD - 2 * GAP) / 3, chh = 610;
    const cards = T.source_cartes.map((sc, i) => {
      const c = el("div", "card", s, { left: C.PAD + i * (cw + GAP) + "px", top: Y0 + "px", width: cw + "px", height: chh + "px", borderRadius: "40px", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" });
      const ib = el("div", "", c); hexBadge(ib, 150, BLANC, P.inHex(sc.id, 150, BLEU, BLEU, 0.62));
      const tt = text(c, sc.titre, "t-big c-blanc center", { maxW: cw - 40, style: { marginTop: "14px" } });
      const ls = sc.lignes.map((l) => text(c, l, "t-small c-blanc center", { maxW: cw - 40, style: { marginTop: "14px", fontWeight: 650 } }));
      return { c, ib, tt, ls };
    });
    const band = el("div", "abs", s, { left: "50%", top: "872px", background: "var(--blanc)", borderRadius: "30px", padding: "14px 60px 20px" });
    const bt = text(band, T.source_message, "t-body c-bleu center", { maxW: W - 2 * C.PAD - 120, style: { fontWeight: 900 } });
    fit(C, s);
    gsap.set(band, { xPercent: -50 });
    cards.forEach((o) => { if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`); });

    linesIn(tl, ttl, t + 0.1, { stagger: 0.12 });
    cards.forEach((o, i) => {
      const at = t + 0.6 + i * 1.3;
      hexReveal(tl, o.c, cw, chh, at, 0.55);
      pop(tl, o.ib, at + 0.2, { from: 0.4 });
      linesIn(tl, o.tt, at + 0.3);
      o.ls.forEach((l, k) => linesIn(tl, l, at + 0.5 + k * 0.2, { stagger: 0.08 }));
      // small life in each icon: water drops fall, dust is sucked in, arrows turn
      if (i === 0) tl.fromTo(o.ib.querySelectorAll("svg > g > g[fill] path"), { y: -6 }, { y: 6, duration: 0.35, yoyo: true, repeat: 13, ease: "sine.inOut", stagger: 0.12 }, at + 0.6);
      if (i === 1) tl.fromTo(o.ib.querySelectorAll("svg > g > g:last-child path"), { x: 10, opacity: 1 }, { x: -12, opacity: 0.2, duration: 0.5, repeat: 9, ease: "power1.in", stagger: 0.1 }, at + 0.6);
      if (i === 2) tl.fromTo(o.ib.querySelector("svg > g > g"), { rotation: 0 }, { rotation: 360, transformOrigin: "50% 50%", duration: 1.6, ease: "power2.inOut" }, at + 0.6);
    });
    tl.fromTo(band, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE }, t + 4.7);
    linesIn(tl, bt, t + 4.85, { stagger: 0.14 });
    return t + 7.2;
  }

  /* ========== 7. The right mask, worn properly: five cards ========== */
  function S7(C, t) {
    const { W, H, T, tl, cfg } = C;
    const A = T.a_valider || {};
    const s = mkScene(C, "bg-white");
    const ttl = text(s, T.masque_titre, "t-h1 c-bleu", { maxW: W - 2 * C.PAD }); abs(ttl, C.PAD, 26);
    const cx = C.PAD, cy = 140, cw = W - 2 * C.PAD, ch = 800;
    const N = T.masque_cartes.length, DUR = [2.9, 2.8, 2.1, 2.3, 2.8];
    const prog = el("div", "abs", s, { left: 0, width: W + "px", top: cy + ch + 34 + "px", display: "flex", justifyContent: "center", gap: "22px" });
    const dots = T.masque_cartes.map(() => { const d = el("div", "", prog); hexBadge(d, 40, BLEU); gsap.set(d, { opacity: 0.25 }); return d; });
    const BIG = { ajuster: "ajuster", avant: "avant", accessoires: "combinaison", hygiene: "hygiene" };
    const TX = 600, TW = cw - TX - 60;
    const cards = T.masque_cartes.map((mc, i) => {
      const c = el("div", "card", s, { left: cx + "px", top: cy + "px", width: cw + "px", height: ch + "px", borderRadius: "44px" });
      const nb = el("div", "num", c, { left: "40px", top: "36px" });
      hexBadge(nb, 96, BLANC, `<text x="48" y="74" text-anchor="middle" font-family="Inter" font-weight="900" font-size="54" fill="${BLEU}">${i + 1}</text>`);
      const pic = el("div", "abs", c, { left: "110px", top: (ch - 438) / 2 + "px" });
      const pw = 380;
      hexBadge(pic, pw, BLANC, mc.id === "choisir" ? `<g transform="translate(${pw * 0.14} ${pw * 0.217}) scale(${pw * 0.0036})">${P.mandatory(200).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`
        : P.inHex(BIG[mc.id], pw, BLEU, ROUGE, 0.58));
      let extra = null;
      if (mc.id === "accessoires") { extra = el("div", "abs", pic, { right: "-30px", bottom: "0px" }); hexBadge(extra, 170, BLANC, P.inHex("lunettes", 170, BLEU, BLEU, 0.64), BLEU); }
      const col = el("div", "abs", c, { left: TX + "px", width: TW + "px", top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" });
      const tt = text(col, mc.titre, "t-big c-blanc", { maxW: TW, em: null });
      const o = { c, nb, pic, extra, tt, parts: [], lines: [] };
      if (mc.types) {
        const row = el("div", "", col, { display: "flex", gap: "30px", marginTop: "40px" });
        mc.types.forEach((ty) => {
          const cell = el("div", "", row, { display: "flex", flexDirection: "column", alignItems: "center", width: (TW - 60) / 3 + "px", gap: "14px" });
          const hb = el("div", "", cell); hexBadge(hb, 150, BLANC, P.inHex(ty.id, 150, BLEU, BLEU, 0.64));
          const lb = text(cell, fill(ty.nom, C), "t-small c-blanc center", { maxW: (TW - 60) / 3, style: { fontWeight: 800 } });
          o.parts.push({ hb, lb });
        });
        o.mention = text(col, fill(A.choix_mention, C), "t-small c-blanc", { maxW: TW, style: { marginTop: "40px", fontWeight: 650, opacity: 0.95 } });
      }
      (mc.lignes || []).forEach((l, k) => {
        const row = el("div", "", col, { display: "flex", gap: "22px", alignItems: "flex-start", marginTop: k ? "22px" : "36px" });
        const b = el("div", "", row, { flex: "none", marginTop: "12px" }); hexBadge(b, 36, BLANC);
        o.lines.push({ b, tx: text(row, l, "t-body c-blanc", { maxW: TW - 60, style: { fontWeight: 700 } }) });
      });
      gsap.set(c, { autoAlpha: 0 });
      return o;
    });
    fit(C, s);
    cards.forEach((o) => { const col = o.tt.parentNode; if (col.scrollHeight > ch + 1) L.report("débordement", o.c, `carte : ${col.scrollHeight} px > ${ch} px`); });

    linesIn(tl, ttl, t + 0.1);
    let at = t + 0.3;
    cards.forEach((o, i) => {
      hexReveal(tl, o.c, cw, ch, at, 0.6);
      tl.to(dots[i], { opacity: 1, duration: 0.3 }, at);
      if (i) tl.to(dots[i - 1], { opacity: 0.55, duration: 0.3 }, at);
      pop(tl, o.nb, at + 0.25, { from: 0.4 });
      pop(tl, o.pic, at + 0.2, { from: 0.7 });
      if (o.extra) pop(tl, o.extra, at + 0.9, { from: 0.3 });
      linesIn(tl, o.tt, at + 0.3);
      o.parts.forEach((p, k) => { pop(tl, p.hb, at + 0.6 + k * 0.2, { from: 0.4 }); linesIn(tl, p.lb, at + 0.7 + k * 0.2); });
      if (o.mention) linesIn(tl, o.mention, at + 1.3, { stagger: 0.1 });
      o.lines.forEach((l, k) => { pop(tl, l.b, at + 0.6 + k * 0.3, { from: 0.3 }); linesIn(tl, l.tx, at + 0.62 + k * 0.3, { stagger: 0.08 }); });
      at += DUR[i];
      if (i < N - 1) tl.to(o.c, { autoAlpha: 0, scale: 0.97, duration: 0.3, ease: "power2.in" }, at - 0.05);
    });
    return at + 0.2;
  }

  /* ========== 8. Final message + logo ========== */
  function S8(C, t) {
    const { W, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const sign = el("div", "abs", s, { left: "130px", top: "170px" }); sign.innerHTML = P.mandatory(340);
    const tx = 600, tw = W - tx - C.PAD;
    const col = el("div", "abs", s, { left: tx + "px", width: tw + "px", top: "150px" });
    const f1 = text(col, T.final_1, "t-big c-bleu", { maxW: tw });
    const f2 = text(col, T.final_2, "t-big c-rouge", { maxW: tw, style: { marginTop: "40px" } });
    const { w: lw, h: lh } = C.logo;
    const pad = Math.max(40, Math.round(lh * 0.42));
    const logos = el("div", "abs", s, { left: tx - pad + "px", top: "690px", display: "flex", alignItems: "center", gap: "40px" });
    const lc = el("div", "", logos, { padding: pad + "px", background: "var(--blanc)" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    if (C.logoChantier) { const cc = el("div", "", logos, { padding: pad + "px" }); const i2 = el("img", "", cc); i2.src = C.logoChantier.src; i2.width = C.logoChantier.w; i2.height = C.logoChantier.h; }
    fit(C, s);
    pop(tl, sign, t + 0.1, { from: 0.3, d: 0.7 });
    linesIn(tl, f1, t + 0.35);
    linesIn(tl, f2, t + 1.2);
    fadeUp(tl, logos, t + 1.9, { y: 24 });
    tl.to({}, { duration: 0.01 }, t + 4.6);
    return t + 4.6;
  }

  /* ========== 9. Closing: dust particles draw the logo hexagon, then the logo ========== */
  function S9(C, t) {
    const { W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const blue = cfg.palette.bleu, red = cfg.palette.rouge;
    const { w: lw, h: lh } = C.logo;
    const lx = Math.round((W - lw) / 2), ly = Math.round(H * 0.36);
    // the logo, on white, with its clear space; never scaled beyond the cap (C.logo is already capped)
    const lc = el("div", "abs", s, { left: lx + "px", top: ly + "px", width: lw + "px", height: lh + "px" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const txt = text(s, T.fin_texte, "t-big c-bleu center", { maxW: W - 2 * C.PAD });
    abs(txt, 0, ly + lh + Math.max(60, Math.round(lh * 0.6)), { width: W + "px" });
    let credit = null;
    if (cfg.show_synapsis_credit) {
      credit = el("div", "abs", s, { left: 0, width: W + "px", bottom: "50px", display: "flex", justifyContent: "center", alignItems: "center", gap: "22px" });
      const ci = el("img", "", credit, { height: "56px" }); ci.src = "../" + cfg.logos.synapsis;
      text(credit, T.credit, "t-small c-fonce", { style: { fontWeight: 650, opacity: 0.8 } });
    }
    fit(C, s);

    // the hexagon of the logo (point up): blue top, white gap, red bottom (proportions measured on the logo)
    const R = 190, cx0 = W / 2, cy0 = H * 0.42;
    const fxc = lx + 0.128 * lw, fyc = ly + 0.5 * lh, fR = 0.5 * lh;        // where that hexagon sits in the logo
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(art, 0, 0);
    const d = hexD(0, 0, R, 0.1);
    art.innerHTML = `<defs><clipPath id="hexTop"><rect x="${-R * 2}" y="${-R * 2}" width="${R * 4}" height="${R * 2 + (2 * 0.625 - 1) * R}"/></clipPath>
        <clipPath id="hexBot"><rect x="${-R * 2}" y="${(2 * 0.725 - 1) * R}" width="${R * 4}" height="${R * 2}"/></clipPath></defs>
      <g class="parts"></g>
      <g class="hex"><g class="hs"><path class="ft" d="${d}" fill="${blue}" clip-path="url(#hexTop)"/><path class="fb" d="${d}" fill="${blue}" clip-path="url(#hexBot)"/>
        <path class="ol" d="${d}" fill="none" stroke="${blue}" stroke-width="12" stroke-linejoin="round"/></g></g>`;
    const hex = art.querySelector(".hex"), hs = art.querySelector(".hs"), ol = art.querySelector(".ol"), ft = art.querySelector(".ft"), fb = art.querySelector(".fb");
    const parts = art.querySelector(".parts");
    gsap.set(hex, { x: cx0, y: cy0 }); gsap.set(parts, { x: cx0, y: cy0 });
    gsap.set(hs, { transformOrigin: "50% 50%", scale: 1 });
    gsap.set([ft, fb], { opacity: 0 }); gsap.set(lc, { autoAlpha: 0 });
    const Lo = ol.getTotalLength();

    // 1. floating dust converges onto the outline of the hexagon
    const r = rng(99), NP = 110;
    for (let i = 0; i < NP; i++) {
      const p = ol.getPointAtLength((Lo * i) / NP);
      const c = svg("circle", { cx: 0, cy: 0, r: (3 + r() * 4).toFixed(1), fill: i % 5 === 0 ? red : blue }, parts);
      const sx = (r() - 0.5) * W * 1.1, sy = (r() - 0.5) * H * 1.1;
      tl.fromTo(c, { x: sx, y: sy, opacity: 0 }, { x: p.x, y: p.y, opacity: 0.9, duration: 0.85, ease: "power3.inOut" }, t + r() * 0.3);
    }
    // 2. the outline is drawn in blue, the hexagon fills, and its bottom turns red as in the logo
    tl.fromTo(ol, { strokeDasharray: Lo, strokeDashoffset: Lo }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, t + 0.85);
    tl.to(parts, { opacity: 0, duration: 0.35 }, t + 1.2);
    tl.to([ft, fb], { opacity: 1, duration: 0.3 }, t + 1.35);
    tl.to(ol, { opacity: 0, duration: 0.25 }, t + 1.5);
    tl.fromTo(fb, { attr: { fill: blue } }, { attr: { fill: red }, duration: 0.3, ease: "none" }, t + 1.6);
    // 3. the hexagon lands on the logo's own hexagon while the logo fades in (24 px slide)
    const SL = 24;
    tl.to(hex, { x: fxc, y: fyc + SL, duration: 0.55, ease: "power3.inOut" }, t + 1.9);
    tl.to(hs, { scale: fR / R, duration: 0.55, ease: "power3.inOut" }, t + 1.9);
    tl.fromTo(lc, { autoAlpha: 0, y: SL }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE }, t + 2.35);
    tl.to(hex, { y: fyc, duration: 0.5, ease: EASE }, t + 2.35);
    tl.to(hex, { opacity: 0, duration: 0.3 }, t + 2.55);
    linesIn(tl, txt, t + 2.6);
    if (credit) fadeUp(tl, credit, t + 2.8, { y: 16 });
    tl.to({}, { duration: 0.01 }, t + 3.2 + 1.0);   // hold the last image 1 s
    return t + 4.2;
  }

  window.SCENES = { S0, S1, S2, S3, S4, S5, S6, S7, S8, S9 };
})();
