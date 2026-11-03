/* Pictograms drawn in SVG (strings). Colours are always palette variables.
 * Line icons use a 100×100 box: c = main stroke colour, a = accent (dust, water, crossed-out marks). */
(function () {
  const B = "var(--bleu)", F = "var(--fonce)", R = "var(--rouge)", W = "var(--blanc)";
  const wrap = (inner, size, vb = "0 0 100 100") => `<svg viewBox="${vb}" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const line = (c, w = 6) => `stroke="${c}" stroke-width="${w}" fill="none"`;
  const dots = (a, pts, r = 3.2) => `<g fill="${a}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`;

  /** ISO 7010 style mandatory sign "wear a mask": blue disc, white head with a respirator */
  function mandatory(size) {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}">
      <circle cx="100" cy="100" r="96" fill="${B}" stroke="${W}" stroke-width="7"/>
      <rect x="88" y="122" width="24" height="20" fill="${W}"/>
      <path d="M42 170 C44 146 64 136 86 134 L114 134 C136 136 156 146 158 170 Z" fill="${W}"/>
      <ellipse cx="100" cy="92" rx="31" ry="40" fill="${W}"/>
      <path d="M71 92 L58 84 M129 92 L142 84" stroke="${B}" stroke-width="6" stroke-linecap="round"/>
      <path d="M74 92 C74 86 86 82 100 82 C114 82 126 86 126 92 L122 112 C118 124 110 130 100 130 C90 130 82 124 78 112 Z" fill="${W}" stroke="${B}" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="100" cy="110" r="7" fill="${B}"/>
    </svg>`;
  }

  /** triangular danger sign, palette red */
  function danger(size) {
    const d = L.roundedPath([[100, 10], [192, 170], [8, 170]], 18);
    return `<svg viewBox="0 0 200 180" width="${size}" height="${size * 0.9}">
      <path d="${d}" fill="${W}" stroke="${R}" stroke-width="17" stroke-linejoin="round"/>
      <rect x="90" y="56" width="20" height="66" rx="10" fill="${F}"/><circle cx="100" cy="145" r="12" fill="${F}"/>
    </svg>`;
  }

  const icons = {
    /* ---- dusty tasks ---- */
    decoupe_beton: (c, a) => `<g ${line(c)}><rect x="6" y="64" width="88" height="24" rx="3"/><path d="M14 22 H46 L52 34 H20 Z"/><path d="M14 22 L6 12"/><circle cx="58" cy="50" r="18"/><path d="M58 64 V72"/></g>
      ${dots(a, [[80, 58], [86, 50], [90, 62], [78, 44], [72, 36]])}`,
    carottage: (c, a) => `<g ${line(c)}><path d="M22 8 V78"/><path d="M14 78 H34"/><rect x="28" y="14" width="34" height="22" rx="4"/><rect x="40" y="36" width="12" height="34" rx="2"/><rect x="6" y="74" width="88" height="16" rx="3"/></g>
      ${dots(a, [[62, 64], [68, 56], [72, 66], [30, 62], [64, 46]])}`,
    percage: (c, a) => `<g ${line(c)}><path d="M10 30 H62 V52 H10 Z"/><path d="M14 52 L18 82 H36 L32 52"/><path d="M62 41 H80"/><path d="M44 30 V18 H56"/><path d="M86 12 V90"/></g>
      ${dots(a, [[78, 30], [74, 54], [80, 62], [72, 24], [80, 48]])}`,
    poncage: (c, a) => `<g ${line(c)}><path d="M88 6 V94"/><path d="M10 92 L56 46"/><rect x="62" y="16" width="14" height="44" rx="5"/><path d="M56 46 L62 40"/></g>
      ${dots(a, [[52, 24], [44, 34], [56, 66], [48, 76], [40, 20], [62, 74]])}`,
    demolition: (c, a) => `<g ${line(c)}><path d="M6 20 H50 M6 40 H50 M6 60 H50 M6 80 H50 M28 20 V40 M16 40 V60 M38 40 V60 M28 60 V80"/><path d="M50 14 V86"/><path d="M58 88 L84 30"/><rect x="72" y="14" width="24" height="16" rx="3" transform="rotate(24 84 22)"/></g>
      ${dots(a, [[58, 36], [62, 48], [54, 58], [66, 62], [60, 24]])}`,
    coupe_carrelage: (c, a) => `<g ${line(c)}><rect x="10" y="58" width="80" height="30" rx="3"/><path d="M36 58 V88 M64 58 V88"/><path d="M10 34 H44"/><rect x="44" y="26" width="14" height="18" rx="3"/><circle cx="62" cy="44" r="14"/></g>
      ${dots(a, [[80, 46], [86, 38], [82, 54], [74, 30]])}`,
    sacs: (c, a) => `<g ${line(c)}><path d="M24 40 L30 92 H70 L76 40 Z"/><path d="M24 40 L34 32 H66 L76 40"/><path d="M38 62 H62"/></g>
      <g ${line(a, 5)}><path d="M40 24 C34 18 40 10 48 14 C52 6 64 8 62 18 C70 18 70 28 62 28"/></g>${dots(a, [[30, 16], [74, 12], [80, 26]])}`,
    balayage: (c, a) => `<g ${line(c)}><path d="M76 6 L44 62"/><path d="M24 62 H62 L68 86 H18 Z"/><path d="M30 70 L28 86 M43 70 V86 M56 70 L58 86"/></g>
      ${dots(a, [[80, 70], [86, 80], [76, 88], [90, 62], [84, 92]])}`,
    /* ---- materials ---- */
    beton: (c) => `<g ${line(c)}><path d="M14 34 L50 18 L86 34 L50 50 Z"/><path d="M14 34 V70 L50 86 V50"/><path d="M86 34 V70 L50 86"/></g>`,
    mortier: (c) => `<g ${line(c)}><path d="M14 70 L54 30 L84 60 Z"/><path d="M54 30 L64 18 L74 24"/></g>`,
    pierre: (c) => `<g ${line(c)}><path d="M12 64 L24 30 L52 18 L82 30 L90 62 L66 84 L30 84 Z"/><path d="M24 30 L46 52 L82 30 M46 52 L30 84 M46 52 L66 84"/></g>`,
    carrelage: (c) => `<g ${line(c)}><rect x="12" y="12" width="76" height="76" rx="4"/><path d="M50 12 V88 M12 50 H88"/></g>`,
    /* ---- reduce at the source ---- */
    eau: (c, a) => `<g ${line(c)}><path d="M14 30 H46 L52 42 H20 Z"/><circle cx="58" cy="58" r="18"/><rect x="6" y="80" width="88" height="12" rx="3"/></g>
      <g fill="${a}"><path d="M84 18 C84 18 76 30 76 35 A8 8 0 0 0 92 35 C92 30 84 18 84 18 Z"/><path d="M70 6 C70 6 65 14 65 17 A5 5 0 0 0 75 17 C75 14 70 6 70 6 Z"/></g>`,
    aspiration: (c, a) => `<g ${line(c)}><rect x="58" y="50" width="34" height="38" rx="8"/><circle cx="68" cy="92" r="4"/><circle cx="84" cy="92" r="4"/><path d="M58 64 C30 64 40 30 18 30"/><rect x="6" y="20" width="16" height="22" rx="3"/></g>
      <g ${line(a, 5)}><path d="M30 46 L40 42 M26 54 L36 54 M32 62 L40 58"/></g>`,
    organisation: (c, a) => `<g ${line(c)}><path d="M78 36 A30 30 0 0 0 22 40"/><path d="M80 18 L78 36 L60 34"/><path d="M22 64 A30 30 0 0 0 78 60"/><path d="M20 82 L22 64 L40 66"/></g>
      <g ${line(a, 5)}><path d="M36 46 H58 M40 54 H62"/><path d="M30 34 L70 66"/></g>`,
    /* ---- masks ---- */
    ffp_jetable: (c, a) => `<g ${line(c)}><path d="M14 40 C14 28 30 22 50 22 C70 22 86 28 86 40 L80 64 C74 80 62 88 50 88 C38 88 26 80 20 64 Z"/><path d="M14 40 L4 34 M86 40 L96 34 M20 64 L6 70 M80 64 L94 70"/><path d="M36 26 C42 22 58 22 64 26"/></g><circle cx="50" cy="62" r="9" ${line(a || c, 5)}/>`,
    demi_masque: (c) => `<g ${line(c)}><path d="M30 30 C30 20 40 14 50 14 C60 14 70 20 70 30 L66 64 C62 76 56 82 50 82 C44 82 38 76 34 64 Z"/><circle cx="20" cy="64" r="15"/><circle cx="80" cy="64" r="15"/><path d="M20 58 V70 M80 58 V70"/><path d="M30 30 L12 24 M70 30 L88 24"/></g>`,
    ventilation: (c) => `<g ${line(c)}><path d="M18 52 C18 22 34 10 50 10 C66 10 82 22 82 52 V60 H18 Z"/><rect x="28" y="34" width="44" height="18" rx="5"/><path d="M50 60 C50 76 30 76 30 90"/><rect x="20" y="86" width="40" height="10" rx="3"/></g>`,
    /* ---- wearing ---- */
    ajuster: (c, a) => `<g ${line(c)}><ellipse cx="50" cy="48" rx="28" ry="36"/><path d="M28 54 C30 46 40 42 50 42 C60 42 70 46 72 54 L68 70 C64 80 58 84 50 84 C42 84 36 80 32 70 Z"/><path d="M28 52 L14 40 M72 52 L86 40 M32 70 L14 78 M68 70 L86 78"/></g><path d="M40 44 Q50 38 60 44" ${line(a || c, 6)}/>`,
    avant: (c, a) => `<g ${line(c)}><path d="M58 8 V92"/><path d="M8 50 H44"/><path d="M32 36 L46 50 L32 64"/></g><g stroke-width="10" fill="none"><path d="M70 14 V86" stroke="${W}"/><path d="M70 14 V86" stroke="${a || c}" stroke-dasharray="12 12"/></g>`,
    lunettes: (c) => `<g ${line(c)}><path d="M8 42 C8 32 20 28 34 30 C42 31 46 36 50 36 C54 36 58 31 66 30 C80 28 92 32 92 42 C92 58 82 66 66 64 C58 63 54 56 50 56 C46 56 42 63 34 64 C18 66 8 58 8 42 Z"/><path d="M8 42 L2 38 M92 42 L98 38"/></g>`,
    combinaison: (c) => `<g ${line(c)}><path d="M36 16 C36 8 64 8 64 16 V26 H36 Z"/><path d="M30 26 H70 L84 60 H72 L66 44 V94 H54 V64 H46 V94 H34 V44 L28 60 H16 Z"/><path d="M50 30 V60"/></g>`,
    hygiene: (c, a) => `<g ${line(c)}><path d="M26 30 H46 L44 62 H28 Z"/><path d="M54 52 H84 M54 60 H84"/><path d="M80 48 C80 40 88 40 88 32"/></g><circle cx="50" cy="50" r="42" ${line(a || c, 7)}/><path d="M20 80 L80 20" ${line(a || c, 7)}/>`,
    tabac: (c, a) => `<g ${line(c)}><rect x="10" y="54" width="70" height="14" rx="3"/><path d="M66 54 V68"/></g><g ${line(a || c, 5)}><path d="M84 48 C78 40 90 34 84 26 M92 50 C86 42 98 36 92 28"/></g>`,
    dose: (c, a) => `<g fill="${c}"><rect x="10" y="66" width="14" height="20" rx="3"/><rect x="30" y="54" width="14" height="32" rx="3"/><rect x="50" y="40" width="14" height="46" rx="3"/></g><rect x="70" y="22" width="14" height="64" rx="3" fill="${a || c}"/>`,
    visage: (c) => `<g ${line(c)}><ellipse cx="50" cy="48" rx="28" ry="36"/><path d="M38 64 Q50 72 62 64"/></g><g fill="${c}"><circle cx="40" cy="42" r="4"/><circle cx="60" cy="42" r="4"/></g>`,
    check: (c) => `<path d="M24 53 L42 71 L78 31" ${line(c, 11)}/>`,
  };
  const icon = (name, size, c = W, a) => wrap(icons[name](c, a), size);
  /** icon scaled into a hexagon badge of width w (L.hexBadge) */
  const inHex = (name, w, c, a, k = 0.62) => {
    const h = w * 1.1547, s = (w * k) / 100;
    return `<g transform="translate(${((w - 100 * s) / 2).toFixed(1)} ${((h - 100 * s) / 2).toFixed(1)}) scale(${s.toFixed(3)})">${icons[name](c, a)}</g>`;
  };

  window.P = { mandatory, danger, icon, icons, inHex };
})();
