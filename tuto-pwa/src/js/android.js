/* Android / Chrome tutorial: screens + timeline. */
(function () {
  const { el, esc, ICON, header, phone, home, rect, zoom, fingerIn, fingerTo, fingerOut, tap, halo, headerSwap, EASE, OUT, SOFT } = window.UI;

  const STEPS = [
    { num: 1, title: ["Ouvrez le lien", "dans Chrome"] },
    { num: 2, title: ["Touchez les 3 points", "en haut à droite"] },
    { num: 3, title: ["Touchez", "Installer l'application"], note: ["Ou, selon le téléphone :", "« Ajouter à l'écran d'accueil »"] },
    { num: 4, title: ["Confirmez avec", "« Installer »"] },
    { num: 5, title: ["C'est prêt !"], note: ["Ouvrez l'app comme", "n'importe quelle application"] },
  ];

  function screens(cfg) {
    const icon = (s) => `<div class="icon-app" style="width:${s}px;height:${s}px"><img src="../${esc(cfg.icon)}" alt=""></div>`;
    const chrome = el("div", "screen-layer");
    chrome.innerHTML = `
      <div class="c-bar">
        ${ICON.home(36)}
        <div class="c-addr" id="a-addr"><span id="a-glyph">${ICON.search(30, "#5B6E6A")}</span><span id="a-lock" style="position:absolute;left:22px;top:19px">${ICON.lock(28, "#2E403C")}</span>
          <span class="ph" id="a-ph">Rechercher ou saisir l'URL</span><span id="a-url" style="position:absolute;left:66px">${esc(cfg.url)}</span></div>
        <div class="c-tabs">1</div>
        <div class="c-dots" id="a-dots"><i></i><i></i><i></i></div>
      </div>
      <div class="c-progress" id="a-prog"></div>
      <div class="newtab" id="a-newtab"><div class="ring"></div>Nouvel onglet</div>
      <div class="page" id="a-page">
        <div class="app-head">${icon(70)}<span class="nm">${esc(cfg.appName)}</span></div>
        <div class="hero"><span></span><b>${esc(cfg.appName)}</b></div>
        <div class="card"><i></i><div style="flex:1"><s style="width:70%"></s><s style="width:45%"></s></div></div>
        <div class="card"><i></i><div style="flex:1"><s style="width:60%"></s><s style="width:80%"></s></div></div>
        <div class="card"><i></i><div style="flex:1"><s style="width:75%"></s><s style="width:40%"></s></div></div>
      </div>
      <div class="c-menu" id="a-menu">
        <div class="row">${ICON.fwd(32)}${ICON.star(32)}${ICON.download(32)}${ICON.info(32)}${ICON.refresh(32)}</div>
        <div class="it">${ICON.plus(32)}Nouvel onglet</div>
        <div class="it">${ICON.incog(32)}Onglet navigation privée</div>
        <div class="it">${ICON.history(32)}Historique</div>
        <div class="it">${ICON.download(32)}Téléchargements</div>
        <div class="it">${ICON.star(32)}Favoris</div>
        <div class="it target" id="a-install"><span class="press" id="a-press1"></span>${ICON.install(32, "#0D564A")}Installer l'application</div>
        <div class="it">${ICON.share(32)}Partager…</div>
        <div class="it">${ICON.gear(32)}Paramètres</div>
      </div>
      <div class="scrim" id="a-scrim"></div>
      <div class="dialog" id="a-dialog">
        <h4>Installer l'application ?</h4>
        <div class="appline">${icon(96)}<div><b>${esc(cfg.appName)}</b><span>${esc(cfg.url)}</span></div></div>
        <div class="acts"><span>Annuler</span><span class="fill" id="a-ok"><span class="press" id="a-press2"></span>Installer</span></div>
      </div>`;
    return chrome;
  }

  window.buildAndroid = function (ctx) {
    const { stage, layer, cam, cfg, F, tl } = ctx;
    const heads = STEPS.map((s) => { const h = header(s); layer.appendChild(h); return h; });
    const ph = phone("android");
    cam.insertBefore(ph, cam.firstChild);
    const scr = ph.querySelector("#screen");
    const chrome = screens(cfg);
    const H = home(cfg);
    scr.insertBefore(H.root, scr.firstChild);
    scr.insertBefore(chrome, H.root.nextSibling);
    const $ = (id) => scr.querySelector("#" + id);
    ctx.fit(layer);

    // measurements (final layout, before any transform)
    const R = {
      addr: rect($("a-addr"), stage), dots: rect($("a-dots"), stage), install: rect($("a-install"), stage),
      ok: rect($("a-ok"), stage), slot: rect(H.slot.querySelector(".sq"), stage),
    };
    const slotScr = rect(H.slot.querySelector(".sq"), scr);

    // initial states
    gsap.set(heads, { autoAlpha: 0 });
    gsap.set(ph, { autoAlpha: 0, y: 260 });
    gsap.set([$("a-menu"), $("a-scrim"), $("a-dialog"), $("a-page"), $("a-press1"), $("a-press2"), H.splash, $("a-lock")], { autoAlpha: 0 });
    gsap.set($("a-url"), { clipPath: "inset(0 100% 0 0)" });
    gsap.set($("a-prog"), { scaleX: 0, autoAlpha: 1 });
    gsap.set(H.root, { autoAlpha: 0 });
    gsap.set(H.slot, { scale: 0, autoAlpha: 0 });
    gsap.set(H.sparkles, { autoAlpha: 0 });

    let t = ctx.start;   // steps start right after the intro wave
    // ---- step 1: open the link in Chrome
    headerSwap(tl, null, heads[0], t + 0.1);
    tl.to(ph, { autoAlpha: 1, y: 0, duration: 0.8, ease: SOFT }, t);
    zoom(tl, cam, t + 0.6, 1.25, 540, 700);
    fingerIn(tl, F, t + 0.9, R.addr.x + 230, R.addr.cy + 10);
    halo(tl, F, t + 0.8, R.addr, t + 1.85, { round: 40, pad: 10 });
    tap(tl, F, t + 1.85, R.addr.x + 230, R.addr.cy + 10);
    tl.to($("a-ph"), { autoAlpha: 0, duration: 0.15 }, t + 2.0);
    const nChars = cfg.url.length;
    tl.to($("a-url"), { clipPath: "inset(0 0% 0 0)", duration: Math.min(1.4, nChars * 0.06), ease: `steps(${nChars})` }, t + 2.1);
    fingerTo(tl, F, t + 2.3, R.addr.x + 330, R.addr.cy + 260, 0.8);
    const loadAt = t + 2.1 + Math.min(1.4, nChars * 0.06) + 0.25;
    tl.to($("a-glyph"), { autoAlpha: 0, duration: 0.2 }, loadAt);
    tl.to($("a-lock"), { autoAlpha: 1, duration: 0.2 }, loadAt);
    tl.to($("a-prog"), { scaleX: 1, duration: 0.7, ease: "power1.inOut" }, loadAt);
    tl.to($("a-prog"), { autoAlpha: 0, duration: 0.2 }, loadAt + 0.7);
    tl.to($("a-newtab"), { autoAlpha: 0, duration: 0.3 }, loadAt + 0.2);
    tl.fromTo($("a-page"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: SOFT }, loadAt + 0.3);

    // ---- step 2: the three dots
    t = loadAt + 1.9;
    headerSwap(tl, heads[0], heads[1], t);
    zoom(tl, cam, t + 0.1, 1.32, 820, 700);
    halo(tl, F, t + 0.6, R.dots, t + 1.9, { circle: true, pad: 14 });
    fingerTo(tl, F, t + 0.8, R.dots.cx, R.dots.cy, 0.85);
    tap(tl, F, t + 1.9, R.dots.cx, R.dots.cy);
    tl.fromTo($("a-menu"), { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: OUT }, t + 2.05);
    fingerTo(tl, F, t + 2.3, R.dots.cx - 160, R.dots.cy + 420, 0.7);

    // ---- step 3: "Installer l'application"
    t = t + 3.6;
    headerSwap(tl, heads[1], heads[2], t);
    halo(tl, F, t + 0.9, R.install, t + 2.4, { round: 18, pad: 4 });
    fingerTo(tl, F, t + 1.0, R.install.x + 240, R.install.cy, 0.85);
    tap(tl, F, t + 2.4, R.install.x + 240, R.install.cy);
    tl.to($("a-press1"), { autoAlpha: 1, duration: 0.1 }, t + 2.4);
    tl.to($("a-menu"), { autoAlpha: 0, scale: 0.95, duration: 0.3, ease: "power2.in" }, t + 2.8);

    // ---- step 4: confirm the dialog
    t = t + 4.0;
    headerSwap(tl, heads[2], heads[3], t);
    zoom(tl, cam, t, 1.2, 540, 1150);
    tl.to($("a-scrim"), { autoAlpha: 1, duration: 0.35 }, t + 0.1);
    tl.fromTo($("a-dialog"), { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: OUT }, t + 0.15);
    fingerTo(tl, F, t + 0.8, R.ok.cx + 10, R.ok.cy + 6, 0.85);
    halo(tl, F, t + 0.7, R.ok, t + 2.0, { round: 40, pad: 8 });
    tap(tl, F, t + 2.0, R.ok.cx + 10, R.ok.cy + 6);
    tl.to($("a-press2"), { autoAlpha: 1, duration: 0.1 }, t + 2.0);
    tl.to([$("a-dialog"), $("a-scrim")], { autoAlpha: 0, duration: 0.3 }, t + 2.35);
    fingerOut(tl, F, t + 2.5);
    // back to the home screen
    zoom(tl, cam, t + 2.6, 1, 540, 1150);
    tl.to(chrome, { autoAlpha: 0, scale: 0.92, duration: 0.55, ease: EASE }, t + 2.8);
    tl.fromTo(H.root, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE }, t + 2.85);

    // ---- step 5: the icon pops on the home screen
    t = t + 3.5;
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
    return t + 4.6;   // the outro wave starts here
  };
})();
