/* FluxChantier — 15 s motion design.
 * Everything is a pure function of time: seek(t) poses every element for that instant,
 * so the renderer can capture frames deterministically and the preview can scrub. */
(() => {
  const TL = window.TL;
  const W = 1920, H = 1080;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- maths ---------- */
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    lin: (x) => x,
    outCubic: (x) => 1 - (1 - x) ** 3,
    inCubic: (x) => x ** 3,
    inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
    outQuint: (x) => 1 - (1 - x) ** 5,
    inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
    inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
    outBack: (x) => { const c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; },
    outBackBig: (x) => { const c = 2.8; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; },
  };
  const tw = (t, a, b, v0, v1, e = E.outCubic) => lerp(v0, v1, e(P(t, a, b)));
  // keyframes [[t, v], [t, v, easeIntoThisKey], ...]
  function kf(t, f) {
    if (t <= f[0][0]) return f[0][1];
    for (let i = 1; i < f.length; i++) {
      if (t <= f[i][0]) {
        const [t0, v0] = f[i - 1];
        const [t1, v1, e = E.inOutCubic] = f[i];
        return lerp(v0, v1, e(P(t, t0, t1)));
      }
    }
    return f[f.length - 1][1];
  }
  // damped wobble used for "pop" and impacts
  const wobble = (t, t0, amp, decay = 9, freq = 24) => (t < t0 ? 0 : amp * Math.exp(-decay * (t - t0)) * Math.sin((t - t0) * freq));
  function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  }

  /* ---------- DOM helpers ---------- */
  function tf(el, { x = 0, y = 0, s = 1, r = 0, rx = 0, ry = 0, o = null, blur = null, unit = "px" } = {}) {
    el.style.transform = `translate3d(${x}${unit},${y}${unit},0) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
    if (o !== null) setO(el, o);
    if (blur !== null) el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
  }
  function setO(el, o) { el.style.opacity = o; el.style.visibility = o <= 0.002 ? "hidden" : "visible"; }
  // containers are toggled with display so children forced visible by setO stay hidden
  const show = (el, on) => { el.style.display = on ? "" : "none"; };
  // masked line: slides up into view at tin, out (upwards) at tout
  function maskLine(el, t, tin, tout = 1e9, d = 0.55, dOut = 0.32) {
    const y = t < tout ? tw(t, tin, tin + d, 118, 0, E.outExpo) : tw(t, tout, tout + dOut, 0, -118, E.inCubic);
    el.style.transform = `translate3d(0,${y}%,0)`;
  }
  // draw a stroke between fractions [a, b] of its length
  function segment(path, len, a, b) {
    const s = Math.max(0, b - a) * len;
    path.style.strokeDasharray = `${s} ${len * 2 + 10}`;
    path.style.strokeDashoffset = `${-a * len}`;
  }
  function posIn(el, root) {
    const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height, cx: a.left - b.left + a.width / 2, cy: a.top - b.top + a.height / 2 };
  }
  const NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  /* ---------- build procedural parts ---------- */
  const S = {}; // cached refs + measurements

  function build() {
    // background flux: dotted rails + travelling comets
    const bg = $("bgflux");
    const r = rng(7);
    S.bgPaths = [];
    for (let i = 0; i < 7; i++) {
      const y0 = 90 + i * 150 + r() * 60, y1 = y0 + (r() - 0.5) * 420, a = 120 + r() * 160;
      const d = `M-120 ${y0} C 520 ${y0 + a}, 1300 ${y1 - a}, 2040 ${y1}`;
      svgEl("path", { d, stroke: "rgba(255,255,255,.07)", "stroke-width": 2, "stroke-dasharray": "2 18" }, bg);
      const c = svgEl("path", { d, stroke: i % 3 === 0 ? "rgba(255,122,26,.55)" : "rgba(255,194,14,.45)", "stroke-width": 3 }, bg);
      const len = c.getTotalLength();
      S.bgPaths.push({ el: c, len, speed: 260 + r() * 260, phase: r() * len, dash: 140 + r() * 120 });
    }

    // intro converging flux
    const fx = $("introFlux");
    const starts = [
      ["M-80 160 C 400 160, 600 540, 960 540", "#FFC20E"],
      ["M-80 920 C 380 980, 640 540, 960 540", "#FF7A1A"],
      ["M2000 120 C 1500 80, 1320 540, 960 540", "#FFFFFF"],
      ["M2000 960 C 1560 1000, 1300 540, 960 540", "#FFC20E"],
      ["M700 -80 C 760 260, 820 540, 960 540", "#FF7A1A"],
      ["M1250 1160 C 1180 820, 1100 540, 960 540", "#FFFFFF"],
    ];
    S.introPaths = starts.map(([d, col], i) => {
      const p = svgEl("path", { d, stroke: col, "stroke-width": i % 2 ? 5 : 7, opacity: col === "#FFFFFF" ? 0.55 : 0.95 }, fx);
      return { el: p, len: p.getTotalLength(), i };
    });

    // logo strokes
    S.fStrokes = $$("#logoMark .fs").map((p) => ({ el: p, len: p.getTotalLength() }));

    // success burst rays
    const burst = $("burst");
    S.rays = [];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2 + 0.26;
      S.rays.push({ el: svgEl("line", { x1: 75, y1: 75, x2: 75, y2: 75 }, burst), ang });
    }

    // QR code (deterministic, with finder patterns)
    const qr = $("qr");
    const N = 25, rq = rng(42), cells = [];
    const finder = (x, y) => {
      for (const [ox, oy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
        const dx = x - ox, dy = y - oy;
        if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
          const edge = dx === 0 || dy === 0 || dx === 6 || dy === 6;
          const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
          return edge || core ? 1 : 0;
        }
        if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0;
      }
      return -1;
    };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const f = finder(x, y);
      const on = f === -1 ? rq() > 0.52 : f === 1;
      if (!on) continue;
      const el = svgEl("rect", { x, y, width: 1.02, height: 1.02, fill: "#0B1424" }, qr);
      cells.push({ el, d: Math.hypot(x - 12, y - 12) / 17 });
    }
    S.qr = cells;

    // measurements (taken with every transform at identity)
    const cam = $("camWrap");
    S.card1 = posIn($("card1"), cam);
    S.slot = posIn($("slotPick"), cam);
    S.btn = posIn($("btn"), cam);
    S.form = posIn($("form"), cam);
    S.logoW = $("logo").offsetWidth;
    S.endLogoW = $("endLogo").offsetWidth;
    S.endUrlW = $("endUrl").offsetWidth;
    S.endUrlH = $("endUrl").offsetHeight;

    S.pLine = $("pLinePath"); S.pLineLen = S.pLine.getTotalLength();
    S.rl = $("rlBase"); S.rlLen = S.rl.getTotalLength();
    S.checkPath = $("checkPath"); S.checkLen = S.checkPath.getTotalLength();
    for (const id of ["checkBg", "checkRing", "logoMark"]) { $(id).style.transformBox = "fill-box"; $(id).style.transformOrigin = "50% 50%"; }
    S.steps = [1, 2, 3].map((i) => ({ el: $("st" + i), lines: $$(".mi", $("st" + i)) }));
    S.ldA = $$("#pageA .ld");
    S.ldB = $$("#pageB .lb");
    S.slots = $$("#slots .slot");
    S.sums = $$("#pageC .sm");
    S.fields = [0, 1, 2].map((i) => ({ box: $("f" + i), tx: $$(".tx", $("f" + i))[0], caret: $$(".caret", $("f" + i))[0] }));
  }

  /* ---------- cursor path helper ---------- */
  function arc(t, t0, t1, p0, p1, bend = 0.18, e = E.inOutCubic) {
    const k = e(P(t, t0, t1));
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const cx = mx - dy * bend, cy = my + dx * bend;
    const u = 1 - k;
    return [u * u * p0[0] + 2 * u * k * cx + k * k * p1[0], u * u * p0[1] + 2 * u * k * cy + k * k * p1[1]];
  }

  /* =================================================================== */
  function seek(t) {
    const sc = TL.scenes;
    const C = TL.clicks;

    /* ---------- background ---------- */
    $("grid").style.transform = `translate3d(${-((t * 14) % 160)}px, ${-((t * 7) % 160)}px, 0)`;
    tf($("glowA"), { x: 1050 + 220 * Math.sin(t * 0.42), y: -160 + 90 * Math.cos(t * 0.55) });
    tf($("glowB"), { x: -260 + 160 * Math.cos(t * 0.37), y: 420 + 120 * Math.sin(t * 0.48) });
    for (const p of S.bgPaths) {
      p.el.style.strokeDasharray = `${p.dash} ${p.len}`;
      p.el.style.strokeDashoffset = `${-(((p.phase + t * p.speed) % (p.len + p.dash)) - p.dash)}`;
    }
    const gr = rng(Math.floor(t * 24) + 1);
    $("grain").style.transform = `translate3d(${Math.floor(gr() * 200 - 100)}px, ${Math.floor(gr() * 200 - 100)}px, 0)`;

    /* ---------- S1 intro: flux converge -> logo ---------- */
    show($("introFlux"), t < 1.1);
    for (const p of S.introPaths) {
      const d = p.i * 0.035;
      const head = E.inOutCubic(P(t, 0.0 + d, 0.48 + d));
      const tail = E.inCubic(P(t, 0.22 + d, 0.62 + d));
      segment(p.el, p.len, tail, head);
    }
    const pop = TL.logoPop;
    const shock = $("shock");
    tf(shock, { x: 880, y: 460, s: tw(t, pop, pop + 0.6, 0.9, 3.4, E.outCubic), o: t < pop ? 0 : tw(t, pop, pop + 0.6, 0.9, 0) });

    const logo = $("logo");
    const lx0 = (W - S.logoW) / 2, ly0 = 460;
    const center = (S.logoW - 160) / 2;
    const slide = tw(t, 0.82, 1.28, center, 0, E.outExpo);
    const toCorner = E.inOutExpo(P(t, 1.55, 2.0));
    const lscale = lerp(1, 0.28, toCorner);
    const lx = lerp(lx0 + slide, 110, toCorner), ly = lerp(ly0, 60, toCorner);
    tf(logo, { x: lx, y: ly, s: lscale, o: t < 12.0 ? 1 : tw(t, 12.0, 12.3, 1, 0) });
    show(logo, t < 12.35);
    const mark = $("logoMark");
    const ms = t < pop ? 0 : E.outBackBig(P(t, pop, pop + 0.42));
    mark.style.transform = `scale(${ms}) rotate(${tw(t, pop, pop + 0.5, -35, 0, E.outCubic)}deg)`;
    S.fStrokes.forEach((f, i) => {
      const k = E.outCubic(P(t, 0.58 + i * 0.07, 0.95 + i * 0.07));
      f.el.style.strokeDasharray = `${f.len}`;
      f.el.style.strokeDashoffset = `${f.len * (1 - k)}`;
    });
    $("logoWord").style.transform = `translate3d(${tw(t, 0.86, 1.36, -104, 0, E.outExpo)}%,0,0)`;
    const tag = $$("#logoTag .mi")[0];
    show($("logoTag"), t > 0.9 && t < 1.95);
    maskLine(tag, t, 1.05, 1.5, 0.5, 0.25);

    /* ---------- guide label (top-right) ---------- */
    const g = $("guide");
    tf(g, { x: t < 12 ? tw(t, 1.8, 2.3, 40, 0, E.outExpo) : 0, o: t < 12 ? tw(t, 1.8, 2.2, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });

    /* ---------- S2 promise ---------- */
    const promiseOn = t > 1.8 && t < 3.82;
    show($("promise"), promiseOn);
    if (promiseOn) {
      maskLine($$("#pLabel .mi")[0], t, 1.92, 3.2, 0.55, 0.28);
      const sl = TL.slam;
      const three = $("pThree");
      const k3 = P(t, sl, sl + 0.4);
      tf(three, { s: t < sl ? 0 : lerp(2.6, 1, E.outBack(k3)), r: tw(t, sl, sl + 0.4, -10, 0, E.outBack), o: t < sl ? 0 : tw(t, sl, sl + 0.06, 0, 1) });
      maskLine($("pWord"), t, sl + 0.08, 3.22, 0.5, 0.3);
      segment(S.pLine, S.pLineLen, E.inCubic(P(t, 3.15, 3.4)), E.outExpo(P(t, 2.62, 3.05)));
      maskLine($$("#pSub .mi")[0], t, 2.78, 3.24, 0.55, 0.28);
      const shake = wobble(t, sl, 14, 10, 38);
      $("pBig").style.transform = `translate3d(${shake}px, ${wobble(t, sl, 8, 10, 31)}px, 0) scale(${tw(t, sl, 3.4, 1, 1.05, E.lin)})`;
    }

    /* ---------- wipe (S2 -> S3) ---------- */
    const wa = TL.wipe, k = 340;
    [["wipeA", 0, 0.1], ["wipeB", 0.05, 0.05], ["wipeC", 0.1, 0]].forEach(([id, dl, dt]) => {
      const el = $(id);
      const lead = lerp(-k, W + 10, E.inOutCubic(P(t, wa + dl, wa + dl + 0.36)));
      const trail = lerp(-k, W + 10, E.inOutCubic(P(t, wa + 0.48 + dt, wa + 0.48 + dt + 0.36)));
      const on = t > wa + dl && trail < W + 5;
      show(el, on);
      if (on) el.style.clipPath = `polygon(${trail + k}px 0, ${lead + k}px 0, ${lead}px ${H}px, ${trail}px ${H}px)`;
    });

    /* ---------- S3–S5 steps ---------- */
    const stepsOn = t > 3.79 && t < 12.5;
    show($("steps"), stepsOn);
    if (stepsOn) steps(t, C);

    /* ---------- S6 outro ---------- */
    const outroOn = t > 12.2;
    show($("outro"), outroOn);
    if (outroOn) outro(t, C);
  }

  /* =================================================================== */
  function steps(t, C) {
    /* left column copy */
    const timings = [[3.95, 6.2], [6.45, 9.1], [9.32, 12.0]];
    S.steps.forEach((st, i) => {
      const [tin, tout] = timings[i];
      const on = t > tin - 0.02 && t < tout + 0.6;
      show(st.el, on);
      if (on) st.lines.forEach((ln, j) => maskLine(ln, t, tin + j * 0.055, tout + j * 0.025, 0.62, 0.3));
    });

    /* stepper */
    const stp = $("stepper");
    tf(stp, { y: t < 12 ? tw(t, 4.15, 4.7, 30, 0, E.outExpo) : tw(t, 12.0, 12.3, 0, 30, E.inCubic), o: t < 12 ? tw(t, 4.15, 4.5, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });
    $("stFill").style.width = `${kf(t, [[6.35, 0], [6.8, 220, E.inOutExpo], [9.2, 220], [9.65, 440, E.inOutExpo]])}px`;
    [[1, 4.3], [2, 6.78], [3, 9.63]].forEach(([i, ton]) => {
      const d = $("sd" + i);
      d.classList.toggle("on", t >= ton);
      d.style.transform = `scale(${1 + wobble(t, ton, 0.4, 8, 22)})`;
    });

    /* camera on the browser */
    const shake = wobble(t, TL.success, 9, 11, 40);
    const cam = $("cam");
    const cx = kf(t, [[3.86, 380], [4.55, 0, E.outExpo], [7.05, 0], [7.42, 60], [7.62, 60], [7.98, -60], [8.62, -60], [9.0, 0], [10.15, 0], [10.7, -150], [12.0, -150], [12.45, -760, E.inExpo]]);
    const cy = kf(t, [[3.86, 90], [4.55, 0, E.outExpo], [7.05, 0], [7.42, 10], [8.62, 10], [9.0, 0]]);
    const cs = kf(t, [[3.86, 0.8], [4.55, 1, E.outExpo], [5.12, 1], [5.6, 1.07], [6.1, 1.07], [6.55, 1], [7.05, 1], [7.42, 1.1], [8.62, 1.1], [9.0, 1], [12.0, 1], [12.45, 0.72, E.inExpo]]);
    const cry = kf(t, [[3.86, -26], [4.55, -8, E.outExpo], [6.5, -4], [10.15, -4], [10.7, -10], [12.0, -10], [12.45, -28, E.inExpo]]);
    const crx = kf(t, [[3.86, 12], [4.55, 4, E.outExpo], [9.0, 2], [12.0, 2], [12.45, 10, E.inExpo]]);
    tf(cam, { x: cx + shake, y: cy + wobble(t, TL.success, 6, 11, 33), s: cs, rx: crx, ry: cry,
      o: kf(t, [[3.86, 0], [4.12, 1], [12.12, 1], [12.45, 0]]), blur: kf(t, [[12.05, 0], [12.45, 16, E.inCubic]]) });

    /* URL bar typing */
    const u = TL.url;
    const n = clamp(Math.floor((t - u.t0) * u.cps), 0, u.text.length);
    $("urlText").textContent = u.text.slice(0, n);
    const typing = t > u.t0 - 0.15 && t < u.t0 + u.text.length / u.cps + 0.1;
    show($("urlCaret"), typing && (n < u.text.length || Math.floor(t * 6) % 2 === 0));
    const loadT = u.t0 + u.text.length / u.cps + 0.08; // "enter"
    setO($("appbar"), tw(t, loadT, loadT + 0.15, 0, 1));

    /* page A: chantier list */
    const pa = $("pageA");
    show(pa, t < 6.7);
    pa.style.transform = `translate3d(${kf(t, [[6.2, 0], [6.65, -1010, E.inOutExpo]])}px,0,0)`;
    S.ldA.forEach((el, i) => {
      const a = loadT + 0.08 + i * 0.055;
      const s = el.id === "card1" ? 1 + wobble(t, C[0], 0.035, 10, 26) - (Math.abs(t - C[0]) < 0.06 ? 0.015 : 0) : 1;
      tf(el, { y: tw(t, a, a + 0.45, 26, 0, E.outExpo), s, o: tw(t, a, a + 0.25, 0, 1) });
    });
    const ring = $("card1Ring");
    setO(ring, t < C[0] ? tw(t, 5.35, 5.5, 0, 0.45) : 1);

    /* page B: slot booking */
    const pb = $("pageB");
    const pbOn = t > 6.15 && t < 9.5;
    show(pb, pbOn);
    if (pbOn) {
      pb.style.transform = `translate3d(${kf(t, [[6.2, 1010], [6.65, 0, E.inOutExpo]])}px,0,0) scale(${tw(t, 9.25, 9.45, 1, 0.96)})`;
      setO(pb, tw(t, 9.25, 9.42, 1, 0));
      S.ldB.forEach((el, i) => { const a = 6.42 + i * 0.05; tf(el, { y: tw(t, a, a + 0.45, 24, 0, E.outExpo), o: tw(t, a, a + 0.25, 0, 1) }); });
      S.slots.forEach((el, i) => { const a = 6.5 + i * 0.022; tf(el, { s: tw(t, a, a + 0.35, 0.85, 1, E.outBack), o: tw(t, a, a + 0.2, 0, 1) }); });
      const on = $("slotOn");
      tf(on, { s: t < C[1] ? 0 : E.outBack(P(t, C[1], C[1] + 0.3)), o: t < C[1] ? 0 : 1 });
      $("slotPick").style.transform = `scale(${1 + wobble(t, C[1], 0.08, 9, 26)})`;
      const fw = $("formWhen");
      fw.style.transform = `scale(${t < C[1] + 0.05 ? 0 : E.outBackBig(P(t, C[1] + 0.05, C[1] + 0.35))})`;
      fw.style.display = "inline-block";
      TL.fields.forEach((f, i) => {
        const fl = S.fields[i];
        const nn = clamp(Math.floor((t - f.t0) * TL.fieldsCps), 0, f.text.length);
        fl.tx.textContent = f.text.slice(0, nn);
        const end = f.t0 + f.text.length / TL.fieldsCps;
        const focus = t > f.t0 - 0.06 && t < end + 0.08;
        fl.box.classList.toggle("focus", focus);
        show(fl.caret, focus);
      });
      const btn = $("btn");
      const press = Math.abs(t - C[2]) < 0.07 ? 0.95 : 1 + wobble(t, C[2] + 0.07, 0.03, 10, 24);
      btn.style.transform = `scale(${press})`;
      btn.style.background = t > 8.72 ? "#22314F" : "";
      setO($("btnLabel"), tw(t, C[2] + 0.04, C[2] + 0.12, 1, 0));
      const spin = $("spin");
      setO(spin, tw(t, C[2] + 0.08, C[2] + 0.16, 0, 1));
      spin.style.transform = `rotate(${t * 900}deg)`;
    }

    /* page C: success */
    const pc = $("pageC");
    const pcOn = t > 9.3;
    show(pc, pcOn);
    if (pcOn) {
      const ts = TL.success;
      setO(pc, tw(t, 9.3, 9.38, 0, 1));
      $("checkBg").style.transform = `scale(${t < ts ? 0 : E.outBackBig(P(t, ts, ts + 0.42))})`;
      const ring2 = $("checkRing");
      ring2.style.transform = `scale(${tw(t, ts + 0.05, ts + 0.6, 1, 1.75, E.outCubic)})`;
      ring2.style.opacity = t < ts + 0.05 ? 0 : tw(t, ts + 0.05, ts + 0.6, 0.9, 0);
      const kk = E.outCubic(P(t, ts + 0.14, ts + 0.42));
      S.checkPath.style.strokeDasharray = `${S.checkLen}`;
      S.checkPath.style.strokeDashoffset = `${S.checkLen * (1 - kk)}`;
      S.rays.forEach((ry) => {
        const h = tw(t, ts + 0.06, ts + 0.4, 70, 112, E.outCubic), tl = tw(t, ts + 0.14, ts + 0.5, 70, 112, E.outCubic);
        const c = Math.cos(ry.ang), s = Math.sin(ry.ang);
        ry.el.setAttribute("x1", 75 + c * tl); ry.el.setAttribute("y1", 75 + s * tl);
        ry.el.setAttribute("x2", 75 + c * h); ry.el.setAttribute("y2", 75 + s * h);
        ry.el.style.opacity = h - tl > 0.5 ? 1 : 0;
      });
      $$("#pageC .mi").forEach((el, i) => maskLine(el, t, ts + 0.22 + i * 0.1, 1e9, 0.55));
      S.sums.forEach((el, i) => { const a = ts + 0.45 + i * 0.07; tf(el, { y: tw(t, a, a + 0.4, 20, 0, E.outBack), o: tw(t, a, a + 0.2, 0, 1) }); });
    }

    /* cursor (lives inside the camera, so it rides the zooms) */
    const c1 = [S.card1.x + S.card1.w - 190, S.card1.cy + 6];
    const c2 = [S.slot.cx + 8, S.slot.cy + 6];
    const c3 = [S.btn.cx + 40, S.btn.cy + 4];
    let p;
    if (t < 6.0) p = arc(t, 5.02, 5.52, [820, 690], c1, 0.2);
    else if (t < 6.9) p = arc(t, 6.15, 6.6, c1, [640, 610], -0.15);
    else if (t < 7.6) p = arc(t, 6.92, 7.42, [640, 610], c2, 0.22);
    else if (t < 8.4) p = arc(t, 7.62, 8.05, c2, [S.form.x + 70, S.form.y + 250], -0.12);
    else p = arc(t, 8.4, 8.84, [S.form.x + 70, S.form.y + 250], c3, 0.2);
    const pressK = C.slice(0, 3).some((c) => Math.abs(t - c - 0.01) < 0.06) ? 0.82 : 1;
    tf($("cursor"), { x: p[0] - 6, y: p[1] - 3, s: pressK, o: t < 9.2 ? tw(t, 4.98, 5.12, 0, 1) : tw(t, 9.2, 9.4, 1, 0) });
    const rp = $("ripple");
    const last = [...C.slice(0, 3)].reverse().find((c) => t >= c);
    if (last !== undefined && t < last + 0.5) {
      const at = last === C[0] ? c1 : last === C[1] ? c2 : c3;
      tf(rp, { x: at[0], y: at[1], s: tw(t, last, last + 0.48, 0.3, 2.6, E.outCubic), o: tw(t, last, last + 0.48, 0.95, 0) });
    } else setO(rp, 0);

    /* phone + pass */
    const ph = $("phone");
    const phOn = t > 10.15;
    show(ph, phOn);
    if (phOn) {
      const st = wobble(t, TL.stamp, 7, 10, 40);
      tf(ph, {
        x: kf(t, [[12.0, 0], [12.45, 720, E.inExpo]]) + st,
        y: kf(t, [[10.18, 820], [10.78, 0, E.outQuint]]),
        r: kf(t, [[10.18, 16], [10.85, -4, E.outQuint], [12.0, -4], [12.45, 14, E.inExpo]]),
      });
      const tn = TL.notif;
      setO($$(".clock", ph)[0], tw(t, TL.notif - 0.05, TL.notif + 0.2, 1, 0));
      setO($$(".date", ph)[0], tw(t, TL.notif - 0.05, TL.notif + 0.2, 1, 0));
      tf($("notif"), { y: tw(t, tn, tn + 0.45, -150, 0, E.outBack), s: tw(t, tn, tn + 0.45, 0.9, 1, E.outBack), o: tw(t, tn, tn + 0.12, 0, 1) });
      tf($("pass"), { y: tw(t, 10.92, 11.35, 50, 0, E.outExpo), s: tw(t, 10.92, 11.35, 0.92, 1, E.outExpo), o: tw(t, 10.92, 11.1, 0, 1) });
      for (const c of S.qr) { const a = 11.05 + c.d * 0.32; c.el.style.opacity = E.outCubic(P(t, a, a + 0.12)); }
      const tsp = TL.stamp;
      tf($("stampEl"), { s: t < tsp ? 2.4 : lerp(2.4, 1, E.outBack(P(t, tsp, tsp + 0.25))), r: -12, o: t < tsp ? 0 : tw(t, tsp, tsp + 0.06, 0, 1) });
    }
  }

  /* =================================================================== */
  function outro(t, C) {
    const out = $("outro");
    out.style.transform = `scale(${tw(t, 13.3, 15, 1, 1.035, E.lin)})`;

    /* recap: 1 -> 2 -> 3 */
    const R = TL.recap, xs = [560, 960, 1360], y = 470;
    const collapse = E.inExpo(P(t, 13.12, 13.4));
    ["n1", "n2", "n3"].forEach((id, i) => {
      const el = $(id);
      const s = t < R[i] ? 0 : E.outBackBig(P(t, R[i], R[i] + 0.36));
      tf(el, { x: lerp(xs[i], 960, collapse), y, s: s * lerp(1, 0.3, collapse), o: t < R[i] ? 0 : 1 - collapse });
    });
    const draw = E.inOutCubic(P(t, 12.3, 13.0));
    const retract = E.inExpo(P(t, 13.12, 13.38));
    $("rlBase").style.opacity = 1;
    segment(S.rl, S.rlLen, retract * 0.5, lerp(draw, 0.5, retract));
    const fl = $("rlFlow");
    fl.style.strokeDashoffset = `${-t * 320}`;
    fl.style.opacity = (1 - retract) * tw(t, 12.75, 12.95, 0, 1);
    show($("recapLine"), t < 13.42);

    /* end logo */
    const th = TL.logoHit;
    const lg = $("endLogo");
    const lx0 = (W - S.endLogoW) / 2, ly0 = 318;
    const center = (S.endLogoW - 150) / 2;
    tf(lg, { x: lx0 + tw(t, th + 0.12, th + 0.6, center, 0, E.outExpo), y: ly0, o: t < th ? 0 : 1 });
    const mk = lg.querySelector(".mark");
    mk.style.transform = `scale(${t < th ? 0 : E.outBackBig(P(t, th, th + 0.4))}) rotate(${tw(t, th, th + 0.5, -30, 0)}deg)`;
    $("endWord").style.transform = `translate3d(${tw(t, th + 0.18, th + 0.66, -104, 0, E.outExpo)}%,0,0)`;
    tf($("endShock"), { x: 885, y: ly0, s: tw(t, th, th + 0.6, 0.9, 3.6), o: t < th ? 0 : tw(t, th, th + 0.6, 0.9, 0) });

    const url = $("endUrl");
    const ua = 13.72;
    const pressU = Math.abs(t - C[3]) < 0.07 ? 0.95 : 1 + wobble(t, C[3] + 0.07, 0.03, 10, 24);
    url.style.left = `${960 - S.endUrlW / 2}px`;
    tf(url, { y: tw(t, ua, ua + 0.5, 40, 0, E.outExpo), s: tw(t, ua, ua + 0.5, 0.86, 1, E.outBack) * pressU, o: tw(t, ua, ua + 0.2, 0, 1) });
    $$("#endTag .mi").forEach((el, i) => maskLine(el, t, 13.95 + i * 0.11, 1e9, 0.6));

    const tip = [960 + S.endUrlW / 2 - 110, 640 + S.endUrlH / 2 + 6];
    const cp = arc(t, 14.02, 14.46, [1420, 940], tip, -0.2);
    tf($("endCursor"), { x: cp[0] - 7, y: cp[1] - 4, s: Math.abs(t - C[3] - 0.01) < 0.06 ? 0.82 : 1, o: tw(t, 13.98, 14.12, 0, 1) });
    tf($("endRipple"), { x: tip[0], y: tip[1], s: tw(t, C[3], C[3] + 0.5, 0.3, 2.6, E.outCubic), o: t < C[3] ? 0 : tw(t, C[3], C[3] + 0.5, 0.95, 0) });
  }

  /* ---------- boot ---------- */
  window.seek = seek;
  window.__ready = document.fonts.ready.then(() => {
    build();
    const q = new URLSearchParams(location.search);
    if (q.has("render")) { seek(0); return true; }
    if (q.has("t")) { seek(parseFloat(q.get("t"))); return true; }
    // live preview: fit to window and loop
    document.body.classList.add("preview");
    const fit = () => { $("stage").style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`; };
    fit(); addEventListener("resize", fit);
    const t0 = performance.now();
    const loop = (now) => { seek(((now - t0) / 1000) % TL.duration); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return true;
  });
})();
