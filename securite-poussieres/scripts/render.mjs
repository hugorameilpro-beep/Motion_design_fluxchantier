// `npm run render -- --format horizontal [--lang fr] [--stills 3,9.5 [--scenes]]`
// Deterministic render: seek the GSAP timeline frame by frame at 30 fps, screenshot each frame as PNG,
// then assemble with ffmpeg (H.264, no audio). This video only exists in 16:9 for now.
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { serve, ROOT } from "./serve.mjs";

const FPS = 30;
const SIZE = { horizontal: [1920, 1080] };
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const stills = opt("--stills") ? opt("--stills").split(",").map(Number) : null;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const lang = opt("--lang") || cfg.langue || "fr";
const suffix = lang === (cfg.langue || "fr") ? "" : "_" + lang;
const FORMATS = ["horizontal"];
const kinds = [...args.filter((a) => a === "horizontal"), ...(opt("--format") || "").split(",").filter(Boolean)];
const bad = kinds.filter((k) => !FORMATS.includes(k));
if (bad.length) { console.error(`Format inconnu : ${bad.join(", ")} (formats possibles : ${FORMATS.join(", ")})`); process.exit(1); }
const todo = kinds.length ? [...new Set(kinds)] : FORMATS;
const LABELS = { S0: "Ouverture (logo)", S1: "Accroche", S2: "Zones à risque", S3: "Ce qui lève la poussière", S4: "La silice",
  S5: "Conséquences", S6: "Réduire à la source", S7: "Le bon masque", S8: "Message final", S9: "Générique (logo)" };
/** time of each scene: from its start to the start of the next one (transition included) */
function printScenes(info) {
  const sc = info.scenes || [];
  console.log(`  ${"Scène".padEnd(28)} début    durée`);
  sc.forEach(([id, start], i) => {
    const end = i + 1 < sc.length ? sc[i + 1][1] : info.duration;
    console.log(`  ${(LABELS[id] || id).padEnd(28)} ${start.toFixed(2).padStart(5)} s  ${(end - start).toFixed(2).padStart(5)} s`);
  });
  console.log(`  ${"Total".padEnd(28)}          ${info.duration.toFixed(2).padStart(5)} s`);
}
const workers = Number(process.env.WORKERS || 4);

if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
  console.error("ffmpeg est introuvable. Installez-le : sudo apt install ffmpeg (Linux) · brew install ffmpeg (macOS) · winget install ffmpeg (Windows)");
  process.exit(1);
}
const server = await serve(0);
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--font-render-hinting=none"] });
} catch (e) {
  console.error("Chromium pour Playwright est introuvable. Installez-le : npx playwright install chromium");
  throw e;
}

async function openPage(format, scale = 1, vp) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: scale });
  page.on("pageerror", (e) => console.error("  erreur page :", e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html?format=${format}&lang=${lang}&render=1`);
  const info = await page.evaluate(() => window.__ready);
  return { page, info };
}
const printReport = (info) => {
  if (!info.report.length) return console.log("  textes : OK (taille, 6 mots par ligne, largeur)");
  for (const r of info.report) console.warn(`  ⚠ ${r.kind} — ${r.msg} — « ${r.text} »`);
};
const shoot = async (page, t, file) => {
  await page.evaluate((tt) => { window.tl.seek(tt, false); }, t);   // braces: never ship the Timeline object back
  await page.screenshot({ path: file, type: "png" });
};
const ff = (a) => {
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...a], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg a échoué : " + a.join(" "));
};
fs.mkdirSync(path.join(ROOT, "output"), { recursive: true });

for (const format of todo) {
  const [w, h] = SIZE[format];
  const vp = { width: w, height: h };
  if (stills) {
    const dir = path.join(ROOT, "frames", "stills");
    fs.mkdirSync(dir, { recursive: true });
    const { page, info } = await openPage(format, 1, vp);
    printReport(info);
    for (const t of stills) await shoot(page, t, path.join(dir, `${format}_${t.toFixed(2)}.png`));
    await page.close();
    console.log(`${format} : ${stills.length} image(s) dans frames/stills/ (durée ${info.duration.toFixed(2)} s)`);
    if (args.includes("--scenes")) printScenes(info);
    continue;
  }
  const dir = path.join(ROOT, "frames", format);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const probe = await openPage(format, 1, vp);
  printReport(probe.info);
  const total = Math.ceil(probe.info.duration * FPS);
  await probe.page.close();
  console.log(`${format} : ${probe.info.duration.toFixed(2)} s → ${total} images`);
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const { page } = await openPage(format, 1, vp);
    while (next < total) {
      const i = next++;
      await shoot(page, i / FPS, path.join(dir, `f_${String(i).padStart(5, "0")}.png`));
      if (++done % 150 === 0) console.log(`  ${done}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    await page.close();
  }));
  const out = path.join(ROOT, "output", `securite_poussieres_${format}${suffix}.mp4`);
  ff(["-framerate", String(FPS), "-i", path.join(dir, "f_%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "19",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", out]);
  console.log(`  → output/${path.basename(out)} (${(fs.statSync(out).size / 1e6).toFixed(2)} Mo)`);
  printScenes(probe.info);
}
await browser.close();
server.close();
