// Renders src/index.html frame by frame with headless Chromium.
//   node scripts/render.mjs                 -> build/frames/*.png (all frames)
//   node scripts/render.mjs --stills 1,4.5  -> build/stills/t_<time>.png
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const page_url = pathToFileURL(path.join(root, "src/index.html")).href + "?render";
const tlSrc = fs.readFileSync(path.join(root, "src/timeline.js"), "utf8");
const TL = JSON.parse(tlSrc.slice(tlSrc.indexOf("{"), tlSrc.lastIndexOf("}") + 1));

const args = process.argv.slice(2);
const stillsArg = args.includes("--stills") ? args[args.indexOf("--stills") + 1] : null;
const workers = Number(process.env.WORKERS || 6);

const browser = await chromium.launch({
  args: ["--force-color-profile=srgb", "--disable-lcd-text", "--font-render-hinting=none"],
});

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(page_url);
  await page.evaluate(() => window.__ready);
  return page;
}

async function shoot(page, t, file) {
  await page.evaluate((tt) => window.seek(tt), t);
  await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

if (stillsArg) {
  const dir = path.join(root, "build/stills");
  fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  for (const t of stillsArg.split(",").map(Number)) {
    await shoot(page, t, path.join(dir, `t_${t.toFixed(3)}.png`));
  }
} else {
  const dir = path.join(root, "build/frames");
  // FROM / TO (seconds) re-render only part of the timeline, keeping the other frames
  const partial = process.env.FROM || process.env.TO;
  if (!partial) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const total = Math.round(Number(process.env.TO ?? TL.duration) * TL.fps);
  let next = Math.round(Number(process.env.FROM ?? 0) * TL.fps), done = 0;
  const started = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage();
    while (next < total) {
      const i = next++;
      await shoot(page, i / TL.fps, path.join(dir, `f_${String(i).padStart(5, "0")}.png`));
      if (++done % 60 === 0) process.stdout.write(`  ${done}/${total} frames (${((Date.now() - started) / 1000).toFixed(0)} s)\n`);
    }
  }));
  console.log(`rendered ${done} frames at ${TL.fps} fps`);
}
await browser.close();
