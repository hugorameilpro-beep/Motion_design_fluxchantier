// `npm run render [vertical|horizontal|affiche] [--lang fr] [--stills 3,9.5]`
// Deterministic render: seek the GSAP timeline frame by frame at 30 fps, screenshot each frame as PNG,
// then assemble with ffmpeg (H.264, no audio). The A3 poster is a high-resolution screenshot of its own layout.
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { serve, ROOT } from "./serve.mjs";

const FPS = 30;
const A3 = { w: 3508, h: 4961, css: 1240 };            // 297 × 420 mm at 300 dpi
const SIZE = { vertical: [1080, 1920], horizontal: [1920, 1080] };
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const stills = opt("--stills") ? opt("--stills").split(",").map(Number) : null;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));
const lang = opt("--lang") || cfg.langue || "fr";
const suffix = lang === (cfg.langue || "fr") ? "" : "_" + lang;
const kinds = args.filter((a) => a === "vertical" || a === "horizontal" || a === "affiche");
const todo = kinds.length ? kinds : ["vertical", "horizontal", "affiche"];
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
  if (format === "affiche") {
    const s = A3.w / A3.css, cssH = Math.round(A3.h / s);
    const { page, info } = await openPage("affiche", s, { width: A3.css, height: cssH });
    printReport(info);
    const tmp = path.join(ROOT, "frames", "affiche.png");
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    await page.screenshot({ path: tmp, type: "png" });
    await page.close();
    const out = path.join(ROOT, "output", `securite_bruit_affiche_A3${suffix}.png`);
    ff(["-i", tmp, "-vf", `scale=${A3.w}:${A3.h}:flags=lanczos`, out]);
    console.log(`affiche → output/${path.basename(out)} (${A3.w}×${A3.h}, ${(fs.statSync(out).size / 1e6).toFixed(2)} Mo)`);
    continue;
  }
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
  const out = path.join(ROOT, "output", `securite_bruit_${format}${suffix}.mp4`);
  ff(["-framerate", String(FPS), "-i", path.join(dir, "f_%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "19",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", out]);
  console.log(`  → output/${path.basename(out)} (${(fs.statSync(out).size / 1e6).toFixed(2)} Mo)`);
}
await browser.close();
server.close();
