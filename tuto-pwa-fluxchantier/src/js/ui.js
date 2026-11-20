/* Shared building blocks: DOM builders, generic icons, and timeline helpers.
 * Every animation goes through GSAP tweens (no callbacks), so seeking the
 * timeline to any time renders the exact same frame. */
(function () {
  const W = 1080, H = 1920;
  const C = { dk: "#0D564A", em: "#149776", mint: "#11D7A7", lime: "#A5D657" };
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------------- generic line icons (no brand marks) ---------------- */
  const S = (d, size = 34, col = "#2E403C", sw = 2.6, extra = "") =>
    `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;
  const ICON = {
    home: (s, c) => S('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>', s, c),
    lock: (s, c) => S('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', s, c),
    fwd: (s, c) => S('<path d="M5 12h14M13 6l6 6-6 6"/>', s, c),
    star: (s, c) => S('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>', s, c),
    download: (s, c) => S('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', s, c),
    info: (s, c) => S('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>', s, c),
    refresh: (s, c) => S('<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4v4h-4"/>', s, c),
    plus: (s, c) => S('<path d="M12 5v14M5 12h14"/>', s, c),
    incog: (s, c) => S('<path d="M4 13h16M7 13l1.5-6h7L17 13"/><circle cx="8" cy="17" r="2.2"/><circle cx="16" cy="17" r="2.2"/>', s, c),
    history: (s, c) => S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', s, c),
    install: (s, c) => S('<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4"/><path d="M12 7v7M9 11.5l3 3 3-3"/>', s, c),
    share: (s, c) => S('<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4"/>', s, c),
    gear: (s, c) => S('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>', s, c),
    back: (s, c) => S('<path d="M15 5l-7 7 7 7"/>', s, c),
    next: (s, c) => S('<path d="M9 5l7 7-7 7"/>', s, c),
    ishare: (s, c) => S('<path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16"/><path d="M12 14V3M8.2 6.6L12 2.8l3.8 3.8"/>', s, c),
    book: (s, c) => S('<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5z"/><path d="M12 6v14.5"/>', s, c),
    tabs: (s, c) => S('<rect x="7.5" y="7.5" width="12" height="12" rx="2"/><path d="M4.5 15.5v-9a2 2 0 0 1 2-2h9"/>', s, c),
    copy: (s, c) => S('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>', s, c),
    glasses: (s, c) => S('<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 14l1.5-6M20.5 14L19 8"/>', s, c),
    search: (s, c) => S('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>', s, c),
    addsq: (s, c) => S('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>', s, c),
    pen: (s, c) => S('<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 6l3 3"/>', s, c),
    x: (s, c) => S('<path d="M6 6l12 12M18 6L6 18"/>', s, c),
    // home-screen generic glyphs
    phone: (s, c) => S('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>', s, c),
    msg: (s, c) => S('<path d="M4 5h16v11H9l-5 4z"/>', s, c),
    camera: (s, c) => S('<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>', s, c),
    photo: (s, c) => S('<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M4 17l5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9.5" r="1.5"/>', s, c),
    clock: (s, c) => S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5h4"/>', s, c),
    cal: (s, c) => S('<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>', s, c),
    music: (s, c) => S('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>', s, c),
    pin: (s, c) => S('<path d="M12 21s6-5.6 6-11a6 6 0 0 0-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2.2"/>', s, c),
    mail: (s, c) => S('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>', s, c),
    notes: (s, c) => S('<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>', s, c),
    calc: (s, c) => S('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7.5h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>', s, c),
  };

  /* ---------------- logo (raster logo revealed by a stroke that follows the S) ---------------- */
  // centre line of the S, in the coordinates of the original 1254 px logo
  const S_PATH = "M 200 582 L 300 582 C 400 582, 420 760, 470 860 C 530 960, 700 990, 790 900 C 870 820, 830 700, 760 640 L 560 500 C 470 440, 470 330, 560 280 C 660 220, 800 260, 860 380 C 900 470, 920 605, 1060 605";
  let logoCount = 0;
  function logo(size) {
    const id = "lm" + (++logoCount);
    const svg = `<svg class="logo" width="${size}" height="${size * 840 / 880}" viewBox="190 200 880 840">
      <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="150" y="150" width="980" height="940">
        <path class="draw" d="${S_PATH}" fill="none" stroke="#fff" stroke-width="300" stroke-linecap="butt" stroke-linejoin="round"/></mask></defs>
      <image href="../assets/logo_synapsis_transparent.png" x="209" y="216" width="847" height="803" mask="url(#${id})"/></svg>`;
    const wrap = el("div", "logo-wrap", svg);
    return wrap;
  }

  /* ---------------- background ribbons + transition waves ---------------- */
  function wavePath(x0, x1, y, amp, len, phase, close) {
    let d = `M ${x0} ${y + amp * Math.sin(phase)}`;
    for (let x = x0 + 20; x <= x1; x += 20) d += ` L ${x} ${(y + amp * Math.sin(phase + (x - x0) / len * Math.PI * 2)).toFixed(1)}`;
    return d + (close || "");
  }
  function buildRibbons(svg) {
    const cols = [C.mint, C.lime, C.em];
    const groups = [];
    [[1660, 0.0], [1760, 1.1], [250, 2.2]].forEach(([y, ph], i) => {
      const g = document.createElementNS(NS, "g");
      for (let k = 0; k < 3; k++) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", wavePath(-1200, 2300, y + k * 26, 46, 620, ph + k * 0.35));
        p.setAttribute("fill", "none"); p.setAttribute("stroke", cols[(k + i) % 3]);
        p.setAttribute("stroke-width", 14); p.setAttribute("stroke-linecap", "round");
        p.setAttribute("opacity", i === 2 ? 0.16 : 0.22);
        g.appendChild(p);
      }
      svg.appendChild(g);
      groups.push(g);
    });
    return groups;
  }
  function buildWaves(svg) {
    // each band: wavy top edge, wavy bottom edge, 3400 px tall (covers the screen for a while)
    const cols = [C.lime, C.mint, C.em, C.dk];
    return cols.map((col, i) => {
      const p = document.createElementNS(NS, "path");
      const top = wavePath(-40, 1120, 0, 60, 760, i * 0.9);
      let bottom = "";
      for (let x = 1120; x >= -40; x -= 20) bottom += ` L ${x} ${(3400 + 60 * Math.sin(i * 0.9 + 2 + (x + 40) / 760 * Math.PI * 2)).toFixed(1)}`;
      p.setAttribute("d", top + bottom + " Z");
      p.setAttribute("fill", col);
      svg.appendChild(p);
      return p;
    });
  }

  /* ---------------- step header ---------------- */
  function header(step) {
    const h = el("div", "head");
    if (step.num != null) h.appendChild(el("div", "pill", String(step.num)));
    const t = el("div", "title");
    step.title.forEach((l) => { const m = el("span", "mask"); m.appendChild(el("span", "line", l)); t.appendChild(m); });
    h.appendChild(t);
    if (step.note) {
      const n = el("div", "note" + (step.warn ? " warn" : ""));
      step.note.forEach((l) => { const m = el("span", "mask"); m.appendChild(el("span", "line", l)); n.appendChild(m); });
      h.appendChild(n);
    }
    const sep = `<svg class="sep" width="260" height="30" viewBox="0 0 260 30"><path d="${wavePath(6, 254, 15, 9, 82, 0)}" fill="none" stroke="url(#sepg)" stroke-width="8" stroke-linecap="round"/></svg>`;
    h.insertAdjacentHTML("beforeend", sep);
    return h;
  }
  // shrink a line until it fits the column (never under the minimum size)
  function fitLines(root, maxW = 960) {
    root.querySelectorAll(".line").forEach((ln) => {
      const base = parseFloat(getComputedStyle(ln.parentElement.parentElement).fontSize);
      const min = ln.closest(".note") ? 56 : 58;
      let fs = base;
      ln.style.fontSize = fs + "px";
      while (ln.scrollWidth > maxW && fs > min) { fs -= 1; ln.style.fontSize = fs + "px"; }
    });
  }

  /* ---------------- phone ---------------- */
  function phone(kind) {
    const ph = el("div", "", "");
    ph.id = "phone";
    ph.innerHTML = `<span class="btn-side"></span><div id="screen">
      <div class="${kind === "ios" ? "island" : "cam"}"></div>
      <div class="status"><span>10:24</span><span class="ic">
        <svg width="34" height="22" viewBox="0 0 34 22"><rect x="1" y="14" width="5" height="7" rx="1.5" fill="#10221F"/><rect x="9" y="10" width="5" height="11" rx="1.5" fill="#10221F"/><rect x="17" y="6" width="5" height="15" rx="1.5" fill="#10221F"/><rect x="25" y="2" width="5" height="19" rx="1.5" fill="#10221F"/></svg>
        <svg width="46" height="22" viewBox="0 0 46 22"><rect x="1.5" y="2" width="38" height="18" rx="5" fill="none" stroke="#10221F" stroke-width="2.5"/><rect x="5" y="5.5" width="27" height="11" rx="2.5" fill="#10221F"/><rect x="41.5" y="7.5" width="3" height="7" rx="1.5" fill="#10221F"/></svg>
      </span></div>
      <div class="navbar"></div></div>`;
    return ph;
  }

  /* ---------------- home screen (shared by both tutorials) ---------------- */
  const HOME_APPS = [
    ["Téléphone", "phone", "#DDF3E8"], ["Messages", "msg", "#E1F0FA"], ["Caméra", "camera", "#ECECEC"], ["Photos", "photo", "#FFF1DD"],
    ["Horloge", "clock", "#E9E6F7"], ["Agenda", "cal", "#FDE6E3"], ["Réglages", "gear", "#E7ECEB"], ["Musique", "music", "#FBE4EF"],
    ["Plans", "pin", "#E2F4DE"], null, ["Notes", "notes", "#FFF6D6"], ["Calculette", "calc", "#E6E9EE"],
  ];
  function home(cfg) {
    const h = el("div", "home");
    h.innerHTML = `<div class="clockw"><b>10:24</b><span>lundi 19 octobre</span></div>`;
    const g = el("div", "grid");
    let slot = null;
    HOME_APPS.forEach((a) => {
      if (!a) {
        slot = el("div", "ap newapp", `<div class="sq"><img src="../${esc(cfg.icon)}" alt=""></div><span>${esc(cfg.appName)}</span>`);
        g.appendChild(slot);
        return;
      }
      g.appendChild(el("div", "ap", `<div class="sq" style="background:${a[2]}">${ICON[a[1]](54, "#3C5752")}</div><span>${a[0]}</span>`));
    });
    h.appendChild(g);
    const dock = el("div", "dock");
    [["phone", "#DDF3E8"], ["msg", "#E1F0FA"], ["mail", "#E9E6F7"], ["camera", "#ECECEC"]].forEach(([i, bg]) =>
      dock.appendChild(el("div", "", `<div class="sq" style="background:${bg}">${ICON[i](54, "#3C5752")}</div>`)));
    h.appendChild(dock);
    // sparkles around the new icon
    const sp = [];
    for (let k = 0; k < 8; k++) {
      const s = el("span", "sparkle");
      s.style.background = [C.mint, C.lime, C.em, C.mint][k % 4];
      h.appendChild(s);
      sp.push(s);
    }
    const splash = el("div", "splash", `<div class="icon-app" style="width:200px;height:200px"><img src="../${esc(cfg.icon)}" alt=""></div><b>${esc(cfg.appName)}</b>`);
    h.appendChild(splash);
    return { root: h, slot, sparkles: sp, splash };
  }

  /* ---------------- geometry ---------------- */
  function rect(node, stage) {
    const a = node.getBoundingClientRect(), b = stage.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height, cx: a.left - b.left + a.width / 2, cy: a.top - b.top + a.height / 2 };
  }

  /* ---------------- timeline helpers ---------------- */
  const EASE = "power2.inOut", OUT = "power2.out", SOFT = "power3.out";

  // the finger: a translucent circle that glides, then taps with a ripple
  function makeFinger(stage) {
    const f = el("div"); f.id = "finger"; stage.appendChild(f);
    const r1 = el("div", "ripple"), r2 = el("div", "ripple b");
    stage.appendChild(r1); stage.appendChild(r2);
    const halo = el("div", "halo"); stage.appendChild(halo);
    gsap.set([f, r1, r2, halo], { autoAlpha: 0 });
    return { f, r1, r2, halo };
  }
  function fingerIn(tl, F, t, x, y) {
    tl.set(F.f, { x: x + 160, y: y + 260, scale: 1 }, t);
    tl.to(F.f, { autoAlpha: 1, x, y, duration: 0.7, ease: SOFT }, t);
  }
  function fingerTo(tl, F, t, x, y, d = 0.75) { tl.to(F.f, { x, y, duration: d, ease: EASE }, t); }
  function fingerOut(tl, F, t) { tl.to(F.f, { autoAlpha: 0, y: "+=120", duration: 0.45, ease: "power2.in" }, t); }
  function tap(tl, F, t, x, y) {
    tl.to(F.f, { scale: 0.8, duration: 0.12, ease: "power2.in" }, t);
    tl.to(F.f, { scale: 1, duration: 0.3, ease: OUT }, t + 0.12);
    [[F.r1, 0], [F.r2, 0.08]].forEach(([r, d]) => {
      tl.set(r, { x, y, scale: 0.4, autoAlpha: 0.95 }, t + d);
      tl.to(r, { scale: 2.6, autoAlpha: 0, duration: 0.65, ease: "power2.out" }, t + d);
    });
  }
  // pulsing halo around the element to touch
  function halo(tl, F, t, r, tapAt, opts = {}) {
    const pad = opts.pad ?? 12;
    const round = opts.round ?? 26;
    tl.set(F.halo, { x: r.x - pad, y: r.y - pad, width: r.w + pad * 2, height: r.h + pad * 2, borderRadius: opts.circle ? "50%" : round, scale: 0.9, autoAlpha: 0 }, t);
    tl.to(F.halo, { autoAlpha: 1, scale: 1, duration: 0.35, ease: OUT }, t);
    const n = Math.max(1, Math.floor((tapAt - t - 0.35) / 0.62));
    for (let k = 0; k < n; k++) {
      tl.to(F.halo, { scale: 1.07, duration: 0.31, ease: "sine.inOut" }, t + 0.35 + k * 0.62);
      tl.to(F.halo, { scale: 1, duration: 0.31, ease: "sine.inOut" }, t + 0.66 + k * 0.62);
    }
    tl.to(F.halo, { autoAlpha: 0, scale: 1.15, duration: 0.3, ease: OUT }, tapAt + 0.05);
  }
  // swap the step header: old one leaves upwards, new one arrives
  function headerSwap(tl, oldH, newH, t) {
    if (oldH) tl.to(oldH, { autoAlpha: 0, y: -40, duration: 0.4, ease: "power2.in" }, t);
    const t0 = t + (oldH ? 0.3 : 0);
    tl.set(newH, { autoAlpha: 1, y: 0 }, t0);
    const pill = newH.querySelector(".pill");
    if (pill) tl.fromTo(pill, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.4)" }, t0);
    newH.querySelectorAll(".title .line").forEach((ln, i) => tl.fromTo(ln, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: SOFT }, t0 + 0.12 + i * 0.09));
    newH.querySelectorAll(".note .line").forEach((ln, i) => tl.fromTo(ln, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: SOFT }, t0 + 0.42 + i * 0.09));
    const sep = newH.querySelector(".sep path");
    if (sep) { const L = 300; tl.fromTo(sep, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.8, ease: OUT }, t0 + 0.3); }
  }
  // camera: zoom the phone (and the finger/halo riding with it) towards a point, keeping the header clear
  function zoom(tl, cam, t, s, ox, oy, d = 0.9) {
    tl.to(cam, { scale: s, x: ox * (1 - s), y: oy * (1 - s), duration: d, ease: "power2.inOut" }, t);
  }
  // logo waves sweep up the screen; `swap` runs while the darkest band covers everything
  function waveTransition(tl, waves, t, swapTargets) {
    const d = 1.25, st = 0.08;
    waves.forEach((w, i) => {
      tl.set(w, { y: H + 80 }, 0);
      tl.fromTo(w, { y: H + 80 }, { y: -3500, duration: d, ease: "power2.inOut", immediateRender: false }, t + i * st);
    });
    const mid = t + 3 * st + d * 0.5;
    if (swapTargets) swapTargets(mid);
    return mid;
  }

  window.UI = { W, H, C, el, esc, ICON, logo, buildRibbons, buildWaves, header, fitLines, phone, home, rect,
    makeFinger, zoom, fingerIn, fingerTo, fingerOut, tap, halo, headerSwap, waveTransition, EASE, OUT, SOFT };
})();
