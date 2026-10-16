/* VigiChantier — motion design (15 s guide + Synapsis signature).
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

  const OPENINGS = [ // plan coordinates (966 × 392) and the labels scanned on the phone
    [70, 120, "Fenêtre F07"], [200, 46, "Porte R+1 Nord"], [470, 46, "Baie vitrée B3"], [760, 46, "Fenêtre F12"],
    [896, 150, "Porte Est"], [896, 290, "Fenêtre F21"], [610, 346, "Porte Sud"], [250, 346, "Trappe technique"],
  ];
  const CHART = (() => { // intensity samples: dry morning, then the shower builds past the FORT line
    const v = [];
    for (let i = 0; i < 40; i++) {
      const k = i / 39;
      v.push(0.05 + 0.08 * Math.sin(i * 1.7) ** 2 + (k > 0.6 ? 3.2 * ((k - 0.6) / 0.4) ** 1.6 : 0));
    }
    return v;
  })();

  function build() {
    // rain streaks
    const rain = $("rain");
    const r = rng(11);
    S.drops = [];
    for (let i = 0; i < 90; i++) {
      const len = 14 + r() * 30;
      const el = svgEl("line", { x1: 0, y1: 0, x2: -len * 0.28, y2: len, stroke: r() < 0.25 ? "#A3E635" : "#34D399", "stroke-width": r() < 0.3 ? 2.4 : 1.6 }, rain);
      S.drops.push({ el, x0: r() * 2300, phase: r() * 1300, speed: 700 + r() * 600, a: 0.08 + r() * 0.16 });
    }

    // chart
    const ch = $("chart");
    const X = (i) => (i / (CHART.length - 1)) * 928, Y = (v) => 200 - (v / 4) * 190;
    const d = CHART.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const defs = svgEl("defs", {}, ch);
    const lg = svgEl("linearGradient", { id: "area", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svgEl("stop", { offset: 0, "stop-color": "#34D399", "stop-opacity": 0.35 }, lg);
    svgEl("stop", { offset: 1, "stop-color": "#34D399", "stop-opacity": 0 }, lg);
    for (let i = 0; i <= 4; i++) svgEl("line", { x1: 0, x2: 928, y1: Y(i), y2: Y(i), stroke: "#334155", "stroke-width": 1 }, ch);
    S.area = svgEl("path", { d: `${d} L928 200 L0 200 Z`, fill: "url(#area)" }, ch);
    svgEl("line", { x1: 0, x2: 928, y1: Y(2), y2: Y(2), stroke: "#F87171", "stroke-width": 2, "stroke-dasharray": "7 7" }, ch);
    const lab = svgEl("text", { x: 8, y: Y(2) - 8, fill: "#F87171", "font-family": "Inter", "font-size": 12, "font-weight": 700 }, ch);
    lab.textContent = "Seuil FORT · 2 mm/h";
    S.line = svgEl("path", { d, fill: "none", stroke: "#34D399", "stroke-width": 3.5, "stroke-linejoin": "round", "stroke-linecap": "round" }, ch);
    S.lineLen = S.line.getTotalLength();
    S.tip = svgEl("circle", { cx: 928, cy: Y(CHART[CHART.length - 1]), r: 6, fill: "#F87171" }, ch);
    S.tipRing = svgEl("circle", { cx: 928, cy: Y(CHART[CHART.length - 1]), r: 6, fill: "none", stroke: "#F87171", "stroke-width": 2 }, ch);

    // plan dots + phone scan rows
    const plan = $("plan");
    S.dots = OPENINGS.map(([x, y], i) => {
      const e = document.createElement("div");
      e.className = "odot"; e.style.left = `${x}px`; e.style.top = `${y}px`; e.style.background = "#64748B";
      e.innerHTML = `${i + 1}<span class="g">✓</span>`;
      plan.appendChild(e);
      return { el: e, g: e.querySelector(".g") };
    });
    const list = $("scanList");
    S.rows = OPENINGS.map(([, , label]) => {
      const e = document.createElement("div");
      e.className = "srow"; e.innerHTML = `<span>${label}</span><span class="ok">✓ Sécurisé</span>`;
      list.appendChild(e);
      return e;
    });

    // measurements (taken with every transform at identity)
    const cam = $("camWrap");
    S.logoW = $("logo").offsetWidth;
    S.endLogoW = $("endLogo").offsetWidth;
    S.endUrlW = $("endUrl").offsetWidth;
    S.endUrlH = $("endUrl").offsetHeight;
    S.scrollMax = $("decision").offsetTop - 18;
    S.lk0 = posIn($("lk0"), cam);
    S.tabRonde = posIn($("tabRonde"), cam);
    S.panelH = $("panel0").offsetHeight;
    S.ulRondeW = $("ulRonde").offsetWidth;
    S.rl = $("rlBase"); S.rlLen = S.rl.getTotalLength();
    S.steps = [1, 2, 3].map((i) => ({ el: $("st" + i), lines: $$(".mi", $("st" + i)) }));
    S.ld = $$("#pageDash .ld");
    S.tiles = $$("#tiles .tile");
    S.waves = $$("#nfc .wave");
    $("panel0").style.overflow = "hidden";
  }

  function arc(t, t0, t1, p0, p1, bend = 0.18, e = E.inOutCubic) {
    const k = e(P(t, t0, t1));
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const cx = mx - dy * bend, cy = my + dx * bend, u = 1 - k;
    return [u * u * p0[0] + 2 * u * k * cx + k * k * p1[0], u * u * p0[1] + 2 * u * k * cy + k * k * p1[1]];
  }
  // crossfade two stacked labels: a leaves upwards, b arrives from below
  function swap(a, b, t, ts, d = 0.35, dist = 22) {
    const k = E.outExpo(P(t, ts, ts + d));
    tf(a, { y: -k * dist, o: 1 - k }); tf(b, { y: (1 - k) * dist, o: k });
  }

  /* =================================================================== */
  function seek(t) {
    const C = TL.clicks;

    /* ---------- background ---------- */
    $("grid").style.transform = `translate3d(${-((t * 14) % 160)}px, ${-((t * 7) % 160)}px, 0)`;
    tf($("glowA"), { x: 1050 + 220 * Math.sin(t * 0.42), y: -160 + 90 * Math.cos(t * 0.55) });
    tf($("glowB"), { x: -260 + 160 * Math.cos(t * 0.37), y: 420 + 120 * Math.sin(t * 0.48) });
    // rain intensity follows the story: drizzle, calm on the dashboard, downpour at the alert
    const storm = kf(t, [[0, 0.7], [1.8, 0.45], [3.8, 0.25], [9.2, 0.25], [9.45, 1.5, E.outCubic], [11.8, 1.2], [12.4, 0.5], [15, 0.4], [15.4, 0]]);
    for (const d of S.drops) {
      const y = ((d.phase + t * d.speed) % 1300) - 110;
      d.el.setAttribute("transform", `translate(${(d.x0 - y * 0.28).toFixed(1)} ${y.toFixed(1)})`);
      d.el.style.opacity = Math.min(1, d.a * storm * 2.2);
    }
    const gr = rng(Math.floor(t * 24) + 1);
    $("grain").style.transform = `translate3d(${Math.floor(gr() * 200 - 100)}px, ${Math.floor(gr() * 200 - 100)}px, 0)`;

    /* ---------- S1 intro: the mark sweeps in, wordmark follows ---------- */
    const pop = TL.logoPop;
    tf($("shock"), { x: 850, y: 430, s: tw(t, pop, pop + 0.6, 0.9, 3.0), o: t < pop ? 0 : tw(t, pop, pop + 0.6, 0.85, 0) });
    const lx0 = (W - S.logoW) / 2, ly0 = 438, center = (S.logoW - 330) / 2;
    const toCorner = E.inOutExpo(P(t, 1.55, 2.0));
    const slide = tw(t, 0.86, 1.3, center, 0, E.outExpo);
    tf($("logo"), { x: lerp(lx0 + slide, 110, toCorner), y: lerp(ly0, 50, toCorner), s: lerp(1, 0.24, toCorner), o: t < 12.0 ? 1 : tw(t, 12.0, 12.3, 1, 0) });
    show($("logo"), t < 12.35);
    $("sweepRect").setAttribute("width", (260 * E.inOutCubic(P(t, 0.08, pop))).toFixed(1));
    $("logoMark").style.transform = `translate3d(0,${tw(t, 0.1, pop, 26, 0, E.outCubic) + wobble(t, pop, 5, 9, 26)}px,0) rotate(${tw(t, 0.1, pop + 0.2, -6, 0)}deg)`;
    $("logoWord").style.transform = `translate3d(${tw(t, 0.9, 1.4, -104, 0, E.outExpo)}%,0,0)`;
    show($("logoTag"), t > 0.9 && t < 1.95);
    maskLine($$("#logoTag .mi")[0], t, 1.05, 1.5, 0.5, 0.25);
    tf($("guide"), { x: t < 12 ? tw(t, 1.8, 2.3, 40, 0, E.outExpo) : 0, o: t < 12 ? tw(t, 1.8, 2.2, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });

    /* ---------- S2 promise: the four modules land on the beat ---------- */
    const promiseOn = t > 1.8 && t < 3.82;
    show($("promise"), promiseOn);
    if (promiseOn) {
      maskLine($$("#pLabel .mi")[0], t, 1.88, 3.2, 0.55, 0.28);
      S.tiles.forEach((el, i) => {
        const a = TL.tiles[i];
        const k = P(t, a, a + 0.42);
        tf(el, { y: t < a ? 70 : lerp(70, 0, E.outExpo(k)), s: t < a ? 0.6 : lerp(0.6, 1, E.outBackBig(k)), r: wobble(t, a, 4, 9, 20), o: t < a ? 0 : tw(t, a, a + 0.12, 0, 1) });
        el.style.boxShadow = `0 30px 60px -24px rgba(0,0,0,.6), inset 0 0 0 1.5px ${t > a && t < a + 0.5 ? "rgba(52,211,153," + (0.9 - (t - a) * 1.6).toFixed(2) + ")" : "#334155"}`;
      });
      maskLine($$("#pSub .mi")[0], t, 2.95, 3.25, 0.5, 0.25);
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

    const stepsOn = t > 3.79 && t < 12.5;
    show($("steps"), stepsOn);
    if (stepsOn) steps(t, C);
    const outroOn = t > 12.2;
    show($("outro"), outroOn);
    if (outroOn) outro(t, C);
    const sigOn = t > TL.sig.fade[0];
    show($("sig"), sigOn);
    if (sigOn) signature(t);
  }

  /* =================================================================== */
  function steps(t, C) {
    [[3.95, 6.2], [6.45, 9.1], [9.32, 12.0]].forEach(([tin, tout], i) => {
      const st = S.steps[i];
      const on = t > tin - 0.02 && t < tout + 0.6;
      show(st.el, on);
      if (on) st.lines.forEach((ln, j) => maskLine(ln, t, tin + j * 0.055, tout + j * 0.025, 0.62, 0.3));
    });
    tf($("stepper"), { y: t < 12 ? tw(t, 4.15, 4.7, 30, 0, E.outExpo) : tw(t, 12.0, 12.3, 0, 30, E.inCubic), o: t < 12 ? tw(t, 4.15, 4.5, 0, 1) : tw(t, 12.0, 12.25, 1, 0) });
    $("stFill").style.width = `${kf(t, [[6.35, 0], [6.8, 220, E.inOutExpo], [9.2, 220], [9.65, 440, E.inOutExpo]])}px`;
    [[1, 4.3], [2, 6.78], [3, 9.63]].forEach(([i, ton]) => {
      const d = $("sd" + i);
      d.classList.toggle("on", t >= ton);
      d.style.transform = `scale(${1 + wobble(t, ton, 0.4, 8, 22)})`;
    });

    /* camera */
    const ts = TL.success;
    const cx = kf(t, [[3.86, 380], [4.55, 0, E.outExpo], [4.95, 0], [5.4, 190], [5.95, 190], [6.4, 0], [9.25, 0], [9.75, -150], [12.0, -150], [12.45, -760, E.inExpo]]);
    const cy = kf(t, [[3.86, 90], [4.55, 0, E.outExpo], [4.95, 0], [5.4, 60], [5.95, 60], [6.4, 0], [7.0, 0], [7.3, 8], [8.6, 8], [8.95, 0]]);
    const cs = kf(t, [[3.86, 0.8], [4.55, 1, E.outExpo], [4.95, 1], [5.4, 1.15], [5.95, 1.15], [6.4, 1], [7.0, 1], [7.3, 1.06], [8.6, 1.06], [8.95, 1], [12.0, 1], [12.45, 0.72, E.inExpo]]);
    const cry = kf(t, [[3.86, -26], [4.55, -8, E.outExpo], [6.5, -4], [9.25, -4], [9.75, -10], [12.0, -10], [12.45, -28, E.inExpo]]);
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
    setO($("app"), tw(t, loadT, loadT + 0.15, 0, 1));

    /* dashboard */
    const pd = $("pageDash");
    const tabK = E.outExpo(P(t, C[1] + 0.05, C[1] + 0.4));
    show(pd, tabK < 1);
    const scroll = -S.scrollMax * E.inOutExpo(P(t, TL.scroll[0], TL.scroll[1]));
    tf(pd, { x: -60 * tabK, y: scroll, o: 1 - tabK });
    S.ld.forEach((el, i) => { const a = loadT + 0.08 + i * 0.07; tf(el, { y: tw(t, a, a + 0.45, 26, 0, E.outExpo), o: tw(t, a, a + 0.25, 0, 1) }); });
    // VigiPluie flips to "Averse imminente"
    const fl = TL.okBox;
    swap($("rOk"), $("rKo"), t, fl);
    const dot = $("rDot");
    dot.style.background = t < fl ? "#34D399" : "#F87171";
    dot.style.boxShadow = t < fl ? "0 0 0 4px rgba(52,211,153,.18)" : `0 0 0 ${(4 + 8 * ((t * 1.6) % 1)).toFixed(1)}px rgba(248,113,113,${(0.45 * (1 - ((t * 1.6) % 1))).toFixed(2)})`;
    const mmh = 3.2 * E.outCubic(P(t, fl - 0.2, fl + 0.25));
    $("rMmh").innerHTML = `${mmh.toFixed(2)} <small>mm/h</small>`;
    $("rMmh").style.color = t < fl ? "" : "#F87171";
    $("rChg").textContent = t < fl ? "08:02" : "13:28";
    $("cardPluie").style.boxShadow = t < fl ? "" : `inset 0 0 0 ${1 + 1.5 * E.outCubic(P(t, fl, fl + 0.3))}px rgba(248,113,113,.6), 0 10px 30px -18px rgba(0,0,0,.6)`;
    $("cardPluie").style.transform = `scale(${1 + wobble(t, fl, 0.025, 10, 26)})`;
    // chart draws in, crosses the FORT line just as the status flips
    const drawK = E.inOutCubic(P(t, loadT + 0.35, fl + 0.05));
    S.line.style.strokeDasharray = `${S.lineLen}`;
    S.line.style.strokeDashoffset = `${S.lineLen * (1 - drawK)}`;
    S.area.style.opacity = drawK;
    S.tip.style.opacity = t < fl ? 0 : 1;
    const rp = (t * 1.4) % 1;
    S.tipRing.setAttribute("r", (6 + 14 * rp).toFixed(1));
    S.tipRing.style.opacity = t < fl ? 0 : (1 - rp).toFixed(2);

    /* decision: verdicts land on the beat, then the blocking slots open */
    TL.selects.forEach((a, i) => {
      const pill = $("pill" + i);
      pill.style.display = "inline-block";
      pill.style.transform = `scale(${t < a ? 0 : E.outBackBig(P(t, a, a + 0.35))})`;
      $("task" + i).style.boxShadow = `inset 0 0 0 1px ${t > a && t < a + 0.6 ? (i === 1 ? "rgba(251,191,36,.6)" : "rgba(248,113,113,.6)") : "#334155"}`;
    });
    const openK = E.outExpo(P(t, C[0] + 0.05, C[0] + 0.45));
    $("panel0").style.height = `${(S.panelH * openK).toFixed(1)}px`;
    $("panel0").style.opacity = openK;
    $("lk0").textContent = t < C[0] + 0.05 ? "Voir les créneaux bloquants" : "Masquer le détail";

    /* tabs */
    tf($("ulDash"), { o: 1 - tabK });
    $("ulRonde").style.transform = `scaleX(${tabK})`;
    $("tabDash").classList.toggle("on", tabK < 0.5);
    $("tabRonde").classList.toggle("on", tabK >= 0.5);

    /* ronde des ouvrants */
    const pr = $("pageRonde");
    show(pr, tabK > 0);
    tf(pr, { x: 60 * (1 - tabK), o: tabK });
    let done = 0;
    S.dots.forEach((d, i) => {
      const a = TL.scans[i];
      if (t >= a) done++;
      d.g.style.transform = `scale(${t < a ? 0 : E.outBackBig(P(t, a, a + 0.3))})`;
      d.el.style.transform = `scale(${1 + wobble(t, a, 0.35, 9, 24)})`;
      d.el.style.boxShadow = t > a && t < a + 0.6 ? `0 0 0 ${(16 * (t - a) / 0.6).toFixed(1)}px rgba(52,211,153,${(0.5 * (1 - (t - a) / 0.6)).toFixed(2)})` : "0 2px 8px rgba(0,0,0,.5)";
    });
    $("gTxt").textContent = `Global : ${done} / 8`;
    const tv = TL.stamp;
    setO($("scrim"), t < tv ? 0 : tw(t, tv, tv + 0.25, 0, 1));
    tf($("succ"), { s: t < tv ? 0.6 : E.outBackBig(P(t, tv, tv + 0.4)), o: t < tv ? 0 : tw(t, tv, tv + 0.12, 0, 1) });

    /* cursor */
    const lk = [S.lk0.x + 70, S.lk0.cy + S.scrollMax * 0 - S.scrollMax + 4];
    const tb = [S.tabRonde.cx + 6, S.tabRonde.cy + 4];
    let p;
    if (t < 8.6) p = arc(t, 7.85, 8.35, [900, 640], lk, 0.2);
    else p = arc(t, 9.3, 9.76, lk, tb, -0.2);
    const pressed = C.slice(0, 2).some((c) => Math.abs(t - c - 0.01) < 0.06);
    tf($("cursor"), { x: p[0] - 6, y: p[1] - 3, s: pressed ? 0.82 : 1, o: t < 10.3 ? tw(t, 7.8, 7.95, 0, 1) : tw(t, 10.3, 10.5, 1, 0) });
    const ripple = $("ripple");
    const last = C.slice(0, 2).reverse().find((c) => t >= c);
    if (last !== undefined && t < last + 0.5) {
      const at = last === C[0] ? lk : tb;
      tf(ripple, { x: at[0], y: at[1], s: tw(t, last, last + 0.48, 0.3, 2.4, E.outCubic), o: tw(t, last, last + 0.48, 0.95, 0) });
    } else setO(ripple, 0);

    /* phone: push alert, then the NFC round */
    const ph = $("phone");
    show(ph, t > 9.25);
    if (t > 9.25) {
      tf(ph, {
        x: kf(t, [[12.0, 0], [12.45, 720, E.inExpo]]) + wobble(t, tv, 6, 10, 40),
        y: kf(t, [[9.28, 840], [9.85, 0, E.outQuint]]),
        r: kf(t, [[9.28, 16], [9.9, -4, E.outQuint], [12.0, -4], [12.45, 14, E.inExpo]]),
      });
      const tn = TL.notif;
      tf($("notif"), { y: t < 10.2 ? tw(t, tn, tn + 0.45, -170, 0, E.outBack) : tw(t, 10.2, 10.45, 0, -40, E.inCubic), s: tw(t, tn, tn + 0.45, 0.9, 1, E.outBack),
        o: t < 10.2 ? tw(t, tn, tn + 0.12, 0, 1) : tw(t, 10.2, 10.4, 1, 0) });
      const ui = $("scanUI");
      tf(ui, { y: lerp(700, 0, E.outExpo(P(t, 10.15, 10.5))) });
      S.waves.forEach((w, i) => { const q = (t * 1.1 + i / 3) % 1; tf(w, { s: 1 + q * 1.4, o: (1 - q) * 0.8 }); });
      let shown = 0;
      S.rows.forEach((row, i) => {
        const a = TL.scans[i];
        if (t < a) { setO(row, 0); return; }
        shown++;
      });
      S.rows.forEach((row, i) => {
        const a = TL.scans[i];
        if (t < a) return;
        const rank = (shown - 1) - i; // newest on top
        const k2 = E.outExpo(P(t, a, a + 0.3));
        tf(row, { y: rank * 52 - (1 - k2) * 20, o: rank > 5 ? 0 : (rank === 0 ? k2 : 1) });
      });
      $("scanCount").textContent = t < tv ? `${shown} / 8 sécurisés` : "✅ 8 / 8 — Chantier sécurisé";
      $("scanCount").style.transform = `scale(${1 + wobble(t, tv, 0.06, 10, 26)})`;
    }
  }

  /* =================================================================== */
  function outro(t, C) {
    $("outro").style.transform = `scale(${tw(t, 13.3, 15, 1, 1.035, E.lin)})`;
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

    const th = TL.logoHit;
    const lx0 = (W - S.endLogoW) / 2, ly0 = 300, center = (S.endLogoW - 290) / 2;
    tf($("endLogo"), { x: lx0 + tw(t, th + 0.14, th + 0.6, center, 0, E.outExpo), y: ly0, o: t < th - 0.05 ? 0 : 1 });
    $("sweepRect2").setAttribute("width", (260 * E.outCubic(P(t, th - 0.05, th + 0.32))).toFixed(1));
    $("endMark").style.transform = `translate3d(0,${tw(t, th - 0.05, th + 0.32, 20, 0, E.outCubic) + wobble(t, th + 0.3, 4, 9, 26)}px,0)`;
    $("endWord").style.transform = `translate3d(${tw(t, th + 0.2, th + 0.68, -104, 0, E.outExpo)}%,0,0)`;
    tf($("endShock"), { x: 960 - 100, y: ly0 - 10, s: tw(t, th, th + 0.6, 0.9, 3.2), o: t < th ? 0 : tw(t, th, th + 0.6, 0.9, 0) });

    const url = $("endUrl"), ua = 13.72, ce = C[2];
    const pressU = Math.abs(t - ce) < 0.07 ? 0.95 : 1 + wobble(t, ce + 0.07, 0.03, 10, 24);
    url.style.left = `${960 - S.endUrlW / 2}px`;
    tf(url, { y: tw(t, ua, ua + 0.5, 40, 0, E.outExpo), s: tw(t, ua, ua + 0.5, 0.86, 1, E.outBack) * pressU, o: tw(t, ua, ua + 0.2, 0, 1) });
    $$("#endTag .mi").forEach((el, i) => maskLine(el, t, 13.95 + i * 0.11, 1e9, 0.6));
    maskLine($$("#endSite .mi")[0], t, 14.25, 1e9, 0.6);
    const tip = [960 + S.endUrlW / 2 - 110, 620 + S.endUrlH / 2 + 6];
    const cp = arc(t, 14.02, 14.46, [1420, 960], tip, -0.2);
    tf($("endCursor"), { x: cp[0] - 7, y: cp[1] - 4, s: Math.abs(t - ce - 0.01) < 0.06 ? 0.82 : 1, o: tw(t, 13.98, 14.12, 0, 1) });
    tf($("endRipple"), { x: tip[0], y: tip[1], s: tw(t, ce, ce + 0.5, 0.3, 2.6, E.outCubic), o: t < ce ? 0 : tw(t, ce, ce + 0.5, 0.95, 0) });
  }

  function signature(t) {
    const g = TL.sig;
    setO($("sig"), E.inOutCubic(P(t, g.fade[0], g.fade[1])));
    const [l0, l1] = g.logo;
    tf($("sigMark"), { s: lerp(0.8, 1, E.outCubic(P(t, l0, l1))), o: E.outCubic(P(t, l0, l0 + 0.5)) });
    setO($("sigGlow"), 0.9 * E.outCubic(P(t, l0, l1 + 0.3)));
    [["sigName", g.name], ["sigUrl", g.url]].forEach(([id, a]) => tf($(id), { y: tw(t, a, a + 0.6, 26, 0, E.outCubic), o: E.outCubic(P(t, a, a + 0.5)) }));
    $("sigBody").style.transform = `scale(${tw(t, l1, TL.duration, 1, 1.02, E.lin)})`;
  }

  /* ---------- boot ---------- */
  window.seek = seek;
  const imgs = [...document.images].map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; })));
  window.__ready = Promise.all([document.fonts.ready, ...imgs]).then(() => {
    build();
    const q = new URLSearchParams(location.search);
    if (q.has("render")) { seek(0); return true; }
    if (q.has("t")) { seek(parseFloat(q.get("t"))); return true; }
    document.body.classList.add("preview");
    const fit = () => { $("stage").style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`; };
    fit(); addEventListener("resize", fit);
    const t0 = performance.now();
    const loop = (now) => { seek(((now - t0) / 1000) % TL.duration); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return true;
  });
})();
