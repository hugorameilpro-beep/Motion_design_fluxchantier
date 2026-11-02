/* A3 portrait poster (1240×1754 CSS px, screenshotted at 3508×4961): main message, thresholds, good habits.
 * Built from the same texts, pictograms and hexagon motif as the video. */
(function () {
  const { el, text, hexBadge } = L;
  const BLEU = "var(--bleu)", ROUGE = "var(--rouge)", BLANC = "var(--blanc)";
  const ICONS = ["helmetMuffs", "earPlug", "clock", "renew", "pause"];

  window.POSTER = function (C) {
    const { stage, T, W, cfg } = C;
    const P0 = 70, IW = W - 2 * P0;
    const sec = (top, h, bg) => el("div", "poster-sec", stage, { top: top + "px", height: h + "px", background: bg || "transparent" });

    // 1. header
    const hd = sec(0, 345, "var(--fonce)");
    const ht = el("div", "abs", hd, { left: P0 + "px", top: "56px", width: IW - 330 + "px" });
    text(ht, T.titre, "t-h1 c-blanc", { maxW: IW - 330 });
    text(ht, T.sous_titre, "t-body c-blanc", { maxW: IW - 330, style: { marginTop: "22px", fontWeight: 650, opacity: 0.9 } });
    const sg = el("div", "abs", hd, { right: P0 + "px", top: "40px" }); sg.innerHTML = P.mandatory(265);

    // 2. main message
    const mm = sec(345, 180, "var(--bleu)");
    const mt = el("div", "abs", mm, { left: P0 + "px", width: IW + "px", top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" });
    text(mt, T.final_1, "t-big c-blanc center", { maxW: IW });

    // 3. thresholds
    const st = sec(560, 400);
    text(st, T.seuils_titre, "t-big c-bleu", { maxW: IW, style: { position: "absolute", left: P0 + "px", top: 0 } });
    const colS = el("div", "abs", st, { left: P0 + "px", width: IW + "px", top: "92px" });
    const cards = el("div", "", colS, { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" });
    T.seuils.forEach((sv, i) => {
      const fill = i === 0 ? "transparent" : i === 1 ? BLEU : ROUGE;
      const c = el("div", "", cards, { background: fill, border: i === 0 ? "6px solid var(--bleu)" : "6px solid transparent", borderRadius: "26px", padding: "26px 24px 30px", position: "relative", minHeight: "236px" });
      text(c, sv.valeur, "t-big " + (i ? "c-blanc" : "c-bleu"), { maxW: 300 });
      text(c, sv.texte, "t-body " + (i ? "c-blanc" : "c-fonce"), { maxW: 300, style: { marginTop: "14px" } });
      if (i === 1) { const s = el("div", "", c, { marginTop: "14px" }); s.innerHTML = P.mandatory(80); }
    });
    text(colS, T.seuils_duree + "  ·  " + T.seuils_crete, "t-small c-fonce", { wrap: true, maxW: IW, style: { marginTop: "18px", fontWeight: 650 } });

    // 4. good habits
    const gh = sec(1020, 480);
    text(gh, T.reflexes_titre, "t-big c-bleu", { maxW: IW, style: { position: "absolute", left: P0 + "px", top: 0 } });
    const grid = el("div", "abs", gh, { left: P0 + "px", width: IW + "px", top: "92px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 40px" });
    T.reflexes.forEach((rf, i) => {
      const it = el("div", "", grid, { display: "flex", alignItems: "center", gap: "24px" });
      const hb = el("div", "", it, { flex: "none" });
      hexBadge(hb, 96, BLEU, `<g transform="translate(19 26) scale(.58)">${i === 4 ? P.icons.pause(BLANC) : P.icons[ICONS[i]](BLANC, BLANC)}</g>`);
      const tt = el("div", "", it, { display: "flex", alignItems: "center", gap: "14px" });
      text(tt, (i + 1) + ".", "t-body c-bleu", { style: { fontWeight: 900 } });
      text(tt, rf.titre, "t-body c-fonce", { maxW: 400 });
    });

    // 5. closing message + logos on white
    const ft = sec(1528, 96, "var(--rouge)");
    const ftt = el("div", "abs", ft, { left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" });
    text(ftt, T.final_2.replace(/\n/g, " "), "t-big c-blanc center", { maxW: IW, style: { fontSize: "52px" } });
    const lg = sec(1624, 130, BLANC);
    const row = el("div", "abs", lg, { left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "50px" });
    const { w: lw, h: lh } = C.logo;
    if (lw) { const img = el("img", "", row); img.src = C.logo.src; img.width = lw; img.height = lh; img.alt = ""; }
    if (C.logoChantier) { const i2 = el("img", "", row); i2.src = C.logoChantier.src; i2.width = C.logoChantier.w; i2.height = C.logoChantier.h; }
    if (cfg.show_synapsis_credit) {
      const cr = el("div", "", row, { display: "flex", alignItems: "center", gap: "12px" });
      const ci = el("img", "", cr, { height: "40px" }); ci.src = "../" + cfg.logos.synapsis;
      text(cr, T.credit, "t-small c-fonce", { style: { fontSize: "22px", fontWeight: 650 } });
    }
    L.fitAll(stage, 22);
    // good habits start right under the thresholds; they must end above the red closing band
    gh.style.top = st.offsetTop + colS.offsetTop + colS.offsetHeight + 44 + "px";
    const bottom = gh.offsetTop + grid.offsetTop + grid.offsetHeight;
    if (bottom > ft.offsetTop - 16) L.report("débordement", grid, `bons réflexes : bas à ${bottom} px > ${ft.offsetTop - 16} px`);
    gsap.set(stage.querySelectorAll(".ln"), { yPercent: 0 });
  };
})();
