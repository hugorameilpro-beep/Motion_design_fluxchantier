#!/usr/bin/env bash
# Full pipeline: soundtrack -> frames -> MP4 (H.264 60 fps + AAC).
set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/audio.py
[[ "${SKIP_FRAMES:-0}" == "1" ]] || node scripts/render.mjs

mkdir -p out
ffmpeg -loglevel error -y \
  -framerate 60 -i build/frames/f_%05d.png \
  -i build/audio.wav \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 192k \
  -movflags +faststart -shortest \
  out/fluxchantier_motion.mp4

# poster + storyboard contact sheet
ffmpeg -loglevel error -y -i build/frames/f_00840.png -vf scale=1280:-1 out/poster.jpg
ffmpeg -loglevel error -y -framerate 60 -i build/frames/f_%05d.png \
  -vf "select='not(mod(n\,94))',scale=480:-1,tile=4x3:padding=8:margin=8:color=0x070D18" \
  -frames:v 1 out/storyboard.jpg

echo "-> out/fluxchantier_motion.mp4"
