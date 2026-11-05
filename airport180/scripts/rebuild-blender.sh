#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../blender"
airport_blender_bin=${BLENDER_PATH:-blender}
mkdir -p reports renders/final remotion/public blender runtime
export BLENDER_USER_CONFIG="$PWD/runtime"
"$airport_blender_bin" -b --python-exit-code 1 -t 3 --python scripts/build_master.py > reports/build.log 2>&1
for airport_clip in planning bim reset; do
 "$airport_blender_bin" -b blender/director-master.blend --python-exit-code 1 -t 3 --python scripts/render_test_shots.py -- --clip "$airport_clip" > "reports/$airport_clip.log" 2>&1
 python3 scripts/encode_bases.py "$airport_clip"
 cp "remotion/public/$airport_clip-base.mp4" "../public/blender/$airport_clip.mp4"
done
