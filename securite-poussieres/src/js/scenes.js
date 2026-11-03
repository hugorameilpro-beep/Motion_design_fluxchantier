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
  /** a card comes in with a short fade and a slight zoom (no clip, no isolated outline) */
  function cardIn(tl, n, t, d = 0.3) {
    gsap.set(n, { autoAlpha: 0 });
    tl.fromTo(n, { autoAlpha: 0, scale: 0.96, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: d, ease: "power2.out" }, t);
  }
  const level = (C, zone) => {
    const p = C.cfg.protection_par_zone || {};
    const z = (p.zones || []).find((x) => x.id === zone);
    return (z && z.niveau) || p.defaut || "";
  };
  const fill = (str, C) => String(str || "").replace(/\{niveau\}/g, level(C, null));

  /* ---------- side-view worker, feet at 0,0, facing right ---------- */
  function person(o = {}) {
    const body = o.body || BLEU, ink = o.ink || FONCE, tool = o.tool !== false;
    return `<g class="legs"><rect class="leg1" x="-26" y="-125" width="19" height="125" rx="9" fill="${ink}"/><rect class="leg2" x="7" y="-125" width="19" height="125" rx="9" fill="${ink}"/></g>
      <rect x="-37" y="-242" width="74" height="132" rx="27" fill="${body}"/>
      <rect x="-37" y="-196" width="74" height="12" fill="${BLANC}"/><rect x="-37" y="-166" width="74" height="12" fill="${BLANC}"/>
      ${tool ? `<g fill="${ink}"><rect x="40" y="-150" width="70" height="20" rx="8"/><circle cx="96" cy="-118" r="30" fill="none" stroke="${ink}" stroke-width="10"/></g>
      <g transform="rotate(-62 0 -222)"><rect x="-10" y="-232" width="20" height="96" rx="10" fill="${body}" stroke="${ink}" stroke-width="3"/></g>`
        : `<g class="arm" transform="rotate(-12 0 -222)"><rect x="-10" y="-232" width="20" height="104" rx="10" fill="${body}" stroke="${ink}" stroke-width="3"/></g>`}
      <g class="head"><circle cx="0" cy="-276" r="31" fill="${ink}"/>
        <path d="M-37 -282 C-37 -326 37 -326 37 -282 Z" fill="${BLANC}" stroke="${ink}" stroke-width="5"/>
        <path d="M-38 -282 H50" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <g class="mask"${o.mask ? "" : ' opacity="0"'}><path d="M-24 -270 L6 -266" stroke="${BLEU}" stroke-width="6" stroke-linecap="round"/>
          <path d="M4 -274 C16 -272 34 -270 44 -262 C44 -248 32 -238 18 -238 C8 -240 2 -250 4 -274 Z" fill="${BLANC}" stroke="${BLEU}" stroke-width="6" stroke-linejoin="round"/>
          <circle cx="28" cy="-254" r="5" fill="${BLEU}"/></g></g>`;
  }
  /** walking: legs swing in turn (finite repeat, seekable) */
  function walk(tl, g, t, d) {
    const reps = Math.max(1, Math.round(d / 0.28) - 1);
    tl.fromTo(g.querySelector(".leg1"), { rotation: -14 }, { rotation: 14, duration: 0.28, yoyo: true, repeat: reps, ease: "sine.inOut", transformOrigin: "50% 0%" }, t);
    tl.fromTo(g.querySelector(".leg2"), { rotation: 14 }, { rotation: -14, duration: 0.28, yoyo: true, repeat: reps, ease: "sine.inOut", transformOrigin: "50% 0%" }, t);
    tl.set([g.querySelector(".leg1"), g.querySelector(".leg2")], { rotation: 0 }, t + d);
  }

  /* Reading rules (see README): one idea per screen, at most 3 text blocks at once, every text stays fully
   * visible and still for max(2.5 s ; 0.5 s per word + 1 s) (icon label: 2 s), texts come one after the
   * other, and every scene ends on a fixed 0.5 s pause. Times below are computed from the texts themselves. */
  const { show, read, hide, PAUSE } = L;

  /* ========== 0. Opening: Dumez logo on white ========== */
  function S0(C, t) {
    const { W, H, tl } = C;
    const s = mkScene(C, "bg-white"); gsap.set(s, { autoAlpha: 1 });
    const { w: lw, h: lh } = C.logo;                                        // clear space: the whole white frame
    const lc = el("div", "abs", s, { left: (W - lw) / 2 + "px", top: (H - lh) / 2 + "px" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    tl.fromTo(lc, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE }, t + 0.05);
    return t + 2.0;
  }

  /* ========== 1. Hook: a light beam reveals the dust ========== */
  function S1(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s);
    abs(art, 0, 0);
    const lamp = [1600, 70];
    art.innerHTML = `<defs>
        <linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>
        <clipPath id="beamClip" clipPathUnits="userSpaceOnUse"><path class="beamC" d="M${lamp[0]} ${lamp[1]} L940 ${H} L1560 ${H} Z"/></clipPath></defs>
      <g stroke="${BLEU}" stroke-width="14" fill="none" stroke-linecap="round">
        <path d="M1040 1080 V420 M1170 1080 V420 M1300 1080 V420 M1430 1080 V420 M1040 420 H1430 M1040 600 H1430 M1040 780 H1430"/>
        <path d="M1700 1080 V150 M1740 1080 V150 M1700 200 L1740 250 L1700 300 L1740 350 L1700 400 L1740 450 L1700 500 L1740 550 L1700 600 L1740 650 L1700 700 L1740 750"/>
        <path d="M1420 170 H1920"/></g>
      <rect x="0" y="1030" width="${W}" height="60" fill="${BLEU}" opacity=".6"/>
      <g transform="translate(1250 1030)">${person({ body: BLEU, ink: BLANC })}</g>
      <rect x="1360" y="980" width="150" height="50" rx="4" fill="${BLEU}"/>
      <g class="beam"><path class="beamP" d="M${lamp[0]} ${lamp[1]} L940 ${H} L1560 ${H} Z" fill="url(#beamG)"/></g>
      <rect x="${lamp[0] - 46}" y="${lamp[1] - 30}" width="92" height="44" rx="10" fill="${BLANC}"/>
      <g class="motes" clip-path="url(#beamClip)"></g>`;
    const col = el("div", "abs", s, { left: C.PAD + "px", top: "300px", width: "900px" });
    const l1 = text(col, T.accroche_1, "t-big c-blanc", { maxW: 900 });
    const panel = el("div", "", col, { display: "inline-block", background: "var(--blanc)", borderRadius: "28px", padding: "22px 36px 28px", marginTop: "48px" });
    const l2 = text(panel, T.accroche_2, "t-big c-rouge", { maxW: 820 });
    fit(C, s);
    const r1 = read(tl, l1, t + 0.3);
    tl.fromTo(panel, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.25, ease: EASE }, r1 - 0.2);
    const r2 = read(tl, l2, r1 + 0.05);
    const end = r2 + PAUSE;
    // the beam slowly sweeps over the whole scene, revealing more particles (ambient, stops for the pause)
    const motes = art.querySelector(".motes");
    dust(tl, motes, 170, [800, 120, 1050, 960], t, end - PAUSE, { seed: 11, rmin: 2, rmax: 6, amp: 50 });
    tl.fromTo([art.querySelector(".beamP"), art.querySelector(".beamC")], { rotation: 10, svgOrigin: lamp.join(" ") }, { rotation: -8, svgOrigin: lamp.join(" "), duration: end - PAUSE - t, ease: "sine.inOut" }, t);
    tl.fromTo(art.querySelector(".beam"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, t + 0.1);
    tl.fromTo(motes, { opacity: 0 }, { opacity: 1, duration: 1.0 }, t + 0.3);
    return end;
  }

  /* ========== 2. Zones at risk: site plan, a round mask sign at each of the 3 entrances, a worker ========== */
  function S2(C, t) {
    const { W, T, tl } = C;
    const A = T.a_valider || {};
    const s = mkScene(C, "bg-white");
    const PX = C.PAD, PY = 30, PW = W - 2 * C.PAD, PH = 770;
    const plan = svg("svg", { width: PW, height: PH, viewBox: `0 0 ${PW} ${PH}` }, s); abs(plan, PX, PY);
    // top rooms, a wide corridor (the worker walks there), bottom rooms; each zone has its door on the corridor
    const CT = 240, CB = 530;
    const Z = [
      { id: "decoupe", x: 30, y: 30, w: 520, h: CT - 50, door: 260, top: true },
      { id: "poncage", x: 640, y: CB + 20, w: 470, h: PH - CB - 50, door: 840, top: false },
      { id: "demolition", x: 1180, y: 30, w: 520, h: CT - 50, door: 1420, top: true },
    ];
    let g = `<rect x="8" y="8" width="${PW - 16}" height="${PH - 16}" rx="14" fill="none" stroke="${BLEU}" stroke-width="14"/>
      <path d="M8 ${CT} H${PW - 8} M8 ${CB} H${PW - 8} M600 8 V${CT} M1140 8 V${CT} M600 ${CB} V${PH - 8} M1150 ${CB} V${PH - 8}" stroke="${BLEU}" stroke-width="8" opacity=".55"/>`;
    Z.forEach((z, i) => {
      const d = `M${z.x} ${z.y} H${z.x + z.w} V${z.y + z.h} H${z.x} Z`;
      const dy = z.top ? z.y + z.h : z.y;
      g += `<defs><mask id="zm${i}" maskUnits="userSpaceOnUse"><path class="zmp${i}" d="${d}" fill="none" stroke="#fff" stroke-width="40"/></mask></defs>
        <g class="zone${i}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" fill="${BLEU}" opacity=".06"/><g class="zd${i}"></g>
        <g mask="url(#zm${i})"><path d="${d}" fill="none" stroke="${FONCE}" stroke-width="22"/><path d="${d}" fill="none" stroke="${BLANC}" stroke-width="15"/>
        <path d="${d}" fill="none" stroke="${ROUGE}" stroke-width="15" stroke-dasharray="26 26"/></g>
        <rect x="${z.door - 50}" y="${dy - 14}" width="100" height="28" fill="${BLANC}"/></g>`;   // the door: a gap in the tape
    });
    plan.innerHTML = g + `<g class="wk"><g class="ws">${person({ body: BLEU, ink: FONCE, tool: false })}</g></g>`;
    // a real round sign at each entrance, fixed beside the door on the corridor side
    const SG = 140;
    const signs = Z.map((z) => {
      const cy = z.top ? CT + SG / 2 + 14 : CB - SG / 2 - 14;
      const d = el("div", "abs", s, { left: PX + z.door + 62 + "px", top: PY + cy - SG / 2 + "px" }); d.innerHTML = P.mandatory(SG);
      return d;
    });
    const loupe = el("div", "abs", s, { width: "230px", height: "230px", borderRadius: "50%", background: "var(--blanc)", border: "10px solid var(--bleu)", display: "flex", alignItems: "center", justifyContent: "center" });
    loupe.innerHTML = P.icon("ajuster", 170, BLEU, ROUGE);
    const msg = text(s, A.zones_message, "t-big c-bleu center", { maxW: W - 2 * C.PAD });
    abs(msg, 0, PY + PH + 26, { width: W + "px" });
    fit(C, s);

    tl.fromTo(plan, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, t + 0.1);
    Z.forEach((z, i) => {
      const at = t + 0.3 + i * 0.4, Lz = 2 * (z.w + z.h);
      tl.fromTo(plan.querySelector(`.zmp${i}`), { strokeDasharray: Lz, strokeDashoffset: Lz }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, at);
      tl.fromTo(plan.querySelector(`.zd${i}`), { opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 0.2);
      pop(tl, signs[i], at + 0.4, { from: 0.3 });
    });
    // the worker (same silhouette as in the hook) walks, stops at the sign, puts the mask on, goes in
    const wk = plan.querySelector(".wk"), ws = wk.querySelector(".ws"), mask = wk.querySelector(".mask");
    const zt = Z[1], FEET = CB - 14, SC = 0.8, stopX = zt.door - 80;
    gsap.set(ws, { scale: SC, transformOrigin: "50% 100%" });
    tl.set(wk, { x: 690, y: FEET }, t);
    tl.fromTo(wk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 1.0);
    const w0 = t + 1.1, w1 = t + 3.9;                     // slow walk: about 0.27 px per frame... 2.8 s for a short way
    tl.fromTo(wk, { x: 600 }, { x: stopX, duration: w1 - w0, ease: "power1.inOut" }, w0);
    walk(tl, plan, w0, w1 - w0);
    const mk = w1 + 0.25;
    tl.fromTo(mask, { opacity: 0, scale: 0.4, transformOrigin: "30% 50%" }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, mk);
    const hx = PX + stopX - 290, hy = PY + FEET - 330 * SC - 60;
    abs(loupe, hx, hy);
    tl.fromTo(loupe, { autoAlpha: 0, scale: 0.5, transformOrigin: "100% 60%" }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, mk + 0.1);
    const r = read(tl, msg, mk + 0.2, { hold: 3 });       // "Zone balisée = masque avant d'entrer."
    tl.to(loupe, { autoAlpha: 0, duration: 0.3 }, mk + 1.9);
    tl.to(wk, { x: zt.door, duration: 0.6, ease: "power1.inOut" }, mk + 2.0);
    walk(tl, plan, mk + 2.0, 0.6);
    tl.to(wk, { y: zt.y + zt.h - 10, duration: 1.0, ease: "power1.inOut" }, mk + 2.6);
    const end = r + PAUSE;
    Z.forEach((z, i) => dust(tl, plan.querySelector(`.zd${i}`), 46, [z.x + 20, z.y + 20, z.w - 40, z.h - 40], t + 0.5, end - PAUSE, { seed: 30 + i, color: BLEU, rmin: 2.5, rmax: 6, omin: 0.25, omax: 0.6, amp: 26 }));
    return end;
  }

  /* ========== 3. What raises dust: heading from the start, 6 cards whose labels all stay ========== */
  function S3(C, t) {
    const { W, T, tl, cfg } = C;
    const s = mkScene(C, "bg-dark");
    const X0 = C.PAD, X1 = W - C.PAD, Y0 = 150, Y1 = 900, GAP = 24, COLS = 3;
    const cw = (X1 - X0 - (COLS - 1) * GAP) / COLS, chh = (Y1 - Y0 - GAP) / 2;
    const m1 = text(s, T.taches_message, "t-h1 c-blanc", { maxW: W - 2 * C.PAD, title: true }); abs(m1, C.PAD, 30);
    const cards = T.taches.map((tk, k) => {
      const c = el("div", "card", s, { left: X0 + (k % COLS) * (cw + GAP) + "px", top: Y0 + Math.floor(k / COLS) * (chh + GAP) + "px", width: cw + "px", height: chh + "px", borderRadius: "34px", padding: "24px 24px", display: "flex", alignItems: "center", gap: "26px" });
      const ib = el("div", "", c, { flex: "none" }); hexBadge(ib, 170, BLANC, P.inHex(tk.id, 170, BLEU, ROUGE, 0.66));
      const nm = text(c, tk.nom, "t-body c-blanc", { maxW: cw - 48 - 170 - 26, label: true, style: { fontWeight: 800 } });
      return { c, ib, nm };
    });
    const am = cfg.show_amiante_note ? text(s, T.amiante_note, "t-body c-blanc", { maxW: W - 2 * C.PAD }) : null;
    if (am) abs(am, C.PAD, 930, { fontWeight: 800 });
    fit(C, s);
    cards.forEach((o) => { if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`); });

    show(tl, m1, t + 0.1);                                  // the heading is there from the start of the scene
    const ON = `0 0 0 7px ${C.cfg.palette.blanc}`, OFF = "0 0 0 0px rgba(255,255,255,0)";
    let c = t + 0.15;
    cards.forEach((o, k) => {
      const at = k ? c - 0.15 : c;                          // the next card comes as soon as the label has been read
      cardIn(tl, o.c, at);
      pop(tl, o.ib, at + 0.05, { from: 0.5, d: 0.3 });
      // the active card is highlighted; the others keep their label, just without the outline
      tl.fromTo(o.c, { boxShadow: OFF }, { boxShadow: ON, duration: 0.2 }, at);
      if (k) tl.to(cards[k - 1].c, { boxShadow: OFF, duration: 0.2 }, at);
      c = read(tl, o.nm, at + 0.15);
    });
    tl.to(cards[cards.length - 1].c, { boxShadow: OFF, duration: 0.2 }, c);
    let r = c;
    if (am) r = read(tl, am, c);                            // "Amiante : voir le responsable."
    const end = r + PAUSE;
    cards.forEach((o) => tl.fromTo(o.ib.querySelectorAll("circle"), { y: 0 }, { y: -5, duration: 0.5, yoyo: true, repeat: Math.max(1, Math.floor((end - PAUSE - t - 1) / 0.5) - 1), ease: "sine.inOut", stagger: 0.07 }, t + 0.6));
    return end;
  }

  /* ========== 4. Silica: one sentence, and the particle going down into the lungs ========== */
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
    const st = text(s, A.silice, "t-big c-blanc", { maxW: 930 });
    const vl = cfg.show_vlep ? text(s, T.vlep, "t-body c-blanc", { maxW: 930, style: { fontWeight: 650 } }) : null;
    const art = svg("svg", { width: 870, height: 928, viewBox: "0 0 900 960" }, s); abs(art, 1030, 110);
    art.innerHTML = `<g class="draw" stroke="${BLANC}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M560 330 C580 230 600 80 450 40 C350 15 280 80 290 150 L262 200 L292 214 L300 240 L294 262 L312 272 C304 302 330 326 372 328 L400 360"/>
        <path d="M300 214 C340 214 372 226 392 262 C410 296 420 330 420 380"/></g>
      <g transform="translate(100 350)">${lungsSVG({ stroke: BLANC, fill: BLANC, op: 0.08 })}</g>
      <path class="route" d="M60 200 C150 196 230 205 300 214 C340 214 372 226 392 262 C410 296 420 330 420 380 L420 510 L470 570 L500 650 L530 710" fill="none" stroke="none"/>
      <g class="pt"><circle r="16" fill="${BLANC}" opacity=".25"/><circle r="8" fill="${BLANC}"/></g>
      <g class="bub" transform="translate(720 770)"><circle r="150" fill="${BLANC}"/>
        <g stroke="${BLEU}" stroke-width="7" fill="none"><circle cx="-50" cy="-30" r="44"/><circle cx="34" cy="-48" r="40"/><circle cx="-12" cy="40" r="46"/><circle cx="66" cy="30" r="38"/><path d="M-120 -120 L-70 -64"/></g>
        <circle cx="-12" cy="40" r="11" fill="${ROUGE}"/></g>
      <path class="lead" d="M540 720 L590 740" stroke="${BLANC}" stroke-width="5" stroke-dasharray="10 10"/>`;
    fit(C, s);
    abs(st, C.PAD, (H - st.offsetHeight) / 2 - (vl ? 80 : 0));
    if (vl) abs(vl, C.PAD, st.offsetTop + st.offsetHeight + 50);
    const draw = [...art.querySelectorAll(".draw path"), ...art.querySelectorAll("g[transform] path, g[transform] g path")].filter((p) => !p.closest(".bub"));
    const route = art.querySelector(".route"), pt = art.querySelector(".pt"), bub = art.querySelector(".bub"), lead = art.querySelector(".lead");
    draw.forEach((p) => { const Lp = p.getTotalLength(); tl.fromTo(p, { strokeDasharray: Lp, strokeDashoffset: Lp }, { strokeDashoffset: 0, duration: 1.0, ease: "power1.inOut" }, t + 0.2); });
    let r = read(tl, st, t + 0.5);                       // the only sentence of the scene
    if (vl) r = read(tl, vl, r);
    tl.fromTo(pt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 1.1);
    alongPath(tl, pt, route, t + 1.2, 3.2);
    tl.fromTo(lead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, t + 4.3);
    tl.fromTo(bub, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, t + 4.4);
    return Math.max(r, t + 5.4) + PAUSE;
  }

  /* ========== 5. Consequences: three steps (cross-faded), spots growing step by step, then the strong message ========== */
  function S5(C, t) {
    const { W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const art = svg("svg", { width: 860, height: 806, viewBox: "0 0 640 600" }, s); abs(art, -20, 150);
    // spots: a few small ones (cough), more (silicosis), the most and the biggest (cancer)
    const r = rng(5), SETS = [{ n: 3, r: [9, 14] }, { n: 7, r: [15, 25] }, { n: 10, r: [24, 40] }];
    const spotSets = SETS.map((st) => Array.from({ length: st.n }, (_, i) => {
      const left = (i + st.n) % 2 === 0, x = left ? 175 + r() * 115 : 365 + r() * 115, y = 190 + r() * 320;
      return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(st.r[0] + r() * (st.r[1] - st.r[0])).toFixed(0)}" fill="${ROUGE}"/>`;
    }).join(""));
    art.innerHTML = `<defs><clipPath id="lungClip"><path d="M300 120 C250 110 205 150 180 220 C150 300 130 400 140 480 C150 540 200 560 250 540 C290 524 300 490 300 440 Z"/>
        <path d="M340 120 C390 110 435 150 460 220 C490 300 510 400 500 480 C490 540 440 560 390 540 C350 524 340 490 340 440 Z"/></clipPath></defs>
      ${lungsSVG({})}<g clip-path="url(#lungClip)" opacity=".9">${spotSets.map((h, k) => `<g class="set${k}">${h}</g>`).join("")}</g>`;
    const RX = 840, RW = W - RX - C.PAD;
    const dg = el("div", "abs", s, { left: RX + "px", top: "150px" }); dg.innerHTML = P.danger(150);
    // the steps pile up under each other: each one stays while the next comes (no gap, no overlap)
    const list = el("div", "abs", s, { left: RX + "px", top: "330px", width: RW + "px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "44px" });
    const steps = T.etapes.map((e, k) => {
      const last = k === T.etapes.length - 1;
      const box = el("div", last ? "band" : "", list, { display: "inline-block" });
      const tx = text(box, e, "t-big " + (last ? "" : "c-fonce"), { maxW: RW - (last ? 80 : 0) });
      return { box, tx };
    });
    // the strong message comes in with a red hexagon growing from the centre (same shape as the transitions)
    const R = (Math.hypot(W, H) / 2) / (Math.sqrt(3) / 2) * 1.06;
    const big = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(big, 0, 0);
    big.innerHTML = `<g transform="translate(${W / 2} ${H / 2})"><g class="bg"><path d="${hexD(0, 0, R, 0.04)}" fill="${ROUGE}"/></g></g>`;
    const mf = text(s, T.message_fort, "t-big c-blanc center", { maxW: W - 2 * C.PAD });
    fit(C, s);
    abs(mf, 0, (H - mf.offsetHeight) / 2, { width: W + "px" });
    gsap.set(steps.map((o) => o.box), { autoAlpha: 0 });
    gsap.set(big, { autoAlpha: 0 }); gsap.set(big.querySelector(".bg"), { scale: 0, transformOrigin: "50% 50%" });

    tl.fromTo(art, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: EASE }, t + 0.1);
    tl.fromTo(dg, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2)", transformOrigin: "50% 60%" }, t + 0.1);
    let c = t + 0.3;
    steps.forEach((o, k) => {
      tl.fromTo(o.box, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, c);
      [...art.querySelectorAll(`.set${k} circle`)].forEach((sp, i) => tl.fromTo(sp, { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }, c + 0.1 + i * 0.18));
      c = c + 0.3 + Math.max(3, L.need(L.plain(o.tx)));     // each step held at least 3 s
    });
    tl.set(big, { autoAlpha: 1 }, c);
    tl.to(big.querySelector(".bg"), { scale: 1, duration: 0.3, ease: "power2.in" }, c);
    tl.to(list, { autoAlpha: 0, duration: 0.3 }, c);   // the steps leave under the red
    const rf = read(tl, mf, c + 0.3, { hold: 3 });
    return rf + PAUSE;
  }

  /* ========== 6. First, reduce the dust at the source: three cards, then the band replaces them ========== */
  function S6(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const Y0 = 150, GAP = 30, cw = (W - 2 * C.PAD - 2 * GAP) / 3, chh = 700;
    const grid = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px" });
    const cards = T.source_cartes.map((sc, i) => {
      const c = el("div", "card", grid, { left: C.PAD + i * (cw + GAP) + "px", top: Y0 + "px", width: cw + "px", height: chh + "px", borderRadius: "40px", padding: "50px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" });
      const ib = el("div", "", c); hexBadge(ib, 270, BLANC, P.inHex(sc.id, 270, BLEU, BLEU, 0.62));
      const tx = text(c, sc.texte, "t-big c-blanc center", { maxW: cw - 48, style: { marginTop: "40px" } });
      return { c, ib, tx };
    });
    // the band, alone on screen once the cards have gone, with the mask sign above it
    const fin = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "50px" });
    const sg = el("div", "", fin); sg.innerHTML = P.mandatory(260);
    const band = el("div", "", fin, { background: "var(--blanc)", borderRadius: "34px", padding: "24px 70px 32px" });
    const bt = text(band, T.source_message, "t-big c-bleu center", { maxW: W - 2 * C.PAD - 140, style: { fontSize: "92px" } });
    fit(C, s);
    gsap.set(fin, { autoAlpha: 0 });
    cards.forEach((o) => { if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`); });

    let c = t + 0.15;
    cards.forEach((o, i) => {
      const at = i ? c - 0.25 : c;
      cardIn(tl, o.c, at);
      pop(tl, o.ib, at + 0.05, { from: 0.5, d: 0.35 });
      c = read(tl, o.tx, at + 0.25);
    });
    // clean change of screen: the three cards leave together, then the band comes alone (no greyed cards)
    tl.to(grid, { autoAlpha: 0, y: -40, duration: 0.35, ease: "power2.in" }, c);
    tl.fromTo(fin, { autoAlpha: 0, scale: 0.97, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" }, c + 0.35);
    const rb = c + 0.65 + Math.max(3, L.need(L.plain(bt)));
    const end = rb + PAUSE;
    const amb = (sel, vars) => tl.fromTo(sel, vars[0], { ...vars[1], repeat: Math.max(1, Math.floor((c - t - 1.2) / vars[1].duration) - 1) }, t + 0.8);
    amb(cards[0].ib.querySelectorAll("svg > g > g[fill] path"), [{ y: -6 }, { y: 6, duration: 0.35, yoyo: true, ease: "sine.inOut", stagger: 0.12 }]);
    amb(cards[1].ib.querySelectorAll("svg > g > g:last-child path"), [{ x: 10, opacity: 1 }, { x: -12, opacity: 0.2, duration: 0.5, ease: "power1.in", stagger: 0.1 }]);
    tl.fromTo(cards[2].ib.querySelector("svg > g > g"), { rotation: 0 }, { rotation: 360, transformOrigin: "50% 50%", duration: 1.6, ease: "power2.inOut" }, t + 0.8);
    return end;
  }

  /* ========== 7. The right mask, worn properly: five cards, then "À retenir" ========== */
  function S7(C, t) {
    const { W, H, T, tl } = C;
    const A = T.a_valider || {};
    const s = mkScene(C, "bg-white");
    const cx = C.PAD, cy = 100, cw = W - 2 * C.PAD, ch = 800;
    const prog = el("div", "abs", s, { left: 0, width: W + "px", top: cy + ch + 40 + "px", display: "flex", justifyContent: "center", gap: "22px" });
    const N = T.masque_cartes.length;
    const dots = Array.from({ length: N + 1 }, () => { const d = el("div", "", prog); hexBadge(d, 40, BLEU); gsap.set(d, { opacity: 0.25 }); return d; });
    const BIG = { ajuster: "ajuster", avant: "avant", accessoires: "combinaison", hygiene: "hygiene" };
    const TX = 620, TW = cw - TX - 70;
    const sub = (str) => String(str || "").replace("{a_valider.choix}", A.choix || "").replace(/\{niveau\}/g, level(C, null));
    const cards = T.masque_cartes.map((mc, i) => {
      const c = el("div", "card", s, { left: cx + "px", top: cy + "px", width: cw + "px", height: ch + "px", borderRadius: "44px" });
      const nb = el("div", "num", c, { left: "40px", top: "36px" });
      hexBadge(nb, 96, BLANC, `<text x="48" y="74" text-anchor="middle" font-family="Inter" font-weight="900" font-size="54" fill="${BLEU}">${i + 1}</text>`);
      const pic = el("div", "abs", c, { left: "110px", top: (ch - 462) / 2 + "px" });
      const pw = 400;
      hexBadge(pic, pw, BLANC, mc.id === "choisir" ? `<g transform="translate(${pw * 0.14} ${pw * 0.217}) scale(${pw * 0.0036})">${P.mandatory(200).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`
        : P.inHex(BIG[mc.id], pw, BLEU, ROUGE, 0.58));
      let extra = null;
      if (mc.id === "accessoires") { extra = el("div", "abs", pic, { right: "-30px", bottom: "0px" }); hexBadge(extra, 180, BLANC, P.inHex("lunettes", 180, BLEU, BLEU, 0.64), BLEU); }
      const col = el("div", "abs", c, { left: TX + "px", width: TW + "px", top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" });
      const g = "m" + i;                                   // title + line are read together (one block)
      const tt = mc.titre ? text(col, sub(mc.titre), "t-big c-blanc", { maxW: TW, group: g }) : null;
      const ln = mc.ligne ? text(col, sub(mc.ligne), "t-body c-blanc", { maxW: TW, group: g, style: { marginTop: "36px", fontWeight: 700 } }) : null;
      gsap.set(c, { autoAlpha: 0 });
      return { c, nb, pic, extra, parts: [tt, ln].filter(Boolean) };
    });
    // "À retenir": heading + first point read together, then the two other points
    const rc = el("div", "card", s, { left: cx + "px", top: cy + "px", width: cw + "px", height: ch + "px", borderRadius: "44px", padding: "70px 120px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "40px" });
    const rh = text(rc, T.retenir_titre, "t-h1 c-blanc", { maxW: cw - 240, group: "ret" });
    const pts = T.retenir.map((p, k) => {
      const row = el("div", "", rc, { display: "flex", alignItems: "center", gap: "34px" });
      const b = el("div", "", row, { flex: "none" }); hexBadge(b, 96, BLANC, P.inHex("check", 96, BLEU, BLEU, 0.7));
      return { row, b, tx: text(row, p, "t-big c-blanc", { maxW: cw - 240 - 130, group: k ? null : "ret" }) };
    });
    gsap.set(rc, { autoAlpha: 0 });
    fit(C, s);
    cards.forEach((o) => { const col = o.parts[0].parentNode; if (col.scrollHeight > ch + 1) L.report("débordement", o.c, `carte : ${col.scrollHeight} px > ${ch} px`); });

    let c = t + 0.2;
    const allCards = [...cards.map((o) => o.c), rc];
    cards.forEach((o, i) => {
      if (i) tl.to(cards[i - 1].c, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, c);
      const at = c + (i ? 0.1 : 0);
      cardIn(tl, o.c, at);
      tl.to(dots[i], { opacity: 1, duration: 0.3 }, at);
      if (i) tl.to(dots[i - 1], { opacity: 0.55, duration: 0.3 }, at);
      pop(tl, o.nb, at + 0.2, { from: 0.4, d: 0.35 });
      pop(tl, o.pic, at + 0.15, { from: 0.7, d: 0.4 });
      if (o.extra) pop(tl, o.extra, at + 0.3, { from: 0.3, d: 0.35 });
      const fulls = o.parts.map((p) => show(tl, p, at + 0.3));
      const words = o.parts.map(L.plain).join(" ");
      c = Math.max(...fulls) + Math.max(4.5, L.need(words));   // 4.5 s per card, more if the text asks for it
    });
    tl.to(cards[N - 1].c, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, c);
    cardIn(tl, rc, c + 0.2);
    tl.to(dots[N], { opacity: 1, duration: 0.3 }, c + 0.2); tl.to(dots[N - 1], { opacity: 0.55, duration: 0.3 }, c + 0.2);
    pop(tl, pts[0].b, c + 0.55, { from: 0.4, d: 0.3 });
    const f0 = Math.max(show(tl, rh, c + 0.6), show(tl, pts[0].tx, c + 0.6));
    c = f0 + Math.max(2.5, L.need(L.plain(rh) + " " + L.plain(pts[0].tx)));
    pts.slice(1).forEach((p) => { pop(tl, p.b, c - 0.05, { from: 0.4, d: 0.3 }); c = read(tl, p.tx, c, { hold: 2.5 }); });
    void allCards;
    // the card and the page dots leave together, in a fade, while the next transition starts
    tl.to([rc, prog], { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, c + PAUSE);
    return c + PAUSE;
  }

  /* ========== 8. Final message + logo, centred ========== */
  function S8(C, t) {
    const { W, H, T, tl } = C;
    const s = mkScene(C, "bg-white");
    const SG = 440, GAPX = 90, TW = 1000;
    const grp = el("div", "abs", s, { left: 0, top: 0, width: W + "px" });
    const row = el("div", "", grp, { display: "flex", alignItems: "center", justifyContent: "center", gap: GAPX + "px" });
    const sign = el("div", "", row, { flex: "none" }); sign.innerHTML = P.mandatory(SG);
    const col = el("div", "", row, { width: TW + "px" });
    const f1 = text(col, T.final_1, "t-big c-bleu", { maxW: TW, style: { fontSize: "100px" } });
    const f2 = text(col, T.final_2, "t-big c-rouge", { maxW: TW, style: { fontSize: "100px", marginTop: "50px" } });
    const { w: lw, h: lh } = C.logo;                          // already capped at 1.3x its file size
    const pad = Math.max(40, Math.round(lh * 0.42));
    const logos = el("div", "", grp, { display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", marginTop: "40px" });
    const lc = el("div", "", logos, { padding: pad + "px", background: "var(--blanc)" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    if (C.logoChantier) { const cc = el("div", "", logos, { padding: pad + "px" }); const i2 = el("img", "", cc); i2.src = C.logoChantier.src; i2.width = C.logoChantier.w; i2.height = C.logoChantier.h; }
    fit(C, s);
    grp.style.top = Math.round((H - grp.offsetHeight) / 2) + "px";   // centred both ways
    pop(tl, sign, t + 0.1, { from: 0.4, d: 0.5 });
    fadeUp(tl, logos, t + 0.3, { y: 24 });
    const r1 = read(tl, f1, t + 0.35);
    const r2 = read(tl, f2, r1);
    return r2 + PAUSE;
  }

  /* ========== 9. Closing: dust particles draw the logo's own hexagon, then the logo appears on it ========== */
  function S9(C, t) {
    const { W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const blue = cfg.palette.bleu, red = cfg.palette.rouge;
    const { w: lw, h: lh } = C.logo;
    const lx = Math.round((W - lw) / 2), ly = Math.round(H * 0.38);
    // the logo, on white, with its clear space; never scaled beyond the cap (C.logo is already capped)
    const lc = el("div", "abs", s, { left: lx + "px", top: ly + "px", width: lw + "px", height: lh + "px" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const txt = text(s, T.fin_texte, "t-big c-bleu center", { maxW: W - 2 * C.PAD });
    abs(txt, 0, ly + lh + Math.max(70, Math.round(lh * 0.7)), { width: W + "px" });
    let credit = null;
    if (cfg.show_synapsis_credit) {
      credit = el("div", "abs", s, { left: 0, width: W + "px", bottom: "50px", display: "flex", justifyContent: "center", alignItems: "center", gap: "22px" });
      const ci = el("img", "", credit, { height: "56px" }); ci.src = "../" + cfg.logos.synapsis;
      text(credit, T.credit, "t-small c-fonce", { style: { fontWeight: 650, opacity: 0.8 } });
    }
    fit(C, s);

    // where the hexagon is in the logo file (measured from its pixels, see main.js), in screen pixels
    const k = C.logo.scale || 1, hx = C.logo.hex || { x0: 0, x1: 108, y0: 0, y1: 120, gap0: 74, gap1: 87 };
    const cx = lx + ((hx.x0 + hx.x1) / 2) * k, cy = ly + ((hx.y0 + hx.y1) / 2) * k;
    const R = Math.max(((hx.x1 - hx.x0) * k) / Math.sqrt(3), ((hx.y1 - hx.y0) * k) / 2);
    const g0 = ly + hx.gap0 * k, g1 = ly + hx.gap1 * k;     // the white gap between the blue top and the red bottom
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(art, 0, 0);
    const d = hexD(cx, cy, R, 0.1);
    art.innerHTML = `<defs><clipPath id="hexTop" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="${g0.toFixed(1)}"/></clipPath>
        <clipPath id="hexBot" clipPathUnits="userSpaceOnUse"><rect x="0" y="${g1.toFixed(1)}" width="${W}" height="${(H - g1).toFixed(1)}"/></clipPath></defs>
      <g class="parts"></g>
      <g class="hex"><path class="ft" d="${d}" fill="${blue}" clip-path="url(#hexTop)"/><path class="fb" d="${d}" fill="${blue}" clip-path="url(#hexBot)"/>
        <path class="ol" d="${d}" fill="none" stroke="${blue}" stroke-width="6" stroke-linejoin="round"/></g>`;
    const hex = art.querySelector(".hex"), ol = art.querySelector(".ol"), ft = art.querySelector(".ft"), fb = art.querySelector(".fb");
    const parts = art.querySelector(".parts");
    gsap.set([ft, fb], { opacity: 0 }); gsap.set(lc, { autoAlpha: 0 });
    const Lo = ol.getTotalLength();

    // 1. big, opaque dust particles (Dumez blue and red) converge onto the outline of the logo's hexagon
    const rr = rng(99), NP = 70;
    for (let i = 0; i < NP; i++) {
      const p = ol.getPointAtLength((Lo * i) / NP);
      const c = svg("circle", { cx: 0, cy: 0, r: (6 + rr() * 5).toFixed(1), fill: i % 3 === 0 ? red : blue }, parts);
      const sx = cx + (rr() - 0.5) * W * 0.9, sy = cy + (rr() - 0.5) * H * 0.9;
      const at = t + 0.1 + rr() * 0.3;
      tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.25 }, at);   // fully opaque almost at once
      tl.fromTo(c, { x: sx, y: sy }, { x: p.x, y: p.y, duration: 0.9, ease: "power3.inOut" }, at);
    }
    // 2. the outline is drawn in blue, the hexagon fills, and its bottom turns red as in the logo
    tl.fromTo(ol, { strokeDasharray: Lo, strokeDashoffset: Lo }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, t + 1.05);
    tl.to(parts, { opacity: 0, duration: 0.3 }, t + 1.35);
    tl.to([ft, fb], { opacity: 1, duration: 0.3 }, t + 1.5);
    tl.to(ol, { opacity: 0, duration: 0.2 }, t + 1.7);
    tl.fromTo(fb, { attr: { fill: blue } }, { attr: { fill: red }, duration: 0.3, ease: "none" }, t + 1.8);
    // 3. the logo fades in exactly on that hexagon (same size, same place: no jump), then the drawing goes
    tl.fromTo(lc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power1.out" }, t + 2.15);
    tl.to(hex, { opacity: 0, duration: 0.25 }, t + 2.6);
    const rt = read(tl, txt, t + 2.7);                   // "Protégez vos poumons."
    if (credit) fadeUp(tl, credit, rt, { y: 16 });
    const end = (credit ? read(tl, credit.querySelector(".tx"), rt) : rt) + 1.0;   // then hold the last image 1 s
    tl.to({}, { duration: 0.01 }, end - 0.01);
    return end;
  }

  window.SCENES = { S0, S1, S2, S3, S4, S5, S6, S7, S8, S9 };
})();
