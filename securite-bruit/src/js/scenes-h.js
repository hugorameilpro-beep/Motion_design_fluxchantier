/* 16:9 scenes that follow the reading rules (README): one idea per screen, at most 3 text blocks at once (icon
 * labels of a grid apart), every text fully visible and still for max(2.5 s ; 0.5 s per word + 1 s) (icon label 2 s),
 * texts one after the other, a fixed 0.5 s pause at the end of every scene. Times are computed from the texts.
 * Texts come from config.json → textes.<lang>.h (falling back to the other keys). The vertical format and the
 * poster keep their own scenes (scenes.js, poster.js). Never red on the dark blue: red only on white. */
(function () {
  const { el, svg, box, text, pop, fadeUp, hexBadge, hexD, EASE, show, hide, read, need, plain, PAUSE } = L;
  const BLEU = "var(--bleu)", FONCE = "var(--fonce)", ROUGE = "var(--rouge)", BLANC = "var(--blanc)";
  const SC = () => window.SCENES;                       // shared drawings: person, machine, rings, beeps, toolLevel

  function mkScene(C, cls) { const s = el("div", "scene " + cls, C.stage); gsap.set(s, { autoAlpha: 0 }); return s; }
  const fit = (C, root) => L.fitAll(root, 48);
  const abs = (n, x, y, extra) => Object.assign(n.style, { position: "absolute", left: x + "px", top: y + "px" }, extra || {});
  const Tx = (C) => Object.assign({}, C.T, C.T.h || {});
  /** an icon (pictos.js, 100×100 box) centred in a hexagon badge of width w */
  const inHex = (name, w, c, a, k = 0.62) => {
    const h = w * 1.1547, s = (w * k) / 100;
    return `<g transform="translate(${((w - 100 * s) / 2).toFixed(1)} ${((h - 100 * s) / 2).toFixed(1)}) scale(${s.toFixed(3)})">${P.icons[name] ? P.icons[name](c, a) : ""}</g>`;
  };
  const signIn = (w, size) => `<g transform="translate(${w * 0.14} ${w * 0.217}) scale(${(w * 0.72) / 200})">${P.mandatory(200).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
  /** a card comes in with a short fade and a slight zoom (no clip, no isolated outline) */
  function cardIn(tl, n, t, d = 0.3) {
    gsap.set(n, { autoAlpha: 0 });
    tl.fromTo(n, { autoAlpha: 0, scale: 0.96, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: d, ease: "power2.out" }, t);
  }
  /** show several blocks at once (read together); returns the time they are all fully visible */
  const showAll = (tl, nodes, t) => Math.max(...nodes.map((n) => show(tl, n, t)));
  const wordsOf = (nodes) => nodes.map(plain).join(" ");

  /* ========== 0. Opening: logo on a white card, title ========== */
  function S0(C, t) {
    const { W, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-dark"); gsap.set(s, { autoAlpha: 1 });
    const { w: lw, h: lh } = C.logo;
    const pad = Math.max(48, Math.round(lh * 0.42));      // clear space ≥ height of the "H" of DUMEZ
    const cw = lw + 2 * pad, ch = lh + 2 * pad, cy = 400;
    const card = box(s, (W - cw) / 2, cy - ch / 2, cw, ch, "logo-card");
    const img = el("img", "", card); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = "";
    const ttl = text(s, T.titre, "t-h1 c-blanc center", { maxW: W - 2 * C.PAD });
    abs(ttl, 0, cy + ch / 2 + 80, { width: W + "px" });
    fit(C, s);
    tl.fromTo(card, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE }, t + 0.05);
    return read(tl, ttl, t + 0.35) + PAUSE;               // fade-in: the title is never seen cut by its mask
  }

  /* ========== 1. Hook: noisy site, growing sound waves ========== */
  function S1(C, t) {
    const { W, H, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-dark");
    const aw = 1060, k = aw / 1000, ah = 700 * k, ax = W - aw - 20, ay = H - ah;
    const art = svg("svg", { width: aw, height: ah, viewBox: "0 0 1000 700" }, s); abs(art, ax, ay);
    const g = svg("g", {}, art);
    g.innerHTML = `
      <rect x="-60" y="640" width="1120" height="90" fill="${BLEU}" opacity=".6"/>
      <g stroke="${BLEU}" stroke-width="13" fill="none" stroke-linecap="round">
        <path d="M80 640 V250 M190 640 V250 M300 640 V250 M410 640 V250 M80 250 H410 M80 380 H410 M80 510 H410"/>
        <path d="M560 640 V70 M606 640 V70 M560 120 L606 170 L560 220 L606 270 L560 320 L606 370 L560 420 L606 470 L560 520 L606 570"/>
        <path d="M240 96 H980 M300 60 H900 M583 40 L300 60 M583 40 L900 60"/><path d="M850 100 V330"/></g>
      <rect x="236" y="98" width="92" height="44" rx="6" fill="${BLEU}"/>
      <rect x="806" y="330" width="88" height="54" rx="6" fill="none" stroke="${BLEU}" stroke-width="10"/>
      <g transform="translate(640 640)">${SC().machine()}
        <path d="M60 -110 L-60 -250 L-120 -130" stroke="${BLEU}" stroke-width="28" fill="none" stroke-linejoin="round"/>
        <path d="M-150 -150 L-90 -150 L-110 -90 Z" fill="${BLEU}"/></g>
      <g transform="translate(220 640)">${SC().person({ body: BLEU, ink: BLANC, tool: true, arm: "tool" })}</g>`;
    const fx = svg("g", {}, art);
    const tw = W - aw - C.PAD - 40;
    const col = box(s, C.PAD, 220, tw, null);
    const l1 = text(col, T.accroche_1, "t-big c-blanc", { maxW: tw });
    const band = el("div", "band", col, { display: "inline-block", marginTop: "44px" });
    const l2 = text(band, T.accroche_2, "t-big", { maxW: tw - 80 });
    fit(C, s);
    const r1 = read(tl, l1, t + 0.3);
    tl.fromTo(band, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.25, ease: EASE }, r1 - 0.2);
    const r2 = read(tl, l2, r1 + 0.05);
    const end = r2 + PAUSE;
    // the noise: rings from the jackhammer and the machine, the site shakes; all of it stops for the end pause
    const still = end - PAUSE;
    SC().rings(tl, fx, 290, 630, t + 0.05, still - 1.2, { red: true, max: 5 });
    SC().rings(tl, fx, 760, 470, t + 0.25, still - 1.2, { period: 0.45, max: 4, w: 6 });
    const shake = (from, to, amp, d) => { const reps = Math.max(1, Math.floor((to - from) / d) - 1); tl.fromTo(g, { x: -amp }, { x: amp, duration: d, ease: "sine.inOut", yoyo: true, repeat: reps % 2 ? reps : reps - 1 }, from); };
    shake(t + 1.2, t + 2.6, 3, 0.05); shake(t + 2.6, still - 0.1, 6, 0.04);
    tl.set(g, { x: 0, y: 0 }, still - 0.05);
    return end;
  }

  /* ========== 2. Thresholds: dB(A) scale, three levels one after the other ========== */
  function S2(C, t) {
    const { W, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-white");
    const gx = 150, gw = 70, gTop = 200, gBot = 960, ys = [850, 600, 330];        // 80, 85, 87 dB(A)
    const rowX = gx + gw + 90, rowW = W - rowX - C.PAD;
    const track = box(s, gx, gTop, gw, gBot - gTop); Object.assign(track.style, { background: "var(--bleu)", opacity: 0.14, borderRadius: gw / 2 + "px" });
    const fillB = box(s, gx, gTop, gw, gBot - gTop); Object.assign(fillB.style, { background: "var(--bleu)", borderRadius: gw / 2 + "px", transformOrigin: "50% 100%" });
    const rTop = ys[2] - gw / 2 - 20;
    const fillR = box(s, gx, rTop, gw, ys[1] - rTop); Object.assign(fillR.style, { background: "var(--rouge)", borderRadius: gw / 2 + "px", transformOrigin: "50% 100%" });
    const ticks = ys.map((y, i) => { const hb = el("div", "abs", s, { left: gx + gw / 2 - 45 + "px", top: y - 52 + "px" }); hexBadge(hb, 90, i === 2 ? ROUGE : BLEU, "", BLANC); return hb; });
    const rows = T.seuils.map((sv, i) => {
      const red = i === 2;
      const r = el("div", "abs", s, { left: rowX + "px", width: rowW + "px" });
      const inner = el("div", red ? "band" : "", r, { display: red ? "inline-flex" : "flex", alignItems: "center", gap: "40px" });
      const head = el("div", "", inner, { display: "flex", alignItems: "center", gap: "30px", flex: "none", width: "540px" });
      const v = text(head, sv.valeur, "t-big " + (red ? "c-blanc" : "c-bleu"), { maxW: 540 - (i === 1 ? 180 : 0), group: "s" + i });
      let sign = null;
      if (i === 1) { sign = el("div", "", head); sign.innerHTML = P.mandatory(150); }
      const b = text(inner, sv.texte, "t-body " + (red ? "c-blanc" : "c-fonce"), { maxW: rowW - (red ? 80 : 0) - 580, em: red ? null : "c-rouge", group: "s" + i });
      return { r, v, b, sign, band: red ? inner : null };
    });
    fit(C, s);
    rows.forEach((o, i) => { o.r.style.top = ys[i] - o.r.offsetHeight / 2 + "px"; });
    const level = (y) => (gBot - y + gw / 2) / (gBot - gTop);
    gsap.set(fillB, { scaleY: 0 }); gsap.set(fillR, { scaleY: 0 });
    gsap.set(rows.map((o) => o.band).filter(Boolean), { scaleX: 0, transformOrigin: "0% 50%" });

    tl.fromTo(track, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.5, ease: EASE }, t + 0.1);
    let c = t + 0.8;
    rows.forEach((o, i) => {
      if (i < 2) tl.to(fillB, { scaleY: level(ys[i]), duration: 0.5, ease: "power2.inOut" }, c - 0.45);
      else tl.to(fillR, { scaleY: 1, duration: 0.5, ease: "power2.inOut" }, c - 0.45);     // above 85: red
      pop(tl, ticks[i], c - 0.1, { from: 0.3, d: 0.35 });
      if (o.band) tl.to(o.band, { scaleX: 1, duration: 0.25, ease: EASE }, c - 0.05);
      if (o.sign) pop(tl, o.sign, c, { from: 0.3, d: 0.4 });
      const full = showAll(tl, [o.v, o.b], c);
      c = full + need(wordsOf([o.v, o.b]));               // value + text read as one block
    });
    return c + PAUSE;
  }

  /* ========== 2b. What damages your ears: 6 tools, heading from the start, labels kept ========== */
  function S2b(C, t) {
    const { W, H, tl, cfg } = C, T = Tx(C);
    const showDb = cfg.show_db_values !== false;
    const s = mkScene(C, "bg-white");
    const pa = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px" });
    const pb = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px" });
    gsap.set(pb, { autoAlpha: 0 });
    const ttl = text(pa, T.outils_titre, "t-h1 c-bleu", { maxW: W - 2 * C.PAD, title: true }); abs(ttl, C.PAD, 30);
    const men = text(pa, T.outils_mention, "t-small c-fonce", { maxW: W - 2 * C.PAD, title: true, min: 48, style: { fontSize: "48px", fontWeight: 700 } }); abs(men, C.PAD, 960);
    const tools = T.outils.map((o, i) => ({ ...o, i, lv: SC().toolLevel(C, o) }));
    tools.sort((a, b) => (a.lv ? 1 : 0) - (b.lv ? 1 : 0) || (a.lv && b.lv ? (a.lv.min - b.lv.min) || (a.lv.max - b.lv.max) : 0) || a.i - b.i);
    const fmt = (lv) => (lv.min === lv.max ? String(lv.min) : T.outils_plage.replace("{min}", lv.min).replace("{max}", lv.max));
    const X0 = C.PAD, Y0 = 150, GAP = 24, COLS = 3, cw = (W - 2 * C.PAD - (COLS - 1) * GAP) / COLS, chh = 360;
    const IW = 150, inner = cw - 40 - IW - 24;
    const cards = tools.map((tool, k) => {
      const over = tool.lv && tool.lv.min > 85;
      const c = el("div", "card", pa, { left: X0 + (k % COLS) * (cw + GAP) + "px", top: Y0 + Math.floor(k / COLS) * (chh + GAP) + "px", width: cw + "px", height: chh + "px", borderRadius: "30px", padding: "20px", display: "flex", gap: "24px", alignItems: "center" });
      const left = el("div", "", c, { flex: "none", width: IW + "px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" });
      const ib = el("div", "", left); hexBadge(ib, IW, BLANC, inHex(tool.id, IW, BLEU, ROUGE, 0.66));
      const marks = el("div", "", left, { display: "flex", gap: "8px", alignItems: "center" });
      if (over) { const sg = el("div", "", marks); sg.innerHTML = P.mandatory(70); }
      if (tool.lv && tool.lv.impuls) { const ip = el("div", "", marks); hexBadge(ip, 58, ROUGE, inHex("impulse", 58, BLANC, BLANC, 0.6), BLANC); }
      const col = el("div", "", c, { width: inner + "px" });
      const g = "o" + k;                                   // the card's texts are one icon label (read together)
      const nm = text(col, tool.nom, "t-body c-blanc", { maxW: inner, label: true, group: g, style: { fontWeight: 800 } });
      let vs = !tool.lv ? T.outils_bruyant : showDb ? T.outils_valeur.replace("{v}", fmt(tool.lv)) : over ? T.outils_tres_bruyant : T.outils_bruyant;
      const val = text(col, vs, "t-small c-blanc", { label: true, group: g, style: { fontWeight: 650, marginTop: "6px" } });
      const imp = tool.lv && tool.lv.impuls ? text(col, T.outils_coup_sec, "t-small c-blanc", { maxW: inner, label: true, group: g, style: { fontWeight: 800 } }) : null;
      return { c, ib, marks, nm, val, imp, over, col, g };
    });
    // phase B: level × time, then the neighbour's noise
    const lc = el("div", "abs", pb, { left: C.PAD + "px", top: "230px", width: "840px" });
    const ic = el("div", "", lc, { display: "flex", alignItems: "center", gap: "26px", marginBottom: "46px" });
    const i1 = el("div", "", ic); hexBadge(i1, 150, BLEU, inHex("level", 150, BLANC, ROUGE, 0.6));
    const plus = el("div", "", ic, { fontSize: "84px", fontWeight: 900, color: "var(--bleu)" }); plus.textContent = "+";
    const i2 = el("div", "", ic); hexBadge(i2, 150, BLEU, inHex("clock", 150, BLANC, ROUGE, 0.6));
    const msg2 = text(lc, T.outils_message_2, "t-big c-bleu", { maxW: 840, em: "c-rouge" });
    const card = el("div", "abs", pb, { left: "1010px", top: "120px", width: W - 1010 - C.PAD + "px", height: "820px", background: "var(--blanc)", border: "8px solid var(--bleu)", borderRadius: "36px", overflow: "hidden" });
    const ill = svg("svg", { width: W - 1010 - C.PAD - 16, height: 470, viewBox: "0 0 800 470" }, card); ill.style.marginTop = "20px";
    ill.innerHTML = `<g class="fx"></g><rect x="20" y="440" width="760" height="14" rx="7" fill="${FONCE}"/>
      <g transform="translate(250 440)">${SC().person({ body: BLEU, ink: FONCE, tool: true, arm: "tool", muffs: true })}</g>
      <g transform="translate(560 440)"><g transform="scale(-1 1)">${SC().person({ body: BLEU, ink: FONCE })}</g></g>
      <g class="hit" stroke="${ROUGE}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0">
        <path d="M508 150 l-8 -7 l-8 7 l-8 -7"/><path d="M510 172 l-9 -6 l-9 6 l-9 -6"/><path d="M508 194 l-8 -7 l-8 7 l-8 -7"/></g>`;
    const vtx = text(card, T.outils_voisin, "t-big c-fonce center", { maxW: W - 1010 - C.PAD - 70, style: { marginTop: "26px" } });
    fit(C, s);
    // a value that does not fit on one line breaks before its unit ("≈ 94 à 100" / "dB(A)")
    cards.forEach((o) => {
      const ln = o.val.querySelector(".ln");
      if (ln.getBoundingClientRect().width > inner + 1 && / [^ ]+$/.test(ln.textContent)) {
        const nv = text(o.col, ln.textContent.replace(/ ([^ ]+)$/, "\n$1"), "t-small c-blanc", { label: true, group: o.g, style: { fontWeight: 650, marginTop: "6px" } });
        o.col.insertBefore(nv, o.val); o.val.remove(); o.val = nv;
      }
      o.val.dataset.maxw = inner;
    });
    fit(C, s);
    cards.forEach((o) => { if (o.c.scrollHeight > o.c.clientHeight + 1) L.report("débordement", o.c, `carte : ${o.c.scrollHeight} px > ${o.c.clientHeight} px`); });

    show(tl, ttl, t + 0.05);                               // heading and "Ordres de grandeur." from the start
    show(tl, men, t + 0.1);
    let c = t + 0.15;
    cards.forEach((o, k) => {
      const at = k ? c - 0.25 : c;
      cardIn(tl, o.c, at);
      pop(tl, o.ib, at + 0.05, { from: 0.5, d: 0.3 });
      if (o.over) {
        tl.fromTo(o.c, { boxShadow: `0 0 0 0px ${cfg.palette.rouge}` }, { boxShadow: `0 0 0 8px ${cfg.palette.rouge}`, duration: 0.25 }, at + 0.15);
        pop(tl, o.marks, at + 0.2, { from: 0.3, d: 0.3 });
      }
      const full = showAll(tl, [o.nm, o.val, o.imp].filter(Boolean), at + 0.2);
      c = full + (k === cards.length - 1 ? 4.0 : 2.5);       // 2.5 s per card, then the full grid at least 4 s
    });
    // phase B
    tl.to(pa, { autoAlpha: 0, y: -30, duration: 0.35, ease: "power2.in" }, c);
    tl.set(pb, { autoAlpha: 1 }, c + 0.35);
    pop(tl, i1, c + 0.35, { from: 0.4, d: 0.3 }); fadeUp(tl, plus, c + 0.4, { y: 10, d: 0.3 }); pop(tl, i2, c + 0.45, { from: 0.4, d: 0.3 });
    const r1 = read(tl, msg2, c + 0.4);
    tl.fromTo(card, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: EASE }, r1 - 0.3);
    const r2 = read(tl, vtx, r1);
    const end = r2 + PAUSE;
    SC().rings(tl, ill.querySelector(".fx"), 320, 420, r1 - 0.2, end - PAUSE - 1.1, { color: ROUGE, max: 6, period: 0.3, life: 1.1, w: 6, r: 36 });
    tl.to(ill.querySelector(".hit"), { opacity: 1, duration: 0.25 }, r1 + 0.2);
    tl.fromTo(ill.querySelectorAll(".hit path"), { x: 0 }, { x: -6, duration: 0.1, yoyo: true, repeat: Math.max(1, Math.floor((end - PAUSE - r1 - 0.4) / 0.1) - 1) | 1, ease: "sine.inOut" }, r1 + 0.2);
    return end;
  }

  /* ========== 3a. For your ears: heading and first item from the start ========== */
  function S3a(C, t) {
    const { W, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-dark");
    const head = el("div", "abs", s, { left: C.PAD + "px", top: "50px", display: "flex", alignItems: "center", gap: "32px" });
    const dg = el("div", "", head); dg.innerHTML = P.danger(120);
    const ttl = text(head, T.oreille_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD - 190, title: true });
    // hearing curve (qualitative: no values, no label)
    const cw = 820, chh = 620, cx0 = C.PAD, cy0 = 240;
    const cv = svg("svg", { width: cw, height: chh, viewBox: `0 0 ${cw} ${chh}` }, s); abs(cv, cx0, cy0);
    const yA = chh * 0.22, yB = chh * 0.9;
    cv.innerHTML = `<path d="M4 ${chh - 4} H${cw - 4}" stroke="${BLEU}" stroke-width="6" stroke-linecap="round"/><path d="M4 ${chh - 4} V8" stroke="${BLEU}" stroke-width="6" stroke-linecap="round"/>
      <path class="cur" d="M30 ${yA} C${cw * 0.3} ${yA} ${cw * 0.42} ${yA + 6} ${cw * 0.55} ${yA + chh * 0.12} S${cw * 0.8} ${yB - chh * 0.1} ${cw - 40} ${yB}" fill="none" stroke="${BLANC}" stroke-width="14" stroke-linecap="round"/>`;
    const earBox = el("div", "abs", s, { left: cx0 + cw - 230 + "px", top: cy0 + "px" });
    earBox.innerHTML = P.icon("tinnitus", 190, BLANC, BLANC);
    const lx = 980, lw = W - lx - C.PAD;
    const list = el("div", "abs", s, { left: lx + "px", top: "230px", width: lw + "px", display: "flex", flexDirection: "column", gap: "28px", alignItems: "flex-start" });
    const ICONS = ["tinnitus", "earTired", "earPain", "earLoss"];
    const items = T.oreille.map((it, i) => {
      const last = i === T.oreille.length - 1;
      // the last one on a white panel, in red (red text only on white)
      const row = el("div", "", list, { display: "flex", alignItems: "center", gap: "28px", background: last ? "var(--blanc)" : "transparent", borderRadius: "26px", padding: last ? "14px 26px" : "0" });
      const hb = el("div", "", row, { flex: "none" }); hexBadge(hb, 104, last ? BLEU : BLANC, inHex(ICONS[i % 4], 104, last ? BLANC : FONCE, last ? BLANC : ROUGE, 0.66));
      const col = el("div", "", row);
      const tw = lw - 104 - 28 - (last ? 52 : 0);
      const a = text(col, it.texte, "t-body " + (last ? "c-rouge" : "c-blanc"), { maxW: tw, label: true, group: "e" + i, style: { fontWeight: 800 } });
      const b = it.detail ? text(col, it.detail, "t-small c-blanc", { maxW: tw, label: true, group: "e" + i, style: { fontWeight: 600, marginTop: "4px" } }) : null;
      gsap.set(row, { autoAlpha: 0 });
      return { row, hb, parts: [a, b].filter(Boolean) };
    });
    fit(C, s);
    tl.fromTo(dg, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)", transformOrigin: "50% 60%" }, t + 0.05);
    show(tl, ttl, t + 0.05);                               // title and first item right away: no empty screen
    const cur = cv.querySelector(".cur"), Lc = cur.getTotalLength();
    tl.fromTo(cur, { strokeDasharray: Lc, strokeDashoffset: Lc }, { strokeDashoffset: 0, duration: 2.6, ease: "power1.inOut" }, t + 0.1);
    pop(tl, earBox, t + 0.1, { from: 0.5, d: 0.35 });
    let c = t + 0.15;
    items.forEach((o) => {
      tl.fromTo(o.row, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, c);
      pop(tl, o.hb, c, { from: 0.4, d: 0.3 });
      c = c + 0.3 + Math.max(2.5, need(wordsOf(o.parts)));   // each item at least 2.5 s before the next
    });
    const end = c + PAUSE;
    const zigs = earBox.querySelectorAll("svg > g:last-child path");
    tl.fromTo(zigs, { scaleX: 0.6, opacity: 0.5, transformOrigin: "0% 50%" }, { scaleX: 1.1, opacity: 1, duration: 0.12, yoyo: true, repeat: (Math.max(1, Math.floor((end - PAUSE - t - 0.6) / 0.12) - 2) | 1), ease: "sine.inOut", stagger: 0.04 }, t + 0.3);
    return end;
  }

  /* ========== 3b. Body & safety, the reversing machine, then organised; the strong message ========== */
  function S3b(C, t) {
    const { W, H, tl, cfg } = C, T = Tx(C);
    const s = mkScene(C, "bg-white");
    const ttl = text(s, T.corps_titre, "t-h1 c-bleu", { maxW: W - 2 * C.PAD, title: true }); abs(ttl, C.PAD, 50);
    const row = el("div", "abs", s, { left: C.PAD + "px", width: W - 2 * C.PAD + "px", top: "360px", display: "flex", justifyContent: "space-around" });
    const IC = ["stress", "battery", "sleep"];
    const body = T.corps.map((lab, i) => {
      const c = el("div", "", row, { display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", width: "420px" });
      const hb = el("div", "", c); hexBadge(hb, 230, BLEU, inHex(IC[i], 230, BLANC, BLANC, 0.6));
      const lt = text(c, lab, "t-big c-fonce center", { maxW: 420, label: true });
      gsap.set(hb, { autoAlpha: 0 });
      return { hb, lt };
    });
    // the scene: worker with a jackhammer, colleague / signaller, reversing machine, a real labelled safe zone
    const aw = 1000, ah = 650, ax = 30, ay = H - ah - 30;
    const art = svg("svg", { width: aw, height: ah, viewBox: "0 0 1000 650" }, s); abs(art, ax, ay);
    art.innerHTML = `
      <rect x="-40" y="560" width="1080" height="16" rx="8" fill="${FONCE}"/>
      <g class="safe" opacity="0"><rect x="150" y="380" width="250" height="180" rx="14" fill="none" stroke="${BLEU}" stroke-width="8" stroke-dasharray="20 14"/></g>
      <g class="mach" transform="translate(1100 560)">${SC().machine({ gyro: true })}</g>
      <g class="col" transform="translate(110 560)"><g class="fl">${SC().person({ body: BLEU, ink: FONCE, paddle: true })}</g></g>
      <g class="wk" transform="translate(470 560)">
        <g class="fl-l" transform="scale(-1 1)">${SC().person({ body: BLEU, ink: FONCE, tool: true, arm: "tool" })}</g>
        <g class="fl-r" visibility="hidden">${SC().person({ body: BLEU, ink: FONCE, tool: true, arm: "tool" })}</g></g>
      <g class="fx"></g>`;
    const mach = art.querySelector(".mach"), wk = art.querySelector(".wk"), col = art.querySelector(".col");
    const wkL = wk.querySelector(".fl-l"), wkR = wk.querySelector(".fl-r"), muffs = wk.querySelectorAll(".muffs");
    const gyro = mach.querySelector(".gyro"), rays = mach.querySelector(".rays"), colArm = col.querySelector(".arm"), safe = art.querySelector(".safe");
    const wkTool = wkL.querySelector(".tool"), fx = art.querySelector(".fx");
    const k = aw / 1000;
    const flash = el("div", "abs", s, { left: 0, top: 0, width: W + "px", height: H + "px", background: "var(--rouge)", opacity: 0 });   // under the texts
    const warn = el("div", "abs", s, { left: ax + 600 * k - 90 + "px", top: ay + 150 * k + "px" }); warn.innerHTML = P.danger(180);
    const ok = el("div", "abs", s, { left: ax + 700 * k + "px", top: ay + 120 * k + "px" }); hexBadge(ok, 150, BLEU, inHex("check", 150, BLANC, BLANC, 0.66));
    const tx = 1045, tw = W - tx - C.PAD, ty = 300;
    const bad = el("div", "abs", s, { left: tx + "px", top: ty + "px", width: tw + "px", borderLeft: "14px solid var(--rouge)", paddingLeft: "34px" });
    const badT = text(bad, T.danger_texte, "t-body c-fonce", { maxW: tw - 48, style: { fontWeight: 800 } });
    const good = el("div", "abs", s, { left: tx + "px", top: ty + "px", width: tw + "px" });
    const goodT = text(good, T.bonne_orga_texte, "t-big c-bleu", { maxW: tw, group: "bon" });
    const zl = text(s, T.zone_sure, "t-small c-bleu center", { maxW: 380 * k, group: "bon", style: { fontWeight: 800 } });
    abs(zl, ax + 85 * k, ay + 300 * k, { width: 380 * k + "px" });   // centred over the dashed zone (x 150–400)
    // strong message: a red hexagon covers the frame in 0.3 s, the text is there as soon as the red is
    const R = (Math.hypot(W, H) / 2) / (Math.sqrt(3) / 2) * 1.06;
    const big = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(big, 0, 0);
    big.innerHTML = `<g transform="translate(${W / 2} ${H / 2})"><g class="bg"><path d="${hexD(0, 0, R, 0.04)}" fill="${ROUGE}"/></g></g>`;
    const msg = text(s, T.message_fort, "t-big c-blanc center", { maxW: W - 2 * C.PAD });
    fit(C, s);
    abs(msg, 0, (H - msg.offsetHeight) / 2, { width: W + "px" });
    gsap.set([art, bad, good, warn, ok, big], { autoAlpha: 0 }); gsap.set(flash, { visibility: "hidden" });
    gsap.set(big.querySelector(".bg"), { scale: 0, transformOrigin: "50% 50%" });
    gsap.set([zl.querySelectorAll(".ln")], { opacity: 0 });

    // A. stress, fatigue, sleep: 2.5 s each, then the three together at least 3 s
    show(tl, ttl, t + 0.05);
    let c = t + 0.15;
    body.forEach((o, i) => {
      pop(tl, o.hb, c, { from: 0.4, d: 0.3 });
      const full = show(tl, o.lt, c + 0.05);
      c = full + (i === body.length - 1 ? 3.0 : 2.5);
    });
    // B. without organisation: the reversing machine is not heard
    tl.to([row, ttl], { autoAlpha: 0, duration: 0.3 }, c);
    const b = c + 0.3;
    tl.fromTo(art, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, b);
    tl.set(gyro, { autoAlpha: 0 }, b);
    tl.fromTo(mach, { x: 1100 }, { x: 600, duration: 3.0, ease: "power1.out" }, b);
    const beepG = svg("g", {}, fx);
    SC().beeps(tl, beepG, 0, 0, b + 0.2, b + 3.0, { reach: 120 });
    tl.fromTo(beepG, { x: 1090, y: 470 }, { x: 590, y: 470, duration: 3.0, ease: "power1.out" }, b);
    tl.fromTo(wkTool, { y: 0 }, { y: -6, duration: 0.05, yoyo: true, repeat: 59, ease: "none" }, b);
    SC().rings(tl, fx, 470, 300, b, b + 2.6, { color: ROUGE, red: false, max: 2.4, period: 0.22, life: 0.6, w: 6, r: 40 });
    tl.fromTo(colArm, { rotation: 0 }, { rotation: -150, duration: 0.35, svgOrigin: "0 -225", ease: "power2.out" }, b + 1.0);
    SC().rings(tl, fx, 150, 290, b + 1.1, b + 2.6, { color: BLEU, max: 1.8, period: 0.3, life: 0.5, w: 5, r: 30 });
    tl.set(bad, { autoAlpha: 1 }, b + 0.2);
    const rB = read(tl, badT, b + 0.2);                    // "On n'entend plus l'alarme, l'engin qui recule, son collègue."
    tl.set(flash, { visibility: "visible" }, b + 2.9);
    tl.fromTo(flash, { opacity: 0 }, { opacity: 0.18, duration: 0.18, yoyo: true, repeat: 3, ease: "power1.inOut" }, b + 2.9);
    tl.set(flash, { visibility: "hidden" }, b + 3.65);
    pop(tl, warn, b + 2.9, { from: 0.2, d: 0.4 });
    // C. organised: adapted protection, visible signals, signaller; the worker turns round and steps into the safe zone
    tl.to([art, bad, warn], { autoAlpha: 0, duration: 0.25 }, rB);
    const g = rB + 0.3;
    tl.set(mach, { x: 1100 }, g); tl.set(beepG, { autoAlpha: 0 }, g); tl.set(colArm, { rotation: 0, svgOrigin: "0 -225" }, g);
    tl.set(muffs, { visibility: "visible" }, g); tl.set(gyro, { autoAlpha: 1 }, g); tl.set(safe, { opacity: 1 }, g);
    tl.to(art, { autoAlpha: 1, duration: 0.3 }, g);
    tl.set(good, { autoAlpha: 1 }, g);
    const fullG = showAll(tl, [goodT, zl], g + 0.1);
    const rC = fullG + Math.max(4, need(wordsOf([goodT, zl])));   // "Protection adaptée + signaux visibles" + "Zone sûre"
    tl.fromTo(mach, { x: 1100 }, { x: 640, duration: 2.6, ease: "power1.inOut" }, g + 0.1);
    const rr = Math.max(1, Math.floor((rC - g - 0.6) / 0.18) - 1) | 1;
    tl.fromTo(rays, { opacity: 0.15 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: rr, ease: "none" }, g + 0.2);
    tl.to(colArm, { rotation: -150, duration: 0.4, svgOrigin: "0 -225", ease: "power2.out" }, g + 0.5);
    tl.set(wkL, { visibility: "hidden" }, g + 1.1); tl.set(wkR, { visibility: "visible" }, g + 1.1);   // he turns round…
    tl.fromTo(wk, { x: 470 }, { x: 275, duration: 1.2, ease: "power2.inOut" }, g + 1.4);            // …and steps into the safe zone
    tl.fromTo(wkR.querySelector(".legs"), { y: 0 }, { y: -8, duration: 0.12, yoyo: true, repeat: 9, ease: "sine.inOut" }, g + 1.4);
    pop(tl, ok, g + 2.8, { from: 0.2, d: 0.4 });
    // D. the strong message
    tl.set(big, { autoAlpha: 1 }, rC);
    tl.to(big.querySelector(".bg"), { scale: 1, duration: 0.3, ease: "power2.in" }, rC);
    tl.set([art, good, zl, ok], { autoAlpha: 0 }, rC + 0.3);   // gone once the red covers the frame
    const rD = read(tl, msg, rC + 0.3, { hold: 3, d: 0.001, stagger: 0 });   // there as soon as the red is
    return rD + PAUSE;
  }

  /* ========== 4. Good habits: five cards, at least 4.5 s each ========== */
  function S4(C, t) {
    const { W, H, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-dark");
    const ttl = text(s, T.reflexes_titre, "t-h1 c-blanc", { maxW: W - 2 * C.PAD, title: true }); abs(ttl, C.PAD, 40);
    const cx = C.PAD, cy = 170, cw = W - 2 * cx, ch = 760, N = T.reflexes.length;
    const prog = el("div", "abs", s, { left: 0, width: W + "px", top: cy + ch + 40 + "px", display: "flex", justifyContent: "center", gap: "26px" });
    const dots = T.reflexes.map(() => { const d = el("div", "", prog); hexBadge(d, 40, BLANC); gsap.set(d, { opacity: 0.25 }); return d; });
    const BIG = ["", "earPlug", "clock", "renew", ""];
    const cards = T.reflexes.map((rf, i) => {
      const c = el("div", "card", s, { left: cx + "px", top: cy + "px", width: cw + "px", height: ch + "px", borderRadius: "44px" });
      const nb = el("div", "num", c, { left: "44px", top: "36px" });
      hexBadge(nb, 100, BLANC, `<text x="50" y="77" text-anchor="middle" font-family="Inter" font-weight="900" font-size="56" fill="${BLEU}">${i + 1}</text>`);
      const o = { c, nb, parts: [], types: [] };
      if (i === 0) {
        const tt = text(c, rf.titre, "t-big c-blanc", { maxW: cw - 260, title: true }); abs(tt, 200, 50, { width: cw - 260 + "px" });
        const grid = el("div", "types", c, { position: "absolute", left: "40px", right: "40px", top: "320px", gridTemplateColumns: "1fr 1fr 1fr 1fr" });
        const TY = ["plugs", "cordPlugs", "helmetMuffs", "headband"];
        rf.types.forEach((lab, k) => {
          const cell = el("div", "type", grid, { gap: "18px" });
          const hb = el("div", "", cell); hexBadge(hb, 200, BLANC, inHex(TY[k], 200, BLEU, BLEU, 0.6));
          const lt = text(cell, lab, "t-small c-blanc center", { maxW: 380, label: true, group: "types", style: { fontWeight: 750 } });
          o.types.push({ hb, lt });
        });
        o.parts = [tt];
      } else {
        const pic = el("div", "abs", c, { left: "110px", top: "50%", marginTop: "-219px" });
        const pw = 380;
        hexBadge(pic, pw, BLANC, i === 4 ? signIn(pw) : inHex(BIG[i], pw, BLEU, i === 1 ? BLEU : ROUGE, 0.6));
        // extra badges sit on the LEFT side of the picture: they never cover a text
        if (i === 4) { const pz = el("div", "abs", pic, { left: "-24px", bottom: "10px" }); hexBadge(pz, 140, ROUGE, inHex("pause", 140, BLANC, BLANC, 0.6), BLANC); o.extra = pz; }
        if (i === 1) { const ck = el("div", "abs", pic, { left: "-20px", bottom: "0px" }); hexBadge(ck, 130, BLEU, inHex("check", 130, BLANC, BLANC, 0.7), BLANC); o.extra = ck; }
        const txt = el("div", "abs", c, { left: "600px", width: cw - 680 + "px", top: "0", bottom: "0", display: "flex", flexDirection: "column", justifyContent: "center" });
        const tt = text(txt, rf.titre, "t-big c-blanc", { maxW: cw - 680, group: "r" + i });
        const ls = rf.lignes.map((l, k) => text(txt, l, "t-body c-blanc", { maxW: cw - 680, group: "r" + i, style: { fontWeight: 700, marginTop: k ? "18px" : "34px" } }));
        o.parts = [tt, ...ls]; o.pic = pic;
      }
      gsap.set(c, { autoAlpha: 0 });
      return o;
    });
    fit(C, s);
    show(tl, ttl, t + 0.05);
    let c = t + 0.15;
    cards.forEach((o, i) => {
      if (i) tl.to(cards[i - 1].c, { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, c);
      const at = c + (i ? 0.1 : 0);
      cardIn(tl, o.c, at);
      tl.to(dots[i], { opacity: 1, duration: 0.25 }, at); if (i) tl.to(dots[i - 1], { opacity: 0.55, duration: 0.25 }, at);
      pop(tl, o.nb, at + 0.15, { from: 0.4, d: 0.3 });
      if (o.pic) pop(tl, o.pic, at + 0.1, { from: 0.7, d: 0.35 });
      if (o.extra) pop(tl, o.extra, at + 0.3, { from: 0.3, d: 0.3 });
      const full = showAll(tl, o.parts, at + 0.2);
      // the four protector types: pictures pop one after the other, their names arrive together (read as one block)
      o.types.forEach((ty, k) => pop(tl, ty.hb, full + k * 0.12, { from: 0.4, d: 0.3 }));
      if (o.types.length) showAll(tl, o.types.map((ty) => ty.lt), full + 0.1);
      c = full + Math.max(4.5, need(wordsOf(o.parts)));       // at least 4.5 s per card
    });
    // the last card and the page dots leave together, in a fade, while the next transition starts
    tl.to([cards[N - 1].c, prog], { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, c + PAUSE);
    return c + PAUSE;
  }

  /* ========== 5. Final message + logo, centred ========== */
  function S5(C, t) {
    const { W, H, tl } = C, T = Tx(C);
    const s = mkScene(C, "bg-white");
    const grp = el("div", "abs", s, { left: 0, top: 0, width: W + "px" });
    const row = el("div", "", grp, { display: "flex", alignItems: "center", justifyContent: "center", gap: "90px" });
    const sign = el("div", "", row, { flex: "none" }); sign.innerHTML = P.mandatory(440);
    const TW = 1000, col = el("div", "", row, { width: TW + "px" });
    const f1 = text(col, T.final_1, "t-big c-bleu", { maxW: TW, style: { fontSize: "100px" } });
    const f2 = text(col, T.final_2, "t-big c-rouge", { maxW: TW, style: { fontSize: "100px", marginTop: "50px" } });
    const { w: lw, h: lh } = C.logo;                       // already capped at 1.3x its file size
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
    return read(tl, f2, r1) + PAUSE;
  }

  /* ========== 6. Closing: sound waves close in on the logo's own hexagon, then the logo ========== */
  function S6(C, t) {
    const { W, H, tl, cfg } = C, T = Tx(C);
    const s = mkScene(C, "bg-white");
    const blue = cfg.palette.bleu, red = cfg.palette.rouge;
    const { w: lw, h: lh } = C.logo;
    const lx = Math.round((W - lw) / 2), ly = Math.round(H * 0.38);
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
    // the hexagon of the logo, measured from the logo file (main.js), in screen pixels
    const k = C.logo.scale || 1, hx = C.logo.hex || { x0: 0, x1: 108, y0: 0, y1: 120, gap0: 74, gap1: 87 };
    const cx = lx + ((hx.x0 + hx.x1) / 2) * k, cy = ly + ((hx.y0 + hx.y1) / 2) * k;
    const R = Math.max(((hx.x1 - hx.x0) * k) / Math.sqrt(3), ((hx.y1 - hx.y0) * k) / 2);
    const g0 = ly + hx.gap0 * k, g1 = ly + hx.gap1 * k, yTop = cy - R, yBot = cy + R;
    const d = hexD(cx, cy, R, 0.1);
    const art = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, s); abs(art, 0, 0);
    // exact logo colours: every part is a solid fill revealed by a growing clip (no opacity, no colour tween)
    art.innerHTML = `<defs>
        <clipPath id="c6a" clipPathUnits="userSpaceOnUse"><rect class="ra" x="0" y="${yTop - 2}" width="${W}" height="0"/></clipPath>
        <clipPath id="c6b" clipPathUnits="userSpaceOnUse"><rect class="rb" x="0" y="${g1}" width="${W}" height="0"/></clipPath>
        <clipPath id="c6c" clipPathUnits="userSpaceOnUse"><rect class="rc" x="0" y="${g1}" width="${W}" height="0"/></clipPath></defs>
      <g class="rings"></g>
      <g class="hex"><path class="ol" d="${d}" fill="none" stroke="${blue}" stroke-width="6" stroke-linejoin="round"/>
        <path d="${d}" fill="${blue}" clip-path="url(#c6a)"/><path d="${d}" fill="${blue}" clip-path="url(#c6b)"/><path d="${d}" fill="${red}" clip-path="url(#c6c)"/></g>`;
    const hex = art.querySelector(".hex"), ol = art.querySelector(".ol"), rg = art.querySelector(".rings");
    gsap.set(lc, { autoAlpha: 0 });
    const Lo = ol.getTotalLength();
    // 1. sound waves (echo of the hook) close in on the hexagon
    for (let i = 0; i < 5; i++) {
      const c = svg("circle", { cx, cy, r: R * 1.25, fill: "none", stroke: i % 2 ? red : blue, "stroke-width": 7 }, rg);
      tl.fromTo(c, { scale: 9 - i, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.in" }, t + 0.1 + i * 0.1);
      tl.to(c, { opacity: 0, duration: 0.15 }, t + 0.9 + i * 0.1);
    }
    // 2. the outline is drawn in blue, the top fills blue, the bottom fills blue then red (as in the logo)
    tl.fromTo(ol, { strokeDasharray: Lo, strokeDashoffset: Lo }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut" }, t + 1.05);
    tl.to(art.querySelector(".ra"), { attr: { height: g0 - yTop + 2 }, duration: 0.3, ease: "power1.inOut" }, t + 1.5);
    tl.to(art.querySelector(".rb"), { attr: { height: yBot - g1 + 2 }, duration: 0.2, ease: "power1.inOut" }, t + 1.75);
    tl.set(ol, { visibility: "hidden" }, t + 1.95);
    tl.to(art.querySelector(".rc"), { attr: { height: yBot - g1 + 2 }, duration: 0.3, ease: "power1.inOut" }, t + 2.0);
    // 3. the logo fades in exactly on that hexagon (same size, same place), then the drawing is removed
    tl.fromTo(lc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, t + 2.4);
    tl.set(hex, { visibility: "hidden" }, t + 2.85);
    const rt = read(tl, txt, t + 2.9);
    if (credit) fadeUp(tl, credit, rt, { y: 16 });
    const end = (credit ? read(tl, credit.querySelector(".tx"), rt) : rt) + 1.0;   // then hold the last image 1 s
    tl.to({}, { duration: 0.01 }, end - 0.01);
    return end;
  }

  window.SCENES_H = { S0, S1, S2, S2b, S3a, S3b, S4, S5, S6 };
})();
