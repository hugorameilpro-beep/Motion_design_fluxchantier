#!/usr/bin/env bash
# Tile up to 6 stills (build/stills) into build/stills/sheet.png for quick review.
set -e
cd "$(dirname "$0")/../build/stills"
ls t_*.png | sort -t_ -k2 -g | head -6 > l.txt
inputs=""; n=0; for img in $(cat l.txt); do inputs="$inputs -i $img"; n=$((n+1)); done
while [ $n -lt 6 ]; do inputs="$inputs -f lavfi -i color=black:s=1920x1080:d=1"; n=$((n+1)); done
ffmpeg -loglevel error -y $inputs -filter_complex "[0]scale=960:540[a];[1]scale=960:540[b];[2]scale=960:540[c];[3]scale=960:540[d];[4]scale=960:540[e];[5]scale=960:540[f];[a][b][c][d][e][f]xstack=inputs=6:layout=0_0|960_0|0_540|960_540|0_1080|960_1080" -frames:v 1 sheet.png
