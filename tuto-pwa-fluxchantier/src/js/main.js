/* Entry point: reads ?tuto=android|ios and config.json, builds the scenes and
 * ONE paused GSAP timeline exposed as window.tl (the renderer seeks it frame by frame). */
(function () {
  const U = window.UI;
  const params = new URLSearchParams(location.search);
  const kind = params.get("tuto") === "ios" ? "ios" : "android";
  const RENDER = params.has("render");
  document.body.classList.add(RENDER ? "render" : "dev");
  gsap.ticker.lagSmoothing(0);

  async function boot() {
    const cfg = await (await fetch("../config.json", { cache: "no-store" })).json();
    await Promise.all([document.fonts.load("800 72px Inter"), document.fonts.load("600 56px Inter"), document.fonts.load("300 100px Inter")]);
    const stage = document.getElementById("stage");

    // shared gradient for the wavy separators
    stage.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute"><defs>
      <linearGradient id="sepg" x1="0" x2="1"><stop offset="0" stop-color="#149776"/><stop offset=".5" stop-color="#11D7A7"/><stop offset="1" stop-color="#A5D657"/></linearGradient></defs></svg>`);

    const ribbons = U.buildRibbons(document.getElementById("ribbons"));
    const waves = U.buildWaves(document.getElementById("waves"));
    const intro = document.getElementById("intro");
    const steps = document.getElementById("steps");
    const outro = document.getElementById("outro");
    // camera rig for the steps: phone + finger + halo zoom together (headers stay put)
    const cam = U.el("div", "abs"); cam.id = "cam";
    Object.assign(cam.style, { left: 0, top: 0, width: "1080px", height: "1920px", transformOrigin: "0 0" });
    steps.appendChild(cam);
    gsap.set(cam, { transformOrigin: "0px 0px", scale: 1, x: 0, y: 0 });
    const F = U.makeFinger(cam);
    const fit = (root) => U.fitLines(root);

    /* ---------- intro ---------- */
    const device = kind === "ios" ? "iPhone" : "Android";
    const lg1 = U.logo(400);
    const ic = `<div class="icon-app" style="width:92px;height:92px"><img src="../${U.esc(cfg.icon)}" alt=""></div>`;
    const ci = U.el("div", "center-col");
    ci.style.top = "430px";
    ci.appendChild(lg1);
    ci.insertAdjacentHTML("beforeend", `
      <div class="big" style="margin-top:70px"><span class="mask"><span class="line">Installer l'application</span></span>
        <span class="mask"><span class="line">sur <span class="hl">${device}</span></span></span></div>
      <div class="appchip" style="margin-top:56px;display:flex;align-items:center;gap:26px">${ic}<span class="mid" style="color:#0D564A;font-weight:800">${U.esc(cfg.appName)}</span></div>`);
    intro.appendChild(ci);
    fit(intro);

    /* ---------- outro ---------- */
    const lg2 = U.logo(360);
    const co = U.el("div", "center-col");
    co.style.top = "440px";
    co.appendChild(lg2);
    const parts = String(cfg.outroText || "").split(/(?<=\?)\s+/);
    co.insertAdjacentHTML("beforeend", `
      <div class="big" style="margin-top:80px">${parts.map((p, i) => `<span class="mask"><span class="line${i === parts.length - 1 && parts.length > 1 ? " hl" : ""}">${U.esc(p)}</span></span>`).join("")}</div>
      ${cfg.contact ? `<div class="mid" style="margin-top:44px"><span class="mask"><span class="line">${U.esc(cfg.contact)}</span></span></div>` : ""}
      <div class="brand" style="margin-top:70px;font-size:56px"><span class="mask"><span class="line">Synapsis</span></span></div>`);
    outro.appendChild(co);
    fit(outro);
    outro.querySelectorAll(".big .line.hl").forEach((l) => { l.style.background = "var(--grad)"; l.style.webkitBackgroundClip = "text"; l.style.backgroundClip = "text"; l.style.color = "transparent"; });

    /* ---------- timeline ---------- */
    const tl = gsap.timeline({ paused: true });
    window.tl = tl;
    gsap.set([steps, outro], { autoAlpha: 0 });

    // intro: the logo curves draw themselves, then the title
    const drawIn = (wrap, t, d) => {
      const p = wrap.querySelector(".draw");
      const L = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: d, ease: "power2.inOut" }, t);
      tl.fromTo(wrap, { scale: 0.92 }, { scale: 1, duration: d + 0.3, ease: U.SOFT }, t);
    };
    drawIn(lg1, 0.1, 1.3);
    intro.querySelectorAll(".big .line").forEach((ln, i) => tl.fromTo(ln, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: U.SOFT }, 0.75 + i * 0.12));
    tl.fromTo(intro.querySelector(".appchip"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: U.SOFT }, 1.15);

    // wave into the steps
    const mid1 = U.waveTransition(tl, waves, 1.95, (m) => { tl.set(intro, { autoAlpha: 0 }, m); tl.set(steps, { autoAlpha: 1 }, m); });

    // the tutorial itself
    const build = kind === "ios" ? window.buildIOS : window.buildAndroid;
    const endSteps = build({ stage, layer: steps, cam, cfg, F, tl, start: mid1 - 0.1, fit });

    // wave into the outro
    const mid2 = U.waveTransition(tl, waves, endSteps, (m) => { tl.set(steps, { autoAlpha: 0 }, m); tl.set(outro, { autoAlpha: 1 }, m); });
    drawIn(lg2, mid2 + 0.05, 1.0);
    outro.querySelectorAll(".line").forEach((ln, i) => tl.fromTo(ln, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: U.SOFT }, mid2 + 0.45 + i * 0.12));
    tl.to({}, { duration: 2.3 }, mid2 + 0.6);   // hold the last card

    // gentle background drift over the whole video
    const D = tl.duration();
    ribbons.forEach((g, i) => tl.fromTo(g, { x: 0 }, { x: (i % 2 ? 1 : -1) * 260, duration: D, ease: "none" }, 0));
    tl.fromTo("#blobA", { x: 0, y: 0 }, { x: 140, y: 90, duration: D, ease: "none" }, 0);
    tl.fromTo("#blobB", { x: 0, y: 0 }, { x: -120, y: -110, duration: D, ease: "none" }, 0);

    tl.seek(0);
    if (!RENDER) devUI(tl);
    return { duration: tl.duration(), kind };
  }

  /* ---------- preview: fit to window + timeline scrubber ---------- */
  function devUI(tl) {
    const bar = document.getElementById("devbar");
    bar.hidden = false;
    const stage = document.getElementById("stage");
    const holder = document.createElement("div");
    stage.parentNode.insertBefore(holder, stage);
    holder.appendChild(stage);
    const fitStage = () => {
      const s = Math.min((innerHeight - 70) / 1920, (innerWidth - 40) / 1080);
      stage.style.transform = `scale(${s})`;
      holder.style.width = 1080 * s + "px"; holder.style.height = 1920 * s + "px";
    };
    fitStage(); addEventListener("resize", fitStage);
    const scrub = document.getElementById("scrub"), clock = document.getElementById("clock"), play = document.getElementById("play");
    scrub.max = tl.duration();
    const show = () => { scrub.value = tl.time(); clock.textContent = tl.time().toFixed(2) + " s"; };
    tl.eventCallback("onUpdate", show);
    scrub.addEventListener("input", () => { tl.pause(); tl.seek(+scrub.value); play.textContent = "▶"; show(); });
    play.addEventListener("click", () => {
      if (tl.paused()) { if (tl.progress() >= 1) tl.seek(0); tl.play(); play.textContent = "❚❚"; } else { tl.pause(); play.textContent = "▶"; }
    });
    addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); play.click(); } });
    const t0 = params.get("t");
    if (t0) tl.seek(+t0);
    show();
  }

  window.__ready = boot().catch((e) => { document.body.insertAdjacentHTML("beforeend", `<pre style="color:red">${e.stack || e}</pre>`); throw e; });
})();
