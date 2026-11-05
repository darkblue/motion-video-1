"""Risk checks against actual master data, evaluated meshes and director timing."""

import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(__file__).resolve().parents[1]
exec(
    compile(
        (ROOT / "scripts/shot_state.py").read_text(),
        str(ROOT / "scripts/shot_state.py"),
        "exec",
    )
)
calibrate()
results = []


def check(ok, label, details=None):
    results.append({"check": label, "passed": bool(ok), "details": details})
    if not ok:
        raise ValueError(label + " " + str(details))


def world_vertices(o, evaluated=False):
    if evaluated:
        ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
        me = ev.to_mesh()
        vs = [ev.matrix_world @ v.co for v in me.vertices]
        ev.to_mesh_clear()
        return vs
    return [o.matrix_world @ v.co for v in o.data.vertices]


def bb(vs):
    return [[min(p[i] for p in vs), max(p[i] for p in vs)] for i in range(3)]


def volume_intersection(a, b):
    return math.prod(
        max(0, min(a[i][1], b[i][1]) - max(a[i][0], b[i][0])) for i in range(3)
    )


def clash():
    duct = bb(world_vertices(bpy.data.objects["DEMO_DUCT_FIXED"], True))
    tray = world_vertices(bpy.data.objects["DEMO_TRAY_ROUTING"], True)
    return sum(
        volume_intersection(duct, bb(tray[i : i + 8])) for i in range(0, len(tray), 8)
    )


state("planning", 269)
primary = {o["source_id"]: o for o in bpy.data.objects if o.get("primary_footprint")}
check(
    set(primary) == {d["id"] for d in P["objects"]},
    "Same 14 source facilities exist in master",
)
for src in P["objects"]:
    g = src["geometry"]
    o = primary[src["id"]]
    vs = world_vertices(o)
    xs = [v.x for v in vs]
    ys = [-v.y for v in vs]
    if g["type"] == "rect":
        check(
            max(
                abs(a - b)
                for a, b in zip(
                    [min(xs), min(ys), max(xs), max(ys)],
                    [g["x"], g["y"], g["x"] + g["width"], g["y"] + g["height"]],
                )
            )
            < 0.001,
            src["id"] + " XY equals engineering JSON",
        )
    elif g["type"] == "circle":
        check(
            abs(o.location.x - g["cx"]) < 0.001
            and abs(-o.location.y - g["cy"]) < 0.001,
            src["id"] + " center equals engineering JSON",
        )
    else:
        check(
            json.loads(o["centerline_source_json"]) == g["points"],
            src["id"] + " centerline equals engineering JSON",
        )
reference = {o.name: o.matrix_world.copy() for o in primary.values()}
subject_baseline = {
    o.name: o.matrix_world.copy() for o in bpy.data.objects if o.get("bim_layer")
}
clip_reports = {}
for clip in CLIPS:
    max_error = 0
    max_overlap = 0
    quats = []
    first_derivative = []
    last_pos = None
    violations = []
    for f in range(CLIPS[clip]["frames"]):
        info = state(clip, f)
        bounds = projected_bounds()
        if (
            bounds[0] < 0.059
            or bounds[1] < 0.199
            or bounds[2] > 0.761
            or bounds[3] > 0.85
        ):
            violations.append({"frame": f, "bounds": bounds})
        for name, m in reference.items():
            max_error = max(
                max_error,
                max(
                    abs(a - b)
                    for rowA, rowB in zip(bpy.data.objects[name].matrix_world, m)
                    for a, b in zip(rowA, rowB)
                ),
            )
        q = CAM.rotation_euler.to_quaternion()
        quats.append(q.copy())
        if clip == "bim" and f >= 300:
            v = clash()
            max_overlap = max(max_overlap, v)
            if f == 300:
                initial_clash = v
            if f == 539:
                resolved_clash = v
    # Do not score the intentional projection edit as a continuous physical camera segment.
    speeds = []
    for i in range(1, len(quats)):
        if clip == "bim" and i == 300:
            continue
        dot = min(1, max(-1, abs(quats[i - 1].dot(quats[i]))))
        speeds.append(math.degrees(2 * math.acos(dot)))
    check(
        max_error < 0.001, clip + " primary airport transforms are invariant", max_error
    )
    check(
        not violations,
        clip + " subject avoids title, sidebar and subtitle protected areas",
        violations[:3],
    )
    check(
        max(speeds or [0]) < 2,
        clip + " camera angular step under 2 degrees/frame within each shot",
        max(speeds or [0]),
    )
    clip_reports[clip] = {
        "primary_transform_error": max_error,
        "maximum_camera_angular_step_deg": max(speeds or [0]),
        "safe_area_violations": len(violations),
    }
check(
    initial_clash > 0, "Uncoordinated actual tray intersects fixed duct", initial_clash
)
check(
    resolved_clash < 1e-6,
    "Approved actual tray route clears fixed duct",
    resolved_clash,
)
state("reset", 149)
restore = max(
    max(
        abs(a - b)
        for ra, rb in zip(bpy.data.objects[name].matrix_world, m)
        for a, b in zip(ra, rb)
    )
    for name, m in subject_baseline.items()
)
check(
    restore < 0.001,
    "All BIM visualization root transforms restore to baseline",
    restore,
)
tray = bpy.data.objects["DEMO_TRAY_ROUTING"]
basis = tray.data.shape_keys.key_blocks["Uncoordinated"]
approved = tray.data.shape_keys.key_blocks["ApprovedRouting"]
ends = list(range(4)) + list(range(len(basis.data) - 4, len(basis.data)))
check(
    all((basis.data[i].co - approved.data[i].co).length < 1e-6 for i in ends),
    "Tray path endpoints unchanged by local coordination",
)
check(
    tray.data.shape_keys.key_blocks["ApprovedRouting"].value == 1,
    "Reassembly retains approved route instead of restoring the collision",
)
contracts = json.loads((ROOT / "input/contracts.json").read_text())
edges = {(e["from"], e["to"], e["type"]) for e in contracts["edges"]}
check(
    ("engineer", "contractor", "contract") not in edges
    and ("contractor", "engineer", "contract") not in edges,
    "Engineering baseline excludes engineer-contractor contract",
)
check(
    all(
        ("owner", r, "contract") in edges
        for r in ["designer", "engineer", "contractor"]
    ),
    "Three employer contracts grounded in JSON",
)
check(
    ("contractor", "engineer", "submission") in edges
    and ("engineer", "contractor", "review_response") in edges,
    "Submission and response are non-contract relations",
)
check(
    not any(o.get("source_kind") == "aircraft" for o in bpy.data.objects),
    "No unreviewed aircraft path or aircraft model",
)
report = {
    "status": "PASS",
    "checks": results,
    "clips": clip_reports,
    "clash_before_m3": initial_clash,
    "clash_after_m3": resolved_clash,
    "max_bim_transform_restore_error": restore,
    "placeholder_only": True,
    "not_real_construction_drawings": True,
    "formal_runtime_rendered": False,
    "human_review_required": [
        "engineering clarity",
        "camera composition",
        "controlled BIM representation",
        "acceptance of documented framing corrections",
    ],
    "edit_boundary_note": "BIM perspective switch at 112s uses a 0.6s visual crossfade; per-shot camera paths are tested separately. Reassembly is separately demonstrated over 120–125s.",
}
(ROOT / "reports/risk-audit.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2)
)
print("RISK_AUDIT_PASS", len(results), "checks", clip_reports)
