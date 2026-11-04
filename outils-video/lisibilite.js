/* Shared readability and anomaly checks for the motion-design videos (securite-bruit, securite-poussieres).
 * Injected into the page by the render scripts (page.addScriptTag), after window.__ready:
 *   window.__readability(step)   reading rules, per text block
 *   window.__anomaliesDOM(step)  texts covered by another element, lines cut by their mask, texts out of frame
 * Pages mark their blocks with class "tx", lines with class "ln", and optionally data-kind="label" (icon label),
 * data-kind="title" (heading kept for the whole scene) and data-group (blocks read together). */
(function () {
  const plain = (n) => { const ls = [...n.querySelectorAll(".ln")]; return (ls.length ? ls.map((l) => l.textContent).join(" ") : n.textContent).replace(/\s+/g, " ").trim(); };
  const words = (str) => String(str || "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const need = (str, label) => (label ? 2 : Math.max(2.5, 0.5 * words(str) + 1));
  const blocks = () => [...document.querySelectorAll("#stage .tx")].filter((n) => n.textContent.trim());

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
      u.text = u.nodes.map(plain).join(" ");
      u.words = words(u.text);
      u.label = u.nodes.every((n) => n.dataset.kind === "label");
      u.title = u.nodes.every((n) => n.dataset.kind === "title");
      u.need = need(u.text, u.label);
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

  /**
   * DOM anomalies, sampled every `step` seconds:
   *  - "recouvert": a fully visible text line has another element on top of it (badge, card, overlay)
   *  - "tronqué": a line is visible but partly hidden by its mask (slide animation cut)
   *  - "hors cadre": a visible text goes out of the 1920×1080 frame
   */
  window.__anomaliesDOM = function (step = 0.1) {
    const tl = window.tl, D = tl.duration(), stage = document.getElementById("stage"), sr = stage.getBoundingClientRect();
    const marks = window.__marks || [], scenes = [...document.querySelectorAll("#stage > .scene")];
    const found = {};
    const add = (kind, n, t, extra) => {
      const key = kind + "|" + plain(n).slice(0, 50);
      const sc = (marks[scenes.indexOf(n.closest(".scene"))] || [""])[0];
      const f = found[key] || (found[key] = { kind, scene: sc, text: plain(n).slice(0, 60), from: t, to: t, extra: extra || "", n: 0 });
      f.to = t; f.n++;
    };
    const opacityOf = (n) => { let op = 1; for (let e = n; e && e.id !== "stage"; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none") return 0; op *= +cs.opacity; } return op; };
    for (let t = 0; t <= D + 1e-6; t += step) {
      tl.seek(t, false);
      blocks().forEach((n) => {
        const si = scenes.indexOf(n.closest(".scene")), mk = marks[si];
        if (mk && !(t >= mk[1] + (si ? 0.45 : 0) && t < mk[2])) return;      // transitions excluded
        if (opacityOf(n) < 0.5) return;
        n.querySelectorAll(".ln").forEach((l) => {
          if (+getComputedStyle(l).opacity < 0.5) return;
          const tr = getComputedStyle(l).transform, m = new DOMMatrixReadOnly(tr === "none" ? undefined : tr), h = l.offsetHeight || 1;
          if (Math.abs(m.f) > 2 && Math.abs(m.f) < h - 2) add("tronqué", n, t);
          const r = l.getBoundingClientRect();
          if (r.width < 2) return;
          if (r.left < sr.left - 1 || r.right > sr.right + 1 || r.top < sr.top - 1 || r.bottom > sr.bottom + 1) add("hors cadre", n, t);
          if (Math.abs(m.f) > 0.5) return;
          // five points inside the line: the topmost element must be the text itself
          const pts = [[0.5, 0.5], [0.12, 0.3], [0.88, 0.3], [0.12, 0.7], [0.88, 0.7]];
          for (const [fx, fy] of pts) {
            const x = r.left + r.width * fx, y = r.top + r.height * fy;
            // walk down the stack: transparent SVG canvases, invisible elements and the block itself are skipped
            let cover = null;
            for (const e of document.elementsFromPoint(x, y)) {
              if (n.contains(e) || e.contains(n)) break;                         // reached the text: nothing on top
              if (e.tagName.toLowerCase() === "svg" || e.id === "stage") continue;  // an SVG canvas paints only its shapes
              const tx = e.closest(".tx");
              if (tx) {                                                           // another text: only if it is visible
                const vis = [...tx.querySelectorAll(".ln")].some((x) => opacityOf(x) > 0.1);
                if (!vis) continue;
                cover = e; break;
              }
              if (opacityOf(e) < 0.1) continue;
              const cs = getComputedStyle(e);
              const paints = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none" || /^(img|svg|path|circle|rect|polygon|ellipse|line|text|g|use)$/i.test(e.tagName);
              if (!paints) continue;                                              // a transparent wrapper paints nothing
              cover = e; break;
            }
            if (cover) { add("recouvert", n, t, cover.tagName.toLowerCase() + (typeof cover.className === "string" && cover.className ? "." + cover.className.split(" ")[0] : "")); break; }
          }
        });
      });
    }
    tl.seek(0);
    // an overlap or a cut line has to last at least 0.3 s to count (a cross-fade is not a defect)
    return Object.values(found).filter((f) => f.kind === "hors cadre" || f.n >= 3).map(({ n, ...f }) => ({ ...f, from: +f.from.toFixed(2), to: +f.to.toFixed(2) }));
  };
})();
