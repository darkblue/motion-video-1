import sys, subprocess, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
clips = {"planning": 270, "bim": 540, "reset": 150}
clip = sys.argv[1]
n = clips[clip]
folder = ROOT / f"renders/frames-{clip}"
assert all((folder / f"{f:04}.png").exists() for f in range(n))
out = ROOT / f"remotion/public/{clip}-base.mp4"
subprocess.run(
    [
        "ffmpeg",
        "-v",
        "error",
        "-framerate",
        "30",
        "-start_number",
        "0",
        "-i",
        str(folder / "%04d.png"),
        "-frames:v",
        str(n),
        "-an",
        "-c:v",
        "libx264",
        "-threads",
        "3",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-vf",
        "scale=in_range=auto:out_range=limited:out_color_matrix=bt709,format=yuv420p",
        "-color_range",
        "tv",
        "-colorspace",
        "bt709",
        "-color_trc",
        "bt709",
        "-color_primaries",
        "bt709",
        "-movflags",
        "+faststart",
        "-y",
        str(out),
    ],
    check=True,
)
print("BASE_ENCODED", clip, out.stat().st_size)
