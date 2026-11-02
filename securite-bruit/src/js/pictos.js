/* Pictograms drawn in SVG (strings). Colours are always palette variables. */
(function () {
  const B = "var(--bleu)", F = "var(--fonce)", R = "var(--rouge)", W = "var(--blanc)";
  const wrap = (inner, size, vb = "0 0 100 100") => `<svg viewBox="${vb}" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const line = (c, w = 7) => `stroke="${c}" stroke-width="${w}" fill="none"`;

  /** ISO 7010 style mandatory sign "wear ear protection": blue disc, white pictogram */
  function mandatory(size) {
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}">
      <circle cx="100" cy="100" r="96" fill="${B}" stroke="${W}" stroke-width="7"/>
      <rect x="88" y="118" width="24" height="22" fill="${W}"/>
      <path d="M42 170 C44 146 64 136 86 134 L114 134 C136 136 156 146 158 170 Z" fill="${W}"/>
      <ellipse cx="100" cy="96" rx="30" ry="38" fill="${W}"/>
      <path d="M61 96 C61 34 139 34 139 96" fill="none" stroke="${B}" stroke-width="22"/>
      <path d="M61 96 C61 34 139 34 139 96" fill="none" stroke="${W}" stroke-width="11"/>
      <rect x="49" y="74" width="25" height="48" rx="11" fill="${W}" stroke="${B}" stroke-width="6"/>
      <rect x="126" y="74" width="25" height="48" rx="11" fill="${W}" stroke="${B}" stroke-width="6"/>
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

  const EAR = `<path d="M40 90 C31 90 26 82 30 75 C34 68 41 64 41 54 C41 45 31 42 31 30 C31 16 43 8 55 8 C69 8 79 18 79 32 C79 46 67 50 63 60 C61 66 61 73 57 80 C53 86 47 90 40 90 Z"/>
               <path d="M49 32 C49 24 61 22 65 30 C68 37 61 42 57 46 C54 49 54 54 56 57"/>`;
  const earAt = (c, extra = "") => `<g transform="translate(-6 6) scale(.8)" ${line(c, 8.5)}>${EAR}</g>${extra}`;

  const icons = {
    ear: (c) => `<g ${line(c)}>${EAR}</g>`,
    tinnitus: (c, a) => earAt(c, `<g ${line(a || c)}><path d="M70 30 l5 -6 l5 6 l5 -6 l5 6"/><path d="M72 50 l5 -6 l5 6 l5 -6 l5 6"/><path d="M70 70 l5 -6 l5 6 l5 -6 l5 6"/></g>`),
    earTired: (c, a) => earAt(c, `<g ${line(a || c)}><path d="M84 26 V72"/><path d="M73 61 L84 72 L95 61"/></g>`),
    earPain: (c, a) => earAt(c, `<g ${line(a || c)}><path d="M74 30 L94 20"/><path d="M76 50 L98 50"/><path d="M74 70 L94 80"/></g>`),
    earLoss: (c, a) => earAt(c, `<g ${line(a || c, 9)}><path d="M68 36 L94 62"/><path d="M94 36 L68 62"/></g>`),
    earPlug: (c, a) => `<g ${line(c)}>${EAR}</g><rect x="50" y="40" width="14" height="22" rx="7" transform="rotate(-25 57 51)" fill="${a || c}"/>`,
    plugs: (c) => `<g fill="${c}"><path d="M14 84 V52 C14 37 22 30 30 30 C38 30 46 37 46 52 V84 Z"/><path d="M54 84 V52 C54 37 62 30 70 30 C78 30 86 37 86 52 V84 Z"/></g>`,
    cordPlugs: (c) => `<g fill="${c}"><path d="M14 66 V40 C14 26 22 20 30 20 C38 20 46 26 46 40 V66 Z"/><path d="M54 66 V40 C54 26 62 20 70 20 C78 20 86 26 86 40 V66 Z"/></g><path d="M30 66 C30 98 70 98 70 66" ${line(c, 5)}/>`,
    helmetMuffs: (c) => `<path d="M20 56 C20 28 34 16 50 16 C66 16 80 28 80 56 Z" fill="${c}"/><path d="M8 58 H92" ${line(c, 8)}/><g fill="${c}"><rect x="6" y="62" width="20" height="30" rx="8"/><rect x="74" y="62" width="20" height="30" rx="8"/></g>`,
    headband: (c) => `<path d="M25 58 C25 14 75 14 75 58" ${line(c, 9)}/><g fill="${c}"><rect x="12" y="50" width="24" height="38" rx="10"/><rect x="64" y="50" width="24" height="38" rx="10"/></g>`,
    clock: (c, a) => `<circle cx="50" cy="50" r="38" ${line(c)}/><path d="M50 50 V28 M50 50 L65 59" ${line(c)}/><circle class="ring" cx="50" cy="50" r="46" ${line(a || c, 6)} transform="rotate(-90 50 50)"/>`,
    renew: (c) => `<g ${line(c)}><path d="M80 42 A31 31 0 0 0 22 36"/><path d="M82 24 L80 42 L62 40"/><path d="M20 58 A31 31 0 0 0 78 64"/><path d="M18 76 L20 58 L38 60"/></g><g fill="${c}"><path d="M42 62 V48 C42 41 46 38 50 38 C54 38 58 41 58 48 V62 Z"/></g>`,
    pause: (c) => `<g fill="${c}"><rect x="30" y="24" width="14" height="52" rx="5"/><rect x="56" y="24" width="14" height="52" rx="5"/></g>`,
    stress: (c) => `<path d="M6 52 H28 L36 26 L50 78 L60 38 L67 52 H94" ${line(c, 8)}/>`,
    battery: (c, a) => `<rect x="12" y="30" width="66" height="40" rx="7" ${line(c)}/><rect x="80" y="42" width="8" height="16" rx="2" fill="${c}"/><rect x="21" y="39" width="14" height="22" rx="3" fill="${a || c}"/>`,
    sleep: (c) => `<path d="M56 16 A36 36 0 1 0 86 66 A28 28 0 1 1 56 16 Z" ${line(c)}/><path d="M66 18 H82 L66 36 H82" ${line(c, 6)}/>`,
    check: (c) => `<path d="M24 53 L42 71 L78 31" ${line(c, 11)}/>`,
    cross: (c) => `<path d="M28 28 L72 72 M72 28 L28 72" ${line(c, 11)}/>`,
  };
  const icon = (name, size, c = W, a) => wrap(icons[name](c, a), size);

  window.P = { mandatory, danger, icon, icons };
})();
