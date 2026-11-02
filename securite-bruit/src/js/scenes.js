/* The six scenes. Each builder adds its DOM to the stage and its tweens to the shared timeline,
 * starting at `t`, and returns the time at which the next hexagon wipe should start.
 * C = { tl, stage, T (texts), cfg, V (vertical?), W, H, PAD, logo }. */
(function () {
  const { el, svg, box, text, linesIn, linesOut, pop, fadeUp, hexBadge, hexD, pulse, EASE } = L;
  const BLEU = "var(--bleu)", FONCE = "var(--fonce)", ROUGE = "var(--rouge)", BLANC = "var(--blanc)";

  function mkScene(C, cls) {
    const s = el("div", "scene " + cls, C.stage);
    gsap.set(s, { autoAlpha: 0 });
    return s;
  }
  const fit = (C, root) => L.fitAll(root, C.V ? 64 : 48);

  /* ---------- shared drawings (SVG strings, side view, feet at 0,0, facing right) ---------- */
  function person(o = {}) {
    const body = o.body || BLEU, ink = o.ink || FONCE;
    const arm = o.arm === "tool"
      ? `<g class="arm" transform="rotate(-62 0 -222)"><rect x="-10" y="-232" width="20" height="96" rx="10" fill="${body}" stroke="${ink}" stroke-width="3"/></g>`
      : `<g class="arm"><rect x="-10" y="-232" width="20" height="100" rx="10" fill="${body}" stroke="${ink}" stroke-width="3"/>${o.paddle ? `<rect x="-4" y="-140" width="8" height="40" fill="${ink}"/><circle cx="0" cy="-84" r="30" fill="${ROUGE}" stroke="${BLANC}" stroke-width="7"/>` : ""}</g>`;
    return `<g class="legs"><rect x="-26" y="-125" width="19" height="125" rx="9" fill="${ink}"/><rect x="7" y="-125" width="19" height="125" rx="9" fill="${ink}"/></g>
      <rect x="-37" y="-242" width="74" height="132" rx="27" fill="${body}"/>
      <rect x="-37" y="-196" width="74" height="12" fill="${BLANC}"/><rect x="-37" y="-166" width="74" height="12" fill="${BLANC}"/>
      ${o.tool ? `<g class="tool" fill="${ink}"><rect x="62" y="-176" width="16" height="150" rx="4"/><rect x="40" y="-186" width="60" height="16" rx="8"/><path d="M64 -26 H76 L70 0 Z"/></g>` : ""}
      ${arm}
      <g class="head"><circle cx="0" cy="-276" r="31" fill="${ink}"/>
        <path d="M-37 -282 C-37 -326 37 -326 37 -282 Z" fill="${BLANC}" stroke="${ink}" stroke-width="5"/>
        <path d="M-38 -282 H50" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <g class="muffs" style="${o.muffs ? "" : "visibility:hidden"}"><path d="M0 -300 V-286" stroke="${BLEU}" stroke-width="8"/><rect x="-14" y="-292" width="28" height="40" rx="11" fill="${BLANC}" stroke="${BLEU}" stroke-width="6"/></g>
      </g>`;
  }
  function machine(o = {}) {    // compact dumper: rear at x=0 (left), front to the right
    return `<g fill="${BLEU}">
        <rect x="0" y="-116" width="330" height="66" rx="14"/>
        <rect x="176" y="-240" width="132" height="128" rx="16"/>
        <path d="M330 -112 L420 -150 L428 -70 L330 -60 Z"/>
      </g>
      <rect x="196" y="-224" width="92" height="64" rx="9" fill="${BLANC}" opacity=".92"/>
      <rect x="-8" y="-104" width="14" height="32" rx="4" fill="${ROUGE}"/>
      <g fill="${FONCE}"><circle cx="78" cy="-46" r="46"/><circle cx="258" cy="-46" r="46"/></g>
      <g fill="${BLANC}"><circle cx="78" cy="-46" r="15"/><circle cx="258" cy="-46" r="15"/></g>
      ${o.gyro ? `<g class="gyro"><rect x="228" y="-268" width="30" height="30" rx="10" fill="${ROUGE}"/>
         <g class="rays" stroke="${ROUGE}" stroke-width="9" stroke-linecap="round"><path d="M243 -290 V-318"/><path d="M220 -278 L198 -296"/><path d="M266 -278 L288 -296"/></g></g>` : ""}`;
  }
  /** expanding sound rings (finite set, so the timeline stays seekable) */
  function rings(tl, parent, cx, cy, t, until, o = {}) {
    const period = o.period || 0.32, life = o.life || 1.2;
    for (let i = 0, tt = t; tt < until; i++, tt += period) {
      const k = (tt - t) / Math.max(0.01, until - t);           // 0 → 1: noise grows
      const red = o.red && k > 0.35 && i % 2;
      const c = svg("circle", { cx, cy, r: o.r || 34, fill: "none", stroke: red ? ROUGE : (o.color || BLANC), "stroke-width": (o.w || 7) * (1 + k) }, parent);
      tl.fromTo(c, { scale: 0.4, opacity: 0.95, transformOrigin: "50% 50%" },
        { scale: (o.max || 4) * (0.7 + 0.6 * k), opacity: 0, duration: life, ease: "power1.out" }, tt);
    }
  }
  /** arcs ")))" pointing left (machine reversing alarm) */
  function beeps(tl, parent, x, y, t, until, o = {}) {
    const period = o.period || 0.42;
    for (let tt = t; tt < until; tt += period) {
      const a = svg("path", { d: `M${x} ${y - 34} A44 44 0 0 0 ${x} ${y + 34}`, fill: "none", stroke: o.color || BLEU, "stroke-width": 8, "stroke-linecap": "round" }, parent);
      tl.fromTo(a, { x: 0, opacity: 1 }, { x: -(o.reach || 160), opacity: 0, duration: o.life || 0.9, ease: "none" }, tt);
    }
  }
  const tagFor = (C, id, fallback) => {
    const s = (C.cfg.sources_bruit || []).find((e) => e.id === id && e.niveau && e.source);
    return s ? { label: s.niveau, src: s.source } : { label: fallback };
  };

  /* ========== 0. Opening: company logo on a white card ========== */
  function S0(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark"); gsap.set(s, { autoAlpha: 1 });
    const { w: lw, h: lh } = C.logo;
    const pad = Math.max(48, Math.round(lh * 0.42));          // clear space ≥ height of the "H" of DUMEZ
    const cw = lw + 2 * pad, ch = lh + 2 * pad;
    const cy = V ? 700 : 400;
    const card = box(s, (W - cw) / 2, cy - ch / 2, cw, ch, "logo-card");
    const img = el("img", "", card); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const ttl = text(s, T.titre, "t-h1 c-blanc center", { maxW: W - 2 * C.PAD });
    Object.assign(ttl.style, { position: "absolute", left: 0, width: W + "px", top: cy + ch / 2 + (V ? 110 : 70) + "px" });
    const sub = text(s, T.sous_titre, "t-body center", { maxW: W - 2 * C.PAD });
    fit(C, s);
    Object.assign(sub.style, { position: "absolute", left: 0, width: W + "px", top: ttl.offsetTop + ttl.offsetHeight + (V ? 30 : 18) + "px", color: "var(--blanc)", opacity: 0.85, fontWeight: 650 });
    tl.fromTo(card, { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: EASE }, t + 0.05);
    linesIn(tl, ttl, t + 0.45);
    linesIn(tl, sub, t + 0.8);
    return t + 2.0;
  }

  /* ========== 1. Hook: noisy site, growing sound waves ========== */
  function S1(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const vb = V ? [100, 0, 800, 700] : [0, 0, 1000, 700];
    const aw = V ? 1080 : 1060, k = aw / vb[2], ah = vb[3] * k;
    const ax = V ? 0 : W - aw - 20, ay = H - ah;
    const map = (x, y) => [ax + (x - vb[0]) * k, ay + (y - vb[1]) * k];
    const art = svg("svg", { width: aw, height: ah, viewBox: vb.join(" ") }, s);
    Object.assign(art.style, { position: "absolute", left: ax + "px", top: ay + "px" });
    const g = svg("g", {}, art);
    g.innerHTML = `
      <rect x="-60" y="640" width="1120" height="90" fill="${BLEU}" opacity=".6"/>
      <g stroke="${BLEU}" stroke-width="13" fill="none" stroke-linecap="round">
        <path d="M80 640 V250 M190 640 V250 M300 640 V250 M410 640 V250 M80 250 H410 M80 380 H410 M80 510 H410"/>
        <path d="M560 640 V70 M606 640 V70 M560 120 L606 170 L560 220 L606 270 L560 320 L606 370 L560 420 L606 470 L560 520 L606 570"/>
        <path d="M240 96 H980 M300 60 H900 M583 40 L300 60 M583 40 L900 60"/><path d="M850 100 V330"/>
      </g>
      <rect x="236" y="98" width="92" height="44" rx="6" fill="${BLEU}"/>
      <rect x="806" y="330" width="88" height="54" rx="6" fill="none" stroke="${BLEU}" stroke-width="10"/>
      <g transform="translate(640 640)">${machine()}
        <path d="M60 -110 L-60 -250 L-120 -130" stroke="${BLEU}" stroke-width="28" fill="none" stroke-linejoin="round"/>
        <path d="M-150 -150 L-90 -150 L-110 -90 Z" fill="${BLEU}"/></g>
      <g transform="translate(220 640)">${person({ body: BLEU, ink: BLANC, tool: true, arm: "tool" })}</g>`;
    const fx = svg("g", {}, art);
    const tags = [];
    const tag = (id, fallback, x, y, red) => {
      const info = tagFor(C, id, fallback);
      const n = el("div", "abs tx t-small", s, { left: x + "px", top: y + "px", background: red ? "var(--rouge)" : "var(--bleu)", color: "var(--blanc)", borderRadius: "999px", padding: V ? "10px 34px 14px" : "8px 26px 10px", fontWeight: 800 });
      n.textContent = info.label; tags.push(n);
      if (info.src) C.sources.push(info.src);
      return n;
    };
    const p1 = map(130, 240), p2 = map(660, 300);
    const t1 = tag("marteau_piqueur", T.tres_bruyant, Math.max(C.PAD, p1[0]), p1[1], true);
    const t2 = tag("engin", T.bruyant, p2[0], p2[1], false);
    // texts
    const tw = V ? W - 2 * C.PAD : W - aw - C.PAD - 40;
    const col = box(s, C.PAD, V ? 260 : 200, tw, null);
    const l1 = text(col, T.accroche_1, "t-big c-blanc" + (V ? " center" : ""), { maxW: tw });
    const band = el("div", "band", col, { display: "inline-block", marginTop: V ? "50px" : "40px" });
    const wrapB = el("div", "", col, { textAlign: V ? "center" : "left" }); wrapB.appendChild(band);
    const l2 = text(band, T.accroche_2, "t-big" + (V ? " center" : ""), { maxW: tw - 80 });
    if (C.sources.length) {
      const fn = text(s, "Source : " + C.sources.join(" · "), "t-small c-blanc", { wrap: true, maxW: W - 2 * C.PAD, style: { position: "absolute", left: C.PAD + "px", bottom: "24px", opacity: 0.85 } });
      fadeUp(tl, fn, t + 1);
    }
    fit(C, s);

    rings(tl, fx, 290, 630, t + 0.05, t + 4.1, { red: true, max: 5 });   // from the jackhammer tip
    rings(tl, fx, 760, 470, t + 0.25, t + 4.1, { period: 0.45, max: 4, w: 6 });
    rings(tl, fx, 850, 300, t + 0.6, t + 4.1, { period: 0.6, max: 3, w: 5 });
    pop(tl, t1, t + 0.6); pop(tl, t2, t + 0.9);
    linesIn(tl, l1, t + 0.35, { d: 0.65 });
    tl.fromTo(band, { scaleX: 0, transformOrigin: V ? "50% 50%" : "0% 50%" }, { scaleX: 1, duration: 0.5, ease: EASE }, t + 1.75);
    linesIn(tl, l2, t + 1.95);
    // the site shakes more and more
    tl.fromTo(g, { x: -3 }, { x: 3, duration: 0.05, ease: "sine.inOut", yoyo: true, repeat: 23 }, t + 1.2);
    tl.fromTo(g, { x: -7, y: -2 }, { x: 7, y: 2, duration: 0.04, ease: "sine.inOut", yoyo: true, repeat: 39 }, t + 2.4);
    tl.set(g, { x: 0, y: 0 }, t + 4.0);
    return t + 4.0;
  }

  /* ========== 2. Thresholds: vertical dB(A) scale with three levels ========== */
  function S2(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-white");
    const ttl = text(s, T.seuils_titre, "t-h1 c-bleu" + (V ? " center" : ""), { maxW: W - 2 * C.PAD });
    Object.assign(ttl.style, { position: "absolute", left: (V ? 0 : C.PAD) + "px", width: (V ? W : W - 2 * C.PAD) + "px", top: (V ? 120 : 54) + "px" });

    const gx = V ? 60 : 150, gw = V ? 86 : 70, gTop = V ? 420 : 200, gBot = V ? 1580 : 960;
    const ys = V ? [1390, 1010, 610] : [850, 610, 340];        // 80, 85, 87 dB(A)
    const rowX = gx + gw + (V ? 60 : 90), rowW = W - rowX - C.PAD;
    const track = box(s, gx, gTop, gw, gBot - gTop); Object.assign(track.style, { background: "var(--bleu)", opacity: 0.14, borderRadius: gw / 2 + "px" });
    const fillB = box(s, gx, gTop, gw, gBot - gTop); Object.assign(fillB.style, { background: "var(--bleu)", borderRadius: gw / 2 + "px", transformOrigin: "50% 100%" });
    const fillR = box(s, gx, gTop, gw, ys[1] - gTop + gw / 2); Object.assign(fillR.style, { background: "var(--rouge)", borderRadius: gw / 2 + "px", transformOrigin: "50% 100%" });
    const ticks = ys.map((y, i) => {
      const hb = el("div", "abs", s, { left: gx + gw / 2 - 45 + "px", top: y - 52 + "px" });
      hexBadge(hb, 90, i === 2 ? ROUGE : BLEU, "", BLANC);
      return hb;
    });

    const rows = T.seuils.map((sv, i) => {
      const r = el("div", "abs", s, { left: rowX + "px", width: rowW + "px" });
      const red = i === 2;
      const inner = red ? el("div", "band", r, { display: V ? "inline-block" : "inline-flex" }) : r;
      if (!V) Object.assign(inner.style, { display: red ? "inline-flex" : "flex", alignItems: "center", gap: "40px" });
      const head = el("div", "", inner, { display: "flex", alignItems: "center", gap: "30px", flex: "none", width: V ? "auto" : "540px" });
      const v = text(head, sv.valeur, "t-big " + (red ? "c-blanc" : "c-bleu"), { maxW: rowW - (i === 1 ? 260 : 0) });
      let sign = null;
      if (i === 1) { sign = el("div", "", head); sign.innerHTML = P.mandatory(V ? 190 : 150); }
      const body = text(inner, sv.texte, "t-body " + (red ? "c-blanc" : "c-fonce"), { maxW: rowW - (red ? 80 : 0) - (V ? 0 : 580), em: red ? null : "c-rouge" });
      return { r, v, body, sign, band: red ? inner : null };
    });
    const mention = el("div", "abs", s, { left: (V ? C.PAD : rowX) + "px", width: (V ? W - 2 * C.PAD : rowW) + "px", top: (V ? 1640 : 970) + "px", display: "flex", flexDirection: V ? "column" : "row", gap: V ? "14px" : "60px", alignItems: V ? "center" : "baseline", textAlign: V ? "center" : "left" });
    const m1 = text(mention, T.seuils_duree, "t-small c-bleu", { wrap: true, maxW: V ? W - 2 * C.PAD : 700, style: { fontWeight: 800 } });
    const m2 = text(mention, T.seuils_crete, "t-small c-fonce", { wrap: true, maxW: V ? W - 2 * C.PAD : 900, style: { fontWeight: 600, opacity: 0.8 } });
    fit(C, s);
    rows.forEach((o, i) => { o.r.style.top = ys[i] - o.r.offsetHeight / 2 + "px"; });

    linesIn(tl, ttl, t + 0.1);
    tl.fromTo(track, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.7, ease: EASE }, t + 0.3);
    const level = (y) => (gBot - y + gw / 2) / (gBot - gTop);
    gsap.set(fillB, { scaleY: 0 }); gsap.set(fillR, { scaleY: 0 });
    tl.to(fillB, { scaleY: level(ys[0]), duration: 0.9, ease: "power2.inOut" }, t + 0.9);
    const showRow = (i, at) => {
      pop(tl, ticks[i], at - 0.1, { from: 0.3 });
      const o = rows[i];
      if (o.band) tl.fromTo(o.band, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.45, ease: EASE }, at);
      linesIn(tl, o.v, at + 0.1);
      linesIn(tl, o.body, at + 0.35, { stagger: 0.1 });
    };
    showRow(0, t + 1.7);
    tl.to(fillB, { scaleY: level(ys[1]), duration: 0.9, ease: "power2.inOut" }, t + 3.6);
    showRow(1, t + 4.3);
    pop(tl, rows[1].sign, t + 4.8, { from: 0.2, d: 0.7 });
    pulse(tl, rows[1].sign, t + 5.6, t + 6.6, { s: 1.07, d: 0.4 });
    // above 85: red, up to the limit value
    const rTop = ys[2] - gw / 2 - 20;
    gsap.set(fillR, { height: ys[1] - rTop + "px", top: rTop + "px" });
    tl.fromTo(fillR, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "power2.inOut" }, t + 6.3);
    showRow(2, t + 6.9);
    pulse(tl, ticks[2], t + 7.9, t + 9.6, { s: 1.15, d: 0.35 });
    fadeUp(tl, m1, t + 7.7); fadeUp(tl, m2, t + 8.0);
    return t + 9.6;
  }

  /* ========== 3a. Consequences for the ear ========== */
  function S3a(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const head = el("div", "abs", s, { left: C.PAD + "px", top: (V ? 110 : 50) + "px", display: "flex", alignItems: "center", gap: "32px" });
    const dg = el("div", "", head); dg.innerHTML = P.danger(V ? 150 : 120);
    const ttl = text(head, T.oreille_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD - 190 });
    // hearing curve (qualitative, no values)
    const cw = V ? W - 2 * C.PAD : 820, chh = V ? 420 : 620;
    const cx0 = C.PAD, cy0 = V ? 340 : 240;
    const cv = svg("svg", { width: cw, height: chh, viewBox: `0 0 ${cw} ${chh}` }, s);
    Object.assign(cv.style, { position: "absolute", left: cx0 + "px", top: cy0 + "px" });
    const yA = chh * 0.22, yB = chh * 0.9;
    cv.innerHTML = `<defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="${BLANC}"/><stop offset=".45" stop-color="${BLANC}"/><stop offset="1" stop-color="${ROUGE}"/></linearGradient></defs>
      <path d="M4 ${chh - 4} H${cw - 4}" stroke="${BLEU}" stroke-width="6" stroke-linecap="round"/>
      <path d="M4 ${chh - 4} V8" stroke="${BLEU}" stroke-width="6" stroke-linecap="round"/>
      <path class="cur" d="M30 ${yA} C${cw * 0.3} ${yA} ${cw * 0.42} ${yA + 6} ${cw * 0.55} ${yA + chh * 0.12} S${cw * 0.8} ${yB - chh * 0.1} ${cw - 40} ${yB}" fill="none" stroke="url(#cg)" stroke-width="${V ? 16 : 14}" stroke-linecap="round"/>
      <circle class="dot" cx="${cw - 40}" cy="${yB}" r="${V ? 20 : 17}" fill="${ROUGE}"/>`;
    const curLab = text(s, T.oreille_courbe, "t-small c-blanc", { maxW: cw * 0.6, style: { position: "absolute", left: cx0 + 40 + "px", top: cy0 + yA + 28 + "px", fontWeight: 700, opacity: 0.9 } });
    const earBox = el("div", "abs", s, { left: cx0 + cw - (V ? 250 : 230) + "px", top: cy0 - (V ? 10 : 0) + "px" });
    earBox.innerHTML = P.icon("tinnitus", V ? 220 : 190, BLANC, ROUGE);

    // the four consequences
    const lx = V ? C.PAD : 980, lw = V ? W - 2 * C.PAD : W - 980 - C.PAD;
    const list = el("div", "abs", s, { left: lx + "px", top: (V ? 860 : 220) + "px", width: lw + "px", display: "flex", flexDirection: "column", gap: V ? "40px" : "26px" });
    const ICONS = ["tinnitus", "earTired", "earPain", "earLoss"];
    const items = T.oreille.map((it, i) => {
      const last = i === T.oreille.length - 1;
      const row = el("div", last ? "band" : "", list, { display: "flex", alignItems: "center", gap: V ? "34px" : "28px", padding: last ? (V ? "20px 30px" : "14px 24px") : "0" });
      const hb = el("div", "", row, { flex: "none" });
      hexBadge(hb, V ? 124 : 104, BLANC, `<g transform="translate(${(V ? 124 : 104) * 0.17} ${(V ? 143 : 120) * 0.2}) scale(${(V ? 124 : 104) * 0.0066})">${P.icons[ICONS[i % 4]](FONCE, ROUGE)}</g>`);
      const col = el("div", "", row);
      const tw = lw - (V ? 124 : 104) - (V ? 34 : 28) - (last ? 60 : 0);
      const a = text(col, it.texte, "t-body c-blanc", { maxW: tw });
      const b = it.detail ? text(col, it.detail, "t-small c-blanc", { maxW: tw, style: { fontWeight: 600, opacity: 0.85, marginTop: "6px" } }) : null;
      return { row, hb, a, b, last };
    });
    fit(C, s);

    tl.fromTo(dg, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)", transformOrigin: "50% 60%" }, t + 0.05);
    linesIn(tl, ttl, t + 0.15);
    const cur = cv.querySelector(".cur"), dot = cv.querySelector(".dot");
    const Lc = cur.getTotalLength();
    tl.fromTo(cur, { strokeDasharray: Lc, strokeDashoffset: Lc }, { strokeDashoffset: 0, duration: 2.6, ease: "power1.inOut" }, t + 0.5);
    pop(tl, dot, t + 3.0, { from: 0 });
    fadeUp(tl, curLab, t + 0.7, { y: 20 });
    pop(tl, earBox, t + 0.8, { from: 0.5 });
    const zigs = earBox.querySelectorAll("svg > g:last-child path");
    tl.fromTo(zigs, { scaleX: 0.6, opacity: 0.5, transformOrigin: "0% 50%" }, { scaleX: 1.1, opacity: 1, duration: 0.12, yoyo: true, repeat: 41, ease: "sine.inOut", stagger: 0.04 }, t + 1.0);
    items.forEach((o, i) => {
      const at = t + 1.0 + i * 1.25;
      if (o.last) tl.fromTo(o.row, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.45, ease: EASE }, at - 0.1);
      pop(tl, o.hb, at, { from: 0.3 });
      linesIn(tl, o.a, at + 0.1);
      if (o.b) linesIn(tl, o.b, at + 0.35);
    });
    return t + 6.4;
  }

  /* ========== 3b. Body & safety, then the same situation, organised ========== */
  function S3b(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-white");
    const ttl = text(s, T.corps_titre, "t-h1 c-bleu" + (V ? " center" : ""), { maxW: W - 2 * C.PAD });
    Object.assign(ttl.style, { position: "absolute", left: (V ? 0 : C.PAD) + "px", width: (V ? W : W - 2 * C.PAD) + "px", top: (V ? 110 : 50) + "px" });

    // A. stress / fatigue / sleep
    const row = el("div", "abs", s, { left: C.PAD + "px", width: W - 2 * C.PAD + "px", top: (V ? 470 : 330) + "px", display: "flex", justifyContent: "space-around" });
    const IC = ["stress", "battery", "sleep"];
    const body = T.corps.map((lab, i) => {
      const c = el("div", "", row, { display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", width: (V ? 310 : 420) + "px" });
      const hb = el("div", "", c); const hw = V ? 230 : 230;
      hexBadge(hb, hw, BLEU, `<g transform="translate(${hw * 0.2} ${hw * 1.1547 * 0.23}) scale(${hw * 0.006})">${P.icons[IC[i]](BLANC, ROUGE)}</g>`);
      const lt = text(c, lab, "t-body c-fonce center", { maxW: V ? 310 : 420 });
      return { c, hb, lt };
    });

    // B. illustration
    const aw = V ? 1080 : 1000, ah = aw * 0.65;
    const ax = V ? 0 : 30, ay = V ? 360 : H - ah - 30;
    const art = svg("svg", { width: aw, height: ah, viewBox: "0 0 1000 650" }, s);
    Object.assign(art.style, { position: "absolute", left: ax + "px", top: ay + "px" });
    art.innerHTML = `
      <rect x="-40" y="560" width="1080" height="16" rx="8" fill="${FONCE}" opacity=".9"/>
      <g class="safe" opacity="0"><rect x="150" y="576" width="250" height="40" fill="${BLEU}" opacity=".18"/></g>
      <g class="mach" transform="translate(1100 560)">${machine({ gyro: true })}</g>
      <g class="col" transform="translate(110 560)"><g class="fl">${person({ body: BLEU, ink: FONCE, paddle: true })}</g></g>
      <g class="wk" transform="translate(470 560)">
        <g class="fl-l" transform="scale(-1 1)">${person({ body: BLEU, ink: FONCE, tool: true, arm: "tool" })}</g>
        <g class="fl-r" visibility="hidden">${person({ body: BLEU, ink: FONCE, tool: true, arm: "tool" })}</g></g>
      <g class="fx"></g>`;
    const mach = art.querySelector(".mach"), wk = art.querySelector(".wk"), col = art.querySelector(".col");
    const wkL = wk.querySelector(".fl-l"), wkR = wk.querySelector(".fl-r"), muffs = wk.querySelectorAll(".muffs");
    const gyro = mach.querySelector(".gyro"), rays = mach.querySelector(".rays");
    const colArm = col.querySelector(".arm"), safe = art.querySelector(".safe");
    const wkTool = wkL.querySelector(".tool");
    const fx = art.querySelector(".fx");
    const flash = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px", background: "var(--rouge)", opacity: 0 });
    const warn = el("div", "abs", s, { left: ax + 600 * aw / 1000 - 90 + "px", top: ay + 150 * aw / 1000 + "px" }); warn.innerHTML = P.danger(180);
    const ok = el("div", "abs", s, { left: ax + 700 * aw / 1000 + "px", top: ay + 120 * aw / 1000 + "px" });
    hexBadge(ok, 150, BLEU, `<g transform="translate(25 37) scale(1)">${P.icons.check(BLANC)}</g>`);

    // texts (bad, then good)
    const tx = V ? C.PAD : 1070, tw = V ? W - 2 * C.PAD : W - 1070 - C.PAD, ty = V ? 1150 : 290;
    const bad = el("div", "abs", s, { left: tx + "px", top: ty + "px", width: tw + "px", borderLeft: `14px solid var(--rouge)`, paddingLeft: "34px" });
    const badT = text(bad, T.danger_texte, "t-body c-fonce", { maxW: tw - 48 });
    const good = el("div", "abs", s, { left: tx + "px", top: ty + "px", width: tw + "px" });
    const gl = el("div", "band blue", good, { display: "inline-block", marginBottom: V ? "34px" : "26px" });
    const goodL = text(gl, T.bonne_orga_titre, "t-small c-blanc", { maxW: tw - 80, style: { fontWeight: 800 } });
    const goodT = text(good, T.bonne_orga_texte, "t-body c-bleu", { maxW: tw });
    // C. strong message on a red hexagon
    const R = Math.hypot(W, H) * 0.62;
    const bigHex = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s);
    Object.assign(bigHex.style, { position: "absolute", left: 0, top: 0 });
    bigHex.innerHTML = `<path d="${hexD(W / 2, H / 2, R)}" fill="${ROUGE}"/>`;
    const hexP = bigHex.firstChild;
    const msg = text(s, T.message_fort, "t-big c-blanc center", { maxW: W - 2 * C.PAD });
    Object.assign(msg.style, { position: "absolute", left: 0, width: W + "px" });
    fit(C, s);
    msg.style.top = (H - msg.offsetHeight) / 2 + "px";
    gsap.set([art, bad, good, flash, warn, ok, bigHex], { autoAlpha: 0 });
    gsap.set(msg.querySelectorAll(".ln"), { yPercent: 115 });

    // A
    linesIn(tl, ttl, t + 0.1);
    body.forEach((o, i) => { pop(tl, o.hb, t + 0.35 + i * 0.25, { from: 0.4 }); linesIn(tl, o.lt, t + 0.5 + i * 0.25); });
    tl.to(row, { autoAlpha: 0, y: -40, duration: 0.4, ease: "power2.in" }, t + 2.5);

    // B1. without organisation: nobody hears the reversing machine
    const b = t + 2.8;
    tl.set(art, { autoAlpha: 1 }, b);
    tl.fromTo(art, { opacity: 0 }, { opacity: 1, duration: 0.35 }, b);
    tl.set(gyro, { autoAlpha: 0 }, b);
    tl.fromTo(mach, { x: 1100 }, { x: 600, duration: 2.6, ease: "power1.out" }, b);
    beeps(tl, fx, 0, 0, b + 0.2, b + 2.7, { reach: 120 });
    // beeps follow the machine rear: put them in a group that moves with it
    const beepG = svg("g", {}, fx); [...fx.querySelectorAll("path")].forEach((p) => beepG.appendChild(p));
    tl.fromTo(beepG, { x: 1090, y: 470 }, { x: 590, y: 470, duration: 2.6, ease: "power1.out" }, b);
    tl.fromTo(wkTool, { y: 0 }, { y: -6, duration: 0.05, yoyo: true, repeat: 51, ease: "none" }, b);
    rings(tl, fx, 470, 300, b, b + 2.8, { color: ROUGE, red: false, max: 2.4, period: 0.22, life: 0.6, w: 6, r: 40 });
    // the colleague shouts, unheard
    tl.fromTo(colArm, { rotation: 0 }, { rotation: -150, duration: 0.35, svgOrigin: "0 -225", ease: "power2.out" }, b + 1.0);
    rings(tl, fx, 150, 290, b + 1.1, b + 2.6, { color: BLEU, max: 1.8, period: 0.3, life: 0.5, w: 5, r: 30 });
    tl.fromTo(bad, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE }, b + 0.9);
    linesIn(tl, badT, b + 1.0);
    tl.fromTo(flash, { opacity: 0 }, { opacity: 0.22, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut" }, b + 2.55);
    tl.set(flash, { visibility: "visible" }, b + 2.55); tl.set(flash, { visibility: "hidden" }, b + 3.3);
    pop(tl, warn, b + 2.55, { from: 0.2 });

    // B2. organised: adapted protection, visible signals, agreed gestures
    const g = t + 6.4;
    tl.to([art, bad, warn], { autoAlpha: 0, duration: 0.3 }, g - 0.35);
    tl.set(mach, { x: 1100 }, g); tl.set(beepG, { autoAlpha: 0 }, g); tl.set(colArm, { rotation: 0, svgOrigin: "0 -225" }, g);
    tl.set(muffs, { visibility: "visible" }, g); tl.set(gyro, { autoAlpha: 1 }, g);
    tl.to(art, { autoAlpha: 1, duration: 0.35 }, g);
    tl.fromTo(good, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, g);
    tl.fromTo(gl, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.4, ease: EASE }, g + 0.1);
    linesIn(tl, goodL, g + 0.25);
    pop(tl, muffs, g + 0.3, { from: 0.2 });
    tl.fromTo(mach, { x: 1100 }, { x: 640, duration: 2.6, ease: "power1.inOut" }, g + 0.4);
    tl.fromTo(rays, { opacity: 0.15 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 17, ease: "none" }, g + 0.4);
    tl.fromTo(gyro.querySelector("rect"), { opacity: 0.6 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 17, ease: "none" }, g + 0.4);
    tl.to(colArm, { rotation: -150, duration: 0.4, svgOrigin: "0 -225", ease: "power2.out" }, g + 0.9);
    tl.to(colArm, { rotation: -120, duration: 0.3, svgOrigin: "0 -225", ease: "sine.inOut", yoyo: true, repeat: 3 }, g + 1.3);
    tl.set(wkL, { visibility: "hidden" }, g + 1.6); tl.set(wkR, { visibility: "visible" }, g + 1.6);   // the worker turns around
    tl.to(safe, { opacity: 1, duration: 0.4 }, g + 1.7);
    tl.fromTo(wk, { x: 470 }, { x: 275, duration: 1.0, ease: "power2.inOut" }, g + 1.8);   // and steps aside
    tl.fromTo(wkR.querySelector(".legs"), { y: 0 }, { y: -8, duration: 0.12, yoyo: true, repeat: 7, ease: "sine.inOut" }, g + 1.8);
    linesIn(tl, goodT, g + 0.9, { stagger: 0.3 });
    pop(tl, ok, g + 3.2, { from: 0.2 });

    // C. strong message
    const m = t + 10.2;
    tl.set(bigHex, { autoAlpha: 1 }, m);
    tl.fromTo(hexP, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.6, ease: "power3.inOut" }, m);
    linesIn(tl, msg, m + 0.45, { d: 0.6, stagger: 0.15 });
    return m + 2.2;
  }

  /* ========== 4. Good habits: five hexagon-revealed cards ========== */
  function S4(C, t) {
    const { V, W, H, T, tl } = C;
    const s = mkScene(C, "bg-dark");
    const ttl = text(s, T.reflexes_titre, "t-h1 c-blanc" + (V ? " center" : ""), { maxW: W - 2 * C.PAD });
    Object.assign(ttl.style, { position: "absolute", left: (V ? 0 : C.PAD) + "px", width: (V ? W : W - 2 * C.PAD) + "px", top: (V ? 100 : 46) + "px" });
    const cx = V ? 40 : C.PAD, cy = V ? 300 : 190, cw = W - 2 * cx, ch = V ? 1360 : 760;
    const N = T.reflexes.length, per = 2.6;
    // progress hexagons
    const prog = el("div", "abs", s, { left: 0, width: W + "px", top: cy + ch + (V ? 70 : 40) + "px", display: "flex", justifyContent: "center", gap: "26px" });
    const dots = T.reflexes.map(() => { const d = el("div", "", prog); hexBadge(d, V ? 54 : 40, BLANC); gsap.set(d, { opacity: 0.25 }); return d; });

    const BIG = ["", "earPlug", "clock", "renew", ""];
    const cards = T.reflexes.map((rf, i) => {
      const c = el("div", "card", s, { left: cx + "px", top: cy + "px", width: cw + "px", height: ch + "px" });
      const nb = el("div", "num", c, { left: (V ? 44 : 44) + "px", top: (V ? 40 : 36) + "px" });
      const nw = V ? 120 : 100;
      hexBadge(nb, nw, BLANC, `<text x="${nw / 2}" y="${nw * 1.1547 / 2 + nw * 0.2}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${nw * 0.56}" fill="${BLEU}">${i + 1}</text>`);
      const inner = { c, nb, parts: [] };
      const textW = V ? cw - 120 : (i === 0 ? cw - 260 : cw - 680);
      if (i === 0) {
        // title, then the four types of protectors
        const tt = text(c, rf.titre, "t-big c-blanc" + (V ? " center" : ""), { maxW: textW });
        Object.assign(tt.style, { position: "absolute", left: (V ? 60 : 200) + "px", width: textW + "px", top: (V ? 170 : 50) + "px" });
        const grid = el("div", "types", c, { position: "absolute", left: (V ? 40 : 40) + "px", right: (V ? 40 : 40) + "px", top: (V ? 450 : 300) + "px", gridTemplateColumns: V ? "1fr 1fr" : "1fr 1fr 1fr 1fr", rowGap: V ? "40px" : "0" });
        const TY = ["plugs", "cordPlugs", "helmetMuffs", "headband"];
        rf.types.forEach((lab, k) => {
          const cell = el("div", "type", grid, { gap: "18px" });
          const hb = el("div", "", cell); const hw = V ? 190 : 200;
          hexBadge(hb, hw, BLANC, `<g transform="translate(${hw * 0.2} ${hw * 1.1547 * 0.21}) scale(${hw * 0.006})">${P.icons[TY[k]](BLEU)}</g>`);
          const lt = text(cell, lab, "t-small c-blanc center", { maxW: V ? 420 : 380, style: { fontWeight: 750 } });
          inner.parts.push({ hb, lt });
        });
        inner.title = tt;
      } else {
        const pic = el("div", "abs", c, V ? { left: "50%", top: "120px", marginLeft: "-190px" } : { left: "110px", top: "50%", marginTop: "-219px" });
        const pw = 380;
        const content = i === 4
          ? `<g transform="translate(${pw * 0.14} ${pw * 0.217}) scale(${pw * 0.0036})">${P.mandatory(200).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`
          : `<g transform="translate(${pw * 0.2} ${pw * 1.1547 * 0.22}) scale(${pw * 0.006})">${P.icons[BIG[i]](BLEU, i === 1 ? BLEU : ROUGE)}</g>`;
        hexBadge(pic, pw, BLANC, content);
        if (i === 4) { const pz = el("div", "abs", pic, { right: "-24px", bottom: "10px" }); hexBadge(pz, 140, ROUGE, `<g transform="translate(22 34) scale(.96)">${P.icons.pause(BLANC)}</g>`, BLANC); inner.extra = pz; }
        if (i === 1) { const ck = el("div", "abs", pic, { right: "-20px", bottom: "0px" }); hexBadge(ck, 130, BLEU, `<g transform="translate(20 31) scale(.9)">${P.icons.check(BLANC)}</g>`, BLANC); inner.extra = ck; }
        const txt = el("div", "abs", c, V ? { left: "60px", width: textW + "px", top: "640px", textAlign: "center" } : { left: "600px", width: textW + "px", top: "0", bottom: "0", display: "flex", flexDirection: "column", justifyContent: "center" });
        const tt = text(txt, rf.titre, "t-big c-blanc" + (V ? " center" : ""), { maxW: textW });
        const ls = rf.lignes.map((l) => text(txt, l, "t-body" + (V ? " center" : ""), { maxW: textW, style: { color: "var(--blanc)", fontWeight: 650, marginTop: V ? "26px" : "18px", opacity: 0.95 } }));
        if (ls[0]) ls[0].style.marginTop = V ? "50px" : "34px";
        inner.title = tt; inner.lines = ls; inner.pic = pic;
      }
      gsap.set(c, { autoAlpha: 0 });
      return inner;
    });
    fit(C, s);

    linesIn(tl, ttl, t + 0.1);
    const R0 = Math.hypot(cw, ch);
    const hexClip = (r) => "polygon(" + L.hexPoints(cw / 2, ch / 2, r).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",") + ")";
    cards.forEach((o, i) => {
      const at = t + 0.3 + i * per;
      tl.set(o.c, { autoAlpha: 1 }, at);
      tl.fromTo(o.c, { clipPath: hexClip(10) }, { clipPath: hexClip(R0), duration: 0.6, ease: "power2.inOut" }, at);
      tl.to(dots[i], { opacity: 1, duration: 0.3 }, at);
      if (i) tl.to(dots[i - 1], { opacity: 0.55, duration: 0.3 }, at);
      pop(tl, o.nb, at + 0.25, { from: 0.4 });
      linesIn(tl, o.title, at + 0.3);
      if (i === 0) o.parts.forEach((p, k) => { pop(tl, p.hb, at + 0.6 + k * 0.22, { from: 0.4 }); linesIn(tl, p.lt, at + 0.7 + k * 0.22); });
      else {
        pop(tl, o.pic, at + 0.2, { from: 0.7 });
        o.lines.forEach((l, k) => linesIn(tl, l, at + 0.7 + k * 0.3));
        if (o.extra) pop(tl, o.extra, at + 1.0, { from: 0.2 });
        if (i === 2) { const ring = o.pic.querySelector(".ring"); const Lr = 2 * Math.PI * 46; tl.fromTo(ring, { strokeDasharray: Lr, strokeDashoffset: Lr }, { strokeDashoffset: 0, duration: 1.6, ease: "none" }, at + 0.5); }
        if (i === 3) { const g = o.pic.querySelector("svg > g > g"); tl.fromTo(g, { rotation: 0 }, { rotation: 360, transformOrigin: "50% 50%", duration: 1.4, ease: "power2.inOut" }, at + 0.5); }
      }
      if (i < N - 1) tl.to(o.c, { autoAlpha: 0, scale: 0.96, duration: 0.35, ease: "power2.in" }, at + per - 0.05);
    });
    return t + 0.3 + N * per + 0.4;
  }

  /* ========== 5. Final message + logos ========== */
  function S5(C, t) {
    const { V, W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const sign = el("div", "abs", s, V ? { left: (W - 300) / 2 + "px", top: "230px" } : { left: "130px", top: "180px" });
    sign.innerHTML = P.mandatory(V ? 300 : 340);
    const tx = V ? C.PAD : 600, tw = V ? W - 2 * C.PAD : W - 600 - C.PAD;
    const col = el("div", "abs", s, { left: tx + "px", width: tw + "px", top: (V ? 620 : 140) + "px", textAlign: V ? "center" : "left" });
    const f1 = text(col, T.final_1, "t-big c-bleu" + (V ? " center" : ""), { maxW: tw });
    const f2 = text(col, T.final_2, "t-big c-rouge" + (V ? " center" : ""), { maxW: tw, style: { marginTop: V ? "60px" : "40px" } });
    // logos, on white, with their clear space
    const { w: lw, h: lh } = C.logo;
    const pad = Math.max(40, Math.round(lh * 0.42));
    const logos = el("div", "abs", s, { left: 0, width: W + "px", top: (V ? 1360 : 700) + "px", display: "flex", justifyContent: "center", alignItems: "center", gap: "40px" });
    if (!V) Object.assign(logos.style, { left: tx - pad + "px", width: "auto", justifyContent: "flex-start" });
    const lc = el("div", "", logos, { padding: pad + "px", background: "var(--blanc)" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    if (C.logoChantier) { const cc = el("div", "", logos, { padding: pad + "px" }); const i2 = el("img", "", cc); i2.src = C.logoChantier.src; i2.width = C.logoChantier.w; i2.height = C.logoChantier.h; }
    let credit = null;
    if (cfg.show_synapsis_credit) {
      credit = el("div", "abs", s, { left: 0, width: W + "px", bottom: (V ? 90 : 50) + "px", display: "flex", justifyContent: "center", alignItems: "center", gap: "22px" });
      const ci = el("img", "", credit, { height: (V ? 72 : 56) + "px" }); ci.src = "../" + cfg.logos.synapsis;
      const ct = text(credit, T.credit, "t-small c-fonce", { style: { fontWeight: 650, opacity: 0.8 } });
    }
    fit(C, s);
    pop(tl, sign, t + 0.1, { from: 0.3, d: 0.7 });
    linesIn(tl, f1, t + 0.35);
    linesIn(tl, f2, t + 1.2);
    fadeUp(tl, logos, t + 1.9, { y: 30 });
    if (credit) fadeUp(tl, credit, t + 2.4, { y: 20 });
    tl.to({}, { duration: 0.01 }, t + 5.0);
    return t + 5.0;
  }

  /* ========== 2b. What damages your ears: everyday tools on the dB(A) scale (16:9) ========== */
  /** sourced level of a tool: only entries of sources_bruit that have a value AND a source */
  function toolLevel(C, tool) {
    const vals = [], used = [];
    (tool.sources || []).forEach((id) => {
      const e = (C.cfg.sources_bruit || []).find((x) => x.id === id && x.source && x.valeur != null);
      if (e) { [].concat(e.valeur).forEach((v) => vals.push(+v)); used.push(e); }
    });
    if (!vals.length) return null;
    return { min: Math.min(...vals), max: Math.max(...vals), impuls: used.some((e) => e.impulsionnel) };
  }

  function S2b(C, t) {
    const { W, H, T, tl, cfg } = C;
    const showDb = cfg.show_db_values !== false;
    const s = mkScene(C, "bg-white");
    const pa = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px" });     // phase A: scale + cards
    const pb = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px" });     // phase B: messages
    gsap.set(pb, { autoAlpha: 0 });

    const ttl = text(pa, T.outils_titre, "t-h1 c-bleu", { maxW: W - 2 * C.PAD, style: { position: "absolute", left: C.PAD + "px", top: "28px" } });
    const msg1 = text(pa, T.outils_message_1, "t-h1 c-rouge", { maxW: W - 2 * C.PAD, style: { position: "absolute", left: C.PAD + "px", top: "28px" } });
    gsap.set(msg1.querySelectorAll(".ln"), { yPercent: 115 });
    const mention = text(s, T.outils_mention, "t-small c-fonce", { maxW: W - 2 * C.PAD, style: { position: "absolute", left: C.PAD + "px", top: "944px", fontWeight: 600, opacity: 0.85 } });

    // the dB(A) scale (qualitative zones; only the 85 dB(A) action value is written)
    const DB0 = 75, DB1 = 135, gx = 150, gw = 56, gTop = 188, gBot = 900;
    const yOf = (db) => gBot - (Math.min(DB1, Math.max(DB0, db)) - DB0) / (DB1 - DB0) * (gBot - gTop);
    const g = box(pa, gx, gTop, gw, gBot - gTop); Object.assign(g.style, { borderRadius: gw / 2 + "px", overflow: "hidden", background: "var(--bleu)" });
    const red = el("div", "abs", g, { left: 0, top: 0, width: "100%", height: yOf(85) - gTop + "px", background: "var(--rouge)" });
    const tick = box(pa, gx - 10, yOf(85) - 4, gw + 20, 8); tick.style.background = "var(--fonce)"; tick.style.borderRadius = "4px";
    const t85 = text(pa, "85", "t-small c-fonce", { style: { position: "absolute", left: "46px", width: "90px", textAlign: "right", top: yOf(85) - 30 + "px", fontWeight: 800 } });
    const unit = text(pa, "dB(A)", "t-small c-bleu", { style: { position: "absolute", left: gx + gw / 2 - 80 + "px", width: "160px", textAlign: "center", top: gTop - 64 + "px", fontWeight: 800 } });

    // tools: qualitative ones first, then from the least to the most noisy
    const tools = T.outils.map((o, i) => ({ ...o, i, lv: toolLevel(C, o) }));
    tools.sort((a, b) => (a.lv ? 1 : 0) - (b.lv ? 1 : 0) || (a.lv && b.lv ? (a.lv.min - b.lv.min) || (a.lv.max - b.lv.max) : 0) || a.i - b.i);
    const fmt = (lv) => (lv.min === lv.max ? String(lv.min) : T.outils_plage.replace("{min}", lv.min).replace("{max}", lv.max));

    const X0 = 360, X1 = W - 60, Y0 = 128, Y1 = 926, GAP = 16, COLS = 4;
    const cw = (X1 - X0 - (COLS - 1) * GAP) / COLS, chh = (Y1 - Y0 - GAP) / 2, inner = cw - 30;
    const placed = [];
    const items = tools.map((tool, k) => {
      const over = tool.lv && tool.lv.min > 85;
      const c = el("div", "card", pa, { left: X0 + (k % COLS) * (cw + GAP) + "px", top: Y0 + Math.floor(k / COLS) * (chh + GAP) + "px", width: cw + "px", height: chh + "px", borderRadius: "30px", padding: "16px 15px" });
      const top = el("div", "", c, { display: "flex", alignItems: "flex-start", gap: "12px", height: "116px" });
      const ib = el("div", "", top, { flex: "none" });
      hexBadge(ib, 100, BLANC, `<g transform="translate(17 24.7) scale(.66)">${P.icons[tool.id] ? P.icons[tool.id](BLEU, ROUGE) : ""}</g>`);
      let imp = null, sign = null;
      if (tool.lv && tool.lv.impuls) { imp = el("div", "", top, { flex: "none", marginTop: "12px" }); hexBadge(imp, 64, ROUGE, `<g transform="translate(9 13) scale(.46)">${P.icons.impulse(BLANC)}</g>`, BLANC); }
      if (over) { sign = el("div", "", top, { marginLeft: "auto", flex: "none" }); sign.innerHTML = P.mandatory(74); }
      const name = text(c, tool.nom, "t-small c-blanc", { maxW: inner, style: { fontSize: "50px", fontWeight: 800, marginTop: "4px" } });
      let vs = !tool.lv ? T.outils_bruyant : showDb ? T.outils_valeur.replace("{v}", fmt(tool.lv)) : over ? T.outils_tres_bruyant : T.outils_bruyant;
      const val = text(c, vs, "t-small c-blanc", { style: { fontWeight: 650, marginTop: "4px", opacity: 0.95 } });   // width checked below
      const imps = tool.lv && tool.lv.impuls ? text(c, T.outils_coup_sec, "t-small c-blanc", { maxW: inner, style: { fontWeight: 800 } }) : null;
      // marker on the scale, at the tool's level (only when values are shown)
      let mk = null;
      if (tool.lv && showDb) {
        const y = yOf((tool.lv.min + tool.lv.max) / 2);
        const stack = placed.filter((p) => Math.abs(p - y) < 72).length; placed.push(y);
        const mx = stack === 1 ? gx - 12 - 72 : gx + gw + 12 + (stack > 1 ? 40 : 0);      // right, left, then right again
        mk = el("div", "abs", pa, { left: mx + "px", top: y - 41.6 + "px" });
        hexBadge(mk, 72, BLANC, `<g transform="translate(13 18.6) scale(.46)">${P.icons[tool.id] ? P.icons[tool.id](BLEU, ROUGE) : ""}</g>`, over ? ROUGE : BLEU);
      }
      return { c, ib, imp, sign, name, val, imps, mk, over, tool };
    });
    // a value that does not fit on one line breaks before its unit ("≈ 94 à 100" / "dB(A)")
    items.forEach((o) => {
      const ln = o.val.querySelector(".ln");
      if (ln.getBoundingClientRect().width > inner + 1 && / [^ ]+$/.test(ln.textContent)) {
        const nv = text(o.c, ln.textContent.replace(/ ([^ ]+)$/, "\n$1"), "t-small c-blanc", { style: { fontWeight: 650, marginTop: "4px", opacity: 0.95 } });
        o.c.insertBefore(nv, o.val); o.val.remove(); o.val = nv;
      }
      o.val.dataset.maxw = inner;
    });
    fit(C, s);
    items.forEach((o) => {
      if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte ${o.tool.id} : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`);
    });

    // phase B: level × time, and the neighbour's noise
    const lc = el("div", "abs", pb, { left: C.PAD + "px", top: "210px", width: "840px" });
    const ic = el("div", "", lc, { display: "flex", alignItems: "center", gap: "26px", marginBottom: "46px" });
    const i1 = el("div", "", ic); hexBadge(i1, 150, BLEU, `<g transform="translate(30 41.6) scale(.9)">${P.icons.level(BLANC, ROUGE)}</g>`);
    const plus = text(ic, "+", "t-big c-bleu");
    const i2 = el("div", "", ic); hexBadge(i2, 150, BLEU, `<g transform="translate(30 41.6) scale(.9)">${P.icons.clock(BLANC, ROUGE)}</g>`);
    const msg2 = text(lc, T.outils_message_2, "t-big c-bleu", { maxW: 840, em: "c-rouge" });
    const card = el("div", "abs", pb, { left: "1010px", top: "120px", width: W - 1010 - C.PAD + "px", height: "800px", background: "var(--blanc)", border: "8px solid var(--bleu)", borderRadius: "36px", overflow: "hidden" });
    const ill = svg("svg", { width: W - 1010 - C.PAD - 16, height: 470, viewBox: "0 0 800 470" }, card);
    ill.style.marginTop = "20px";
    ill.innerHTML = `<g class="fx"></g><rect x="20" y="440" width="760" height="14" rx="7" fill="${FONCE}"/>
      <g transform="translate(250 440)">${person({ body: BLEU, ink: FONCE, tool: true, arm: "tool", muffs: true })}</g>
      <g transform="translate(560 440)"><g transform="scale(-1 1)">${person({ body: BLEU, ink: FONCE })}</g></g>
      <g class="hit" stroke="${ROUGE}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0">
        <path d="M508 150 l-8 -7 l-8 7 l-8 -7"/><path d="M510 172 l-9 -6 l-9 6 l-9 -6"/><path d="M508 194 l-8 -7 l-8 7 l-8 -7"/></g>`;
    const vtx = text(card, T.outils_voisin, "t-big c-fonce center", { maxW: W - 1010 - C.PAD - 70, style: { marginTop: "26px" } });
    fit(C, pb);

    /* --- timeline --- */
    linesIn(tl, ttl, t + 0.1);
    tl.fromTo(g, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.7, ease: EASE }, t + 0.25);
    fadeUp(tl, tick, t + 0.8, { y: 0 }); fadeUp(tl, t85, t + 0.85, { y: 10 }); fadeUp(tl, unit, t + 0.6, { y: 10 });
    fadeUp(tl, mention, t + 0.5, { y: 20 });
    const STEP = 0.82, A0 = t + 0.9;
    items.forEach((o, k) => {
      const at = A0 + k * STEP;
      const R0 = Math.hypot(cw, chh);
      const hexClip = (r) => "polygon(" + L.hexPoints(cw / 2, chh / 2, r).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",") + ")";
      gsap.set(o.c, { autoAlpha: 0 });
      tl.set(o.c, { autoAlpha: 1 }, at);
      tl.fromTo(o.c, { clipPath: hexClip(8) }, { clipPath: hexClip(R0), duration: 0.5, ease: "power2.inOut" }, at);
      pop(tl, o.ib, at + 0.15, { from: 0.4 });
      linesIn(tl, o.name, at + 0.2, { stagger: 0.08 });
      linesIn(tl, o.val, at + 0.35);
      if (o.imps) { linesIn(tl, o.imps, at + 0.45); pop(tl, o.imp, at + 0.4, { from: 0.3 }); }
      if (o.mk) tl.fromTo(o.mk, { y: gBot - parseFloat(o.mk.style.top) - 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, at + 0.1);
      if (o.over) {
        tl.set(o.c, { clipPath: "none" }, at + 0.52);
        tl.fromTo(o.c, { boxShadow: `0 0 0 0px ${cfg.palette.rouge}` }, { boxShadow: `0 0 0 8px ${cfg.palette.rouge}`, duration: 0.3, ease: "power2.out" }, at + 0.55);
        pop(tl, o.sign, at + 0.55, { from: 0.2 });
      }
    });
    // message 1 replaces the title while the hand tools come in
    linesOut(tl, ttl, t + 3.3);
    linesIn(tl, msg1, t + 3.55);

    // phase B
    const b = A0 + items.length * STEP + 0.35;
    tl.to(pa, { autoAlpha: 0, y: -30, duration: 0.4, ease: "power2.in" }, b);
    tl.set(pb, { autoAlpha: 1 }, b + 0.4);
    pop(tl, i1, b + 0.45, { from: 0.4 }); fadeUp(tl, plus, b + 0.6, { y: 10 }); pop(tl, i2, b + 0.7, { from: 0.4 });
    linesIn(tl, msg2, b + 0.75, { stagger: 0.14 });
    tl.fromTo(card, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: EASE }, b + 1.3);
    rings(tl, ill.querySelector(".fx"), 320, 420, b + 1.5, b + 4.1, { color: ROUGE, max: 6, period: 0.3, life: 1.1, w: 6, r: 36 });
    tl.to(ill.querySelector(".hit"), { opacity: 1, duration: 0.25 }, b + 2.0);
    tl.fromTo(ill.querySelectorAll(".hit path"), { x: 0 }, { x: -6, duration: 0.1, yoyo: true, repeat: 19, ease: "sine.inOut" }, b + 2.0);
    linesIn(tl, vtx, b + 1.9);
    return b + 4.1;
  }

  /* ========== 6. Closing: sound waves draw the logo hexagon, then the logo ========== */
  function S6(C, t) {
    const { W, H, T, tl, cfg } = C;
    const s = mkScene(C, "bg-white");
    const blue = cfg.palette.bleu, red = cfg.palette.rouge;
    const { w: lw, h: lh } = C.logo;
    const lx = Math.round((W - lw) / 2), ly = Math.round(H * 0.36);
    // the logo, on white, with its clear space; never scaled beyond the cap (C.logo is already capped)
    const lc = el("div", "abs", s, { left: lx + "px", top: ly + "px", width: lw + "px", height: lh + "px" });
    const img = el("img", "", lc); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const txt = text(s, T.fin_texte, "t-big c-bleu center", { maxW: W - 2 * C.PAD });
    Object.assign(txt.style, { position: "absolute", left: 0, width: W + "px", top: ly + lh + Math.max(60, Math.round(lh * 0.6)) + "px" });
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
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s);
    Object.assign(art.style, { position: "absolute", left: 0, top: 0 });
    const d = hexD(0, 0, R, 0.1);
    art.innerHTML = `<defs><clipPath id="hexTop"><rect x="${-R * 2}" y="${-R * 2}" width="${R * 4}" height="${R * 2 + (2 * 0.625 - 1) * R}"/></clipPath>
        <clipPath id="hexBot"><rect x="${-R * 2}" y="${(2 * 0.725 - 1) * R}" width="${R * 4}" height="${R * 2}"/></clipPath></defs>
      <g class="rings"></g>
      <g class="hex"><g class="hs"><path class="ft" d="${d}" fill="${blue}" clip-path="url(#hexTop)"/><path class="fb" d="${d}" fill="${blue}" clip-path="url(#hexBot)"/>
        <path class="ol" d="${d}" fill="none" stroke="${blue}" stroke-width="12" stroke-linejoin="round"/></g></g>`;
    const hs = art.querySelector(".hs");
    gsap.set(hs, { transformOrigin: "50% 50%", scale: 1 });
    const hex = art.querySelector(".hex"), ol = art.querySelector(".ol"), ft = art.querySelector(".ft"), fb = art.querySelector(".fb");
    const rg = art.querySelector(".rings");
    gsap.set([hex, rg], { x: cx0, y: cy0 });
    gsap.set([ft, fb], { opacity: 0 });
    gsap.set(lc, { autoAlpha: 0 });
    const Lo = ol.getTotalLength();

    // 1. waves close in (echo of the hook)
    for (let i = 0; i < 5; i++) {
      const c = svg("circle", { cx: 0, cy: 0, r: R, fill: "none", stroke: i % 2 ? red : blue, "stroke-width": 9 }, rg);
      tl.fromTo(c, { scale: 4.2 - i * 0.35, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 0.9, duration: 0.75, ease: "power2.in" }, t + i * 0.1);
      tl.to(c, { opacity: 0, duration: 0.2 }, t + i * 0.1 + 0.75);
    }
    // 2. they draw the hexagon in blue, it fills, and the bottom turns red as in the logo
    tl.fromTo(ol, { strokeDasharray: Lo, strokeDashoffset: Lo }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, t + 0.55);
    tl.to([ft, fb], { opacity: 1, duration: 0.3 }, t + 1.15);
    tl.to(ol, { opacity: 0, duration: 0.25 }, t + 1.3);
    tl.fromTo(fb, { attr: { fill: blue } }, { attr: { fill: red }, duration: 0.3, ease: "none" }, t + 1.45);
    // 3. the hexagon takes its place in the logo, and the logo fades in (slides 24 px)
    const SL = 24;
    tl.to(hex, { x: fxc, y: fyc + SL, duration: 0.55, ease: "power3.inOut" }, t + 1.75);
    tl.to(hs, { scale: fR / R, duration: 0.55, ease: "power3.inOut" }, t + 1.75);
    tl.fromTo(lc, { autoAlpha: 0, y: SL }, { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE }, t + 2.2);
    tl.to(hex, { y: fyc, duration: 0.5, ease: EASE }, t + 2.2);
    tl.to(hex, { opacity: 0, duration: 0.3 }, t + 2.4);
    linesIn(tl, txt, t + 2.5);
    if (credit) fadeUp(tl, credit, t + 2.7, { y: 16 });
    tl.to({}, { duration: 0.01 }, t + 3.1 + 1.0);   // hold the last image 1 s
    return t + 4.1;
  }

  window.SCENES = { S0, S1, S2, S2b, S3a, S3b, S4, S5, S6, person, machine };
})();
