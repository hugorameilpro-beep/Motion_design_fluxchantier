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

  // public planning geometry (mirrors the site's week grid: 30-min rows, Mon–Fri)
  const G = { gutter: 54, col: 176, head: 40, row: 36, rows: 10 };
  const OCCUPIED = [[0, 0, 2], [0, 5, 2], [1, 1, 1], [1, 6, 2], [2, 2, 3], [3, 0, 1], [3, 4, 2], [4, 3, 2], [4, 7, 2]];
  const TARGET = { day: 1, row: 3 }; // Mar. 6 oct. — 08:30
  const hhmm = (row) => { const m = 420 + row * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

  function build() {
    // background flux: dotted rails + travelling comets in emerald / lime
    const bg = $("bgflux");
    const r = rng(7);
    S.bgPaths = [];
    for (let i = 0; i < 7; i++) {
      const y0 = 90 + i * 150 + r() * 60, y1 = y0 + (r() - 0.5) * 420, a = 120 + r() * 160;
      const d = `M-120 ${y0} C 520 ${y0 + a}, 1300 ${y1 - a}, 2040 ${y1}`;
      svgEl("path", { d, stroke: "rgba(148,163,184,.08)", "stroke-width": 2, "stroke-dasharray": "2 18" }, bg);
      const c = svgEl("path", { d, stroke: i % 3 === 0 ? "rgba(163,230,53,.5)" : "rgba(16,185,129,.55)", "stroke-width": 3 }, bg);
      const len = c.getTotalLength();
      S.bgPaths.push({ el: c, len, speed: 260 + r() * 260, phase: r() * len, dash: 140 + r() * 120 });
    }

    // intro speed lines, echoing the streaks of the truck mark
    const fx = $("introFlux");
    const cols = ["#10B981", "#A3E635", "#F8FAFC", "#059669", "#34D399", "#94A3B8", "#10B981"];
    S.introPaths = cols.map((col, i) => {
      const y = 540 + (i - 3) * 30 + (i % 2 ? 6 : -6);
      const d = `M-150 ${y + (i - 3) * 22} C 300 ${y + (i - 3) * 14}, 520 ${y}, 760 ${y}`;
      const p = svgEl("path", { d, stroke: col, "stroke-width": i % 3 === 0 ? 9 : 6, opacity: col === "#F8FAFC" ? 0.5 : 0.95 }, fx);
      return { el: p, len: p.getTotalLength(), i };
    });

    // week grid
    const g = $("grid2");
    const tc = document.createElement("div"); tc.className = "tcol"; g.appendChild(tc);
    for (let i = 0; i < G.rows; i++) { const d = document.createElement("div"); d.textContent = hhmm(i); if (i % 2 === 0) d.className = "h"; tc.appendChild(d); }
    const days = [["Lun.", "5 oct."], ["Mar.", "6 oct."], ["Mer.", "7 oct."], ["Jeu.", "8 oct."], ["Ven.", "9 oct."]];
    days.forEach(([n, dm], i) => {
      const c = document.createElement("div"); c.className = "dcol"; c.style.left = `${G.gutter + i * G.col}px`;
      c.innerHTML = `<div class="dh"><b>${n}</b><small>${dm}</small></div>` + Array.from({ length: G.rows }, () => '<div class="cell"></div>').join("");
      g.appendChild(c);
    });
    const block = (day, row, span, id) => {
      const b = document.createElement("div"); b.className = "blk"; if (id) b.id = id;
      b.style.left = `${G.gutter + day * G.col + 2}px`; b.style.width = `${G.col - 4}px`; b.style.right = "auto";
      b.style.top = `${G.head + row * G.row + 1}px`; b.style.height = `${span * G.row - 4}px`;
      b.innerHTML = `<b><span class="emo">⚪</span> Réservé</b>` + (span > 1 ? `<span><span class="emo">⏱️</span> ${hhmm(row)} · Occupé</span>` : "");
      g.appendChild(b); return b;
    };
    S.blocks = OCCUPIED.map(([d, r0, s]) => block(d, r0, s));
    S.newBlk = block(TARGET.day, TARGET.row, 2, "newBlk");
    const cell = { x: G.gutter + TARGET.day * G.col, y: G.head + TARGET.row * G.row, w: G.col, h: G.row };
    const mk = (id, css) => { const e = document.createElement("div"); e.id = id; Object.assign(e.style, css); g.insertBefore(e, g.children[1]); return e; };
    mk("hover", { left: `${cell.x + 1}px`, top: `${cell.y + 1}px`, width: `${cell.w - 1}px`, height: `${cell.h - 1}px` });
    mk("hoverRing", { left: `${cell.x + 2}px`, top: `${cell.y + 1}px`, width: `${cell.w - 4}px`, height: `${cell.h - 3}px` });
    const tip = document.createElement("div"); tip.id = "tip"; tip.textContent = "Créneau libre — réserver"; g.appendChild(tip);
    tip.style.left = `${cell.x + 60}px`; tip.style.top = `${cell.y - 34}px`;

    // measurements (taken with every transform at identity)
    const cam = $("camWrap");
    S.cell = posIn($("hover"), cam);
    S.f0 = posIn($("f0"), cam);
    S.box = posIn($("box"), cam);
    S.confirm = posIn($("confirm"), cam);
    S.logoW = $("logo").offsetWidth;
    S.endLogoW = $("endLogo").offsetWidth;
    S.endUrlW = $("endUrl").offsetWidth;
    S.endUrlH = $("endUrl").offsetHeight;

    S.pLine = $("pLinePath"); S.pLineLen = S.pLine.getTotalLength();
    S.rl = $("rlBase"); S.rlLen = S.rl.getTotalLength();
    S.steps = [1, 2, 3].map((i) => ({ el: $("st" + i), lines: $$(".mi", $("st" + i)) }));
    S.ldA = $$("#pageA .ld");
    S.fields = [0, 1].map((i) => ({ box: $("f" + i), tx: $$(".tx", $("f" + i))[0], caret: $$(".caret", $("f" + i))[0], ph: $$(".phx", $("f" + i))[0] }));
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
  // a select whose value flips from A to B at time ts (old value slides up, new one in)
  function flip(a, b, t, ts) {
    const k = E.outExpo(P(t, ts, ts + 0.3));
    a.style.transform = `translate3d(0,${-k * 24}px,0)`; a.style.opacity = 1 - k;
    b.style.transform = `translate3d(0,${(1 - k) * 24}px,0)`; b.style.opacity = k;
  }

  /* =================================================================== */
  function seek(t) {
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

    /* ---------- S1 intro: speed lines, the truck drives into the pill ---------- */
    const pop = TL.logoPop;
    show($("introFlux"), t < 1.1);
    for (const p of S.introPaths) {
      const d = p.i * 0.025;
      segment(p.el, p.len, E.inCubic(P(t, 0.25 + d, 0.8 + d)), E.inOutCubic(P(t, 0.0 + d, 0.5 + d)));
    }
    tf($("shock"), { x: 862, y: 442, s: tw(t, pop, pop + 0.6, 0.9, 3.2, E.outCubic), o: t < pop ? 0 : tw(t, pop, pop + 0.6, 0.9, 0) });

    const logo = $("logo");
    const lx0 = (W - S.logoW) / 2, ly0 = 442;
    const center = (S.logoW - 430) / 2;
    const slide = tw(t, 0.86, 1.3, center, 0, E.outExpo);
    const toCorner = E.inOutExpo(P(t, 1.55, 2.0));
    tf(logo, { x: lerp(lx0 + slide, 110, toCorner), y: lerp(ly0, 52, toCorner), s: lerp(1, 0.265, toCorner), o: t < 12.0 ? 1 : tw(t, 12.0, 12.3, 1, 0) });
    show(logo, t < 12.35);
    const pill = $("logoPill");
    pill.style.transform = `scale(${t < 0.26 ? 0 : E.outBack(P(t, 0.26, 0.56)) * (1 + wobble(t, pop, 0.05, 9, 30))})`;
    const truck = $("logoTruck");
    const drive = E.outExpo(P(t, 0.26, pop));
    truck.style.transform = `translate3d(${lerp(-520, 0, drive)}px,0,0) skewX(${lerp(-14, 0, drive) + wobble(t, pop, 6, 10, 26)}deg) scaleX(${1 + (1 - drive) * 0.12})`;
    $("logoWord").style.transform = `translate3d(${tw(t, 0.9, 1.4, -104, 0, E.outExpo)}%,0,0)`;
    show($("logoTag"), t > 0.9 && t < 1.95);
    maskLine($$("#logoTag .mi")[0], t, 1.05, 1.5, 0.5, 0.25);

    /* ---------- guide label (top-right) ---------- */
    tf($("guide"), { x: t < 12 ? tw(t, 1.8, 2.3, 40, 0, E.outExpo) : 0, o: t < 12 ? tw(t, 1.8, 2.2, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });

    /* ---------- S2 promise ---------- */
    const promiseOn = t > 1.8 && t < 3.82;
    show($("promise"), promiseOn);
    if (promiseOn) {
      maskLine($$("#pLabel .mi")[0], t, 1.92, 3.2, 0.55, 0.28);
      const sl = TL.slam;
      tf($("pThree"), { s: t < sl ? 0 : lerp(2.6, 1, E.outBack(P(t, sl, sl + 0.4))), r: tw(t, sl, sl + 0.4, -10, 0, E.outBack), o: t < sl ? 0 : tw(t, sl, sl + 0.06, 0, 1) });
      maskLine($("pWord"), t, sl + 0.08, 3.22, 0.5, 0.3);
      segment(S.pLine, S.pLineLen, E.inCubic(P(t, 3.15, 3.4)), E.outExpo(P(t, 2.62, 3.05)));
      maskLine($$("#pSub .mi")[0], t, 2.78, 3.24, 0.55, 0.28);
      $("pBig").style.transform = `translate3d(${wobble(t, sl, 14, 10, 38)}px, ${wobble(t, sl, 8, 10, 31)}px, 0) scale(${tw(t, sl, 3.4, 1, 1.05, E.lin)})`;
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

    /* ---------- S7 Synapsis signature ---------- */
    const sigOn = t > TL.sig.fade[0];
    show($("sig"), sigOn);
    if (sigOn) signature(t);
  }

  /* =================================================================== */
  function signature(t) {
    const g = TL.sig;
    setO($("sig"), E.inOutCubic(P(t, g.fade[0], g.fade[1])));
    // logo: smooth scale 0.8 -> 1.0 with an opacity fade
    const [l0, l1] = g.logo;
    tf($("sigMark"), { s: lerp(0.8, 1, E.outCubic(P(t, l0, l1))), o: E.outCubic(P(t, l0, l0 + 0.5)) });
    setO($("sigGlow"), 0.9 * E.outCubic(P(t, l0, l1 + 0.3)));
    // name then URL: light slide-up + fade
    [["sigName", g.name], ["sigUrl", g.url]].forEach(([id, a]) => {
      tf($(id), { y: tw(t, a, a + 0.6, 26, 0, E.outCubic), o: E.outCubic(P(t, a, a + 0.5)) });
    });
    $("sigBody").style.transform = `scale(${tw(t, l1, TL.duration, 1, 1.02, E.lin)})`;
  }

  /* =================================================================== */
  function steps(t, C) {
    /* left column copy */
    [[3.95, 6.2], [6.45, 9.1], [9.32, 12.0]].forEach(([tin, tout], i) => {
      const st = S.steps[i];
      const on = t > tin - 0.02 && t < tout + 0.6;
      show(st.el, on);
      if (on) st.lines.forEach((ln, j) => maskLine(ln, t, tin + j * 0.055, tout + j * 0.025, 0.62, 0.3));
    });

    /* stepper */
    tf($("stepper"), { y: t < 12 ? tw(t, 4.15, 4.7, 30, 0, E.outExpo) : tw(t, 12.0, 12.3, 0, 30, E.inCubic), o: t < 12 ? tw(t, 4.15, 4.5, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });
    $("stFill").style.width = `${kf(t, [[6.35, 0], [6.8, 220, E.inOutExpo], [9.2, 220], [9.65, 440, E.inOutExpo]])}px`;
    [[1, 4.3], [2, 6.78], [3, 9.63]].forEach(([i, ton]) => {
      const d = $("sd" + i);
      d.classList.toggle("on", t >= ton);
      d.style.transform = `scale(${1 + wobble(t, ton, 0.4, 8, 22)})`;
    });

    /* camera on the browser */
    const ts = TL.success;
    const cx = kf(t, [[3.86, 380], [4.55, 0, E.outExpo], [5.1, 0], [5.55, 90], [6.1, 90], [6.55, 0], [10.15, 0], [10.7, -150], [12.0, -150], [12.45, -760, E.inExpo]]);
    const cy = kf(t, [[3.86, 90], [4.55, 0, E.outExpo], [5.1, 0], [5.55, -30], [6.1, -30], [6.55, 0], [7.0, 0], [7.3, 10], [8.05, 10], [8.35, -50], [8.95, -50], [9.3, 0]]);
    const cs = kf(t, [[3.86, 0.8], [4.55, 1, E.outExpo], [5.1, 1], [5.55, 1.12], [6.1, 1.12], [6.55, 1], [7.0, 1], [7.3, 1.08], [8.95, 1.08], [9.3, 1], [12.0, 1], [12.45, 0.72, E.inExpo]]);
    const cry = kf(t, [[3.86, -26], [4.55, -8, E.outExpo], [6.5, -4], [10.15, -4], [10.7, -10], [12.0, -10], [12.45, -28, E.inExpo]]);
    const crx = kf(t, [[3.86, 12], [4.55, 4, E.outExpo], [9.0, 2], [12.0, 2], [12.45, 10, E.inExpo]]);
    tf($("cam"), { x: cx + wobble(t, ts, 8, 11, 40), y: cy + wobble(t, ts, 5, 11, 33), s: cs, rx: crx, ry: cry,
      o: kf(t, [[3.86, 0], [4.12, 1], [12.12, 1], [12.45, 0]]), blur: kf(t, [[12.05, 0], [12.45, 16, E.inCubic]]) });

    /* URL bar typing, then the app loads */
    const u = TL.url;
    const n = clamp(Math.floor((t - u.t0) * u.cps), 0, u.text.length);
    $("urlText").textContent = u.text.slice(0, n);
    const typing = t > u.t0 - 0.15 && t < u.t0 + u.text.length / u.cps + 0.1;
    show($("urlCaret"), typing && (n < u.text.length || Math.floor(t * 6) % 2 === 0));
    const loadT = u.t0 + u.text.length / u.cps + 0.08;
    setO($("appbar"), tw(t, loadT, loadT + 0.15, 0, 1));

    /* page A: public week planning */
    S.ldA.forEach((el, i) => { const a = loadT + 0.08 + i * 0.07; tf(el, { y: tw(t, a, a + 0.45, 26, 0, E.outExpo), o: tw(t, a, a + 0.25, 0, 1) }); });
    S.blocks.forEach((b, i) => { const a = loadT + 0.3 + i * 0.035; tf(b, { s: tw(t, a, a + 0.3, 0.8, 1, E.outBack), o: tw(t, a, a + 0.18, 0, 1) }); });
    setO($("hover"), t < 9.3 ? tw(t, 5.3, 5.4, 0, 1) : 0);
    const hr = $("hoverRing");
    tf(hr, { s: 1 + wobble(t, C[0], 0.06, 10, 28), o: t < C[0] || t > 9.4 ? 0 : 1 });
    tf($("tip"), { y: tw(t, 5.38, 5.6, 6, 0, E.outExpo), o: t < 5.38 ? 0 : t < C[0] ? tw(t, 5.38, 5.5, 0, 1) : tw(t, C[0], C[0] + 0.1, 1, 0) });
    // after submit: success banner, planning shifts down, the slot is now taken
    const bannerK = E.outExpo(P(t, ts + 0.05, ts + 0.5));
    tf($("banner"), { y: lerp(-24, 0, bannerK), o: t < ts ? 0 : tw(t, ts + 0.05, ts + 0.2, 0, 1) });
    $("secA").style.transform = `translate3d(0,${bannerK * 62}px,0)`;
    tf(S.newBlk, { s: t < ts + 0.3 ? 0 : E.outBackBig(P(t, ts + 0.3, ts + 0.65)), o: t < ts + 0.3 ? 0 : 1 });

    /* page B: "Nouvelle demande de livraison" modal */
    const ov = $("overlay");
    const ovOn = t > 6.15 && t < 9.5;
    show(ov, ovOn);
    if (ovOn) {
      setO(ov, t < 9.2 ? tw(t, 6.15, 6.4, 0, 1) : tw(t, 9.25, 9.45, 1, 0));
      tf($("form"), { y: t < 9.2 ? tw(t, 6.2, 6.7, 46, 0, E.outExpo) : 0, s: t < 9.2 ? tw(t, 6.2, 6.7, 0.94, 1, E.outExpo) : tw(t, 9.25, 9.45, 1, 0.95) });
      TL.fields.forEach((f, i) => {
        const fl = S.fields[i];
        const nn = clamp(Math.floor((t - f.t0) * TL.fieldsCps), 0, f.text.length);
        fl.tx.textContent = f.text.slice(0, nn);
        const end = f.t0 + f.text.length / TL.fieldsCps;
        const focus = t > (i === 0 ? C[1] : f.t0 - 0.06) && t < end + 0.08;
        fl.box.classList.toggle("focus", focus);
        show(fl.caret, focus);
        show(fl.ph, nn === 0);
      });
      flip($("vehA"), $("vehB"), t, TL.selects[0]);
      flip($("zoneA"), $("zoneB"), t, TL.selects[1]);
      $("fVeh").classList.toggle("focus", Math.abs(t - TL.selects[0] - 0.05) < 0.14);
      $("fZone").classList.toggle("focus", Math.abs(t - TL.selects[1] - 0.05) < 0.14);
      tf($("okbox"), { y: tw(t, TL.okBox, TL.okBox + 0.35, 10, 0, E.outBack), o: tw(t, TL.okBox, TL.okBox + 0.15, 0, 1) });
      $("boxOn").style.transform = `scale(${t < C[2] ? 0 : E.outBackBig(P(t, C[2], C[2] + 0.25))})`;
      $("box").style.transform = `scale(${1 + wobble(t, C[2], 0.25, 10, 28)})`;
      const cf = $("confirm");
      cf.style.opacity = t < C[2] ? 0.5 : 1;   // the real button stays disabled until the CGU box is ticked
      cf.style.transform = `scale(${Math.abs(t - C[3]) < 0.07 ? 0.95 : 1 + wobble(t, C[3] + 0.07, 0.03, 10, 24)})`;
      cf.style.background = t > 8.7 && t < C[3] + 0.1 ? "linear-gradient(135deg, #047857, #059669)" : "";   // hover
      setO($("confirmLbl"), t < C[3] + 0.04 ? 1 : 0);
      setO($("confirmAlt"), t < C[3] + 0.04 ? 0 : 1);
    }

    /* cursor (lives inside the camera, so it rides the zooms) */
    const c1 = [S.cell.cx + 10, S.cell.cy + 6];
    const c2 = [S.f0.x + 120, S.f0.cy + 4];
    const c3 = [S.box.cx + 2, S.box.cy + 2];
    const c4 = [S.confirm.cx + 30, S.confirm.cy + 4];
    let p;
    if (t < 6.0) p = arc(t, 5.02, 5.52, [820, 690], c1, 0.2);
    else if (t < 7.2) p = arc(t, 6.62, 6.98, c1, c2, -0.15);
    else if (t < 8.0) p = arc(t, 7.3, 7.8, c2, [c2[0] + 160, c2[1] + 120], 0.1);
    else if (t < 8.6) p = arc(t, 8.02, 8.38, [c2[0] + 160, c2[1] + 120], c3, 0.18);
    else p = arc(t, 8.5, 8.85, c3, c4, -0.15);
    const pressed = C.slice(0, 4).some((c) => Math.abs(t - c - 0.01) < 0.06);
    tf($("cursor"), { x: p[0] - 6, y: p[1] - 3, s: pressed ? 0.82 : 1, o: t < 9.2 ? tw(t, 4.98, 5.12, 0, 1) : tw(t, 9.2, 9.4, 1, 0) });
    const rp = $("ripple");
    const last = C.slice(0, 4).reverse().find((c) => t >= c);
    if (last !== undefined && t < last + 0.5) {
      const at = [c1, c2, c3, c4][C.indexOf(last)];
      tf(rp, { x: at[0], y: at[1], s: tw(t, last, last + 0.48, 0.3, 2.4, E.outCubic), o: tw(t, last, last + 0.48, 0.95, 0) });
    } else setO(rp, 0);

    /* phone: the confirmation e-mails */
    const ph = $("phone");
    show(ph, t > 10.15);
    if (t > 10.15) {
      const tv = TL.stamp, tn = TL.notif;
      tf(ph, {
        x: kf(t, [[12.0, 0], [12.45, 720, E.inExpo]]) + wobble(t, tv, 6, 10, 40),
        y: kf(t, [[10.18, 840], [10.78, 0, E.outQuint]]),
        r: kf(t, [[10.18, 16], [10.85, -4, E.outQuint], [12.0, -4], [12.45, 14, E.inExpo]]),
      });
      setO($$(".clock", ph)[0], tw(t, tn - 0.05, tn + 0.2, 1, 0));
      setO($$(".date", ph)[0], tw(t, tn - 0.05, tn + 0.2, 1, 0));
      tf($("notif1"), { y: tw(t, tn, tn + 0.45, -150, 0, E.outBack), s: t < tv ? tw(t, tn, tn + 0.45, 0.9, 1, E.outBack) : tw(t, tv, tv + 0.25, 1, 0.92), o: t < tv ? tw(t, tn, tn + 0.12, 0, 1) : tw(t, tv, tv + 0.2, 1, 0) });
      tf($("notif2"), { y: tw(t, tv, tv + 0.45, -150, 0, E.outBack), s: tw(t, tv, tv + 0.45, 0.9, 1, E.outBack), o: tw(t, tv, tv + 0.12, 0, 1) });
      tf($("mail"), { y: tw(t, 10.92, 11.35, 60, 0, E.outExpo), s: tw(t, 10.92, 11.35, 0.92, 1, E.outExpo), o: tw(t, 10.92, 11.1, 0, 1) });
      // status flips from "En attente de validation" to "Validée"
      const v = E.outExpo(P(t, tv, tv + 0.35));
      tf($("ttlWait"), { y: -v * 22, o: 1 - v }); tf($("ttlOk"), { y: (1 - v) * 22, o: v });
      tf($("inWait"), { y: -v * 16, o: 1 - v }); tf($("inOk"), { y: (1 - v) * 16, o: v });
      tf($("chipWait"), { o: 1 - v, s: 1 - v * 0.2 });
      tf($("chipOk"), { s: t < tv ? 0.6 : E.outBackBig(P(t, tv, tv + 0.35)), o: v });
      tf($("gps"), { y: tw(t, tv + 0.15, tv + 0.5, 12, 0, E.outBack), o: tw(t, tv + 0.15, tv + 0.3, 0, 1) });
      setO($("flash"), t < tv ? 0 : tw(t, tv, tv + 0.5, 1, 0));
    }
  }

  /* =================================================================== */
  function outro(t, C) {
    $("outro").style.transform = `scale(${tw(t, 13.3, 15, 1, 1.035, E.lin)})`;

    /* recap: 1 -> 2 -> 3 */
    const R = TL.recap, xs = [560, 960, 1360], y = 470;
    const collapse = E.inExpo(P(t, 13.12, 13.4));
    ["n1", "n2", "n3"].forEach((id, i) => {
      const s = t < R[i] ? 0 : E.outBackBig(P(t, R[i], R[i] + 0.36));
      tf($(id), { x: lerp(xs[i], 960, collapse), y, s: s * lerp(1, 0.3, collapse), o: t < R[i] ? 0 : 1 - collapse });
    });
    const draw = E.inOutCubic(P(t, 12.3, 13.0));
    const retract = E.inExpo(P(t, 13.12, 13.38));
    segment(S.rl, S.rlLen, retract * 0.5, lerp(draw, 0.5, retract));
    const fl = $("rlFlow");
    fl.style.strokeDashoffset = `${-t * 320}`;
    fl.style.opacity = (1 - retract) * tw(t, 12.75, 12.95, 0, 1);
    show($("recapLine"), t < 13.42);

    /* end logo: the pill pops, the truck drives in, the wordmark follows */
    const th = TL.logoHit;
    const lx0 = (W - S.endLogoW) / 2, ly0 = 300;
    const center = (S.endLogoW - 380) / 2;
    tf($("endLogo"), { x: lx0 + tw(t, th + 0.14, th + 0.6, center, 0, E.outExpo), y: ly0, o: t < th - 0.05 ? 0 : 1 });
    $("endPill").style.transform = `scale(${t < th - 0.05 ? 0 : E.outBackBig(P(t, th - 0.05, th + 0.35))})`;
    const drive = E.outExpo(P(t, th - 0.02, th + 0.32));
    $("endTruck").style.transform = `translate3d(${lerp(-460, 0, drive)}px,0,0) skewX(${lerp(-14, 0, drive) + wobble(t, th + 0.3, 5, 10, 26)}deg)`;
    $("endWord").style.transform = `translate3d(${tw(t, th + 0.2, th + 0.68, -104, 0, E.outExpo)}%,0,0)`;
    tf($("endShock"), { x: 960 - 86, y: ly0, s: tw(t, th, th + 0.6, 0.9, 3.4), o: t < th ? 0 : tw(t, th, th + 0.6, 0.9, 0) });

    const url = $("endUrl");
    const ua = 13.72;
    const pressU = Math.abs(t - C[4]) < 0.07 ? 0.95 : 1 + wobble(t, C[4] + 0.07, 0.03, 10, 24);
    url.style.left = `${960 - S.endUrlW / 2}px`;
    tf(url, { y: tw(t, ua, ua + 0.5, 40, 0, E.outExpo), s: tw(t, ua, ua + 0.5, 0.86, 1, E.outBack) * pressU, o: tw(t, ua, ua + 0.2, 0, 1) });
    $$("#endTag .mi").forEach((el, i) => maskLine(el, t, 13.95 + i * 0.11, 1e9, 0.6));
    maskLine($$("#endSite .mi")[0], t, 14.25, 1e9, 0.6);

    const tip = [960 + S.endUrlW / 2 - 110, 620 + S.endUrlH / 2 + 6];
    const cp = arc(t, 14.02, 14.46, [1420, 960], tip, -0.2);
    tf($("endCursor"), { x: cp[0] - 7, y: cp[1] - 4, s: Math.abs(t - C[4] - 0.01) < 0.06 ? 0.82 : 1, o: tw(t, 13.98, 14.12, 0, 1) });
    tf($("endRipple"), { x: tip[0], y: tip[1], s: tw(t, C[4], C[4] + 0.5, 0.3, 2.6, E.outCubic), o: t < C[4] ? 0 : tw(t, C[4], C[4] + 0.5, 0.95, 0) });
  }

  /* ---------- boot ---------- */
  window.seek = seek;
  const imgs = [...document.images].map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; })));
  window.__ready = Promise.all([document.fonts.ready, ...imgs]).then(() => {
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
