// `npm run render [android|ios] [--stills 3,9.5] [--no-gif]`
// Deterministic render: seek the GSAP timeline frame by frame at 30 fps, screenshot each frame,
// then assemble with ffmpeg (H.264 MP4, light GIF, PNG thumbnail). No screen recording.
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { serve, ROOT } from "./serve.mjs";

const FPS = 30;
const OUT = {
  android: { name: "tuto_android_chrome", thumb: 0.62 },   // thumbnail position (fraction of the video)
  ios: { name: "tuto_iphone_safari", thumb: 0.5 },
};
const args = process.argv.slice(2);
const stills = args.includes("--stills") ? args[args.indexOf("--stills") + 1].split(",").map(Number) : null;
const kinds = args.filter((a) => OUT[a]);
const todo = kinds.length ? kinds : ["android", "ios"];
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

async function openPage(kind) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/src/index.html?tuto=${kind}&render=1`);
  const info = await page.evaluate(() => window.__ready);
  return { page, info };
}
const shoot = async (page, t, file) => {
  await page.evaluate((tt) => { window.tl.seek(tt, false); }, t);   // braces: never ship the Timeline object back
  await page.screenshot({ path: file, type: "png" });
};
const ff = (a) => {
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...a], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg a échoué : " + a.join(" "));
};

for (const kind of todo) {
  const { name, thumb } = OUT[kind];
  if (stills) {
    const dir = path.join(ROOT, "frames", "stills");
    fs.mkdirSync(dir, { recursive: true });
    const { page } = await openPage(kind);
    for (const t of stills) await shoot(page, t, path.join(dir, `${kind}_${t.toFixed(2)}.png`));
    await page.close();
    console.log(`${kind} : ${stills.length} image(s) dans frames/stills/`);
    continue;
  }
  const dir = path.join(ROOT, "frames", kind);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const probe = await openPage(kind);
  const total = Math.ceil(probe.info.duration * FPS);
  await probe.page.close();
  console.log(`${kind} : ${probe.info.duration.toFixed(2)} s → ${total} images`);
  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const { page } = await openPage(kind);
    while (next < total) {
      const i = next++;
      await shoot(page, i / FPS, path.join(dir, `f_${String(i).padStart(5, "0")}.png`));
      if (++done % 90 === 0) console.log(`  ${done}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    await page.close();
  }));

  fs.mkdirSync(path.join(ROOT, "output"), { recursive: true });
  const o = (ext) => path.join(ROOT, "output", `${name}.${ext}`);
  ff(["-framerate", String(FPS), "-i", path.join(dir, "f_%05d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", o("mp4")]);
  const ti = Math.round(total * thumb);
  ff(["-i", path.join(dir, `f_${String(ti).padStart(5, "0")}.png`), "-vf", "scale=540:-1", o("png")]);
  if (!args.includes("--no-gif")) {
    ff(["-i", o("mp4"), "-vf", "fps=12,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
      "-loop", "0", o("gif")]);
  }
  for (const ext of ["mp4", "png", "gif"]) if (fs.existsSync(o(ext))) console.log(`  → output/${name}.${ext} (${(fs.statSync(o(ext)).size / 1e6).toFixed(2)} Mo)`);
}
await browser.close();
server.close();
