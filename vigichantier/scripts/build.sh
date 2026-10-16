#!/usr/bin/env bash
# Full pipeline: soundtrack -> frames -> MP4 (H.264 60 fps + AAC).
set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/audio.py
# render frames unless asked to skip, or unless every frame is already there
expected=$(node -e 'const s=require("fs").readFileSync("src/timeline.js","utf8");const t=JSON.parse(s.slice(s.indexOf("{"),s.lastIndexOf("}")+1));console.log(Math.round(t.duration*t.fps))')
have=$(ls build/frames 2>/dev/null | wc -l)
if [[ "${SKIP_FRAMES:-0}" != "1" && "$have" -lt "$expected" ]]; then node scripts/render.mjs; fi

mkdir -p out
ffmpeg -loglevel error -y \
  -framerate 60 -i build/frames/f_%05d.png \
  -i build/audio.wav \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 192k \
  -movflags +faststart -shortest \
  out/vigichantier_motion.mp4

# poster + storyboard contact sheet
ffmpeg -loglevel error -y -i build/frames/f_00700.png -vf scale=1280:-1 out/poster.jpg
ffmpeg -loglevel error -y -framerate 60 -i build/frames/f_%05d.png \
  -vf "select='not(mod(n\,94))',scale=480:-1,tile=4x3:padding=8:margin=8:color=0x070D18" \
  -frames:v 1 out/storyboard.jpg

echo "-> out/vigichantier_motion.mp4"
