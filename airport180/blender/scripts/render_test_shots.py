import bpy, json, time, sys, argparse, hashlib, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
exec(
    compile(
        (ROOT / "scripts/shot_state.py").read_text(),
        str(ROOT / "scripts/shot_state.py"),
        "exec",
    )
)
p = argparse.ArgumentParser()
p.add_argument("--clip", choices=list(CLIPS), default="planning")
p.add_argument("--keys", action="store_true")
a = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])
calibrate()
clip = a.clip
count = CLIPS[clip]["frames"]
folder = ROOT / "renders" / ("preview-" + clip if a.keys else "frames-" + clip)
folder.mkdir(parents=True, exist_ok=True)
start = time.monotonic()
rows = []
frames = (
    sorted(
        set(
            [0, (count - 1) // 2, count - 1]
            + ([149, 299, 300, 419] if clip == "bim" else [])
        )
    )
    if a.keys
    else range(count)
)
base = {
    o.name: tuple(o.matrix_world.translation)
    for o in bpy.data.objects
    if o.get("primary_footprint")
}
camera_positions = []
quats = []
max_footprint_error = 0
for f in frames:
    info = state(clip, f)
    CAM.rotation_euler.make_compatible(CAM.rotation_euler.copy())
    bb = projected_bounds()
    info["bounds_normalized_bottom_up"] = bb
    for name, pos in base.items():
        error = (bpy.data.objects[name].matrix_world.translation - Vector(pos)).length
        max_footprint_error = max(max_footprint_error, error)
    assert max_footprint_error < 0.001, "Airport facility drift detected"
    camera_positions.append(tuple(CAM.location))
    quats.append(tuple(CAM.rotation_euler.to_quaternion()))
    rows.append(info)
    s.render.filepath = str(folder / f"{f:04}.png")
    bpy.ops.render.render(write_still=True)
    if f % 30 == 0:
        print(
            "SHOT_FRAME",
            clip,
            f,
            "/",
            count,
            "elapsed",
            round(time.monotonic() - start, 1),
            flush=True,
        )
    if not a.keys and f % 60 == 0:
        (ROOT / f"reports/progress-{clip}.json").write_text(
            json.dumps(
                {"frames": f + 1, "total": count, "seconds": time.monotonic() - start}
            )
        )
report = {
    "clip": clip,
    "frames": len(rows),
    "expected_frames": count,
    "max_airport_primary_translation_error_m": max_footprint_error,
    "seconds": time.monotonic() - start,
    "camera_fit_factors": FACTORS,
    "frame_states": rows,
    "camera_positions": camera_positions,
    "camera_quaternions": quats,
    "source_sha256": hashlib.sha256(
        (ROOT / "input/airport-project.json").read_bytes()
    ).hexdigest(),
    "master_sha256": hashlib.sha256(
        (ROOT / "blender/director-master.blend").read_bytes()
    ).hexdigest(),
}
report_path = ROOT / "reports" / f'{clip}-{"keys" if a.keys else "render"}.json'
report_path.write_text(json.dumps(report, indent=2))
print("SHOT_COMPLETE", clip, len(rows), report["seconds"], flush=True)
