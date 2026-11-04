// Shared quality checks for the motion-design videos, used by securite-bruit and securite-poussieres.
//   injecter(page)                    adds lisibilite.js to a loaded page (window.__readability, window.__anomaliesDOM)
//   lisibilite(page, o)               reading-rules table; returns { bad, rows }
//   imagesLecture(page, rows, dir, shoot)   one frame in the middle of the reading time of each text
//   planches(srcDir, outDir)          contact sheets (4 × 4 tiles) of a folder of PNG
//   anomaliesVideo(mp4, info)         pixel checks on the rendered MP4 (near-empty screens, hard cuts,
//                                     red/blue mixed into purple, scene ends that move during the 0.5 s pause)
//   controle(page, o)                 DOM + video checks, printed as one report; returns the number of anomalies
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s).padEnd(n);

export async function injecter(page) {
  if (!(await page.evaluate(() => typeof window.__readability === "function"))) await page.addScriptTag({ path: path.join(HERE, "lisibilite.js") });
}

/** reading-rules table: words, time fully visible and still, minimum required */
export async function lisibilite(page, o = {}) {
  await injecter(page);
  const labels = o.labels || {};
  const r = await page.evaluate(() => window.__readability(1 / 30));
  console.log("\n  Lisibilité (règle : max(2,5 s ; 0,5 s/mot + 1 s), étiquette d'icône 2 s)");
  console.log(`  ${"Scène".padEnd(13)}${"Texte".padEnd(46)}${"Mots".padStart(5)}${"Affiché".padStart(9)}${"Requis".padStart(8)}   État`);
  let bad = 0;
  for (const x of r.rows) {
    const issues = [];
    if (!x.ok) issues.push("TROP COURT");
    if (x.overlap) issues.push(`apparaît pendant « ${x.overlap.slice(0, 28)}… »`);
    bad += issues.length ? 1 : 0;
    console.log(`  ${cut(labels[x.scene] || x.scene, 13)}${cut(x.text, 46)}${String(x.words).padStart(5)}${(x.shown.toFixed(2) + " s").padStart(9)}${(x.need.toFixed(1) + " s").padStart(8)}   ${issues.length ? "⚠ " + issues.join(" ; ") : "OK" + (x.label ? " (étiquette)" : "")}`);
  }
  if (r.maxBlocks.n > 3) { bad++; console.log(`  ⚠ ${r.maxBlocks.n} blocs de texte visibles en même temps à ${r.maxBlocks.t.toFixed(2)} s (maximum 3) : ${r.maxBlocks.texts.map((s) => "« " + s.slice(0, 20) + " »").join(", ")}`); }
  else console.log(`  Au plus ${r.maxBlocks.n} blocs de texte visibles en même temps (maximum 3, étiquettes d'icônes non comptées).`);
  console.log(bad ? `  ⚠ ${bad} problème(s) de lisibilité.` : "  Lisibilité : OK.");
  return { bad, rows: r.rows };
}

/** one frame in the middle of the reading time of each text (frames/lecture/) */
export async function imagesLecture(page, rows, dir, shoot) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const [i, x] of rows.entries()) if (x.mid != null) await shoot(page, x.mid, path.join(dir, `${String(i).padStart(2, "0")}_${x.mid.toFixed(2)}.png`));
  console.log(`  ${rows.length} images de lecture dans ${path.relative(process.cwd(), dir) || dir}/`);
}

/** contact sheets: the PNG of a folder, sorted by name, 16 per sheet (4 × 4 tiles of 480 px) */
export function planches(srcDir, outDir, label = "planche") {
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png")).sort();
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  const out = [];
  for (let k = 0; k * 16 < files.length; k++) {
    const part = files.slice(k * 16, k * 16 + 16), n = part.length;
    const inputs = part.flatMap((f) => ["-i", path.join(srcDir, f)]);
    const scale = part.map((_, j) => `[${j}]scale=480:-1[v${j}]`).join(";");
    const layout = part.map((_, j) => `${(j % 4) * 480}_${Math.floor(j / 4) * 270}`).join("|");
    const file = path.join(outDir, `${label}_${String(k + 1).padStart(2, "0")}.png`);
    const fc = n === 1 ? `[0]scale=480:-1` : `${scale};${part.map((_, j) => `[v${j}]`).join("")}xstack=inputs=${n}:layout=${layout}:fill=gray`;
    const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", fc, "-frames:v", "1", file]);
    if (r.status === 0) out.push(file);
  }
  console.log(`  ${out.length} planche(s) de contact dans ${path.relative(process.cwd(), outDir) || outDir}/`);
  return out;
}

/**
 * Pixel checks on the rendered MP4 (decoded by ffmpeg at 96×54, 30 fps). Transitions are left out:
 * from the end of a scene to 0.45 s after the start of the next one.
 */
export function anomaliesVideo(mp4, info, o = {}) {
  const Wd = 96, Hd = 54, N = Wd * Hd, FPS = 30;
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-i", mp4, "-vf", `scale=${Wd}:${Hd}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error("ffmpeg n'a pas pu lire " + mp4);
  const buf = r.stdout, frames = Math.floor(buf.length / (N * 3));
  const sc = info.scenes || [];
  const inTransition = (t) => sc.some(([, start], i) => i > 0 && t >= sc[i - 1][2] - 1e-6 && t < start + 0.45);
  const sceneAt = (t) => { let s = sc[0]; for (const x of sc) if (t >= x[1]) s = x; return s ? s[0] : ""; };
  const px = (f, i) => { const o3 = (f * N + i) * 3; return [buf[o3], buf[o3 + 1], buf[o3 + 2]]; };
  const isPurple = (R, G, B) => R > 90 && B > 70 && G < 60 && Math.abs(R - B) < 110;
  const out = [];
  const runs = (flags, minLen, kind, msg) => {      // consecutive flagged frames → one anomaly
    let a = -1;
    for (let f = 0; f <= frames; f++) {
      if (f < frames && flags[f]) { if (a < 0) a = f; continue; }
      if (a >= 0 && f - a >= minLen) out.push({ kind, scene: sceneAt(a / FPS), from: +(a / FPS).toFixed(2), to: +(f / FPS).toFixed(2), extra: msg(a, f) });
      a = -1;
    }
  };
  const ink = new Float32Array(frames), purple = new Float32Array(frames), diff = new Float32Array(frames), move = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    // dominant colour (coarse histogram), then the share of pixels clearly different from it
    const hist = new Map();
    for (let i = 0; i < N; i += 3) { const [R, G, B] = px(f, i); const k = (R >> 5) * 64 + (G >> 5) * 8 + (B >> 5); hist.set(k, (hist.get(k) || 0) + 1); }
    let best = 0, bk = 0; for (const [k, v] of hist) if (v > best) { best = v; bk = k; }
    const dr = ((bk >> 6) << 5) + 16, dg = (((bk >> 3) & 7) << 5) + 16, db = ((bk & 7) << 5) + 16;
    let inkN = 0, purN = 0, chg = 0, mov = 0;
    for (let i = 0; i < N; i++) {
      const [R, G, B] = px(f, i);
      if (Math.abs(R - dr) + Math.abs(G - dg) + Math.abs(B - db) > 90) inkN++;
      if (isPurple(R, G, B)) {                                                  // red mixed with blue, over an area (not a 1-px edge)
        const x = i % Wd, y = (i / Wd) | 0;
        let nb = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < Wd && yy < Hd && isPurple(...px(f, yy * Wd + xx))) nb++; }
        if (nb >= 3) purN++;
      }
      if (f) { const [r0, g0, b0] = px(f - 1, i), d = Math.abs(R - r0) + Math.abs(G - g0) + Math.abs(B - b0); if (d > (o.fort ?? 200)) chg++; if (d > 24) mov++; }   // full-strength change / any visible move
    }
    ink[f] = inkN / N; purple[f] = purN / N; diff[f] = chg / N; move[f] = mov / N;
  }
  const tt = (f) => f / FPS;
  runs([...ink].map((v, f) => v < (o.vide ?? 0.012) && !inTransition(tt(f))), Math.round(0.6 * FPS), "écran presque vide",
    (a, b) => `${Math.round(Math.min(...ink.slice(a, b)) * 1000) / 10} % de pixels utiles`);
  runs([...diff].map((v, f) => v > (o.coupure ?? 0.4) && !inTransition(tt(f))), 1, "coupure sèche", (a) => `${Math.round(diff[a] * 100)} % de l'image change en une image`);
  runs([...purple].map((v) => v > (o.violet ?? 0.004)), 1, "mélange violet", (a, b) => `jusqu'à ${(Math.max(...purple.slice(a, b)) * 100).toFixed(1)} % de pixels violets`);
  // the last 0.5 s of each scene must be still
  sc.forEach(([id, , end]) => {
    const f0 = Math.round((end - 0.5) * FPS) + 1, f1 = Math.min(frames - 1, Math.round(end * FPS) - 1);
    let mx = 0, at = f0; for (let f = f0 + 1; f <= f1; f++) if (move[f] > mx) { mx = move[f]; at = f; }
    if (mx > (o.pause ?? 0.004)) out.push({ kind: "pause non fixe", scene: id, from: +(at / FPS).toFixed(2), to: +end.toFixed(2), extra: `${(mx * 100).toFixed(1)} % de l'image bouge` });
  });
  const exc = o.attendu || [];   // [{ kind, scene, why }] declared by the project: reported as expected, not counted
  out.forEach((a) => { const e = exc.find((x) => x.kind === a.kind && x.scene === a.scene); if (e) a.attendu = e.why; });
  return out;
}

/** DOM + video checks in one report (and frames/controle/rapport.json); returns the number of anomalies */
export async function controle(page, o) {
  await injecter(page);
  const dom = await page.evaluate(() => window.__anomaliesDOM(0.1));
  const vid = o.mp4 && fs.existsSync(o.mp4) ? anomaliesVideo(o.mp4, o.info, { ...(o.seuils || {}), attendu: o.attendu }) : null;
  const every = [...dom, ...(vid || [])].sort((a, b) => a.from - b.from);
  const all = every.filter((a) => !a.attendu), expected = every.filter((a) => a.attendu);
  const labels = o.labels || {};
  console.log("\n  Contrôle d'anomalies" + (vid ? "" : " (vidéo absente : contrôles de la page seulement)"));
  console.log("  Vérifié : textes recouverts, lignes tronquées, textes hors cadre" + (vid ? ", écrans presque vides, coupures sèches, mélanges violets, fins de scène qui bougent." : "."));
  if (!all.length) console.log("  Aucune anomalie.");
  for (const a of all) console.log(`  ⚠ ${cut(a.kind, 20)} ${cut(labels[a.scene] || a.scene || "", 13)} ${a.from.toFixed(2)}–${a.to.toFixed(2)} s  ${a.text ? "« " + a.text.slice(0, 40) + " » " : ""}${a.extra || ""}`);
  for (const a of expected) console.log(`  · attendu : ${a.kind}, ${labels[a.scene] || a.scene} ${a.from.toFixed(2)}–${a.to.toFixed(2)} s (${a.attendu})`);
  if (o.outDir) { fs.mkdirSync(o.outDir, { recursive: true }); fs.writeFileSync(path.join(o.outDir, "rapport.json"), JSON.stringify({ mp4: o.mp4 || null, anomalies: all, attendues: expected }, null, 2)); }
  return all.length;
}
