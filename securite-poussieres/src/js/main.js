/* Entry point: ?format=horizontal (the only format of this video for now), ?lang=fr (texts from config.json).
 * Builds the scenes and ONE paused GSAP timeline exposed as window.tl (the renderer seeks it frame by frame). */
(function () {
  const params = new URLSearchParams(location.search);
  const FORMAT = "horizontal";
  if (params.get("format") && params.get("format") !== FORMAT) console.warn("Seul le format horizontal existe pour cette vidéo.");
  const RENDER = params.has("render");
  const SIZE = { horizontal: [1920, 1080] };
  gsap.ticker.lagSmoothing(0);

  const loadImg = (src) => new Promise((res) => {
    if (!src) return res(null);
    const i = new Image();
    i.onload = () => res(i); i.onerror = () => { console.warn("Logo introuvable : " + src); res(null); };
    i.src = "../" + src;
  });
  /** logo size: native pixels × at most `agrandissement_max`, never distorted; plus where its hexagon is */
  function logoSize(img, maxScale, maxW) {
    const s = Math.min(maxScale, maxW / img.naturalWidth);
    return { src: img.src, w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s), scale: s, hex: logoHex(img) };
  }
  /**
   * Finds the hexagon of the logo in the image file itself (so a new HD file keeps working): the first blob of
   * opaque columns from the left, its top and bottom, and the transparent gap between the blue and the red parts.
   * Values are in the file's pixels. Falls back to the proportions measured on the Dumez logo.
   */
  function logoHex(img) {
    const W = img.naturalWidth, H = img.naturalHeight;
    const fb = { x0: 0, x1: W * 0.254, y0: 0, y1: H, gap0: H * 0.617, gap1: H * 0.725, measured: false };
    try {
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
      const a = cx.getImageData(0, 0, W, H).data, op = (x, y) => a[(y * W + x) * 4 + 3] > 128;
      const colHas = (x) => { for (let y = 0; y < H; y++) if (op(x, y)) return true; return false; };
      let x0 = 0; while (x0 < W && !colHas(x0)) x0++;
      let x1 = x0; while (x1 + 1 < W && colHas(x1 + 1)) x1++;
      const rowHas = (y) => { for (let x = x0; x <= x1; x++) if (op(x, y)) return true; return false; };
      let y0 = 0; while (y0 < H && !rowHas(y0)) y0++;
      let y1 = H - 1; while (y1 > y0 && !rowHas(y1)) y1--;
      let gap0 = null, gap1 = null;
      for (let y = y0; y <= y1; y++) if (!rowHas(y)) { if (gap0 == null) gap0 = y; gap1 = y + 1; }
      if (x1 - x0 < 10 || y1 - y0 < 10) return fb;
      return { x0, x1: x1 + 1, y0, y1: y1 + 1, gap0: gap0 ?? (y0 + y1) * 0.6, gap1: gap1 ?? (y0 + y1) * 0.7, measured: true };
    } catch (e) { return fb; }
  }

  async function boot() {
    const cfg = await (await fetch("../config.json", { cache: "no-store" })).json();
    const lang = params.get("lang") || cfg.langue || "fr";
    const T = Object.assign({}, cfg.textes.fr, cfg.textes[lang] || {});   // missing keys fall back to French
    document.documentElement.lang = lang;
    const root = document.documentElement.style;
    const pal = cfg.palette || {};
    if (pal.bleu) root.setProperty("--bleu", pal.bleu);
    if (pal.bleu_fonce) root.setProperty("--fonce", pal.bleu_fonce);
    if (pal.rouge) root.setProperty("--rouge", pal.rouge);
    if (pal.blanc) root.setProperty("--blanc", pal.blanc);

    const [W, H] = SIZE[FORMAT];
    const V = false;
    document.body.classList.add("h", RENDER ? "render" : "dev");
    const stage = document.getElementById("stage");
    Object.assign(stage.style, { width: W + "px", height: H + "px" });

    await Promise.all([300, 600, 650, 700, 750, 800, 900].map((w) => document.fonts.load(`${w} 64px Inter`, "AÉàçœ ăâîșț")));
    await document.fonts.ready;

    const maxScale = (cfg.logos && cfg.logos.agrandissement_max) || 1.3;
    const [logoImg, chantierImg] = await Promise.all([loadImg(cfg.logos.entreprise), loadImg(cfg.logos.chantier)]);
    const C = {
      cfg, T, V, W, H, stage, sources: [],
      PAD: 90,
      logo: logoImg ? logoSize(logoImg, maxScale, W * 0.7) : { src: "", w: 0, h: 0 },
      logoChantier: chantierImg ? logoSize(chantierImg, maxScale, W * 0.4) : null,
    };

    const tl = gsap.timeline({ paused: true });
    window.tl = tl; C.tl = tl;

    const S = window.SCENES;
    const order = [S.S0, S.S1, S.S2, S.S3, S.S4, S.S5, S.S6, S.S7, S.S8, S.S9];
    const wipe = L.buildHexWipe(stage, W, H);
    let t = 0, prev = null;
    order.forEach((build, i) => {
      const start = i === 0 ? 0 : wipe(tl, t, () => {});      // the same hexagon transition everywhere
      const before = stage.querySelectorAll(".scene").length;
      t = build(C, start);
      window.__marks = (window.__marks || []).concat([[build.name, +start.toFixed(2), +t.toFixed(2)]]);
      const sc = stage.querySelectorAll(".scene")[before];
      if (prev) { tl.set(prev, { autoAlpha: 0 }, start); tl.set(sc, { autoAlpha: 1 }, start); }
      prev = sc;
    });
    stage.appendChild(document.getElementById("hexwipe"));   // keep the wipe above every scene
    tl.seek(0);
    checkTexts(48);
    if (!RENDER) devUI(tl, W, H);
    return { duration: tl.duration(), format: FORMAT, lang, W, H, report: window.__report, scenes: window.__marks || [] };
  }

  /**
   * Readability check (reading rules). Seeks the whole timeline every `step` seconds and, for each text block
   * (or group of blocks read together), measures the longest time it is fully visible AND still.
   * Also flags a text that appears while the previous one is still being read, and more than 3 blocks at once.
   */
  window.__readability = function (step = 1 / 30) {
    const tl = window.tl, D = tl.duration(), marks = window.__marks || [];
    const scenes = [...document.querySelectorAll("#stage > .scene")];
    const units = [], groups = {};
    [...document.querySelectorAll("#stage .tx")].filter((n) => n.textContent.trim()).forEach((n) => {
      const g = n.dataset.group;
      if (g && groups[g]) return groups[g].nodes.push(n);
      const u = { nodes: [n] }; units.push(u); if (g) groups[g] = u;
    });
    units.forEach((u) => {
      u.si = scenes.indexOf(u.nodes[0].closest(".scene"));
      u.text = u.nodes.map(L.plain).join(" ");
      u.words = L.words(u.text);
      u.label = u.nodes.every((n) => n.dataset.kind === "label");
      u.title = u.nodes.every((n) => n.dataset.kind === "title");
      u.need = L.need(u.text, u.label);
      Object.assign(u, { best: 0, run: 0, runStart: 0, bestStart: null, appear: null, rect: null });
    });
    // 0 hidden, 1 partly visible (appearing, leaving, dimmed), 2 fully visible
    const state = (n) => {
      let op = 1;
      for (let e = n; e && e.id !== "stage"; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden") return 0;
        op *= +cs.opacity;
        if (e !== n && cs.clipPath && cs.clipPath !== "none") op *= 0.5;
      }
      if (op < 0.05) return 0;
      let full = op > 0.97, any = false;
      n.querySelectorAll(".ln").forEach((l) => {
        const tr = getComputedStyle(l).transform, m = new DOMMatrixReadOnly(tr === "none" ? undefined : tr);
        const lo = +getComputedStyle(l).opacity;
        if (lo < 0.97) full = false;
        if (lo < 0.05) return;
        if (Math.abs(m.f) < 0.5) any = true; else { full = false; if (Math.abs(m.f) < (l.offsetHeight || 1)) any = true; }
      });
      return !any ? 0 : full ? 2 : 1;
    };
    const rectOf = (u) => u.nodes.map((n) => { const r = n.getBoundingClientRect(); return `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)}`; }).join("|");
    let crowd = { n: 0, t: 0, texts: [] };
    for (let t = 0; t <= D + 1e-6; t += step) {
      tl.seek(t, false);
      let visible = [];
      units.forEach((u) => {
        const mk = marks[u.si] || [0, 0, D];
        const inScene = t >= mk[1] + (u.si ? 0.45 : 0) && t < mk[2];   // the opening of the transition ends 0.44 s after the swap
        const st = inScene ? Math.min(...u.nodes.map(state)) : 0;
        const anyVis = inScene && u.nodes.some((n) => state(n) > 0);
        if (anyVis) { if (!u.label) visible.push(u); if (u.appear == null) u.appear = t; }   // icon labels of a grid do not count in the 3-block limit
        const r = st === 2 ? rectOf(u) : null;
        if (st === 2 && r === u.rect) {
          if (!u.run) u.runStart = t - step;
          u.run += step;
          if (u.run > u.best) { u.best = u.run; u.bestStart = u.runStart; }
        } else u.run = 0;
        u.rect = r;
      });
      if (visible.length > crowd.n) crowd = { n: visible.length, t, texts: visible.map((u) => u.text) };
    }
    tl.seek(0);
    // a new text must not appear while an earlier one of the same scene is still being read
    units.forEach((u) => {
      // a heading (data-kind="title") stays on screen for the whole scene: texts may come while it is shown
      u.overlap = units.find((o) => o !== u && o.si === u.si && !o.title && o.bestStart != null && u.appear != null &&
        o.bestStart < u.appear && u.appear < o.bestStart + o.need - step * 1.5);
    });
    return {
      step, maxBlocks: crowd,
      rows: units.map((u) => ({ scene: (marks[u.si] || [""])[0], text: u.text, words: u.words, label: u.label, shown: +u.best.toFixed(2), need: u.need,
        ok: u.best + step * 0.5 >= u.need, overlap: u.overlap ? u.overlap.text : null,
        mid: u.bestStart != null ? +(u.bestStart + Math.min(u.best, u.need) / 2).toFixed(2) : null })),
    };
  };

  /** content rules: ≤ 6 words per line, minimum size, nothing wider than its box */
  function checkTexts(min) {
    document.querySelectorAll(".tx").forEach((n) => {
      const fs = parseFloat(getComputedStyle(n).fontSize);
      const floor = +(n.dataset.min || min);
      if (fs < floor - 0.5) L.report("taille", n, `${fs} px < ${floor} px`);
      const lines = n.classList.contains("wrap") ? [] : [...n.querySelectorAll(".ln")].map((l) => l.textContent);
      lines.forEach((l) => {
        const words = l.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
        if (words > 6) L.report("mots", n, `${words} mots : « ${l} »`);
      });
    });
  }

  /* ---------- preview: fit to window + timeline scrubber ---------- */
  function devUI(tl, W, H) {
    const bar = document.getElementById("devbar");
    bar.hidden = false;
    const stage = document.getElementById("stage");
    const holder = document.createElement("div");
    stage.parentNode.insertBefore(holder, stage);
    holder.appendChild(stage);
    const fitStage = () => {
      const s = Math.min((innerHeight - 90) / H, (innerWidth - 40) / W);
      stage.style.transform = `scale(${s})`;
      holder.style.width = W * s + "px"; holder.style.height = H * s + "px";
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
    if (window.__report.length) console.table(window.__report);
  }

  window.__ready = boot().catch((e) => { document.body.insertAdjacentHTML("beforeend", `<pre style="color:red;position:fixed;top:0;left:0;z-index:999;background:#fff">${e.stack || e}</pre>`); throw e; });
})();
