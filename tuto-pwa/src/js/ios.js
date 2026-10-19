/* iPhone / Safari tutorial: screens + timeline. */
(function () {
  const { el, esc, ICON, header, phone, home, rect, zoom, fingerIn, fingerTo, fingerOut, tap, halo, headerSwap, EASE, OUT, SOFT } = window.UI;

  const STEPS = [
    { num: 1, title: ["Ouvrez le lien", "dans Safari"], note: ["Pas Chrome, pas Instagram :", "uniquement Safari"], warn: true },
    { num: 2, title: ["Touchez le bouton", "Partager"], note: ["Pas visible ? Il est parfois", "dans le menu •••"] },
    { num: 3, title: ["Faites défiler, puis", "« Sur l'écran d'accueil »"] },
    { num: 4, title: ["Touchez « Ajouter »", "en haut à droite"] },
    { num: 5, title: ["C'est prêt !"], note: ["L'app est sur", "votre écran d'accueil"] },
  ];

  function screens(cfg) {
    const icon = (s) => `<div class="icon-app" style="width:${s}px;height:${s}px"><img src="../${esc(cfg.icon)}" alt=""></div>`;
    const safari = el("div", "screen-layer");
    const tile = (bg) => `<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><i style="width:96px;height:96px;border-radius:24px;background:${bg};display:block"></i><s style="display:block;width:70px;height:12px;border-radius:6px;background:#E3EAE8"></s></div>`;
    safari.innerHTML = `
      <div class="s-page">
        <div id="i-start" style="position:absolute;inset:0;background:#fff;padding:120px 40px 0">
          <div style="font-size:34px;font-weight:800;color:#10221F">Favoris</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px 10px;margin-top:30px;justify-items:center">
            ${tile("#E6ECEA")}${tile("#EEF2F1")}${tile("#E6ECEA")}${tile("#EEF2F1")}${tile("#EEF2F1")}${tile("#E6ECEA")}${tile("#EEF2F1")}${tile("#E6ECEA")}</div></div>
        <div class="page" id="i-page" style="top:0">
          <div class="app-head">${icon(70)}<span class="nm">${esc(cfg.appName)}</span></div>
          <div class="hero"><span></span><b>${esc(cfg.appName)}</b></div>
          <div class="card"><i></i><div style="flex:1"><s style="width:70%"></s><s style="width:45%"></s></div></div>
          <div class="card"><i></i><div style="flex:1"><s style="width:60%"></s><s style="width:80%"></s></div></div>
        </div>
      </div>
      <div class="s-bottom">
        <div class="s-addr" id="i-addr"><span class="aa">aA</span><span class="ph" id="i-ph">Recherche ou adresse</span>
          <span id="i-url" style="position:absolute;left:0;right:0;text-align:center">${ICON.lock(24, "#2E403C").replace('class="glyph"', 'class="glyph" style="display:inline;vertical-align:-3px;margin-right:8px"')}${esc(cfg.url)}</span>
          <span class="re">${ICON.refresh(28, "#2E403C")}</span></div>
        <div class="s-tools">
          <span class="tb">${ICON.back(40, "#149776")}</span><span class="tb">${ICON.next(40, "#B5C3C0")}</span>
          <span class="tb" id="i-share">${ICON.ishare(42, "#149776")}</span><span class="tb">${ICON.book(40, "#149776")}</span><span class="tb">${ICON.tabs(40, "#149776")}</span>
        </div>
      </div>
      <div class="sheet" id="i-sheet" style="top:300px">
        <div class="sh-head">${icon(64)}<div><b>${esc(cfg.appName)}</b><span>${esc(cfg.url)}</span></div><span class="x">✕</span></div>
        <div class="grab"></div>
        <div class="sh-body" id="i-body">
          <div class="apps">
            <div><i style="background:#DDF3E8">${ICON.msg(46, "#3C5752")}</i>Messages</div>
            <div><i style="background:#E9E6F7">${ICON.mail(46, "#3C5752")}</i>E-mail</div>
            <div><i style="background:#FFF6D6">${ICON.notes(46, "#3C5752")}</i>Notes</div>
            <div><i style="background:#E7ECEB">${ICON.plus(46, "#3C5752")}</i>Plus</div>
          </div>
          <div class="group">
            <div class="act">Copier ${ICON.copy(34)}</div>
            <div class="act">Ajouter à la liste de lecture ${ICON.glasses(34)}</div>
            <div class="act">Ajouter un signet ${ICON.book(34)}</div>
            <div class="act">Ajouter aux favoris ${ICON.star(34)}</div>
            <div class="act">Rechercher dans la page ${ICON.search(34)}</div>
            <div class="act target" id="i-target"><span class="press" id="i-press1"></span>Sur l'écran d'accueil ${ICON.addsq(36, "#0D564A")}</div>
            <div class="act">Annoter ${ICON.pen(34)}</div>
          </div>
        </div>
      </div>
      <div class="addsheet" id="i-add">
        <div class="nav"><span class="cancel">Annuler</span><b>Sur l'écran d'accueil</b><span class="add" id="i-ok"><span class="press" id="i-press2"></span>Ajouter</span></div>
        <div class="card">${icon(120)}<div style="flex:1;min-width:0"><b>${esc(cfg.appName)}</b><span>${esc(cfg.url)}</span></div></div>
        <p>Une icône sera ajoutée à votre écran d'accueil pour accéder rapidement à ce site.</p>
      </div>`;
    return safari;
  }

  window.buildIOS = function (ctx) {
    const { stage, layer, cam, cfg, F, tl } = ctx;
    const heads = STEPS.map((s) => { const h = header(s); layer.appendChild(h); return h; });
    const ph = phone("ios");
    cam.insertBefore(ph, cam.firstChild);
    const scr = ph.querySelector("#screen");
    const safari = screens(cfg);
    const H = home(cfg);
    scr.insertBefore(H.root, scr.firstChild);
    scr.insertBefore(safari, H.root.nextSibling);
    const $ = (id) => scr.querySelector("#" + id);
    ctx.fit(layer);

    const R = { addr: rect($("i-addr"), stage), share: rect($("i-share"), stage), target: rect($("i-target"), stage), ok: rect($("i-ok"), stage), slot: rect(H.slot.querySelector(".sq"), stage) };
    const slotScr = rect(H.slot.querySelector(".sq"), scr);
    const SCROLL = Math.max(0, Math.round(R.target.cy - 1480));       // bring the target to mid-screen
    const target = { ...R.target, y: R.target.y - SCROLL, cy: R.target.cy - SCROLL };

    gsap.set(heads, { autoAlpha: 0 });
    gsap.set(ph, { autoAlpha: 0, y: 260 });
    gsap.set([$("i-page"), $("i-press1"), $("i-press2"), H.splash], { autoAlpha: 0 });
    gsap.set($("i-url"), { clipPath: "inset(0 100% 0 0)" });
    gsap.set($("i-sheet"), { yPercent: 105 });
    gsap.set($("i-add"), { yPercent: 105 });
    gsap.set(H.root, { autoAlpha: 0 });
    gsap.set(H.slot, { scale: 0, autoAlpha: 0 });
    gsap.set(H.sparkles, { autoAlpha: 0 });

    let t = ctx.start;
    // ---- step 1: open the link in Safari (and only Safari)
    headerSwap(tl, null, heads[0], t + 0.1);
    tl.to(ph, { autoAlpha: 1, y: 0, duration: 0.8, ease: SOFT }, t);
    zoom(tl, cam, t + 0.8, 1.06, 540, 1320);   // phone top stays at ~610 (below the 4-line header), Safari bar stays in frame
    fingerIn(tl, F, t + 1.3, R.addr.cx + 40, R.addr.cy + 4);
    halo(tl, F, t + 1.2, R.addr, t + 2.4, { round: 26, pad: 10 });
    tap(tl, F, t + 2.4, R.addr.cx + 40, R.addr.cy + 4);
    tl.to($("i-ph"), { autoAlpha: 0, duration: 0.15 }, t + 2.55);
    const n = cfg.url.length + 2;
    const typeD = Math.min(1.4, n * 0.06);
    tl.to($("i-url"), { clipPath: "inset(0 0% 0 0)", duration: typeD, ease: `steps(${n})` }, t + 2.65);
    fingerTo(tl, F, t + 2.8, R.addr.cx + 220, R.addr.cy - 360, 0.8);
    const loadAt = t + 2.65 + typeD + 0.25;
    tl.to($("i-start"), { autoAlpha: 0, duration: 0.3 }, loadAt);
    tl.fromTo($("i-page"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: SOFT }, loadAt + 0.1);

    // ---- step 2: the Share button (square with an arrow)
    t = loadAt + 2.2;      // a little longer: the "Safari only" note needs reading time
    headerSwap(tl, heads[0], heads[1], t);
    halo(tl, F, t + 0.6, R.share, t + 2.0, { circle: true, pad: 12 });
    fingerTo(tl, F, t + 0.8, R.share.cx, R.share.cy, 0.9);
    tap(tl, F, t + 2.0, R.share.cx, R.share.cy);
    tl.to($("i-sheet"), { yPercent: 0, duration: 0.6, ease: "power3.out" }, t + 2.15);

    // ---- step 3: scroll the sheet, then "Sur l'écran d'accueil"
    t = t + 3.9;
    headerSwap(tl, heads[1], heads[2], t);
    const dragX = 540, dragY0 = 1650, dragY1 = dragY0 - SCROLL;
    fingerTo(tl, F, t + 0.5, dragX, dragY0, 0.7);
    tl.to(F.f, { scale: 0.88, duration: 0.15 }, t + 1.25);
    tl.to(F.f, { y: dragY1, duration: 0.9, ease: "power2.inOut" }, t + 1.4);
    tl.to($("i-body"), { y: -SCROLL, duration: 0.9, ease: "power2.inOut" }, t + 1.4);
    tl.to(F.f, { scale: 1, duration: 0.2 }, t + 2.3);
    halo(tl, F, t + 2.4, target, t + 3.5, { round: 20, pad: 4 });
    fingerTo(tl, F, t + 2.5, target.x + 250, target.cy, 0.7);
    tap(tl, F, t + 3.5, target.x + 250, target.cy);
    tl.to($("i-press1"), { autoAlpha: 1, duration: 0.1 }, t + 3.5);

    // ---- step 4: "Ajouter" (top right)
    t = t + 4.2;
    headerSwap(tl, heads[2], heads[3], t);
    tl.to($("i-sheet"), { yPercent: 105, duration: 0.45, ease: "power2.in" }, t);
    tl.to($("i-add"), { yPercent: 0, duration: 0.6, ease: "power3.out" }, t + 0.35);
    zoom(tl, cam, t + 0.4, 1.3, 760, 700);
    halo(tl, F, t + 1.1, R.ok, t + 2.4, { round: 18, pad: 8 });
    fingerTo(tl, F, t + 1.1, R.ok.cx, R.ok.cy + 4, 0.9);
    tap(tl, F, t + 2.4, R.ok.cx, R.ok.cy + 4);
    tl.to($("i-press2"), { autoAlpha: 1, duration: 0.1 }, t + 2.4);
    fingerOut(tl, F, t + 2.75);
    tl.to($("i-add"), { yPercent: 105, duration: 0.45, ease: "power2.in" }, t + 2.7);
    zoom(tl, cam, t + 2.8, 1, 540, 1320);
    tl.to(safari, { autoAlpha: 0, scale: 0.92, duration: 0.55, ease: EASE }, t + 3.0);
    tl.fromTo(H.root, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE }, t + 3.05);

    // ---- step 5: the icon pops on the home screen
    t = t + 3.7;
    headerSwap(tl, heads[3], heads[4], t);
    tl.to(H.slot, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(1.7)" }, t + 0.4);
    H.sparkles.forEach((s, k) => {
      const a = (k / H.sparkles.length) * Math.PI * 2;
      tl.set(s, { left: slotScr.cx - 6, top: slotScr.cy - 6, x: 0, y: 0, autoAlpha: 1, scale: 1 }, t + 0.45);
      tl.to(s, { x: Math.cos(a) * 110, y: Math.sin(a) * 110, autoAlpha: 0, scale: 0.4, duration: 0.8, ease: OUT }, t + 0.45);
    });
    halo(tl, F, t + 1.1, R.slot, t + 2.6, { round: 34, pad: 10 });
    fingerIn(tl, F, t + 1.6, R.slot.cx, R.slot.cy);
    tap(tl, F, t + 2.6, R.slot.cx, R.slot.cy);
    tl.fromTo(H.splash, { autoAlpha: 1, clipPath: `circle(0px at ${slotScr.cx}px ${slotScr.cy}px)` },
      { clipPath: `circle(1400px at ${slotScr.cx}px ${slotScr.cy}px)`, duration: 0.7, ease: "power2.inOut" }, t + 2.75);
    fingerOut(tl, F, t + 2.9);
    return t + 4.6;
  };
})();
